# Void Development Environment Startup Script
# Purpose: Configure Node.js environment, start watch modes, and launch Void app

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Void Dev Environment Startup" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Configure fnm environment
Write-Host "[1/4] Configuring fnm environment..." -ForegroundColor Yellow
fnm env --use-on-cd | Out-String | Invoke-Expression
if ($LASTEXITCODE -ne 0) {
    Write-Host "Error: fnm environment configuration failed" -ForegroundColor Red
    exit 1
}
Write-Host "Success: fnm environment configured" -ForegroundColor Green
Write-Host ""

# Step 2: Switch to specified Node.js version
Write-Host "[2/4] Switching to Node.js v20.18.2..." -ForegroundColor Yellow
fnm use 20.18.2
if ($LASTEXITCODE -ne 0) {
    Write-Host "Error: Node.js version switch failed" -ForegroundColor Red
    exit 1
}

# Verify Node.js version
$nodeVersion = node --version
Write-Host "Success: Current Node.js version: $nodeVersion" -ForegroundColor Green
Write-Host ""

# Step 3: Start watch modes in background
Write-Host "[3/4] Starting watch modes..." -ForegroundColor Yellow
Write-Host ""

# Start watch (TypeScript compilation) in new window
Write-Host "Starting TypeScript watch (npm run watch)..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "fnm env --use-on-cd | Out-String | Invoke-Expression; fnm use 20.18.2; Write-Host 'TypeScript Watch Mode' -ForegroundColor Green; Write-Host '================================' -ForegroundColor Cyan; Write-Host ''; npm run watch" -WindowStyle Normal
Start-Sleep -Seconds 2

# Start watchreact (React compilation) in new window
Write-Host "Starting React watch (npm run watchreact)..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "fnm env --use-on-cd | Out-String | Invoke-Expression; fnm use 20.18.2; Write-Host 'React Watch Mode' -ForegroundColor Green; Write-Host '================================' -ForegroundColor Cyan; Write-Host ''; npm run watchreact" -WindowStyle Normal
Start-Sleep -Seconds 2

Write-Host ""
Write-Host "Success: Watch modes started in separate windows" -ForegroundColor Green
Write-Host ""

# Step 4: Launch Void application
Write-Host "[4/4] Launching Void application..." -ForegroundColor Yellow
Write-Host "Tip: Press Ctrl+R in Void to reload after code changes" -ForegroundColor Cyan
Write-Host "Tip: Close watch windows to stop watch modes" -ForegroundColor Cyan
Write-Host ""


# ./scripts/code.bat

