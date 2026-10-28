# FileConverter

<p align="center">
  <a href="#中文文档"><b>中文</b></a> ·
  <a href="#english-documentation"><b>English</b></a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/platform-macOS%2013%2B%20%7C%20Windows%2010%2F11-lightgrey" alt="Platform: macOS 13+ / Windows 10-11">
  <img src="https://img.shields.io/badge/macOS-SwiftUI%20%2B%20AppKit-blue" alt="macOS: SwiftUI + AppKit">
  <img src="https://img.shields.io/badge/Windows-C%23%20WPF-purple" alt="Windows: C# WPF">
  <img src="https://img.shields.io/badge/language-%E4%B8%AD%E6%96%87%20%2F%20English-green" alt="中文 / English">
  <img src="https://img.shields.io/github/v/release/f8r4ksv7v4-hub/FileConverter?label=release&color=orange" alt="Release">
  <img src="https://img.shields.io/badge/license-MIT-brightgreen" alt="License: MIT">
</p>

<a id="中文文档"></a>

## 中文文档

FileConverter 是一款跨平台本地文件转换工具，提供 macOS 原生版与 Windows 版双平台支持，采用原生技术栈打造（macOS 基于 SwiftUI + AppKit，Windows 基于 C# WPF），所有转换均在本地完成，不上传云端，保护你的文件隐私。

> 本项目由 **f8r4ksv7v4-hub** 原创开发与维护，界面与全部交互均为原创设计。仓库仅提供说明文档与官方安装包，不提供源码。

