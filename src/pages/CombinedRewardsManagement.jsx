import React, { useState, useEffect } from 'react';
import {
  Gift,
  CheckCircle,
  XCircle,
  Clock,
  Lock,
  DollarSign,
  TrendingUp,
  AlertCircle,
  Eye,
  ThumbsUp,
  ThumbsDown,
  Loader2,
  Users,
  Award,
  Filter,
  Search,
  RefreshCw,
  Download,
  Settings,
} from 'lucide-react';
import { API_ENDPOINTS } from '../config/api';

const API_BASE = '';

const CombinedRewardsManagement = () => {
  const [claims, setClaims] = useState([]);
  const [userRewards, setUserRewards] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(null);
  
  // Filter states
  const [activeTab, setActiveTab] = useState('CLAIMS'); // CLAIMS, USER_REWARDS, STATS
  const [claimFilter, setClaimFilter] = useState('PENDING');
  const [userRewardFilter, setUserRewardFilter] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Pagination states
  const [pagination, setPagination] = useState({
    currentPage: 0,
    totalPages: 0,
    totalElements: 0,
    size: 20
  });
  
  // Modal states
  const [selectedClaim, setSelectedClaim] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [adminNotes, setAdminNotes] = useState('');
  const [actionType, setActionType] = useState('');

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  useEffect(() => {
    fetchData(false); // Don't show loading for filter changes
  }, [claimFilter, userRewardFilter, pagination.currentPage]);

  const getToken = () => {
    const auth = localStorage.getItem('auth');
    return auth ? JSON.parse(auth).accessToken : '';
  };

  const handlePageChange = (newPage) => {
    setPagination(prev => ({ ...prev, currentPage: newPage }));
  };

  const handleFilterChange = (filterType, value) => {
    if (filterType === 'claim') {
      setClaimFilter(value);
    } else if (filterType === 'userReward') {
      setUserRewardFilter(value);
    }
    setPagination(prev => ({ ...prev, currentPage: 0 }));
  };

  const fetchData = async (showLoading = true) => {
    try {
      if (showLoading) {
        setLoading(true);
      }
      const token = getToken();
      const headers = {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      };

      const promises = [];

      // Always fetch stats
      promises.push(
        fetch(API_ENDPOINTS.GET_REWARD_STATS, { headers })
          .then(res => res.ok ? res.json() : {})
      );

      // Fetch claims if on claims tab
      if (activeTab === 'CLAIMS') {
        const params = new URLSearchParams({
          page: pagination.currentPage.toString(),
          size: pagination.size.toString(),
          sort: 'createdAt,desc' // Latest first
        });
        
        const endpoint = claimFilter === 'ALL' 
          ? `${API_ENDPOINTS.GET_ALL_USER_REWARDS}?${params}`
          : `${API_ENDPOINTS.GET_CLAIMS_BY_STATUS}/${claimFilter}?${params}`;
        promises.push(
          fetch(endpoint, { headers })
            .then(res => res.ok ? res.json() : { claims: [], totalPages: 0, totalElements: 0 })
        );
      }

      // Fetch user rewards if on user rewards tab
      if (activeTab === 'USER_REWARDS') {
        promises.push(
          fetch(API_ENDPOINTS.GET_ALL_USER_REWARDS, { headers })
            .then(res => res.ok ? res.json() : { allRewards: [] })
        );
      }

      const results = await Promise.all(promises);
      
      if (results[0]) {
        setStats(results[0]);
      }
      
      if (activeTab === 'CLAIMS' && results[1]) {
        const claimsData = results[1].claims || results[1].allRewards || [];
        console.log('📊 Claims data received:', {
          totalItems: claimsData.length,
          pagination: results[1],
          currentPage: pagination.currentPage
        });
        
        // If backend doesn't support pagination, implement client-side pagination
        if (!results[1].totalPages && claimsData.length > 0) {
          // Sort by creation date (latest first) - client-side sorting
          const sortedClaims = [...claimsData].sort((a, b) => {
            const dateA = new Date(a.createdAt || a.claimedAt || 0);
            const dateB = new Date(b.createdAt || b.claimedAt || 0);
            return dateB - dateA; // Latest first
          });
          
          const startIndex = pagination.currentPage * pagination.size;
          const endIndex = startIndex + pagination.size;
          const paginatedClaims = sortedClaims.slice(startIndex, endIndex);
          const totalPages = Math.ceil(sortedClaims.length / pagination.size);
          
          console.log('🔄 Client-side pagination & sorting:', {
            startIndex,
            endIndex,
            totalPages,
            totalElements: sortedClaims.length,
            sorted: true
          });
          
          setClaims(paginatedClaims);
          setPagination(prev => ({
            ...prev,
            totalPages,
            totalElements: sortedClaims.length
          }));
        } else {
          setClaims(claimsData);
          setPagination(prev => ({
            ...prev,
            totalPages: results[1].totalPages || 0,
            totalElements: results[1].totalElements || 0
          }));
        }
      }
      
      if (activeTab === 'USER_REWARDS' && results[1]) {
        setUserRewards(results[1].allRewards || []);
      }

    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      if (showLoading) {
        setLoading(false);
      }
    }
  };

  const openApproveModal = (claim) => {
    setSelectedClaim(claim);
    setActionType('approve');
    setAdminNotes('Approved - Reward conditions met');
    setShowModal(true);
  };

  const openRejectModal = (claim) => {
    setSelectedClaim(claim);
    setActionType('reject');
    setAdminNotes('');
    setShowModal(true);
  };

  const handleApprove = async () => {
    if (!selectedClaim) return;

    try {
      setProcessing(selectedClaim.userRewardId);
      const token = getToken();

      const response = await fetch(
        `${API_ENDPOINTS.APPROVE_REWARD}/${selectedClaim.userRewardId}/approve`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ adminNotes }),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to approve claim');
      }

      alert('✅ Reward claim approved successfully! Please contact the user to provide their reward.');
      setShowModal(false);
      setSelectedClaim(null);
      setAdminNotes('');
      fetchData();
    } catch (error) {
      console.error('Error approving claim:', error);
      alert('Failed to approve claim. Please try again.');
    } finally {
      setProcessing(null);
    }
  };

  const handleReject = async () => {
    if (!selectedClaim || !adminNotes.trim()) {
      alert('Please provide a reason for rejection');
      return;
    }

    try {
      setProcessing(selectedClaim.userRewardId);
      const token = getToken();

      const response = await fetch(
        `${API_ENDPOINTS.REJECT_REWARD}/${selectedClaim.userRewardId}/reject`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ adminNotes }),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to reject claim');
      }

      alert('❌ Reward claim rejected successfully.');
      setShowModal(false);
      setSelectedClaim(null);
      setAdminNotes('');
      fetchData();
    } catch (error) {
      console.error('Error rejecting claim:', error);
      alert('Failed to reject claim. Please try again.');
    } finally {
      setProcessing(null);
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      PENDING: { icon: Clock, color: 'bg-yellow-500', text: 'Pending' },
      APPROVED: { icon: CheckCircle, color: 'bg-green-500', text: 'Approved' },
      REJECTED: { icon: XCircle, color: 'bg-red-500', text: 'Rejected' },
      UNCLAIMED: { icon: Lock, color: 'bg-gray-500', text: 'Unclaimed' },
    };

    const badge = badges[status] || badges.UNCLAIMED;
    const Icon = badge.icon;

    return (
      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-white text-sm ${badge.color}`}>
        <Icon className="w-4 h-4" />
        {badge.text}
      </span>
    );
  };

  const getRewardTypeIcon = (type) => {
    switch (type) {
      case 'CASH':
        return <DollarSign className="w-5 h-5 text-green-500" />;
      case 'GIFT':
        return <Gift className="w-5 h-5 text-purple-500" />;
      default:
        return <TrendingUp className="w-5 h-5 text-blue-500" />;
    }
  };

  const filteredClaims = claims.filter(claim => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    return (
      claim.userName?.toLowerCase().includes(searchLower) ||
      claim.userEmail?.toLowerCase().includes(searchLower) ||
      claim.rewardName?.toLowerCase().includes(searchLower)
    );
  });

  const filteredUserRewards = userRewards.filter(reward => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    return (
      reward.userName?.toLowerCase().includes(searchLower) ||
      reward.userEmail?.toLowerCase().includes(searchLower) ||
      reward.rewardName?.toLowerCase().includes(searchLower)
    );
  });

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center gap-3 p-6 rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--card))]">
          <Loader2 className="w-6 h-6 animate-spin" />
          <span>Loading rewards data...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Rewards Management</h1>
          <p className="text-[rgb(var(--text-muted))] mt-1">
            Complete rewards system - claims processing and user rewards tracking
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchData}
            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-[rgb(var(--border))] hover:bg-[rgb(var(--card-hover))] transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        </div>
      </div>

      {/* Statistics Dashboard */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="p-4 rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--card))]">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg bg-blue-500/10">
                <Gift className="w-6 h-6 text-blue-500" />
              </div>
              <div>
                <div className="text-2xl font-bold">{stats.totalRewards || 0}</div>
                <div className="text-sm text-[rgb(var(--text-muted))]">Total Rewards</div>
              </div>
            </div>
          </div>

          <div className="p-4 rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--card))]">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg bg-yellow-500/10">
                <Clock className="w-6 h-6 text-yellow-500" />
              </div>
              <div>
                <div className="text-2xl font-bold">{stats.pendingClaims || 0}</div>
                <div className="text-sm text-[rgb(var(--text-muted))]">Pending Claims</div>
              </div>
            </div>
          </div>

          <div className="p-4 rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--card))]">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg bg-green-500/10">
                <CheckCircle className="w-6 h-6 text-green-500" />
              </div>
              <div>
                <div className="text-2xl font-bold">{stats.approvedClaims || 0}</div>
                <div className="text-sm text-[rgb(var(--text-muted))]">Approved</div>
              </div>
            </div>
          </div>

          <div className="p-4 rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--card))]">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg bg-red-500/10">
                <XCircle className="w-6 h-6 text-red-500" />
              </div>
              <div>
                <div className="text-2xl font-bold">{stats.rejectedClaims || 0}</div>
                <div className="text-sm text-[rgb(var(--text-muted))]">Rejected</div>
              </div>
            </div>
          </div>

          <div className="p-4 rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--card))]">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg bg-purple-500/10">
                <TrendingUp className="w-6 h-6 text-purple-500" />
              </div>
              <div>
                <div className="text-2xl font-bold">{Math.round(stats.approvalRate || 0)}%</div>
                <div className="text-sm text-[rgb(var(--text-muted))]">Approval Rate</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="flex gap-2 border-b border-[rgb(var(--border))]">
        {[
          { id: 'CLAIMS', label: 'Reward Claims', icon: Clock },
          { id: 'USER_REWARDS', label: 'User Rewards', icon: Users },
          { id: 'STATS', label: 'Statistics', icon: TrendingUp },
        ].map(({ id, label, icon: Icon }) => (
          <button
            key={`tab-${id}`}
            onClick={(e) => {
              e.preventDefault();
              setActiveTab(id);
            }}
            className={`flex items-center gap-2 px-4 py-2 font-medium transition-colors relative ${
              activeTab === id
                ? 'text-blue-600 bg-blue-50'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
            type="button"
          >
            <Icon className="w-4 h-4" />
            {label}
            {activeTab === id && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600" />
            )}
          </button>
        ))}
      </div>

      {/* Search and Filters */}
      <div className="flex items-center gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[rgb(var(--text-muted))]" />
          <input
            type="text"
            placeholder="Search by user name, email, or reward name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--background))] focus:outline-none focus:ring-2 focus:ring-[rgb(var(--primary))]"
          />
        </div>
        
        {activeTab === 'CLAIMS' && (
          <div className="flex gap-2">
            {['PENDING', 'APPROVED', 'REJECTED', 'ALL'].map((status) => (
              <button
                key={`filter-${status}`}
                onClick={(e) => {
                  e.preventDefault();
                  handleFilterChange('claim', status);
                }}
                className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                  claimFilter === status
                    ? 'bg-blue-600 text-white border border-blue-600'
                    : 'bg-gray-100 text-gray-700 border border-gray-300 hover:bg-gray-200'
                }`}
                type="button"
              >
                {status}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Content Area */}
      {activeTab === 'CLAIMS' && (
        <div className="rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] overflow-hidden">
          <div className="px-4 py-3 border-b border-[rgb(var(--border))] bg-[rgb(var(--card-hover))]">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Reward Claims</h3>
              <div className="text-sm text-[rgb(var(--text-muted))]">
                {pagination.totalElements > 0 && (
                  <span>Total: {pagination.totalElements} claims • Latest first</span>
                )}
              </div>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-[rgb(var(--card-hover))]">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold">User</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Reward</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Level</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Type & Value</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Status</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Referrals</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Date</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[rgb(var(--border))]">
                {filteredClaims.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="px-4 py-12 text-center text-[rgb(var(--text-muted))]">
                      <AlertCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
                      <div>No {claimFilter.toLowerCase()} claims found</div>
                    </td>
                  </tr>
                ) : (
                  filteredClaims.map((claim) => (
                    <tr key={claim.userRewardId} className="hover:bg-[rgb(var(--card-hover))] transition-colors">
                      <td className="px-4 py-3">
                        <div>
                          <div className="font-medium">{claim.userName}</div>
                          <div className="text-sm text-[rgb(var(--text-muted))]">{claim.userEmail}</div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-medium">{claim.rewardName}</div>
                        <div className="text-sm text-[rgb(var(--text-muted))]">{claim.rewardDescription}</div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-medium">Level {claim.levelNumber}</span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {getRewardTypeIcon(claim.rewardType)}
                          <div>
                            <div className="font-medium">{claim.rewardType}</div>
                            {claim.rewardValue && (
                              <div className="text-sm text-green-500">₹{claim.rewardValue}</div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {getStatusBadge(claim.claimStatus || 'UNCLAIMED')}
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-sm">
                          <span className="font-medium">{claim.userCurrentReferrals}</span>
                          <span className="text-[rgb(var(--text-muted))]"> / {claim.requiredReferrals}</span>
                        </div>
                        {claim.isEligible ? (
                          <span className="text-xs text-green-500">✓ Eligible</span>
                        ) : (
                          <span className="text-xs text-yellow-500">Not eligible yet</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-sm">
                          {claim.claimedAt ? new Date(claim.claimedAt).toLocaleDateString() : '-'}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-2">
                          {claim.claimStatus === 'PENDING' && (
                            <>
                              <button
                                onClick={() => openApproveModal(claim)}
                                disabled={processing === claim.userRewardId}
                                className="p-2 rounded-lg bg-green-500/10 text-green-500 hover:bg-green-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                title="Approve"
                              >
                                <ThumbsUp className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => openRejectModal(claim)}
                                disabled={processing === claim.userRewardId}
                                className="p-2 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                title="Reject"
                              >
                                <ThumbsDown className="w-4 h-4" />
                              </button>
                            </>
                          )}
                          {(claim.claimStatus === 'APPROVED' || claim.claimStatus === 'REJECTED') && claim.adminNotes && (
                            <div className="text-xs text-[rgb(var(--text-muted))] max-w-xs truncate" title={claim.adminNotes}>
                              Note: {claim.adminNotes}
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          
          {/* Pagination for Claims */}
          {(pagination.totalPages > 1 || pagination.totalElements > pagination.size) && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-[rgb(var(--border))] bg-[rgb(var(--card-hover))]">
              <div className="text-sm text-[rgb(var(--text-muted))]">
                Showing {pagination.currentPage * pagination.size + 1} to {Math.min((pagination.currentPage + 1) * pagination.size, pagination.totalElements)} of {pagination.totalElements} results
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handlePageChange(pagination.currentPage - 1)}
                  disabled={pagination.currentPage === 0}
                  className="px-3 py-1 text-sm rounded-lg border border-[rgb(var(--border))] hover:bg-[rgb(var(--card-hover))] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <span className="text-sm">
                  Page {pagination.currentPage + 1} of {pagination.totalPages}
                </span>
                <button
                  onClick={() => handlePageChange(pagination.currentPage + 1)}
                  disabled={pagination.currentPage >= pagination.totalPages - 1}
                  className="px-3 py-1 text-sm rounded-lg border border-[rgb(var(--border))] hover:bg-[rgb(var(--card-hover))] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'USER_REWARDS' && (
        <div className="rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-[rgb(var(--card-hover))]">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold">User</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Reward</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Level</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Type & Value</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Status</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Referrals</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[rgb(var(--border))]">
                {filteredUserRewards.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="px-4 py-12 text-center text-[rgb(var(--text-muted))]">
                      <AlertCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
                      <div>No user rewards found</div>
                    </td>
                  </tr>
                ) : (
                  filteredUserRewards.map((reward) => (
                    <tr key={reward.userRewardId} className="hover:bg-[rgb(var(--card-hover))] transition-colors">
                      <td className="px-4 py-3">
                        <div>
                          <div className="font-medium">{reward.userName}</div>
                          <div className="text-sm text-[rgb(var(--text-muted))]">{reward.userEmail}</div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-medium">{reward.rewardName}</div>
                        <div className="text-sm text-[rgb(var(--text-muted))]">{reward.rewardDescription}</div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-medium">Level {reward.levelNumber}</span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {getRewardTypeIcon(reward.rewardType)}
                          <div>
                            <div className="font-medium">{reward.rewardType}</div>
                            {reward.rewardValue && (
                              <div className="text-sm text-green-500">₹{reward.rewardValue}</div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {getStatusBadge(reward.claimStatus || 'UNCLAIMED')}
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-sm">
                          <span className="font-medium">{reward.userCurrentReferrals}</span>
                          <span className="text-[rgb(var(--text-muted))]"> / {reward.requiredReferrals}</span>
                        </div>
                        {reward.isEligible ? (
                          <span className="text-xs text-green-500">✓ Eligible</span>
                        ) : (
                          <span className="text-xs text-yellow-500">Not eligible yet</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-sm">
                          {reward.claimedAt ? new Date(reward.claimedAt).toLocaleDateString() : '-'}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'STATS' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-6 rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--card))]">
            <h3 className="text-lg font-semibold mb-4">Reward Distribution</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span>Total Rewards</span>
                <span className="font-semibold">{stats?.totalRewards || 0}</span>
              </div>
              <div className="flex justify-between">
                <span>Unclaimed</span>
                <span className="font-semibold text-gray-500">{stats?.unclaimedRewards || 0}</span>
              </div>
              <div className="flex justify-between">
                <span>Pending Claims</span>
                <span className="font-semibold text-yellow-500">{stats?.pendingClaims || 0}</span>
              </div>
              <div className="flex justify-between">
                <span>Approved</span>
                <span className="font-semibold text-green-500">{stats?.approvedClaims || 0}</span>
              </div>
              <div className="flex justify-between">
                <span>Rejected</span>
                <span className="font-semibold text-red-500">{stats?.rejectedClaims || 0}</span>
              </div>
            </div>
          </div>

          <div className="p-6 rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--card))]">
            <h3 className="text-lg font-semibold mb-4">Performance Metrics</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span>Approval Rate</span>
                <span className="font-semibold text-blue-500">{Math.round(stats?.approvalRate || 0)}%</span>
              </div>
              <div className="flex justify-between">
                <span>Claim Rate</span>
                <span className="font-semibold text-purple-500">
                  {stats?.totalRewards > 0 ? Math.round(((stats?.approvedClaims || 0) / stats.totalRewards) * 100) : 0}%
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Action Modal */}
      {showModal && selectedClaim && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-[rgb(var(--card))] rounded-xl border border-[rgb(var(--border))] max-w-lg w-full p-6">
            <h3 className="text-xl font-bold mb-4">
              {actionType === 'approve' ? '✅ Approve' : '❌ Reject'} Reward Claim
            </h3>
            
            <div className="space-y-4 mb-6">
              <div>
                <div className="text-sm text-[rgb(var(--text-muted))]">User</div>
                <div className="font-medium">{selectedClaim.userName} ({selectedClaim.userEmail})</div>
              </div>
              
              <div>
                <div className="text-sm text-[rgb(var(--text-muted))]">Reward</div>
                <div className="font-medium">{selectedClaim.rewardName}</div>
                {selectedClaim.rewardValue && (
                  <div className="text-green-500">₹{selectedClaim.rewardValue}</div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Admin Notes {actionType === 'reject' && <span className="text-red-500">*</span>}
                </label>
                <textarea
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder={actionType === 'reject' ? 'Please provide a reason for rejection...' : 'Optional notes...'}
                  className="w-full px-3 py-2 rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--background))] focus:outline-none focus:ring-2 focus:ring-[rgb(var(--primary))]"
                  rows="3"
                />
              </div>

              {actionType === 'approve' && (
                <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-5 h-5 text-blue-500 mt-0.5" />
                    <div className="text-sm text-blue-500">
                      <strong>Important:</strong> After approval, you must contact the user to provide their reward
                      {selectedClaim.rewardType === 'CASH' && selectedClaim.rewardValue && 
                        ` (₹${selectedClaim.rewardValue})`}.
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowModal(false);
                  setSelectedClaim(null);
                  setAdminNotes('');
                }}
                className="flex-1 px-4 py-2 rounded-lg border border-[rgb(var(--border))] hover:bg-[rgb(var(--card-hover))] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={actionType === 'approve' ? handleApprove : handleReject}
                disabled={processing}
                className={`flex-1 px-4 py-2 rounded-lg text-white font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                  actionType === 'approve'
                    ? 'bg-green-500 hover:bg-green-600'
                    : 'bg-red-500 hover:bg-red-600'
                }`}
              >
                {processing ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Processing...
                  </span>
                ) : (
                  `Confirm ${actionType === 'approve' ? 'Approval' : 'Rejection'}`
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CombinedRewardsManagement;
