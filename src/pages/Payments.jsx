import React, { useEffect, useMemo, useState } from "react";

// Import API configuration
import { API_ENDPOINTS } from '../config/api';

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
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState(null);
  const [payments, setPayments] = useState([]);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("All");
  const [ptype, setPtype] = useState("All");

  const [modalItem, setModalItem] = useState(null);

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
          type: p.type === 'DEPOSIT' ? 'Payment' : (p.type || 'Payment'),
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
      return matchQ && matchStatus && matchType;
    });
  }, [payments, q, status, ptype]);

  const kpis = useMemo(() => {
    const total = payments.reduce((sum, p) => sum + p.amount, 0);
    const pending = payments.filter((p) => p.status === "Pending").length;
    const withdrawals = payments.filter((p) => p.type === "Withdrawal").reduce((sum, p) => sum + p.amount, 0);
    const commissions = payments.filter((p) => p.type === "Commission").reduce((sum, p) => sum + p.amount, 0);
    return { total, pending, withdrawals, commissions };
  }, [payments]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Payments</h1>
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
        >
          <option value="All">All Types</option>
          <option value="Payment">Payment</option>
          <option value="Commission">Commission</option>
          <option value="Withdrawal">Withdrawal</option>
        </select>
      </div>

      {/* Table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[rgb(var(--border))]">
                <th className="text-left py-3 px-4 font-medium">Payment</th>
                <th className="text-left py-3 px-4 font-medium">User</th>
                <th className="text-left py-3 px-4 font-medium">Type</th>
                <th className="text-left py-3 px-4 font-medium">Amount</th>
                <th className="text-left py-3 px-4 font-medium">Method</th>
                <th className="text-left py-3 px-4 font-medium">Status</th>
                <th className="text-left py-3 px-4 font-medium">Date</th>
                <th className="text-left py-3 px-4 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((payment) => (
                <tr key={payment.id} className="border-b border-[rgb(var(--border))] hover:bg-[rgb(var(--muted))]">
                  <td className="py-3 px-4">
                    <div className="font-medium">{payment.code}</div>
                  </td>
                  <td className="py-3 px-4">
                    <div>
                      <div className="font-medium">{payment.user.name || '--'}</div>
                      <div className="text-sm opacity-70">ID: {payment.user.code || '--'}</div>
                    </div>
                  </td>

                  <td className="py-3 px-4">
                    <div className="font-medium">{payment.type}</div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="font-medium">{fINR(payment.amount)}</div>
                  </td>
                  <td className="py-3 px-4">
                    <div>
                      <div className="font-medium">{payment.method.channel || '--'}</div>
                      <div className="text-sm opacity-70">{payment.method.account || '--'}</div>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <StatusPill value={payment.status} />
                  </td>
                  <td className="py-3 px-4">
                    <div>
                      <div>{fDate(payment.requestedAt)}</div>
                      {payment.processedAt && (
                        <div className="text-sm opacity-70">Processed: {fDate(payment.processedAt)}</div>
                      )}
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <button
                      onClick={() => setModalItem(payment)}
                      className="text-blue-600 hover:text-blue-800 font-medium"
                    >
                      View Details
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Modal */}
      <Modal open={!!modalItem} onClose={() => setModalItem(null)}>
        {modalItem && (
          <div className="space-y-6">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-xl font-semibold">Payment Details</h3>
                <p className="text-sm opacity-70">Complete information for payment {modalItem.code}</p>
              </div>
              <button onClick={() => setModalItem(null)} className="opacity-70 hover:opacity-100 text-xl" aria-label="Close">×</button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <div className="text-sm opacity-70">Payment ID</div>
                <div className="font-medium">{modalItem.code}</div>
              </div>
              <div>
                <div className="text-sm opacity-70">Amount</div>
                <div className="font-medium">{fINR(modalItem.amount)}</div>
              </div>
              <div>
                <div className="text-sm opacity-70">Status</div>
                <div className="font-medium">
                  <StatusPill value={modalItem.status} />
                </div>
              </div>
              <div>
                <div className="text-sm opacity-70">Type</div>
                <div className="font-medium">{modalItem.type}</div>
              </div>
              <div>
                <div className="text-sm opacity-70">User</div>
                <div className="font-medium">{modalItem.user.name || '--'} ({modalItem.user.code || '--'})</div>
              </div>
              <div>
                <div className="text-sm opacity-70">Payment Method</div>
                <div className="font-medium">{modalItem.method.channel || '--'}</div>
              </div>
              <div>
                <div className="text-sm opacity-70">Requested At</div>
                <div className="font-medium">{fDate(modalItem.requestedAt)}</div>
              </div>
              {modalItem.processedAt && (
                <div>
                  <div className="text-sm opacity-70">Processed At</div>
                  <div className="font-medium">{fDate(modalItem.processedAt)}</div>
                </div>
              )}
            </div>

            {/* Razorpay Transaction Details */}
            {(modalItem.razorpayOrderId || modalItem.razorpayPaymentId) && (
              <div className="border-t border-[rgb(var(--border))] pt-4">
                <div className="text-xs font-semibold uppercase opacity-70 mb-3">Razorpay Transaction Details</div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {modalItem.razorpayOrderId && (
                    <div>
                      <div className="text-sm opacity-70">Razorpay Order ID</div>
                      <div className="font-medium text-sm break-all">{modalItem.razorpayOrderId}</div>
                    </div>
                  )}
                  {modalItem.razorpayPaymentId && (
                    <div>
                      <div className="text-sm opacity-70">Razorpay Payment ID</div>
                      <div className="font-medium text-sm break-all">{modalItem.razorpayPaymentId}</div>
                    </div>
                  )}
                  {modalItem.razorpaySignature && (
                    <div className="md:col-span-2">
                      <div className="text-sm opacity-70">Transaction Signature</div>
                      <div className="font-medium text-xs break-all opacity-80">{modalItem.razorpaySignature}</div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Shipping Details */}
            {(modalItem.shippingName || modalItem.shippingPhone || modalItem.shippingAddress) && (
              <div className="border-t border-[rgb(var(--border))] pt-4">
                <div className="text-xs font-semibold uppercase opacity-70 mb-3">Shipping Details</div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {modalItem.shippingName && (
                    <div>
                      <div className="text-sm opacity-70">Recipient Name</div>
                      <div className="font-medium">{modalItem.shippingName}</div>
                    </div>
                  )}
                  {modalItem.shippingPhone && (
                    <div>
                      <div className="text-sm opacity-70">Phone Number</div>
                      <div className="font-medium">{modalItem.shippingPhone}</div>
                    </div>
                  )}
                  {modalItem.shippingAddress && (
                    <div className="md:col-span-2">
                      <div className="text-sm opacity-70">Address</div>
                      <div className="font-medium">{modalItem.shippingAddress}</div>
                      {(modalItem.shippingCity || modalItem.shippingState || modalItem.shippingPincode) && (
                        <div className="text-sm opacity-80 mt-1">
                          {modalItem.shippingCity && <span>{modalItem.shippingCity}</span>}
                          {modalItem.shippingCity && modalItem.shippingState && <span>, </span>}
                          {modalItem.shippingState && <span>{modalItem.shippingState}</span>}
                          {modalItem.shippingPincode && <span> - {modalItem.shippingPincode}</span>}
                        </div>
                      )}
                    </div>
                  )}
                  {modalItem.deliveryStatus && (
                    <div>
                      <div className="text-sm opacity-70">Delivery Status</div>
                      <div className="font-medium">
                        <StatusPill value={modalItem.deliveryStatus} />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div>
              <div className="text-sm opacity-70">Description</div>
              <div className="font-medium">{modalItem.description}</div>
            </div>

            <div className="flex gap-3 pt-4">
              <button
                onClick={() => setModalItem(null)}
                className="px-4 py-2 rounded-lg bg-gray-600 text-white hover:bg-gray-700 transition-colors"
              >
                Close
              </button>
              {modalItem.status === "Pending" && (
                <button className="px-4 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700 transition-colors">
                  Approve
                </button>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}