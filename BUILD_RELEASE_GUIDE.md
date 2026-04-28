# Void 项目打包编译指南

## 📋 目录

1. [前置条件](#前置条件)
2. [Windows 编译步骤](#windows-编译步骤)
3. [Mac/Linux 编译步骤](#maclinux-编译步骤)
4. [编译输出位置](#编译输出位置)
5. [常见问题解决](#常见问题解决)

---

## ⚠️ 前置条件

### 必需软件

- ✅ Node.js v20.18.2（已配置）
- ✅ npm 依赖（已安装）
- ⚠️ **Visual Studio 2022 Build Tools**（需要安装）

### 安装 Visual Studio Build Tools

1. **下载**：https://visualstudio.microsoft.com/thank-you-downloading-visual-studio/?sku=BuildTools

2. **安装组件**：
   - 工作负载：
     - ✅ 使用 C++ 的桌面开发
     - ✅ Node.js 生成工具
   - 单个组件：
     - ✅ MSVC v143 - VS 2022 C++ x64/x86 Spectre-mitigated libs
     - ✅ C++ ATL for latest build tools with Spectre Mitigations
     - ✅ C++ MFC for latest build tools with Spectre Mitigations

---

## 🪟 Windows 编译步骤

### 方案 1：编译 Windows x64 版本（最常用）

```powershell
# 1. 确保 Node.js 版本正确
fnm use 20.18.2

# 2. 编译（耗时约 25 分钟）
npm run gulp vscode-win32-x64
```

### 方案 2：编译 Windows ARM64 版本

```powershell
npm run gulp vscode-win32-arm64
```

---

## 🍎 Mac 编译步骤

### Apple Silicon (M1/M2/M3)

```bash
npm run gulp vscode-darwin-arm64
```

### Intel Mac

```bash
npm run gulp vscode-darwin-x64
```

---

## 🐧 Linux 编译步骤

### x64

```bash
npm run gulp vscode-linux-x64
```

### ARM64

```bash
npm run gulp vscode-linux-arm64
```

---

## 📂 编译输出位置

编译完成后，可执行文件会生成在 **void 目录的上级目录**：

```
workspace/
├── void/                    # 您的 Void 源码目录
└── VSCode-win32-x64/        # 编译输出（Windows）
    ├── Void.exe             # 主程序
    ├── resources/           # 资源文件
    └── ...
```

### Windows 输出目录

- **x64**: `../VSCode-win32-x64/`
- **ARM64**: `../VSCode-win32-arm64/`

### 运行编译后的版本

```powershell
# Windows
..\VSCode-win32-x64\Void.exe

# Mac
../VSCode-darwin-arm64/Void.app/Contents/MacOS/Electron

# Linux
../VSCode-linux-x64/void
```

---

## 🔧 完整编译流程（推荐）

```powershell
# 1. 清理之前的编译产物
npm run gulp clean

# 2. 编译 TypeScript 代码
npm run compile

# 3. 构建 React 组件
npm run buildreact

# 4. 下载内置扩展（可选，可能因网络失败）
npm run download-builtin-extensions

# 5. 打包编译
npm run gulp vscode-win32-x64
```

---

## ⚡ 快速编译脚本

创建 `build-release.ps1`：

```powershell
# Void 发布版本编译脚本

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Void Release Builder" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# 配置环境
Write-Host "[1/4] Configuring environment..." -ForegroundColor Yellow
fnm env --use-on-cd | Out-String | Invoke-Expression
fnm use 20.18.2

Write-Host "[2/4] Building React components..." -ForegroundColor Yellow
npm run buildreact

Write-Host "[3/4] Compiling TypeScript..." -ForegroundColor Yellow
npm run compile

Write-Host "[4/4] Packaging Windows x64..." -ForegroundColor Yellow
npm run gulp vscode-win32-x64

Write-Host ""
Write-Host "Build complete! Output: ../VSCode-win32-x64/" -ForegroundColor Green
```

---

## ❗ 常见问题解决

### 问题 1：缺少 C++ 编译工具

**错误信息**：
```
Error: Could not find any Visual Studio installation to use
```

**解决方案**：
- 安装 Visual Studio 2022 Build Tools
- 确保选择了 "使用 C++ 的桌面开发" 工作负载

---

### 问题 2：内存不足

**错误信息**：
```
FATAL ERROR: CALL_AND_RETRY_LAST Allocation failed - JavaScript heap out of memory
```

**解决方案**：
```powershell
# 增加 Node.js 内存限制
$env:NODE_OPTIONS="--max-old-space-size=8192"
npm run gulp vscode-win32-x64
```

---

### 问题 3：网络问题导致扩展下载失败

**错误信息**：
```
Error: Request failed with status code: 404
```

**解决方案**：
- 跳过内置扩展下载
- 或者手动下载扩展并放置到正确位置

---

### 问题 4：编译时间过长

**正常情况**：
- 首次编译：约 25-30 分钟
- 后续编译：约 15-20 分钟（有缓存）

**加速方法**：
```powershell
# 使用多核编译
$env:MAX_CPUS=8  # 根据您的 CPU 核心数调整
npm run gulp vscode-win32-x64
```

---

### 问题 5：AbortController 未定义

**错误信息**：
```
ReferenceError: AbortController is not defined
```

**解决方案**：
- 确保使用 Node.js v18 或更高版本
- 当前项目要求 v20.18.2，已满足要求

---

## 📝 编译选项说明

### Gulp 任务

| 命令 | 说明 |
|------|------|
| `npm run gulp vscode-win32-x64` | 编译 Windows x64 版本 |
| `npm run gulp vscode-win32-arm64` | 编译 Windows ARM64 版本 |
| `npm run gulp vscode-darwin-arm64` | 编译 Mac Apple Silicon 版本 |
| `npm run gulp vscode-darwin-x64` | 编译 Mac Intel 版本 |
| `npm run gulp vscode-linux-x64` | 编译 Linux x64 版本 |
| `npm run gulp vscode-linux-arm64` | 编译 Linux ARM64 版本 |

---

## 🎯 推荐编译流程

### 首次编译

```powershell
# 1. 确认环境
fnm use 20.18.2
node --version  # 应该显示 v20.18.2

# 2. 清理旧文件
npm run gulp clean

# 3. 编译代码
npm run compile

# 4. 构建 React
npm run buildreact

# 5. 打包（需要安装 VS Build Tools）
npm run gulp vscode-win32-x64
```

### 日常开发

日常开发**不需要**编译发布版本，使用开发者模式即可：

```powershell
# 启动开发者模式
.\start-dev.ps1

# 另一个终端启动 Void
.\scripts\code.bat
```

---

## 📊 编译产物说明

编译完成后，您会得到：

```
VSCode-win32-x64/
├── Void.exe                    # 主程序
├── LICENSE.txt                 # 许可证
├── resources/                  # 资源文件
│   ├── app/                    # 应用代码
│   └── extensions/             # 内置扩展
├── locales/                    # 本地化文件
└── ...
```

### 打包为安装包（可选）

如果需要创建安装包（.exe 安装程序），需要额外的步骤：

```powershell
# Windows 安装包
npm run gulp vscode-win32-x64-setup
```

---

## 💡 提示

1. **编译时间**：首次编译较慢，请耐心等待
2. **磁盘空间**：确保有至少 10GB 可用空间
3. **网络连接**：编译过程需要下载一些依赖
4. **杀毒软件**：可能会误报，建议临时关闭
5. **开发者模式**：日常开发推荐使用开发者模式，更快速

---

## 🔗 相关资源

- 官方构建仓库：https://github.com/voideditor/void-builder
- 贡献指南：HOW_TO_CONTRIBUTE.md
- 代码库指南：VOID_CODEBASE_GUIDE.md

---

## ✅ 检查清单

编译前确认：

- [ ] 已安装 Visual Studio 2022 Build Tools
- [ ] Node.js 版本为 v20.18.2
- [ ] npm 依赖已安装（npm install）
- [ ] React 组件已构建（npm run buildreact）
- [ ] 代码已编译（npm run compile）
- [ ] 有足够的磁盘空间（>10GB）
- [ ] 网络连接正常

祝您编译顺利！🎉
