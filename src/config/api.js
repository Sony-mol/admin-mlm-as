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
  GET_PENDING_CLAIMS: getApiUrl('/api/userrewards/pending'),
  GET_CLAIMS_BY_STATUS: getApiUrl('/api/userrewards/status'),
  APPROVE_REWARD: getApiUrl('/api/userrewards'),
  REJECT_REWARD: getApiUrl('/api/userrewards'),
  
  // Admin Dashboard Statistics
  DASHBOARD_STATISTICS: getApiUrl('/api/admin/dashboard-statistics'),
};

export default API_BASE_URL;