- **English documentation**: [English Documentation](#english-documentation)

**macOS 版**：FileConverter 是一款 macOS 本地文件转换工具，基于 SwiftUI + AppKit 完全原创开发，未借鉴其他同类工具，所有转换均在本地完成，不上传云端，保护你的文件隐私。界面采用原创独特 UI 设计：桌面悬浮小圆点交互，拖入文件即展开紫粉黄三色渐变光晕的圆盘轮盘，磨砂半透明气泡按钮，深色毛玻璃界面——全部视觉与交互均为原创设计，随手即用、细节拉满。

**主要功能**：

- **格式转换**：拖拽文件到桌面悬浮轮盘，选择目标格式即可本地转换，支持常见文档、图片、音视频等格式互转
- **文档处理**：docx→PDF 保真转换；PPTX / XLSX 转 Markdown；PPTX→PDF
- **PDF 工具**：PDF 合并、压缩、清除元数据、旋转、按页拆分；PDF 转图片 / 文本 / Markdown / Word；多张图片可合并为单个 PDF / PPTX
- **图片工具**：裁剪、加背景、涂黑标记（矩形遮挡 / 自由划线 / 橡皮擦涂抹）、添加水印（可拖动位置、支持多个）、调整色彩
- **中英双语**：界面一键切换中文 / English，即时生效
- **悬浮球交互**：桌面悬浮小圆点，拖入可转换文件即展开为功能轮盘
- **自动更新**：基于 GitHub Releases 自动检查并下载安装新版本

macOS 版的文档类转换（如 docx→PDF 高保真排版、Office 文档转 Markdown / PDF 等）由内置 LibreOffice headless 引擎驱动，并经过字体映射、排版修复、串行调度与超时回收等深度优化，转换保真度和稳定性远强于普通开源转换器。其中 PPTX / XLSX 转 Markdown 走原生 OOXML 解析，保留文本与表格结构。

**Windows 版**：作为运行在 Windows 系统的 FileConverter 风味版，基于 FileFlipper（MIT 开源协议）融合 Mac 版 FileConverter 的设计与交互开发，采用 C# WPF 实现，UI 与操作逻辑与 macOS 版保持一致（紫粉黄三色渐变光晕、磨砂半透明气泡圆盘轮盘、深色毛玻璃界面），所有转换同样在本地完成，不上传云端，保护你的文件隐私。

具体功能：

- **图片互转**：jpg / png / webp / bmp / gif / heic 等格式互转；图片工具含裁剪、压缩、清理元数据、缩放 50%、旋转、黑白、一键去背景
- **PDF 工具**：PDF 转图片 / 文本 / Markdown / Word；PDF 合并、压缩、清理元数据、旋转、按页拆分
- **文档转换**：docx / md / txt / html / rtf 等互转；PPTX→PDF / Markdown；XLSX→PDF
- **音视频**：压缩与格式转码
- **OCR 文字识别**：从图片 / PDF 中提取文字
- **操作方式与 Mac 版一致**：拖拽文件到屏幕顶部中央的悬浮轮盘即展开格式圆盘（默认任意拖拽触发，可改为 Shift / Alt / Alt + Shift）；按住 Ctrl 拖拽切换到工具轮盘，松手未投放自动隐藏
- **托盘常驻 + 右键「发送到」快捷入口**：自包含单文件，无需安装 .NET，Windows 10 / 11 直接运行

<p align="center">
  <img src="https://raw.githubusercontent.com/f8r4ksv7v4-hub/FileConverter/main/images/screenshot-01.jpg" alt="FileConverter 宣传图" width="720">
</p>

### 应用预览

<p align="center">
  <img src="https://raw.githubusercontent.com/f8r4ksv7v4-hub/FileConverter/main/images/screenshot-02.jpg" alt="功能一览" width="400">
  <img src="https://raw.githubusercontent.com/f8r4ksv7v4-hub/FileConverter/main/images/screenshot-04.jpg" alt="图片工具演示" width="400">
</p>

<p align="center">
  <img src="https://raw.githubusercontent.com/f8r4ksv7v4-hub/FileConverter/main/images/screenshot-05.jpg" alt="文档转换演示" width="400">
  <img src="https://raw.githubusercontent.com/f8r4ksv7v4-hub/FileConverter/main/images/screenshot-06.jpg" alt="更多功能等你发现" width="400">
</p>

### ⚠️ 首次安装提示（重要）

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

### 更新记录

#### v3.3（2026-10-28）
- 修复「登录时启动」开关重启后自动复位：开关状态改为持久化写入偏好，并以系统登录项的实际状态为准回读，启动后自动校正；注册动作移至应用完成启动后执行，后台静默启动也能生效
- 新增安装位置校验：从下载目录、桌面或外接磁盘运行时会提示移入「应用程序」，避免登录项绑定在会被移动的路径上
- 后台保活：转换提示与登录项链路不再受 App Nap 休眠影响
- 省电：窗口隐藏时暂停界面光晕与呼吸动画，空闲 CPU 占用降至约 0.8%
- 修复按住修饰键拖入文件后松开修饰键、轮盘卡住不收起的问题
- 依赖环境：统一选用系统通用 Python 解释器，不再误用其他 App 内置的运行时；依赖安装新增镜像源自动回退（中科大 / 阿里云 / 清华）
- 依赖检测：多解释器候选逐个探测并支持手动刷新，修复面板卡在刷新状态与重启后误报依赖缺失

#### v3.2（2026-10-16）
- 修复依赖检测与安装缺陷：依赖检查面板不再卡在刷新状态；重启应用后不再误报 pdf2docx 等依赖缺失
- 依赖探测更可靠：优先使用 Homebrew Python（/opt/homebrew/bin/python3），导入检测超时由 3 秒提升至 20 秒，支持多解释器候选逐个探测，并明确区分「解释器不可用」与「依赖包未安装」
- 修复本地化表重复键导致的启动崩溃

#### v2.0-windows（2026-10-11）
- Windows 版全面重构（C# WPF）：放弃 Electron 方案，基于 FileFlipper（MIT）融合 Mac 版 FileConverter 的设计与交互，以 C# WPF 重写，UI 对齐 macOS 版视觉（紫粉黄三色渐变光晕、磨砂半透明气泡、圆盘轮盘），拖拽显隐逻辑与 Mac 版一致
- 转换能力大幅增强：图片互转、PDF（转图 / 文本 / Markdown / Word）、文档互转、PPT→PDF/MD、表格→PDF、音视频压缩与转码、OCR 文字识别、一键抠图，以及图片 / PDF 工具（裁剪、压缩、清理、旋转、拆分、合并）
- 托盘常驻 + 右键「发送到」快捷入口；自包含单文件，无需安装 .NET
- 旧版 Electron 源码已归档至仓库 `FileConverter-Windows-Electron/` 目录

#### v3.0（2026-10-11）
- 新增 PPTX / XLSX 转 Markdown 输出
- PDF 轮盘补齐工具按钮：压缩 PDF、清除元数据、旋转 90°、拆分每页
- 多张图片可合并为单个 PDF / PPTX
- Markdown 输出名称统一为「md」

#### v2.11（2026-10-10）
- docx→PDF 转换回归稳定输出：移除对嵌入截图填写线的过度处理，封面与下划线渲染恢复正常

#### v2.8（2026-10-10）
- 修复拖动其他应用窗口时误触发悬浮球的问题：新增窗口移动检测，拖窗过程中抑制拖拽响应

#### v2.7（2026-10-09）
- 修复拖过轮盘未投放松手后悬浮点延迟消失的问题，现在松手立即隐藏
- 完善拖拽会话判定，正常投放行为不受影响

#### v2.6
- 修复拖拽结束与投放回调的竞态问题（Dock 下载栈直接拖入不再被误杀）
- 合并面板支持继续拖入追加文件
- 合并队列不足（少于 2 个文件）时给出内联提示

#### v2.5
- 修复完成状态图标被其他窗口遮挡的问题
- 合并面板（PDF 合并）进入流程放行

#### v2.4
- 完善拖拽守卫逻辑，修复拖过未投放卡屏问题

更多历史版本请查看 [Releases](https://github.com/f8r4ksv7v4-hub/FileConverter/releases)。

### 功能特性

- **格式转换**：拖拽文件到桌面悬浮轮盘，选择目标格式即可本地转换，支持常见文档、图片、音视频等格式互转
- **图片工具**：裁剪、加背景、涂黑标记（矩形遮挡 / 自由划线 / 橡皮擦涂抹）、添加水印（可拖动位置、支持多个）、调整色彩
- **PDF 合并**：拖入多个 PDF 合并为单个文件
- **中英双语**：界面一键切换中文 / English，即时生效
- **悬浮球交互**：桌面悬浮小圆点，拖入可转换文件即展开为功能轮盘
- **自动更新**：基于 GitHub Releases 自动检查并下载安装新版本

### ⚠️ 拖拽修饰符设置（重要）

**「拖拽修饰符」** 决定 **拖入文件时需要按住哪个键**，才会唤出转换轮盘：macOS 与 Windows 的默认值均为 **无修饰键**（任意拖拽即展开）。

**建议改为任一修饰键（Shift / Option / Alt 等）**：

- 设置修饰键后，普通拖放（如把文件拖进访达、浏览器、聊天窗口等）完全不受影响，只有按住对应修饰键拖入时才会唤起 FileConverter 轮盘；
- 若保持「无修饰键」，FileConverter 的悬浮轮盘会拦截**所有**拖入其感应区域的文件，可能导致你把文件拖到**其他 App** 时被轮盘截获、无法完成投放（例如拖文件到微信/邮件附件区域却被转换轮盘抢走）。

> **macOS 版**：主窗口 → 设置 → 通用 → 拖拽修饰符 → 转换轮盘，可选 无 / Shift / Option / Option + Shift。
> **Windows 版**：设置窗口 → 拖拽修饰符（或托盘右键 → Wheel Trigger…），可选 任意拖拽（无修饰键）/ Shift / Alt / Alt + Shift；按住 **Ctrl** 拖拽可随时切换到工具轮盘。

### 使用方法

macOS 版与 Windows 版的操作逻辑一致：**拖入文件 → 在轮盘上选择格式或工具 → 转换结果保存在原文件旁边**。以下分别说明两个版本。

#### macOS 版

##### 一、启动与主界面

1. 启动 `FileConverter.app`，主窗口自动打开，桌面上同时出现一个悬浮小圆点（悬浮球）
2. 之后可随时重新打开主窗口：点击 Dock 图标，或使用菜单栏「文件」→「新窗口」
3. 主窗口顶部工具栏从左到右依次为：赞助作者、依赖检查（扳手）、设置（齿轮）、反馈、检查更新；中部为拖放区与转换任务列表
4. 每条转换任务完成后，右侧提供「在访达中显示」按钮
5. 关闭主窗口不影响使用，悬浮球与全局拖拽监测会继续在后台运行

##### 二、拖拽与轮盘

1. 在访达中拖起一个或多个文件，按住已设置的拖拽修饰键（默认为「无」，即无需按键），拖到悬浮球上，悬浮球展开为**格式轮盘**
2. 轮盘按文件类型给出可转换的目标格式（图片 / 文档 / 音视频 / PDF 等），光标悬停即高亮，松开鼠标即开始转换
3. 松手前把文件**拖离轮盘**，轮盘自动收起，不会执行任何操作

##### 三、二级菜单（工具与合并）

- **图片工具**：拖入图片后，光标在某个格式按钮上停留约 0.5 秒，展开图片工具环 —— 压缩、清除元数据、编辑（色彩）、标注（水印）、加背景、裁剪、涂黑
- **PDF 合并**：拖入多个 PDF，悬停在合并块上进入合并面板，可继续拖入文件追加队列（队列不足 2 个文件时会给出提示）
- **图片合并**：拖入多张图片并选择「合并为 PDF / PPTX」，进入合并面板

> 光标划过轮盘按钮会有轻微震动反馈，属于正常交互提示。

##### 四、拖拽修饰符设置

- 路径：主窗口 → 设置 → 通用 → **拖拽修饰符 → 转换轮盘**
- 可选：无（默认）/ Shift / Option / Option + Shift
- 默认「无」：任何拖拽进入感应区域都会展开轮盘
- 建议改为 Shift / Option 等修饰键：普通拖放（访达、浏览器、聊天窗口）完全不受影响，只有按住修饰键拖入时才唤起轮盘
- 同一设置页还可配置界面语言、外观（毛玻璃 / 纯色）、登录时启动、音效反馈、隐藏 Dock 图标；「格式」页可按扩展名（JPG / PNG / WEBP / HEIC / TIFF / BMP / PDF / MP3 / MP4 / DOCX / TXT）单独设置转换质量、是否保留元数据与图片压缩尺寸

##### 五、输出位置

- 转换结果保存在**原文件所在文件夹**，文件名保持原名、仅扩展名变化（如 `报告.docx` → `报告.pdf`）
- 若同名文件已存在，自动追加序号（`报告 (1).pdf`），**不会覆盖**任何已有文件
- 转换完成后，点击悬浮球，或在主窗口任务列表中点击「在访达中显示」，即可打开输出文件所在文件夹

##### 六、自动更新

- 启动时自动检查 GitHub Releases 最新版本：发现新版本弹出「下载更新 / 稍后」，已是最新则静默不打扰
- 手动检查：设置 → 关于 → 检查更新
- 更新流程：下载名称含 `macOS` 的 zip 资产 → 解压 → 原位替换当前 App（不修改你的安装位置）→ 自动重新打开

##### 七、常见问题

| 现象 | 处理方式 |
| --- | --- |
| 首次打开提示「无法检查恶意软件 / 来自身份不明的开发者」 | 见上文《首次安装提示》，按住 Control 点击图标 → 打开；或系统设置 → 隐私与安全性 → 仍要打开 |
| 拖拽文件没有出现轮盘 | 确认应用正在运行（主窗口或 Dock 图标）；确认已按住所设置的拖拽修饰键 |
| 音视频压缩或转码失败 | 需要安装 `ffmpeg`，可在依赖检查中一键安装 |
| 图片转 WebP 失败 | 需要安装 `cwebp` |
| Office 文档转 PDF / Markdown 效果异常 | 需要安装 LibreOffice（由 headless 引擎驱动高保真转换） |
| PDF 转 Word 失败 | 需要安装 Python 库 `pdf2docx` |
| 不清楚缺少哪些依赖 | 点击主窗口顶部扳手按钮打开**依赖检查**，点击「安装缺失依赖」经由 Homebrew 自动安装（需先安装 Homebrew） |
| Dock 中找不到应用图标 | 已开启「隐藏 Dock 图标」，用菜单栏「文件」→「新窗口」打开主窗口，或在设置中关闭该项 |
| 开启「登录时启动」失败 | 请先将 App 放入「应用程序」文件夹 |

手动安装依赖的命令：

```bash
brew install ffmpeg webp                  # 音视频转码 / 图片转 WebP
brew install --cask libreoffice           # Office 文档高保真转换
python3 -m pip install --user pdf2docx    # PDF 转 Word
```

#### Windows 版

##### 一、下载与运行

1. 在 [Releases](https://github.com/f8r4ksv7v4-hub/FileConverter/releases/tag/v2.0-windows) 下载 `FileConverter-2.0-windows.exe`（自包含单文件，约 170 MB）
2. 放到任意目录后**双击运行**，无需安装，也无需预先安装 .NET 运行时
3. 首次运行 SmartScreen 可能提示「Windows 已保护你的电脑」：点击「更多信息」→「仍要运行」
4. 首次启动会弹出使用教程，并自动将 FileConverter 加入资源管理器右键「发送到」菜单

##### 二、托盘与设置入口

- 程序常驻屏幕右下角**通知区域（托盘）**，关闭窗口不会退出
- 打开设置：**双击托盘图标**，或**右键托盘图标 → 「设置…」**
- 设置窗口同时也是主窗口，运行时任务栏始终显示应用图标
- 托盘菜单项：设置… / 启用 / 随 Windows 启动 / 显示在「发送到」菜单 / Wheel Trigger… / 如何使用… / 关于 FileConverter / 退出 FileConverter

##### 三、触发方式

1. 在资源管理器中拖起文件，屏幕**顶部中央**出现一个小轮盘，把文件靠近它即展开完整格式圆盘
2. 默认**任意拖拽**都会显示轮盘；如需改为按住 **Shift / Alt / Alt + Shift**，在设置窗口 →「拖拽修饰符」中切换（或托盘右键 → Wheel Trigger…）
3. **按住 Ctrl 拖拽**可切换到**工具轮盘**（裁剪、压缩、抠图、旋转、合并、拆分等，随文件类型变化）
4. 轮盘上点击气泡选择目标格式；按 **Esc** 关闭；把文件拖离轮盘松手即取消，不会执行任何操作
5. 也可右键文件 →「发送到」→ FileConverter（Windows 11 需先点击「显示更多选项」）

##### 四、任务栏最小化与退出

- 设置窗口即主窗口，运行时任务栏始终有图标，随时点击即可唤回；点击 **✕ 只是隐藏窗口**，进程继续驻留托盘
- 退出应用：右键托盘图标 →「退出 FileConverter」
- 若界面无响应：按 **Ctrl+Shift+Esc** 打开任务管理器，找到 FileConverter →「结束任务」

##### 五、LibreOffice（可选，提升保真度）

- 文档转 PDF 时，若本机装有 LibreOffice，将调用其 headless 引擎进行高保真渲染
- 未安装时自动回退到内置渲染引擎，并在转换完成时提示「Install LibreOffice for a higher-fidelity PDF」
- 需要更高保真度时，从 [LibreOffice 官网](https://www.libreoffice.org/download/download-libreoffice/) 安装即可，安装后无需在 FileConverter 中做任何额外配置

##### 六、系统要求

- Windows 10 / 11（64 位）

### Windows 版

Windows 版 v2.0（C# WPF）基于 FileFlipper（MIT 开源协议）融合 Mac 版 FileConverter 的设计与交互开发而来，UI 与操作逻辑对齐 macOS 版：紫粉黄三色渐变光晕、磨砂半透明气泡圆盘轮盘；拖拽文件到屏幕顶部中央的悬浮轮盘即展开格式圆盘（默认任意拖拽触发，可改为 Shift / Alt / Alt + Shift），按住 Ctrl 可切换到工具轮盘，松手未投放自动隐藏。

- **功能**：图片互转、PDF（转图 / 文本 / Markdown / Word）、文档互转（docx / md / txt / html / rtf 等）、PPTX→PDF / Markdown、XLSX→PDF、音视频压缩与转码、OCR 文字识别、一键抠图；图片工具（裁剪 / 压缩 / 清理元数据 / 缩放 50% / 旋转 / 黑白 / 去背景）、PDF 工具（合并 / 压缩 / 清理 / 旋转 / 拆分）
- **下载（Release）**：[v2.0-windows 已发布](https://github.com/f8r4ksv7v4-hub/FileConverter/releases/tag/v2.0-windows)，下载 `FileConverter-2.0-windows.exe`（自包含单文件，约 170 MB），双击即可运行，无需安装
- **详细使用方法**：见上文《使用方法 · Windows 版》，涵盖下载运行、托盘与设置入口、触发方式、任务栏最小化与退出、LibreOffice 可选安装
- **系统要求**：Windows 10 / 11（64 位）

> 首次运行时 Windows SmartScreen 可能提示「Windows 已保护你的电脑」，点击「更多信息」→「仍要运行」即可。应用未签名，属正常提示；如不放心可先核对下载文件的哈希值。

> 旧版说明：v1.0（Electron）已由 v2.0 替代，源码归档于仓库 `FileConverter-Windows-Electron/` 目录；如需 Release 请访问 [v1.0-windows Release](https://github.com/f8r4ksv7v4-hub/FileConverter/releases/tag/v1.0-windows)。

### 支持与反馈

- 问题反馈：请在 [Issues](https://github.com/f8r4ksv7v4-hub/FileConverter/issues) 提交
- 如果你喜欢这个应用，可以通过 [爱发电](https://afdian.com/a/xzy_projects) 或 [GitHub Sponsors](https://github.com/sponsors/f8r4ksv7v4-hub) 支持作者

### 下载

| 版本 | 安装包 | 平台 | 大小 | 下载直链 |
| --- | --- | --- | --- | --- |
| **3.3**（推荐） | `FileConverter-3.3-macOS.zip` | macOS | 约 2.9 MB | [下载](https://github.com/f8r4ksv7v4-hub/FileConverter/releases/download/v3.3/FileConverter-3.3-macOS.zip) |
| 2.0 | `FileConverter-2.0-windows.exe` | Windows | 约 170 MB | [下载](https://github.com/f8r4ksv7v4-hub/FileConverter/releases/download/v2.0-windows/FileConverter-2.0-windows.exe) |

全部版本与更新日志见 [Releases](https://github.com/f8r4ksv7v4-hub/FileConverter/releases) 页面。macOS 版首次打开会触发 Gatekeeper 提示，处理方式见上文《首次安装提示》。

### 环境要求

- macOS 13 或更高版本（Apple Silicon 或 Intel Mac）
- Windows 10 / 11（64 位）

### License

MIT

---

<a id="english-documentation"></a>

## English Documentation

FileConverter is a cross-platform file conversion tool with two native builds — macOS (SwiftUI + AppKit) and Windows (C# WPF). All conversions happen entirely on your device: nothing is uploaded to the cloud, so your files stay private.

> Designed and maintained by **f8r4ksv7v4-hub**. The interface and every interaction are original designs. This repository ships documentation and official installers only — the source code is not public.

- **中文文档**: [中文文档](#中文文档)

### Screenshots

<p align="center">
  <img src="https://raw.githubusercontent.com/f8r4ksv7v4-hub/FileConverter/main/images/screenshot-01.jpg" alt="FileConverter" width="720">
</p>

<p align="center">
  <img src="https://raw.githubusercontent.com/f8r4ksv7v4-hub/FileConverter/main/images/screenshot-02.jpg" alt="Feature overview" width="400">
  <img src="https://raw.githubusercontent.com/f8r4ksv7v4-hub/FileConverter/main/images/screenshot-04.jpg" alt="Image tools in action" width="400">
</p>

<p align="center">
  <img src="https://raw.githubusercontent.com/f8r4ksv7v4-hub/FileConverter/main/images/screenshot-05.jpg" alt="Document conversion demo" width="400">
  <img src="https://raw.githubusercontent.com/f8r4ksv7v4-hub/FileConverter/main/images/screenshot-06.jpg" alt="More features" width="400">
</p>

### First Launch Notice (Important)

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

### Changelog

#### v3.3 (2026-10-28)
- Fixed "Launch at login" resetting itself after a restart: the toggle is now persisted to preferences and re-read from the actual login-item state on launch; registration is deferred until the app finishes launching, so silent background starts work too.
- Added an install-location check: running from Downloads, the Desktop or an external volume now prompts you to move the app into Applications, so the login item is never bound to a path that can move.
- Background keep-alive: conversion notifications and login-item wiring are no longer throttled by App Nap.
- Power saving: the glow / breathing animations pause while the window is hidden — idle CPU usage drops to roughly 0.8%.
- Fixed the wheel staying on screen when the drag modifier is released after entering the hotspot.
- Dependencies: the app now always uses the system-wide Python interpreter instead of a runtime bundled inside another app; dependency installs fall back across multiple mirrors (USTC / Aliyun / Tsinghua).
- Dependency check: multiple interpreter candidates are probed one by one with a manual refresh, fixing the panel stuck at "refreshing" and the false "missing dependency" reports after a relaunch.

#### v3.2 (2026-10-16)
- Fixed the dependency detection and installation issues: the dependency panel no longer gets stuck refreshing, and missing packages (e.g. pdf2docx) are no longer falsely reported after relaunching the app.
- More reliable interpreter probing: prefers Homebrew Python (`/opt/homebrew/bin/python3`), raises the import check timeout from 3s to 20s, probes multiple interpreter candidates, and distinguishes "interpreter unavailable" from "package not installed".
- Fixed a launch crash caused by duplicated keys in the localization table.

#### v2.0-windows (2026-10-11)
- The Windows build was rebuilt from scratch in C# WPF: dropped Electron and, building on FileFlipper (MIT), fused the design and interaction of the macOS FileConverter into a native WPF app — UI aligned with the macOS build (purple-pink-yellow gradient glow, frosted translucent bubbles, bubble wheel) and the same drag-to-reveal logic.
- Much broader conversion coverage: image formats, PDF (to images / text / Markdown / Word), document formats, PPT→PDF/MD, spreadsheets→PDF, audio/video compression and transcoding, OCR, one-click background removal, plus image / PDF tools (crop, compress, clean, rotate, split, merge).
- Resident tray icon with a right-click "Send to" shortcut; self-contained single file, no .NET installation required.
- The legacy Electron source is archived in the `FileConverter-Windows-Electron/` directory of this repo.

#### v3.0 (2026-10-11)
- Added PPTX / XLSX → Markdown export.
- Completed the PDF tool buttons on the wheel: compress PDF, strip metadata, rotate 90°, split into single pages.
- Multiple images can now be merged into a single PDF / PPTX.
- Markdown output is uniformly labelled "md".

#### v2.11 (2026-10-10)
- docx→PDF conversion returns to stable output: removed the over-processing of embedded screenshot underline, cover page and underlines render correctly again.

#### v2.8 (2026-10-10)
- Fixed the floating ball being accidentally triggered when dragging other app windows (added window movement detection; drag responses are suppressed while a window is being dragged).

#### v2.7 (2026-10-09)
- Fixed the floating dot not disappearing immediately after dragging past the wheel and releasing without dropping.
- Improved drag session handling; normal drop behavior is unaffected.

#### v2.6
- Fixed a race condition between drag-end and drop callbacks (dragging directly from the Dock download stack is no longer killed).
- Merge panel now supports dragging in more files to append to the queue.
- Inline hint when the merge queue has fewer than 2 files.

#### v2.5
- Fixed the completion icon being occluded by other windows.
- Enabled entering the merge panel (PDF merge).

#### v2.4
- Improved drag guards; fixed a freeze when dragging across the wheel without dropping.

See [Releases](https://github.com/f8r4ksv7v4-hub/FileConverter/releases) for earlier versions.

### Features

- **Format Conversion**: Drag files onto the desktop floating wheel and pick a target format. Supports common document, image, audio and video formats.
- **Image Tools**: Crop, add background, redact (rectangle / freehand / eraser), add multiple draggable watermarks, adjust colors.
- **PDF Merge**: Drag multiple PDFs and merge them into a single file.
- **Bilingual UI**: Switch between 中文 and English instantly.
- **Floating Ball Interaction**: A desktop floating dot expands into a conversion wheel when you drag a convertible file onto it.
- **Auto Update**: Automatically checks GitHub Releases and installs new versions.

### Drag Modifier Setting (Important)

**"Drag Modifier"** decides **which key you must hold while dragging files** to summon the conversion wheel. Both the macOS and the Windows build default to **no modifier** (the wheel appears on any drag).

**We recommend switching to a modifier (Shift / Option / Alt):**

- With a modifier configured, ordinary drag-and-drop (e.g. into Finder, browsers, chat apps) is completely unaffected — the wheel only appears when you hold the modifier while dragging;
- If set to "No modifier", the floating wheel will intercept **every** file dragged through its hotspot, so files may get captured by the wheel instead of being dropped into **other apps** (e.g. attaching files in WeChat / email).

> **macOS**: Main window → Settings → General → Drag Modifier → Conversion Wheel — choose No modifier / Shift / Option / Option + Shift.
> **Windows**: Settings window → Drag Modifier (or tray → Wheel Trigger…) — choose Any drag (no modifier) / Shift / Alt / Alt + Shift; hold **Ctrl** while dragging to switch to the tool wheel.

### Usage (macOS)

The macOS and Windows builds follow the same logic: **drag files in → pick a format or tool on the wheel → the converted file is saved next to the original**. This section covers the macOS build; see "Windows Version" below for the Windows build.

#### 1. Getting started

1. Launch `FileConverter.app` — the main window opens automatically and a small floating dot (the floating ball) appears on the desktop.
2. Re-open the main window any time: click the **Dock icon**, or use the menu bar **File → New Window**.
3. The toolbar of the main window (left to right): donate, dependency check (wrench), settings (gear), feedback, check for updates; the body holds the drop area and the conversion task list.
4. Each finished task offers a **Reveal in Finder** button.
5. Closing the main window does not quit the app — the floating ball and global drag monitoring keep running in the background.

#### 2. Dragging & the wheel

1. Start dragging one or more files in Finder, hold the configured drag modifier (default: none, i.e. no key needed) and move them onto the floating ball — it expands into the **format wheel**.
2. The wheel lists the target formats available for the dragged file type (image / document / audio & video / PDF …). Hover to highlight, then release the mouse to convert.
3. Drag the files away from the wheel before releasing — the wheel collapses and nothing happens.

#### 3. Sub-menus (tools & merge)

- **Image tools**: with images dragged in, leave the cursor on a format bubble for about 0.5 s to open the image tool ring — compress, clean metadata, edit (colors), annotate (watermark), add background, crop, redact.
- **PDF merge**: drag in several PDFs and hover the merge block to open the merge panel; drag in more files to append to the queue (an inline hint appears when fewer than 2 files are queued).
- **Image merge**: drag in several images and choose "merge to PDF / PPTX" to open the merge panel.

> A light haptic tick fires as the cursor crosses wheel buttons — this is the intended feedback.

#### 4. Drag Modifier setting

- Path: Main window → Settings → General → **Drag Modifier → Conversion Wheel**
- Options: No modifier (default) / Shift / Option / Option + Shift
- With "No modifier", any drag entering the hotspot expands the wheel.
- We recommend Shift / Option …: ordinary drag-and-drop (Finder, browsers, chat apps) is unaffected, and the wheel only appears while the modifier is held.
- The same Settings page also offers language, appearance (glass / solid), launch at login, sound feedback and hide Dock icon. The **Formats** tab sets per-extension options (JPG / PNG / WEBP / HEIC / TIFF / BMP / PDF / MP3 / MP4 / DOCX / TXT) for quality, metadata preservation and image compression size.

#### 5. Output location

- Converted files are saved **next to the original**, keeping the original name and changing only the extension (`report.docx` → `report.pdf`).
- If a file with that name already exists, a number is appended (`report (1).pdf`) — **nothing is ever overwritten**.
- After a conversion, click the floating ball or use **Reveal in Finder** in the task list to open the output folder.

#### 6. Auto update

- The app checks GitHub Releases at launch: if a newer version exists it offers "Download update / Later"; when already up to date it stays silent.
- Manual check: Settings → About → Check for Updates.
- Update flow: download the zip asset whose name contains `macOS` → unzip → replace the current app in place (your install location is preserved) → relaunch automatically.

#### 7. Troubleshooting

| Symptom | What to do |
| --- | --- |
| "Apple cannot check it for malicious software" on first launch | See *First Launch Notice* above — Control-click the icon → Open; or System Settings → Privacy & Security → Open Anyway |
| No wheel appears while dragging | Make sure the app is running (main window or Dock icon) and that you hold the configured drag modifier |
| Audio/video conversion fails | Install `ffmpeg` — one-click from the dependency checker |
| WebP output fails | Install `cwebp` |
| Office documents convert poorly | Install LibreOffice (drives the high-fidelity headless conversion) |
| PDF → Word fails | Install the Python package `pdf2docx` |
| Not sure which dependency is missing | Click the wrench button in the main window to open the dependency checker, then click "Install missing dependencies" (Homebrew required) |
| No Dock icon | "Hide Dock icon" is enabled — open the main window via menu bar File → New Window, or turn the option off |
| "Launch at login" fails | Move the app into the `/Applications` folder first |

Manual installation:

```bash
brew install ffmpeg webp                  # audio/video transcoding + WebP
brew install --cask libreoffice           # high-fidelity Office conversion
python3 -m pip install --user pdf2docx    # PDF → Word
```

### Windows Version

As a FileConverter flavor running on Windows (**v2.0**, C# WPF), it is built on FileFlipper (MIT) fused with the design and interaction of the macOS FileConverter, with UI and interaction aligned to the macOS version: purple-pink-yellow gradient glow, frosted translucent bubble picker wheel, and a dark frosted-glass interface. All conversions also complete locally — nothing is uploaded to the cloud, keeping your files private.

- **Features**: image conversion, PDF (to images / text / Markdown / Word), document conversion (docx / md / txt / html / rtf …), PPTX→PDF / Markdown, XLSX→PDF, audio/video compression and transcoding, OCR text recognition, one-click background removal; image tools (crop / compress / clean metadata / 50% resize / rotate / B&W / cutout), PDF tools (merge / compress / clean / rotate / split)
- **Release download**: [v2.0-windows](https://github.com/f8r4ksv7v4-hub/FileConverter/releases/tag/v2.0-windows) — `FileConverter-2.0-windows.exe` (self-contained single file, ~170 MB), just double-click to run, no installation needed
- **System requirements**: Windows 10 / 11 (64-bit)

#### Getting started (Windows)

1. Download `FileConverter-2.0-windows.exe` from [Releases](https://github.com/f8r4ksv7v4-hub/FileConverter/releases/tag/v2.0-windows) (self-contained single file, ~170 MB).
2. Put it in any folder and **double-click to run** — no installation and no .NET runtime required.
3. On first run Windows SmartScreen may show "Windows protected your PC" — click "More info" → "Run anyway".
4. The first launch shows a short tutorial and automatically adds FileConverter to the Explorer right-click **"Send to"** menu.

#### Tray & Settings (Windows)

- FileConverter lives in the **notification area (tray)** in the bottom-right corner; closing windows does not quit it.
- Open Settings by **double-clicking the tray icon**, or **right-click the tray icon → Settings…**.
- The Settings window is also the main window and keeps a taskbar icon while running.
- Tray menu: Settings… / Enabled / Start with Windows / Show in "Send to" Menu / Wheel Trigger… / How to Use… / About FileConverter / Quit FileConverter.

#### Triggering the wheel (Windows)

1. Start dragging a file in File Explorer — a small wheel appears at the **top centre** of the screen; bring the file near it and it expands into the full format circle.
2. Any drag shows the wheel by default; to require **Shift / Alt / Alt + Shift**, switch it in Settings → Drag Modifier (or tray → Wheel Trigger…).
3. **Hold Ctrl while dragging** to switch to the **tool wheel** (crop, compress, cut out, rotate, merge, split …, depending on the file type).
4. Click a bubble to pick a target format, press **Esc** to close, or drag the files away and release to cancel — nothing happens.
5. You can also right-click files → "Send to" → FileConverter (on Windows 11 choose "Show more options" first).

#### Taskbar, quitting & LibreOffice (Windows)

- The Settings window is the main window and always keeps a taskbar icon; the **✕ button only hides it** to the tray.
- Quit: right-click the tray icon → "Quit FileConverter". If the UI is unresponsive, press **Ctrl+Shift+Esc**, find FileConverter in Task Manager and choose "End task".
- **LibreOffice (optional, better fidelity)**: document → PDF conversions go through LibreOffice headless when it is installed; otherwise FileConverter falls back to its built-in renderer and hints "Install LibreOffice for a higher-fidelity PDF" after converting. Install it from [libreoffice.org](https://www.libreoffice.org/download/download-libreoffice/) if you want the higher fidelity — no extra configuration is needed.

> On first run, Windows SmartScreen may show "Windows protected your PC" — click "More info" → "Run anyway". The app is unsigned; this is a normal prompt. You may verify the file hash if concerned.

> Legacy note: v1.0 (Electron) has been superseded by v2.0; its source is archived in the `FileConverter-Windows-Electron/` directory of this repo. See the [v1.0-windows Release](https://github.com/f8r4ksv7v4-hub/FileConverter/releases/tag/v1.0-windows) if needed.

### Support & Feedback

- Bug reports / feedback: [GitHub Issues](https://github.com/f8r4ksv7v4-hub/FileConverter/issues)
- If you like this app, consider supporting the author via [爱发电](https://afdian.com/a/xzy_projects) or [GitHub Sponsors](https://github.com/sponsors/f8r4ksv7v4-hub)

### Download

| Version | Package | Platform | Size | Direct link |
| --- | --- | --- | --- | --- |
| **3.3** (recommended) | `FileConverter-3.3-macOS.zip` | macOS | ~2.9 MB | [Download](https://github.com/f8r4ksv7v4-hub/FileConverter/releases/download/v3.3/FileConverter-3.3-macOS.zip) |
| 2.0 | `FileConverter-2.0-windows.exe` | Windows | ~170 MB | [Download](https://github.com/f8r4ksv7v4-hub/FileConverter/releases/download/v2.0-windows/FileConverter-2.0-windows.exe) |

All versions and full release notes live on the [Releases](https://github.com/f8r4ksv7v4-hub/FileConverter/releases) page. On first launch the macOS build is stopped by Gatekeeper; see *First Launch Notice* above.

### Environment Requirements

- macOS 13 or later (Apple Silicon or Intel Mac)
- Windows 10 / 11 (64-bit)

### License

MIT
