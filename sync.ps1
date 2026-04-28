# Void Development Environment Startup Script
# Purpose: Configure Node.js environment and start watch mode

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Void Dev Environment Startup" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
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

