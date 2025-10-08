// src/pages/Commissions.jsx
import React, { useEffect, useState } from 'react';
import { Check, X, Clock, DollarSign, Users, TrendingUp } from 'lucide-react';

// Import API configuration
import { API_ENDPOINTS } from '../config/api';

const Card = ({ children, className = "" }) => (
  <div className={`rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-5 ${className}`}>{children}</div>
);

const Stat = ({ label, value, sub, icon: Icon, color = "text-blue-600" }) => (
  <Card>
    <div className="flex items-center justify-between">
      <div>
        <div className="text-sm opacity-80">{label}</div>
        <div className="text-2xl font-semibold">{value}</div>
        {sub && <div className="text-xs opacity-70 mt-1">{sub}</div>}
      </div>
      {Icon && <Icon className={`w-8 h-8 ${color}`} />}
    </div>
  </Card>
);

function StatusPill({ value, onClick }) {
  const key = String(value || "").toLowerCase();
  const color =
    key === "paid" ? "bg-green-600" :
    key === "pending" ? "bg-yellow-600" :
    key === "cancelled" ? "bg-red-600" :
    "bg-[rgba(var(--fg),0.4)]";
  
  return (
    <span 
      className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold text-white ${color} ${onClick ? 'cursor-pointer hover:opacity-80' : ''}`}
      onClick={onClick}
    >
      {value || "—"}
    </span>
  );
}

const fINR = (n) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 }).format(Number(n || 0));

const fDate = (iso) => (iso ? new Date(iso).toLocaleDateString("en-IN", { 
  dateStyle: "medium"
}) + " " + new Date(iso).toLocaleTimeString("en-IN", {
  timeStyle: "short"
}) : "—");

export default function Commissions() {
  const [dashboardData, setDashboardData] = useState(null);
  const [pendingCommissions, setPendingCommissions] = useState([]);
  const [paidCommissions, setPaidCommissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCommissions, setSelectedCommissions] = useState(new Set());
  const [bulkAction, setBulkAction] = useState('');
  const [confirmAction, setConfirmAction] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Load all commission data
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('auth') ? JSON.parse(localStorage.getItem('auth')).accessToken : '';
        const headers = { 'Authorization': `Bearer ${token}` };

        console.log('🔍 COMMISSIONS PAGE - Starting API calls...');
        console.log('🔑 Token:', token ? `${token.substring(0, 20)}...` : 'NO TOKEN');
        console.log('📡 Headers:', headers);

        // Fetch dashboard data
        console.log('📊 Fetching dashboard data from:', API_ENDPOINTS.COMMISSION_DASHBOARD);
        const dashboardRes = await fetch(API_ENDPOINTS.COMMISSION_DASHBOARD, { headers });
        console.log('📊 Dashboard Response Status:', dashboardRes.status);
        console.log('📊 Dashboard Response Headers:', Object.fromEntries(dashboardRes.headers.entries()));
        
        if (dashboardRes.ok) {
          const dashboardJson = await dashboardRes.json();
          console.log('✅ Dashboard Data Received:', dashboardJson);
          if (mounted) setDashboardData(dashboardJson);
        } else {
          console.log('❌ Dashboard API Failed:', dashboardRes.status, await dashboardRes.text());
        }

        // Fetch pending commissions
        console.log('⏳ Fetching pending commissions from:', API_ENDPOINTS.PENDING_COMMISSIONS);
        const pendingRes = await fetch(API_ENDPOINTS.PENDING_COMMISSIONS, { headers });
        console.log('⏳ Pending Response Status:', pendingRes.status);
        console.log('⏳ Pending Response Headers:', Object.fromEntries(pendingRes.headers.entries()));
        
        if (pendingRes.ok) {
          const pendingJson = await pendingRes.json();
          console.log('✅ Pending Data Received:', pendingJson);
          if (mounted) setPendingCommissions(Array.isArray(pendingJson) ? pendingJson : []);
        } else {
          console.log('❌ Pending API Failed:', pendingRes.status, await pendingRes.text());
        }

        // Fetch paid commissions
        console.log('✅ Fetching paid commissions from:', API_ENDPOINTS.PAID_COMMISSIONS);
        const paidRes = await fetch(API_ENDPOINTS.PAID_COMMISSIONS, { headers });
        console.log('✅ Paid Response Status:', paidRes.status);
        console.log('✅ Paid Response Headers:', Object.fromEntries(paidRes.headers.entries()));
        
        if (paidRes.ok) {
          const paidJson = await paidRes.json();
          console.log('✅ Paid Data Received:', paidJson);
          if (mounted) setPaidCommissions(Array.isArray(paidJson) ? paidJson : []);
        } else {
          console.log('❌ Paid API Failed:', paidRes.status, await paidRes.text());
        }

      } catch (e) {
        console.error('💥 Commissions Load Error:', e);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  // Confirmation function for single commission actions
  const confirmCommissionAction = (commission, action) => {
    const actionText = action === 'PAID' ? 'approve and pay' : 'cancel';
    const actionColor = action === 'PAID' ? 'green' : 'red';
    
    setConfirmAction({
      commission,
      action,
      message: `Are you sure you want to ${actionText} this commission?`,
      details: `Commission #${commission.id} - ${fINR(commission.commissionAmount)}`,
      actionColor
    });
  };

  // Execute confirmed single commission action
  const executeConfirmedAction = async () => {
    if (!confirmAction) return;
    
    const { commission, action } = confirmAction;
    await updateCommissionStatus(commission.id, action);
    setConfirmAction(null);
  };

  // Update single commission status
  const updateCommissionStatus = async (commissionId, newStatus) => {
    try {
      setActionLoading(true);
      const token = localStorage.getItem('auth') ? JSON.parse(localStorage.getItem('auth')).accessToken : '';
      
      console.log(`🔄 Updating commission ${commissionId} to ${newStatus}`);
      const response = await fetch(`${API_ENDPOINTS.UPDATE_COMMISSION}/${commissionId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      });

      if (response.ok) {
        console.log(`✅ Commission ${commissionId} updated to ${newStatus}`);
        // Update local state
        setPendingCommissions(prev => prev.filter(c => c.id !== commissionId));
        if (newStatus === 'PAID') {
          const commission = pendingCommissions.find(c => c.id === commissionId);
          if (commission) {
            setPaidCommissions(prev => [{ ...commission, commissionStatus: 'PAID' }, ...prev]);
          }
        }
        alert(`Commission ${newStatus.toLowerCase()} successfully!`);
      } else {
        const error = await response.json();
        console.error(`❌ Failed to update commission ${commissionId}:`, error);
        alert(`Error: ${error.error || 'Failed to update commission'}`);
      }
    } catch (error) {
      console.error('Error updating commission:', error);
      alert('Failed to update commission. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };

  // Confirm bulk action
  const confirmBulkAction = () => {
    if (selectedCommissions.size === 0 || !bulkAction) {
      alert('Please select commissions and choose an action.');
      return;
    }

    const actionText = bulkAction === 'PAID' ? 'approve and pay' : 'cancel';
    const totalAmount = pendingCommissions
      .filter(c => selectedCommissions.has(c.id))
      .reduce((sum, c) => sum + (c.commissionAmount || 0), 0);

    setConfirmAction({
      isBulk: true,
      action: bulkAction,
      message: `Are you sure you want to ${actionText} ${selectedCommissions.size} commissions?`,
      details: `Total amount: ${fINR(totalAmount)}`,
      actionColor: bulkAction === 'PAID' ? 'green' : 'red'
    });
  };

  // Execute confirmed bulk action
  const executeConfirmedBulkAction = async () => {
    if (!confirmAction || !confirmAction.isBulk) return;
    
    await handleBulkUpdate();
    setConfirmAction(null);
  };

  // Bulk update commissions
  const handleBulkUpdate = async () => {
    try {
      setActionLoading(true);
      const token = localStorage.getItem('auth') ? JSON.parse(localStorage.getItem('auth')).accessToken : '';
      
      console.log(`🔄 Bulk updating ${selectedCommissions.size} commissions to ${bulkAction}`);
      const response = await fetch(API_ENDPOINTS.BULK_UPDATE, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          commissionIds: Array.from(selectedCommissions),
          status: bulkAction
        })
      });

      if (response.ok) {
        const result = await response.json();
        console.log(`✅ Bulk update completed:`, result);
        alert(`Bulk update completed: ${result.successCount} successful, ${result.failureCount} failed`);
        
        // Clear selection and refresh data
        setSelectedCommissions(new Set());
        setBulkAction('');
        window.location.reload();
      } else {
        const error = await response.json();
        console.error(`❌ Bulk update failed:`, error);
        alert(`Error: ${error.error || 'Failed to update commissions'}`);
      }
    } catch (error) {
      console.error('Error in bulk update:', error);
      alert('Failed to update commissions. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };

  // Toggle commission selection
  const toggleCommission = (commissionId) => {
    setSelectedCommissions(prev => {
      const newSet = new Set(prev);
      if (newSet.has(commissionId)) {
        newSet.delete(commissionId);
      } else {
        newSet.add(commissionId);
      }
      return newSet;
    });
  };

  // Select all pending commissions
  const selectAllPending = () => {
    const allIds = pendingCommissions.map(c => c.id);
    setSelectedCommissions(new Set(allIds));
  };

  // Clear selection
  const clearSelection = () => {
    setSelectedCommissions(new Set());
  };

  if (loading) {
    return <Card className="p-4">Loading commission data…</Card>;
  }

  if (!dashboardData) {
    return (
      <Card className="p-4">
        <div className="font-semibold mb-1">Couldn't load commission data</div>
        <div className="text-sm opacity-70 mb-3">Please check your authentication and try again.</div>
        <button
          onClick={() => window.location.reload()}
          className="mt-2 px-3 py-2 rounded-lg border border-[rgb(var(--border))] hover:bg-[rgba(var(--fg),0.05)]"
        >
          Retry
        </button>
      </Card>
    );
  }

  return (
    <div className="space-y-6 text-[rgb(var(--fg))]">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Commission Management</h1>
        <div className="flex items-center gap-2">
          <span className="text-sm opacity-70">
            {selectedCommissions.size} selected
          </span>
          {selectedCommissions.size > 0 && (
            <button
              onClick={clearSelection}
              className="text-xs px-2 py-1 rounded border border-[rgb(var(--border))] hover:bg-[rgba(var(--fg),0.05)]"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Dashboard Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Stat 
          label="Total Pending" 
          value={fINR(dashboardData.totalPendingAmount || 0)} 
          sub={`${dashboardData.pendingCommissionsCount || 0} commissions`}
          icon={Clock}
          color="text-yellow-600"
        />
        <Stat 
          label="Total Paid" 
          value={fINR(dashboardData.totalPaidAmount || 0)} 
          sub={`${dashboardData.paidCommissionsCount || 0} commissions`}
          icon={DollarSign}
          color="text-green-600"
        />
        <Stat 
          label="Total Commissions" 
          value={dashboardData.totalCommissionsCount || 0} 
          sub="All time"
          icon={TrendingUp}
          color="text-blue-600"
        />
        <Stat 
          label="Active Users" 
          value={dashboardData.totalCommissionsCount || 0} 
          sub="With commissions"
          icon={Users}
          color="text-purple-600"
        />
      </div>

      {/* Bulk Actions */}
      {selectedCommissions.size > 0 && (
        <Card>
          <div className="flex items-center gap-4">
            <span className="font-medium">Bulk Actions:</span>
            <select
              value={bulkAction}
              onChange={(e) => setBulkAction(e.target.value)}
              className="px-3 py-2 rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--card))] text-[rgb(var(--fg))]"
            >
              <option value="">Select Action</option>
              <option value="PAID">Approve & Pay</option>
              <option value="CANCELLED">Cancel</option>
            </select>
            <button
              onClick={confirmBulkAction}
              disabled={!bulkAction || actionLoading}
              className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {actionLoading ? 'Processing...' : `Apply to ${selectedCommissions.size} commissions`}
            </button>
          </div>
        </Card>
      )}

      {/* Pending Commissions */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-semibold">Pending Commissions</h2>
            <p className="text-sm opacity-70">Awaiting approval</p>
          </div>
          {pendingCommissions.length > 0 && (
            <button
              onClick={selectAllPending}
              className="px-3 py-2 rounded-lg border border-[rgb(var(--border))] hover:bg-[rgba(var(--fg),0.05)]"
            >
              Select All ({pendingCommissions.length})
            </button>
          )}
        </div>

        {pendingCommissions.length === 0 ? (
          <div className="text-center py-8 text-sm opacity-70">
            No pending commissions
          </div>
        ) : (
          <div className="space-y-3">
            {pendingCommissions.map((commission) => (
              <div
                key={commission.id}
                className={`p-4 rounded-lg border transition-all ${
                  selectedCommissions.has(commission.id)
                    ? 'bg-[rgba(37,99,235,0.12)] border-[rgba(37,99,235,0.35)]'
                    : 'border-[rgb(var(--border))] hover:bg-[rgba(var(--fg),0.02)]'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={selectedCommissions.has(commission.id)}
                      onChange={() => toggleCommission(commission.id)}
                      className="w-4 h-4"
                    />
                    <div>
                      <div className="font-medium">
                        Commission #{commission.id}
                      </div>
                      <div className="text-sm opacity-70">
                        Referrer: User {commission.referrerUserId} → Referred: User {commission.referredUserId}
                      </div>
                      <div className="text-xs opacity-60">
                        Level {commission.referralLevel} • {commission.commissionPercentage}% • {fDate(commission.createdAt)}
                      </div>
                      {commission.order && (
                        <div className="text-xs opacity-60 mt-1">
                          Order: {commission.order.orderNumber || 'N/A'} • Amount: {fINR(commission.order.totalAmount || 0)}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <div className="font-semibold text-lg">
                        {fINR(commission.commissionAmount)}
                      </div>
                      <StatusPill value={commission.commissionStatus} />
                    </div>
                    
                    <div className="flex gap-2">
                      <button
                        onClick={() => confirmCommissionAction(commission, 'PAID')}
                        className="p-2 rounded-lg bg-[rgba(22,163,74,0.12)] text-green-700 hover:bg-[rgba(22,163,74,0.2)] transition-colors"
                        title="Approve & Pay"
                        disabled={actionLoading}
                      >
                        <Check size={16} />
                      </button>
                      <button
                        onClick={() => confirmCommissionAction(commission, 'CANCELLED')}
                        className="p-2 rounded-lg bg-[rgba(220,38,38,0.12)] text-red-700 hover:bg-[rgba(220,38,38,0.2)] transition-colors"
                        title="Cancel"
                        disabled={actionLoading}
                      >
                        <X size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Paid Commissions */}
      <Card>
        <div className="mb-4">
          <h2 className="text-xl font-semibold">Paid Commissions</h2>
          <p className="text-sm opacity-70">Recently approved commissions</p>
        </div>

        {paidCommissions.length === 0 ? (
          <div className="text-center py-8 text-sm opacity-70">
            No paid commissions yet
          </div>
        ) : (
          <div className="space-y-3">
            {paidCommissions.slice(0, 10).map((commission) => (
              <div
                key={commission.id}
                className="p-4 rounded-lg border border-[rgb(var(--border))] bg-[rgba(22,163,74,0.12)]"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">
                      Commission #{commission.id}
                    </div>
                    <div className="text-sm opacity-70">
                      Referrer: User {commission.referrerUserId} → Referred: User {commission.referredUserId}
                    </div>
                    <div className="text-xs opacity-60">
                      Level {commission.referralLevel} • {commission.commissionPercentage}% • {fDate(commission.createdAt)}
                    </div>
                    {commission.order && (
                      <div className="text-xs opacity-60 mt-1">
                        Order: {commission.order.orderNumber || 'N/A'} • Amount: {fINR(commission.order.totalAmount || 0)}
                      </div>
                    )}
                  </div>
                  
                  <div className="text-right">
                    <div className="font-semibold text-lg text-green-700">
                      {fINR(commission.commissionAmount)}
                    </div>
                    <StatusPill value={commission.commissionStatus} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Confirmation Modal */}
      {confirmAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.5)" }}>
          <div className="relative w-[min(400px,90vw)] rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-6 shadow-2xl">
            <div className="text-center">
              <div className="mb-4 text-2xl">
                {confirmAction.action === 'PAID' ? '✅' : '❌'}
              </div>
              <h3 className="mb-4 text-xl font-semibold">
                {confirmAction.isBulk ? 'Confirm Bulk Action' : 'Confirm Commission Action'}
              </h3>
              <p className="mb-2 text-[rgba(var(--fg),0.7)]">{confirmAction.message}</p>
              <p className="mb-6 text-sm font-medium text-[rgb(var(--fg))]">{confirmAction.details}</p>
              
              <div className="flex gap-3 justify-center">
                <button
                  onClick={() => setConfirmAction(null)}
                  className="px-6 py-2 rounded-lg border border-[rgb(var(--border))] bg-[rgba(var(--fg),0.12)] hover:bg-[rgba(var(--fg),0.18)] text-[rgb(var(--fg))] transition-colors"
                  disabled={actionLoading}
                >
                  Cancel
                </button>
                <button
                  onClick={confirmAction.isBulk ? executeConfirmedBulkAction : executeConfirmedAction}
                  className={`px-6 py-2 rounded-lg text-white transition-colors ${
                    confirmAction.actionColor === 'green' 
                      ? 'bg-green-600 hover:bg-green-700' 
                      : 'bg-red-600 hover:bg-red-700'
                  }`}
                  disabled={actionLoading}
                >
                  {actionLoading ? 'Processing...' : 
                   confirmAction.action === 'PAID' ? 
                     (confirmAction.isBulk ? 'Approve & Pay All' : 'Approve & Pay') : 
                     (confirmAction.isBulk ? 'Cancel All' : 'Cancel Commission')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
