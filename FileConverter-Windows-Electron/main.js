// FileConverter (Windows) - Electron 主进程
// 1:1 复刻 macOS 版（SwiftUI+AppKit 悬浮轮盘）的窗口管理与操作逻辑
'use strict';
const { app, BrowserWindow, ipcMain, Menu, Tray, nativeImage, dialog, shell } = require('electron');
const path = require('path');
const fs = require('fs');
const { autoUpdater } = require('electron-updater');
const Converter = require('./src/converter');
const Formats = require('./src/formats');
const I18n = require('./src/i18n');

const IS_MAC = process.platform === 'darwin';
// 渲染层目录：src/renderer（打包后位于 app.asar 内同一相对位置）
const RENDERER_DIR = path.join(__dirname, 'src', 'renderer');

// ---------- 窗口尺寸常量（与 macOS WheelPanel/WheelView 对应） ----------
const FLOAT_COMPACT = 90;          // 紧凑态：贴顶小球窗口（Mac disc 300 x 0.30 = 90pt）
const FLOAT_WHEEL_W = 400;         // 轮盘展开窗口宽（透明画布，圆盘 300 居中）
const FLOAT_WHEEL_H = 460;         // 轮盘展开窗口高
const FLOAT_MERGE_W = 400;         // 合并面板窗口宽
const FLOAT_MERGE_H = 460;         // 合并面板窗口高
const MAIN_W = 560;                // macOS ContentView 560x500
const MAIN_H = 500;

let floatWin = null;
let mainWin = null;
let tray = null;
let isQuitting = false;

// ---------- 悬浮球位置记忆 ----------
function floatPosFile() { return path.join(app.getPath('userData'), 'float-pos.json'); }
function loadFloatPos() {
  try {
    const p = JSON.parse(fs.readFileSync(floatPosFile(), 'utf8'));
    if (p && Number.isFinite(p.x) && Number.isFinite(p.y)) return { x: p.x, y: p.y };
  } catch (_) {}
  return null;
}
function saveFloatPos() {
  if (!floatWin) return;
  try {
    const [x, y] = floatWin.getPosition();
    fs.writeFileSync(floatPosFile(), JSON.stringify({ x, y }), 'utf8');
  } catch (_) {}
}

// 悬浮球默认贴顶居中（macOS 悬浮球默认吸附屏幕顶部中央）
function defaultFloatPos() {
  try {
    const wa = screen.getPrimaryDisplay().workArea;
    return { x: Math.round(wa.x + (wa.width - FLOAT_COMPACT) / 2), y: wa.y };
  } catch (_) {
    return { x: 400, y: 0 };
  }
}

// ---------- 悬浮球 ----------
function createFloatWin() {
  const pos = loadFloatPos() || defaultFloatPos();
  const opts = {
    width: FLOAT_COMPACT,
    height: FLOAT_COMPACT,
    x: pos.x,
    y: pos.y,
    frame: false,
    transparent: true,
    resizable: false,
    skipTaskbar: true,
    alwaysOnTop: true,
    hasShadow: false,
    focusable: false,       // 不抢焦点：悬浮球常驻不打扰主窗口
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      backgroundThrottling: false
    }
  };
  floatWin = new BrowserWindow(opts);
  // 使用 floating 层级：避免 screen-saver 级置顶干扰文件拖拽与主窗口交互
  floatWin.setAlwaysOnTop(true, 'floating');
  floatWin.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
  floatWin.loadFile(path.join(RENDERER_DIR, 'float.html'));
  // 悬浮球与 macOS 版一致：平时隐藏，仅拖拽/呼出时出现，不做常驻形态
  floatWin.hide();
}

function floatVisible() {
  return floatWin && !floatWin.isDestroyed() && floatWin.isVisible();
}

