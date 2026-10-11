// converter.js - 主进程转换后端：sharp / ffmpeg / pdf-lib / mammoth / marked / xlsx / printToPDF / LibreOffice / pdfjs-dist
'use strict';
// 必须在 require('pdf-parse') 之前注入：pdf.js 顶层会实例化 DOMMatrix，
// Electron 主进程(Node 环境)无此全局对象，缺失会导致启动即崩。
require('../polyfill-dommatrix');
const path = require('path');
const fs = require('fs');
const os = require('os');
const { spawn } = require('child_process');
const { pathToFileURL } = require('url');
const { PDFDocument } = require('pdf-lib');
const mammoth = require('mammoth');
const xlsx = require('xlsx');
const { PDFParse } = require('pdf-parse');
const { Document, Packer, Paragraph, TextRun } = require('docx');
const Formats = require('./formats');

// sharp 依赖平台原生二进制（@img/sharp-<platform>）。交叉打包时 win 平台
// 二进制可能缺失，若在顶层同步 require，Windows 首次启动即崩（MODULE_NOT_FOUND）。
// 因此惰性加载：仅真正做图片转换时 require，缺失时返回可读错误，不影响启动。
let _sharp = null;
async function getSharp() {
  if (!_sharp) {
    try {
      _sharp = require('sharp');
    } catch (e) {
      const err = new Error('sharp 原生模块不可用（当前平台二进制缺失，图片相关转换不可用）: ' + String((e && e.message) || e));
      err.cause = e;
      throw err;
    }
  }
  return _sharp;
}

// marked 18+ 是纯 ESM 包，CJS 下必须动态 import
let _marked = null;
async function getMarked() {
  if (!_marked) _marked = await import('marked');
  return _marked;
}

// pdfjs-dist 5.x 为纯 ESM，CJS 下动态 import；@napi-rs/canvas 是原生模块，
// 打包环境可能缺失，仅在使用时动态 require（缺失给出可读错误，不导致启动崩溃）
let _pdfjs = null;
async function getPdfjs() {
  if (!_pdfjs) _pdfjs = await import('pdfjs-dist');
  return _pdfjs;
}

// 文档→PDF 走 HTML 渲染 + printToPDF 的格式（docx/md/txt/html 走 HTML 渲染，xlsx 走 SheetJS 渲染表格）
const SUPPORTED_DOCS_TO_PDF = ['docx', 'md', 'txt', 'html', 'xlsx'];
// 文档→PDF 走 LibreOffice headless 的格式（排版保真，需用户安装 LibreOffice）
const LO_DOC_EXTS = ['doc', 'ppt', 'pptx', 'xls', 'odt', 'ods', 'odp', 'csv'];

function ffmpegPath() {
  if (process.platform === 'win32') {
    const bundled = path.join(process.resourcesPath || '.', 'ffmpeg.exe');
    if (fs.existsSync(bundled)) return bundled;
  }
  try { return require('ffmpeg-static'); } catch (_) { return 'ffmpeg'; }
}

function outPathFor(srcPath, ext) {
  const dir = path.dirname(srcPath);
  const base = path.basename(srcPath, path.extname(srcPath));
  let out = path.join(dir, base + '.' + ext);
  let i = 1;
  while (fs.existsSync(out)) out = path.join(dir, `${base}(${i++}).${ext}`);
  return out;
}

// 指定目录 + 基底 + 后缀的唯一输出路径
function uniqueOut(dir, base, ext) {
  let out = path.join(dir, base + '.' + ext);
  let i = 1;
  while (fs.existsSync(out)) out = path.join(dir, `${base}(${i++}).${ext}`);
  return out;
}

function run(cmd, args) {
  return new Promise((resolve, reject) => {
    const p = spawn(cmd, args, { windowsHide: true });
    let stderr = '';
    p.stderr.on('data', (d) => { stderr += String(d); });
    p.on('error', (err) => reject(new Error('启动进程失败: ' + err.message)));
    p.on('close', (code) => {
      if (code === 0) resolve();
      else reject(new Error('进程退出码 ' + code + (stderr ? ' · ' + stderr.slice(-300) : '')));
    });
  });
}

// ---------- LibreOffice headless（文档排版保真转 PDF） ----------
function loCandidatePaths() {
  if (process.platform === 'win32') {
    return [
      'C:\\Program Files\\LibreOffice\\program\\soffice.exe',
      'C:\\Program Files (x86)\\LibreOffice\\program\\soffice.exe',
      'C:\\Program Files\\LibreOffice\\program\\soffice.com',
      'C:\\Program Files (x86)\\LibreOffice\\program\\soffice.com'
    ];
  }
  return [
    '/usr/bin/soffice',
    '/usr/local/bin/soffice',
    '/opt/homebrew/bin/soffice',
    '/Applications/LibreOffice.app/Contents/MacOS/soffice'
  ];
}

