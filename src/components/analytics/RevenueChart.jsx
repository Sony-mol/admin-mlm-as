import React, { useState, useEffect } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Legend } from 'recharts';
import { TrendingUp, DollarSign, Download, AreaChart as AreaChartIcon, LineChart as LineChartIcon } from 'lucide-react';
import ChartContainer from './ChartContainer';
import { useAuth } from '../../context/AuthContext';
import AnalyticsService from '../../services/AnalyticsService';

const RevenueChart = () => {
  const { authFetch } = useAuth();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [chartType, setChartType] = useState('area');
  const [timeRange, setTimeRange] = useState('30d');

  useEffect(() => {
    fetchRevenueData();
  }, [timeRange]);

  const fetchRevenueData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Use AnalyticsService to fetch data
      const analyticsService = new AnalyticsService(authFetch);
      const result = await analyticsService.getRevenueData(timeRange);
      setData(result.data || result || []);
    } catch (err) {
      console.error('Error fetching revenue data:', err);
      // Fallback to mock data on error
      const mockData = generateMockRevenueData(timeRange);
      setData(mockData);
    } finally {
      setLoading(false);
    }
  };

  const generateMockRevenueData = (range) => {
    const days = range === '7d' ? 7 : range === '30d' ? 30 : 90;
    const data = [];
    
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      
      data.push({
        date: date.toISOString().split('T')[0],
        revenue: Math.floor(Math.random() * 200000) + 50000,
        expenses: Math.floor(Math.random() * 80000) + 20000,
        profit: Math.floor(Math.random() * 120000) + 30000,
        cumulative: (i === days - 1 ? 0 : data[data.length - 1]?.cumulative || 0) + Math.floor(Math.random() * 120000) + 30000
      });
    }
    
    return data;
  };

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(value);
  };

  const exportData = () => {
    const csvContent = [
      ['Date', 'Revenue', 'Expenses', 'Profit', 'Cumulative Profit'],
      ...data.map(item => [
        item.date, 
        item.revenue, 
        item.expenses, 
        item.profit,
        item.cumulative
      ])
    ].map(row => row.join(',')).join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `revenue-analytics-${timeRange}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const timeRangeOptions = [
    { value: '7d', label: '7 Days' },
    { value: '30d', label: '30 Days' },
    { value: '90d', label: '90 Days' }
  ];

  const actions = (
    <>
      <div className="flex items-center gap-2">
        <button
          onClick={() => setChartType('area')}
          className={`flex items-center gap-1 px-3 py-1 text-sm rounded transition-colors ${
            chartType === 'area' 
              ? 'bg-green-600 text-white' 
              : 'bg-[rgba(var(--fg),0.1)] text-[rgb(var(--fg))] hover:bg-[rgba(var(--fg),0.2)]'
          }`}
        >
          <AreaChartIcon className="h-3 w-3" />
          Area
        </button>
        <button
          onClick={() => setChartType('line')}
          className={`flex items-center gap-1 px-3 py-1 text-sm rounded transition-colors ${
            chartType === 'line' 
              ? 'bg-green-600 text-white' 
              : 'bg-[rgba(var(--fg),0.1)] text-[rgb(var(--fg))] hover:bg-[rgba(var(--fg),0.2)]'
          }`}
        >
          <LineChartIcon className="h-3 w-3" />
          Line
        </button>
      </div>
      <select
        value={timeRange}
        onChange={(e) => setTimeRange(e.target.value)}
        className="text-sm border border-[rgb(var(--border))] bg-[rgb(var(--card))] text-[rgb(var(--fg))] rounded px-2 py-1"
      >
        {timeRangeOptions.map(option => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <button
        onClick={exportData}
        className="flex items-center gap-1 px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
      >
        <Download className="h-3 w-3" />
        Export
      </button>
    </>
  );

  const renderAreaChart = () => (
    <ResponsiveContainer width="100%" height={300}>
      <AreaChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
        <defs>
          <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#10B981" stopOpacity={0.8}/>
            <stop offset="95%" stopColor="#10B981" stopOpacity={0.1}/>
          </linearGradient>
          <linearGradient id="expensesGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#EF4444" stopOpacity={0.8}/>
            <stop offset="95%" stopColor="#EF4444" stopOpacity={0.1}/>
          </linearGradient>
          <linearGradient id="profitGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.8}/>
            <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.1}/>
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(var(--fg),0.1)" />
        <XAxis 
          dataKey="date" 
          tickFormatter={formatDate}
          stroke="rgba(var(--fg),0.6)"
          fontSize={12}
        />
        <YAxis 
          stroke="rgba(var(--fg),0.6)"
          fontSize={12}
          tickFormatter={(value) => `₹${(value / 1000).toFixed(0)}k`}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: 'rgb(var(--card))',
            border: '1px solid rgb(var(--border))',
            borderRadius: '8px',
            color: 'rgb(var(--fg))'
          }}
          labelFormatter={(value) => `Date: ${formatDate(value)}`}
          formatter={(value, name) => {
            console.log('🔍 Revenue Tooltip Debug:', { value, name });
            
            let label = 'Unknown';
            // Handle both dataKey and name prop values (case insensitive)
            if (name === 'revenue' || name === 'Revenue') {
              label = 'Revenue';
            } else if (name === 'expenses' || name === 'Expenses') {
              label = 'Expenses';
            } else if (name === 'profit' || name === 'Profit') {
              label = 'Profit';
            }
            
            console.log('🎯 Revenue Tooltip Label:', { name, label, value });
            return [formatCurrency(value), label];
          }}
        />
        <Legend />
        <Area
          type="monotone"
          dataKey="revenue"
          stroke="#10B981"
          fillOpacity={1}
          fill="url(#revenueGradient)"
          name="Revenue"
        />
        <Area
          type="monotone"
          dataKey="expenses"
          stroke="#EF4444"
          fillOpacity={1}
          fill="url(#expensesGradient)"
          name="Expenses"
        />
        <Area
          type="monotone"
          dataKey="profit"
          stroke="#3B82F6"
          fillOpacity={1}
          fill="url(#profitGradient)"
          name="Profit"
        />
      </AreaChart>
    </ResponsiveContainer>
  );

  const renderLineChart = () => (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(var(--fg),0.1)" />
        <XAxis 
          dataKey="date" 
          tickFormatter={formatDate}
          stroke="rgba(var(--fg),0.6)"
          fontSize={12}
        />
        <YAxis 
          stroke="rgba(var(--fg),0.6)"
          fontSize={12}
          tickFormatter={(value) => `₹${(value / 1000).toFixed(0)}k`}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: 'rgb(var(--card))',
            border: '1px solid rgb(var(--border))',
            borderRadius: '8px',
            color: 'rgb(var(--fg))'
          }}
          labelFormatter={(value) => `Date: ${formatDate(value)}`}
          formatter={(value, name) => {
            console.log('🔍 Revenue Tooltip Debug:', { value, name });
            
            let label = 'Unknown';
            // Handle both dataKey and name prop values (case insensitive)
            if (name === 'revenue' || name === 'Revenue') {
              label = 'Revenue';
            } else if (name === 'expenses' || name === 'Expenses') {
              label = 'Expenses';
            } else if (name === 'profit' || name === 'Profit') {
              label = 'Profit';
            }
            
            console.log('🎯 Revenue Tooltip Label:', { name, label, value });
            return [formatCurrency(value), label];
          }}
        />
        <Legend />
        <Line
          type="monotone"
          dataKey="revenue"
          stroke="#10B981"
          strokeWidth={3}
          dot={{ fill: '#10B981', strokeWidth: 2, r: 4 }}
          name="Revenue"
        />
        <Line
          type="monotone"
          dataKey="expenses"
          stroke="#EF4444"
          strokeWidth={3}
          dot={{ fill: '#EF4444', strokeWidth: 2, r: 4 }}
          name="Expenses"
        />
        <Line
          type="monotone"
          dataKey="profit"
          stroke="#3B82F6"
          strokeWidth={3}
          dot={{ fill: '#3B82F6', strokeWidth: 2, r: 4 }}
          name="Profit"
        />
      </LineChart>
    </ResponsiveContainer>
  );

  return (
    <ChartContainer
      title="Revenue Analytics"
      subtitle="Track revenue, expenses, and profit trends"
      loading={loading}
      error={error}
      actions={actions}
      className="mb-6"
    >
      {chartType === 'area' ? renderAreaChart() : renderLineChart()}
    </ChartContainer>
  );
};

export default RevenueChart;
