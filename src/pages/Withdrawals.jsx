import React, { useState, useEffect } from 'react';
import { API_ENDPOINTS } from '../config/api';
import { useAuth } from '../context/AuthContext';
import { 
  Users, 
  DollarSign, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  Filter,
  Search,
  Download,
  Eye,
  Check,
  X
} from 'lucide-react';

const Withdrawals = () => {
  const { authFetch } = useAuth();
  const [withdrawals, setWithdrawals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedWithdrawals, setSelectedWithdrawals] = useState([]);
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [statistics, setStatistics] = useState({});
  const [selectedWithdrawal, setSelectedWithdrawal] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showActionModal, setShowActionModal] = useState(false);
  const [actionType, setActionType] = useState('');
  const [adminNotes, setAdminNotes] = useState('');
  const [error, setError] = useState(null);

  // Error boundary effect
  useEffect(() => {
    const handleError = (error) => {
      console.error('Withdrawals component error:', error);
      setError(error.message);
    };

    window.addEventListener('error', handleError);
    return () => window.removeEventListener('error', handleError);
  }, []);

  // API endpoints
  const WITHDRAWALS_API = API_ENDPOINTS.WITHDRAWALS;
  const STATISTICS_API = API_ENDPOINTS.WITHDRAWALS + '/statistics';

  useEffect(() => {
    console.log('Withdrawals component mounted');
    fetchWithdrawals();
    fetchStatistics();
  }, []);

  // Debug log for component state
  useEffect(() => {
    console.log('Withdrawals state updated:', { 
      loading, 
      withdrawalsCount: withdrawals.length, 
      statistics 
    });
  }, [loading, withdrawals, statistics]);

  const fetchWithdrawals = async () => {
    try {
      setLoading(true);
      console.log('Fetching withdrawals from:', WITHDRAWALS_API);
      const response = await authFetch('/api/withdrawals');
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const responseData = await response.json();
      console.log('Withdrawals data received:', responseData);
      
      // Extract withdrawals array from response
      const withdrawalsData = responseData.withdrawals || responseData;
      setWithdrawals(Array.isArray(withdrawalsData) ? withdrawalsData : []);
    } catch (error) {
      console.error('Error fetching withdrawals:', error);
      // Set mock data for testing when API is not available
      setWithdrawals([
        {
          id: 1,
          user: { name: 'Test User', email: 'test@example.com' },
          amount: 1000,
          paymentMethod: 'UPI',
          upiId: 'test@upi',
          status: 'PENDING',
          createdAt: new Date().toISOString()
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const fetchStatistics = async () => {
    try {
      console.log('Fetching statistics from:', STATISTICS_API);
      const response = await authFetch('/api/withdrawals/statistics');
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Statistics data received:', data);
      setStatistics(data || {});
    } catch (error) {
      console.error('Error fetching statistics:', error);
      // Set mock statistics for testing when API is not available
      setStatistics({
        totalAmount: 1000,
        pendingCount: 1,
        completedCount: 0,
        rejectedCount: 0
      });
    }
  };

  const handleStatusFilter = async (status) => {
    try {
      setLoading(true);
      let url = '/api/withdrawals';
      if (status !== 'ALL') {
        url = `/api/withdrawals?status=${status}`;
      }
      
      console.log('Filtering withdrawals with URL:', url);
      const response = await authFetch(url);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Filtered withdrawals data:', data);
      const withdrawalsData = data.withdrawals || data;
      setWithdrawals(Array.isArray(withdrawalsData) ? withdrawalsData : []);
      setSelectedStatus(status);
    } catch (error) {
      console.error('Error filtering withdrawals:', error);
      setWithdrawals([]); // Set empty array on error
    } finally {
      setLoading(false);
    }
  };

  const handleWithdrawalAction = async (withdrawalId, action, notes = '') => {
    try {
      setActionLoading(true);
      
      // Check if this is mock data
      const isMockData = withdrawals.some(w => w.id === withdrawalId && w.user?.name === 'Test User');
      if (isMockData) {
        alert('This is test data. Please create a real withdrawal request first.');
        setShowActionModal(false);
        setAdminNotes('');
        return;
      }
      
      const response = await authFetch(`/api/withdrawals/${withdrawalId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: action.toUpperCase(),
          reason: notes
        }),
      });

      if (response.ok) {
        const result = await response.json();
        alert(`✅ ${action.charAt(0).toUpperCase() + action.slice(1)} successful!`);
        await fetchWithdrawals();
        await fetchStatistics();
        setShowActionModal(false);
        setAdminNotes('');
      } else {
        const error = await response.json();
        alert(`Error: ${error.error || 'Action failed'}`);
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
      const promises = selectedWithdrawals.map(id => 
        handleWithdrawalAction(id, action, 'Bulk action')
      );
      await Promise.all(promises);
      setSelectedWithdrawals([]);
      setShowBulkActions(false);
    } catch (error) {
      console.error('Error processing bulk action:', error);
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'PENDING': return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'APPROVED': return <CheckCircle className="w-4 h-4 text-blue-500" />;
      case 'PROCESSING': return <AlertCircle className="w-4 h-4 text-orange-500" />;
      case 'COMPLETED': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'REJECTED': return <XCircle className="w-4 h-4 text-red-500" />;
      case 'FAILED': return <XCircle className="w-4 h-4 text-red-500" />;
      case 'CANCELLED': return <XCircle className="w-4 h-4 text-gray-500" />;
      default: return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'PENDING': return 'bg-yellow-100 text-yellow-800';
      case 'APPROVED': return 'bg-blue-100 text-blue-800';
      case 'PROCESSING': return 'bg-orange-100 text-orange-800';
      case 'COMPLETED': return 'bg-green-100 text-green-800';
      case 'REJECTED': return 'bg-red-100 text-red-800';
      case 'FAILED': return 'bg-red-100 text-red-800';
      case 'CANCELLED': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredWithdrawals = withdrawals.filter(withdrawal => {
    const matchesSearch = withdrawal.user?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         withdrawal.user?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         withdrawal.id.toString().includes(searchTerm);
    return matchesSearch;
  });

  const statusOptions = [
    { value: 'ALL', label: 'All Withdrawals', count: withdrawals.length },
    { value: 'PENDING', label: 'Pending', count: statistics.pendingCount || 0 },
    { value: 'APPROVED', label: 'Approved', count: statistics.approvedCount || 0 },
    { value: 'PROCESSING', label: 'Processing', count: statistics.processingCount || 0 },
    { value: 'COMPLETED', label: 'Completed', count: statistics.completedCount || 0 },
    { value: 'REJECTED', label: 'Rejected', count: statistics.rejectedCount || 0 },
  ];

  // Show error if component crashed
  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h3 className="text-lg font-medium text-red-800">Component Error</h3>
          <p className="text-red-700 mt-2">{error}</p>
          <button 
            onClick={() => setError(null)}
            className="mt-3 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Withdrawal Management</h1>
        <p className="text-gray-600">Manage user withdrawal requests and payments</p>
      </div>

      {/* API Status Check */}
      {withdrawals.length === 0 && !loading && (
        <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-center">
            <AlertCircle className="w-5 h-5 text-yellow-600 mr-2" />
            <div>
              <h3 className="text-sm font-medium text-yellow-800">API Not Available</h3>
              <p className="text-sm text-yellow-700 mt-1">
                The withdrawal API endpoints are not yet deployed or accessible. 
                This is normal if the backend hasn't been deployed yet.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Mock data warning */}
      {withdrawals.some(w => w.user?.name === 'Test User') && (
        <div className="mb-6 p-4 bg-orange-50 border border-orange-200 rounded-lg">
          <div className="flex items-center">
            <AlertCircle className="w-5 h-5 text-orange-600 mr-2" />
            <div>
              <h3 className="text-sm font-medium text-orange-800">⚠️ Demo Mode</h3>
              <p className="text-sm text-orange-700 mt-1">
                Showing test data. Create real withdrawal requests to test the approval workflow.
                Test data cannot be approved/rejected.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <DollarSign className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Withdrawals</p>
              <p className="text-2xl font-bold text-gray-900">
                ₹{statistics.totalAmount || 0}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Clock className="w-6 h-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Pending</p>
              <p className="text-2xl font-bold text-gray-900">
                {statistics.pendingCount || 0}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Completed</p>
              <p className="text-2xl font-bold text-gray-900">
                {statistics.completedCount || 0}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className="p-2 bg-red-100 rounded-lg">
              <XCircle className="w-6 h-6 text-red-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Rejected</p>
              <p className="text-2xl font-bold text-gray-900">
                {statistics.rejectedCount || 0}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white p-6 rounded-lg shadow-sm border mb-6">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search by user name, email, or withdrawal ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {option.label} ({option.count})
              </button>
            ))}
          </div>
        </div>

        {/* Bulk Actions */}
        {selectedWithdrawals.length > 0 && (
          <div className="mt-4 p-4 bg-blue-50 rounded-lg">
            <div className="flex items-center justify-between">
              <span className="text-blue-700 font-medium">
                {selectedWithdrawals.length} withdrawal(s) selected
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => handleBulkAction('approve')}
                  disabled={actionLoading}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center gap-2"
                >
                  <Check className="w-4 h-4" />
                  Approve All
                </button>
                <button
                  onClick={() => handleBulkAction('reject')}
                  disabled={actionLoading}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 flex items-center gap-2"
                >
                  <X className="w-4 h-4" />
                  Reject All
                </button>
                <button
                  onClick={() => setSelectedWithdrawals([])}
                  className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
                >
                  Clear
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Withdrawals Table */}
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={selectedWithdrawals.length === filteredWithdrawals.length && filteredWithdrawals.length > 0}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedWithdrawals(filteredWithdrawals.map(w => w.id));
                      } else {
                        setSelectedWithdrawals([]);
                      }
                    }}
                    className="rounded border-gray-300"
                  />
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Payment Method
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Requested
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan="7" className="px-6 py-12 text-center text-gray-500">
                    Loading withdrawals...
                  </td>
                </tr>
              ) : filteredWithdrawals.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-12 text-center text-gray-500">
                    No withdrawals found
                  </td>
                </tr>
              ) : (
                filteredWithdrawals.map((withdrawal) => (
                  <tr key={withdrawal.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <input
                        type="checkbox"
                        checked={selectedWithdrawals.includes(withdrawal.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedWithdrawals([...selectedWithdrawals, withdrawal.id]);
                          } else {
                            setSelectedWithdrawals(selectedWithdrawals.filter(id => id !== withdrawal.id));
                          }
                        }}
                        className="rounded border-gray-300"
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {withdrawal.user?.name || 'Unknown User'}
                        </div>
                        <div className="text-sm text-gray-500">
                          {withdrawal.user?.email || 'No email'}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        ₹{withdrawal.amount}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {withdrawal.paymentMethod}
                      </div>
                      {withdrawal.upiId && (
                        <div className="text-sm text-gray-500">
                          UPI: {withdrawal.upiId}
                        </div>
                      )}
                      {withdrawal.accountNumber && (
                        <div className="text-sm text-gray-500">
                          A/C: {withdrawal.accountNumber}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(withdrawal.status)}`}>
                        {getStatusIcon(withdrawal.status)}
                        <span className="ml-1">{withdrawal.status}</span>
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(withdrawal.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            setSelectedWithdrawal(withdrawal);
                            setShowDetailsModal(true);
                          }}
                          className="text-blue-600 hover:text-blue-900"
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
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Withdrawal Details</h3>
              <button
                onClick={() => setShowDetailsModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Withdrawal ID</label>
                  <p className="text-sm text-gray-900">#{selectedWithdrawal.id}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Amount</label>
                  <p className="text-sm text-gray-900">₹{selectedWithdrawal.amount}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Status</label>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(selectedWithdrawal.status)}`}>
                    {getStatusIcon(selectedWithdrawal.status)}
                    <span className="ml-1">{selectedWithdrawal.status}</span>
                  </span>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Payment Method</label>
                  <p className="text-sm text-gray-900">{selectedWithdrawal.paymentMethod}</p>
                </div>
              </div>
              
              {selectedWithdrawal.upiId && (
                <div>
                  <label className="text-sm font-medium text-gray-500">UPI ID</label>
                  <p className="text-sm text-gray-900">{selectedWithdrawal.upiId}</p>
                </div>
              )}
              
              {selectedWithdrawal.accountNumber && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Account Number</label>
                    <p className="text-sm text-gray-900">{selectedWithdrawal.accountNumber}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">IFSC Code</label>
                    <p className="text-sm text-gray-900">{selectedWithdrawal.ifscCode}</p>
                  </div>
                </div>
              )}
              
              {selectedWithdrawal.accountHolderName && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Account Holder</label>
                  <p className="text-sm text-gray-900">{selectedWithdrawal.accountHolderName}</p>
                </div>
              )}
              
              {selectedWithdrawal.bankName && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Bank Name</label>
                  <p className="text-sm text-gray-900">{selectedWithdrawal.bankName}</p>
                </div>
              )}
              
              {selectedWithdrawal.adminNotes && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Admin Notes</label>
                  <p className="text-sm text-gray-900">{selectedWithdrawal.adminNotes}</p>
                </div>
              )}
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Requested At</label>
                  <p className="text-sm text-gray-900">
                    {new Date(selectedWithdrawal.createdAt).toLocaleString()}
                  </p>
                </div>
                {selectedWithdrawal.processedAt && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Processed At</label>
                    <p className="text-sm text-gray-900">
                      {new Date(selectedWithdrawal.processedAt).toLocaleString()}
                    </p>
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
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">
                {actionType === 'approve' ? 'Approve' : actionType === 'reject' ? 'Reject' : 'Process'} Withdrawal
              </h3>
              <button
                onClick={() => setShowActionModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            
            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-2">
                Withdrawal #{selectedWithdrawal.id} - ₹{selectedWithdrawal.amount}
              </p>
              <p className="text-sm text-gray-600">
                User: {selectedWithdrawal.user?.name} ({selectedWithdrawal.user?.email})
              </p>
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Admin Notes
              </label>
              <textarea
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows="3"
                placeholder="Add notes for this action..."
              />
            </div>
            
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowActionModal(false)}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={() => handleWithdrawalAction(selectedWithdrawal.id, actionType, adminNotes)}
                disabled={actionLoading}
                className={`px-4 py-2 text-white rounded-md hover:opacity-90 disabled:opacity-50 ${
                  actionType === 'approve' ? 'bg-green-600' : 
                  actionType === 'reject' ? 'bg-red-600' : 'bg-blue-600'
                }`}
              >
                {actionLoading ? 'Processing...' : 
                 actionType === 'approve' ? 'Approve' : 
                 actionType === 'reject' ? 'Reject' : 'Process'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Withdrawals;