// 检测 LibreOffice：先查常见安装路径，再探测 PATH 中的 soffice
async function detectLibreOffice() {
  for (const p of loCandidatePaths()) {
    if (p && fs.existsSync(p)) return p;
  }
  try {
    await new Promise((resolve, reject) => {
      let done = false;
      const finish = (err) => { if (!done) { done = true; err ? reject(err) : resolve(); } };
      const p = spawn('soffice', ['--version'], { windowsHide: true });
      p.on('error', () => finish(new Error('soffice not in PATH')));
      p.on('close', (code) => (code === 0 ? finish() : finish(new Error('soffice exit ' + code))));
      setTimeout(() => finish(new Error('soffice probe timeout')), 4000);
    });
    return 'soffice';
  } catch (_) {}
  return null;
}

async function convertDocWithLibreOffice(src, ext) {
  const lo = await detectLibreOffice();
  if (!lo) {
    throw new Error('未检测到 LibreOffice，请先安装 LibreOffice（https://www.libreoffice.org/download/）后重试。');
  }
  const out = outPathFor(src, 'pdf');
  // 在临时目录中转换：LibreOffice 固定输出"源名.pdf"，避免覆盖用户已有的同名 PDF
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'fc-lo-'));
  try {
    const base = path.basename(src, path.extname(src));
    const tmpSrc = path.join(tmpDir, base + path.extname(src));
    await fs.promises.copyFile(src, tmpSrc);
    await run(lo, ['--headless', '--norestore', '--convert-to', 'pdf', '--outdir', tmpDir, tmpSrc]);
    const produced = path.join(tmpDir, base + '.pdf');
    if (!fs.existsSync(produced)) {
      throw new Error('LibreOffice 转换未生成 PDF（' + ext + ' 格式可能不受支持）。');
    }
    await fs.promises.copyFile(produced, out);
    return out;
  } finally {
    try { fs.rmSync(tmpDir, { recursive: true, force: true }); } catch (_) {}
  }
}

async function convertImage(src, ext) {
  const out = outPathFor(src, ext);
  const srcExt = path.extname(src).slice(1).toLowerCase();
  // 优先 sharp；win32 打包机交叉编译时 sharp 原生二进制可能不可用，回退 ffmpeg
  let sharp = null;
  try { sharp = await getSharp(); } catch (_) { sharp = null; }
  if (sharp) {
    try {
      await sharp(src).toFormat(ext, ext === 'jpg' || ext === 'jpeg' ? { quality: 92 } : {}).toFile(out);
      return out;
    } catch (e) {
      if (srcExt === 'heic' || srcExt === 'heif') {
        const heifOk = !!(sharp.format && sharp.format.heif && sharp.format.heif.input);
        throw new Error(
          (heifOk ? 'HEIC/HEIF 解码失败（文件可能损坏）' : '当前 sharp 版本不支持 HEIC/HEIF 解码，请升级 sharp 或先将图片转为 JPG/PNG') +
          '：' + String(e.message || e)
        );
      }
      // sharp 失败则回退 ffmpeg
    }
  }
  // sharp 不可用（win 平台二进制缺失/加载失败）或转换失败时回退 ffmpeg
  const ff = ffmpegPath();
  await run(ff, ['-y', '-i', src, out]);
  return out;
}

async function convertMedia(src, ext) {
  const out = outPathFor(src, ext);
  // 音频/视频统一用 ffmpeg 重编码（不同容器码流差异大，不强制 -c copy）
  await run(ffmpegPath(), ['-y', '-i', src, '-preset', 'veryfast', out]);
  return out;
}

async function mergePdfs(files) {
  if (!files || files.length < 2) throw new Error('至少需要两个 PDF 文件');
  const merged = await PDFDocument.create();
  for (const f of files) {
    const src = await PDFDocument.load(await fs.promises.readFile(f));
    const pages = await merged.copyPages(src, src.getPageIndices());
    pages.forEach((p) => merged.addPage(p));
  }
  const dir = path.dirname(files[0]);
  const base = '合并-' + new Date().toISOString().slice(0, 10);
  let out = path.join(dir, base + '.pdf');
  let i = 1;
  while (fs.existsSync(out)) out = path.join(dir, `${base}(${i++}).pdf`);
  await fs.promises.writeFile(out, await merged.save());
  return out;
}

