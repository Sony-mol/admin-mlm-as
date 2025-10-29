import React, { useState, useEffect } from 'react';
import { Users, TrendingUp, DollarSign, Target, Award, Clock, CheckCircle, AlertTriangle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { API_ENDPOINTS } from '../../config/api';
import AnalyticsService from '../../services/AnalyticsService';

const PerformanceMetrics = () => {
  const { authFetch } = useAuth();
  const [metrics, setMetrics] = useState(null);
  const [topPerformers, setTopPerformers] = useState([]);
  const [recentActivities, setRecentActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchPerformanceMetrics();
  }, []);

  // ⚡ PROGRESSIVE LOADING - Parallel API calls
  const fetchPerformanceMetrics = async () => {
    const token = localStorage.getItem("auth")
      ? JSON.parse(localStorage.getItem("auth")).accessToken
      : "";
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    
    console.log('🔍 Performance Metrics - Starting parallel API calls...');
    
    try {
      setLoading(true);
      setError(null);
      
      // ⚡ Make all API calls in parallel
      const [dashboardRes, usersRes, topPerformersRes, activitiesRes] = await Promise.allSettled([
        fetch(API_ENDPOINTS.COMMISSION_DASHBOARD, { cache: "no-store", headers }),
        fetch(API_ENDPOINTS.USERS, { cache: "no-store", headers }),
        fetch(API_ENDPOINTS.TOP_PERFORMERS, { cache: "no-store", headers }),
        fetch(`${API_ENDPOINTS.RECENT_ACTIVITIES}?size=5`, { cache: "no-store", headers }),
      ]);
      
      // Process dashboard data
      let dashboardData = {};
      if (dashboardRes.status === 'fulfilled' && dashboardRes.value.ok) {
        dashboardData = await dashboardRes.value.json() || {};
        console.log('✅ Dashboard data fetched');
      }
      
      // Process users data
      let usersData = [];
      let totalUsers = 0;
      let activeUsers = 0;
      if (usersRes.status === 'fulfilled' && usersRes.value.ok) {
        usersData = await usersRes.value.json() || [];
        totalUsers = usersData.length;
        activeUsers = usersData.filter(user => user.status === 'ACTIVE' || user.status === 'active').length;
        console.log('✅ Users data fetched:', { totalUsers, activeUsers });
      }
      
      // Process top performers
      let topPerformers = [];
      if (topPerformersRes.status === 'fulfilled' && topPerformersRes.value.ok) {
        const topPerformersJson = await topPerformersRes.value.json();
        topPerformers = Array.isArray(topPerformersJson) ? topPerformersJson
          .map(performer => ({
            name: performer.name || 'Unknown User',
            referrals: performer.referrals || 0,
            earnings: parseFloat(performer.amount) || 0,
            tier: performer.level || 'BRONZE'
          }))
          .slice(0, 5) : [];
        console.log('✅ Top Performers data fetched');
      } else {
        // Fallback to users data
        topPerformers = usersData
          .filter(user => (user.referrals || user.referralCount || 0) > 0)
          .sort((a, b) => (b.referrals || b.referralCount || 0) - (a.referrals || a.referralCount || 0))
          .slice(0, 5)
          .map(user => ({
            name: user.fullName || user.name || user.username || 'Unknown User',
            referrals: user.referrals || user.referralCount || 0,
            earnings: user.totalEarnings || user.earnings || user.walletBalance || 0,
            tier: user.tier || user.userTier || user.level || 'BRONZE'
          }));
      }
      
      // Process activities
      let recentActivities = [];
      if (activitiesRes.status === 'fulfilled' && activitiesRes.value.ok) {
        const activitiesJson = await activitiesRes.value.json();
        const rawActivities = Array.isArray(activitiesJson.logs) ? activitiesJson.logs : [];
        recentActivities = rawActivities.slice(0, 5).map(activity => ({
          type: activity.actionType || 'activity',
          message: activity.description || 'Activity recorded',
          time: formatActivityTime(activity.createdAt),
          timestamp: activity.createdAt,
          severity: activity.severity || 'INFO',
          category: activity.category || 'SYSTEM',
          entityType: activity.entityType || '',
          userId: activity.userId,
          adminId: activity.adminId
        }));
        console.log('✅ Activities data fetched');
      }
      
      // Calculate metrics
      const pendingCount = Number(dashboardData.pendingCommissions ?? dashboardData.pendingCount ?? 0);
      const paidCount = Number(dashboardData.paidCommissions ?? dashboardData.paidCount ?? 0);
      const totalPendingAmount = parseFloat((dashboardData.totalPendingAmount ?? 0).toString()) || 0;
      const totalPaidAmount = parseFloat((dashboardData.totalPaidAmount ?? 0).toString()) || 0;
      const totalCommissionAmount = totalPendingAmount + totalPaidAmount;
      
      const metrics = {
        totalUsers,
        activeUsers,
        newUsersToday: dashboardData.newUsersToday || 0,
        conversionRate: totalUsers > 0 ? ((activeUsers / totalUsers) * 100).toFixed(1) : 0,
        avgCommissionPerUser: totalUsers > 0 ? (totalCommissionAmount / totalUsers) : 0,
        totalCommissions: totalCommissionAmount,
        pendingCommissions: totalPendingAmount,
        paidCommissions: totalPaidAmount
      };
      
      console.log('📊 Performance Metrics loaded successfully');
      setMetrics(metrics);
      setTopPerformers(topPerformers);
      setRecentActivities(recentActivities);
      
    } catch (err) {
      console.error('💥 Performance Metrics Error:', err);
      setError('Failed to load performance metrics');
      const mockData = generateMockPerformanceMetrics();
      setMetrics(mockData);
      setTopPerformers(mockData.topPerformers);
      setRecentActivities(mockData.recentActivities);
    } finally {
      setLoading(false);
    }
  };

  const generateMockPerformanceMetrics = () => {
    return {
      totalUsers: 1247,
      activeUsers: 892,
      newUsersToday: 23,
      conversionRate: 68.5,
      avgCommissionPerUser: 15420,
      totalCommissions: 19234000,
      pendingCommissions: 2340000,
      paidCommissions: 16894000,
      topPerformers: [
        { name: 'Charan Kumar', referrals: 45, earnings: 125000, tier: 'GOLD' },
        { name: 'Gouhar Khan', referrals: 38, earnings: 98000, tier: 'GOLD' },
        { name: 'Sony Kumar', referrals: 32, earnings: 87000, tier: 'SILVER' },
        { name: 'Rajesh Singh', referrals: 28, earnings: 76000, tier: 'SILVER' },
        { name: 'Priya Sharma', referrals: 25, earnings: 68000, tier: 'BRONZE' }
      ].slice(0, 5), // Ensure only top 5 in mock data too
      recentActivities: [
        { type: 'USER_CREATED', message: 'New user registered: John Doe', time: '2 minutes ago', severity: 'INFO' },
        { type: 'COMMISSION_APPROVED', message: 'Commission approved for Charan Kumar: ₹12,500', time: '5 minutes ago', severity: 'INFO' },
        { type: 'USER_UPDATED', message: 'Gouhar Khan upgraded to GOLD tier', time: '12 minutes ago', severity: 'INFO' },
        { type: 'COMMISSION_CREATED', message: 'New commission created for Sony Kumar: ₹1,000', time: '18 minutes ago', severity: 'INFO' },
        { type: 'ORDER_CREATED', message: 'New order created by Rajesh Singh', time: '25 minutes ago', severity: 'INFO' }
      ]
    };
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(value);
  };

  const getTierColor = (tier) => {
    switch (tier?.toUpperCase()) {
      case 'GOLD': return 'text-yellow-600 bg-yellow-100';
      case 'SILVER': return 'text-gray-600 bg-gray-100';
      case 'BRONZE': return 'text-orange-600 bg-orange-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const formatActivityTime = (timestamp) => {
    if (!timestamp) return 'Just now';
    
    try {
      // Convert to Indian Standard Time (IST)
      const activityTime = new Date(timestamp);
      const now = new Date();
      
      // Convert both times to IST (UTC+5:30)
      const activityTimeIST = new Date(activityTime.toLocaleString("en-US", {timeZone: "Asia/Kolkata"}));
      const nowIST = new Date(now.toLocaleString("en-US", {timeZone: "Asia/Kolkata"}));
      
      const diffMs = nowIST - activityTimeIST;
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMs / 3600000);
      const diffDays = Math.floor(diffMs / 86400000);
      
      if (diffMins < 1) return 'Just now';
      if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
      if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
      if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
      
      // For older activities, show IST date and time
      return activityTime.toLocaleString("en-IN", {
        timeZone: "Asia/Kolkata",
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });
    } catch (error) {
      console.error('Error formatting activity time:', error);
      return 'Just now';
    }
  };

  const getActivityIcon = (type, severity = 'INFO') => {
    // Map real backend activity types to icons
    switch (type) {
      case 'LOGIN':
      case 'LOGOUT':
        return <Users className="h-4 w-4 text-blue-600" />;
      case 'USER_CREATED':
      case 'USER_UPDATED':
      case 'USER_SUSPENDED':
      case 'USER_ACTIVATED':
        return <Users className="h-4 w-4 text-purple-600" />;
      case 'COMMISSION_APPROVED':
      case 'COMMISSION_PAID':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'COMMISSION_REJECTED':
      case 'COMMISSION_CREATED':
        return <DollarSign className="h-4 w-4 text-orange-600" />;
      case 'ORDER_CREATED':
        return <Target className="h-4 w-4 text-blue-600" />;
      case 'PAYMENT_PROCESSED':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'SETTINGS_UPDATED':
        return <Award className="h-4 w-4 text-purple-600" />;
      case 'SYSTEM_ERROR':
        return <AlertTriangle className="h-4 w-4 text-red-600" />;
      case 'BULK_OPERATION':
        return <TrendingUp className="h-4 w-4 text-indigo-600" />;
      default:
        // Use severity to determine icon color
        const iconColor = severity === 'ERROR' || severity === 'CRITICAL' ? 'text-red-600' :
                         severity === 'WARNING' ? 'text-orange-600' :
                         'text-gray-600';
        return <AlertTriangle className={`h-4 w-4 ${iconColor}`} />;
    }
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="modern-card p-6">
            <div className="animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
              <div className="h-8 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-1/3"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="modern-card p-6 mb-8">
        <div className="text-center text-red-500">
          <AlertTriangle className="h-8 w-8 mx-auto mb-2" />
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 mb-8">
      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="stat-card animate-fade-in">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-[rgba(var(--fg),0.6)] mb-1">Total Users</p>
              <p className="text-3xl font-bold text-gradient">{(metrics.totalUsers || 0).toLocaleString()}</p>
              <p className="text-sm text-green-600 mt-1">+{metrics.newUsersToday || 0} today</p>
            </div>
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-xl flex items-center justify-center shadow-modern">
              <Users className="h-6 w-6 text-white" />
            </div>
          </div>
        </div>

        <div className="stat-card animate-fade-in">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-[rgba(var(--fg),0.6)] mb-1">Active Users</p>
              <p className="text-3xl font-bold text-gradient">{(metrics.activeUsers || 0).toLocaleString()}</p>
              <p className="text-sm text-green-600 mt-1">{metrics.conversionRate || 0}% active rate</p>
            </div>
            <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-modern">
              <TrendingUp className="h-6 w-6 text-white" />
            </div>
          </div>
        </div>

        <div className="stat-card animate-fade-in">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-[rgba(var(--fg),0.6)] mb-1">Total Commissions</p>
              <p className="text-3xl font-bold text-gradient">{formatCurrency(metrics.totalCommissions || 0)}</p>
              <p className="text-sm text-blue-600 mt-1">{formatCurrency(metrics.avgCommissionPerUser || 0)} avg/user</p>
            </div>
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-violet-600 rounded-xl flex items-center justify-center shadow-modern">
              <DollarSign className="h-6 w-6 text-white" />
            </div>
          </div>
        </div>

        <div className="stat-card animate-fade-in">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-[rgba(var(--fg),0.6)] mb-1">Pending Commissions</p>
              <p className="text-3xl font-bold text-gradient">{formatCurrency(metrics.pendingCommissions || 0)}</p>
              <p className="text-sm text-orange-600 mt-1">Awaiting approval</p>
            </div>
            <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-amber-600 rounded-xl flex items-center justify-center shadow-modern">
              <Clock className="h-6 w-6 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Top Performers and Recent Activities */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Performers */}
        <div className="modern-card p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-[rgb(var(--fg))]">Top 5 Performers</h3>
            <span className="text-sm text-[rgba(var(--fg),0.6)]">
              {topPerformers.length} {topPerformers.length === 1 ? 'performer' : 'performers'}
            </span>
          </div>
          <div className="space-y-3">
            {topPerformers.length > 0 ? (
              topPerformers.map((performer, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-[rgba(var(--fg),0.02)] rounded-lg hover:bg-[rgba(var(--fg),0.04)] transition-colors">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                      index === 0 ? 'bg-yellow-100 text-yellow-600' : 
                      index === 1 ? 'bg-gray-100 text-gray-600' : 
                      index === 2 ? 'bg-orange-100 text-orange-600' : 
                      'bg-blue-100 text-blue-600'
                    }`}>
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-medium text-[rgb(var(--fg))]">{performer.name || 'Unknown User'}</p>
                      <p className="text-sm text-[rgba(var(--fg),0.6)]">
                        {performer.referrals || 0} {performer.referrals === 1 ? 'referral' : 'referrals'}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-[rgb(var(--fg))]">{formatCurrency(performer.earnings || 0)}</p>
                    <span className={`text-xs px-2 py-1 rounded-full ${getTierColor(performer.tier)}`}>
                      {performer.tier || 'BRONZE'}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Award className="h-8 w-8 text-gray-400" />
                </div>
                <p className="text-sm text-[rgba(var(--fg),0.6)] mb-1">No top performers yet</p>
                <p className="text-xs text-[rgba(var(--fg),0.5)]">
                  Users with referrals will appear here
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Recent Activities */}
        <div className="modern-card p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-[rgb(var(--fg))]">Recent Activities</h3>
            <span className="text-sm text-[rgba(var(--fg),0.6)]">
              {recentActivities.length} {recentActivities.length === 1 ? 'activity' : 'activities'}
            </span>
          </div>
          <div className="space-y-3">
            {recentActivities.length > 0 ? (
              recentActivities.map((activity, index) => (
                <div key={index} className="flex items-start gap-3 p-3 bg-[rgba(var(--fg),0.02)] rounded-lg hover:bg-[rgba(var(--fg),0.04)] transition-colors">
                  <div className="mt-0.5">
                    {getActivityIcon(activity.type, activity.severity)}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-[rgb(var(--fg))]">{activity.message || 'Activity recorded'}</p>
                    <p className="text-xs text-[rgba(var(--fg),0.6)] mt-1">
                      {activity.time || 'Just now'}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <AlertTriangle className="h-8 w-8 text-gray-400" />
                </div>
                <p className="text-sm text-[rgba(var(--fg),0.6)] mb-1">No recent activities</p>
                <p className="text-xs text-[rgba(var(--fg),0.5)]">
                  System activities will appear here
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PerformanceMetrics;
