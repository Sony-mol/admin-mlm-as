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
import LineChartMini from "../components/charts/LineChartMini";

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

const AnalyticsChart = ({ title, data, type = "line", loading = false }) => {
  // Normalize data into { month, value }
  const points = Array.isArray(data)
    ? data.map((d) => ({ month: d.month ?? d.label, value: d.value ?? d.amount ?? 0 }))
    : [];
  return (
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
      ) : points.length > 0 ? (
        <div className="h-64">
          <LineChartMini points={points.map((p) => ({ month: p.month, value: Number(p.value) || 0 }))} />
        </div>
      ) : (
        <div className="h-64 flex items-center justify-center rounded-lg bg-[rgba(var(--fg),0.05)]">
          <div className="text-center">
            <BarChart3 className="w-12 h-12 mx-auto mb-3 text-[rgba(var(--fg),0.3)]" />
            <div className="text-sm text-[rgba(var(--fg),0.6)]">No data available</div>
          </div>
        </div>
      )}
    </div>
  );
};

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
                    <span className="text-sm text-green-600">{performer.growthPct ? `+${performer.growthPct}%` : '—'}</span>
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
          analyticsRes,
          paymentsStatsRes,
          paymentsAllRes
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
          }),
          fetch(API_ENDPOINTS.PAYMENTS_STATISTICS, {
            headers: { 'Authorization': `Bearer ${token}` }
          }),
          fetch(API_ENDPOINTS.PAYMENTS, {
            headers: { 'Authorization': `Bearer ${token}` }
          })
        ]);

        const [dashboard, revenue, performers, users, analytics, paymentsStats, paymentsAll] = await Promise.all([
          dashboardRes.json(),
          revenueRes.json(),
          performersRes.json(),
          usersRes.json(),
          analyticsRes.json(),
          paymentsStatsRes.ok ? paymentsStatsRes.json() : Promise.resolve({}),
          paymentsAllRes.ok ? paymentsAllRes.json() : Promise.resolve([])
        ]);

        // Normalize dashboard totals and compute derived metrics
        const totalPendingAmount = parseFloat((dashboard.totalPendingAmount ?? 0).toString()) || 0;
        const totalPaidAmount = parseFloat((dashboard.totalPaidAmount ?? 0).toString()) || 0;
        const totalRevenueAmount = totalPendingAmount + totalPaidAmount;

        const pendingCount = Number(dashboard.pendingCommissions ?? dashboard.pendingCommissionsCount ?? 0);
        const paidCount = Number(dashboard.paidCommissions ?? dashboard.paidCommissionsCount ?? 0);
        const totalCommissionRecords = pendingCount + paidCount;

        // Real sales revenue from payments: totalPurchases (successful ORDER_PAYMENT)
        const grossRevenue = Number(paymentsStats.totalPurchases || 0);

        // Build monthly gross revenue series from all payments (ORDER_PAYMENT & SUCCESS)
        const paySeriesMap = new Map();
        (Array.isArray(paymentsAll) ? paymentsAll : []).forEach(p => {
          const isOrder = (p.type === 'ORDER_PAYMENT') || (p.transactionType === 'ORDER_PAYMENT');
          const isSuccess = (p.status === 'SUCCESS') || (p.transactionStatus === 'SUCCESS');
          if (!isOrder || !isSuccess) return;
          const ts = p.createdAt || p.timestamp || p.date || p.createdDate;
          if (!ts) return;
          const d = new Date(ts);
          const key = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
          const amt = Number(p.amount || 0);
          paySeriesMap.set(key, (paySeriesMap.get(key) || 0) + amt);
        });
        const paySeriesKeys = Array.from(paySeriesMap.keys()).sort();
        const salesRevenueSeries = paySeriesKeys.map(k => ({ month: k, amount: paySeriesMap.get(k) }));

        // Growth vs last month from payments series
        const sLen = salesRevenueSeries.length;
        const lastVal = sLen > 0 ? Number(salesRevenueSeries[sLen-1].amount) : 0;
        const prevVal = sLen > 1 ? Number(salesRevenueSeries[sLen-2].amount) : 0;
        const revenueGrowthPct = ((lastVal - prevVal) / Math.max(1, prevVal)) * 100;

        setAnalyticsData({
          dashboard,
          revenue: salesRevenueSeries.length ? salesRevenueSeries : revenue,
          performers,
          users,
          analytics,
          // Calculate additional metrics
          grossRevenue,
          totalUsers: (analytics && analytics.totalUsers) || users.length,
          activeUsers: (analytics && analytics.activeUsers) || users.filter(u => (u.status || u.accountStatus) === 'ACTIVE').length,
          conversionRate:
            (analytics && analytics.conversionRate) || ((paidCount / Math.max(1, totalCommissionRecords)) * 100),
          avgEarnings:
            performers.length > 0
              ? performers.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0) / performers.length
              : 0,
          totalRevenueAmount,
          revenueGrowthPct,
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
      title: "Revenue",
      value: `₹${(analyticsData.grossRevenue ?? analyticsData.totalRevenueAmount ?? 0).toFixed(0)}`,
      change: `${(analyticsData.revenueGrowthPct || 0).toFixed(1)}%`,
      trend: "up",
      icon: DollarSign,
      color: "green"
    },
    {
      title: "Active Users",
      value: analyticsData.activeUsers || 0,
      change: (function(){
        // Compute active user growth from last 2 months using lastActiveAt if available
        const users = analyticsData.users || [];
        const now = new Date();
        const startThis = new Date(now.getFullYear(), now.getMonth(), 1);
        const startLast = new Date(now.getFullYear(), now.getMonth()-1, 1);
        const startPrev = new Date(now.getFullYear(), now.getMonth()-2, 1);
        const countActive = (start, end) => users.filter(u => {
          const ts = u.lastActiveAt || u.lastLoginAt;
          if (!ts) return false;
          const d = new Date(ts);
          return d >= start && d < end;
        }).length;
        const last = countActive(startLast, startThis);
        const prev = countActive(startPrev, startLast);
        const pct = ((last - prev) / Math.max(1, prev)) * 100;
        return isFinite(pct) ? `${pct.toFixed(1)}%` : null;
      })(),
      trend: "up",
      icon: Users,
      color: "blue"
    },
    {
      title: "Conversion Rate",
      value: `${analyticsData.conversionRate?.toFixed(1) || 0}%`,
      change: (function(){
        // If analytics provides lastMonthConversionRate, compare
        const a = analyticsData.analytics || {};
        const last = Number(a.thisMonthConversionRate ?? a.conversionRate ?? 0);
        const prev = Number(a.lastMonthConversionRate ?? 0);
        const pct = ((last - prev) / Math.max(1, prev)) * 100;
        return prev ? `${pct.toFixed(1)}%` : null;
      })(),
      trend: "up",
      icon: Target,
      color: "purple"
    },
    {
      title: "Avg Earnings",
      value: `₹${analyticsData.avgEarnings?.toFixed(0) || 0}`,
      change: (function(){
        const perf = analyticsData.performers || [];
        // Split by month from a possible timestamp on performer record
        const now = new Date();
        const startThis = new Date(now.getFullYear(), now.getMonth(), 1);
        const startLast = new Date(now.getFullYear(), now.getMonth()-1, 1);
        const startPrev = new Date(now.getFullYear(), now.getMonth()-2, 1);
        const avgInRange = (start, end) => {
          const items = perf.filter(p => {
            const ts = p.updatedAt || p.createdAt || p.timestamp;
            if (!ts) return false;
            const d = new Date(ts);
            return d >= start && d < end;
          });
          if (items.length === 0) return 0;
          const total = items.reduce((s,p)=> s + (parseFloat(p.amount)||0), 0);
          return total / items.length;
        };
        const last = avgInRange(startLast, startThis);
        const prev = avgInRange(startPrev, startLast);
        const pct = ((last - prev) / Math.max(1, prev)) * 100;
        return prev ? `${pct.toFixed(1)}%` : null;
      })(),
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
            data={(function() {
              const users = analyticsData?.users || [];
              // Build monthly count series based on createdAt
              const buckets = new Map();
              users.forEach(u => {
                const ts = u.createdAt || u.created_at || u.registeredAt || u.createdDate;
                if (!ts) return;
                const d = new Date(ts);
                const key = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
                buckets.set(key, (buckets.get(key) || 0) + 1);
              });
              const sortedKeys = Array.from(buckets.keys()).sort();
              return sortedKeys.map(k => ({ month: k, value: buckets.get(k) }));
            })()}
            type="line"
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
