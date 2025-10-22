# Switch to Direct API Calls - Production Optimized
# This script will configure the frontend for direct API calls to the backend

Write-Host "=== Switching to Direct API Calls ===" -ForegroundColor Cyan

# Update API configuration for direct calls
Write-Host "`n=== Updating API Configuration ===" -ForegroundColor Yellow

# Create new API config for direct calls
$apiConfig = @"
// API Configuration - Direct API Calls
// Use direct backend URL for production
const API_BASE_URL = 'https://asmlmbackend-production.up.railway.app';

// Helper function to get full API URL
export const getApiUrl = (path) => {
  if (path.startsWith('http')) return path; // Already full URL
  return `${API_BASE_URL}${path.startsWith('/') ? path : '/' + path}`;
};

export const API_ENDPOINTS = {
  LOGIN: getApiUrl('/api/users/login'),
  REFRESH_TOKEN: getApiUrl('/api/users/refresh-token'),
  FORGOT_PASSWORD: getApiUrl('/api/users/forgot-password'),
  RESET_PASSWORD: getApiUrl('/api/users/reset-password'),
  PROFILE: getApiUrl('/api/users/profile'),
  USERS: getApiUrl('/api/users'),
  DASHBOARD: getApiUrl('/api/commissions/admin/dashboard'),
  PRODUCTS: getApiUrl('/api/products'),
  WITHDRAWALS: getApiUrl('/api/withdrawals'),
  ORDERS: getApiUrl('/api/orders'),
  ORDER_DETAILS: getApiUrl('/api/orders'),
  PAYMENTS: getApiUrl('/api/payments'),
  PAYMENT_DETAILS: getApiUrl('/api/payments'),
  PAYMENTS_STATISTICS: getApiUrl('/api/payments/statistics'),
  ADMIN_USER_BALANCE: getApiUrl('/api/payments/admin/user'),
  ACTIVITY_LOGS: getApiUrl('/api/activity-logs'),
  TIER_STRUCTURE: getApiUrl('/api/admin/tier-management/structure'),
  TIER_STATISTICS: getApiUrl('/api/admin/tier-management/statistics'),
  COMMISSION_CONFIGS: getApiUrl('/api/settings/commission-configs'),
  SYSTEM_STATS: getApiUrl('/api/settings/system-stats'),
  RECENT_ACTIVITIES: getApiUrl('/api/activity-logs/recent'),
  ACTIVITY_STATS: getApiUrl('/api/activity-logs/statistics'),
  ADMINS: getApiUrl('/api/admin'),
  CREATE_ADMIN: getApiUrl('/api/users/create-admin'),
  TOP_PERFORMERS: getApiUrl('/api/users/top-performers'),
  TIER_LEVEL_BREAKDOWN: getApiUrl('/api/users/tier-level-breakdown'),
  COMMISSION_DASHBOARD: getApiUrl('/api/commissions/admin/dashboard'),
  PENDING_COMMISSIONS: getApiUrl('/api/commissions/admin/status/PENDING'),
  PAID_COMMISSIONS: getApiUrl('/api/commissions/admin/status/PAID'),
  MONTHLY_REVENUE: getApiUrl('/api/commissions/monthly-revenue'),
  UPDATE_COMMISSION: getApiUrl('/api/commissions/admin'),
  BULK_UPDATE: getApiUrl('/api/commissions/admin/bulk-status'),
  UPDATE_STRUCTURE: getApiUrl('/api/admin/tier-management/structure'),
  RESET_DEFAULT: getApiUrl('/api/admin/tier-management/reset'),
  INITIALIZE: getApiUrl('/api/settings/commission-configs/initialize'),
  BULK_UPDATE_CONFIGS: getApiUrl('/api/settings/commission-configs/bulk'),
  
  // Tier Management APIs
  CREATE_TIER: getApiUrl('/api/tiers'),
  GET_ALL_TIERS: getApiUrl('/api/tiers'),
  UPDATE_TIER: getApiUrl('/api/tiers'),
  DELETE_TIER: getApiUrl('/api/tiers'),
  
  // Level Management APIs
  CREATE_LEVEL: getApiUrl('/api/levels'),
  GET_ALL_LEVELS: getApiUrl('/api/levels'),
  UPDATE_LEVEL: getApiUrl('/api/levels'),
  DELETE_LEVEL: getApiUrl('/api/levels'),
  
  // Reward Management APIs
  CREATE_REWARD: getApiUrl('/api/rewards'),
  GET_ALL_REWARDS: getApiUrl('/api/rewards'),
  UPDATE_REWARD: getApiUrl('/api/rewards'),
  DELETE_REWARD: getApiUrl('/api/rewards'),
  
  // Product Image Upload API
  UPLOAD_PRODUCT_IMAGE: getApiUrl('/api/products/upload-image'),
  
  // User Rewards APIs
  GET_USER_REWARDS: getApiUrl('/api/userrewards/user'),
  GET_AVAILABLE_REWARDS: getApiUrl('/api/userrewards/available'),
  CLAIM_REWARD: getApiUrl('/api/userrewards/claim'),
  GET_ALL_USER_REWARDS: getApiUrl('/api/userrewards/all'),
  GET_REWARD_STATS: getApiUrl('/api/userrewards/stats'),
  APPROVE_REWARD: getApiUrl('/api/userrewards/approve'),
  REJECT_REWARD: getApiUrl('/api/userrewards/reject'),
  
  // Admin Dashboard Statistics
  DASHBOARD_STATISTICS: getApiUrl('/api/admin/dashboard-statistics'),
};

