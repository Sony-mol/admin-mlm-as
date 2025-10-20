import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell } from 'recharts';
import { DollarSign, TrendingUp, Download, BarChart3, PieChart as PieChartIcon } from 'lucide-react';
import ChartContainer from './ChartContainer';
import { useAuth } from '../../context/AuthContext';
import AnalyticsService from '../../services/AnalyticsService';

const CommissionAnalyticsChart = () => {
  const { authFetch } = useAuth();
  const [data, setData] = useState([]);
  const [pieData, setPieData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [chartType, setChartType] = useState('bar');
  const [timeRange, setTimeRange] = useState('30d');

  useEffect(() => {
    fetchCommissionData();
  }, [timeRange]);

  const fetchCommissionData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Use AnalyticsService to fetch data
      const analyticsService = new AnalyticsService(authFetch);
      const result = await analyticsService.getCommissionAnalytics(timeRange);
      setData(result.barData || result || []);
      setPieData(result.pieData || []);
    } catch (err) {
      console.error('Error fetching commission analytics data:', err);
      // Fallback to mock data on error
      const mockData = generateMockCommissionData(timeRange);
      setData(mockData.barData);
      setPieData(mockData.pieData);
    } finally {
      setLoading(false);
    }
  };

  const generateMockCommissionData = (range) => {
    const days = range === '7d' ? 7 : range === '30d' ? 30 : 90;
    const barData = [];
    
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      
      barData.push({
        date: date.toISOString().split('T')[0],
        pending: Math.floor(Math.random() * 50000) + 10000,
        paid: Math.floor(Math.random() * 80000) + 20000,
        total: Math.floor(Math.random() * 130000) + 30000
      });
    }
    
    const pieData = [
      { name: 'Direct Commission', value: Math.floor(Math.random() * 100000) + 50000, color: '#3B82F6' },
      { name: 'Binary Commission', value: Math.floor(Math.random() * 80000) + 30000, color: '#10B981' },
      { name: 'Matching Bonus', value: Math.floor(Math.random() * 60000) + 20000, color: '#F59E0B' },
      { name: 'Leadership Bonus', value: Math.floor(Math.random() * 40000) + 10000, color: '#EF4444' }
    ];
    
    return { barData, pieData };
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
      ['Date', 'Pending Commissions', 'Paid Commissions', 'Total Commissions'],
      ...data.map(item => [
        item.date, 
        item.pending, 
        item.paid, 
        item.total
      ])
    ].map(row => row.join(',')).join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `commission-analytics-${timeRange}.csv`;
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
          onClick={() => setChartType('bar')}
          className={`flex items-center gap-1 px-3 py-1 text-sm rounded transition-colors ${
            chartType === 'bar' 
              ? 'bg-blue-600 text-white' 
              : 'bg-[rgba(var(--fg),0.1)] text-[rgb(var(--fg))] hover:bg-[rgba(var(--fg),0.2)]'
          }`}
        >
          <BarChart3 className="h-3 w-3" />
          Bar
        </button>
        <button
          onClick={() => setChartType('pie')}
          className={`flex items-center gap-1 px-3 py-1 text-sm rounded transition-colors ${
            chartType === 'pie' 
              ? 'bg-blue-600 text-white' 
              : 'bg-[rgba(var(--fg),0.1)] text-[rgb(var(--fg))] hover:bg-[rgba(var(--fg),0.2)]'
          }`}
        >
          <PieChartIcon className="h-3 w-3" />
          Pie
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

  const renderBarChart = () => (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
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
            console.log('🔍 Commission Tooltip Debug:', { value, name });
            
            let label = 'Unknown';
            // Handle both dataKey and name prop values (case insensitive)
            if (name === 'pending' || name === 'Pending') {
              label = 'Total Pending';
            } else if (name === 'paid' || name === 'Paid') {
              label = 'Total Paid';
            } else if (name === 'total' || name === 'Total') {
              label = 'Total';
            }
            
            console.log('🎯 Commission Tooltip Label:', { name, label, value });
            return [formatCurrency(value), label];
          }}
        />
        <Legend />
        <Bar dataKey="pending" fill="#F59E0B" name="Pending" />
        <Bar dataKey="paid" fill="#10B981" name="Paid" />
      </BarChart>
    </ResponsiveContainer>
  );

  const renderPieChart = () => (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie
          data={pieData}
          cx="50%"
          cy="50%"
          labelLine={false}
          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
          outerRadius={80}
          fill="#8884d8"
          dataKey="value"
        >
          {pieData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color} />
          ))}
        </Pie>
        <Tooltip
          contentStyle={{
            backgroundColor: 'rgb(var(--card))',
            border: '1px solid rgb(var(--border))',
            borderRadius: '8px',
            color: 'rgb(var(--fg))'
          }}
          formatter={(value) => [formatCurrency(value), 'Amount']}
        />
      </PieChart>
    </ResponsiveContainer>
  );

  return (
    <ChartContainer
      title="Commission Analytics"
      subtitle="Track commission trends and breakdown by type"
      loading={loading}
      error={error}
      actions={actions}
      className="mb-6"
    >
      {chartType === 'bar' ? renderBarChart() : renderPieChart()}
    </ChartContainer>
  );
};

export default CommissionAnalyticsChart;
