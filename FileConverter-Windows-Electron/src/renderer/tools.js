// 图片工具：裁剪 / 加背景 / 涂黑(矩形·画笔·橡皮擦) / 多水印 / 色彩调整
(function () {
  'use strict';
  const cv = document.getElementById('cv');
  const ctx = cv.getContext('2d');
  const empty = document.getElementById('empty');
  const tip = document.getElementById('tip');
  const panel = document.getElementById('panel');
  const fileInput = document.getElementById('fileInput');

  let srcImg = null;      // 原始 Image
  let bgImage = null;     // 背景图片（可选）
  let curTool = null;     // crop | background | marker | watermark | color
  let markerMode = 'rect'; // rect | brush | eraser
  let watermarkTexts = []; // {x,y,text,size,color,alpha}
  let bgStyle = { kind: 'gradient', color1: '#7a3aed', color2: '#ec4899' };

  // 当前画布像素模型：每次编辑后重绘
  function redraw() {
    if (!srcImg) return;
    const w = srcImg.naturalWidth, h = srcImg.naturalHeight;
    cv.width = w; cv.height = h;
    ctx.clearRect(0, 0, w, h);
    // 背景
    if (bgStyle.kind === 'solid') {
      ctx.fillStyle = bgStyle.color1;
      ctx.fillRect(0, 0, w, h);
    } else if (bgStyle.kind === 'gradient') {
      const g = ctx.createLinearGradient(0, 0, w, h);
      g.addColorStop(0, bgStyle.color1);
      g.addColorStop(1, bgStyle.color2);
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);
    } else if (bgStyle.kind === 'image' && bgImage) {
      ctx.drawImage(bgImage, 0, 0, w, h);
    }
    // 原图
    ctx.drawImage(srcImg, 0, 0, w, h);
    // 水印
    watermarkTexts.forEach((m) => {
      ctx.save();
      ctx.globalAlpha = m.alpha;
      ctx.fillStyle = m.color;
      ctx.font = m.size + 'px "Microsoft YaHei", sans-serif';
      ctx.fillText(m.text, m.x, m.y);
      ctx.restore();
    });
  }

  // ---------- 加载 ----------
  function loadFile(file) {
    // 记录文件绝对路径（供压缩/去元数据直读原文件）
    try {
      const parent = window.parent && window.parent.fc;
      if (parent && parent.getPathForFile) curFilePath = parent.getPathForFile(file);
    } catch (_) { curFilePath = null; }
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        srcImg = img;
        watermarkTexts = [];
        bgStyle = { kind: 'gradient', color1: '#7a3aed', color2: '#ec4899' };
        bgImage = null;
        cv.style.display = 'block';
        empty.style.display = 'none';
        redraw();
        tip.textContent = '已加载 ' + img.naturalWidth + '×' + img.naturalHeight;
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  }
  document.getElementById('loadBtn').addEventListener('click', () => fileInput.click());
  fileInput.addEventListener('change', (e) => { if (e.target.files[0]) loadFile(e.target.files[0]); });

  // 拖拽加载
  document.addEventListener('dragover', (e) => e.preventDefault());
  document.addEventListener('drop', (e) => {
    e.preventDefault();
    const f = e.dataTransfer.files && e.dataTransfer.files[0];
    if (f && f.type.startsWith('image/')) loadFile(f);
  });

  // ---------- 工具栏 ----------
  const toolBtns = document.querySelectorAll('.tool-btn');
  toolBtns.forEach((b) => b.addEventListener('click', () => {
    if (!srcImg && b.dataset.tool !== 'loadBtn') return;
    curTool = b.dataset.tool;
    toolBtns.forEach((x) => x.classList.toggle('active', x === b));
    if (curTool === 'marker') {
      panel.innerHTML = markerPanelHtml();
      bindMarkerPanel();
    } else if (curTool === 'background') {
      panel.innerHTML = bgPanelHtml();
      bindBgPanel();
    } else if (curTool === 'watermark') {
      panel.innerHTML = wmPanelHtml();
      bindWmPanel();
    } else if (curTool === 'color') {
      panel.innerHTML = colorPanelHtml();
      bindColorPanel();
    } else if (curTool === 'crop') {
      panel.classList.add('hidden');
    }
    updateTip();
  }));

  function updateTip() {
    const t = {
      crop: '拖拽框选裁剪区域，双击应用',
      background: '选择背景样式后点击应用',
      marker: '矩形：按住拖拽；画笔：按住绘制；橡皮擦：擦除涂黑',
      watermark: '添加后可拖动调整位置，多水印支持',
      color: '拖动滑杆实时调整色彩',
      compress: '有损压缩减小体积（sharp 优化编码）',
      strip: '重编码去除 EXIF/GPS 等元数据'
    }[curTool] || '';
    tip.textContent = t;
  }

  // ---------- 裁剪 ----------
  let cropStart = null, cropEnd = null;
  cv.addEventListener('mousedown', (e) => {
    if (curTool === 'crop' && srcImg) {
      cropStart = cropEnd = relPos(e);
    }
  });
  cv.addEventListener('mousemove', (e) => {
    if (curTool === 'crop' && cropStart && srcImg) {
      cropEnd = relPos(e);
      redraw();
      ctx.strokeStyle = '#ec4899';
      ctx.lineWidth = 2;
      ctx.setLineDash([6, 4]);
      ctx.strokeRect(cropStart.x, cropStart.y, cropEnd.x - cropStart.x, cropEnd.y - cropStart.y);
      ctx.setLineDash([]);
    }
  });
  cv.addEventListener('mouseup', (e) => {
    if (curTool !== 'crop' || !cropStart || !srcImg) return;
    cropEnd = relPos(e);
    const x = Math.min(cropStart.x, cropEnd.x), y = Math.min(cropStart.y, cropEnd.y);
    const w = Math.abs(cropEnd.x - cropStart.x), h = Math.abs(cropEnd.y - cropStart.y);
    cropStart = null;
    if (w < 8 || h < 8) { redraw(); return; }
    // 应用裁剪（从原始图裁剪，避免裁入框选虚线）
    const cut = document.createElement('canvas');
    cut.width = w; cut.height = h;
    cut.getContext('2d').drawImage(srcImg, x, y, w, h, 0, 0, w, h);
    const img = new Image();
    img.onload = () => { srcImg = img; redraw(); };
    img.src = cut.toDataURL();
  });

  function relPos(e) {
    const r = cv.getBoundingClientRect();
    const sx = cv.width / r.width, sy = cv.height / r.height;
    return { x: (e.clientX - r.left) * sx, y: (e.clientY - r.top) * sy };
  }

  // ---------- 涂黑（矩形 / 画笔 / 橡皮擦）----------
  let drawStart = null, drawing = false;
  cv.addEventListener('mousedown', (e) => {
    if (curTool !== 'marker' || !srcImg) return;
    drawing = true;
    const p = relPos(e);
    if (markerMode === 'rect') drawStart = p;
    else paintStroke(p, true);
  });
  cv.addEventListener('mousemove', (e) => {
    if (!drawing || curTool !== 'marker' || !srcImg) return;
    const p = relPos(e);
    if (markerMode === 'rect' && drawStart) {
      redraw();
      ctx.fillStyle = '#000';
      ctx.fillRect(drawStart.x, drawStart.y, p.x - drawStart.x, p.y - drawStart.y);
    } else if (markerMode !== 'rect') {
      paintStroke(p, false);
    }
  });
  cv.addEventListener('mouseup', (e) => {
    if (!drawing) return;
    drawing = false;
    if (markerMode === 'rect' && drawStart) {
      const p = relPos(e);
      ctx.fillStyle = '#000';
      ctx.fillRect(drawStart.x, drawStart.y, p.x - drawStart.x, p.y - drawStart.y);
      drawStart = null;
    }
  });

  function paintStroke(p, isStart) {
    ctx.save();
    if (markerMode === 'brush') { ctx.globalCompositeOperation = 'source-over'; ctx.strokeStyle = '#000'; }
    else { ctx.globalCompositeOperation = 'destination-out'; ctx.strokeStyle = 'rgba(0,0,0,1)'; }
    ctx.lineWidth = markerMode === 'brush' ? 14 : 28;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    if (isStart) {
      ctx.beginPath();
      ctx.moveTo(p.x, p.y);
      ctx.lineTo(p.x + 0.01, p.y + 0.01);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(p.x, p.y);
    } else {
      ctx.lineTo(p.x, p.y);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(p.x, p.y);
    }
    ctx.restore();
  }

  function markerPanelHtml() {
    return `
      <div class="prow">
        <button class="tool-btn ${markerMode === 'rect' ? 'active' : ''}" id="mRect">矩形</button>
        <button class="tool-btn ${markerMode === 'brush' ? 'active' : ''}" id="mBrush">画笔</button>
        <button class="tool-btn ${markerMode === 'eraser' ? 'active' : ''}" id="mEraser">橡皮擦</button>
      </div>`;
  }
  function bindMarkerPanel() {
    const set = (mode, el) => el.addEventListener('click', () => { markerMode = mode; bindMarkerPanel(); });
    set('rect', document.getElementById('mRect'));
    set('brush', document.getElementById('mBrush'));
    set('eraser', document.getElementById('mEraser'));
  }

  // ---------- 加背景 ----------
  function bgPanelHtml() {
    return `
      <label>样式
        <select id="bgKind">
          <option value="gradient" ${bgStyle.kind === 'gradient' ? 'selected' : ''}>渐变</option>
          <option value="solid" ${bgStyle.kind === 'solid' ? 'selected' : ''}>纯色</option>
        </select>
      </label>
      <div class="prow">
        <input type="color" id="bgC1" value="${bgStyle.color1}">
        <input type="color" id="bgC2" value="${bgStyle.color2}">
      </div>
      <button class="btn" id="bgApply">应用背景</button>`;
  }
  function bindBgPanel() {
    const kind = document.getElementById('bgKind');
    const c1 = document.getElementById('bgC1');
    const c2 = document.getElementById('bgC2');
    document.getElementById('bgApply').addEventListener('click', () => {
      bgStyle = { kind: kind.value, color1: c1.value, color2: c2.value };
      redraw();
    });
  }

  // ---------- 水印 ----------
  let wmInputs = {};
  function wmPanelHtml() {
    return `
      <div class="prow"><input type="text" id="wmText" placeholder="水印文字" value="${wmInputs.text || 'FileConverter'}"></div>
      <div class="prow">
        <input type="color" id="wmColor" value="${wmInputs.color || '#ffffff'}">
        <label>大小 <input type="range" id="wmSize" min="12" max="120" value="${wmInputs.size || 36}"></label>
      </div>
      <div class="prow">
        <label>透明度 <input type="range" id="wmAlpha" min="0.1" max="1" step="0.05" value="${wmInputs.alpha || 0.5}"></label>
      </div>
      <button class="btn" id="wmAdd">添加水印</button>`;
  }
  function bindWmPanel() {
    wmInputs.text = document.getElementById('wmText').value;
    wmInputs.color = document.getElementById('wmColor').value;
    wmInputs.size = Number(document.getElementById('wmSize').value);
    wmInputs.alpha = Number(document.getElementById('wmAlpha').value);
    ['wmText', 'wmColor', 'wmSize', 'wmAlpha'].forEach((id) => {
      document.getElementById(id).addEventListener('input', () => {
        wmInputs.text = document.getElementById('wmText').value;
        wmInputs.color = document.getElementById('wmColor').value;
        wmInputs.size = Number(document.getElementById('wmSize').value);
        wmInputs.alpha = Number(document.getElementById('wmAlpha').value);
      });
    });
    document.getElementById('wmAdd').addEventListener('click', () => {
      if (!srcImg || !wmInputs.text) return;
      watermarkTexts.push({ x: cv.width / 2, y: cv.height / 2, text: wmInputs.text, size: wmInputs.size, color: wmInputs.color, alpha: wmInputs.alpha });
      redraw();
      tip.textContent = '水印已添加，可拖动调整位置';
    });
  }
  // 水印拖动
  let dragWm = null;
  cv.addEventListener('mousedown', (e) => {
    if (curTool !== 'watermark' || !srcImg) return;
    const p = relPos(e);
    for (let i = watermarkTexts.length - 1; i >= 0; i--) {
      const m = watermarkTexts[i];
      ctx.font = m.size + 'px "Microsoft YaHei", sans-serif';
      const w = ctx.measureText(m.text).width;
      if (Math.abs(p.x - m.x) < w / 2 + 8 && Math.abs(p.y - m.y) < m.size / 2 + 8) {
        dragWm = { i, dx: p.x - m.x, dy: p.y - m.y };
        break;
      }
    }
  });
  cv.addEventListener('mousemove', (e) => {
    if (dragWm) {
      const p = relPos(e);
      watermarkTexts[dragWm.i].x = p.x - dragWm.dx;
      watermarkTexts[dragWm.i].y = p.y - dragWm.dy;
      redraw();
    }
  });
  cv.addEventListener('mouseup', () => { dragWm = null; });

  // ---------- 色彩调整 ----------
  let colorVals = { brightness: 100, contrast: 100, saturate: 100, hue: 0 };
  function colorPanelHtml() {
    return `
      <label>亮度 <input type="range" id="cBright" min="50" max="150" value="${colorVals.brightness}"></label>
      <label>对比度 <input type="range" id="cContrast" min="50" max="150" value="${colorVals.contrast}"></label>
      <label>饱和度 <input type="range" id="cSaturate" min="0" max="200" value="${colorVals.saturate}"></label>
      <label>色相 <input type="range" id="cHue" min="-180" max="180" value="${colorVals.hue}"></label>`;
  }
  function bindColorPanel() {
    const b = document.getElementById('cBright');
    const c = document.getElementById('cContrast');
    const s = document.getElementById('cSaturate');
    const h = document.getElementById('cHue');
    [b, c, s, h].forEach((el) => el.addEventListener('input', () => {
      colorVals = { brightness: Number(b.value), contrast: Number(c.value), saturate: Number(s.value), hue: Number(h.value) };
      applyColor();
    }));
  }
  function applyColor() {
    if (!srcImg) return;
    // 复制当前画布，再带 CSS filter 重绘实现整体色彩调整
    const tmp = document.createElement('canvas');
    tmp.width = cv.width; tmp.height = cv.height;
    tmp.getContext('2d').drawImage(cv, 0, 0);
    ctx.save();
    ctx.filter = `brightness(${colorVals.brightness}%) contrast(${colorVals.contrast}%) saturate(${colorVals.saturate}%) hue-rotate(${colorVals.hue}deg)`;
    ctx.clearRect(0, 0, cv.width, cv.height);
    ctx.drawImage(tmp, 0, 0);
    ctx.restore();
  }

  // ---------- 压缩 / 去元数据（sharp 直读原文件）----------
  let compressQuality = 80;
  function compressPanelHtml() {
    return `
      <div class="prow">
        <label>质量 <input type="range" id="cpQuality" min="20" max="95" value="${compressQuality}">
          <span id="cpQualityVal">${compressQuality}</span>
        </label>
      </div>
      <div class="prow"><button class="btn" id="cpApply">执行压缩</button></div>`;
  }
  function bindCompressPanel() {
    const q = document.getElementById('cpQuality');
    q.addEventListener('input', () => {
      compressQuality = Number(q.value);
      document.getElementById('cpQualityVal').textContent = compressQuality;
    });
    document.getElementById('cpApply').addEventListener('click', async () => {
      await runImageOp('compress', { quality: compressQuality });
    });
  }
  function stripPanelHtml() {
    return `
      <div class="prow">重编码图片去除 EXIF、GPS 等元数据，输出到原目录。</div>
      <div class="prow"><button class="btn" id="stApply">执行去元数据</button></div>`;
  }
  function bindStripPanel() {
    document.getElementById('stApply').addEventListener('click', async () => {
      await runImageOp('strip', {});
    });
  }
  async function runImageOp(op, params) {
    if (!curFilePath) {
      tip.textContent = '无法获取文件路径：请通过主窗口拖入或选择文件后重试';
      return;
    }
    tip.textContent = op === 'compress' ? '压缩中…' : '处理中…';
    try {
      const r = await window.parent.fc.imageOp(op, curFilePath, params);
      tip.textContent = r && r.ok ? '已完成 → ' + r.out : '失败：' + ((r && r.error) || '未知错误');
    } catch (err) {
      tip.textContent = '失败：' + (err && err.message ? err.message : String(err));
    }
  }

  // ---------- 保存 / 重置 ----------
  document.getElementById('saveBtn').addEventListener('click', () => {
    if (!srcImg) return;
    const url = cv.toDataURL('image/png');
    const base64 = url.split(',')[1];
    // 优先通过主进程保存对话框；回退下载
    trySave(base64).catch(() => {
      const a = document.createElement('a');
      a.href = url;
      a.download = 'FileConverter-' + Date.now() + '.png';
      document.body.appendChild(a);
      a.click();
      a.remove();
      tip.textContent = '已保存';
    });
  });
  async function trySave(base64) {
    const parent = window.parent && window.parent.fc;
    if (parent && parent.saveImage) {
      const r = await parent.saveImage(base64);
      tip.textContent = r && r.ok ? '已保存 → ' + (r.path || '') : '保存失败';
      return;
    }
    throw new Error('no ipc');
  }
  document.getElementById('resetBtn').addEventListener('click', () => {
    if (!srcImg) return;
    watermarkTexts = [];
    bgStyle = { kind: 'gradient', color1: '#7a3aed', color2: '#ec4899' };
    colorVals = { brightness: 100, contrast: 100, saturate: 100, hue: 0 };
    redraw();
    tip.textContent = '已重置';
  });
})();
