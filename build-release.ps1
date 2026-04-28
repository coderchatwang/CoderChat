# Void Release Build Script
# Purpose: Build a production-ready release of Void

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Void Release Builder" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check Visual Studio Build Tools
Write-Host "[Pre-check] Looking for Visual Studio Build Tools..." -ForegroundColor Yellow
$vsPath = $null
$vsPaths = @(
    "C:\Program Files\Microsoft Visual Studio\2022\Community",
    "C:\Program Files\Microsoft Visual Studio\2022\Professional",
    "C:\Program Files (x86)\Microsoft Visual Studio\2022\BuildTools"
)

foreach ($path in $vsPaths) {
    if (Test-Path $path) {
        $vsPath = $path
        break
    }
}

if (-not $vsPath) {
    Write-Host "Warning: Visual Studio Build Tools not found!" -ForegroundColor Red
    Write-Host "Please install from: https://visualstudio.microsoft.com/thank-you-downloading-visual-studio/?sku=BuildTools" -ForegroundColor Yellow
    Write-Host ""
    $continue = Read-Host "Continue anyway? (y/n)"
    if ($continue -ne 'y') {
        exit 1
    }
} else {
    Write-Host "Found Visual Studio at: $vsPath" -ForegroundColor Green
}

Write-Host ""

# Step 1: Configure environment
Write-Host "[1/5] Configuring environment..." -ForegroundColor Yellow
fnm env --use-on-cd | Out-String | Invoke-Expression
fnm use 20.18.2

$nodeVersion = node --version
Write-Host "Node.js version: $nodeVersion" -ForegroundColor Green
Write-Host ""

# Step 2: Build React components
Write-Host "[2/5] Building React components..." -ForegroundColor Yellow
npm run buildreact
Write-Host ""

# Step 3: Compile TypeScript
Write-Host "[3/5] Compiling TypeScript..." -ForegroundColor Yellow
npm run compile
Write-Host ""

# Step 4: Set build options
Write-Host "[4/5] Setting build options..." -ForegroundColor Yellow
$env:NODE_OPTIONS = "--max-old-space-size=8192"
Write-Host "Memory limit set to 8GB" -ForegroundColor Green
Write-Host ""

# Step 5: Build release
Write-Host "[5/5] Building Windows x64 release..." -ForegroundColor Yellow
Write-Host "This may take 20-30 minutes. Please be patient..." -ForegroundColor Cyan
Write-Host ""

npm run gulp vscode-win32-x64

# Check result
if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Green
    Write-Host "  Build Successful!" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "Output location: ..\VSCode-win32-x64\" -ForegroundColor Cyan
    Write-Host ""

    # Check if output exists
    $outputPath = Resolve-Path "..\VSCode-win32-x64" -ErrorAction SilentlyContinue
    if ($outputPath) {
        Write-Host "Build contents:" -ForegroundColor Yellow
        Get-ChildItem $outputPath | Select-Object Name, Length | Format-Table
        Write-Host ""
        Write-Host "To run: ..\VSCode-win32-x64\Void.exe" -ForegroundColor Cyan
    }
} else {
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Red
    Write-Host "  Build Failed!" -ForegroundColor Red
    Write-Host "========================================" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please check the error messages above." -ForegroundColor Yellow
    Write-Host "Common issues:" -ForegroundColor Yellow
    Write-Host "  - Visual Studio Build Tools not installed" -ForegroundColor Yellow
    Write-Host "  - Insufficient disk space (need 10GB+)" -ForegroundColor Yellow
    Write-Host "  - Network connectivity issues" -ForegroundColor Yellow
    exit 1
}
