# FileConverter

FileConverter 是一款 macOS 本地文件转换工具，基于 SwiftUI + AppKit 开发，所有转换均在本地完成，不上传云端，保护你的文件隐私。

<p align="center">
  <img src="https://raw.githubusercontent.com/f8r4ksv7v4-hub/FileConverter/main/images/screenshot-01.jpg" alt="FileConverter 宣传图" width="720">
</p>

## 应用预览

<p align="center">
  <img src="https://raw.githubusercontent.com/f8r4ksv7v4-hub/FileConverter/main/images/screenshot-02.jpg" alt="功能一览" width="400">
  <img src="https://raw.githubusercontent.com/f8r4ksv7v4-hub/FileConverter/main/images/screenshot-04.jpg" alt="图片工具演示" width="400">
</p>

<p align="center">
  <img src="https://raw.githubusercontent.com/f8r4ksv7v4-hub/FileConverter/main/images/screenshot-05.jpg" alt="文档转换演示" width="400">
  <img src="https://raw.githubusercontent.com/f8r4ksv7v4-hub/FileConverter/main/images/screenshot-06.jpg" alt="更多功能等你发现" width="400">
</p>

## ⚠️ 首次安装提示（重要）

由于应用采用 **ad-hoc 签名**（未申请 Apple Developer ID 公证），首次启动时 macOS 的 Gatekeeper 安全机制可能会拦截并提示 **「无法检查 App 是否包含恶意软件」** 或 **「来自身份不明的开发者」**。这是未公证 App 的常规提示，并非应用本身存在问题。

请按以下任一种 **Apple 官方支持的方式** 打开：

**方式一（推荐）：右键菜单打开**

1. 在「访达」中找到 `FileConverter.app`（请勿通过启动台操作）
2. **按住 Control 键点按**（或右键）App 图标
3. 在弹出的快捷菜单中选择 **「打开」**
4. 再次点按 **「打开」** 确认

此后应用会被保存为安全性例外，之后即可像普通 App 一样直接双击打开。

**方式二：在系统设置中允许**

1. 先直接双击尝试打开（会被阻止）
2. 打开 **「系统设置」→「隐私与安全性」**，向下滚动到 **「安全性」** 区域
3. 点按 **「仍要打开」** 按钮（该按钮在你尝试打开 App 后 **一小时内** 可用）
4. 输入你的登录密码，点按「好」

应用会被保存为安全性设置的例外项，今后双击即可正常打开。

