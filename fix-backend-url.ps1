# Fix Backend URL - Deploy with Correct Backend URL
# This script will rebuild and redeploy the frontend with the correct backend URL

Write-Host "=== Fixing Backend URL Issue ===" -ForegroundColor Cyan

# Check if we're in the correct directory
if (-not (Test-Path "package.json")) {
    Write-Host "✗ Not in the correct directory. Please run this from the asmlm directory." -ForegroundColor Red
    exit 1
}

Write-Host "`n=== Building Frontend with Correct Backend URL ===" -ForegroundColor Yellow

# Set environment variables for build
$env:VITE_API_BASE_URL = ""
$env:NODE_ENV = "production"

# Build the frontend
Write-Host "Building frontend..." -ForegroundColor Yellow
npm run build

if ($LASTEXITCODE -ne 0) {
    Write-Host "✗ Build failed!" -ForegroundColor Red
    exit 1
}

Write-Host "✓ Frontend built successfully!" -ForegroundColor Green

Write-Host "`n=== Deploying to Railway ===" -ForegroundColor Yellow

# Check if Railway CLI is installed
$railwayVersion = railway --version 2>$null
if (-not $?) {
    Write-Host "✗ Railway CLI not found. Install it first:" -ForegroundColor Red
    Write-Host "  npm install -g @railway/cli" -ForegroundColor White
    exit 1
}

# Deploy to Railway
Write-Host "Deploying to Railway..." -ForegroundColor Yellow
railway up

if ($LASTEXITCODE -eq 0) {
    Write-Host "`n✓ Deployment successful!" -ForegroundColor Green
    Write-Host "`nGetting deployment status..." -ForegroundColor Yellow
    railway status
    
    Write-Host "`nGetting service URL..." -ForegroundColor Yellow
    railway domain
    
    Write-Host "`n=== Backend URL Fix Complete ===" -ForegroundColor Green
    Write-Host "The frontend should now use the correct backend URL:" -ForegroundColor White
    Write-Host "  https://asmlmbackend-production.up.railway.app" -ForegroundColor Cyan
    Write-Host "`nPlease test the application to ensure CORS errors are resolved." -ForegroundColor Yellow
} else {
    Write-Host "`n✗ Deployment failed!" -ForegroundColor Red
    Write-Host "Check the logs with: railway logs" -ForegroundColor Yellow
    exit 1
}
