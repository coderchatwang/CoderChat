# Void Development Environment Startup Script
# Purpose: Configure Node.js environment and start watch mode

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Void Dev Environment Startup" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Configure fnm environment
Write-Host "[1/3] Configuring fnm environment..." -ForegroundColor Yellow
fnm env --use-on-cd | Out-String | Invoke-Expression
if ($LASTEXITCODE -ne 0) {
    Write-Host "Error: fnm environment configuration failed" -ForegroundColor Red
    exit 1
}
Write-Host "Success: fnm environment configured" -ForegroundColor Green
Write-Host ""

# Step 2: Switch to specified Node.js version
Write-Host "[2/3] Switching to Node.js v20.18.2..." -ForegroundColor Yellow
fnm use 20.18.2
if ($LASTEXITCODE -ne 0) {
    Write-Host "Error: Node.js version switch failed" -ForegroundColor Red
    exit 1
}

# Verify Node.js version
$nodeVersion = node --version
Write-Host "Success: Current Node.js version: $nodeVersion" -ForegroundColor Green
Write-Host ""

# Step 3: Start watch mode
Write-Host "[3/3] Starting watch mode..." -ForegroundColor Yellow
Write-Host "Tip: Press Ctrl+C to stop watch mode" -ForegroundColor Cyan
Write-Host ""

# Sync React build output to correct location
Write-Host "Syncing React build output..." -ForegroundColor Cyan
$reactOutSrc = "src\vs\workbench\contrib\void\browser\react\out"
$reactOutDest = "out\vs\workbench\contrib\void\browser\react\out"

# Create destination directory if it doesn't exist
$destDir = Join-Path $PWD $reactOutDest
if (-not (Test-Path $destDir)) {
    New-Item -ItemType Directory -Force -Path $destDir | Out-Null
}

# Sync all React modules
$modules = @("sidebar-tsx", "void-editor-widgets-tsx", "void-settings-tsx", "void-tooltip", "void-onboarding", "quick-edit-tsx", "diff")
foreach ($module in $modules) {
    $srcPath = Join-Path $PWD "$reactOutSrc\$module\*"
    $destPath = Join-Path $destDir $module
    Copy-Item -Path $srcPath -Destination $destPath -Force -Recurse
    Write-Host "  Synced $module" -ForegroundColor Gray
}
Write-Host "Success: React output synced" -ForegroundColor Green
Write-Host ""

./scripts/code.bat
