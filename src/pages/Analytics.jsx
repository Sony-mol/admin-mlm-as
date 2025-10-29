import React, { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, Calendar, Download, RefreshCw, Filter } from 'lucide-react';
import PerformanceMetrics from '../components/analytics/PerformanceMetrics';
import UserGrowthChart from '../components/analytics/UserGrowthChart';
import CommissionAnalyticsChart from '../components/analytics/CommissionAnalyticsChart';
import RevenueChart from '../components/analytics/RevenueChart';
import { SkeletonDashboard } from '../components/SkeletonLoader';

const Analytics = () => {
  const [refreshing, setRefreshing] = useState(false);
  const [dateRange, setDateRange] = useState('30d');
  const [selectedCharts, setSelectedCharts] = useState({
    performance: true,
    userGrowth: true,
    commission: true,
    revenue: false  // Hide Revenue Analytics section
  });

  // ⚡ No blocking loader - child components handle their own loading
  const handleRefresh = async () => {
    setRefreshing(true);
    window.location.reload(); // Full refresh to reload all data
  };

  const handleExportAll = () => {
    // Export all analytics data
    const data = {
      dateRange,
      selectedCharts,
      timestamp: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `analytics-export-${dateRange}-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const dateRangeOptions = [
    { value: '7d', label: 'Last 7 Days' },
    { value: '30d', label: 'Last 30 Days' },
    { value: '90d', label: 'Last 90 Days' },
    { value: '1y', label: 'Last Year' }
  ];

  // ⚡ No global loading - show structure immediately
  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 animate-fade-in">
        <div>
          <h1 className="text-3xl font-bold text-gradient">Analytics Dashboard</h1>
          <p className="text-sm text-[rgba(var(--fg),0.6)] mt-1">
            Comprehensive insights into your MLM business performance
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="modern-input text-sm"
          >
            {dateRangeOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-2 px-4 py-2 text-sm bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:shadow-modern transition-all disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </button>
          
          <button
            onClick={handleExportAll}
            className="flex items-center gap-2 px-4 py-2 text-sm bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg hover:shadow-modern transition-all"
          >
            <Download className="h-4 w-4" />
            Export All
          </button>
        </div>
      </div>

      {/* Performance Metrics - Always visible */}
      <PerformanceMetrics />

      {/* Chart Toggle Controls */}
      <div className="modern-card p-4 animate-fade-in">
        <h3 className="text-lg font-semibold text-gradient mb-4">Chart Visibility Controls</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Object.entries(selectedCharts).map(([key, value]) => (
            <label key={key} className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={value}
                onChange={(e) => setSelectedCharts(prev => ({
                  ...prev,
                  [key]: e.target.checked
                }))}
                className="rounded border-[rgb(var(--border))] bg-[rgb(var(--card))] text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-[rgb(var(--fg))] capitalize">
                {key === 'userGrowth' ? 'User Growth' : key}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Charts Section */}
      <div className="space-y-6">
        {selectedCharts.userGrowth && <UserGrowthChart />}
        {selectedCharts.commission && <CommissionAnalyticsChart />}
        {selectedCharts.revenue && <RevenueChart />}
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="modern-card p-6 animate-fade-in">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-modern">
              <BarChart3 className="h-5 w-5 text-white" />
            </div>
            <h3 className="text-lg font-semibold text-gradient">Chart Insights</h3>
          </div>
          <p className="text-sm text-[rgba(var(--fg),0.6)]">
            All charts are interactive and support real-time data updates. 
            Use the export buttons on individual charts for detailed data.
          </p>
        </div>

        <div className="modern-card p-6 animate-fade-in">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-modern">
              <TrendingUp className="h-5 w-5 text-white" />
            </div>
            <h3 className="text-lg font-semibold text-gradient">Performance Tips</h3>
          </div>
          <p className="text-sm text-[rgba(var(--fg),0.6)]">
            Monitor user growth trends and commission patterns to optimize 
            your MLM strategy and maximize revenue potential.
          </p>
        </div>

        <div className="modern-card p-6 animate-fade-in">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center shadow-modern">
              <Calendar className="h-5 w-5 text-white" />
            </div>
            <h3 className="text-lg font-semibold text-gradient">Date Range</h3>
          </div>
          <p className="text-sm text-[rgba(var(--fg),0.6)]">
            Current view: {dateRangeOptions.find(opt => opt.value === dateRange)?.label}. 
            Change the date range to analyze different time periods.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Analytics;