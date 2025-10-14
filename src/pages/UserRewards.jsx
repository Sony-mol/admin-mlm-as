import React, { useState, useEffect } from 'react';
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

  const getFilteredRewards = () => {
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
  };

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
            <button
              onClick={handleRefresh}
              className="flex items-center space-x-2 px-4 py-2 border border-[rgb(var(--border))] rounded-lg hover:bg-[rgba(var(--fg),0.05)] text-[rgb(var(--fg))]"
            >
              <RefreshCw className="w-5 h-5" />
              <span>Refresh</span>
            </button>
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

        {/* Rewards Table */}
        <div className="overflow-x-auto rounded-lg border border-[rgb(var(--border))]">
          <table className="min-w-full divide-y divide-[rgb(var(--border))]">
            <thead className="bg-[rgba(var(--fg),0.05)]">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-[rgba(var(--fg),0.7)] uppercase tracking-wider">User</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[rgba(var(--fg),0.7)] uppercase tracking-wider">Reward</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[rgba(var(--fg),0.7)] uppercase tracking-wider">Level</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[rgba(var(--fg),0.7)] uppercase tracking-wider">Progress</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[rgba(var(--fg),0.7)] uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[rgba(var(--fg),0.7)] uppercase tracking-wider">Claimed Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[rgb(var(--border))] bg-[rgb(var(--card))]">
              {getFilteredRewards().map((reward) => (
                <tr key={reward.userRewardId} className="hover:bg-[rgba(var(--fg),0.02)]">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-[rgb(var(--fg))]">{reward.userName}</div>
                      <div className="text-sm text-[rgba(var(--fg),0.7)]">{reward.userEmail}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <span className="text-2xl mr-3">{getRewardTypeIcon(reward.rewardType)}</span>
                      <div>
                        <div className="text-sm font-medium text-[rgb(var(--fg))]">{reward.rewardName}</div>
                        <div className="text-sm text-[rgba(var(--fg),0.7)]">{reward.rewardType}</div>
                        {reward.rewardValue && (
                          <div className="text-sm text-green-600">₹{reward.rewardValue}</div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-[rgb(var(--fg))]">Level {reward.levelNumber}</div>
                    <div className="text-sm text-[rgba(var(--fg),0.7)]">{reward.requiredReferrals} referrals</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-[rgb(var(--fg))]">
                      {reward.userCurrentReferrals}/{reward.requiredReferrals}
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                      <div
                        className="bg-blue-600 h-2 rounded-full"
                        style={{
                          width: `${Math.min((reward.userCurrentReferrals / reward.requiredReferrals) * 100, 100)}%`
                        }}
                      ></div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(reward)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-[rgba(var(--fg),0.7)]">
                    {formatDate(reward.claimedAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {getFilteredRewards().length === 0 && (
          <div className="text-center py-10 text-[rgba(var(--fg),0.7)]">
            <Gift className="w-12 h-12 mx-auto mb-4 text-[rgba(var(--fg),0.3)]" />
            <p className="text-lg">No rewards found.</p>
            <p className="text-sm">Try adjusting your filters or search terms.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserRewards;
