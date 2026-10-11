// FileConverter - preload（contextBridge 暴露安全 API）
'use strict';
const { contextBridge, ipcRenderer, webUtils } = require('electron');

contextBridge.exposeInMainWorld('fc', {
  convert: (files, targetExt) => ipcRenderer.invoke('float:convert', files, targetExt),
  // 批量队列：主进程按顺序逐文件转换，进度通过 onTaskProgress 回调
  convertQueue: (files, targetExt) => ipcRenderer.invoke('main:convertQueue', files, targetExt),
  onTaskProgress: (cb) => {
    const listener = (_e, data) => cb(data);
    ipcRenderer.on('task:progress', listener);
    return () => ipcRenderer.removeListener('task:progress', listener);
  },
  // 图片二级工具：压缩 / 去元数据 / 裁剪 / 背景 / 涂黑 / 水印 / 色彩（sharp 重编码）
  imageOp: (op, filePath, opts) => ipcRenderer.invoke('tools:imageOp', op, filePath, opts),
  pickFiles: () => ipcRenderer.invoke('main:pickFiles'),
  saveImage: (base64, defaultName) => ipcRenderer.invoke('tools:saveImage', base64, defaultName),
  getHistory: () => ipcRenderer.invoke('main:history'),
  addHistory: (entry) => ipcRenderer.invoke('main:addHistory', entry),
  clearHistory: () => ipcRenderer.invoke('main:clearHistory'),
  getSettings: () => ipcRenderer.invoke('settings:get'),
  setSettings: (obj) => ipcRenderer.invoke('settings:set', obj),
  appInfo: () => ipcRenderer.invoke('app:info'),
  checkForUpdates: () => ipcRenderer.invoke('app:checkUpdate'),
  showItemInFolder: (filePath) => ipcRenderer.invoke('app:showItem', filePath),
  quit: () => ipcRenderer.invoke('app:quit'),
  // 悬浮球窗口控制（单向通知，主进程 on 接收）
  setFloatSize: (w, h) => ipcRenderer.send('float:size', w, h),
  moveFloat: (dx, dy) => ipcRenderer.send('float:move', dx, dy),
  saveFloatPos: () => ipcRenderer.send('float:savePos'),
  // 悬浮球显隐 / 复位 / 右键菜单 / 主窗口呼出
  hideFloat: () => ipcRenderer.send('float:hide'),
  showFloat: () => ipcRenderer.send('float:show'),
  // 主窗口拖入文件：呼出悬浮球并预置轮盘（macOS 拖拽驱动入口）
  showFloatWithFiles: (files) => ipcRenderer.invoke('float:showWithFiles', files),
  onFloatOpenFiles: (cb) => {
    const listener = (_e, files) => cb(files);
    ipcRenderer.on('float:openFiles', listener);
    return () => ipcRenderer.removeListener('float:openFiles', listener);
  },
  toggleFloat: () => ipcRenderer.invoke('float:toggle'),
  resetFloatPos: () => ipcRenderer.invoke('float:resetPos'),
  floatVisible: () => ipcRenderer.invoke('float:isVisible'),
  showContextMenu: () => ipcRenderer.invoke('float:contextMenu'),
  showMainWin: () => ipcRenderer.invoke('win:showMain'),
  toggleMainWin: () => ipcRenderer.invoke('win:toggleMain'),
  mainWinVisible: () => ipcRenderer.invoke('win:mainVisible'),
  // 主窗口窗口控制（无边框自绘顶栏：最小化 / 关闭=隐藏）
  minimizeWin: () => ipcRenderer.send('win:minimize'),
  closeWin: () => ipcRenderer.send('win:close'),
  // 提示音
  beep: () => ipcRenderer.send('app:beep'),
  // Electron 32+ 已移除 File.path，拖拽取路径必须走 webUtils
  getPathForFile: (file) => webUtils.getPathForFile(file),
  platform: process.platform
});
