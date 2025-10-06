# Railway Deployment Script
# This script will help you deploy to Railway using the CLI

Write-Host "=== Railway Deployment Script ===" -ForegroundColor Cyan

# Check if Railway CLI is installed
Write-Host "`nChecking Railway CLI..." -ForegroundColor Yellow
$railwayVersion = railway --version 2>$null
if ($?) {
    Write-Host "✓ Railway CLI is installed: $railwayVersion" -ForegroundColor Green
} else {
    Write-Host "✗ Railway CLI not found. Install it first:" -ForegroundColor Red
    Write-Host "  npm install -g @railway/cli" -ForegroundColor White
    exit 1
}

# Check authentication
Write-Host "`nChecking authentication..." -ForegroundColor Yellow
$whoami = railway whoami 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ Already authenticated as: $whoami" -ForegroundColor Green
} else {
    Write-Host "✗ Not authenticated. Please run:" -ForegroundColor Red
    Write-Host "  railway login" -ForegroundColor White
    Write-Host "`nOpening login in 3 seconds..." -ForegroundColor Yellow
    Start-Sleep -Seconds 3
    railway login
    if ($LASTEXITCODE -ne 0) {
        Write-Host "✗ Login failed" -ForegroundColor Red
        exit 1
    }
}

# Link project
Write-Host "`nLinking to Railway project..." -ForegroundColor Yellow
$status = railway status 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "Project not linked. Linking now..." -ForegroundColor Yellow
    railway link
    if ($LASTEXITCODE -ne 0) {
        Write-Host "✗ Failed to link project" -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "✓ Project already linked" -ForegroundColor Green
    Write-Host $status -ForegroundColor White
}

# Deploy
Write-Host "`n=== Starting Deployment ===" -ForegroundColor Cyan
Write-Host "Deploying to Railway..." -ForegroundColor Yellow
railway up

if ($LASTEXITCODE -eq 0) {
    Write-Host "`n✓ Deployment successful!" -ForegroundColor Green
    Write-Host "`nGetting deployment status..." -ForegroundColor Yellow
    railway status
    
    Write-Host "`nGetting service URL..." -ForegroundColor Yellow
    railway domain
} else {
    Write-Host "`n✗ Deployment failed!" -ForegroundColor Red
    Write-Host "Check the logs with: railway logs" -ForegroundColor Yellow
    exit 1
}