// ---------- 文档→PDF ----------
function escHtml(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function wrapHtml(title, body) {
  return '<!DOCTYPE html><html lang="zh"><head><meta charset="utf-8"><title>' + escHtml(title) + '</title>' +
    '<style>' +
    'body{font-family:-apple-system,"Segoe UI","Microsoft YaHei",sans-serif;color:#1f2328;margin:36px 40px;line-height:1.65;font-size:14px;}' +
    'pre{white-space:pre-wrap;word-wrap:break-word;font-family:Consolas,"Courier New",monospace;font-size:13px;background:#f6f8fa;padding:12px;border-radius:6px;}' +
    'table{border-collapse:collapse;width:100%;margin:8px 0;}' +
    'th,td{border:1px solid #d0d7de;padding:6px 10px;text-align:left;font-size:13px;}' +
    'th{background:#f6f8fa;font-weight:600;}' +
    'img{max-width:100%;}' +
    'h1,h2,h3{line-height:1.3;}' +
    '</style></head><body>' + body + '</body></html>';
}

// 将任意受支持文档渲染为 HTML（纯 Node 可测，不依赖 Electron）
async function docToPdfHtml(src, ext) {
  const title = path.basename(src);
  if (ext === 'docx') {
    const r = await mammoth.convertToHtml({ path: src });
    return wrapHtml(title, r.value);
  }
  if (ext === 'md') {
    const mdText = await fs.promises.readFile(src, 'utf8');
    return wrapHtml(title, (await getMarked()).parse(mdText));
  }
  if (ext === 'txt') {
    const txt = await fs.promises.readFile(src, 'utf8');
    return wrapHtml(title, '<pre>' + escHtml(txt) + '</pre>');
  }
  if (ext === 'html') {
    // 直接渲染原 HTML；注入 <base> 指向源文件目录，尽力保留相对路径资源（图片/样式）
    let html = await fs.promises.readFile(src, 'utf8');
    const dirUrl = pathToFileURL(path.dirname(src) + path.sep).href; // 正确处理 Windows 盘符与中文/空格编码
    const base = '<base href="' + dirUrl + '">';
    if (/<head[^>]*>/i.test(html)) html = html.replace(/<head[^>]*>/i, (m) => m + base);
    else html = base + html;
    return html;
  }
  if (ext === 'xlsx') {
    // SheetJS 渲染表格：逐 sheet 生成 HTML 表格，尽力保数据
    const wb = xlsx.readFile(src);
    const parts = wb.SheetNames.map((name) => {
      const ws = wb.Sheets[name];
      let tbl = '<h2>' + escHtml(name) + '</h2>';
      try {
        tbl += xlsx.utils.sheet_to_html(ws, { id: 'sheet-' + escHtml(name) });
      } catch (_) {
        tbl += '<p>（该工作表无法渲染）</p>';
      }
      return tbl;
    });
    return wrapHtml(title, parts.join('<div style="page-break-after:always"></div>'));
  }
  throw new Error('不支持的文件类型: ' + ext);
}

// 用隐藏 BrowserWindow + printToPDF 将 HTML 输出为 PDF
async function printHtmlToPdf(html, out) {
  const { BrowserWindow } = require('electron'); // 仅主进程可用的 API，动态 require
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'fc-docpdf-'));
  const tmpHtml = path.join(tmpDir, 'doc.html');
  fs.writeFileSync(tmpHtml, html, 'utf8');
  let win = null;
  try {
    win = new BrowserWindow({
      show: false,
      width: 1024,
      height: 1400,
      webPreferences: { sandbox: false, javascript: true, webSecurity: false }
    });
    await win.loadFile(tmpHtml);
    const pdfBuf = await win.webContents.printToPDF({
      printBackground: true,
      pageSize: 'A4',
      margins: { marginType: 'default' }
    });
    await fs.promises.writeFile(out, pdfBuf);
    return out;
  } finally {
    try { if (win && !win.isDestroyed()) win.destroy(); } catch (_) {}
    try { fs.rmSync(tmpDir, { recursive: true, force: true }); } catch (_) {}
  }
}

// ---------- PDF→文档（文本级提取，复杂排版可能简化） ----------
// pdfjs-dist 提取文本时可能残留 NUL 等控制字符，统一清理
function cleanPdfText(text) {
  return String(text || '')
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\uFFFD]/g, '')
    .replace(/\r\n?/g, '\n')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n');
}

async function extractPdfText(src) {
  const parser = new PDFParse({ data: await fs.promises.readFile(src) });
  const result = await parser.getText();
  return cleanPdfText(result.text);
}

