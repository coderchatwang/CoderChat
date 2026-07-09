; CoderChat Windows Installer Script
; Inno Setup 6.x compatible
; 
; 使用方法:
; 1. 先执行构建脚本:
;    - x64:  .\build-release.ps1
;    - arm64: .\build-release-arm64.ps1
; 2. 构建完成后，输出目录为:
;    - x64:  ..\VSCode-win32-x64\
;    - arm64: ..\VSCode-win32-arm64\
; 3. 使用 Inno Setup Compiler 编译此脚本
;
; 命令行编译示例:
;
; x64 系统级安装 (默认):
;   ISCC.exe coderchat-setup.iss
;   ISCC.exe coderchat-setup.iss /dArch=x64 /dInstallTarget=system
;
; x64 用户级安装:
;   ISCC.exe coderchat-setup.iss /dArch=x64 /dInstallTarget=user
;
; arm64 系统级安装:
;   ISCC.exe coderchat-setup.iss /dArch=arm64 /dInstallTarget=system
;
; arm64 用户级安装:
;   ISCC.exe coderchat-setup.iss /dArch=arm64 /dInstallTarget=user
;
; 自定义源目录和输出目录:
;   ISCC.exe coderchat-setup.iss /dArch=arm64 /dSourceDir="D:\build\VSCode-win32-arm64" /dOutputDir="D:\output"
;
; 自定义版本号:
;   ISCC.exe coderchat-setup.iss /dMajorMinorPatch=1.2.3 /dBuildNumber=0048

; ============================================
; 预处理器定义 - 默认值
; ============================================
#ifndef Arch
  #define Arch "x64"
#endif

#ifndef InstallTarget
  #define InstallTarget "system"
#endif

#ifndef MajorMinorPatch
  #define MajorMinorPatch "1.2.2"
#endif

#ifndef BuildNumber
  #define BuildNumber "0047"
#endif

#ifndef RepoDir
  #define RepoDir "."
#endif

#ifndef OutputDir
  #define OutputDir ".\installer-output"
#endif

; 根据架构设置默认源目录
#ifndef SourceDir
  #if Arch == "x64"
    #define SourceDir "..\VSCode-win32-x64"
  #else
    #define SourceDir "..\VSCode-win32-arm64"
  #endif
#endif

; 架构相关设置
#if Arch == "x64"
  #define ArchitecturesAllowed "x64compatible"
  #define ArchitecturesInstallIn64BitMode "x64compatible"
  ; x64 系统/用户安装的 AppId
  #if InstallTarget == "system"
    #define AppId "{{92B07A40-1B9D-4566-90FB-2C302E538FA6}}"
  #else
    #define AppId "{{99950B16-AD62-47E8-9FBC-6A8663E03609}}"
  #endif
#else
  #define ArchitecturesAllowed "arm64"
  #define ArchitecturesInstallIn64BitMode "arm64"
  ; arm64 系统/用户安装的 AppId
  #if InstallTarget == "system"
    #define AppId "{{040F1908-20E3-459F-B839-1C73DEFD3B7E}}"
  #else
    #define AppId "{{39236B3F-2827-4FE7-B0EF-B30392019B54}}"
  #endif
#endif

