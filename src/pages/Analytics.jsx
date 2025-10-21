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
    revenue: true
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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[rgb(var(--fg))]">Analytics Dashboard</h1>
          <p className="text-sm text-[rgba(var(--fg),0.6)] mt-1">
            Comprehensive insights into your MLM business performance
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="text-sm border border-[rgb(var(--border))] bg-[rgb(var(--card))] text-[rgb(var(--fg))] rounded px-3 py-2"
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
            className="flex items-center gap-2 px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </button>
          
          <button
            onClick={handleExportAll}
            className="flex items-center gap-2 px-4 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <Download className="h-4 w-4" />
            Export All
          </button>
        </div>
      </div>

      {/* Performance Metrics - Always visible */}
      <PerformanceMetrics />

      {/* Chart Toggle Controls */}
      <div className="bg-[rgb(var(--card))] border border-[rgb(var(--border))] rounded-lg p-4">
        <h3 className="text-lg font-semibold text-[rgb(var(--fg))] mb-4">Chart Visibility Controls</h3>
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
        <div className="bg-[rgb(var(--card))] border border-[rgb(var(--border))] rounded-lg p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <BarChart3 className="h-5 w-5 text-blue-600" />
            </div>
            <h3 className="text-lg font-semibold text-[rgb(var(--fg))]">Chart Insights</h3>
          </div>
          <p className="text-sm text-[rgba(var(--fg),0.6)]">
            All charts are interactive and support real-time data updates. 
            Use the export buttons on individual charts for detailed data.
          </p>
        </div>

        <div className="bg-[rgb(var(--card))] border border-[rgb(var(--border))] rounded-lg p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="h-5 w-5 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold text-[rgb(var(--fg))]">Performance Tips</h3>
          </div>
          <p className="text-sm text-[rgba(var(--fg),0.6)]">
            Monitor user growth trends and commission patterns to optimize 
            your MLM strategy and maximize revenue potential.
          </p>
        </div>

        <div className="bg-[rgb(var(--card))] border border-[rgb(var(--border))] rounded-lg p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <Calendar className="h-5 w-5 text-purple-600" />
            </div>
            <h3 className="text-lg font-semibold text-[rgb(var(--fg))]">Date Range</h3>
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