async function pdfToText(src) {
  const text = await extractPdfText(src);
  const out = outPathFor(src, 'txt');
  await fs.promises.writeFile(out, text, 'utf8');
  return out;
}

async function pdfToDocx(src) {
  const text = await extractPdfText(src);
  // 文本级 docx：按段落分组，保留大致行距与中文字体
  const paragraphs = [];
  let buf = [];
  const flush = () => {
    if (!buf.length) return;
    paragraphs.push(new Paragraph({
      spacing: { after: 120, line: 300 },
      children: [new TextRun({ text: buf.join(' '), size: 21, font: 'Microsoft YaHei' })]
    }));
    buf = [];
  };
  for (const line of text.split('\n')) {
    if (!line.trim()) { flush(); continue; }
    buf.push(line.trim());
    if (buf.length >= 60) flush();
  }
  flush();
  if (!paragraphs.length) {
    paragraphs.push(new Paragraph({ children: [new TextRun({ text: '（未提取到文本，该 PDF 可能是扫描版）', size: 21, font: 'Microsoft YaHei' })] }));
  }
  const doc = new Document({ sections: [{ properties: {}, children: paragraphs }] });
  const out = outPathFor(src, 'docx');
  await fs.promises.writeFile(out, await Packer.toBuffer(doc));
  return out;
}

// ---------- Markdown 输出（文本级） ----------
async function docToMarkdown(src, ext) {
  const out = outPathFor(src, 'md');
  if (ext === 'txt' || ext === 'html') {
    // txt/html 直接以原文文本写入 .md
    const text = await fs.promises.readFile(src, 'utf8');
    await fs.promises.writeFile(out, text, 'utf8');
    return out;
  }
  if (ext === 'docx') {
    // mammoth 提取纯文本写入 .md（复杂排版简化）
    const r = await mammoth.extractRawText({ path: src });
    await fs.promises.writeFile(out, (r && r.value) || '', 'utf8');
    return out;
  }
  throw new Error('不支持的文件类型转 Markdown: ' + ext);
}

async function pdfToMarkdown(src) {
  const text = await extractPdfText(src);
  const out = outPathFor(src, 'md');
  await fs.promises.writeFile(out, text, 'utf8');
  return out;
}

// ---------- PDF→图片（pdfjs-dist 渲染 + @napi-rs/canvas 画布） ----------
// outDir 可选：缺省输出到源文件目录；pdfToPPTX 等内部流程可传临时目录避免污染用户目录
async function pdfToImages(src, targetExt, outDir) {
  let nc = null;
  try {
    nc = require('@napi-rs/canvas');
  } catch (e) {
    throw new Error('缺少 @napi-rs/canvas 原生依赖，无法将 PDF 渲染为图片。');
  }
  const createCanvas = nc.createCanvas;
  class NodeCanvasFactory {
    create(width, height) {
      const canvas = createCanvas(width, height);
      return { canvas: canvas, context: canvas.getContext('2d') };
    }
    reset(canvasAndContext, width, height) {
      canvasAndContext.canvas.width = width;
      canvasAndContext.canvas.height = height;
    }
    destroy(canvasAndContext) {
      canvasAndContext.canvas.width = 0;
      canvasAndContext.canvas.height = 0;
    }
  }
  const pdfjs = await getPdfjs();
  if (!pdfjs || !pdfjs.getDocument) throw new Error('pdfjs-dist 加载失败。');
  try { pdfjs.GlobalWorkerOptions.workerSrc = require.resolve('pdfjs-dist/build/pdf.worker.min.mjs'); } catch (_) {}
  const data = new Uint8Array(await fs.promises.readFile(src));
  const doc = await pdfjs.getDocument({
    data: data,
    isEvalSupported: false,
    useSystemFonts: true
  }).promise;
  const dir = outDir || path.dirname(src);
  const base = path.basename(src, path.extname(src));
  const scale = 2; // 约 144 DPI，兼顾清晰度与体积
  const outs = [];
  try {
    for (let i = 1; i <= doc.numPages; i++) {
      const page = await doc.getPage(i);
      const viewport = page.getViewport({ scale: scale });
      const cc = new NodeCanvasFactory().create(Math.ceil(viewport.width), Math.ceil(viewport.height));
      try {
        await page.render({ canvasContext: cc.context, viewport: viewport }).promise;
        const pngBuf = cc.canvas.toBuffer('image/png');
        if (targetExt === 'png') {
          const out = uniqueOut(dir, base + '-第' + i + '页', 'png');
          await fs.promises.writeFile(out, pngBuf);
          outs.push(out);
        } else {
          // jpg 经 sharp 转码（有损压缩、体积更小）
          const sharp = await getSharp();
          const jpgBuf = await sharp(pngBuf).jpeg({ quality: 90 }).toBuffer();
          const out = uniqueOut(dir, base + '-第' + i + '页', 'jpg');
          await fs.promises.writeFile(out, jpgBuf);
          outs.push(out);
        }
      } finally {
        try { page.cleanup(); } catch (_) {}
      }
    }
  } finally {
    try { await doc.destroy(); } catch (_) {}
  }
  return outs;
}

