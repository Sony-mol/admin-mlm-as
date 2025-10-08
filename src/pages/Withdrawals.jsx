// src/pages/Withdrawals.jsx
import React, { useState, useEffect } from 'react';
import { API_ENDPOINTS } from '../config/api';
import {
  DollarSign,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Search,
  Eye,
  Check,
  X,
} from 'lucide-react';

const Withdrawals = () => {
  const [withdrawals, setWithdrawals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedWithdrawals, setSelectedWithdrawals] = useState([]);
  const [actionLoading, setActionLoading] = useState(false);
  const [statistics, setStatistics] = useState({});
  const [selectedWithdrawal, setSelectedWithdrawal] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showActionModal, setShowActionModal] = useState(false);
  const [actionType, setActionType] = useState('');
  const [adminNotes, setAdminNotes] = useState('');
  const [error, setError] = useState(null);

  // API endpoints
  const WITHDRAWALS_API = API_ENDPOINTS.WITHDRAWALS;
  const STATISTICS_API = `${API_ENDPOINTS.WITHDRAWALS}/statistics`;

  // Error boundary
  useEffect(() => {
    const handleError = (e) => {
      console.error('Withdrawals component error:', e);
      setError(e.message);
    };
    window.addEventListener('error', handleError);
    return () => window.removeEventListener('error', handleError);
  }, []);

  useEffect(() => {
    fetchWithdrawals();
    fetchStatistics();
  }, []);

  useEffect(() => {
    console.log('Withdrawals state updated:', {
      loading,
      withdrawalsCount: withdrawals.length,
      statistics,
    });
  }, [loading, withdrawals, statistics]);

  const fmtDMY = (iso) => {
    if (!iso) return '';
    const d = new Date(iso);
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const yyyy = d.getFullYear();
    return `${dd}-${mm}-${yyyy}`;
  };

  const fetchWithdrawals = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('auth')
        ? JSON.parse(localStorage.getItem('auth')).accessToken
        : '';
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      console.log('Fetching withdrawals from:', WITHDRAWALS_API);
      const response = await fetch(WITHDRAWALS_API, { headers });
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

      const responseData = await response.json();
      console.log('Withdrawals data received:', responseData);

      const raw = responseData.withdrawals || responseData || [];
      const mapped = (Array.isArray(raw) ? raw : []).map((w) => ({
        ...w,
        // Normalize user object from top-level fields
        user: {
          name: w.userName || 'Unknown User',
          email: w.userEmail || 'No email',
          id: w.userId ?? null,
        },
        description: w.paymentMethod || w.description || '',
      }));

      setWithdrawals(mapped);
    } catch (error) {
      console.error('Error fetching withdrawals:', error);
      // Demo fallback
      setWithdrawals([
        {
          id: 1,
          user: { name: 'Test User', email: 'test@example.com' },
          amount: 1000,
          paymentMethod: 'UPI',
          upiId: 'test@upi',
          status: 'PENDING',
          createdAt: new Date().toISOString(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const fetchStatistics = async () => {
    try {
      const token = localStorage.getItem('auth')
        ? JSON.parse(localStorage.getItem('auth')).accessToken
        : '';
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      console.log('Fetching statistics from:', STATISTICS_API);
      const response = await fetch(STATISTICS_API, { headers });
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

      const s = await response.json();
      console.log('Statistics data received:', s);

      // Map backend keys -> UI keys
      setStatistics({
        // Cards
        totalAmount:
          Number(s.totalApprovedAmount ?? 0) + Number(s.totalPendingAmount ?? 0),
        pendingCount: Number(s.pendingWithdrawals ?? 0),
        approvedCount: Number(s.approvedWithdrawals ?? 0),
        completedCount: Number(s.approvedWithdrawals ?? 0), // UI label "Completed"
        rejectedCount: Number(s.rejectedWithdrawals ?? 0),

        // Optional extras (not directly displayed but useful)
        totalCount: Number(s.totalWithdrawals ?? 0),
        totalApprovedAmount: Number(s.totalApprovedAmount ?? 0),
        totalPendingAmount: Number(s.totalPendingAmount ?? 0),
      });
    } catch (error) {
      console.error('Error fetching statistics:', error);
      // Demo fallback
      setStatistics({
        totalAmount: 1000,
        pendingCount: 1,
        approvedCount: 0,
        completedCount: 0,
        rejectedCount: 0,
      });
    }
  };

  // Client-side status filter (avoid calling /status/:status)
  const handleStatusFilter = (status) => {
    setSelectedStatus(status);
  };

  const handleWithdrawalAction = async (withdrawalId, action, notes = '') => {
    try {
      setActionLoading(true);

      // Prevent actions on demo row
      const isMockData = withdrawals.some(
        (w) => w.id === withdrawalId && w.user?.name === 'Test User'
      );
      if (isMockData) {
        alert('This is test data. Please create a real withdrawal request first.');
        setShowActionModal(false);
        setAdminNotes('');
        return;
      }

      const token = localStorage.getItem('auth')
        ? JSON.parse(localStorage.getItem('auth')).accessToken
        : '';
      const headers = {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      };

      // Map UI actions to backend status API
      // Backend expects: PUT /api/withdrawals/{id}/status with body { status: 'SUCCESS' | 'FAILED', reason }
      const status = action === 'approve' ? 'SUCCESS' : action === 'reject' ? 'FAILED' : 'SUCCESS';
      const response = await fetch(`${WITHDRAWALS_API}/${withdrawalId}/status`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({ status, reason: notes || 'Admin action' }),
      });

      if (response.ok) {
        await response.json().catch(() => ({}));
        alert(`✅ ${action.charAt(0).toUpperCase() + action.slice(1)} successful!`);
        await fetchWithdrawals();
        await fetchStatistics();
        setShowActionModal(false);
        setAdminNotes('');
      } else {
        const err = await response.json().catch(() => ({}));
        alert(`Error: ${err.error || 'Action failed'}`);
      }
    } catch (error) {
      console.error('Error processing withdrawal:', error);
      alert('Error processing withdrawal');
    } finally {
      setActionLoading(false);
    }
  };

  const handleBulkAction = async (action) => {
    if (selectedWithdrawals.length === 0) return;
    const confirmed = window.confirm(
      `Are you sure you want to ${action.toLowerCase()} ${selectedWithdrawals.length} withdrawal(s)?`
    );
    if (!confirmed) return;

    try {
      setActionLoading(true);
      // Sequential to keep alerts sane; could be parallel with Promise.all if desired
      for (const id of selectedWithdrawals) {
        // eslint-disable-next-line no-await-in-loop
        await handleWithdrawalAction(id, action, 'Bulk action');
      }
      setSelectedWithdrawals([]);
    } catch (error) {
      console.error('Error processing bulk action:', error);
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'PENDING':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'APPROVED':
        return <CheckCircle className="w-4 h-4 text-blue-500" />;
      case 'PROCESSING':
        return <AlertCircle className="w-4 h-4 text-orange-500" />;
      case 'COMPLETED':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'REJECTED':
      case 'FAILED':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'CANCELLED':
        return <XCircle className="w-4 h-4 text-gray-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800';
      case 'APPROVED':
        return 'bg-blue-100 text-blue-800';
      case 'PROCESSING':
        return 'bg-orange-100 text-orange-800';
      case 'COMPLETED':
        return 'bg-green-100 text-green-800';
      case 'REJECTED':
      case 'FAILED':
        return 'bg-red-100 text-red-800';
      case 'CANCELLED':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Apply text & status filters client-side
  const filteredWithdrawals = withdrawals.filter((w) => {
    const q = searchTerm.toLowerCase();
    const matchesText =
      (w.user?.name || '').toLowerCase().includes(q) ||
      (w.user?.email || '').toLowerCase().includes(q) ||
      String(w.id).includes(searchTerm);

    const matchesStatus =
      selectedStatus === 'ALL'
        ? true
        : String(w.status).toUpperCase() === selectedStatus;

    return matchesText && matchesStatus;
  });

  const statusOptions = [
    { value: 'ALL', label: 'All Withdrawals', count: withdrawals.length },
    { value: 'PENDING', label: 'Pending', count: statistics.pendingCount || 0 },
    { value: 'APPROVED', label: 'Approved', count: statistics.approvedCount || 0 },
    { value: 'PROCESSING', label: 'Processing', count: statistics.processingCount || 0 }, // may be 0 if not provided
    { value: 'COMPLETED', label: 'Completed', count: statistics.completedCount || 0 },
    { value: 'REJECTED', label: 'Rejected', count: statistics.rejectedCount || 0 },
  ];

  // Error UI
  if (error) {
    return (
      <div className="p-6">
        <div className="rounded-lg p-4 border border-red-200 bg-red-50">
          <h3 className="text-lg font-medium text-red-800">Component Error</h3>
          <p className="text-red-700 mt-2">{error}</p>
          <button
            onClick={() => setError(null)}
            className="mt-3 px-4 py-2 rounded-md bg-red-600 text-white hover:bg-red-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 text-[rgb(var(--fg))]">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-[rgb(var(--fg))] mb-2">
          Withdrawal Management
        </h1>
        <p className="opacity-70">Manage user withdrawal requests and payments</p>
      </div>

      {/* API Status Check */}
      {withdrawals.length === 0 && !loading && (
        <div className="mb-6 p-4 rounded-lg border border-yellow-200 bg-yellow-50">
          <div className="flex items-center">
            <AlertCircle className="w-5 h-5 text-yellow-600 mr-2" />
            <div>
              <h3 className="text-sm font-medium text-yellow-800">
                API Not Available
              </h3>
              <p className="text-sm text-yellow-700 mt-1">
                The withdrawal API endpoints are not yet deployed or accessible.
                This is normal if the backend hasn&apos;t been deployed yet.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Demo warning */}
      {withdrawals.some((w) => w.user?.name === 'Test User') && (
        <div className="mb-6 p-4 rounded-lg border border-orange-200 bg-orange-50">
          <div className="flex items-center">
            <AlertCircle className="w-5 h-5 text-orange-600 mr-2" />
            <div>
              <h3 className="text-sm font-medium text-orange-800">⚠️ Demo Mode</h3>
              <p className="text-sm text-orange-700 mt-1">
                Showing test data. Create real withdrawal requests to test the
                approval workflow. Test data cannot be approved/rejected.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="rounded-lg p-6 shadow-sm border border-[rgb(var(--border))] bg-[rgb(var(--card))]">
          <div className="flex items-center">
            <div className="p-2 rounded-lg bg-blue-100">
              <DollarSign className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium opacity-70">Total Withdrawals</p>
              <p className="text-2xl font-bold text-[rgb(var(--fg))]">
                ₹{statistics.totalAmount || 0}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-lg p-6 shadow-sm border border-[rgb(var(--border))] bg-[rgb(var(--card))]">
          <div className="flex items-center">
            <div className="p-2 rounded-lg bg-yellow-100">
              <Clock className="w-6 h-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium opacity-70">Pending</p>
              <p className="text-2xl font-bold text-[rgb(var(--fg))]">
                {statistics.pendingCount || 0}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-lg p-6 shadow-sm border border-[rgb(var(--border))] bg-[rgb(var(--card))]">
          <div className="flex items-center">
            <div className="p-2 rounded-lg bg-green-100">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium opacity-70">Completed</p>
              <p className="text-2xl font-bold text-[rgb(var(--fg))]">
                {statistics.completedCount || 0}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-lg p-6 shadow-sm border border-[rgb(var(--border))] bg-[rgb(var(--card))]">
          <div className="flex items-center">
            <div className="p-2 rounded-lg bg-red-100">
              <XCircle className="w-6 h-6 text-red-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium opacity-70">Rejected</p>
              <p className="text-2xl font-bold text-[rgb(var(--fg))]">
                {statistics.rejectedCount || 0}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--card))] shadow-sm mb-6">
        <div className="p-6">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 opacity-50 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search by user name, email, or withdrawal ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 rounded-lg border border-[rgb(var(--border))] focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-[rgb(var(--card))] text-[rgb(var(--fg))]"
                />
              </div>
            </div>

            {/* Status Filter */}
            <div className="flex gap-2 flex-wrap">
              {statusOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => handleStatusFilter(option.value)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    selectedStatus === option.value
                      ? 'bg-blue-600 text-white'
                      : 'bg-[rgba(var(--fg),0.06)] hover:bg-[rgba(var(--fg),0.1)]'
                  }`}
                >
                  {option.label} ({option.count})
                </button>
              ))}
            </div>
          </div>

          {/* Bulk Actions */}
          {selectedWithdrawals.length > 0 && (
            <div className="mt-4 p-4 rounded-lg bg-[rgba(37,99,235,0.12)]">
              <div className="flex items-center justify-between">
                <span className="font-medium text-blue-700">
                  {selectedWithdrawals.length} withdrawal(s) selected
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleBulkAction('approve')}
                    disabled={actionLoading}
                    className="px-4 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700 disabled:opacity-50 flex items-center gap-2"
                  >
                    <Check className="w-4 h-4" />
                    Approve All
                  </button>
                  <button
                    onClick={() => handleBulkAction('reject')}
                    disabled={actionLoading}
                    className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 disabled:opacity-50 flex items-center gap-2"
                  >
                    <X className="w-4 h-4" />
                    Reject All
                  </button>
                  <button
                    onClick={() => setSelectedWithdrawals([])}
                    className="px-4 py-2 rounded-lg bg-gray-600 text-white hover:bg-gray-700"
                  >
                    Clear
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Withdrawals Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-[rgba(var(--fg),0.05)]">
              <tr>
                <th className="px-6 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={
                      selectedWithdrawals.length === filteredWithdrawals.length &&
                      filteredWithdrawals.length > 0
                    }
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedWithdrawals(filteredWithdrawals.map((w) => w.id));
                      } else {
                        setSelectedWithdrawals([]);
                      }
                    }}
                    className="rounded border-[rgb(var(--border))]"
                  />
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium opacity-70 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium opacity-70 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium opacity-70 uppercase tracking-wider">
                  Payment Method
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium opacity-70 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium opacity-70 uppercase tracking-wider">
                  Requested
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium opacity-70 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[rgb(var(--border))]">
              {loading ? (
                <tr>
                  <td colSpan="7" className="px-6 py-12 text-center opacity-70">
                    Loading withdrawals...
                  </td>
                </tr>
              ) : filteredWithdrawals.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-12 text-center opacity-70">
                    No withdrawals found
                  </td>
                </tr>
              ) : (
                filteredWithdrawals.map((withdrawal) => (
                  <tr key={withdrawal.id} className="hover:bg-[rgba(var(--fg),0.03)]">
                    <td className="px-6 py-4">
                      <input
                        type="checkbox"
                        checked={selectedWithdrawals.includes(withdrawal.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedWithdrawals([
                              ...selectedWithdrawals,
                              withdrawal.id,
                            ]);
                          } else {
                            setSelectedWithdrawals(
                              selectedWithdrawals.filter((id) => id !== withdrawal.id)
                            );
                          }
                        }}
                        className="rounded border-[rgb(var(--border))]"
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-[rgb(var(--fg))]">
                          {withdrawal.user?.name || 'Unknown User'}
                        </div>
                        <div className="text-sm opacity-70">
                          {withdrawal.user?.email || 'No email'}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-[rgb(var(--fg))]">
                        ₹{withdrawal.amount}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      
                      {withdrawal.description && (
                        <div className="text-sm opacity-70">
                          {withdrawal.description}
                        </div>
                      )}
                      {withdrawal.upiId && (
                        <div className="text-sm opacity-70">
                          UPI: {withdrawal.upiId}
                        </div>
                      )}
                      {withdrawal.accountNumber && (
                        <div className="text-sm opacity-70">
                          A/C: {withdrawal.accountNumber}
                        </div>
                      )}
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                          withdrawal.status
                        )}`}
                      >
                        {getStatusIcon(withdrawal.status)}
                        <span className="ml-1">{withdrawal.status}</span>
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm opacity-70">
                      {fmtDMY(withdrawal.createdAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            setSelectedWithdrawal(withdrawal);
                            setShowDetailsModal(true);
                          }}
                          className="text-blue-600 hover:text-blue-900"
                          title="View details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        {withdrawal.status === 'PENDING' && (
                          <>
                            <button
                              onClick={() => {
                                setSelectedWithdrawal(withdrawal);
                                setActionType('approve');
                                setShowActionModal(true);
                              }}
                              className="text-green-600 hover:text-green-900"
                              title="Approve"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => {
                                setSelectedWithdrawal(withdrawal);
                                setActionType('reject');
                                setShowActionModal(true);
                              }}
                              className="text-red-600 hover:text-red-900"
                              title="Reject"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </>
                        )}

                        {withdrawal.status === 'APPROVED' && (
                          <button
                            onClick={() => {
                              setSelectedWithdrawal(withdrawal);
                              setActionType('process');
                              setShowActionModal(true);
                            }}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            Process
                          </button>
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

      {/* Withdrawal Details Modal */}
      {showDetailsModal && selectedWithdrawal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto border border-[rgb(var(--border))] bg-[rgb(var(--card))]">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Withdrawal Details</h3>
              <button
                onClick={() => setShowDetailsModal(false)}
                className="opacity-60 hover:opacity-90"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium opacity-70">Withdrawal ID</label>
                  <p className="text-sm">#{selectedWithdrawal.id}</p>
                </div>
                <div>
                  <label className="text-sm font-medium opacity-70">Amount</label>
                  <p className="text-sm">₹{selectedWithdrawal.amount}</p>
                </div>
                <div>
                  <label className="text-sm font-medium opacity-70">Status</label>
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                      selectedWithdrawal.status
                    )}`}
                  >
                    {getStatusIcon(selectedWithdrawal.status)}
                    <span className="ml-1">{selectedWithdrawal.status}</span>
                  </span>
                </div>
                <div>
                  <label className="text-sm font-medium opacity-70">Payment Method</label>
                  <p className="text-sm">{selectedWithdrawal.paymentMethod || '—'}</p>
                </div>
              </div>

              {selectedWithdrawal.upiId && (
                <div>
                  <label className="text-sm font-medium opacity-70">UPI ID</label>
                  <p className="text-sm">{selectedWithdrawal.upiId}</p>
                </div>
              )}

              {selectedWithdrawal.accountNumber && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium opacity-70">Account Number</label>
                    <p className="text-sm">{selectedWithdrawal.accountNumber}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium opacity-70">IFSC Code</label>
                    <p className="text-sm">{selectedWithdrawal.ifscCode}</p>
                  </div>
                </div>
              )}

              {selectedWithdrawal.accountHolderName && (
                <div>
                  <label className="text-sm font-medium opacity-70">Account Holder</label>
                  <p className="text-sm">{selectedWithdrawal.accountHolderName}</p>
                </div>
              )}

              {selectedWithdrawal.bankName && (
                <div>
                  <label className="text-sm font-medium opacity-70">Bank Name</label>
                  <p className="text-sm">{selectedWithdrawal.bankName}</p>
                </div>
              )}

              {selectedWithdrawal.adminNotes && (
                <div>
                  <label className="text-sm font-medium opacity-70">Admin Notes</label>
                  <p className="text-sm">{selectedWithdrawal.adminNotes}</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium opacity-70">Requested At</label>
                  <p className="text-sm">{fmtDMY(selectedWithdrawal.createdAt)}</p>
                </div>
                {selectedWithdrawal.processedAt && (
                  <div>
                    <label className="text-sm font-medium opacity-70">Processed At</label>
                    <p className="text-sm">{fmtDMY(selectedWithdrawal.processedAt)}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Action Modal */}
      {showActionModal && selectedWithdrawal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="rounded-lg p-6 max-w-md w-full mx-4 border border-[rgb(var(--border))] bg-[rgb(var(--card))]">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">
                {actionType === 'approve'
                  ? 'Approve'
                  : actionType === 'reject'
                  ? 'Reject'
                  : 'Process'}{' '}
                Withdrawal
              </h3>
              <button
                onClick={() => setShowActionModal(false)}
                className="opacity-60 hover:opacity-90"
              >
                ✕
              </button>
            </div>

            <div className="mb-4">
              <p className="text-sm opacity-70 mb-2">
                Withdrawal #{selectedWithdrawal.id} - ₹{selectedWithdrawal.amount}
              </p>
              <p className="text-sm opacity-70">
                User: {selectedWithdrawal.user?.name} ({selectedWithdrawal.user?.email})
              </p>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium opacity-70 mb-2">
                Admin Notes
              </label>
              <textarea
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                className="w-full px-3 py-2 rounded-md border border-[rgb(var(--border))] focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-[rgb(var(--card))] text-[rgb(var(--fg))]"
                rows="3"
                placeholder="Add notes for this action..."
              />
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowActionModal(false)}
                className="px-4 py-2 rounded-md border border-[rgb(var(--border))] bg-[rgba(var(--fg),0.06)] hover:bg-[rgba(var(--fg),0.1)]"
              >
                Cancel
              </button>
              <button
                onClick={() =>
                  handleWithdrawalAction(selectedWithdrawal.id, actionType, adminNotes)
                }
                disabled={actionLoading}
                className={`px-4 py-2 text-white rounded-md hover:opacity-90 disabled:opacity-50 ${
                  actionType === 'approve'
                    ? 'bg-green-600'
                    : actionType === 'reject'
                    ? 'bg-red-600'
                    : 'bg-blue-600'
                }`}
              >
                {actionLoading
                  ? 'Processing...'
                  : actionType === 'approve'
                  ? 'Approve'
                  : actionType === 'reject'
                  ? 'Reject'
                  : 'Process'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Withdrawals;
