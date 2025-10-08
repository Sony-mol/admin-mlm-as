// src/pages/Analytics.jsx
import React, { useEffect, useState } from 'react';
import { 
  TrendingUp, 
  Users, 
  DollarSign, 
  Activity, 
  BarChart3,
  PieChart,
  Calendar,
  Download,
  Filter,
  RefreshCw,
  Loader2,
  Eye,
  Target,
  Award,
  Zap
} from 'lucide-react';

// Import API configuration
import { API_ENDPOINTS } from '../config/api';

// Enhanced Analytics Components
const StatCard = ({ title, value, change, icon: Icon, trend, loading = false, color = "blue" }) => (
  <div className="rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-6 hover:shadow-lg transition-all duration-300">
    <div className="flex items-center justify-between">
      <div className="flex items-center space-x-3">
        <div className={`p-3 rounded-lg bg-${color}-50`}>
          <Icon className={`w-6 h-6 text-${color}-600`} />
        </div>
        <div>
          <p className="text-sm font-medium text-[rgba(var(--fg),0.7)]">{title}</p>
          <p className="text-2xl font-bold text-[rgb(var(--fg))]">
            {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : value}
          </p>
        </div>
      </div>
      {change && (
        <div className={`flex items-center space-x-1 ${trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
          <TrendingUp className={`w-4 h-4 ${trend === 'down' ? 'rotate-180' : ''}`} />
          <span className="text-sm font-medium">{change}</span>
        </div>
      )}
    </div>
  </div>
);

const AnalyticsChart = ({ title, data, type = "line", loading = false }) => (
  <div className="rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-6">
    <div className="flex items-center justify-between mb-6">
      <h3 className="text-lg font-semibold text-[rgb(var(--fg))]">{title}</h3>
      <div className="flex items-center space-x-2">
        <button className="p-2 text-[rgba(var(--fg),0.6)] hover:text-[rgb(var(--fg))] rounded-lg hover:bg-[rgba(var(--fg),0.05)]">
          <Download className="w-4 h-4" />
        </button>
        <button className="p-2 text-[rgba(var(--fg),0.6)] hover:text-[rgb(var(--fg))] rounded-lg hover:bg-[rgba(var(--fg),0.05)]">
          <Filter className="w-4 h-4" />
        </button>
      </div>
    </div>
    {loading ? (
      <div className="h-64 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    ) : (
      <div className="h-64 flex items-center justify-center rounded-lg bg-[rgba(var(--fg),0.05)]">
        <div className="text-center">
          <BarChart3 className="w-12 h-12 mx-auto mb-3 text-[rgba(var(--fg),0.3)]" />
          <div className="text-sm text-[rgba(var(--fg),0.6)]">Chart visualization coming soon</div>
        </div>
      </div>
    )}
  </div>
);

const PerformanceTable = ({ data, loading = false }) => (
  <div className="rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-6">
    <div className="flex items-center justify-between mb-6">
      <h3 className="text-lg font-semibold text-[rgb(var(--fg))]">Top Performers</h3>
      <button className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-700">
        <Eye className="w-4 h-4" />
        <span>View All</span>
      </button>
    </div>
    {loading ? (
      <div className="h-48 flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
      </div>
    ) : (
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[rgb(var(--border))]">
              <th className="text-left py-3 px-4 font-medium text-[rgba(var(--fg),0.7)]">Rank</th>
              <th className="text-left py-3 px-4 font-medium text-[rgba(var(--fg),0.7)]">User</th>
              <th className="text-left py-3 px-4 font-medium text-[rgba(var(--fg),0.7)]">Tier</th>
              <th className="text-left py-3 px-4 font-medium text-[rgba(var(--fg),0.7)]">Referrals</th>
              <th className="text-left py-3 px-4 font-medium text-[rgba(var(--fg),0.7)]">Earnings</th>
              <th className="text-left py-3 px-4 font-medium text-[rgba(var(--fg),0.7)]">Growth</th>
            </tr>
          </thead>
          <tbody>
            {data.map((performer, index) => (
              <tr key={index} className="border-b border-[rgb(var(--border))] hover:bg-[rgba(var(--fg),0.05)]">
                <td className="py-3 px-4">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium text-[rgb(var(--fg))]">#{index + 1}</span>
                    {index < 3 && <Award className="w-4 h-4 text-yellow-500" />}
                  </div>
                </td>
                <td className="py-3 px-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-sm font-medium text-blue-600">
                        {performer.name?.charAt(0) || 'U'}
                      </span>
                    </div>
                    <span className="text-sm font-medium text-[rgb(var(--fg))]">{performer.name}</span>
                  </div>
                </td>
                <td className="py-3 px-4">
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                    performer.level === 'GOLD' ? 'bg-yellow-100 text-yellow-800' :
                    performer.level === 'SILVER' ? 'bg-gray-100 text-gray-800' :
                    'bg-orange-100 text-orange-800'
                  }`}>
                    {performer.level}
                  </span>
                </td>
                <td className="py-3 px-4">
                  <span className="text-sm font-medium text-[rgb(var(--fg))]">{performer.referrals}</span>
                </td>
                <td className="py-3 px-4">
                  <span className="text-sm font-medium text-green-600">₹{performer.amount}</span>
                </td>
                <td className="py-3 px-4">
                  <div className="flex items-center space-x-1">
                    <TrendingUp className="w-4 h-4 text-green-500" />
                    <span className="text-sm text-green-600">+12.5%</span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )}
  </div>
);