// ---------- 图片→PDF（多图合并，pdf-lib 嵌入） ----------
async function imagesToPDF(files) {
  if (!files || !files.length) throw new Error('没有图片');
  const pdf = await PDFDocument.create();
  const sharp = await getSharp();
  for (const f of files) {
    const ext = path.extname(f).slice(1).toLowerCase();
    if (!Formats.IMAGE_EXTS.includes(ext)) throw new Error('仅支持图片文件: ' + ext);
    const buf = await fs.promises.readFile(f);
    // pdf-lib 仅支持嵌入 PNG/JPG；其余格式经 sharp 归一为 PNG 再嵌入
    let img;
    if (ext === 'png') img = await pdf.embedPng(buf);
    else if (ext === 'jpg' || ext === 'jpeg') img = await pdf.embedJpg(buf);
    else img = await pdf.embedPng(await sharp(buf).png().toBuffer());
    // 页面尺寸按图片纵横比等比缩放，限制在 A4 可读范围内（不拉伸）
    const maxW = 595, maxH = 842; // A4 pt
    const scale = Math.min(1, maxW / img.width, maxH / img.height);
    const pw = Math.round(img.width * scale), ph = Math.round(img.height * scale);
    const page = pdf.addPage([pw, ph]);
    page.drawImage(img, { x: 0, y: 0, width: pw, height: ph });
  }
  const dir = path.dirname(files[0]);
  const base = '合并-' + new Date().toISOString().slice(0, 10);
  const out = uniqueOut(dir, base, 'pdf');
  await fs.promises.writeFile(out, await pdf.save());
  return out;
}

// ---------- 图片→PPTX（多图合并，jszip 手工构建每页一图） ----------
const SLIDE_W_EMU = 12192000; // 16:9 宽 EMU
const SLIDE_H_EMU = 6858000;  // 16:9 高 EMU

function pptxSlideXml(slideIdx, x, y, w, h) {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<p:sld xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main">
  <p:cSld><p:spTree>
    <p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr>
    <p:grpSpPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="0" cy="0"/><a:chOff x="0" y="0"/><a:chExt cx="0" cy="0"/></a:xfrm></p:grpSpPr>
    <p:pic>
      <p:nvPicPr><p:cNvPr id="2" name="image${slideIdx}"/><p:cNvPicPr/><p:nvPr/></p:nvPicPr>
      <p:blipFill><a:blip r:embed="rId1"/><a:stretch><a:fillRect/></a:stretch></p:blipFill>
      <p:spPr><a:xfrm><a:off x="${x}" y="${y}"/><a:ext cx="${w}" cy="${h}"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></p:spPr>
    </p:pic>
  </p:spTree></p:cSld>
  <p:clrMapOvr><a:overrideClrMapping/></p:clrMapOvr>
</p:sld>`;
}

function pptxSlideRels() {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="../media/image1.png"/></Relationships>`;
}

function pptxSlideMasterXml() {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<p:sldMaster xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main">
  <p:cSld><p:bg><p:bgPr><a:solidFill><a:schemeClr val="bg1"/></a:solidFill><a:effectLst/></p:bgPr></p:bg><p:spTree>
    <p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr>
    <p:grpSpPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="0" cy="0"/><a:chOff x="0" y="0"/><a:chExt cx="0" cy="0"/></a:xfrm></p:grpSpPr>
  </p:spTree></p:cSld>
  <p:clrMap bg1="lt1" tx1="dk1" bg2="lt2" tx2="dk2" accent1="accent1" accent2="accent2" accent3="accent3" accent4="accent4" accent5="accent5" accent6="accent6" hlink="hlink" folHlink="folHlink"/>
  <p:sldLayoutIdLst><p:sldLayoutId id="2147483649" r:id="rId1"/></p:sldLayoutIdLst>
  <p:txStyles><p:titleStyle/><p:bodyStyle/><p:otherStyle/></p:txStyles>
</p:sldMaster>`;
}

function pptxSlideLayoutXml() {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<p:sldLayout xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main" type="blank" preserve="1">
  <p:cSld name="Blank"><p:spTree>
    <p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr>
    <p:grpSpPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="0" cy="0"/><a:chOff x="0" y="0"/><a:chExt cx="0" cy="0"/></a:xfrm></p:grpSpPr>
  </p:spTree></p:cSld>
  <p:clrMapOvr><a:masterClrMapping/></p:clrMapOvr>
</p:sldLayout>`;
}