// ---------- 主窗口（macOS ContentView 560x500 无边框，关闭即隐藏） ----------
function createMainWin() {
  mainWin = new BrowserWindow({
    width: MAIN_W,
    height: MAIN_H,
    minWidth: 520,
    minHeight: 460,
    frame: false,             // macOS 隐藏标题栏；Windows 无边框窗口 + 自绘顶栏
    title: 'FileConverter',
    backgroundColor: '#0f0f16',
    show: false,              // 先隐藏，加载完再显示，避免白屏
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });
  mainWin.loadFile(path.join(RENDERER_DIR, 'main.html'));
  mainWin.once('ready-to-show', () => { if (!isQuitting && mainWin) mainWin.show(); });
  // 关闭 = 隐藏（macOS 行为：关窗即收起，悬浮球/托盘可再次呼出），真正的退出走托盘/设置/悬浮球菜单
  mainWin.on('close', (e) => {
    if (isQuitting) return;
    e.preventDefault();
    mainWin.hide();
  });
  mainWin.on('closed', () => { mainWin = null; });
  // 外链（GitHub/Issues/爱发电等）用系统浏览器打开
  mainWin.webContents.setWindowOpenHandler(({ url }) => {
    if (/^https?:\/\//.test(url)) shell.openExternal(url);
    return { action: 'deny' };
  });
}

function showMainWindow() {
  if (!mainWin || mainWin.isDestroyed()) { createMainWin(); return; }
  if (mainWin.isMinimized()) mainWin.restore();
  mainWin.show();
  mainWin.focus();
}
function toggleMainWindow() {
  if (mainWin && mainWin.isVisible()) { mainWin.hide(); return false; }
  showMainWindow();
  return true;
}

// ---------- 托盘 ----------
function buildTrayMenu() {
  return Menu.buildFromTemplate([
    { label: '打开主窗口', click: () => showMainWindow() },
    {
      label: '显示悬浮球',
      type: 'checkbox',
      checked: floatVisible(),
      click: (item) => {
        if (item.checked) showFloatWindow(); else hideFloatWindow();
      }
    },
    { type: 'separator' },
    { label: '退出 FileConverter', click: () => { isQuitting = true; app.quit(); } }
  ]);
}
function createTray() {
  try {
    const iconPath = path.join(RENDERER_DIR, 'assets', 'icon.png');
    const img = fs.existsSync(iconPath) ? nativeImage.createFromPath(iconPath) : nativeImage.createEmpty();
    if (!img.isEmpty()) {
      tray = new Tray(img.resize({ width: 16, height: 16 }));
      tray.setToolTip('FileConverter');
      tray.setContextMenu(buildTrayMenu());
      tray.on('click', () => showMainWindow());
    }
  } catch (_) { /* 忽略托盘创建失败 */ }
}

function hideFloatWindow() { if (floatWin && !floatWin.isDestroyed()) floatWin.hide(); }
function showFloatWindow() {
  if (!floatWin || floatWin.isDestroyed()) { createFloatWin(); return; }
  floatWin.showInactive(); // 悬浮球不抢焦点
}

// 主窗口拖入文件时呼出悬浮球：显示窗口并把文件交给渲染层打开轮盘（复刻 macOS 拖拽驱动入口）
ipcMain.handle('float:showWithFiles', (_e, files) => {
  if (!floatWin || floatWin.isDestroyed()) createFloatWin();
  if (!floatWin || floatWin.isDestroyed()) return false;
  floatWin.showInactive();
  floatWin.setAlwaysOnTop(true, 'floating');
  // 等渲染层就绪后投递文件（首次加载可能尚未完成）
  const send = () => {
    if (floatWin && !floatWin.isDestroyed()) floatWin.webContents.send('float:openFiles', files || []);
  };
  if (floatWin.webContents.isLoading()) floatWin.webContents.once('did-finish-load', send);
  else send();
  return true;
});

// ---------- IPC ----------
ipcMain.handle('float:convert', async (_e, files, targetExt) => {
  try {
    const out = await Converter.convert(files, targetExt);
    return { ok: true, out };
  } catch (err) {
    return { ok: false, error: String(err.message || err) };
  }
});

// 批量队列转换：主进程按顺序逐文件处理，逐个回传进度（task:progress），失败不中断
ipcMain.handle('main:convertQueue', async (e, files, targetExt) => {
  const wc = e.sender;
  const list = Array.isArray(files) ? files : [files];
  const results = [];
  for (let i = 0; i < list.length; i++) {
    const f = list[i];
    const base = { index: i, total: list.length, file: f, targetExt };
    wc.send('task:progress', { ...base, status: 'converting' });
    try {
      const out = await Converter.convert([f], targetExt);
      results.push({ file: f, ok: true, out });
      wc.send('task:progress', { ...base, status: 'done', out });
    } catch (err) {
      const error = String(err.message || err);
      results.push({ file: f, ok: false, error });
      wc.send('task:progress', { ...base, status: 'failed', error });
    }
  }
  return { ok: true, results };
});

// 图片二级工具：压缩 / 去元数据 / 裁剪 / 背景 / 涂黑 / 水印 / 色彩（sharp 重编码）
ipcMain.handle('tools:imageOp', async (_e, op, filePath, opts) => {
  try {
    const out = await Converter.imageOp(op, filePath, opts || {});
    return { ok: true, out };
  } catch (err) {
    return { ok: false, error: String(err.message || err) };
  }
});

ipcMain.handle('main:pickFiles', async () => {
  const owner = (mainWin && !mainWin.isDestroyed() && mainWin.isVisible()) ? mainWin : floatWin;
  const r = await dialog.showOpenDialog(owner || undefined, {
    properties: ['openFile', 'multiSelections']
  });
  return r.canceled ? [] : r.filePaths;
});

ipcMain.handle('tools:saveImage', async (_e, base64, defaultName) => {
  const owner = (mainWin && !mainWin.isDestroyed() && mainWin.isVisible()) ? mainWin : floatWin;
  const r = await dialog.showSaveDialog(owner || undefined, {
    defaultPath: defaultName || 'FileConverter-' + Date.now() + '.png',
    filters: [{ name: 'PNG 图片', extensions: ['png'] }]
  });
  if (r.canceled || !r.filePath) return { ok: false, error: 'cancelled' };
  try {
    await fs.promises.writeFile(r.filePath, Buffer.from(base64, 'base64'));
    return { ok: true, path: r.filePath };
  } catch (err) {
    return { ok: false, error: String(err.message || err) };
  }
});

ipcMain.handle('main:history', () => {
  const histPath = path.join(app.getPath('userData'), 'history.json');
  try { return JSON.parse(fs.readFileSync(histPath, 'utf8')); } catch (_) { return []; }
});

ipcMain.handle('main:addHistory', (_e, entry) => {
  const histPath = path.join(app.getPath('userData'), 'history.json');
  let hist = [];
  try { hist = JSON.parse(fs.readFileSync(histPath, 'utf8')); } catch (_) {}
  hist.unshift(entry);
  hist = hist.slice(0, 100);
  fs.writeFileSync(histPath, JSON.stringify(hist), 'utf8');
  return hist;
});

ipcMain.handle('main:clearHistory', () => {
  const histPath = path.join(app.getPath('userData'), 'history.json');
  fs.writeFileSync(histPath, '[]', 'utf8');
  return [];
});

ipcMain.handle('settings:get', () => {
  const p = path.join(app.getPath('userData'), 'settings.json');
  try { return JSON.parse(fs.readFileSync(p, 'utf8')); } catch (_) { return { lang: 'zh', autoUpdate: true, launchAtLogin: false, soundEnabled: true, floatVisible: false }; }
});

ipcMain.handle('settings:set', (_e, obj) => {
  const p = path.join(app.getPath('userData'), 'settings.json');
  let cur = {};
  try { cur = JSON.parse(fs.readFileSync(p, 'utf8')); } catch (_) {}
  const merged = { ...cur, ...obj };
  try { app.setLoginItemSettings({ openAtLogin: !!merged.launchAtLogin }); } catch (_) {}
  fs.writeFileSync(p, JSON.stringify(merged), 'utf8');
  // 悬浮球显隐设置联动窗口
  if (obj && typeof obj.floatVisible === 'boolean') {
    if (obj.floatVisible) showFloatWindow(); else hideFloatWindow();
  }
  return merged;
});

ipcMain.handle('app:info', () => ({
  version: app.getVersion(),
  platform: process.platform,
  isMac: IS_MAC
}));

ipcMain.handle('app:quit', () => { isQuitting = true; app.quit(); });

// 打开输出文件所在文件夹（转换完成后悬浮球调用）
ipcMain.handle('app:showItem', (_e, filePath) => {
  if (!filePath) return false;
  shell.showItemInFolder(String(filePath));
  return true;
});

// 悬浮球窗口尺寸（展开轮盘 / 恢复小球）：以当前窗口中心为锚缩放，保持中心不动
ipcMain.on('float:size', (_e, w, h) => {
  if (!floatWin || floatWin.isDestroyed()) return;
  const [x, y] = floatWin.getPosition();
  const [cw, ch] = floatWin.getSize();
  const cx = x + cw / 2, cy = y + ch / 2;
  const nw = Math.max(64, Math.round(w));
  const nh = Math.max(64, Math.round(h));
  floatWin.setBounds({
    x: Math.round(cx - nw / 2),
    y: Math.round(cy - nh / 2),
    width: nw,
    height: nh
  });
});

// 悬浮球拖动（IPC 增量移动 + 位置记忆）
ipcMain.on('float:move', (_e, dx, dy) => {
  if (!floatWin || floatWin.isDestroyed()) return;
  const [x, y] = floatWin.getPosition();
  floatWin.setPosition(Math.round(x + (dx || 0)), Math.round(y + (dy || 0)));
});
ipcMain.on('float:savePos', () => { saveFloatPos(); });

// 悬浮球显隐 / 复位 / 主窗口呼出（渲染层与托盘共用）
ipcMain.on('float:hide', () => { hideFloatWindow(); });
ipcMain.on('float:show', () => { showFloatWindow(); });
ipcMain.handle('float:toggle', () => {
  if (floatVisible()) { hideFloatWindow(); return false; }
  showFloatWindow(); return true;
});
ipcMain.handle('float:resetPos', () => {
  if (!floatWin || floatWin.isDestroyed()) return { ok: false };
  const p = defaultFloatPos();
  floatWin.setPosition(p.x, p.y);
  return { ok: true, x: p.x, y: p.y };
});
ipcMain.handle('float:isVisible', () => floatVisible());
ipcMain.handle('win:showMain', () => { showMainWindow(); return true; });
ipcMain.handle('win:toggleMain', () => toggleMainWindow());
ipcMain.handle('win:mainVisible', () => !!(mainWin && !mainWin.isDestroyed() && mainWin.isVisible()));
// 主窗口最小化 / 关闭（无边框自绘顶栏按钮；关闭走 close 事件转 hide）
ipcMain.on('win:minimize', () => { if (mainWin && !mainWin.isDestroyed()) mainWin.minimize(); });
ipcMain.on('win:close', () => { if (mainWin && !mainWin.isDestroyed()) mainWin.close(); });

// 悬浮球右键菜单（macOS 悬浮球右键=呼出菜单：打开主窗口/隐藏/复位/退出）
ipcMain.handle('float:contextMenu', () => {
  if (!floatWin) return;
  const menu = Menu.buildFromTemplate([
    { label: '打开主窗口', click: () => showMainWindow() },
    {
      label: '隐藏悬浮球',
      click: () => {
        hideFloatWindow();
        try {
          const p = path.join(app.getPath('userData'), 'settings.json');
          const cur = JSON.parse(fs.readFileSync(p, 'utf8'));
          cur.floatVisible = false;
          fs.writeFileSync(p, JSON.stringify(cur), 'utf8');
        } catch (_) {}
      }
    },
    { label: '复位到屏幕顶部中央', click: () => { ipcMain.emit('float:resetPos'); } },
    { type: 'separator' },
    { label: '退出 FileConverter', click: () => { isQuitting = true; app.quit(); } }
  ]);
  menu.popup({ window: floatWin });
  return true;
});

// 系统提示音（转换完成声音反馈）
ipcMain.on('app:beep', () => { try { shell.beep(); } catch (_) {} });

// 手动检查更新（设置页"检查更新"按钮调用）
ipcMain.handle('app:checkUpdate', async () => {
  try {
    const info = await autoUpdater.checkForUpdates();
    const upd = info && info.updateInfo;
    const latest = upd && upd.version ? upd.version : null;
    const current = app.getVersion();
    let hasUpdate = false;
    if (latest && latest !== current) {
      try { hasUpdate = require('semver').gt(latest, current); } catch (_) { hasUpdate = true; }
    }
    return { ok: true, current, latest, hasUpdate };
  } catch (err) {
    return { ok: false, error: String((err && err.message) || err) };
  }
});

// ---------- 自动更新 ----------
function setupAutoUpdater() {
  autoUpdater.autoDownload = true;
  autoUpdater.autoInstallOnAppQuit = true;
  autoUpdater.on('error', (e) => { console.error('AutoUpdater error:', e && (e.message || e)); });
  autoUpdater.on('update-downloaded', () => {
    dialog.showMessageBox({
      type: 'info',
      title: 'FileConverter',
      message: '发现新版本，是否立即安装？',
      buttons: ['现在安装', '稍后'],
      defaultId: 0,
      cancelId: 1
    }).then(({ response }) => {
      if (response === 0) autoUpdater.quitAndInstall();
    });
  });
}

function checkForUpdates() {
  const p = path.join(app.getPath('userData'), 'settings.json');
  try {
    const s = JSON.parse(fs.readFileSync(p, 'utf8'));
    if (s.autoUpdate === false) return;
  } catch (_) {}
  try { autoUpdater.checkForUpdates(); } catch (_) {}
}

// ---------- 启动 ----------
const gotLock = app.requestSingleInstanceLock();
if (!gotLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    showMainWindow();
  });

  app.whenReady().then(() => {
    try { Menu.setApplicationMenu(null); } catch (_) {}
    if (process.env.FILE_CONVERTER_DISABLE_TRAY !== '1') createTray();
    createFloatWin();
    if (!IS_MAC) {
      // Windows：启动显示主窗口（macOS 是点击 Dock 呼出；Windows 无 Dock，首次启动直接展示）
      createMainWin();
    }
    setupAutoUpdater();
    setTimeout(checkForUpdates, 8000);
  });

  app.on('activate', () => {
    showMainWindow();
  });

  app.on('before-quit', () => { isQuitting = true; });

  app.on('window-all-closed', () => {
    // 悬浮球/主窗口常驻；退出走应用内"退出"
  });
}
