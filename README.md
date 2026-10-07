# FileConverter

FileConverter 是一款 macOS 本地文件转换工具，基于 SwiftUI + AppKit 开发，所有转换均在本地完成，不上传云端，保护你的文件隐私。

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

Windows 版（Electron）已发布，设计与功能与 macOS 版保持一致：悬浮球拖拽格式轮盘、图片/音视频格式互转、PDF 合并、图片工具（裁剪 / 加背景 / 涂黑标记 / 多水印 / 色彩调整）、中英双语、自动更新。

- **下载**：[FileConverter-Windows-v1.0-win32-x64.zip](https://github.com/f8r4ksv7v4-hub/FileConverter/releases/tag/v1.0-windows)（约 185MB）
- **使用**：解压后双击 `FileConverter.exe` 即可运行，无需安装
- **系统要求**：Windows 10 / 11（64 位）

> 首次运行时 Windows SmartScreen 可能提示「Windows 已保护你的电脑」，点击「更多信息」→「仍要运行」即可。应用未签名，属正常提示；如不放心可先核对下载文件的哈希值。

## 环境要求

- macOS 13 或更高版本（Apple Silicon 或 Intel Mac）
- Windows 10 / 11（64 位）

## License

MIT
