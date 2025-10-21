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
} from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'https://asmlmbackend-production.up.railway.app';

const RewardClaims = () => {
  const [claims, setClaims] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(null);
  const [filter, setFilter] = useState('PENDING'); // PENDING, APPROVED, REJECTED, ALL
  const [selectedClaim, setSelectedClaim] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [adminNotes, setAdminNotes] = useState('');
  const [actionType, setActionType] = useState(''); // 'approve' or 'reject'

  useEffect(() => {
    fetchData();
  }, [filter]);

  const getToken = () => {
    const auth = localStorage.getItem('auth');
    return auth ? JSON.parse(auth).accessToken : '';
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const token = getToken();
      const headers = {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      };

      // Fetch claims by status
      const endpoint = filter === 'ALL' 
        ? `${API_BASE}/api/userrewards/all`
        : `${API_BASE}/api/userrewards/status/${filter}`;
      
      const [claimsRes, statsRes] = await Promise.all([
        fetch(endpoint, { headers }),
        fetch(`${API_BASE}/api/userrewards/stats`, { headers }),
      ]);

      if (!claimsRes.ok || !statsRes.ok) {
        throw new Error('Failed to fetch data');
      }

      const claimsData = await claimsRes.json();
      const statsData = await statsRes.json();

      setClaims(claimsData.claims || claimsData.allRewards || claimsData.pendingClaims || []);
      setStats(statsData);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
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
        `${API_BASE}/api/userrewards/${selectedClaim.userRewardId}/approve`,
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
        `${API_BASE}/api/userrewards/${selectedClaim.userRewardId}/reject`,
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

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center gap-3 p-6 rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--card))]">
          <Loader2 className="w-6 h-6 animate-spin" />
          <span>Loading reward claims...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Reward Claims Management</h1>
          <p className="text-[rgb(var(--text-muted))] mt-1">
            Review and process user reward claims
          </p>
        </div>
      </div>

      {/* Statistics */}
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
                <div className="text-sm text-[rgb(var(--text-muted))]">Pending</div>
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

      {/* Filter Tabs */}
      <div className="flex gap-2 border-b border-[rgb(var(--border))]">
        {['PENDING', 'APPROVED', 'REJECTED', 'ALL'].map((status) => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={`px-4 py-2 font-medium transition-colors relative ${
              filter === status
                ? 'text-[rgb(var(--primary))]'
                : 'text-[rgb(var(--text-muted))] hover:text-[rgb(var(--text))]'
            }`}
          >
            {status}
            {filter === status && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[rgb(var(--primary))]" />
            )}
          </button>
        ))}
      </div>

      {/* Claims Table */}
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
                <th className="px-4 py-3 text-right text-sm font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[rgb(var(--border))]">
              {claims.length === 0 ? (
                <tr>
                  <td colSpan="8" className="px-4 py-12 text-center text-[rgb(var(--text-muted))]">
                    <AlertCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <div>No {filter.toLowerCase()} claims found</div>
                  </td>
                </tr>
              ) : (
                claims.map((claim) => (
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
      </div>

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

export default RewardClaims;

