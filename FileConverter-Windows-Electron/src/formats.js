// formats.js - 格式分类与可转换目标（UMD：主进程 require / 渲染进程 window）
(function (root, factory) {
  if (typeof module !== 'undefined' && module.exports) module.exports = factory();
  else root.Formats = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  const IMAGE_EXTS = ['png', 'jpg', 'jpeg', 'webp', 'gif', 'tiff', 'bmp', 'heic'];
  const VIDEO_EXTS = ['mp4', 'mov', 'avi', 'mkv', 'webm', 'm4v', 'wmv'];
  const AUDIO_EXTS = ['mp3', 'wav', 'flac', 'aac', 'ogg', 'm4a', 'wma', 'opus'];
  const PDF_EXTS = ['pdf'];
  const DOC_EXTS = ['doc', 'docx', 'ppt', 'pptx', 'xls', 'xlsx', 'odt', 'ods', 'odp', 'csv', 'md', 'txt', 'html'];
  // 已实现本地离线文档→PDF 的格式：
  // docx/md/txt/html 走 HTML 渲染 + printToPDF，xlsx 走 SheetJS 渲染表格；
  // doc/ppt/pptx/xls/odt/ods/odp/csv 走 LibreOffice headless（排版保真，需安装 LibreOffice）
  const DOC_TO_PDF_EXTS = ['docx', 'md', 'txt', 'html', 'xlsx', 'doc', 'ppt', 'pptx', 'xls', 'odt', 'ods', 'odp', 'csv'];
  // 已实现文档→Markdown 的格式（docx 走 mammoth 提取文本，txt/html 直接以原文写入）
  const DOC_TO_MD_EXTS = ['docx', 'txt', 'html'];

  function extOf(filePath) {
    const m = String(filePath).toLowerCase().match(/\.([a-z0-9]{1,6})$/);
    return m ? m[1] : '';
  }

  function categoryOf(ext) {
    if (!ext) return null;
    if (IMAGE_EXTS.includes(ext)) return 'image';
    if (VIDEO_EXTS.includes(ext)) return 'video';
    if (AUDIO_EXTS.includes(ext)) return 'audio';
    if (PDF_EXTS.includes(ext)) return 'pdf';
    if (DOC_EXTS.includes(ext)) return 'document';
    return null;
  }

  // 某格式可转换为的目标格式列表
  function targetsFor(ext) {
    const cat = categoryOf(ext);
    if (!cat) return [];
    if (cat === 'image') {
      // 固定 9 项单圈：图片互转 7 项（jpeg 并入 jpg）+ 合并 PDF（第 4 位）+ 合并 PPTX（末位）
      // 与 Mac 版轮盘布局一致：pdf 第 4、pptx 末位
      return ['png', 'jpg', 'webp', 'pdf', 'gif', 'bmp', 'tiff', 'heic', 'pptx'].filter((e) => e !== ext);
    }
    if (cat === 'video') return VIDEO_EXTS.filter((e) => e !== ext);
    if (cat === 'audio') return AUDIO_EXTS.filter((e) => e !== ext);
    if (cat === 'pdf') return ['txt', 'docx', 'md', 'merge', 'pptx']; // 转 txt/docx/md（文本级）+ 合并 PDF + 转 PPTX
    if (cat === 'document') {
      if (!DOC_TO_PDF_EXTS.includes(ext)) return []; // 未实现格式（doc/ppt/pptx/xls）返回空，UI 标注"即将支持"
      const targets = ['pdf'];
      if (DOC_TO_MD_EXTS.includes(ext)) targets.push('md');
      return targets;
    }
    return [];
  }

  // 需要走"合并页面板"的特殊目标（多图合并 PDF/PPTX、PDF 转 PPT）
  function isMergeTarget(sourceExt, targetExt) {
    const cat = categoryOf(sourceExt);
    if (cat === 'image' && (targetExt === 'pdf' || targetExt === 'pptx')) return true;
    if (cat === 'pdf' && targetExt === 'pptx') return true;
    return false;
  }

  // 目标格式的友好标签
  const LABELS = {
    png: 'PNG', jpg: 'JPG', jpeg: 'JPEG', webp: 'WebP', gif: 'GIF', tiff: 'TIFF', bmp: 'BMP', heic: 'HEIC',
    mp4: 'MP4', mov: 'MOV', avi: 'AVI', mkv: 'MKV', webm: 'WebM', m4v: 'M4V', wmv: 'WMV',
    mp3: 'MP3', wav: 'WAV', flac: 'FLAC', aac: 'AAC', ogg: 'OGG', m4a: 'M4A', wma: 'WMA', opus: 'Opus',
    pdf: 'PDF', txt: 'TXT', docx: 'DOCX', md: 'md', merge: '合并 PDF',
    doc: 'DOC', ppt: 'PPT', pptx: 'PPTX', xls: 'XLS', odt: 'ODT', ods: 'ODS', odp: 'ODP', csv: 'CSV'
  };

  return {
    extOf: extOf,
    categoryOf: categoryOf,
    targetsFor: targetsFor,
    isMergeTarget: isMergeTarget,
    IMAGE_EXTS: IMAGE_EXTS,
    VIDEO_EXTS: VIDEO_EXTS,
    AUDIO_EXTS: AUDIO_EXTS,
    DOC_EXTS: DOC_EXTS,
    DOC_TO_PDF_EXTS: DOC_TO_PDF_EXTS,
    DOC_TO_MD_EXTS: DOC_TO_MD_EXTS,
    labelOf: (ext) => LABELS[ext] || String(ext).toUpperCase()
  };
});
