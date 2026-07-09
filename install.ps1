# Void Dependency Installation Script
# Purpose: Configure Node.js environment and install dependencies

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Void Dependency Installation" -ForegroundColor Cyan
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
Write-Host "[2/3] Switching to Node.js v22.18.0..." -ForegroundColor Yellow
fnm use 22.18.0
if ($LASTEXITCODE -ne 0) {
    Write-Host "Error: Node.js version switch failed" -ForegroundColor Red
    exit 1
}

# Verify Node.js version
$nodeVersion = node --version
Write-Host "Success: Current Node.js version: $nodeVersion" -ForegroundColor Green
Write-Host ""

# Step 3: Install dependencies
Write-Host "[3/3] Installing dependencies..." -ForegroundColor Yellow
Write-Host ""

npm install
if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "Error: Dependency installation failed" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  Installation completed successfully!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
