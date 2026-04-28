# Void 中文语言包安装指南

## 📦 已完成的配置

✅ 已修改 `product.json`，添加中文语言包配置：
```json
"builtInExtensions": [
    {
        "name": "MS-CEINTL.vscode-language-pack-zh-hans",
        "version": "1.98.2025022817",
        "repo": "https://github.com/microsoft/vscode-loc",
        "metadata": {
            "id": "e4ee7751-6514-4731-9cdb-7580ffa9e70b",
            ...
        }
    }
]
```

✅ 已下载中文语言包文件到：`$env:TEMP\chinese-language-pack.vsix`

---

## 🚀 安装方法（选择其一）

### 方法 1：在 Void 中直接安装 VSIX（推荐）

1. **启动 Void 开发者模式**
   ```powershell
   .\scripts\code.bat
   ```

2. **安装语言包**
   - 按 `Ctrl+Shift+P` 打开命令面板
   - 输入：`Extensions: Install from VSIX...`
   - 选择文件：`C:\Users\12608\AppData\Local\Temp\chinese-language-pack.vsix`

3. **切换语言**
   - 按 `Ctrl+Shift+P`
   - 输入：`Configure Display Language`
   - 选择 `zh-cn` (中文简体)
   - 重启 Void

---

### 方法 2：手动放置到扩展目录

1. **创建扩展目录**
   ```powershell
   $extensionPath = "$env:USERPROFILE\.void-editor-dev\extensions\ms-ceintl.vscode-language-pack-zh-hans-1.99.0"
   New-Item -ItemType Directory -Path $extensionPath -Force
   ```

2. **解压 VSIX 文件**
   ```powershell
   Expand-Archive -Path "$env:TEMP\chinese-language-pack.vsix" -DestinationPath $extensionPath -Force
   ```

3. **重启 Void**

---

### 方法 3：从市场安装（需要网络）

1. **在 Void 中打开扩展面板**
   - 按 `Ctrl+Shift+X`

2. **搜索并安装**
   - 搜索：`Chinese Simplified Language Pack`
   - 点击安装

3. **切换语言**
   - 按 `Ctrl+Shift+P`
   - 输入：`Configure Display Language`
   - 选择 `zh-cn`

---

## ✅ 验证安装

安装完成后，Void 的界面应该显示为中文。

如果需要切换回英文：
- 按 `Ctrl+Shift+P`
- 输入：`Configure Display Language`
- 选择 `en` (English)
- 重启 Void

---

## 🔧 编译发布版本时内置

如果要编译发布版本并内置中文语言包：

1. **确保 product.json 已配置**（已完成）

2. **编译前下载内置扩展**
   ```powershell
   npm run download-builtin-extensions
   ```

3. **编译发布版本**
   ```powershell
   npm run gulp vscode-win32-x64
   ```

**注意**：由于网络问题，`download-builtin-extensions` 可能失败。此时可以：
- 手动下载扩展并放置到正确位置
- 或者在发布版本中不包含内置扩展，让用户自行安装

---

## 📝 相关文件

- 配置文件：`product.json`
- 语言包文件：`$env:TEMP\chinese-language-pack.vsix`
- 扩展目录：`.void-editor-dev\extensions\`（开发模式）
- 扩展目录：`.void-editor\extensions\`（发布模式）

---

## 💡 提示

- Void 使用 VS Code 的语言包系统，完全兼容
- 可以随时切换显示语言
- 支持中文简体的完整本地化