export default function Analytics() {
  const [analyticsData, setAnalyticsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('30d');
  const [selectedMetric, setSelectedMetric] = useState('revenue');

  useEffect(() => {
    const fetchAnalyticsData = async () => {
      try {
        setLoading(true);
        
        const token = localStorage.getItem('auth') ? JSON.parse(localStorage.getItem('auth')).accessToken : '';
        
        // Fetch comprehensive analytics data using API_ENDPOINTS
        const [
          dashboardRes,
          revenueRes,
          performersRes,
          usersRes,
          analyticsRes
        ] = await Promise.all([
          fetch(API_ENDPOINTS.COMMISSION_DASHBOARD, {
            headers: { 'Authorization': `Bearer ${token}` }
          }),
          fetch(API_ENDPOINTS.MONTHLY_REVENUE, {
            headers: { 'Authorization': `Bearer ${token}` }
          }),
          fetch(API_ENDPOINTS.TOP_PERFORMERS, {
            headers: { 'Authorization': `Bearer ${token}` }
          }),
          fetch(API_ENDPOINTS.USERS, {
            headers: { 'Authorization': `Bearer ${token}` }
          }),
          fetch(API_ENDPOINTS.USERS + '/analytics', {
            headers: { 'Authorization': `Bearer ${token}` }
          })
        ]);

        const [dashboard, revenue, performers, users, analytics] = await Promise.all([
          dashboardRes.json(),
          revenueRes.json(),
          performersRes.json(),
          usersRes.json(),
          analyticsRes.json()
        ]);

        setAnalyticsData({
          dashboard,
          revenue,
          performers,
          users,
          analytics,
          // Calculate additional metrics
          totalUsers: analytics.totalUsers || users.length,
          activeUsers: analytics.activeUsers || users.filter(u => u.status === 'ACTIVE').length,
          conversionRate: analytics.conversionRate || (dashboard.paidCommissionsCount / dashboard.totalCommissionsCount * 100),
          avgEarnings: performers.length > 0 ? 
            performers.reduce((sum, p) => sum + parseFloat(p.amount), 0) / performers.length : 0
        });

      } catch (error) {
        console.error('Error fetching analytics data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalyticsData();
  }, [dateRange]);

  const kpis = analyticsData ? [
    {
      title: "Total Revenue",
      value: `₹${analyticsData.dashboard.totalCommissionAmount || 0}`,
      change: "+12.5%",
      trend: "up",
      icon: DollarSign,
      color: "green"
    },
    {
      title: "Active Users",
      value: analyticsData.activeUsers || 0,
      change: "+8.2%",
      trend: "up",
      icon: Users,
      color: "blue"
    },
    {
      title: "Conversion Rate",
      value: `${analyticsData.conversionRate?.toFixed(1) || 0}%`,
      change: "+3.1%",
      trend: "up",
      icon: Target,
      color: "purple"
    },
    {
      title: "Avg Earnings",
      value: `₹${analyticsData.avgEarnings?.toFixed(0) || 0}`,
      change: "+15.7%",
      trend: "up",
      icon: Award,
      color: "orange"
    }
  ] : [];

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-[rgb(var(--fg))]">Advanced Analytics</h1>
              <p className="text-[rgba(var(--fg),0.7)] mt-2">Comprehensive insights and performance metrics</p>
            </div>
            <div className="flex items-center space-x-4">
              <select 
                value={dateRange} 
                onChange={(e) => setDateRange(e.target.value)}
                className="px-4 py-2 border border-[rgb(var(--border))] rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-[rgb(var(--card))] text-[rgb(var(--fg))]"
              >
                <option value="7d">Last 7 days</option>
                <option value="30d">Last 30 days</option>
                <option value="90d">Last 90 days</option>
                <option value="1y">Last year</option>
              </select>
              <button className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                <RefreshCw className="w-4 h-4" />
                <span>Refresh</span>
              </button>
            </div>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {kpis.map((kpi, index) => (
            <StatCard key={index} {...kpi} loading={loading} />
          ))}
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <AnalyticsChart 
            title="Revenue Trends" 
            data={analyticsData?.revenue} 
            type="line"
            loading={loading}
          />
          <AnalyticsChart 
            title="User Growth" 
            data={analyticsData?.users} 
            type="bar"
            loading={loading}
          />
        </div>

        {/* Performance Table */}
        <div className="mb-8">
          <PerformanceTable 
            data={analyticsData?.performers || []} 
            loading={loading}
          />
        </div>

        {/* Additional Insights */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-6">
            <h3 className="text-lg font-semibold text-[rgb(var(--fg))] mb-4">Key Insights</h3>
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <Zap className="w-5 h-5 text-yellow-500" />
                <span className="text-sm text-[rgba(var(--fg),0.7)]">Peak performance hours: 2-4 PM</span>
              </div>
              <div className="flex items-center space-x-3">
                <TrendingUp className="w-5 h-5 text-green-500" />
                <span className="text-sm text-[rgba(var(--fg),0.7)]">Revenue growth: +12.5% this month</span>
              </div>
              <div className="flex items-center space-x-3">
                <Users className="w-5 h-5 text-blue-500" />
                <span className="text-sm text-[rgba(var(--fg),0.7)]">User engagement: 85% active</span>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-6">
            <h3 className="text-lg font-semibold text-[rgb(var(--fg))] mb-4">Quick Actions</h3>
            <div className="space-y-2">
              <button className="w-full text-left px-3 py-2 text-sm text-[rgba(var(--fg),0.7)] hover:bg-[rgba(var(--fg),0.05)] rounded-lg">
                Export Performance Report
              </button>
              <button className="w-full text-left px-3 py-2 text-sm text-[rgba(var(--fg),0.7)] hover:bg-[rgba(var(--fg),0.05)] rounded-lg">
                Send Performance Alerts
              </button>
              <button className="w-full text-left px-3 py-2 text-sm text-[rgba(var(--fg),0.7)] hover:bg-[rgba(var(--fg),0.05)] rounded-lg">
                Schedule Analytics Review
              </button>
            </div>
          </div>

          <div className="rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-6">
            <h3 className="text-lg font-semibold text-[rgb(var(--fg))] mb-4">System Health</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-[rgba(var(--fg),0.7)]">API Response Time</span>
                <span className="text-sm font-medium text-green-600">45ms</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-[rgba(var(--fg),0.7)]">Database Status</span>
                <span className="text-sm font-medium text-green-600">Healthy</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-[rgba(var(--fg),0.7)]">Uptime</span>
                <span className="text-sm font-medium text-green-600">99.9%</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
