// src/pages/Commissions.jsx
import React, { useEffect, useMemo, useState } from 'react';
import Pagination from '../components/Pagination';
import { SkeletonCommissionsPage } from '../components/SkeletonLoader';
import ExportButton from '../components/ExportButton';
import EnhancedExportButton from '../components/EnhancedExportButton';
import ResponsiveTable from '../components/ResponsiveTable';
import { CommissionActions } from '../components/TableActions';
import { Check, X, Clock, IndianRupee, Users, TrendingUp } from 'lucide-react';

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
  timeZone: "Asia/Kolkata",
  dateStyle: "medium"
}) + " " + new Date(iso).toLocaleTimeString("en-IN", {
  timeZone: "Asia/Kolkata",
  timeStyle: "short"
}) : "—");

export default function Commissions() {
  const [dashboardData, setDashboardData] = useState(null);
  const [pendingCommissions, setPendingCommissions] = useState([]);
  const [paidCommissions, setPaidCommissions] = useState([]);
  const [loading, setLoading] = useState({
    dashboard: true,
    pending: true,
    paid: true
  });
  const [selectedCommissions, setSelectedCommissions] = useState(new Set());
  const [bulkAction, setBulkAction] = useState('');
  const [confirmAction, setConfirmAction] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [q, setQ] = useState('');
  const [paidSearchQuery, setPaidSearchQuery] = useState('');

  // Pending list pagination + filtering
  const [pendingPage, setPendingPage] = useState(1);
  const [pendingPageSize, setPendingPageSize] = useState(20);
  const filteredPending = useMemo(() => {
    return pendingCommissions.filter((c) => {
      if (!q.trim()) return true;
      const hay = `${c.id} ${c.referrerUserId} ${c.referredUserId}`.toLowerCase();
      return hay.includes(q.toLowerCase());
    });
  }, [pendingCommissions, q]);
  useEffect(() => { setPendingPage(1); }, [q, pendingCommissions.length]);
  const pendingPaged = useMemo(() => {
    const start = (pendingPage - 1) * pendingPageSize;
    return filteredPending.slice(start, start + pendingPageSize);
  }, [filteredPending, pendingPage, pendingPageSize]);

  // Paid list pagination + filtering
  const [paidPage, setPaidPage] = useState(1);
  const [paidPageSize, setPaidPageSize] = useState(20);
  const filteredPaid = useMemo(() => {
    return paidCommissions.filter((c) => {
      if (!paidSearchQuery.trim()) return true;
      const hay = `${c.id} ${c.referrerUserId} ${c.referredUserId}`.toLowerCase();
      return hay.includes(paidSearchQuery.toLowerCase());
    });
  }, [paidCommissions, paidSearchQuery]);
  
  const paidPaged = useMemo(() => {
    const start = (paidPage - 1) * paidPageSize;
    return filteredPaid.slice(start, start + paidPageSize);
  }, [filteredPaid, paidPage, paidPageSize]);

  // ⚡ PROGRESSIVE LOADING - Load all commission data in parallel
  useEffect(() => {
    let mounted = true;
    const token = localStorage.getItem('auth') ? JSON.parse(localStorage.getItem('auth')).accessToken : '';
    const headers = { 'Authorization': `Bearer ${token}` };

    console.log('🔍 COMMISSIONS PAGE - Starting parallel API calls...');

    // Load dashboard data
    (async () => {
      try {
        console.log('📊 Fetching dashboard data from:', API_ENDPOINTS.COMMISSION_DASHBOARD);
        const dashboardRes = await fetch(API_ENDPOINTS.COMMISSION_DASHBOARD, { headers });
        console.log('📊 Dashboard Response Status:', dashboardRes.status);
        
        if (mounted && dashboardRes.ok) {
          const dashboardJson = await dashboardRes.json();
          console.log('✅ Dashboard Data Received:', dashboardJson);
          setDashboardData(dashboardJson);
        }
      } catch (e) {
        console.error('💥 Dashboard Load Error:', e);
      } finally {
        if (mounted) setLoading(prev => ({ ...prev, dashboard: false }));
      }
    })();

    // Load pending commissions
    (async () => {
      try {
        console.log('⏳ Fetching pending commissions from:', API_ENDPOINTS.PENDING_COMMISSIONS);
        const pendingRes = await fetch(API_ENDPOINTS.PENDING_COMMISSIONS, { headers });
        console.log('⏳ Pending Response Status:', pendingRes.status);
        
        if (mounted && pendingRes.ok) {
          const pendingJson = await pendingRes.json();
          console.log('✅ Pending Data Received:', pendingJson);
          const pendingData = Array.isArray(pendingJson) ? pendingJson : [];
          // Sort by createdAt in descending order (latest first)
          pendingData.sort((a, b) => {
            const dateA = new Date(a.createdAt || 0);
            const dateB = new Date(b.createdAt || 0);
            return dateB - dateA;
          });
          setPendingCommissions(pendingData);
        }
      } catch (e) {
        console.error('💥 Pending Load Error:', e);
      } finally {
        if (mounted) setLoading(prev => ({ ...prev, pending: false }));
      }
    })();

    // Load paid commissions
    (async () => {
      try {
        console.log('✅ Fetching paid commissions from:', API_ENDPOINTS.PAID_COMMISSIONS);
        const paidRes = await fetch(API_ENDPOINTS.PAID_COMMISSIONS, { headers });
        console.log('✅ Paid Response Status:', paidRes.status);
        
        if (mounted && paidRes.ok) {
          const paidJson = await paidRes.json();
          console.log('✅ Paid Data Received:', paidJson);
          const paidData = Array.isArray(paidJson) ? paidJson : [];
          // Sort by createdAt in descending order (latest first)
          paidData.sort((a, b) => {
            const dateA = new Date(a.createdAt || 0);
            const dateB = new Date(b.createdAt || 0);
            return dateB - dateA;
          });
          setPaidCommissions(paidData);
        }
      } catch (e) {
        console.error('💥 Paid Load Error:', e);
      } finally {
        if (mounted) setLoading(prev => ({ ...prev, paid: false }));
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

  // Show structure immediately with progressive loading
  const isLoading = loading.dashboard || loading.pending || loading.paid;

  return (
    <div className="space-y-6 text-[rgb(var(--fg))]">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Commission Management</h1>
        <div className="flex items-center gap-3">
          <EnhancedExportButton
            data={[...filteredPending, ...filteredPaid]}
            dataType="commissions"
            filename="commissions"
            currentFilters={{
              pendingSearch: q,
              paidSearch: paidSearchQuery
            }}
            currentSort={null}
            showAdvancedOptions={true}
            defaultFormat="excel"
            isDataPreFiltered={true}
            totalRecords={pendingCommissions.length + paidCommissions.length}
          />
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
      </div>

      {/* Dashboard Stats - Show skeleton while loading */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {loading.dashboard || !dashboardData ? (
          // Skeleton stats
          <>
            {[1, 2, 3, 4].map(i => (
              <Card key={i}>
                <div className="animate-pulse space-y-2">
                  <div className="h-4 bg-[rgba(var(--fg),0.1)] rounded w-1/2"></div>
                  <div className="h-6 bg-[rgba(var(--fg),0.1)] rounded w-2/3"></div>
                  <div className="h-3 bg-[rgba(var(--fg),0.1)] rounded w-1/3"></div>
                </div>
              </Card>
            ))}
          </>
        ) : (
          <>
            <Stat 
              label="Total Pending" 
              value={fINR(dashboardData.totalPendingAmount || 0)} 
              sub={`${dashboardData.pendingCommissions || 0} commissions`}
              icon={Clock}
              color="text-yellow-600"
            />
            <Stat 
              label="Total Paid" 
              value={fINR(dashboardData.totalPaidAmount || 0)} 
              sub={`${dashboardData.paidCommissions || 0} commissions`}
              icon={IndianRupee}
              color="text-green-600"
            />
            <Stat 
              label="Total Commissions" 
              value={dashboardData.paidCommissions || 0} 
              sub="All time"
              icon={TrendingUp}
              color="text-blue-600"
            />
            <Stat 
              label="Active Users" 
              value={dashboardData.activeUsers || 0} 
              sub="With commissions"
              icon={Users}
              color="text-purple-600"
            />
          </>
        )}
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
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold">Pending Commissions</h2>
            <p className="text-sm opacity-70">Awaiting approval</p>
          </div>
        </div>

        <ResponsiveTable
          columns={[
            {
              key: 'id',
              title: 'Commission',
              sortable: true,
              render: (value, commission) => (
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                    <Clock className="h-4 w-4 text-orange-600" />
                  </div>
                  <div>
                    <div className="font-medium">Commission #{commission.id}</div>
                    <div className="text-sm text-gray-500">
                      Level {commission.referralLevel} • {commission.commissionPercentage}%
                    </div>
                  </div>
                </div>
              )
            },
            {
              key: 'referrerUserId',
              title: 'Referrer',
              sortable: true,
              render: (value, commission) => (
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <Users className="h-4 w-4 text-blue-600" />
                  </div>
                  <div>
                    <div className="font-medium">User {commission.referrerUserId}</div>
                    <div className="text-sm text-gray-500">Referrer</div>
                  </div>
                </div>
              )
            },
            {
              key: 'referredUserId',
              title: 'Referred',
              sortable: true,
              render: (value, commission) => (
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                    <Users className="h-4 w-4 text-green-600" />
                  </div>
                  <div>
                    <div className="font-medium">User {commission.referredUserId}</div>
                    <div className="text-sm text-gray-500">Referred</div>
                  </div>
                </div>
              )
            },
            {
              key: 'commissionAmount',
              title: 'Amount',
              sortable: true,
              render: (value, commission) => (
                <div className="flex items-center gap-2">
                  <IndianRupee className="h-4 w-4 text-green-600" />
                  <span className="font-semibold text-lg">
                    {fINR(commission.commissionAmount)}
                  </span>
                </div>
              )
            },
            {
              key: 'order',
              title: 'Order Info',
              sortable: false,
              render: (value, commission) => (
                commission.order ? (
                  <div>
                    <div className="font-medium">{commission.order.orderNumber || 'N/A'}</div>
                    <div className="text-sm text-gray-500">{fINR(commission.order.totalAmount || 0)}</div>
                  </div>
                ) : (
                  <span className="text-gray-500">No order</span>
                )
              )
            },
            {
              key: 'createdAt',
              title: 'Date',
              sortable: true,
              render: (value) => (
                <div className="text-sm opacity-80">
                  {fDate(value)}
                </div>
              )
            }
          ]}
          data={pendingPaged}
          loading={loading.pending}
          emptyMessage="No pending commissions"
          searchable={false}
          filterable={false}
          selectable={true}
          bulkActions={[
            { key: 'approve', label: 'Approve & Pay Selected' },
            { key: 'cancel', label: 'Cancel Selected' },
            { key: 'export', label: 'Export Selected' }
          ]}
          onBulkAction={(action, selectedIds) => {
            const selectedCommissions = selectedIds.map(id => pendingCommissions.find(commission => commission.id === id)).filter(Boolean);
            
            switch (action) {
              case 'approve':
                selectedCommissions.forEach(commission => {
                  confirmCommissionAction(commission, 'PAID');
                });
                break;
              case 'cancel':
                selectedCommissions.forEach(commission => {
                  confirmCommissionAction(commission, 'CANCELLED');
                });
                break;
              case 'export':
                // Export selected commissions
                break;
            }
          }}
          selectedRows={selectedCommissions}
          onRowSelect={(id) => toggleCommission(id)}
          cardView={true}
          stickyHeader={true}
          actions={(commission) => (
            <CommissionActions
              commission={commission}
              onApprove={(commission) => confirmCommissionAction(commission, 'PAID')}
              onCancel={(commission) => confirmCommissionAction(commission, 'CANCELLED')}
              onView={(commission) => {/* View details */}}
            />
          )}
          pagination={{
            currentPage: pendingPage,
            totalPages: Math.ceil(filteredPending.length / pendingPageSize),
            start: (pendingPage - 1) * pendingPageSize + 1,
            end: Math.min(pendingPage * pendingPageSize, filteredPending.length),
            total: filteredPending.length,
            hasPrevious: pendingPage > 1,
            hasNext: pendingPage < Math.ceil(filteredPending.length / pendingPageSize),
            onPrevious: () => setPendingPage(pendingPage - 1),
            onNext: () => setPendingPage(pendingPage + 1)
          }}
        />
      </div>

      {/* Paid Commissions */}
      <Card>
        <div className="mb-4">
          <h2 className="text-xl font-semibold">Paid Commissions</h2>
          <p className="text-sm opacity-70">Recently approved commissions</p>
        </div>

        {/* Paid Commissions Search */}
        <div className="mb-4">
          <input
            type="text"
            placeholder="Search referrer/referred/commission ID..."
            value={paidSearchQuery}
            onChange={(e) => {
              setPaidSearchQuery(e.target.value);
              setPaidPage(1); // Reset to first page when searching
            }}
            className="w-full px-3 py-2 rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--card))] text-[rgb(var(--fg))] placeholder-[rgba(var(--fg),0.5)] focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {filteredPaid.length === 0 ? (
          <div className="text-center py-8 text-sm opacity-70">
            {paidCommissions.length === 0 ? 'No paid commissions yet' : 'No commissions match your search'}
          </div>
        ) : (
          <>
          <div className="space-y-3">
            {paidPaged.map((commission) => (
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
          <Pagination
            page={paidPage}
            pageSize={paidPageSize}
            total={filteredPaid.length}
            onPageChange={setPaidPage}
            onPageSizeChange={(n) => { setPaidPageSize(n); setPaidPage(1); }}
          />
          </>
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
