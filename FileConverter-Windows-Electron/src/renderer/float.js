// float.js - 悬浮球轮盘（1:1 复刻 macOS WheelPanel/WheelView 交互状态机）
// 生命周期对齐 Mac：平时隐藏不常驻；呼出/拖入后 8s 无操作自动隐藏；转换中收缩小圆光晕；
// 完成显示文件夹 5s 后整体隐藏（不再退回常驻小球）。
'use strict';
(function () {
  const FC = window.fc;
  const Formats = window.Formats;
  const Dict = (window.I18n && I18n.dicts) ? (I18n.dicts.zh || {}) : {};
  const $ = (id) => document.getElementById(id);

  // ---------- 常量（对应 macOS WheelPanel/WheelView 视觉参数） ----------
  const COMPACT_SIZE = 90;              // 收起态小球窗口（Mac disc 300 x 0.30 = 90pt）
  const WHEEL_W = 400, WHEEL_H = 460;   // 展开轮盘窗口（透明画布，圆盘居中）
  const DISC = 300;                     // 圆盘直径（Mac discSize=300）
  const CENTER_X = 200, CENTER_Y = 230; // 圆盘圆心（窗口中心）
  const RING_OUTER = 110;               // 外环半径（Mac kWheelRingRadius=110）
  const RING_INNER = 55;                // 内环半径（Mac 外环 0.5x）
  const TILE = 54;                      // 格式按钮尺寸（Mac tileSize=54）
  const HOVER_DELAY_MS = 1500;          // 二级菜单悬停延迟（Mac kHoverDelaySec=1.5）
  const DONE_HIDE_MS = 5000;            // 完成态 5s 自动隐藏（Mac showCompleted 5s）
  const IDLE_HIDE_MS = 8000;            // 空闲 8s 自动隐藏（Mac idleHide 8s）

  // ---------- 状态 ----------
  let mode = 'compact';             // compact | wheel | tools | merge
  let busy = false;
  let currentFiles = [];            // 已拖入/选中的文件路径
  let currentExt = '';              // 源格式
  let currentTarget = '';           // 选中目标格式
  let lastOutput = null;            // 最近输出路径
  let hoverTimer = null;
  let doneTimer = null;
  let idleTimer = null;
  let mergeKind = 'pdf';            // pdf | pptx | merge | pptxFromPdf
  let mergeFiles = [];

  // ---------- DOM ----------
  const ball = $('ball'), ballCore = $('ballCore');
  const wheel = $('wheel'), wheelItems = $('wheelItems');
  const centerDisc = $('centerDisc'), cdLabel = $('cdLabel'), cdFolder = $('cdFolder');
  const glowBlobs = $('glowBlobs');
  const toolRing = $('toolRing'), toolCenter = $('toolCenter');
  const tcPreview = $('tcPreview'), tcName = $('tcName');
  const mergePanel = $('mergePanel'), mpChips = $('mpChips');
  const mpList = $('mpList'), mpHint = $('mpHint');
  const toastEl = $('toast');

  // ---------- 工具函数 ----------
  function t(key, vars) {
    let s = Dict[key] || key;
    if (vars) for (const k of Object.keys(vars)) s = s.replace('{' + k + '}', vars[k]);
    return s;
  }
  function pathsOf(dt) {
    if (!dt || !dt.files || !dt.files.length) return [];
    const out = [];
    for (const f of dt.files) {
      try { out.push(FC.getPathForFile(f)); } catch (_) { out.push(f.path || f.name); }
    }
    return out.filter(Boolean);
  }
  function showToast(msg, ms) {
    toastEl.textContent = msg;
    toastEl.classList.remove('hidden');
    clearTimeout(showToast._tm);
    showToast._tm = setTimeout(() => toastEl.classList.add('hidden'), ms || 2400);
  }
  function polar(cx, cy, r, deg) {
    const rad = ((deg - 90) * Math.PI) / 180; // 0deg 在顶部
    return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
  }

  // ---------- 图标（替代 Emoji：SF Symbols 风格描边 SVG） ----------
  const ICON_PATHS = {
    photo: '<path d="M3 6a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6z"/><circle cx="8.6" cy="9" r="1.5"/><path d="M3 14.5l4.2-3.8 3.6 3.2 2.6-2.4 3.6 3.5"/>',
    video: '<rect x="3" y="5.5" width="13" height="11" rx="2"/><path d="M16 9.5l4.5-2.5v8L16 12.5"/>',
    audio: '<path d="M9 18.5V5.5l9-2v13"/><path d="M4 18.5a3 3 0 1 0 5 0 3 3 0 0 0-5 0z"/><path d="M13 13.5a3 3 0 1 0 5 0 3 3 0 0 0-5 0z"/>',
    pdf: '<path d="M4 21V4.5A1.5 1.5 0 0 1 5.5 3H15l5 5v13a1.5 1.5 0 0 1-1.5 1.5H5.5A1.5 1.5 0 0 1 4 21z"/><path d="M15 3v5h5"/><path d="M8 13.5h8M8 17h5"/>',
    doc: '<path d="M4 21V4.5A1.5 1.5 0 0 1 5.5 3H15l5 5v13a1.5 1.5 0 0 1-1.5 1.5H5.5A1.5 1.5 0 0 1 4 21z"/><path d="M15 3v5h5"/><path d="M8 11h8M8 14.5h8M8 18h5"/>',
    table: '<rect x="3.5" y="4.5" width="17" height="15" rx="1.5"/><path d="M3.5 9.5h17M3.5 14.5h17M9.5 4.5v15M15.5 4.5v15"/>',
    chart: '<rect x="3.5" y="4.5" width="17" height="15" rx="1.5"/><path d="M7.5 14v3M12 10.5v6.5M16.5 7v10"/>',
    plain: '<path d="M4 21V4.5A1.5 1.5 0 0 1 5.5 3H15l5 5v13a1.5 1.5 0 0 1-1.5 1.5H5.5A1.5 1.5 0 0 1 4 21z"/><path d="M15 3v5h5"/><path d="M8 11.5h8M8 15h8"/>',
    merge: '<rect x="3" y="4.5" width="11" height="5" rx="1.5"/><rect x="10" y="14.5" width="11" height="5" rx="1.5"/><path d="M14 9.5v4"/>',
    mergeChart: '<rect x="3.5" y="4.5" width="17" height="15" rx="1.5"/><path d="M7.5 14v3M12 10.5v6.5M16.5 7v10"/><path d="M7 2.5v4M21 7.5h-4"/>',
    camera: '<circle cx="12" cy="13" r="4"/><path d="M3.5 18.5a2 2 0 0 0 2 2h13a2 2 0 0 0 2-2v-8a2 2 0 0 0-2-2h-2.3l-1.4-2.4a1.5 1.5 0 0 0-1.3-.7h-5a1.5 1.5 0 0 0-1.3.7L9.8 8.5H5.5a2 2 0 0 0-2 2v8z"/>',
    hexagon: '<path d="M12 2.8l7.5 4.3v8.6L12 20l-7.5-4.3V7.1z"/>',
    sparkles: '<path d="M12 4l1.6 4.2L18 10l-4.4 1.8L12 16l-1.6-4.2L6 10l4.4-1.8z"/><path d="M18.5 14.5l.8 2.2 2.2.8-2.2.8-.8 2.2-.8-2.2-2.2-.8 2.2-.8z"/>',
    book: '<path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H12v17H6.5A2.5 2.5 0 0 1 4 17.5v-12z"/><path d="M20 5.5A2.5 2.5 0 0 0 17.5 3H12v17h5.5a2.5 2.5 0 0 0 2.5-2.5v-12z"/>',
    arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>'
  };
  function iconSvg(ext, size) {
    const s = size || 15;
    let path = ICON_PATHS.arrow;
    const cat = Formats.categoryOf(ext);
    if (ext === 'merge') path = ICON_PATHS.merge;
    else if (ext === 'pptx') path = ICON_PATHS.mergeChart;
    else if (cat === 'image') {
      if (ext === 'heic') path = ICON_PATHS.camera;
      else if (ext === 'webp') path = ICON_PATHS.hexagon;
      else if (ext === 'gif') path = ICON_PATHS.sparkles;
      else path = ICON_PATHS.photo;
    } else if (cat === 'video') path = ICON_PATHS.video;
    else if (cat === 'audio') path = ICON_PATHS.audio;
    else if (ext === 'pdf') path = ICON_PATHS.pdf;
    else if (cat === 'document') {
      if (['xls', 'xlsx', 'csv', 'ods', 'numbers'].includes(ext)) path = ICON_PATHS.table;
      else if (['ppt', 'pptx', 'odp', 'key'].includes(ext)) path = ICON_PATHS.chart;
      else if (['txt', 'md', 'markdown', 'html', 'htm'].includes(ext)) path = ICON_PATHS.plain;
      else if (['epub'].includes(ext)) path = ICON_PATHS.book;
      else path = ICON_PATHS.doc;
    }
    return '<svg width="' + s + '" height="' + s + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">' + path + '</svg>';
  }

  // ---------- 模式切换 ----------
  function setMode(m) {
    mode = m;
    const sizes = { compact: [COMPACT_SIZE, COMPACT_SIZE], wheel: [WHEEL_W, WHEEL_H], tools: [WHEEL_W, WHEEL_H], merge: [WHEEL_W, WHEEL_H] };
    ball.classList.toggle('hidden', m !== 'compact');
    wheel.classList.toggle('hidden', m === 'compact');
    toolRing.classList.toggle('hidden', m !== 'tools');
    toolCenter.classList.toggle('hidden', m !== 'tools');
    mergePanel.classList.toggle('hidden', m !== 'merge');
    // 光晕：展开轮盘 / 转换中收缩态可见，普通 compact 隐藏
    glowBlobs.classList.toggle('hidden', m === 'compact' && !busy);
    glowBlobs.classList.toggle('fast', busy);
    const [w, h] = sizes[m];
    try { FC.setFloatSize(w, h); } catch (_) {}
  }

  // ---------- 空闲自动隐藏（Mac idleHide：8s 无交互整体隐藏） ----------
  function resetIdle() {
    clearTimeout(idleTimer);
    idleTimer = setTimeout(() => {
      if (!busy) { try { FC.hideFloat(); } catch (_) {} }
    }, IDLE_HIDE_MS);
  }
  function stopIdle() { clearTimeout(idleTimer); }
  // 任何窗口内鼠标活动重置空闲计时；compact/轮盘态 8s 无操作均整体隐藏（Mac idleHide，杜绝常驻）
  document.addEventListener('mousemove', () => { if (!busy) resetIdle(); });

  // ---------- 轮盘布局（单圈 ≤9；双圈：外圈 9 + 内圈其余交错，与 Mac 一致） ----------
  function renderItems() {
    const targets = Formats.targetsFor(currentExt) || [];
    wheelItems.innerHTML = '';
    const n = targets.length;
    const outerN = Math.min(9, n);
    const innerN = n - outerN;
    const innerStart = innerN > 0 ? 180 / innerN : 0; // Mac 内圈整体旋转半格
    targets.forEach((ext, i) => {
      const tile = document.createElement('div');
      tile.className = 'wheel-item' + (Formats.isMergeTarget(currentExt, ext) ? ' special' : '');
      tile.innerHTML = '<span class="wi-icon">' + iconSvg(ext) + '</span><span class="wi-label">' +
        ((Formats.LABELS && Formats.LABELS[ext]) ? Formats.LABELS[ext] : ext.toUpperCase()) + '</span>';
      tile.dataset.ext = ext;
      const isInner = i >= outerN;
      const slot = isInner ? i - outerN : i;
      const total = isInner ? innerN : outerN;
      const deg = (isInner ? innerStart : 0) + slot * (360 / Math.max(1, total));
      const p = polar(CENTER_X, CENTER_Y, isInner ? RING_INNER : RING_OUTER, deg);
      tile.style.left = p.x + 'px';
      tile.style.top = p.y + 'px';
      tile.addEventListener('click', () => onTileClick(ext));
      tile.addEventListener('dragover', (e) => { e.preventDefault(); tile.classList.add('dragover'); });
      tile.addEventListener('dragleave', () => tile.classList.remove('dragover'));
      tile.addEventListener('drop', (e) => {
        e.preventDefault();
        e.stopPropagation();
        tile.classList.remove('dragover');
        const files = pathsOf(e.dataTransfer);
        if (!files.length) return;
        currentFiles = files;
        currentExt = Formats.extOf(files[0]) || currentExt;
        if (Formats.isMergeTarget(currentExt, ext)) openMerge(ext, files);
        else startConvert(ext, files);
      });
      wheelItems.appendChild(tile);
    });
    cdLabel.textContent = currentExt ? currentExt.toUpperCase() : '';
  }

  function clearCenter() {
    centerDisc.classList.remove('converting', 'done');
    cdFolder.innerHTML = '';
    cdLabel.textContent = currentExt ? currentExt.toUpperCase() : '';
    ball.classList.remove('done');
    ballCore.innerHTML = '';
  }

  // ---------- 展开 / 收起 ----------
  function openWheel(files) {
    clearTimeout(hoverTimer);
    clearTimeout(doneTimer);
    if (files && files.length) {
      currentFiles = files;
      currentExt = Formats.extOf(files[0]) || currentExt;
    }
    if (!currentExt) {
      showToast(t('floatHint') || '请先拖入文件');
      return;
    }
    const targets = Formats.targetsFor(currentExt);
    if (!targets.length) {
      showToast('该格式暂不支持转换');
      return;
    }
    clearCenter();
    renderItems();
    setMode('wheel');
    resetIdle();
  }
  function closeWheel() {
    clearTimeout(hoverTimer);
    clearTimeout(doneTimer);
    clearCenter();
    setMode('compact');
    resetIdle();
  }

  // ---------- 二级图片工具环（macOS 图片源悬停展开） ----------
  const TOOLS = [
    { op: 'compress', icon: 'comp', label: t('compressTool') || '压缩' },
    { op: 'metadata', icon: 'meta', label: t('stripMetaTool') || '去元数据' },
    { op: 'crop', icon: 'crop', label: '裁剪' },
    { op: 'background', icon: 'bg', label: '加背景' },
    { op: 'blackout', icon: 'redact', label: '涂黑' },
    { op: 'watermark', icon: 'wm', label: '水印' },
    { op: 'color', icon: 'color', label: '色彩' }
  ];
  const TOOL_ICON_PATHS = {
    comp: '<path d="M8 4v16M4 8v8M13 6l6 6-6 6"/>',
    meta: '<path d="M4 5h16M8 10h8M10 14h4"/>',
    crop: '<path d="M4 7h9a2 2 0 0 1 2 2v9M7 4v9a2 2 0 0 0 2 2h9"/>',
    bg: '<rect x="3.5" y="3.5" width="17" height="17" rx="2"/><rect x="7.5" y="7.5" width="9" height="9" rx="1.5"/>',
    redact: '<rect x="4" y="7" width="16" height="10" rx="1.5"/><circle cx="12" cy="12" r="2"/>',
    wm: '<path d="M12 4a8 8 0 1 0 0 16 8 8 0 0 0 0-16z"/><path d="M12 8.5v7M12 8.5L9 11.5M12 8.5l3 3"/>',
    color: '<circle cx="12" cy="12" r="7.5"/><path d="M12 4.5a7.5 7.5 0 0 1 0 15c-2.5 0-4-2.5-2.5-4.5s2.5-1.5 1-3.5S8 9 10 7.5 14 6.5 12 4.5z"/>'
  };
  function toolIconSvg(key, size) {
    const s = size || 14;
    return '<svg width="' + s + '" height="' + s + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">' +
      (TOOL_ICON_PATHS[key] || '') + '</svg>';
  }
  function renderTools() {
    toolRing.innerHTML = '';
    TOOLS.forEach((tool, i) => {
      const n = TOOLS.length;
      const p = polar(CENTER_X, CENTER_Y, RING_OUTER + 4, (360 / n) * i);
      const el = document.createElement('div');
      el.className = 'tool-item';
      el.style.left = p.x + 'px';
      el.style.top = p.y + 'px';
      el.dataset.op = tool.op;
      el.innerHTML = '<span class="ti-icon">' + toolIconSvg(tool.icon) + '</span><span>' + tool.label + '</span>';
      el.addEventListener('click', () => runTool(tool.op));
      toolRing.appendChild(el);
    });
  }
  function openTools() {
    if (busy || mode !== 'wheel') return;
    renderTools();
    tcName.textContent = currentFiles[0] ? currentFiles[0].split(/[\\/]/).pop() : '选择一张图片';
    tcPreview.innerHTML = '';
    if (currentFiles[0] && Formats.categoryOf(currentExt) === 'image') {
      const img = document.createElement('img');
      img.src = 'file:///' + encodeURI(currentFiles[0]).replace(/%2F/g, '/');
      tcPreview.appendChild(img);
    } else {
      tcPreview.textContent = '';
    }
    setMode('tools');
    resetIdle();
  }
  function closeTools() { setMode('wheel'); resetIdle(); }
  async function runTool(op) {
    let file = currentFiles[0];
    if (!file) {
      const picked = await FC.pickFiles();
      if (!picked || !picked.length) return;
      file = picked[0];
      currentFiles = picked;
      currentExt = Formats.extOf(file) || currentExt;
    }
    const run = $('tcRun');
    run.disabled = true;
    try {
      const r = await FC.imageOp(op, file, {});
      if (r && r.ok) {
        showToast((op === 'metadata' ? t('stripMetaDone') : '处理完成') + (r.out ? '：' + r.out : ''));
      } else {
        showToast('处理失败：' + ((r && r.error) || '未知错误'));
      }
    } catch (err) {
      showToast('处理失败：' + String(err.message || err));
    }
    run.disabled = false;
  }

  // ---------- 合并面板 ----------
  function openMerge(targetExt, files) {
    clearTimeout(hoverTimer);
    mergeKind = Formats.categoryOf(currentExt) === 'pdf' ? (targetExt === 'pptx' ? 'pptxFromPdf' : 'merge') : (targetExt === 'pptx' ? 'pptx' : 'pdf');
    mergeFiles = (files && files.length) ? files.slice() : [];
    renderMerge();
    setMode('merge');
    resetIdle();
  }
  function renderMerge() {
    const isPdfSrc = Formats.categoryOf(currentExt) === 'pdf';
    const opts = isPdfSrc ? [
      { key: 'merge', label: '合并 PDF' },
      { key: 'pptxFromPdf', label: 'PDF 转 PPT' }
    ] : [
      { key: 'pdf', label: '合并为 PDF' },
      { key: 'pptx', label: '合并为 PPT' }
    ];
    mpChips.innerHTML = '';
    opts.forEach((o) => {
      const chip = document.createElement('div');
      chip.className = 'mp-chip' + (mergeKind === o.key ? ' active' : '');
      chip.textContent = o.label;
      chip.addEventListener('click', () => { mergeKind = o.key; renderMerge(); });
      mpChips.appendChild(chip);
    });
    $('mpTitle').textContent = opts.find((o) => o.key === mergeKind) ? opts.find((o) => o.key === mergeKind).label : '合并';
    mpList.innerHTML = '';
    if (!mergeFiles.length) {
      const empty = document.createElement('div');
      empty.className = 'mp-empty';
      empty.textContent = t('mergeEmpty');
      mpList.appendChild(empty);
    } else {
      mergeFiles.forEach((f, i) => {
        const row = document.createElement('div');
        row.className = 'mp-row';
        const name = document.createElement('span');
        name.className = 'mp-name';
        name.textContent = f.split(/[\\/]/).pop();
        const del = document.createElement('button');
        del.className = 'mp-del';
        del.textContent = 'x';
        del.addEventListener('click', () => { mergeFiles.splice(i, 1); renderMerge(); });
        row.appendChild(name);
        row.appendChild(del);
        mpList.appendChild(row);
      });
    }
    mpHint.textContent = mergeFiles.length ? t('mergeHintN', { n: mergeFiles.length }) : t('mergeHint');
  }
  function closeMerge() { mergeFiles = []; setMode('wheel'); resetIdle(); }
  async function startMerge() {
    if (!mergeFiles.length) { showToast('请先添加文件'); return; }
    await startConvert(mergeKind === 'merge' ? 'merge' : 'pptx', mergeFiles, { fromMerge: true });
  }

  // ---------- 转换流程（对齐 Mac：开始收缩小圆光晕，完成文件夹 5s 后整体隐藏） ----------
  function setBusy(v) {
    busy = v;
    glowBlobs.classList.toggle('fast', v);
    if (mode === 'compact') glowBlobs.classList.toggle('hidden', !v);
  }
  async function startConvert(targetExt, files, opts) {
    opts = opts || {};
    if (busy) return;
    // 收缩为小圆 + 快速光晕（Mac beginConverting）
    clearCenter();
    setMode('compact');
    setBusy(true);
    currentTarget = targetExt;
    try {
      const r = files.length > 1 && !opts.fromMerge
        ? await convertQueue(targetExt, files)
        : await FC.convert(files, targetExt);
      if (r && r.ok) {
        const out = r.out;
        lastOutput = Array.isArray(out) ? (out[out.length - 1] || null) : (out || null);
        doneState(lastOutput, files.length > 1 && !opts.fromMerge ? r.results : null);
      } else {
        throw new Error((r && r.error) || '转换失败');
      }
    } catch (err) {
      setBusy(false);
      clearCenter();
      showToast(t('convertFail') + '：' + String(err.message || err));
      setMode('wheel');
      resetIdle();
    }
  }
  async function convertQueue(targetExt, files) {
    return FC.convertQueue(files, targetExt);
  }
  function doneState(out, results) {
    setBusy(false);
    // 完成态：小圆显示文件夹图标（Mac showCompleted）
    ball.classList.add('done');
    ballCore.innerHTML = FOLDER_SVG;
    const okCount = results ? results.filter((r) => r.ok).length : (out ? 1 : 0);
    const failCount = results ? results.filter((r) => !r.ok).length : 0;
    showToast(t('convertSuccess') + (results ? '（成功 ' + okCount + '，失败 ' + failCount + '）' : ''), 3200);
    if (FC.beep) { try { FC.beep(); } catch (_) {} }
    // 5s 后整体隐藏（不再退回常驻形态）
    clearTimeout(doneTimer);
    doneTimer = setTimeout(() => { try { FC.hideFloat(); } catch (_) {} }, DONE_HIDE_MS);
  }
  function onDoneClicked() {
    if (!lastOutput) return;
    try { FC.showItemInFolder(lastOutput); } catch (_) {}
    clearTimeout(doneTimer);
    clearCenter();
    try { FC.hideFloat(); } catch (_) {}
  }

  // ---------- 事件绑定 ----------
  function onTileClick(ext) {
    if (busy) return;
    if (Formats.isMergeTarget(currentExt, ext)) { openMerge(ext, currentFiles); return; }
    if (!currentFiles.length) {
      FC.pickFiles().then((files) => {
        if (!files || !files.length) return;
        currentFiles = files;
        currentExt = Formats.extOf(files[0]) || currentExt;
        startConvert(ext, files);
      });
    } else {
      startConvert(ext, currentFiles);
    }
  }

  function init() {
    // 首次窗口尺寸对齐紧凑态（避免 84px 默认裁切 90px 小球）
    try { FC.setFloatSize(COMPACT_SIZE, COMPACT_SIZE); } catch (_) {}
    // 主窗口拖入文件呼出（macOS 拖拽驱动入口）：直接展开轮盘
    if (FC.onFloatOpenFiles) FC.onFloatOpenFiles((files) => {
      if (files && files.length) openWheel(files);
    });

    // 小球核心：拖入展开；点击 = 完成态打开文件夹 / 选择文件展开（平台补偿，Mac 无常驻点击）
    ballCore.addEventListener('click', () => {
      if (mode !== 'compact') return;
      if (busy) return;
      if (centerDisc.classList.contains('done') || ball.classList.contains('done')) { onDoneClicked(); return; }
      if (!currentExt) {
        FC.pickFiles().then((files) => {
          if (!files || !files.length) return;
          currentFiles = files;
          currentExt = Formats.extOf(files[0]) || currentExt;
          openWheel(files);
        });
        return;
      }
      openWheel();
    });
    ballCore.addEventListener('dragover', (e) => { e.preventDefault(); ball.classList.add('dragover'); });
    ballCore.addEventListener('dragleave', () => ball.classList.remove('dragover'));
    ballCore.addEventListener('drop', (e) => {
      e.preventDefault();
      ball.classList.remove('dragover');
      const files = pathsOf(e.dataTransfer);
      if (!files.length) return;
      currentFiles = files;
      currentExt = Formats.extOf(files[0]) || currentExt;
      openWheel(files);
    });

    // 右键菜单（核心区）
    ballCore.addEventListener('contextmenu', (e) => { e.preventDefault(); FC.showContextMenu(); });

    // 完成态文件夹点击
    cdFolder.addEventListener('click', onDoneClicked);

    // 工具环：返回 / 应用
    $('tcBack').addEventListener('click', closeTools);
    $('tcRun').addEventListener('click', () => {
      const active = toolRing.querySelector('.tool-item.active');
      if (active) runTool(active.dataset.op || TOOLS[0].op);
    });
    // 工具环中心悬停 1.5s 展开（图片源，Mac hover 触发二级菜单）
    centerDisc.addEventListener('mouseenter', () => {
      if (mode !== 'wheel' || busy || Formats.categoryOf(currentExt) !== 'image') return;
      clearTimeout(hoverTimer);
      hoverTimer = setTimeout(openTools, HOVER_DELAY_MS);
    });
    centerDisc.addEventListener('mouseleave', () => { clearTimeout(hoverTimer); });

    // 合并面板
    $('mpCloseX').addEventListener('click', closeMerge);
    $('mpAdd').addEventListener('click', async () => {
      const files = await FC.pickFiles();
      if (files && files.length) { mergeFiles = mergeFiles.concat(files); renderMerge(); resetIdle(); }
    });
    $('mpConvert').addEventListener('click', startMerge);
    mergePanel.addEventListener('dragover', (e) => { e.preventDefault(); mergePanel.classList.add('dragover'); });
    mergePanel.addEventListener('dragleave', () => mergePanel.classList.remove('dragover'));
    mergePanel.addEventListener('drop', (e) => {
      e.preventDefault();
      mergePanel.classList.remove('dragover');
      const files = pathsOf(e.dataTransfer);
      if (files.length) { mergeFiles = mergeFiles.concat(files); renderMerge(); resetIdle(); }
    });

    // 窗口级兜底拖入：未命中任何 drop 目标时也收到文件
    window.addEventListener('dragover', (e) => e.preventDefault());
    window.addEventListener('drop', (e) => {
      e.preventDefault();
      const files = pathsOf(e.dataTransfer);
      if (!files.length) return;
      currentFiles = files;
      currentExt = Formats.extOf(files[0]) || currentExt;
      if (mode === 'merge') { mergeFiles = mergeFiles.concat(files); renderMerge(); resetIdle(); }
      else if (mode === 'compact') { openWheel(files); }
      else { openWheel(files); }
    });

    // Esc 收起轮盘
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && mode !== 'compact' && !busy) {
        if (mode === 'merge') closeMerge(); else if (mode === 'tools') closeTools(); else closeWheel();
      }
    });

    // 批量进度
    FC.onTaskProgress((data) => {
      if (data && data.status === 'converting') {
        showToast((data.index + 1) + '/' + data.total + ' ' + (t('taskConverting') || '转换中'));
      }
    });
  }

  const FOLDER_SVG = '<svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7z" fill="rgba(255,255,255,0.12)"/></svg>';

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
