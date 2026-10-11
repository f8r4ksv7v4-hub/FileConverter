// main.js - 主页面（1:1 复刻 macOS ContentView：拖放区 + 任务列表 + 设置）
'use strict';
(function () {
  const FC = window.fc;
  const Formats = window.Formats;
  const Dict = (window.I18n && I18n.dicts) ? (I18n.dicts.zh || {}) : {};
  const $ = (id) => document.getElementById(id);

  const toastEl = $('toast');
  function showToast(msg, ms) {
    toastEl.textContent = msg;
    toastEl.classList.remove('hidden');
    clearTimeout(showToast._tm);
    showToast._tm = setTimeout(() => toastEl.classList.add('hidden'), ms || 2400);
  }
  function pathsOf(dt) {
    if (!dt || !dt.files || !dt.files.length) return [];
    const out = [];
    for (const f of dt.files) {
      try { out.push(FC.getPathForFile(f)); } catch (_) { out.push(f.path || f.name); }
    }
    return out.filter(Boolean);
  }
  function iconOf(path) {
    const ext = Formats.extOf(path);
    const cat = Formats.categoryOf(ext);
    const map = { image: '🖼', video: '🎬', audio: '🎵', pdf: '📄', document: '📃' };
    return map[cat] || '📁';
  }

  // ---------- 视图切换 ----------
  function showView(name) {
    document.querySelectorAll('.view').forEach((v) => v.classList.remove('active'));
    $('view' + (name === 'settings' ? 'Settings' : 'Convert')).classList.add('active');
  }

  // ---------- 任务列表 ----------
  const taskRows = new Map(); // filePath -> {el, statusEl, barEl}
  function addTaskRow(filePath, index, total) {
    const list = $('taskList');
    list.querySelector('.task-empty') && list.querySelector('.task-empty').remove();
    const row = document.createElement('div');
    row.className = 'task-row';
    row.innerHTML =
      '<div class="task-icon">' + iconOf(filePath) + '</div>' +
      '<div class="task-main">' +
        '<div class="task-name">' + escapeHtml(filePath.split(/[\\/]/).pop()) + '</div>' +
        '<div class="task-status">' + (index + 1) + '/' + total + ' 等待中</div>' +
        '<div class="task-progress"><span style="width:0%"></span></div>' +
      '</div>';
    list.appendChild(row);
    taskRows.set(filePath, {
      el: row,
      status: row.querySelector('.task-status'),
      bar: row.querySelector('.task-progress span')
    });
    return taskRows.get(filePath);
  }
  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }

  // ---------- 转换 ----------
  async function startConvert(files) {
    if (!files || !files.length) return;
    const total = files.length;
    const target = Formats.targetsFor(Formats.extOf(files[0]))[0];
    if (!target) { showToast('该格式暂不支持转换'); return; }
    $('statusBar').textContent = '正在转换 ' + total + ' 个文件 → ' + target.toUpperCase() + '…';
    try {
      const r = await FC.convertQueue(files, target);
      const ok = r.results ? r.results.filter((x) => x.ok).length : 0;
      const fail = r.results ? r.results.filter((x) => !x.ok).length : 0;
      $('statusBar').textContent = '完成：成功 ' + ok + '，失败 ' + fail;
      if (FC.beep && fail === 0) { try { FC.beep(); } catch (_) {} }
      showToast('转换完成（成功 ' + ok + '，失败 ' + fail + '）');
    } catch (err) {
      $('statusBar').textContent = '转换失败';
      showToast('转换失败：' + String(err.message || err));
    }
  }

  FC.onTaskProgress((data) => {
    if (!data) return;
    const t = taskRows.get(data.file);
    if (!t) return;
    if (data.status === 'converting') {
      t.status.textContent = (data.index + 1) + '/' + data.total + ' 转换中…';
      t.bar.style.width = '55%';
    } else if (data.status === 'done') {
      t.status.textContent = '✓ 完成';
      t.bar.style.width = '100%';
      // 完成行追加"显示"按钮
      const btn = document.createElement('button');
      btn.className = 'task-reveal';
      btn.textContent = '显示';
      btn.addEventListener('click', () => { try { FC.showItemInFolder(data.out); } catch (_) {} });
      t.el.appendChild(btn);
    } else if (data.status === 'failed') {
      t.status.textContent = '✗ ' + String(data.error || '失败');
      t.bar.style.width = '100%';
      t.bar.style.background = 'rgba(236,72,153,0.7)';
    }
  });

  // ---------- 设置 ----------
  let settings = {};
  async function loadSettings() {
    try { settings = await FC.getSettings() || {}; } catch (_) { settings = {}; }
    $('setLaunch').checked = !!settings.launchAtLogin;
    $('setSound').checked = settings.soundEnabled !== false;
    $('setFloat').checked = settings.floatVisible !== false;
    document.querySelectorAll('.chip[data-lang]').forEach((c) => c.classList.toggle('active', c.dataset.lang === (settings.lang || 'zh')));
  }
  async function saveSettings(patch) {
    settings = Object.assign({}, settings, patch);
    try { await FC.setSettings(patch); } catch (_) {}
    loadSettings();
  }

  // ---------- 初始化 ----------
  function init() {
    // 窗口控制
    $('btnMin').addEventListener('click', () => FC.minimizeWin());
    $('btnClose').addEventListener('click', () => FC.closeWin());

    // 顶栏
    $('btnDonate').addEventListener('click', () => window.open('https://afdian.com/a/xzy_projects'));
    $('btnFeedback').addEventListener('click', () => window.open('https://github.com/f8r4ksv7v4-hub/FileConverter/issues'));
    $('btnUpdate').addEventListener('click', async () => {
      const r = await FC.checkForUpdates();
      if (r && r.ok) {
        showToast(r.hasUpdate ? '发现新版本 ' + r.latest : '当前已是最新版本');
      } else {
        showToast('检查更新失败');
      }
    });
    $('btnDeps').addEventListener('click', () => showToast('文档转 PDF 依赖：docx/txt/md/html 本地离线；DOC/PPT/XLS 等需安装 LibreOffice'));
    $('btnSettings').addEventListener('click', () => showView('settings'));
    $('btnBack').addEventListener('click', () => showView('convert'));

    // 设置页
    $('setLaunch').addEventListener('change', (e) => saveSettings({ launchAtLogin: e.target.checked }));
    $('setSound').addEventListener('change', (e) => saveSettings({ soundEnabled: e.target.checked }));
    $('setFloat').addEventListener('change', (e) => saveSettings({ floatVisible: e.target.checked }));
    document.querySelectorAll('.chip[data-lang]').forEach((c) => c.addEventListener('click', () => saveSettings({ lang: c.dataset.lang })));
    $('btnCheckUpdate').addEventListener('click', async () => {
      const r = await FC.checkForUpdates();
      $('updateDesc').textContent = (r && r.ok) ? (r.hasUpdate ? '发现新版本 ' + r.latest : '当前已是最新版本') : '检查更新失败';
    });
    $('btnRepo').addEventListener('click', () => window.open('https://github.com/f8r4ksv7v4-hub/FileConverter'));
    $('btnAfdian').addEventListener('click', () => window.open('https://afdian.com/a/xzy_projects'));
    FC.appInfo().then((info) => { $('aboutVersion').textContent = 'v' + (info ? info.version : '1.0.0'); });

    // 拖放区：点击选择直接转换；拖入文件呼出悬浮球轮盘选格式（复刻 macOS 拖拽驱动入口）
    $('dropArea').addEventListener('click', async () => {
      const files = await FC.pickFiles();
      if (files && files.length) {
        files.forEach((f, i) => addTaskRow(f, i, files.length));
        startConvert(files);
      }
    });
    $('dropArea').addEventListener('dragover', (e) => { e.preventDefault(); $('dropArea').classList.add('dragover'); });
    $('dropArea').addEventListener('dragleave', () => $('dropArea').classList.remove('dragover'));
    $('dropArea').addEventListener('drop', (e) => {
      e.preventDefault();
      $('dropArea').classList.remove('dragover');
      const files = pathsOf(e.dataTransfer);
      if (!files.length) return;
      // 转交悬浮球轮盘：拖入文件 → 悬浮球出现并展开格式轮盘（与 macOS 一致）
      FC.showFloatWithFiles(files);
      showToast('请在悬浮球上选择转换格式');
    });
    // 窗口级兜底拖入（拖到非拖放区区域同样呼出悬浮球）
    window.addEventListener('dragover', (e) => e.preventDefault());
    window.addEventListener('drop', (e) => {
      e.preventDefault();
      const files = pathsOf(e.dataTransfer);
      if (!files.length) return;
      FC.showFloatWithFiles(files);
      showToast('请在悬浮球上选择转换格式');
    });

    loadSettings();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
