import React, { useState, useEffect, useMemo } from 'react';
import Pagination from '../components/Pagination';
import ResponsiveTable from '../components/ResponsiveTable';
import EnhancedExportButton from '../components/EnhancedExportButton';
import { RewardActions } from '../components/TableActions';
import { 
  Gift, 
  Users, 
  CheckCircle, 
  Clock, 
  TrendingUp,
  Eye,
  Filter,
  RefreshCw,
  Award,
  Target
} from 'lucide-react';

import { API_ENDPOINTS } from '../config/api';
import { useAuth } from '../context/AuthContext';

const UserRewards = () => {
  const { token, authFetch } = useAuth();
  const [userRewards, setUserRewards] = useState([]);
  const [rewardStats, setRewardStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, claimed, available, eligible
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchUserRewards();
    fetchRewardStats();
  }, []);

  const fetchUserRewards = async () => {
    try {
      setLoading(true);
      const response = await authFetch(API_ENDPOINTS.GET_ALL_USER_REWARDS);
      
      if (response.ok) {
        const data = await response.json();
        setUserRewards(data.allRewards || []);
      } else {
        console.error('Failed to fetch user rewards');
      }
    } catch (error) {
      console.error('Error fetching user rewards:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRewardStats = async () => {
    try {
      const response = await authFetch(API_ENDPOINTS.GET_REWARD_STATS);
      
      if (response.ok) {
        const data = await response.json();
        setRewardStats(data);
      }
    } catch (error) {
      console.error('Error fetching reward stats:', error);
    }
  };

  const handleRefresh = () => {
    fetchUserRewards();
    fetchRewardStats();
  };

  const filtered = useMemo(() => {
    let filtered = userRewards;

    // Apply status filter
    if (filter === 'claimed') {
      filtered = filtered.filter(reward => reward.isClaimed);
    } else if (filter === 'available') {
      filtered = filtered.filter(reward => !reward.isClaimed);
    } else if (filter === 'eligible') {
      filtered = filtered.filter(reward => !reward.isClaimed && reward.isEligible);
    }

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(reward =>
        reward.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        reward.rewardName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        reward.rewardType.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Sort by date in descending order (latest at the top)
    // For claimed rewards, sort by claimedAt
    // For unclaimed rewards, sort by createdAt (if available) or keep original order
    filtered.sort((a, b) => {
      const dateA = a.isClaimed && a.claimedAt ? new Date(a.claimedAt) : (a.createdAt ? new Date(a.createdAt) : new Date(0));
      const dateB = b.isClaimed && b.claimedAt ? new Date(b.claimedAt) : (b.createdAt ? new Date(b.createdAt) : new Date(0));
      return dateB - dateA; // Descending order (newest first)
    });

    return filtered;
  }, [userRewards, filter, searchTerm]);

  // Pagination
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  useEffect(() => { setPage(1); }, [filter, searchTerm]);
  const paged = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, page, pageSize]);

  const getStatusBadge = (reward) => {
    if (reward.isClaimed) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
          <CheckCircle className="w-3 h-3 mr-1" />
          Claimed
        </span>
      );
    } else if (reward.isEligible) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
          <Target className="w-3 h-3 mr-1" />
          Available
        </span>
      );
    } else {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
          <Clock className="w-3 h-3 mr-1" />
          {reward.eligibilityStatus}
        </span>
      );
    }
  };

  const getRewardTypeIcon = (rewardType) => {
    switch (rewardType.toLowerCase()) {
      case 'cash':
        return '💰';
      case 'gift':
        return '🎁';
      case 'discount':
        return '🏷️';
      case 'points':
        return '⭐';
      default:
        return '🎯';
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-[rgb(var(--bg))] text-[rgb(var(--fg))]">
        <RefreshCw className="animate-spin text-blue-500 w-8 h-8" />
        <span className="ml-2">Loading User Rewards...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[rgb(var(--bg))] text-[rgb(var(--fg))] p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-[rgb(var(--fg))] flex items-center">
                <Award className="w-8 h-8 mr-3 text-yellow-500" />
                User Rewards Management
              </h1>
              <p className="text-[rgba(var(--fg),0.7)] mt-2">Track and manage user reward claims across all tiers and levels</p>
            </div>
            <div className="flex items-center gap-3">
              <EnhancedExportButton
                data={filtered}
                dataType="user-rewards"
                filename="user-rewards"
                currentFilters={{
                  search: searchTerm,
                  filter: filter
                }}
                currentSort={null}
                showAdvancedOptions={true}
                defaultFormat="excel"
                isDataPreFiltered={true}
                totalRecords={userRewards.length}
              />
              <button
                onClick={handleRefresh}
                className="flex items-center space-x-2 px-4 py-2 border border-[rgb(var(--border))] rounded-lg hover:bg-[rgba(var(--fg),0.05)] text-[rgb(var(--fg))]"
              >
                <RefreshCw className="w-5 h-5" />
                <span>Refresh</span>
              </button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        {rewardStats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-[rgb(var(--card))] rounded-lg p-6 border border-[rgb(var(--border))]">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Gift className="w-6 h-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-[rgba(var(--fg),0.7)]">Total Rewards</p>
                  <p className="text-2xl font-bold text-[rgb(var(--fg))]">{rewardStats.totalRewards}</p>
                </div>
              </div>
            </div>

            <div className="bg-[rgb(var(--card))] rounded-lg p-6 border border-[rgb(var(--border))]">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 rounded-lg">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-[rgba(var(--fg),0.7)]">Claimed</p>
                  <p className="text-2xl font-bold text-[rgb(var(--fg))]">{rewardStats.claimedRewards}</p>
                </div>
              </div>
            </div>

            <div className="bg-[rgb(var(--card))] rounded-lg p-6 border border-[rgb(var(--border))]">
              <div className="flex items-center">
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <Clock className="w-6 h-6 text-yellow-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-[rgba(var(--fg),0.7)]">Available</p>
                  <p className="text-2xl font-bold text-[rgb(var(--fg))]">{rewardStats.availableRewards}</p>
                </div>
              </div>
            </div>

            <div className="bg-[rgb(var(--card))] rounded-lg p-6 border border-[rgb(var(--border))]">
              <div className="flex items-center">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <TrendingUp className="w-6 h-6 text-purple-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-[rgba(var(--fg),0.7)]">Claim Rate</p>
                  <p className="text-2xl font-bold text-[rgb(var(--fg))]">{rewardStats.claimRate?.toFixed(1)}%</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="mb-6 flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <input
                type="text"
                placeholder="Search by user name, reward name, or type..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--card))] text-[rgb(var(--fg))] focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[rgba(var(--fg),0.6)]" />
            </div>
          </div>
          <div className="flex gap-2">
            {['all', 'claimed', 'available', 'eligible'].map((filterOption) => (
              <button
                key={filterOption}
                onClick={() => setFilter(filterOption)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filter === filterOption
                    ? 'bg-blue-600 text-white'
                    : 'border border-[rgb(var(--border))] hover:bg-[rgba(var(--fg),0.05)] text-[rgb(var(--fg))]'
                }`}
              >
                {filterOption.charAt(0).toUpperCase() + filterOption.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Enhanced Responsive Table */}
        <ResponsiveTable
          columns={[
            {
              key: 'userName',
              title: 'User',
              sortable: true,
              render: (value, reward) => (
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <Users className="h-4 w-4 text-blue-600" />
                  </div>
                  <div>
                    <div className="font-medium">{reward.userName}</div>
                    <div className="text-sm text-gray-500">{reward.userEmail}</div>
                  </div>
                </div>
              )
            },
            {
              key: 'rewardName',
              title: 'Reward',
              sortable: true,
              render: (value, reward) => (
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{getRewardTypeIcon(reward.rewardType)}</span>
                  <div>
                    <div className="font-medium">{reward.rewardName}</div>
                    <div className="text-sm text-gray-500">{reward.rewardType}</div>
                    {reward.rewardValue && (
                      <div className="text-sm text-green-600 font-semibold">₹{reward.rewardValue}</div>
                    )}
                  </div>
                </div>
              )
            },
            {
              key: 'levelNumber',
              title: 'Level',
              sortable: true,
              render: (value, reward) => (
                <div className="flex items-center gap-2">
                  <Award className="h-4 w-4 text-purple-600" />
                  <div>
                    <div className="font-medium">Level {reward.levelNumber}</div>
                    <div className="text-sm text-gray-500">{reward.requiredReferrals} referrals</div>
                  </div>
                </div>
              )
            },
            {
              key: 'progress',
              title: 'Progress',
              sortable: false,
              render: (value, reward) => (
                <div>
                  <div className="text-sm font-medium mb-1">
                    {reward.userCurrentReferrals}/{reward.requiredReferrals}
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all"
                      style={{
                        width: `${Math.min((reward.userCurrentReferrals / reward.requiredReferrals) * 100, 100)}%`
                      }}
                    ></div>
                  </div>
                </div>
              )
            },
            {
              key: 'status',
              title: 'Status',
              sortable: true,
              render: (value, reward) => getStatusBadge(reward)
            },
            {
              key: 'claimedAt',
              title: 'Claimed Date',
              sortable: true,
              render: (value, reward) => (
                <div className="text-sm opacity-80">
                  {formatDate(reward.claimedAt)}
                </div>
              )
            }
          ]}
          data={paged}
          loading={loading}
          emptyMessage="No rewards found. Try adjusting your filters or search terms."
          searchable={false}
          filterable={false}
          selectable={false}
          cardView={true}
          stickyHeader={true}
          actions={(reward) => (
            <RewardActions
              reward={reward}
              onView={(reward) => {/* View details */}}
              onClaim={(reward) => {/* Claim reward */}}
            />
          )}
          pagination={{
            currentPage: page,
            totalPages: Math.ceil(filtered.length / pageSize),
            start: (page - 1) * pageSize + 1,
            end: Math.min(page * pageSize, filtered.length),
            total: filtered.length,
            hasPrevious: page > 1,
            hasNext: page < Math.ceil(filtered.length / pageSize),
            onPrevious: () => setPage(page - 1),
            onNext: () => setPage(page + 1)
          }}
        />
      </div>
    </div>
  );
};

export default UserRewards;
