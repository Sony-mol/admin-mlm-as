# Quick Deploy Script for Tier Management Fix
Write-Host "=== Building Frontend ===" -ForegroundColor Cyan

# Navigate to frontend directory
Set-Location -Path $PSScriptRoot

# Install dependencies (if needed)
Write-Host "`nChecking dependencies..." -ForegroundColor Yellow
if (!(Test-Path "node_modules")) {
    Write-Host "Installing dependencies..." -ForegroundColor Yellow
    npm install
}

# Build the project
Write-Host "`nBuilding project..." -ForegroundColor Yellow
npm run build

if ($LASTEXITCODE -eq 0) {
    Write-Host "`n✓ Build successful!" -ForegroundColor Green
    Write-Host "`nDist folder created at: $(Get-Location)\dist" -ForegroundColor White
    Write-Host "`nNext steps:" -ForegroundColor Cyan
    Write-Host "1. Login to Railway CLI: railway login" -ForegroundColor White
    Write-Host "2. Link project: railway link" -ForegroundColor White
    Write-Host "3. Deploy: railway up" -ForegroundColor White
    Write-Host "`nOr use Railway Dashboard to deploy." -ForegroundColor Yellow
} else {
    Write-Host "`n✗ Build failed!" -ForegroundColor Red
    Write-Host "Check the error messages above." -ForegroundColor Yellow
}

