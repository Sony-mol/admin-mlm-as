import React, { useEffect, useMemo, useState } from "react";
import Pagination from '../components/Pagination';
import { SkeletonPaymentsPage } from '../components/SkeletonLoader';
import ExportButton from '../components/ExportButton';
import EnhancedExportButton from '../components/EnhancedExportButton';
import ResponsiveTable from '../components/ResponsiveTable';
import { PaymentActions } from '../components/TableActions';
import { CreditCard, User, IndianRupee } from 'lucide-react';

// Import API configuration
import { API_ENDPOINTS } from '../config/api';

// Import shared OrderModal component
import OrderModal from '../components/OrderModal';

/* ---------- helpers ---------- */
const tierAttr = (t='') => String(t||'').toLowerCase();

const Card = ({ children, className = "" }) => (
  <div className={`rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-5 ${className}`}>{children}</div>
);

const Stat = ({ label, value, sub }) => (
  <Card>
    <div>
      <div className="text-sm opacity-80">{label}</div>
      <div className="text-2xl font-semibold">{value}</div>
      {sub && <div className="text-xs opacity-70 mt-1">{sub}</div>}
    </div>
  </Card>
);

function StatusPill({ value }) {
  const key = String(value || "").toLowerCase();
  const color =
    key === "shipped" ? "bg-teal-500" :
    key === "delivered" || key === "approved" ? "bg-violet-600" :
    key === "completed" ? "bg-emerald-500" :
    key === "pending" || key === "processing" ? "bg-amber-500" :
    key === "active" ? "bg-emerald-500" :
    key === "failed" || key === "suspended" || key === "cancelled" || key === "canceled" || key === "rejected" ? "bg-red-500" :
    "bg-slate-400";
  return (
    <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold text-white ${color}`}>
      {value || "—"}
    </span>
  );
}

const fINR = (n) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(Number(n || 0));
const fDate = (iso) => (iso ? new Date(iso).toLocaleDateString("en-IN") : "—");

const Modal = ({ open, onClose, children }) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50" onClick={onClose} role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-black/40" />
      <div className="absolute inset-0 grid place-items-center p-4">
        <div
          className="relative w-[min(720px,92vw)] md:w-[min(860px,92vw)] max-h-[90vh] overflow-y-auto rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-6 shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          {children}
        </div>
      </div>
    </div>
  );
};

export default function Payments() {
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);
  const [payments, setPayments] = useState([]);
  const [paymentStats, setPaymentStats] = useState(null);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("All");
  const [ptype, setPtype] = useState("All");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [amountMin, setAmountMin] = useState("");
  const [amountMax, setAmountMax] = useState("");

  const [modalItem, setModalItem] = useState(null);
  const [detailedPayment, setDetailedPayment] = useState(null);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [orderData, setOrderData] = useState(null);

  async function load() {
    try {
      setLoading(true);
      const token = localStorage.getItem('auth') ? JSON.parse(localStorage.getItem('auth')).accessToken : '';
      const headers = { 'Authorization': `Bearer ${token}` };
      
      console.log('🔍 PAYMENTS PAGE - Starting API calls...');
      console.log('🔑 Token:', token ? `${token.substring(0, 20)}...` : 'NO TOKEN');
      console.log('📡 Headers:', headers);
      
      // Fetch real payment data from backend
      console.log('💳 Fetching real payments from:', API_ENDPOINTS.PAYMENTS);
      const paymentsRes = await fetch(API_ENDPOINTS.PAYMENTS, { headers });
      console.log('💳 Payments Response Status:', paymentsRes.status);
      console.log('💳 Payments Response Headers:', Object.fromEntries(paymentsRes.headers.entries()));
      
      // Fetch payment statistics
      console.log('📊 Fetching payment statistics...');
      const statsRes = await fetch(`${API_ENDPOINTS.PAYMENTS}/statistics`, { headers });
      console.log('📊 Statistics Response Status:', statsRes.status);
      
      let stats = null;
      if (statsRes.ok) {
        const statsData = await statsRes.json();
        console.log('✅ Payment Statistics Received:', statsData);
        console.log('📊 Statistics Breakdown:', {
          totalDeposits: statsData.totalDeposits,
          totalPurchases: statsData.totalPurchases,
          totalCommissions: statsData.totalCommissions,
          totalWithdrawals: statsData.totalWithdrawals,
          pendingPayments: statsData.pendingPayments
        });
        
        // Debug: Check if statistics are being used
        console.log('🔍 Setting payment stats:', statsData);
        setPaymentStats(statsData);
        stats = statsData;
      } else {
        const errorText = await statsRes.text();
        console.log('❌ Statistics API Failed:', statsRes.status, errorText);
        console.log('⚠️ Falling back to frontend calculation');
      }
      
      if (paymentsRes.ok) {
        const response = await paymentsRes.json();
        console.log('✅ Real Payments Data Received:', response);
        console.log('📊 Total Payments Found:', response.payments ? response.payments.length : 0);
        
        // Extract payments array from response
        const realPayments = response.payments || [];
        
        // Transform backend payment data to match frontend format
        const transformedPayments = (response.payments || []).map(p => ({
          id: p.id,
          code: `PAY${p.id}`,
          // 👇 Map top-level fields into a flat user object your UI expects
          user: {
            name: p.userName || null,
            code: p.userId != null ? String(p.userId) : null,
          },
          type: p.type === 'COMMISSION' ? 'Commission' : 
                p.type === 'DEPOSIT' ? 'Payment' : 
                p.type === 'WITHDRAW' ? 'Withdrawal' :
                p.type === 'ORDER_PAYMENT' ? 'Order Payment' :
                (p.type || 'Payment'),
          amount: Number(p.amount) || 0,
          status:
            p.status === 'SUCCESS' || p.status === 'COMPLETED' ? 'Completed' :
            p.status === 'PENDING' ? 'Pending' :
            p.status === 'FAILED' ? 'Failed' :
            (p.status || 'Unknown'),
          method: {
            channel: p.paymentMethod || (p.razorpayPaymentId ? 'Razorpay' : null),
            account: p.razorpayPaymentId || p.razorpayOrderId || null,
          },
          requestedAt: p.createdAt || null,
          processedAt: p.updatedAt || p.createdAt || null,
          description: p.description || `Payment ${p.id}`,
          
          // Razorpay transaction details
          razorpayOrderId: p.razorpayOrderId || null,
          razorpayPaymentId: p.razorpayPaymentId || null,
          razorpaySignature: p.razorpaySignature || null,
          
          // Shipping details (if available)
          shippingName: p.shippingName || null,
          shippingPhone: p.shippingPhone || null,
          shippingAddress: p.shippingAddress || null,
          shippingCity: p.shippingCity || null,
          shippingState: p.shippingState || null,
          shippingPincode: p.shippingPincode || null,
          
          // Delivery status (if available)
          deliveryStatus: p.deliveryStatus || null,
        }));

        // Sort payments by date (latest first)
        transformedPayments.sort((a, b) => {
          const dateA = new Date(a.requestedAt || a.processedAt || 0);
          const dateB = new Date(b.requestedAt || b.processedAt || 0);
          return dateB - dateA; // Descending order (latest first)
        });
        
        setPayments(transformedPayments);
        setErr(null);
        console.log('✅ Payments loaded successfully:', transformedPayments.length);
      } else {
          console.log('❌ Payments API Failed:', paymentsRes.status, await paymentsRes.text());
          // Fallback to mock data if API fails
          const mockPayments = [
            {
              id: 1,
              code: 'PAY001',
              user: {
                name: 'Test User 1',
                code: 'REF209825',
                tier: 'Gold',
                level: 'G1'
              },
              type: 'Commission',
              amount: 250.00,
              status: 'Approved',
              method: {
                channel: 'Razorpay',
                account: 'pay_1_1759476962585'
              },
              requestedAt: '2024-01-20T14:45:00Z',
              processedAt: '2024-01-20T15:00:00Z',
              description: 'MLM Commission - Level 1 referral (10%)'
            }
          ];
          setPayments(mockPayments);
          setErr(null);
        }
      
    } catch (e) {
      setErr(e.message || "Failed to load payments");
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    return payments.filter((p) => {
      const hay = `${p.code} ${p.user.name} ${p.user.code} ${p.type} ${p.description}`.toLowerCase();
      const matchQ = q.trim() === "" || hay.includes(q.toLowerCase());
      const matchStatus = status === "All" || p.status === status;
      const matchType = ptype === "All" || p.type === ptype;
      const ts = (p.requestedAt || p.processedAt) ? new Date(p.requestedAt || p.processedAt).getTime() : 0;
      const fromOk = !dateFrom || ts >= new Date(dateFrom + 'T00:00:00').getTime();
      const toOk = !dateTo || ts <= new Date(dateTo + 'T23:59:59').getTime();
      const amt = Number(p.amount || 0);
      const minOk = amountMin === "" || amt >= Number(amountMin);
      const maxOk = amountMax === "" || amt <= Number(amountMax);
      return matchQ && matchStatus && matchType && fromOk && toOk && minOk && maxOk;
    });
  }, [payments, q, status, ptype]);

  async function fetchDetailedPayment(paymentId) {
    try {
      console.log('🔍 Fetching detailed payment information for ID:', paymentId);
      const token = localStorage.getItem('auth') ? JSON.parse(localStorage.getItem('auth')).accessToken : '';
      const headers = { 'Authorization': `Bearer ${token}` };
      
      const response = await fetch(`${API_ENDPOINTS.PAYMENT_DETAILS}/${paymentId}`, { headers });
      if (response.ok) {
        const detailedData = await response.json();
        console.log('✅ Detailed payment data received:', detailedData);
        
        // Transform the detailed data to match our frontend format
        const transformedDetailedPayment = {
          ...detailedData,
          // Map backend fields to frontend format
          code: detailedData.code,
          user: {
            name: detailedData.user?.userName || 'Unknown',
            code: detailedData.user?.userId || 'N/A',
          },
          userEmail: detailedData.user?.userEmail,
          userPhone: detailedData.user?.userPhone,
          referenceCode: detailedData.user?.referenceCode,
          hasPaidActivation: detailedData.user?.hasPaidActivation,
          isFirstOrder: detailedData.user?.isFirstOrder,
          shippingName: detailedData.shipping?.shippingName,
          shippingPhone: detailedData.shipping?.shippingPhone,
          shippingAddress: detailedData.shipping?.shippingAddress,
          shippingCity: detailedData.shipping?.shippingCity,
          shippingState: detailedData.shipping?.shippingState,
          shippingPincode: detailedData.shipping?.shippingPincode,
          deliveryStatus: detailedData.shipping?.deliveryStatus,
          razorpayOrderId: detailedData.payment?.razorpayOrderId,
          razorpayPaymentId: detailedData.payment?.razorpayPaymentId,
          razorpaySignature: detailedData.payment?.razorpaySignature,
          paymentMethod: detailedData.payment?.paymentMethod,
          products: detailedData.products || [],
          isOrderPayment: detailedData.isOrderPayment,
          orderNumber: detailedData.orderNumber,
          timeRemaining: detailedData.timing?.timeRemaining,
          isExpired: detailedData.timing?.isExpired,
          description: detailedData.description
        };
        
        setDetailedPayment(transformedDetailedPayment);
        return transformedDetailedPayment;
      } else {
        console.error('❌ Failed to fetch detailed payment:', response.status);
        return null;
      }
    } catch (error) {
      console.error('❌ Error fetching detailed payment:', error);
      return null;
    }
  }

  function handleViewOrderDetails(payment) {
    if (payment.isOrderPayment && payment.razorpayOrderId) {
      // Transform payment data to order format for the OrderModal
      const orderData = {
        id: payment.id,
        orderNo: payment.orderNumber,
        customerName: payment.user.name,
        customerCode: payment.user.code,
        userEmail: payment.userEmail,
        userPhone: payment.userPhone,
        referenceCode: payment.referenceCode,
        hasPaidActivation: payment.hasPaidActivation,
        isFirstOrder: payment.isFirstOrder,
        shippingName: payment.shippingName,
        shippingPhone: payment.shippingPhone,
        shippingAddress: payment.shippingAddress,
        shippingCity: payment.shippingCity,
        shippingState: payment.shippingState,
        shippingPincode: payment.shippingPincode,
        razorpayOrderId: payment.razorpayOrderId,
        razorpayPaymentId: payment.razorpayPaymentId,
        razorpaySignature: payment.razorpaySignature,
        paymentMethod: payment.paymentMethod,
        products: payment.products?.map(p => p.name) || ['MLM Activation Package'],
        amount: payment.amount,
        paymentStatus: payment.status,
        deliveryStatus: payment.deliveryStatus,
        date: payment.requestedAt,
        timeRemaining: payment.timeRemaining,
        isExpired: payment.isExpired,
        description: payment.description
      };
      
      setOrderData(orderData);
      setShowOrderModal(true);
    }
  }

  // Pagination
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  useEffect(() => { setPage(1); }, [q, status, ptype]);
  const paged = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, page, pageSize]);

  const kpis = useMemo(() => {
    console.log('🔍 KPIs Calculation - paymentStats:', paymentStats);
    console.log('🔍 KPIs Calculation - payments count:', payments.length);
    
    // Use real statistics from backend if available, otherwise fallback to frontend calculation
    if (paymentStats) {
      const calculatedKpis = {
        total: (paymentStats.totalDeposits ? Number(paymentStats.totalDeposits) : 0) + 
               (paymentStats.totalPurchases ? Number(paymentStats.totalPurchases) : 0) + 
               (paymentStats.totalCommissions ? Number(paymentStats.totalCommissions) : 0),
        pending: paymentStats.pendingPayments || 0,
        withdrawals: paymentStats.totalWithdrawals ? Number(paymentStats.totalWithdrawals) : 0,
        commissions: paymentStats.totalCommissions ? Number(paymentStats.totalCommissions) : 0
      };
      console.log('✅ Using backend statistics:', calculatedKpis);
      return calculatedKpis;
    }
    
    // Fallback to frontend calculation - but exclude ₹0 transactions for totals
    const meaningfulPayments = payments.filter(p => p.amount > 0);
    const total = meaningfulPayments.reduce((sum, p) => sum + p.amount, 0);
    const pending = payments.filter((p) => p.status === "Pending").length;
    const withdrawals = payments.filter((p) => p.type === "Withdrawal").reduce((sum, p) => sum + p.amount, 0);
    const commissions = payments.filter((p) => p.type === "Commission").reduce((sum, p) => sum + p.amount, 0);
    const fallbackKpis = { total, pending, withdrawals, commissions };
    console.log('⚠️ Using frontend fallback calculation (excluding ₹0):', fallbackKpis);
    console.log('🔍 Payment breakdown:', {
      totalPayments: payments.length,
      meaningfulPayments: meaningfulPayments.length,
      totalAmount: total,
      pendingCount: pending,
      withdrawalsAmount: withdrawals,
      commissionsAmount: commissions
    });
    return fallbackKpis;
  }, [paymentStats, payments]);

  if (loading) return <SkeletonPaymentsPage />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Payments</h1>
        <EnhancedExportButton
          data={filtered}
          dataType="payments"
          filename="payments"
          currentFilters={{
            search: q,
            status: status,
            type: ptype
          }}
          currentSort={null}
          showAdvancedOptions={true}
          defaultFormat="excel"
          isDataPreFiltered={true}
          totalRecords={payments.length}
        />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Stat label="Total Payments" value={fINR(kpis.total)} sub="All time transactions" />
        <Stat label="Pending Requests" value={kpis.pending} sub="Awaiting approval" />
        <Stat label="Total Withdrawals" value={fINR(kpis.withdrawals)} sub="User withdrawals" />
        <Stat label="Total Commissions" value={fINR(kpis.commissions)} sub="Paid commissions" />
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Search payments..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="w-full px-4 py-2 border border-[rgb(var(--border))] rounded-lg bg-[rgb(var(--card))] focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="px-4 py-2 border border-[rgb(var(--border))] rounded-lg bg-[rgb(var(--card))] focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="All">All Status</option>
          <option value="Completed">Completed</option>
          <option value="Pending">Pending</option>
          <option value="Failed">Failed</option>
        </select>
        <select
          value={ptype}
          onChange={(e) => setPtype(e.target.value)}
          className="px-4 py-2 border border-[rgb(var(--border))] rounded-lg bg-[rgb(var(--card))] focus:outline-none focus:ring-2 focus:ring-blue-500"
          title="Filter by transaction type"
        >
          <option value="All">All Types</option>
          <option value="Commission" title="MLM commission payments to users">Commission</option>
          <option value="Order Payment" title="Product purchases and activation fees">Order Payment</option>
          <option value="Payment" title="General payment transactions">Payment</option>
          <option value="Withdrawal" title="User withdrawal requests">Withdrawal</option>
          <option value="Referral Bonus" title="Special referral bonuses">Referral Bonus</option>
          <option value="Adjustment" title="Manual account adjustments">Adjustment</option>
        </select>
        <div className="flex items-center gap-2">
          <input type="date" value={dateFrom} onChange={(e)=>setDateFrom(e.target.value)} className="px-3 py-2 border border-[rgb(var(--border))] rounded-lg bg-[rgb(var(--card))]" />
          <span className="opacity-60">to</span>
          <input type="date" value={dateTo} onChange={(e)=>setDateTo(e.target.value)} className="px-3 py-2 border border-[rgb(var(--border))] rounded-lg bg-[rgb(var(--card))]" />
        </div>
        <div className="flex items-center gap-2">
          <input type="number" inputMode="numeric" placeholder="Min ₹" value={amountMin} onChange={(e)=>setAmountMin(e.target.value)} className="w-28 px-3 py-2 border border-[rgb(var(--border))] rounded-lg bg-[rgb(var(--card))]" />
          <input type="number" inputMode="numeric" placeholder="Max ₹" value={amountMax} onChange={(e)=>setAmountMax(e.target.value)} className="w-28 px-3 py-2 border border-[rgb(var(--border))] rounded-lg bg-[rgb(var(--card))]" />
        </div>
        <button
          onClick={() => {
            setQ("");
            setStatus("All");
            setPtype("All");
            setDateFrom("");
            setDateTo("");
            setAmountMin("");
            setAmountMax("");
          }}
          className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
        >
          Clear Filters
        </button>
      </div>

      {/* Transaction Type Info */}
      {ptype !== "All" && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-blue-600 font-semibold">ℹ️ Filter Active:</span>
            <span className="font-medium">{ptype} Transactions</span>
          </div>
          <div className="text-sm text-blue-700">
            {ptype === "Commission" && "Showing MLM commission payments made to users in the referral network"}
            {ptype === "Order Payment" && "Showing product purchases and MLM activation fee payments"}
            {ptype === "Payment" && "Showing general payment transactions, often pending orders"}
            {ptype === "Withdrawal" && "Showing user withdrawal requests from their wallet balance"}
            {ptype === "Referral Bonus" && "Showing special referral bonus payments"}
            {ptype === "Adjustment" && "Showing manual account adjustments and corrections"}
          </div>
        </div>
      )}

      {/* Enhanced Responsive Table */}
      <ResponsiveTable
        columns={[
          {
            key: 'code',
            title: 'Payment',
            sortable: true,
            render: (value, payment) => (
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <CreditCard className="h-4 w-4 text-blue-600" />
                </div>
                    <div className="font-medium">{payment.code}</div>
              </div>
            )
          },
          {
            key: 'user',
            title: 'User',
            sortable: true,
            render: (value, payment) => (
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                  <User className="h-4 w-4 text-green-600" />
                </div>
                    <div>
                      <div className="font-medium">{payment.user.name || '--'}</div>
                  <div className="text-sm text-gray-500">ID: {payment.user.code || '--'}</div>
                </div>
              </div>
            )
          },
          {
            key: 'type',
            title: 'Type',
            sortable: true,
            render: (value) => (
              <div className="font-medium">{value}</div>
            )
          },
          {
            key: 'amount',
            title: 'Amount',
            sortable: true,
            render: (value, payment) => (
              <div className="flex items-center gap-2">
                <IndianRupee className="h-4 w-4 text-green-600" />
                <span className="font-semibold whitespace-nowrap [font-variant-numeric:tabular-nums]">
                  {fINR(payment.amount)}
                </span>
                    </div>
            )
          },
          {
            key: 'method',
            title: 'Method',
            sortable: true,
            render: (value, payment) => (
                    <div>
                      <div className="font-medium">{payment.method.channel || '--'}</div>
                      <div className="text-sm opacity-70">{payment.method.account || '--'}</div>
                    </div>
            )
          },
          {
            key: 'status',
            title: 'Status',
            sortable: true,
            render: (value) => <StatusPill value={value} />
          },
          {
            key: 'date',
            title: 'Date',
            sortable: true,
            render: (value, payment) => (
                    <div>
                      <div>{fDate(payment.requestedAt)}</div>
                      {payment.processedAt && (
                        <div className="text-sm opacity-70">Processed: {fDate(payment.processedAt)}</div>
                      )}
                    </div>
            )
          }
        ]}
        data={paged}
        loading={loading}
        emptyMessage="No payments match your filters."
        searchable={false}
        filterable={false}
        selectable={false}
        cardView={true}
        stickyHeader={true}
        actions={(payment) => (
          <PaymentActions
            payment={payment}
            onView={async (payment) => {
              setModalItem(payment);
              await fetchDetailedPayment(payment.id);
            }}
            onApprove={(payment) => {/* Approve functionality */}}
            onReject={(payment) => {/* Reject functionality */}}
            onRefund={(payment) => {/* Refund functionality */}}
          />
        )}
        onRowClick={async (payment) => {
                        setModalItem(payment);
                        await fetchDetailedPayment(payment.id);
                      }}
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

      {/* Enhanced Payment Modal */}
      <Modal open={!!modalItem} onClose={() => {
        setModalItem(null);
        setDetailedPayment(null);
      }}>
        {modalItem && (
          <div className="space-y-6">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-2xl font-semibold">Payment Details</h3>
                <p className="text-sm opacity-70">Complete information for payment {modalItem.code}</p>
              </div>
              <button onClick={() => {
                setModalItem(null);
                setDetailedPayment(null);
              }} className="opacity-70 hover:opacity-100 text-2xl" aria-label="Close">×</button>
            </div>

            {/* Payment Status Section */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-[rgb(var(--bg))] rounded-lg p-4">
                <div className="text-sm opacity-70 mb-2">Payment Information</div>
                <div className="font-medium text-lg">{modalItem.code}</div>
                {detailedPayment?.razorpayOrderId && (
                  <div className="text-xs opacity-60 mt-1 break-all">Order: {detailedPayment.orderNumber}</div>
                )}
              </div>
              
              <div className="bg-[rgb(var(--bg))] rounded-lg p-4">
                <div className="text-sm opacity-70 mb-2">Payment Status</div>
                <StatusPill value={modalItem.status} />
                <div className="text-xs opacity-60 mt-1">via {modalItem.method.channel || 'RAZORPAY'}</div>
              </div>
              
              <div className="bg-[rgb(var(--bg))] rounded-lg p-4">
                <div className="text-sm opacity-70 mb-2">Amount</div>
                <div className="font-medium text-lg">{fINR(modalItem.amount)}</div>
                <div className="text-xs opacity-60 mt-1">{modalItem.type}</div>
              </div>
            </div>

            {/* Customer Information */}
            <div className="bg-[rgb(var(--bg))] rounded-lg p-4 mb-6">
              <div className="text-sm font-semibold uppercase opacity-70 mb-3">Customer Information</div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span>👤</span>
                    <span className="font-medium">{modalItem.user.name || 'Unknown'}</span>
                  </div>
                  <div className="text-sm opacity-70">ID: {modalItem.user.code || 'N/A'}</div>
                  {detailedPayment?.userEmail && (
                    <div className="text-sm opacity-70">Email: {detailedPayment.userEmail}</div>
                  )}
                  {detailedPayment?.userPhone && (
                    <div className="text-sm opacity-70">Phone: {detailedPayment.userPhone}</div>
                  )}
                </div>
                <div>
                  {detailedPayment?.referenceCode && (
                    <div className="flex items-center gap-2 mb-2">
                      <span>🔗</span>
                      <span className="font-medium">Referral Code: {detailedPayment.referenceCode}</span>
                    </div>
                  )}
                  <div className="text-sm opacity-70">Activation: {detailedPayment?.hasPaidActivation ? '✅ Paid' : '❌ Pending'}</div>
                  <div className="text-sm opacity-70">First Order: {detailedPayment?.isFirstOrder ? 'Yes' : 'No'}</div>
                </div>
              </div>
            </div>

            {/* Shipping Information */}
            {(detailedPayment?.shippingName || detailedPayment?.shippingPhone || detailedPayment?.shippingAddress) && (
              <div className="bg-[rgb(var(--bg))] rounded-lg p-4 mb-6">
                <div className="text-sm font-semibold uppercase opacity-70 mb-3">Shipping Details</div>
                <div className="space-y-3">
                  {detailedPayment.shippingName && (
                    <div className="flex items-center gap-2">
                      <span>📦</span>
                      <span className="font-medium">{detailedPayment.shippingName}</span>
                    </div>
                  )}
                  
                  {detailedPayment.shippingPhone && (
                    <div className="flex items-center gap-2">
                      <span>📱</span>
                      <span>{detailedPayment.shippingPhone}</span>
                    </div>
                  )}
                  
                  {detailedPayment.shippingAddress && (
                    <div className="flex items-start gap-2">
                      <span>📍</span>
                      <div className="flex-1">
                        <div>{detailedPayment.shippingAddress}</div>
                        {(detailedPayment.shippingCity || detailedPayment.shippingState || detailedPayment.shippingPincode) && (
                          <div className="opacity-80 mt-1">
                            {detailedPayment.shippingCity && <span>{detailedPayment.shippingCity}</span>}
                            {detailedPayment.shippingCity && detailedPayment.shippingState && <span>, </span>}
                            {detailedPayment.shippingState && <span>{detailedPayment.shippingState}</span>}
                            {detailedPayment.shippingPincode && <span> - {detailedPayment.shippingPincode}</span>}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                  
                  {detailedPayment.deliveryStatus && (
                    <div className="flex items-center gap-2">
                      <span>🚚</span>
                      <span className="font-medium">Delivery Status: </span>
                      <StatusPill value={detailedPayment.deliveryStatus} />
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Payment Details */}
            {(detailedPayment?.razorpayPaymentId || detailedPayment?.razorpayOrderId) && (
              <div className="bg-[rgb(var(--bg))] rounded-lg p-4 mb-6">
                <div className="text-sm font-semibold uppercase opacity-70 mb-3">Payment Details</div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="opacity-70">Payment Method</div>
                    <div className="font-medium">{detailedPayment.paymentMethod || 'RAZORPAY'}</div>
                  </div>
                  {detailedPayment.razorpayPaymentId && (
                    <div>
                      <div className="opacity-70">Payment ID</div>
                      <div className="font-medium break-all">{detailedPayment.razorpayPaymentId}</div>
                    </div>
                  )}
                  {detailedPayment.razorpayOrderId && (
                    <div>
                      <div className="opacity-70">Order ID</div>
                      <div className="font-medium break-all">{detailedPayment.razorpayOrderId}</div>
                    </div>
                  )}
                  {detailedPayment.razorpaySignature && (
                    <div className="md:col-span-2">
                      <div className="opacity-70">Transaction Signature</div>
                      <div className="font-mono text-xs break-all">{detailedPayment.razorpaySignature}</div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Products (for order payments) */}
            {detailedPayment?.isOrderPayment && detailedPayment.products && detailedPayment.products.length > 0 && (
              <div className="bg-[rgb(var(--bg))] rounded-lg p-4 mb-6">
                <div className="text-sm font-semibold uppercase opacity-70 mb-3">Products</div>
                <div className="space-y-3">
                  {detailedPayment.products.map((product, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--card))]">
                      <div>
                        <div className="font-medium">{product.name}</div>
                        <div className="text-sm opacity-70">{product.description}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium">{fINR(product.totalPrice)}</div>
                        <div className="text-sm opacity-70">Qty: {product.quantity}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Payment Summary */}
            <div className="bg-[rgb(var(--bg))] rounded-lg p-4 mb-6">
              <div className="text-sm font-semibold uppercase opacity-70 mb-3">Payment Summary</div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Payment Date:</span>
                  <span>{fDate(modalItem.requestedAt)}</span>
                </div>
                {modalItem.processedAt && (
                  <div className="flex justify-between">
                    <span>Processed:</span>
                    <span>{fDate(modalItem.processedAt)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>Total Amount:</span>
                  <span className="font-semibold text-lg">{fINR(modalItem.amount)}</span>
                </div>
                {detailedPayment?.timeRemaining !== null && detailedPayment?.timeRemaining !== undefined && (
                  <div className={`text-sm ${detailedPayment.isExpired ? 'text-red-500' : 'text-amber-500'}`}>
                    {detailedPayment.isExpired ? '⏰ Payment Expired' : `⏱️ ${detailedPayment.timeRemaining} min remaining`}
                  </div>
                )}
                {modalItem.description && (
                  <div className="text-sm opacity-70 mt-2">
                    <span className="font-medium">Notes:</span> {modalItem.description}
                  </div>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
              <button
                onClick={() => {
                  setModalItem(null);
                  setDetailedPayment(null);
                }}
                className="px-4 py-2 rounded-lg bg-gray-600 text-white hover:bg-gray-700 transition-colors"
              >
                Close
              </button>
              
              {/* View Order Details Button (for order payments) */}
              {detailedPayment?.isOrderPayment && (
                <button
                  onClick={() => handleViewOrderDetails(detailedPayment)}
                  className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors"
                >
                  📦 View Order Details
                </button>
              )}
              
              {modalItem.status === "Pending" && (
                <button className="px-4 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700 transition-colors">
                  Approve
                </button>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* Order Details Modal */}
      {showOrderModal && orderData && (
        <OrderModal 
          order={orderData} 
          detailedOrder={orderData}
          onClose={() => {
            setShowOrderModal(false);
            setOrderData(null);
          }} 
          onUpdateStatus={() => {
            // Handle order status updates if needed
            console.log('Order status update requested');
          }}
        />
      )}
    </div>
  );
}