function pptxThemeXml() {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<a:theme xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" name="FileConverter"><a:themeElements>
  <a:clrScheme name="FileConverter"><a:dk1><a:sysClr val="windowText" lastClr="000000"/></a:dk1><a:lt1><a:sysClr val="window" lastClr="FFFFFF"/></a:lt1><a:dk2><a:srgbClr val="44546A"/></a:dk2><a:lt2><a:srgbClr val="E7E6E6"/></a:lt2><a:accent1><a:srgbClr val="7A3AED"/></a:accent1><a:accent2><a:srgbClr val="EC4899"/></a:accent2><a:accent3><a:srgbClr val="F7B733"/></a:accent3><a:accent4><a:srgbClr val="22C55E"/></a:accent4><a:accent5><a:srgbClr val="3B82F6"/></a:accent5><a:accent6><a:srgbClr val="EF4444"/></a:accent6><a:hlink><a:srgbClr val="0563C1"/></a:hlink><a:folHlink><a:srgbClr val="954F72"/></a:folHlink></a:clrScheme>
  <a:fontScheme name="FileConverter"><a:majorFont><a:latin typeface="Microsoft YaHei"/><a:ea typeface="Microsoft YaHei"/></a:majorFont><a:minorFont><a:latin typeface="Microsoft YaHei"/><a:ea typeface="Microsoft YaHei"/></a:minorFont></a:fontScheme>
  <a:fmtScheme name="FileConverter"><a:fillStyleLst><a:solidFill><a:schemeClr val="phClr"/></a:solidFill><a:solidFill><a:schemeClr val="phClr"/></a:solidFill><a:solidFill><a:schemeClr val="phClr"/></a:solidFill></a:fillStyleLst><a:lnStyleLst><a:ln w="6350" cap="flat" cmpd="sng" algn="ctr"><a:solidFill><a:schemeClr val="phClr"/></a:solidFill><a:prstDash val="solid"/></a:ln><a:ln w="12700" cap="flat" cmpd="sng" algn="ctr"><a:solidFill><a:schemeClr val="phClr"/></a:solidFill><a:prstDash val="solid"/></a:ln><a:ln w="19050" cap="flat" cmpd="sng" algn="ctr"><a:solidFill><a:schemeClr val="phClr"/></a:solidFill><a:prstDash val="solid"/></a:ln></a:lnStyleLst><a:effectStyleLst><a:effectStyle><a:effectLst/></a:effectStyle><a:effectStyle><a:effectLst/></a:effectStyle><a:effectStyle><a:effectLst/></a:effectStyle></a:effectStyleLst><a:bgFillStyleLst><a:solidFill><a:schemeClr val="phClr"/></a:solidFill><a:solidFill><a:schemeClr val="phClr"/></a:solidFill><a:solidFill><a:schemeClr val="phClr"/></a:solidFill></a:bgFillStyleLst></a:fmtScheme>
</a:themeElements></a:theme>`;
}

async function imagesToPPTX(files) {
  if (!files || !files.length) throw new Error('没有图片');
  const JSZip = require('jszip');
  const sharp = await getSharp();
  const zip = new JSZip();
  const n = files.length;
  for (let i = 0; i < n; i++) {
    const f = files[i];
    const ext = path.extname(f).slice(1).toLowerCase();
    if (!Formats.IMAGE_EXTS.includes(ext)) throw new Error('仅支持图片文件: ' + ext);
    let buf;
    if (ext === 'png') buf = await fs.promises.readFile(f);
    else buf = await sharp(f).png().toBuffer();
    const meta = await sharp(buf).metadata();
    const scale = Math.min((SLIDE_W_EMU * 0.9) / meta.width, (SLIDE_H_EMU * 0.9) / meta.height);
    const w = Math.max(1, Math.round(meta.width * scale));
    const h = Math.max(1, Math.round(meta.height * scale));
    const x = Math.round((SLIDE_W_EMU - w) / 2);
    const y = Math.round((SLIDE_H_EMU - h) / 2);
    zip.file('ppt/media/image' + (i + 1) + '.png', buf);
    zip.file('ppt/slides/slide' + (i + 1) + '.xml', pptxSlideXml(i + 1, x, y, w, h));
    zip.file('ppt/slides/_rels/slide' + (i + 1) + '.xml.rels', pptxSlideRels());
  }
  // 骨架文件
  zip.file('[Content_Types].xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Default Extension="png" ContentType="image/png"/><Override PartName="/ppt/presentation.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.presentation.main+xml"/><Override PartName="/ppt/slideMasters/slideMaster1.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slideMaster+xml"/><Override PartName="/ppt/slideLayouts/slideLayout1.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slideLayout+xml"/><Override PartName="/ppt/theme/theme1.xml" ContentType="application/vnd.openxmlformats-officedocument.theme+xml"/><Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/><Override PartName="/docProps/app.xml" ContentType="application/vnd.openxmlformats-officedocument.extended-properties+xml"/>${Array.from({ length: n }, (_, i) => `<Override PartName="/ppt/slides/slide${i + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slide+xml"/>`).join('')}</Types>`);
  zip.file('_rels/.rels', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="ppt/presentation.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/><Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/extended-properties" Target="docProps/app.xml"/></Relationships>`);
  zip.file('docProps/core.xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/" xmlns:dcmitype="http://purl.org/dc/dcmitype/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"><dc:creator>FileConverter</dc:creator><cp:lastModifiedBy>FileConverter</cp:lastModifiedBy><dcterms:created xsi:type="dcterms:W3CDTF">${new Date().toISOString()}</dcterms:created><dcterms:modified xsi:type="dcterms:W3CDTF">${new Date().toISOString()}</dcterms:modified></cp:coreProperties>`);
  zip.file('docProps/app.xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties" xmlns:vt="http://schemas.openxmlformats.org/officeDocument/2006/docPropsVTypes"><Application>FileConverter</Application><Slides>${n}</Slides></Properties>`);
  zip.file('ppt/presentation.xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<p:presentation xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main"><p:sldMasterIdLst><p:sldMasterId id="2147483648" r:id="rId1"/></p:sldMasterIdLst><p:sldIdLst>${Array.from({ length: n }, (_, i) => `<p:sldId id="${256 + i}" r:id="rId${2 + i}"/>`).join('')}</p:sldIdLst><p:sldSz cx="${SLIDE_W_EMU}" cy="${SLIDE_H_EMU}" type="screen16x9"/><p:notesSz cx="6858000" cy="9144000"/></p:presentation>`);
  zip.file('ppt/_rels/presentation.xml.rels', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideMaster" Target="slideMasters/slideMaster1.xml"/>${Array.from({ length: n }, (_, i) => `<Relationship Id="rId${2 + i}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slide" Target="slides/slide${i + 1}.xml"/>`).join('')}</Relationships>`);
  zip.file('ppt/slideMasters/slideMaster1.xml', pptxSlideMasterXml());
  zip.file('ppt/slideMasters/_rels/slideMaster1.xml.rels', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideLayout" Target="../slideLayouts/slideLayout1.xml"/></Relationships>`);
  zip.file('ppt/slideLayouts/slideLayout1.xml', pptxSlideLayoutXml());
  zip.file('ppt/slideLayouts/_rels/slideLayout1.xml.rels', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideMaster" Target="../slideMasters/slideMaster1.xml"/></Relationships>`);
  zip.file('ppt/theme/theme1.xml', pptxThemeXml());

  const dir = path.dirname(files[0]);
  const base = '合并-' + new Date().toISOString().slice(0, 10);
  const out = uniqueOut(dir, base, 'pptx');
  const buf = await zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE', mimeType: 'application/vnd.openxmlformats-officedocument.presentationml.presentation' });
  await fs.promises.writeFile(out, buf);
  return out;
}

// ---------- PDF→PPT（pdfjs 渲染每页为图片后组装 PPTX） ----------
async function pdfToPPTX(src) {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'fc-pdf2ppt-'));
  try {
    const imgs = await pdfToImages(src, 'png', tmpDir);
    const made = await imagesToPPTX(imgs);
    // imagesToPPTX 输出落在 imgs 同目录（tmpDir），需移回源 PDF 所在目录，避免被临时目录清理删除
    const dir = path.dirname(src);
    const base = path.basename(src, path.extname(src));
    const out = uniqueOut(dir, base + '-PPT', 'pptx');
    await fs.promises.rename(made, out);
    return out;
  } finally {
    try { fs.rmSync(tmpDir, { recursive: true, force: true }); } catch (_) {}
  }
}

// ---------- 图片二级工具：压缩 / 去元数据（sharp 重编码） ----------
async function imageOp(op, src, opts) {
  if (!src || !fs.existsSync(src)) throw new Error('文件不存在: ' + src);
  const ext = path.extname(src).slice(1).toLowerCase();
  if (!Formats.IMAGE_EXTS.includes(ext)) throw new Error('仅支持图片文件: ' + ext);
  const dir = path.dirname(src);
  const base = path.basename(src, '.' + ext);
  const keepExt = ['jpg', 'jpeg', 'png', 'webp'].includes(ext);
  const sharp = await getSharp();
  if (op === 'compress') {
    // sharp 有损优化：jpg/webp 压质量，png 最高压缩 + 调色板
    const outExt = keepExt ? ext : 'jpg';
    const out = uniqueOut(dir, base + '-压缩', outExt);
    const quality = Math.max(30, Math.min(95, (opts && opts.quality) || 75));
    let p = sharp(src);
    if (outExt === 'jpg' || outExt === 'jpeg') p = p.jpeg({ quality: quality, mozjpeg: true });
    else if (outExt === 'png') p = p.png({ compressionLevel: 9, palette: true, quality: quality });
    else if (outExt === 'webp') p = p.webp({ quality: quality });
    else p = p.toFormat('jpg', { quality: quality });
    await p.toFile(out);
    return out;
  }
  if (op === 'strip') {
    // 不调用 withMetadata 即丢弃 EXIF/IPTC 等元数据；rotate() 先应用方向，写入干净像素
    const outExt = keepExt ? ext : 'jpg';
    const out = uniqueOut(dir, base + '-去元数据', outExt);
    let p = sharp(src).rotate();
    if (outExt !== ext) p = p.toFormat(outExt, { quality: 90 });
    await p.toFile(out);
    return out;
  }
  throw new Error('未知图片操作: ' + op);
}

// 统一入口：files 与 targetExt（'merge' 为 PDF 合并）
async function convert(files, targetExt) {
  if (!files || files.length === 0) throw new Error('没有文件');
  if (targetExt === 'merge') return await mergePdfs(files);
  // 多图合并：图片 → PDF / PPTX
  const allImage = files.every((f) => Formats.categoryOf(Formats.extOf(f)) === 'image');
  if (allImage && (targetExt === 'pdf' || targetExt === 'pptx')) {
    return targetExt === 'pdf' ? await imagesToPDF(files) : await imagesToPPTX(files);
  }
  if (files.length > 1) throw new Error('单文件转换一次一个，多文件请用 PDF 合并或批量队列');
  const src = files[0];
  const ext = Formats.extOf(src);
  const cat = Formats.categoryOf(ext);
  if (cat === 'image') return await convertImage(src, targetExt);
  if (cat === 'video' || cat === 'audio') return await convertMedia(src, targetExt);
  if (cat === 'pdf') {
    if (targetExt === 'txt') return await pdfToText(src);
    if (targetExt === 'docx') return await pdfToDocx(src);
    if (targetExt === 'md') return await pdfToMarkdown(src);
    if (targetExt === 'pptx') return await pdfToPPTX(src);
    if (targetExt === 'png' || targetExt === 'jpg') {
      const outs = await pdfToImages(src, targetExt);
      return outs[0]; // 主返回第一页；多页时按"原名-第N页.ext"全部生成
    }
    throw new Error('不支持该格式转换: pdf -> ' + targetExt);
  }
  if (cat === 'document' && (targetExt === 'pdf' || targetExt === 'md')) {
    if (targetExt === 'md') return await docToMarkdown(src, ext);
    // doc/ppt/pptx/xls/odt/ods/odp/csv 走 LibreOffice headless（排版保真）
    if (LO_DOC_EXTS.includes(ext)) return await convertDocWithLibreOffice(src, ext);
    if (!SUPPORTED_DOCS_TO_PDF.includes(ext)) {
      throw new Error('该格式转 PDF 不支持: ' + ext);
    }
    const out = outPathFor(src, 'pdf');
    const html = await docToPdfHtml(src, ext);
    return await printHtmlToPdf(html, out);
  }
  throw new Error('不支持该格式转换: ' + ext + ' -> ' + targetExt);
}

module.exports = {
  convert,
  convertImage,
  convertMedia,
  mergePdfs,
  imagesToPDF,
  imagesToPPTX,
  pdfToPPTX,
  ffmpegPath,
  docToPdfHtml,
  printHtmlToPdf,
  pdfToText,
  pdfToDocx,
  pdfToMarkdown,
  docToMarkdown,
  extractPdfText,
  SUPPORTED_DOCS_TO_PDF,
  LO_DOC_EXTS,
  detectLibreOffice,
  convertDocWithLibreOffice,
  pdfToImages,
  imageOp
};
