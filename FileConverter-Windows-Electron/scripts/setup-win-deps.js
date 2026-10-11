#!/usr/bin/env node
/**
 * setup-win-deps.js
 * 一键安装 Windows 平台原生依赖（支持在 macOS 上交叉打包时使用）。
 *
 * 背景：npm 11 在 macOS 上安装带 os/cpu 平台限制的包（如
 * @img/sharp-win32-x64、@napi-rs/canvas-win32-x64-msvc）时会按当前平台
 * 过滤掉，导致 Windows 打包产物缺少原生二进制、首次启动即崩溃。
 *
 * 方案：用 `npm pack` 直接下载目标平台的 tarball，解压注入
 * node_modules/<包名>/。不依赖 npm 的平台过滤行为，幂等可重复执行。
 *
 * 用法：
 *   npm run setup:win-deps
 */
'use strict';

const { execSync } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const PKG = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8'));

// 需要保证进入 node_modules 的平台包：{ 包名, 版本(来自 package.json) }
const TARGETS = [
  {
    name: '@img/sharp-win32-x64',
    version: PKG.dependencies.sharp || PKG.optionalDependencies['@img/sharp-win32-x64'] || '^0.33.5',
  },
  {
    name: '@napi-rs/canvas-win32-x64-msvc',
    version: PKG.dependencies['@napi-rs/canvas-win32-x64-msvc'] || '^0.1.80',
  },
];

function pkgInstalled(name) {
  try {
    const p = path.join(ROOT, 'node_modules', name);
    return fs.existsSync(p) && fs.existsSync(path.join(p, 'package.json'));
  } catch (_) {
    return false;
  }
}

/** npm pack 下载 tarball 并解压注入 node_modules/<name> */
function injectPlatformPkg(name, version) {
  const spec = `${name}@${version}`;
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'win-deps-'));
  try {
    console.log(`[setup-win-deps] 下载 ${spec} ...`);
    let out = '';
    try {
      out = execSync(`npm pack ${spec} --pack-destination "${tmp}"`, {
        cwd: ROOT,
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'pipe'],
      });
    } catch (e) {
      out = `${String(e.stdout || '')}${String(e.stderr || '')}`;
    }

    // npm pack 成功时 stdout 末尾一行是 tarball 文件名
    const lines = out.split('\n').map((s) => s.trim()).filter(Boolean);
    let tgzName = lines[lines.length - 1] || '';
    if (!/\.tgz$/.test(tgzName)) {
      const m = out.match(/([^\s"'<>]+\.tgz)/);
      tgzName = m ? m[1] : '';
    }
    const tgzPath = path.join(tmp, tgzName);
    if (!tgzName || !fs.existsSync(tgzPath)) {
      throw new Error(`无法获取 ${spec} 的 tarball：${out.slice(-400)}`);
    }

    console.log(`[setup-win-deps] 解压注入 ${name} ...`);
    const extractDir = path.join(tmp, 'x');
    fs.mkdirSync(extractDir);
    execSync(`tar -xzf "${tgzPath}" -C "${extractDir}"`, { stdio: 'inherit' });

    const target = path.join(ROOT, 'node_modules', name);
    fs.rmSync(target, { recursive: true, force: true });
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.renameSync(path.join(extractDir, 'package'), target);
    console.log(`[setup-win-deps] 已注入: ${name}`);
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
}

function main() {
  console.log(`[setup-win-deps] 平台: ${process.platform}/${process.arch}  目标: Windows x64\n`);
  let changed = false;

  for (const t of TARGETS) {
    if (pkgInstalled(t.name)) {
      console.log(`[setup-win-deps] OK  已存在: ${t.name}`);
      continue;
    }
    console.log(`[setup-win-deps] MISS 缺失: ${t.name}`);
    injectPlatformPkg(t.name, t.version);
    changed = true;
  }

  console.log('\n[setup-win-deps] 最终校验:');
  let ok = true;
  for (const t of TARGETS) {
    const installed = pkgInstalled(t.name);
    console.log(`  ${installed ? 'PASS' : 'FAIL'}  ${t.name}  ${installed ? '(已在 node_modules)' : '(仍缺失!)'}`);
    if (!installed) ok = false;
  }

  if (!ok) {
    console.error('\n[setup-win-deps] 失败：仍有 Windows 平台依赖缺失，请检查网络后重试。');
    process.exit(1);
  }

  if (!changed) {
    console.log('\n[setup-win-deps] 全部依赖已就绪，无需安装。');
  } else {
    console.log('\n[setup-win-deps] 完成：Windows 平台依赖已就绪。现在可以执行 npm run dist:win 打包。');
  }
}

main();