[Setup]
AppId={#AppId}
AppName=CoderChat
AppVersion={#MajorMinorPatch}.{#BuildNumber}
AppVerName=CoderChat {#MajorMinorPatch}
AppPublisher=CoderChat
AppPublisherURL=https://github.com/coderchatwang/CoderChat
AppSupportURL=https://github.com/coderchatwang/CoderChat/issues
AppUpdatesURL=https://github.com/coderchatwang/CoderChat/releases
DefaultGroupName=CoderChat
AllowNoIcons=yes
OutputDir={#OutputDir}
OutputBaseFilename=CoderChatSetup-{#Arch}-{#InstallTarget}
Compression=lzma2/ultra64
SolidCompression=yes
LZMAUseSeparateProcess=yes
AppMutex=coderchateditor
SetupMutex=coderchateditorsetup
WizardStyle=modern

; 安装界面图片
WizardSmallImageFile="{#RepoDir}\resources\win32\inno-void.bmp"
SetupIconFile={#RepoDir}\resources\win32\code.ico
UninstallDisplayIcon={app}\CoderChat.exe

; 系统环境
ChangesEnvironment=true
ChangesAssociations=true
MinVersion=10.0

; 架构设置
ArchitecturesAllowed={#ArchitecturesAllowed}
ArchitecturesInstallIn64BitMode={#ArchitecturesInstallIn64BitMode}

; 强制关闭应用
CloseApplications=force

; 默认安装目录
#if "user" == InstallTarget
DefaultDirName={userpf}\CoderChat
PrivilegesRequired=lowest
#else
DefaultDirName={pf}\CoderChat
PrivilegesRequired=admin
#endif

; 许可协议
LicenseFile={#RepoDir}\LICENSE.txt

; 安装界面设置
WizardSizePercent=100

[Languages]
Name: "english"; MessagesFile: "compiler:Default.isl"
; 如果安装了中文语言包，取消下面这行的注释
; Name: "chinesesimplified"; MessagesFile: "compiler:Languages\ChineseSimplified.isl"

[Messages]
english.BeveledLabel=English
; simplifiedChinese.BeveledLabel=简体中文

[CustomMessages]
english.InstallTitle=CoderChat Setup
english.InstallDescription=This will install CoderChat on your computer.
english.SelectDirLabel=Select the folder where CoderChat should be installed.
english.Other=Other Options:
english.AssociateWithFiles=Associate CoderChat with supported file types
english.AddToPath=Add CoderChat to PATH
english.AddContextMenuFiles=Add "Open with CoderChat" to files context menu
english.AddContextMenuFolders=Add "Open with CoderChat" to folders context menu
english.CreateDesktopIcon=Create a desktop shortcut
english.RunAfter=Run CoderChat after installation

; 中文翻译 (需要先启用中文语言包)
; simplifiedChinese.InstallTitle=CoderChat 安装程序
; simplifiedChinese.InstallDescription=将在您的计算机上安装 CoderChat。
; simplifiedChinese.SelectDirLabel=选择 CoderChat 的安装目录。
; simplifiedChinese.AssociateWithFiles=将 CoderChat 与支持的文件类型关联
; simplifiedChinese.AddToPath=将 CoderChat 添加到 PATH 环境变量
; simplifiedChinese.AddContextMenuFiles=在文件右键菜单添加"用 CoderChat 打开"
; simplifiedChinese.AddContextMenuFolders=在文件夹右键菜单添加"用 CoderChat 打开"
; simplifiedChinese.CreateDesktopIcon=创建桌面快捷方式
; simplifiedChinese.RunAfter=安装完成后运行 CoderChat

[InstallDelete]
; 清理旧版本文件
Type: filesandordirs; Name: "{app}\resources\app\out"; Check: IsNotBackgroundUpdate
Type: filesandordirs; Name: "{app}\resources\app\plugins"; Check: IsNotBackgroundUpdate
Type: filesandordirs; Name: "{app}\resources\app\extensions"; Check: IsNotBackgroundUpdate
Type: filesandordirs; Name: "{app}\resources\app\node_modules"; Check: IsNotBackgroundUpdate
Type: filesandordirs; Name: "{app}\resources\app\node_modules.asar.unpacked"; Check: IsNotBackgroundUpdate
Type: files; Name: "{app}\resources\app\node_modules.asar"; Check: IsNotBackgroundUpdate

[UninstallDelete]
Type: filesandordirs; Name: "{app}\_"

[Tasks]
Name: "desktopicon"; Description: "{cm:CreateDesktopIcon}"; GroupDescription: "{cm:AdditionalIcons}"; Flags: unchecked
Name: "addcontextmenufiles"; Description: "{cm:AddContextMenuFiles}"; GroupDescription: "{cm:Other}"; Flags: unchecked
Name: "addcontextmenufolders"; Description: "{cm:AddContextMenuFolders}"; GroupDescription: "{cm:Other}"; Flags: unchecked
Name: "associatewithfiles"; Description: "{cm:AssociateWithFiles}"; GroupDescription: "{cm:Other}"
Name: "addtopath"; Description: "{cm:AddToPath}"; GroupDescription: "{cm:Other}"
Name: "runcode"; Description: "{cm:RunAfter}"; GroupDescription: "{cm:Other}"; Check: WizardSilent

[Dirs]
Name: "{app}"; AfterInstall: DisableAppDirInheritance

[Files]
; 复制所有文件 (不排除 product.json)
Source: "{#SourceDir}\*"; Excludes: "\CodeSignSummary*.md,\tools,\tools\*,\appx,\appx\*"; DestDir: "{code:GetDestDir}"; Flags: ignoreversion recursesubdirs createallsubdirs
; 如果 tools 目录存在则复制
Source: "{#SourceDir}\tools\*"; DestDir: "{app}\tools"; Flags: ignoreversion skipifsourcedoesntexist recursesubdirs

[Icons]
Name: "{group}\CoderChat"; Filename: "{app}\CoderChat.exe"; AppUserModelID: "CoderChat.Editor"
Name: "{autodesktop}\CoderChat"; Filename: "{app}\CoderChat.exe"; Tasks: desktopicon; AppUserModelID: "CoderChat.Editor"

[Run]
Filename: "{app}\CoderChat.exe"; Description: "{cm:LaunchProgram,CoderChat}"; Tasks: runcode; Flags: nowait postinstall; Check: ShouldRunAfterUpdate
Filename: "{app}\CoderChat.exe"; Description: "{cm:LaunchProgram,CoderChat}"; Flags: nowait postinstall; Check: WizardNotSilent

[Registry]
; 文件关联 - 常用类型
#if "user" == InstallTarget
#define SoftwareClassesRootKey "HKCU"
#else
#define SoftwareClassesRootKey "HKLM"
#endif

; JavaScript (.js)
Root: {#SoftwareClassesRootKey}; Subkey: "Software\Classes\.js\OpenWithProgids"; ValueType: string; ValueName: "CoderChat.js"; ValueData: ""; Flags: uninsdeletevalue; Tasks: associatewithfiles
Root: {#SoftwareClassesRootKey}; Subkey: "Software\Classes\CoderChat.js"; ValueType: string; ValueName: ""; ValueData: "JavaScript File"; Flags: uninsdeletekey; Tasks: associatewithfiles
Root: {#SoftwareClassesRootKey}; Subkey: "Software\Classes\CoderChat.js\DefaultIcon"; ValueType: string; ValueName: ""; ValueData: "{app}\resources\app\resources\win32\javascript.ico"; Tasks: associatewithfiles
Root: {#SoftwareClassesRootKey}; Subkey: "Software\Classes\CoderChat.js\shell\open\command"; ValueType: string; ValueName: ""; ValueData: """{app}\CoderChat.exe"" ""%1"""; Tasks: associatewithfiles

; TypeScript (.ts)
Root: {#SoftwareClassesRootKey}; Subkey: "Software\Classes\.ts\OpenWithProgids"; ValueType: string; ValueName: "CoderChat.ts"; ValueData: ""; Flags: uninsdeletevalue; Tasks: associatewithfiles
Root: {#SoftwareClassesRootKey}; Subkey: "Software\Classes\CoderChat.ts"; ValueType: string; ValueName: ""; ValueData: "TypeScript File"; Flags: uninsdeletekey; Tasks: associatewithfiles
Root: {#SoftwareClassesRootKey}; Subkey: "Software\Classes\CoderChat.ts\DefaultIcon"; ValueType: string; ValueName: ""; ValueData: "{app}\resources\app\resources\win32\typescript.ico"; Tasks: associatewithfiles
Root: {#SoftwareClassesRootKey}; Subkey: "Software\Classes\CoderChat.ts\shell\open\command"; ValueType: string; ValueName: ""; ValueData: """{app}\CoderChat.exe"" ""%1"""; Tasks: associatewithfiles

; HTML (.html, .htm)
Root: {#SoftwareClassesRootKey}; Subkey: "Software\Classes\.html\OpenWithProgids"; ValueType: string; ValueName: "CoderChat.html"; ValueData: ""; Flags: uninsdeletevalue; Tasks: associatewithfiles
Root: {#SoftwareClassesRootKey}; Subkey: "Software\Classes\CoderChat.html"; ValueType: string; ValueName: ""; ValueData: "HTML File"; Flags: uninsdeletekey; Tasks: associatewithfiles
Root: {#SoftwareClassesRootKey}; Subkey: "Software\Classes\CoderChat.html\DefaultIcon"; ValueType: string; ValueName: ""; ValueData: "{app}\resources\app\resources\win32\html.ico"; Tasks: associatewithfiles
Root: {#SoftwareClassesRootKey}; Subkey: "Software\Classes\CoderChat.html\shell\open\command"; ValueType: string; ValueName: ""; ValueData: """{app}\CoderChat.exe"" ""%1"""; Tasks: associatewithfiles

Root: {#SoftwareClassesRootKey}; Subkey: "Software\Classes\.htm\OpenWithProgids"; ValueType: string; ValueName: "CoderChat.htm"; ValueData: ""; Flags: uninsdeletevalue; Tasks: associatewithfiles
Root: {#SoftwareClassesRootKey}; Subkey: "Software\Classes\CoderChat.htm"; ValueType: string; ValueName: ""; ValueData: "HTML File"; Flags: uninsdeletekey; Tasks: associatewithfiles
Root: {#SoftwareClassesRootKey}; Subkey: "Software\Classes\CoderChat.htm\DefaultIcon"; ValueType: string; ValueName: ""; ValueData: "{app}\resources\app\resources\win32\html.ico"; Tasks: associatewithfiles
Root: {#SoftwareClassesRootKey}; Subkey: "Software\Classes\CoderChat.htm\shell\open\command"; ValueType: string; ValueName: ""; ValueData: """{app}\CoderChat.exe"" ""%1"""; Tasks: associatewithfiles

; CSS (.css)
Root: {#SoftwareClassesRootKey}; Subkey: "Software\Classes\.css\OpenWithProgids"; ValueType: string; ValueName: "CoderChat.css"; ValueData: ""; Flags: uninsdeletevalue; Tasks: associatewithfiles
Root: {#SoftwareClassesRootKey}; Subkey: "Software\Classes\CoderChat.css"; ValueType: string; ValueName: ""; ValueData: "CSS File"; Flags: uninsdeletekey; Tasks: associatewithfiles
Root: {#SoftwareClassesRootKey}; Subkey: "Software\Classes\CoderChat.css\DefaultIcon"; ValueType: string; ValueName: ""; ValueData: "{app}\resources\app\resources\win32\css.ico"; Tasks: associatewithfiles
Root: {#SoftwareClassesRootKey}; Subkey: "Software\Classes\CoderChat.css\shell\open\command"; ValueType: string; ValueName: ""; ValueData: """{app}\CoderChat.exe"" ""%1"""; Tasks: associatewithfiles

; JSON (.json)
Root: {#SoftwareClassesRootKey}; Subkey: "Software\Classes\.json\OpenWithProgids"; ValueType: string; ValueName: "CoderChat.json"; ValueData: ""; Flags: uninsdeletevalue; Tasks: associatewithfiles
Root: {#SoftwareClassesRootKey}; Subkey: "Software\Classes\CoderChat.json"; ValueType: string; ValueName: ""; ValueData: "JSON File"; Flags: uninsdeletekey; Tasks: associatewithfiles
Root: {#SoftwareClassesRootKey}; Subkey: "Software\Classes\CoderChat.json\DefaultIcon"; ValueType: string; ValueName: ""; ValueData: "{app}\resources\app\resources\win32\json.ico"; Tasks: associatewithfiles
Root: {#SoftwareClassesRootKey}; Subkey: "Software\Classes\CoderChat.json\shell\open\command"; ValueType: string; ValueName: ""; ValueData: """{app}\CoderChat.exe"" ""%1"""; Tasks: associatewithfiles

; Python (.py)
Root: {#SoftwareClassesRootKey}; Subkey: "Software\Classes\.py\OpenWithProgids"; ValueType: string; ValueName: "CoderChat.py"; ValueData: ""; Flags: uninsdeletevalue; Tasks: associatewithfiles
Root: {#SoftwareClassesRootKey}; Subkey: "Software\Classes\CoderChat.py"; ValueType: string; ValueName: ""; ValueData: "Python File"; Flags: uninsdeletekey; Tasks: associatewithfiles
Root: {#SoftwareClassesRootKey}; Subkey: "Software\Classes\CoderChat.py\DefaultIcon"; ValueType: string; ValueName: ""; ValueData: "{app}\resources\app\resources\win32\python.ico"; Tasks: associatewithfiles
Root: {#SoftwareClassesRootKey}; Subkey: "Software\Classes\CoderChat.py\shell\open\command"; ValueType: string; ValueName: ""; ValueData: """{app}\CoderChat.exe"" ""%1"""; Tasks: associatewithfiles

; Markdown (.md)
Root: {#SoftwareClassesRootKey}; Subkey: "Software\Classes\.md\OpenWithProgids"; ValueType: string; ValueName: "CoderChat.md"; ValueData: ""; Flags: uninsdeletevalue; Tasks: associatewithfiles
Root: {#SoftwareClassesRootKey}; Subkey: "Software\Classes\CoderChat.md"; ValueType: string; ValueName: ""; ValueData: "Markdown File"; Flags: uninsdeletekey; Tasks: associatewithfiles
Root: {#SoftwareClassesRootKey}; Subkey: "Software\Classes\CoderChat.md\DefaultIcon"; ValueType: string; ValueName: ""; ValueData: "{app}\resources\app\resources\win32\markdown.ico"; Tasks: associatewithfiles
Root: {#SoftwareClassesRootKey}; Subkey: "Software\Classes\CoderChat.md\shell\open\command"; ValueType: string; ValueName: ""; ValueData: """{app}\CoderChat.exe"" ""%1"""; Tasks: associatewithfiles

; C/C++
Root: {#SoftwareClassesRootKey}; Subkey: "Software\Classes\.c\OpenWithProgids"; ValueType: string; ValueName: "CoderChat.c"; ValueData: ""; Flags: uninsdeletevalue; Tasks: associatewithfiles
Root: {#SoftwareClassesRootKey}; Subkey: "Software\Classes\CoderChat.c"; ValueType: string; ValueName: ""; ValueData: "C Source File"; Flags: uninsdeletekey; Tasks: associatewithfiles
Root: {#SoftwareClassesRootKey}; Subkey: "Software\Classes\CoderChat.c\DefaultIcon"; ValueType: string; ValueName: ""; ValueData: "{app}\resources\app\resources\win32\c.ico"; Tasks: associatewithfiles
Root: {#SoftwareClassesRootKey}; Subkey: "Software\Classes\CoderChat.c\shell\open\command"; ValueType: string; ValueName: ""; ValueData: """{app}\CoderChat.exe"" ""%1"""; Tasks: associatewithfiles

Root: {#SoftwareClassesRootKey}; Subkey: "Software\Classes\.cpp\OpenWithProgids"; ValueType: string; ValueName: "CoderChat.cpp"; ValueData: ""; Flags: uninsdeletevalue; Tasks: associatewithfiles
Root: {#SoftwareClassesRootKey}; Subkey: "Software\Classes\CoderChat.cpp"; ValueType: string; ValueName: ""; ValueData: "C++ Source File"; Flags: uninsdeletekey; Tasks: associatewithfiles
Root: {#SoftwareClassesRootKey}; Subkey: "Software\Classes\CoderChat.cpp\DefaultIcon"; ValueType: string; ValueName: ""; ValueData: "{app}\resources\app\resources\win32\cpp.ico"; Tasks: associatewithfiles
Root: {#SoftwareClassesRootKey}; Subkey: "Software\Classes\CoderChat.cpp\shell\open\command"; ValueType: string; ValueName: ""; ValueData: """{app}\CoderChat.exe"" ""%1"""; Tasks: associatewithfiles

; Java
Root: {#SoftwareClassesRootKey}; Subkey: "Software\Classes\.java\OpenWithProgids"; ValueType: string; ValueName: "CoderChat.java"; ValueData: ""; Flags: uninsdeletevalue; Tasks: associatewithfiles
Root: {#SoftwareClassesRootKey}; Subkey: "Software\Classes\CoderChat.java"; ValueType: string; ValueName: ""; ValueData: "Java Source File"; Flags: uninsdeletekey; Tasks: associatewithfiles
Root: {#SoftwareClassesRootKey}; Subkey: "Software\Classes\CoderChat.java\DefaultIcon"; ValueType: string; ValueName: ""; ValueData: "{app}\resources\app\resources\win32\java.ico"; Tasks: associatewithfiles
Root: {#SoftwareClassesRootKey}; Subkey: "Software\Classes\CoderChat.java\shell\open\command"; ValueType: string; ValueName: ""; ValueData: """{app}\CoderChat.exe"" ""%1"""; Tasks: associatewithfiles

; XML
Root: {#SoftwareClassesRootKey}; Subkey: "Software\Classes\.xml\OpenWithProgids"; ValueType: string; ValueName: "CoderChat.xml"; ValueData: ""; Flags: uninsdeletevalue; Tasks: associatewithfiles
Root: {#SoftwareClassesRootKey}; Subkey: "Software\Classes\CoderChat.xml"; ValueType: string; ValueName: ""; ValueData: "XML File"; Flags: uninsdeletekey; Tasks: associatewithfiles
Root: {#SoftwareClassesRootKey}; Subkey: "Software\Classes\CoderChat.xml\DefaultIcon"; ValueType: string; ValueName: ""; ValueData: "{app}\resources\app\resources\win32\xml.ico"; Tasks: associatewithfiles
Root: {#SoftwareClassesRootKey}; Subkey: "Software\Classes\CoderChat.xml\shell\open\command"; ValueType: string; ValueName: ""; ValueData: """{app}\CoderChat.exe"" ""%1"""; Tasks: associatewithfiles

; YAML
Root: {#SoftwareClassesRootKey}; Subkey: "Software\Classes\.yaml\OpenWithProgids"; ValueType: string; ValueName: "CoderChat.yaml"; ValueData: ""; Flags: uninsdeletevalue; Tasks: associatewithfiles
Root: {#SoftwareClassesRootKey}; Subkey: "Software\Classes\CoderChat.yaml"; ValueType: string; ValueName: ""; ValueData: "YAML File"; Flags: uninsdeletekey; Tasks: associatewithfiles
Root: {#SoftwareClassesRootKey}; Subkey: "Software\Classes\CoderChat.yaml\DefaultIcon"; ValueType: string; ValueName: ""; ValueData: "{app}\resources\app\resources\win32\yaml.ico"; Tasks: associatewithfiles
Root: {#SoftwareClassesRootKey}; Subkey: "Software\Classes\CoderChat.yaml\shell\open\command"; ValueType: string; ValueName: ""; ValueData: """{app}\CoderChat.exe"" ""%1"""; Tasks: associatewithfiles

Root: {#SoftwareClassesRootKey}; Subkey: "Software\Classes\.yml\OpenWithProgids"; ValueType: string; ValueName: "CoderChat.yml"; ValueData: ""; Flags: uninsdeletevalue; Tasks: associatewithfiles
Root: {#SoftwareClassesRootKey}; Subkey: "Software\Classes\CoderChat.yml"; ValueType: string; ValueName: ""; ValueData: "YAML File"; Flags: uninsdeletekey; Tasks: associatewithfiles
Root: {#SoftwareClassesRootKey}; Subkey: "Software\Classes\CoderChat.yml\DefaultIcon"; ValueType: string; ValueName: ""; ValueData: "{app}\resources\app\resources\win32\yaml.ico"; Tasks: associatewithfiles
Root: {#SoftwareClassesRootKey}; Subkey: "Software\Classes\CoderChat.yml\shell\open\command"; ValueType: string; ValueName: ""; ValueData: """{app}\CoderChat.exe"" ""%1"""; Tasks: associatewithfiles

; 右键菜单 - 文件
Root: {#SoftwareClassesRootKey}; Subkey: "Software\Classes\*\shell\CoderChat"; ValueType: string; ValueName: ""; ValueData: "Open with CoderChat"; Tasks: addcontextmenufiles; Flags: uninsdeletekey
Root: {#SoftwareClassesRootKey}; Subkey: "Software\Classes\*\shell\CoderChat"; ValueType: string; ValueName: "Icon"; ValueData: """{app}\CoderChat.exe"""; Tasks: addcontextmenufiles
Root: {#SoftwareClassesRootKey}; Subkey: "Software\Classes\*\shell\CoderChat\command"; ValueType: string; ValueName: ""; ValueData: """{app}\CoderChat.exe"" ""%1"""; Tasks: addcontextmenufiles

; 右键菜单 - 文件夹
Root: {#SoftwareClassesRootKey}; Subkey: "Software\Classes\Directory\shell\CoderChat"; ValueType: string; ValueName: ""; ValueData: "Open with CoderChat"; Tasks: addcontextmenufolders; Flags: uninsdeletekey
Root: {#SoftwareClassesRootKey}; Subkey: "Software\Classes\Directory\shell\CoderChat"; ValueType: string; ValueName: "Icon"; ValueData: """{app}\CoderChat.exe"""; Tasks: addcontextmenufolders
Root: {#SoftwareClassesRootKey}; Subkey: "Software\Classes\Directory\shell\CoderChat\command"; ValueType: string; ValueName: ""; ValueData: """{app}\CoderChat.exe"" ""%V"""; Tasks: addcontextmenufolders

Root: {#SoftwareClassesRootKey}; Subkey: "Software\Classes\Directory\Background\shell\CoderChat"; ValueType: string; ValueName: ""; ValueData: "Open with CoderChat"; Tasks: addcontextmenufolders; Flags: uninsdeletekey
Root: {#SoftwareClassesRootKey}; Subkey: "Software\Classes\Directory\Background\shell\CoderChat"; ValueType: string; ValueName: "Icon"; ValueData: """{app}\CoderChat.exe"""; Tasks: addcontextmenufolders
Root: {#SoftwareClassesRootKey}; Subkey: "Software\Classes\Directory\Background\shell\CoderChat\command"; ValueType: string; ValueName: ""; ValueData: """{app}\CoderChat.exe"" ""%V"""; Tasks: addcontextmenufolders

[Code]
var
  IsBackgroundUpdate: Boolean;

function GetDestDir(Param: String): String;
begin
  Result := ExpandConstant('{app}');
end;

function GetAppMutex(Param: String): String;
begin
  Result := 'coderchateditor';
end;

function IsNotBackgroundUpdate: Boolean;
begin
  Result := not IsBackgroundUpdate;
end;

function ShouldRunAfterUpdate: Boolean;
begin
  Result := IsBackgroundUpdate;
end;

function WizardNotSilent: Boolean;
begin
  Result := not WizardSilent;
end;

procedure DisableAppDirInheritance;
var
  AppDir: String;
begin
  AppDir := ExpandConstant('{app}');
  
  // 禁用继承以确保安装目录有正确的权限
  if DirExists(AppDir) then
  begin
    // 权限设置由安装程序自动处理
  end;
end;

function InitializeSetup: Boolean;
begin
  IsBackgroundUpdate := False;
  Result := True;
end;

procedure CurStepChanged(CurStep: TSetupStep);
begin
  if CurStep = ssPostInstall then
  begin
    // 安装完成后的操作
  end;
end;

procedure CurUninstallStepChanged(CurUninstallStep: TUninstallStep);
var
  DataDir: String;
begin
  if CurUninstallStep = usUninstall then
  begin
    // 询问是否删除用户数据
    DataDir := ExpandConstant('{userappdata}\.coderchat-editor');
    if DirExists(DataDir) then
    begin
      if MsgBox('是否删除用户数据目录？', mbConfirmation, MB_YESNO) = IDYES then
      begin
        DelTree(DataDir, True, True, True);
      end;
    end;
  end;
end;
