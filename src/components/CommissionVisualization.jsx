import React, { useState, useEffect } from 'react';
import { 
  Users, 
  DollarSign, 
  TrendingUp, 
  Network, 
  Award,
  Eye,
  EyeOff,
  Download,
  Share,
  Filter,
  Search
} from 'lucide-react';

// Commission Level Visualization Component
const CommissionVisualization = ({ data, loading = false }) => {
  const [selectedLevel, setSelectedLevel] = useState(1);
  const [viewMode, setViewMode] = useState('tree'); // tree, table, chart
  const [searchTerm, setSearchTerm] = useState('');

  // Filter data based on search term
  const filteredData = data?.filter(item => 
    item.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.email?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  // Calculate level statistics
  const levelStats = data?.reduce((acc, item) => {
    const level = item.level || 1;
    if (!acc[level]) {
      acc[level] = { count: 0, totalEarnings: 0, users: [] };
    }
    acc[level].count++;
    acc[level].totalEarnings += parseFloat(item.earnings || 0);
    acc[level].users.push(item);
    return acc;
  }, {}) || {};

  const LevelCard = ({ level, stats, isSelected, onClick }) => (
    <div 
      className={`p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 ${
        isSelected 
          ? 'border-blue-500 bg-blue-50' 
          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
      }`}
      onClick={onClick}
    >
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-semibold text-gray-900">Level {level}</h3>
        <div className="flex items-center space-x-1">
          <Users className="w-4 h-4 text-gray-500" />
          <span className="text-sm text-gray-600">{stats.count}</span>
        </div>
      </div>
      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">Total Earnings:</span>
          <span className="text-sm font-medium text-green-600">₹{stats.totalEarnings.toFixed(2)}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">Avg per User:</span>
          <span className="text-sm font-medium text-blue-600">
            ₹{stats.count > 0 ? (stats.totalEarnings / stats.count).toFixed(2) : '0.00'}
          </span>
        </div>
      </div>
    </div>
  );

  const UserCard = ({ user, level }) => (
    <div className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
            <span className="text-sm font-medium text-blue-600">
              {user.name?.charAt(0) || 'U'}
            </span>
          </div>
          <div>
            <h4 className="font-medium text-gray-900">{user.name}</h4>
            <p className="text-sm text-gray-600">{user.email}</p>
          </div>
        </div>
        <div className="text-right">
          <div className="text-sm font-medium text-green-600">₹{user.earnings}</div>
          <div className="text-xs text-gray-500">Level {level}</div>
        </div>
      </div>
      
      <div className="grid grid-cols-3 gap-4 text-center">
        <div>
          <div className="text-lg font-semibold text-gray-900">{user.referrals || 0}</div>
          <div className="text-xs text-gray-500">Referrals</div>
        </div>
        <div>
          <div className="text-lg font-semibold text-gray-900">{user.directReferrals || 0}</div>
          <div className="text-xs text-gray-500">Direct</div>
        </div>
        <div>
          <div className="text-lg font-semibold text-gray-900">{user.indirectReferrals || 0}</div>
          <div className="text-xs text-gray-500">Indirect</div>
        </div>
      </div>
    </div>
  );

  const TreeVisualization = ({ users, level }) => (
    <div className="space-y-4">
      {users.map((user, index) => (
        <div key={user.id || index} className="relative">
          <div className="flex items-center space-x-4">
            <div className="flex-shrink-0">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold">
                {user.name?.charAt(0) || 'U'}
              </div>
            </div>
            <div className="flex-1 bg-white rounded-lg border border-gray-200 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-gray-900">{user.name}</h4>
                  <p className="text-sm text-gray-600">{user.email}</p>
                </div>
                <div className="text-right">
                  <div className="text-lg font-semibold text-green-600">₹{user.earnings}</div>
                  <div className="text-sm text-gray-500">Level {level}</div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Connection lines for tree visualization */}
          {index < users.length - 1 && (
            <div className="absolute left-6 top-12 w-0.5 h-4 bg-gray-300"></div>
          )}
        </div>
      ))}
    </div>
  );

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-8">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            <div className="h-20 bg-gray-200 rounded"></div>
            <div className="h-20 bg-gray-200 rounded"></div>
            <div className="h-20 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Controls */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900">Commission Visualization</h2>
          <div className="flex items-center space-x-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setViewMode('tree')}
                className={`px-3 py-2 rounded-lg text-sm font-medium ${
                  viewMode === 'tree' ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                Tree
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`px-3 py-2 rounded-lg text-sm font-medium ${
                  viewMode === 'table' ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                Table
              </button>
              <button
                onClick={() => setViewMode('chart')}
                className={`px-3 py-2 rounded-lg text-sm font-medium ${
                  viewMode === 'chart' ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                Chart
              </button>
            </div>
          </div>
        </div>

        {/* Level Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {Object.entries(levelStats).map(([level, stats]) => (
            <LevelCard
              key={level}
              level={parseInt(level)}
              stats={stats}
              isSelected={selectedLevel === parseInt(level)}
              onClick={() => setSelectedLevel(parseInt(level))}
            />
          ))}
        </div>
      </div>

      {/* Visualization Content */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">
            Level {selectedLevel} Users ({levelStats[selectedLevel]?.count || 0})
          </h3>
          <div className="flex items-center space-x-2">
            <button className="flex items-center space-x-2 px-3 py-2 text-sm text-gray-600 hover:text-gray-800">
              <Download className="w-4 h-4" />
              <span>Export</span>
            </button>
            <button className="flex items-center space-x-2 px-3 py-2 text-sm text-gray-600 hover:text-gray-800">
              <Share className="w-4 h-4" />
              <span>Share</span>
            </button>
          </div>
        </div>

        {viewMode === 'tree' && (
          <TreeVisualization 
            users={levelStats[selectedLevel]?.users || []} 
            level={selectedLevel} 
          />
        )}

        {viewMode === 'table' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {(levelStats[selectedLevel]?.users || []).map((user, index) => (
              <UserCard key={user.id || index} user={user} level={selectedLevel} />
            ))}
          </div>
        )}

        {viewMode === 'chart' && (
          <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
            <div className="text-center">
              <TrendingUp className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <div className="text-sm text-gray-500">Chart visualization coming soon</div>
            </div>
          </div>
        )}

        {(!levelStats[selectedLevel]?.users || levelStats[selectedLevel].users.length === 0) && (
          <div className="text-center py-12">
            <Users className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <div className="text-sm text-gray-500">No users found for this level</div>
          </div>
        )}
      </div>

      {/* Summary Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center space-x-3 mb-4">
            <div className="p-2 bg-blue-100 rounded-lg">
              <DollarSign className="w-5 h-5 text-blue-600" />
            </div>
            <h3 className="font-semibold text-gray-900">Total Commission</h3>
          </div>
          <div className="text-2xl font-bold text-green-600">
            ₹{data?.reduce((sum, user) => sum + parseFloat(user.earnings || 0), 0).toFixed(2) || '0.00'}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center space-x-3 mb-4">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Network className="w-5 h-5 text-purple-600" />
            </div>
            <h3 className="font-semibold text-gray-900">Total Referrals</h3>
          </div>
          <div className="text-2xl font-bold text-purple-600">
            {data?.reduce((sum, user) => sum + (user.referrals || 0), 0) || 0}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center space-x-3 mb-4">
            <div className="p-2 bg-orange-100 rounded-lg">
              <Award className="w-5 h-5 text-orange-600" />
            </div>
            <h3 className="font-semibold text-gray-900">Active Users</h3>
          </div>
          <div className="text-2xl font-bold text-orange-600">
            {data?.filter(user => user.isActive).length || 0}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CommissionVisualization;
