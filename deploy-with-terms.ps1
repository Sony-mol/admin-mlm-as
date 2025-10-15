# Quick deployment script for admin panel with Terms editor

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "CQ Wealth Admin Panel - Deployment" -ForegroundColor Cyan
Write-Host "Terms & Conditions Editor Included" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if we're in the right directory
if (-not (Test-Path "package.json")) {
    Write-Host "❌ Error: Please run this script from the asmlm directory" -ForegroundColor Red
    exit 1
}

Write-Host "Step 1: Installing dependencies..." -ForegroundColor Yellow
npm install
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ npm install failed" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Dependencies installed" -ForegroundColor Green
Write-Host ""

Write-Host "Step 2: Building project..." -ForegroundColor Yellow
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Build failed" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Build successful" -ForegroundColor Green
Write-Host ""

Write-Host "Step 3: Checking dist folder..." -ForegroundColor Yellow
if (Test-Path "dist/index.html") {
    Write-Host "✅ Build artifacts created successfully" -ForegroundColor Green
    
    # Show build size
    $distSize = (Get-ChildItem -Path "dist" -Recurse | Measure-Object -Property Length -Sum).Sum / 1MB
    Write-Host "   Build size: $([math]::Round($distSize, 2)) MB" -ForegroundColor Gray
} else {
    Write-Host "❌ Build artifacts not found" -ForegroundColor Red
    exit 1
}
Write-Host ""

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Build Complete! ✨" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "📦 Build Output:" -ForegroundColor White
Write-Host "   Location: dist/" -ForegroundColor Gray
Write-Host "   Files:" -ForegroundColor Gray
Write-Host "   - index.html" -ForegroundColor Gray
Write-Host "   - assets/index.css" -ForegroundColor Gray
Write-Host "   - assets/index.js" -ForegroundColor Gray
Write-Host ""

Write-Host "🚀 Deployment Options:" -ForegroundColor White
Write-Host ""
Write-Host "Option 1: Auto-deploy to Railway" -ForegroundColor Yellow
Write-Host "   git add ." -ForegroundColor Gray
Write-Host "   git commit -m 'Add Terms editor to admin panel'" -ForegroundColor Gray
Write-Host "   git push origin main" -ForegroundColor Gray
Write-Host "   (Railway will auto-deploy)" -ForegroundColor Gray
Write-Host ""

Write-Host "Option 2: Deploy via Railway CLI" -ForegroundColor Yellow
Write-Host "   railway up" -ForegroundColor Gray
Write-Host ""

Write-Host "Option 3: Manual upload" -ForegroundColor Yellow
Write-Host "   Upload dist/ folder to your hosting" -ForegroundColor Gray
Write-Host ""

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "New Features in This Build:" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "✅ Terms & Conditions Editor" -ForegroundColor Green
Write-Host "✅ Privacy Policy Editor" -ForegroundColor Green
Write-Host "✅ Live Preview Mode" -ForegroundColor Green
Write-Host "✅ Version Control" -ForegroundColor Green
Write-Host "✅ Navigation Menu (Terms & Privacy)" -ForegroundColor Green
Write-Host ""

Write-Host "📝 After Deployment:" -ForegroundColor White
Write-Host "1. Login to admin panel" -ForegroundColor Gray
Write-Host "2. Click 'Terms & Privacy' in sidebar" -ForegroundColor Gray
Write-Host "3. Edit and publish terms" -ForegroundColor Gray
Write-Host "4. Changes reflect in mobile app immediately!" -ForegroundColor Gray
Write-Host ""

Write-Host "🎉 Happy Deploying!" -ForegroundColor Green