> 说明：以上步骤出自 [Apple 官方支持文档](https://support.apple.com/zh-cn/guide/mac-help/mchleab3a043/mac) 与 [打开来自身份不明开发者的 Mac App](https://support.apple.com/guide/mac-help/mh40616/mac)。如果你对安全性有任何疑虑，欢迎通过 Issues 反馈，也可以自行检查源码后决定是否使用。

## 更新记录

### v3.0-windows（2026-10-11）
- Windows 版全面重构（C# WPF）：放弃 Electron 方案，以 FileFlipper（MIT）Windows 源码为基础重写，UI 对齐 macOS 版视觉（紫粉黄三色渐变光晕、磨砂半透明气泡、圆盘轮盘），拖拽显隐逻辑与 Mac 版一致
- 转换能力大幅增强：图片互转、PDF（转图 / 文本 / Markdown / Word）、文档互转、PPT→PDF/MD、表格→PDF、音视频压缩与转码、OCR 文字识别、一键抠图，以及图片 / PDF 工具（裁剪、压缩、清理、旋转、拆分、合并）
- 托盘常驻 + 右键「发送到」快捷入口；自包含单文件，无需安装 .NET

### v3.0（2026-10-11）
- 新增 PPTX / XLSX 转 Markdown 输出
- PDF 轮盘补齐工具按钮：压缩 PDF、清除元数据、旋转 90°、拆分每页
- 多张图片可合并为单个 PDF / PPTX
- Markdown 输出名称统一为「md」


### v2.11（2026-10-10）
- docx→PDF 转换回归稳定输出：移除对嵌入截图填写线的过度处理，封面与下划线渲染恢复正常

### v2.7（2026-10-09）
- 修复拖过轮盘未投放松手后悬浮点延迟消失的问题，现在松手立即隐藏
- 完善拖拽会话判定，正常投放行为不受影响

### v2.6
- 修复拖拽结束与投放回调的竞态问题（Dock 下载栈直接拖入不再被误杀）
- 合并面板支持继续拖入追加文件
- 合并队列不足（少于 2 个文件）时给出内联提示

### v2.5
- 修复完成状态图标被其他窗口遮挡的问题
- 合并面板（PDF 合并）进入流程放行

### v2.4
- 完善拖拽守卫逻辑，修复拖过未投放卡屏问题

更多历史版本请查看 [Releases](https://github.com/f8r4ksv7v4-hub/FileConverter/releases)。

## 功能特性

- **格式转换**：拖拽文件到桌面悬浮轮盘，选择目标格式即可本地转换，支持常见文档、图片、音视频等格式互转
- **图片工具**：裁剪、加背景、涂黑标记（矩形遮挡 / 自由划线 / 橡皮擦涂抹）、添加水印（可拖动位置、支持多个）、调整色彩
- **PDF 合并**：拖入多个 PDF 合并为单个文件
- **中英双语**：界面一键切换中文 / English，即时生效
- **悬浮球交互**：桌面悬浮小圆点，拖入可转换文件即展开为功能轮盘
- **自动更新**：基于 GitHub Releases 自动检查并下载安装新版本

## 使用说明

1. 启动应用后，首次会打开主页面；桌面上会出现悬浮小圆点
2. **打开主页面**：点击菜单栏的「文件」→「新窗口」即可随时打开主页面
3. 将文件拖拽到悬浮球上，展开功能轮盘
4. 选择目标格式或工具，完成转换
5. 转换完成后点击悬浮球即可打开输出文件所在文件夹

## 支持与反馈

- 问题反馈：请在 [Issues](https://github.com/f8r4ksv7v4-hub/FileConverter/issues) 提交
- 如果你喜欢这个应用，可以通过 [爱发电](https://afdian.com/a/xzy_projects) 或 [GitHub Sponsors](https://github.com/sponsors/f8r4ksv7v4-hub) 支持作者

## Windows 版

Windows 版 v3.0（C# WPF）已发布，以 FileFlipper（MIT）Windows 源码为基础重构，UI 与操作逻辑对齐 macOS 版：紫粉黄三色渐变光晕、磨砂半透明气泡圆盘轮盘；按住 Shift 拖拽文件展开格式轮盘，Ctrl+Shift 展开工具轮盘，松手未投放自动隐藏。

- **功能**：图片互转、PDF（转图 / 文本 / Markdown / Word）、文档互转（docx / md / txt / html / rtf 等）、PPTX→PDF / Markdown、XLSX→PDF、音视频压缩与转码、OCR 文字识别、一键抠图；图片工具（裁剪 / 压缩 / 清理元数据 / 缩放 50% / 旋转 / 黑白 / 去背景）、PDF 工具（合并 / 压缩 / 清理 / 旋转 / 拆分）
- **下载（Release）**：[FileConverter-Windows-3.0.0.zip](https://github.com/f8r4ksv7v4-hub/FileConverter/releases/tag/v3.0-windows)（约 66MB）
- **使用**：解压后双击 `FileConverter.exe` 即可运行，自包含单文件，无需安装 .NET；托盘常驻，也可右键文件 →「发送到」→ FileConverter
- **系统要求**：Windows 10 / 11（64 位）

> 首次运行时 Windows SmartScreen 可能提示「Windows 已保护你的电脑」，点击「更多信息」→「仍要运行」即可。应用未签名，属正常提示；如不放心可先核对下载文件的哈希值。

> 旧版说明：v1.0（Electron）已由 v3.0 替代，如需查看请访问 [v1.0-windows Release](https://github.com/f8r4ksv7v4-hub/FileConverter/releases/tag/v1.0-windows)。

## 环境要求

- macOS 13 或更高版本（Apple Silicon 或 Intel Mac）
- Windows 10 / 11（64 位）

## License

MIT

---

## English Documentation

### FileConverter

FileConverter is a local file conversion tool for macOS, built with SwiftUI + AppKit. All conversions happen entirely on your device — nothing is uploaded to the cloud, so your files stay private.

<p align="center">
  <img src="https://raw.githubusercontent.com/f8r4ksv7v4-hub/FileConverter/main/images/screenshot-01.jpg" alt="FileConverter" width="720">
</p>

#### Changelog

##### v2.11 (2026-10-10)
- docx→PDF conversion returns to stable output: removed the over-processing of embedded screenshot underline, cover page and underlines render correctly again.

##### v2.8 (2026-10-10)
- Fixed the floating ball being accidentally triggered when dragging other app windows (added window movement detection; drag responses are suppressed while a window is being dragged).

##### v2.7 (2026-10-09)
- Fixed the floating dot not disappearing immediately after dragging past the wheel and releasing without dropping.
- Improved drag session handling; normal drop behavior is unaffected.

##### v2.6
- Fixed a race condition between drag-end and drop callbacks (dragging directly from the Dock download stack is no longer killed).
- Merge panel now supports dragging in more files to append to the queue.
- Inline hint when the merge queue has fewer than 2 files.

##### v2.5
- Fixed the completion icon being occluded by other windows.
- Enabled entering the merge panel (PDF merge).

##### v2.4
- Improved drag guards; fixed a freeze when dragging across the wheel without dropping.

See [Releases](https://github.com/f8r4ksv7v4-hub/FileConverter/releases) for earlier versions.

#### Features

- **Format Conversion**: Drag files onto the desktop floating wheel and pick a target format. Supports common document, image, audio and video formats.
- **Image Tools**: Crop, add background, redact (rectangle / freehand / eraser), add multiple draggable watermarks, adjust colors.
- **PDF Merge**: Drag multiple PDFs and merge them into a single file.
- **Bilingual UI**: Switch between 中文 and English instantly.
- **Floating Ball Interaction**: A desktop floating dot expands into a conversion wheel when you drag a convertible file onto it.
- **Auto Update**: Automatically checks GitHub Releases and installs new versions.

#### First Launch Notice (Important)

The app is signed with an **ad-hoc signature** (not notarized with an Apple Developer ID). On first launch, macOS Gatekeeper may block it with a "can't be opened" or "unidentified developer" warning. This is a normal prompt for unnotarized apps.

**Option 1 (Recommended): Open via right-click**

1. Locate `FileConverter.app` in Finder (do not use Launchpad).
2. **Control-click** (or right-click) the app icon.
3. Choose **Open** from the context menu.
4. Click **Open** again to confirm.

The app will then be saved as a security exception and can be launched normally afterward.

**Option 2: Allow in System Settings**

1. Try double-clicking the app once (it will be blocked).
2. Open **System Settings → Privacy & Security**, scroll to the **Security** section.
3. Click the **Open Anyway** button (available within one hour after the blocked attempt).
4. Enter your password and click **OK**.

The app will be added to the security exceptions and can be opened normally afterwards.

> These steps follow [Apple's official documentation](https://support.apple.com/zh-cn/guide/mac-help/mchleab3a043/mac). If you have any security concerns, feel free to report them via Issues.

#### Usage

1. After launching, the main window opens and a floating dot appears on the desktop.
2. **Open main window**: Menu bar → File → New Window.
3. Drag a file onto the floating ball to expand the conversion wheel.
4. Pick a target format or tool to convert.
5. Click the floating ball after conversion to open the output folder.

#### Support & Feedback

- Bug reports / feedback: [GitHub Issues](https://github.com/f8r4ksv7v4-hub/FileConverter/issues)
- If you like this app, consider supporting the author via [爱发电](https://afdian.com/a/xzy_projects) or [GitHub Sponsors](https://github.com/sponsors/f8r4ksv7v4-hub)

#### Windows Version

Windows v3.0 (C# WPF) is now available, rebuilt on the FileFlipper (MIT) Windows source with macOS-aligned UI and interaction: purple-pink-yellow gradient glow, frosted translucent bubbles on a picker arc. Hold Shift while dragging files to open the format wheel, Ctrl+Shift for the tool wheel; it auto-hides when you release without dropping.

- **Features**: image conversion, PDF (to images / text / Markdown / Word), document conversion (docx / md / txt / html / rtf …), PPTX→PDF / Markdown, XLSX→PDF, audio/video compression and transcoding, OCR text recognition, one-click background removal; image tools (crop / compress / clean metadata / 50% resize / rotate / B&W / cutout), PDF tools (merge / compress / clean / rotate / split)
- **Release download**: [FileConverter-Windows-3.0.0.zip](https://github.com/f8r4ksv7v4-hub/FileConverter/releases/tag/v3.0-windows) (~66 MB)
- **Usage**: Unzip and double-click `FileConverter.exe` — self-contained, no .NET install needed; lives in the notification area, or right-click a file → "Send to" → FileConverter
- **System requirements**: Windows 10 / 11 (64-bit)

> On first run, Windows SmartScreen may show "Windows protected your PC" — click "More info" → "Run anyway". The app is unsigned; this is a normal prompt. You may verify the file hash if concerned.

#### Environment Requirements

- macOS 13 or later (Apple Silicon or Intel Mac)
- Windows 10 / 11 (64-bit)

#### License

MIT