export default API_BASE_URL;
"@

# Write the new API config
$apiConfig | Out-File -FilePath "src/config/api.js" -Encoding UTF8

Write-Host "✓ API configuration updated for direct calls" -ForegroundColor Green

# Update package.json to use static file serving
Write-Host "`n=== Updating Production Server ===" -ForegroundColor Yellow

# Update package.json start script
$packageJson = Get-Content "package.json" | ConvertFrom-Json
$packageJson.scripts.start = "npx serve dist --single --listen $PORT"
$packageJson | ConvertTo-Json -Depth 10 | Out-File -FilePath "package.json" -Encoding UTF8

Write-Host "✓ Package.json updated for static serving" -ForegroundColor Green

# Update Railway configuration
Write-Host "`n=== Updating Railway Configuration ===" -ForegroundColor Yellow

# Update railway.json
$railwayConfig = @"
{
  "`$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "NIXPACKS"
  },
  "deploy": {
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  },
  "env": {
    "NODE_ENV": "production",
    "PORT": "3000"
  }
}
"@

$railwayConfig | Out-File -FilePath "railway.json" -Encoding UTF8

Write-Host "✓ Railway configuration updated" -ForegroundColor Green

# Build the frontend
Write-Host "`n=== Building Frontend ===" -ForegroundColor Yellow
npm run build

if ($LASTEXITCODE -ne 0) {
    Write-Host "✗ Build failed!" -ForegroundColor Red
    exit 1
}

Write-Host "✓ Frontend built successfully!" -ForegroundColor Green

Write-Host "`n=== Direct API Configuration Complete ===" -ForegroundColor Green
Write-Host "The frontend will now make direct API calls to:" -ForegroundColor White
Write-Host "  https://asmlmbackend-production.up.railway.app" -ForegroundColor Cyan
Write-Host "`nBenefits:" -ForegroundColor Yellow
Write-Host "  ✓ Better performance (no proxy overhead)" -ForegroundColor Green
Write-Host "  ✓ Better scalability" -ForegroundColor Green
Write-Host "  ✓ Industry standard approach" -ForegroundColor Green
Write-Host "  ✓ Reduced server load" -ForegroundColor Green
Write-Host "`nNote: Ensure your backend has proper CORS configuration!" -ForegroundColor Yellow
