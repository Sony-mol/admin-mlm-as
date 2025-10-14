import React, { useEffect, useMemo, useState } from "react";

// Import API configuration
import { API_ENDPOINTS } from '../config/api';

const fmtINR = (n) =>
  Number(n || 0).toLocaleString("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 });
const fmtDate = (iso) => {
  if (!iso) return "";
  const d = new Date(iso);
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  return `${dd}-${mm}-${yyyy}`;
};

/* ---------- Shared: status pill ---------- */
function StatusPill({ value }) {
  const key = String(value || "").toLowerCase();
  const color =
    key === "shipped" ? "bg-teal-500" :
    key === "delivered" ? "bg-violet-600" :
    key === "pending" || key === "processing" ? "bg-amber-500" :
    key === "confirmed" ? "bg-blue-500" :
    key === "active" || key === "approved" || key === "completed" || key === "success" ? "bg-emerald-500" :
    key === "suspended" || key === "cancelled" || key === "canceled" || key === "rejected" || key === "failed" ? "bg-red-500" :
    "bg-slate-400";
  return (
    <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold text-white ${color}`}>
      {value || "—"}
    </span>
  );
}

/* =================== Modal (responsive) =================== */
function OrderModal({ order, onClose, onUpdateStatus }) {
  if (!order) return null;
  const statuses = ["PENDING", "CONFIRMED", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED"];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog" aria-modal="true"
      onClick={onClose}
      style={{ background: "rgba(0,0,0,0.5)" }}
    >
      <div
        className="relative w-[min(720px,92vw)] md:w-[min(860px,92vw)] max-h-[90vh] overflow-y-auto rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-xl font-semibold">Order Details</h3>
            <p className="text-sm opacity-70">Complete information for order {order.orderNo}</p>
          </div>
            <button onClick={onClose} className="opacity-70 hover:opacity-100 text-xl" aria-label="Close">×</button>
        </div>

        <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
          <div>
            <div className="text-sm opacity-70">Order ID</div>
            <div className="font-medium">{order.orderNo}</div>
            {order.razorpayOrderId && (
              <div className="text-xs opacity-60 mt-1">Razorpay: {order.razorpayOrderId}</div>
            )}
          </div>
          <div className="sm:text-right">
            <div className="mb-2">
              <div className="text-xs opacity-70 mb-1">Payment Status</div>
              <StatusPill value={order.paymentStatus} />
            </div>
            <div>
              <div className="text-xs opacity-70 mb-1">Delivery Status</div>
              <StatusPill value={order.deliveryStatus || 'PENDING'} />
            </div>
            {order.isExpired && order.status === 'PENDING' && (
              <div className="text-xs text-red-500 mt-1">⚠️ Expired</div>
            )}
          </div>
        </div>

        <div className="mt-5 space-y-3">
          {/* Customer Information */}
          <div className="flex items-center gap-2 text-sm">
            <span>👤</span>
            <span className="font-medium">{order.customerName}</span>
            <span className="opacity-70">({order.customerCode})</span>
          </div>
          
          {/* Shipping Information */}
          {(order.shippingName || order.shippingPhone || order.shippingAddress) && (
            <div className="border-t border-[rgb(var(--border))] pt-3 space-y-2">
              <div className="text-xs font-semibold uppercase opacity-70 mb-2">Shipping Details</div>
              
              {order.shippingName && (
                <div className="flex items-center gap-2 text-sm">
                  <span>📦</span>
                  <span className="font-medium">{order.shippingName}</span>
                </div>
              )}
              
              {order.shippingPhone && (
                <div className="flex items-center gap-2 text-sm">
                  <span>📱</span>
                  <span>{order.shippingPhone}</span>
                </div>
              )}
              
              {order.shippingAddress && (
                <div className="flex items-start gap-2 text-sm">
                  <span>📍</span>
                  <div className="flex-1">
                    <div>{order.shippingAddress}</div>
                    {(order.shippingCity || order.shippingState || order.shippingPincode) && (
                      <div className="opacity-80 mt-1">
                        {order.shippingCity && <span>{order.shippingCity}</span>}
                        {order.shippingCity && order.shippingState && <span>, </span>}
                        {order.shippingState && <span>{order.shippingState}</span>}
                        {order.shippingPincode && <span> - {order.shippingPincode}</span>}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
          
          <div className="flex items-center gap-2 text-sm opacity-90">
            <span>🗓️</span>
            <span>Ordered on {fmtDate(order.date)}</span>
          </div>
        </div>

        <div className="mt-6">
          <div className="font-medium mb-2">Products</div>
          <div className="space-y-2">
            {(order.products || []).map((p, idx) => (
              <div key={idx} className="rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--bg))] px-3 py-2 text-sm">
                {p}
              </div>
            ))}
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
          <div>
            <div className="font-medium">Total Amount</div>
            <div className="text-2xl font-semibold mt-1">{fmtINR(order.amount)}</div>
            {order.timeRemaining !== null && order.status === 'PENDING' && (
              <div className={`text-sm mt-2 ${order.isExpired ? 'text-red-500' : 'text-amber-500'}`}>
                {order.isExpired ? '⏰ Expired' : `⏱️ ${order.timeRemaining} min remaining`}
              </div>
            )}
          </div>
          <div className="md:text-right">
            <label className="block text-sm font-medium mb-2">Update Delivery Status</label>
            <select
              value={order.deliveryStatus || 'PENDING'}
              onChange={(e) => onUpdateStatus(order, e.target.value)}
              className="w-full md:w-64 px-3 py-2 rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--bg))]"
            >
              {statuses.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
        </div>
      </div>
    </div>
  );
}

/* =================== Page =================== */
export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [err, setErr] = useState(null);
  const [loading, setLoading] = useState(true);

  const [q, setQ] = useState("");
  const [status, setStatus] = useState("All");
  const [view, setView] = useState(null); // modal

  async function load() {
    try {
      setLoading(true);
      const token = localStorage.getItem('auth') ? JSON.parse(localStorage.getItem('auth')).accessToken : '';
      const headers = { 'Authorization': `Bearer ${token}` };
      
      console.log('🔍 ORDERS PAGE - Starting API calls...');
      console.log('🔑 Token:', token ? `${token.substring(0, 20)}...` : 'NO TOKEN');
      console.log('📡 Headers:', headers);
      
      // Fetch real orders from backend
      console.log('📦 Fetching real orders from:', API_ENDPOINTS.ORDERS);
      const ordersRes = await fetch(API_ENDPOINTS.ORDERS, { headers });
      console.log('📦 Orders Response Status:', ordersRes.status);
      console.log('📦 Orders Response Headers:', Object.fromEntries(ordersRes.headers.entries()));
      
      if (ordersRes.ok) {
        const response = await ordersRes.json();
        console.log('✅ Real Orders Data Received:', response);
        console.log('📊 Total Orders Found:', response.orders ? response.orders.length : 0);
        
        // Extract orders array from response
        const realOrders = response.orders || [];
        
        // Transform backend order data to match frontend format
        const transformedOrders = realOrders.map(order => {
          // Calculate time remaining for pending orders
          let timeRemaining = null;
          let isExpired = false;
          if (order.status === 'PENDING' && order.createdAt) {
            const createdAt = new Date(order.createdAt);
            const now = new Date();
            const diffMs = now - createdAt;
            const diffMins = Math.floor(diffMs / 60000);
            const expiryMins = 30;
            timeRemaining = Math.max(0, expiryMins - diffMins);
            isExpired = timeRemaining <= 0;
          }

          return {
            id: order.id || order.orderId,
            orderNo: order.orderNumber,
            customerName: order.userName || `User ${order.userId}`,
            customerCode: order.userId ? `REF${order.userId}` : order.userEmail || "",
            products: order.orderItems ? order.orderItems.map(item => item.productName) : [order.description || "MLM Package"],
            amount: Number(order.totalAmount) || 0,
            status: order.status || 'Pending',
            paymentStatus: order.paymentStatus || order.status,
            deliveryStatus: order.deliveryStatus || 'PENDING', // Use delivery status from API
            
            // 🔴 key fix: the UI reads "o.date", so populate "date"
            date: order.createdAt,                   // <- use API createdAt
            deliveryDate: order.deliveryDate || null,
            paymentMethod: order.paymentMethod || 'Razorpay',
            shippingAddress: order.shippingAddress || 'MLM System - Digital Delivery',
            notes: order.notes || order.description || 'MLM System Order',
            
            // Shipping details
            shippingName: order.shippingName || null,
            shippingPhone: order.shippingPhone || null,
            shippingCity: order.shippingCity || null,
            shippingState: order.shippingState || null,
            shippingPincode: order.shippingPincode || null,
            
            // NEW: Order expiry information
            timeRemaining: timeRemaining,
            isExpired: isExpired,
            expiresAt: order.expiresAt || (order.createdAt ? new Date(new Date(order.createdAt).getTime() + 30*60000).toISOString() : null),
            razorpayOrderId: order.razorpayOrderId || null,
            activationStatus: order.activationStatus || null
          };
        });
        
        // Sort orders by date (latest first)
        transformedOrders.sort((a, b) => {
          const dateA = new Date(a.date || 0);
          const dateB = new Date(b.date || 0);
          return dateB - dateA; // Descending order (latest first)
        });
        
        setOrders(transformedOrders);
        setErr(null);
        console.log('✅ Orders loaded successfully:', transformedOrders.length);
      } else {
        console.log('❌ Orders API Failed:', ordersRes.status, await ordersRes.text());
        // Fallback to mock data if API fails
        const mockOrders = [
          {
            id: 1,
            orderNo: 'ORD001',
            customerName: 'Test User 1',
            customerCode: 'REF209825',
            products: ['Starter Package'],
            amount: 250.00,
            status: 'Delivered',
            orderDate: '2024-01-20T14:45:00Z',
            deliveryDate: '2024-01-21T10:30:00Z',
            paymentMethod: 'Razorpay',
            shippingAddress: '123 Main St, City, State',
            notes: 'First order with commission'
          }
        ];
        setOrders(mockOrders);
        setErr(null);
      }
      
    } catch (e) {
      setErr(e.message || "Failed to load orders");
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    return orders.filter((o) => {
      const hay = `${o.orderNo} ${o.customerName} ${o.customerCode} ${(o.products || []).join(" ")}`.toLowerCase();
      const matchQ = q.trim() === "" || hay.includes(q.toLowerCase());
      const deliveryStatus = o.deliveryStatus || 'PENDING';
      const matchStatus = status === "All" || deliveryStatus === status.toUpperCase();
      return matchQ && matchStatus;
    });
  }, [orders, q, status]);

  const kpis = useMemo(() => {
    const total = orders.length;
    const c = (s) => orders.filter((o) => (o.deliveryStatus || 'PENDING') === s).length;
    return {
      total,
      pending: c("PENDING"),
      processing: c("PROCESSING"),
      shipped: c("SHIPPED"),
      delivered: c("DELIVERED"),
      cancelled: c("CANCELLED"),
    };
  }, [orders]);

  async function updateStatus(order, nextDeliveryStatus) {
    const updated = { ...order, deliveryStatus: nextDeliveryStatus };
    setOrders((prev) => prev.map((o) => (o.id === order.id ? updated : o)));
    setView((v) => (v?.id === order.id ? updated : v));
    try {
      const token = localStorage.getItem('auth') ? JSON.parse(localStorage.getItem('auth')).accessToken : '';
      const headers = { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      };
      
      const res = await fetch(`${API_ENDPOINTS.ORDERS}/${order.id}/delivery-status`, {
        method: "PUT",
        headers: headers,
        body: JSON.stringify({ deliveryStatus: nextDeliveryStatus }),
      });
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || `HTTP ${res.status}`);
      }
      
      console.log('✅ Delivery status updated successfully');
    } catch (e) {
      console.error('❌ Failed to update delivery status:', e);
      await load();
      alert("Could not update delivery status: " + (e.message || "unknown error"));
    }
  }

  if (loading) {
    return <div className="rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-4 animate-pulse">Loading orders…</div>;
  }
  if (err) {
    return (
      <div className="p-4 rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--card))]">
        <div className="font-semibold mb-1">Couldn’t load orders</div>
        <div className="text-sm opacity-80">{err}</div>
        <button onClick={load} className="mt-3 rounded px-3 py-2 border border-[rgb(var(--border))] hover:bg-[rgba(var(--fg),0.05)]">Retry</button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold">Orders</h2>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
        {[
          ["Total Orders", kpis.total],
          ["Pending", kpis.pending],
          ["Processing", kpis.processing],
          ["Shipped", kpis.shipped],
          ["Delivered", kpis.delivered],
          ["Cancelled", kpis.cancelled],
        ].map(([label, value]) => (
          <div key={label} className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-4 transition-colors hover:bg-[rgba(var(--fg),0.02)]">
            <div className="text-sm opacity-80">{label}</div>
            <div className="text-3xl font-semibold mt-2">{value}</div>
          </div>
        ))}
      </div>

      {/* Controls */}
      <div className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-4">
        <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center">
          <div className="flex-1 flex items-center gap-2">
            <span>🔍</span>
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search orders…"
              className="w-full px-3 py-2 rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--bg))] transition-colors hover:border-[rgba(var(--accent-1),0.5)]"
            />
          </div>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="px-3 py-2 rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--bg))]"
          >
            <option>All</option>
            <option>PENDING</option>
            <option>CONFIRMED</option>
            <option>PROCESSING</option>
            <option>SHIPPED</option>
            <option>DELIVERED</option>
            <option>CANCELLED</option>
          </select>
        </div>
      </div>

      {/* Desktop grid — widen Products via 12-col layout */}
      <div className="hidden md:block rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] overflow-visible">
        {/* Header (12 cols) */}
        <div className="grid grid-cols-12 gap-x-8 items-center px-4 py-3 border-b border-[rgb(var(--border))] text-sm opacity-80">
          <div className="col-span-2">Order</div>
          <div className="col-span-2">Customer</div>
          <div className="col-span-4">Products</div>{/* ← wider */}
          <div className="col-span-1">Amount</div>
          <div className="col-span-2 text-center">Status</div>
          <div className="col-span-1">Date</div>
        </div>

        {filtered.map((o) => (
          <div
            key={o.id || o.orderNo}
            className={[
              "grid grid-cols-12 gap-x-8 items-center px-4 py-4 my-1",
              "rounded-xl border border-transparent",
              "transition-all duration-200 ease-out",
              "hover:-translate-y-0.5 hover:shadow-lg hover:bg-[rgba(var(--fg),0.03)] hover:border-[rgb(var(--border-hover))]",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(var(--accent-1),0.35)]",
              "border-t border-[rgb(var(--border))]",
              "cursor-pointer",
            ].join(" ")}
            onClick={() => setView(o)}
            role="button"
            aria-label={`View order ${o.orderNo}`}
          >
            {/* Order */}
            <div className="col-span-2 font-medium">{o.orderNo}</div>

            {/* Customer */}
            <div className="col-span-2 min-w-0">
              <div className="font-medium truncate">{o.customerName}</div>
              <div className="text-xs opacity-70 truncate">{o.customerCode}</div>
            </div>

            {/* Products (wider) */}
            <div className="col-span-4 text-sm opacity-90 min-w-0">
              <div className="truncate">{(o.products || []).join(", ")}</div>
            </div>

            {/* Amount (left-aligned to match Payments) */}
            <div className="col-span-1 font-semibold whitespace-nowrap [font-variant-numeric:tabular-nums]">
              {fmtINR(o.amount)}
            </div>

            {/* Status */}
            <div className="col-span-2 flex justify-center">
              <div className="flex flex-col items-center gap-1">
                <StatusPill value={o.deliveryStatus || 'PENDING'} />
                {o.timeRemaining !== null && o.status === 'PENDING' && (
                  <div className={`text-xs ${o.isExpired ? 'text-red-500' : 'text-amber-500'}`}>
                    {o.isExpired ? '⚠️ Expired' : `⏱️ ${o.timeRemaining}m`}
                  </div>
                )}
              </div>
            </div>

            {/* Date */}
            <div className="col-span-1 text-sm opacity-80 whitespace-nowrap [font-variant-numeric:tabular-nums]">
              {fmtDate(o.date)}
            </div>
          </div>
        ))}

        {filtered.length === 0 && (
          <div className="px-4 py-10 text-center opacity-70">No orders match your filters.</div>
        )}
      </div>

      {/* Mobile cards */}
      <div className="md:hidden space-y-3">
        {filtered.map((o) => (
          <div
            key={o.id || o.orderNo}
            className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-4 active:scale-[0.998] transition"
            onClick={() => setView(o)}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="font-medium">{o.orderNo}</div>
                <div className="text-sm opacity-80">
                  {o.customerName} <span className="opacity-60">({o.customerCode})</span>
                </div>
                <div className="mt-1 text-xs opacity-70 truncate">{(o.products || []).join(", ")}</div>
              </div>
              <div className="flex flex-col items-end gap-1">
                <StatusPill value={o.status} />
                {o.timeRemaining !== null && o.status === 'PENDING' && (
                  <div className={`text-xs ${o.isExpired ? 'text-red-500' : 'text-amber-500'}`}>
                    {o.isExpired ? '⚠️ Expired' : `⏱️ ${o.timeRemaining}m`}
                  </div>
                )}
              </div>
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span className="rounded-full px-2 py-0.5 border border-[rgb(var(--border))] text-xs">{fmtINR(o.amount)}</span>
              <span className="text-xs opacity-70">{fmtDate(o.date)}</span>
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-6 text-center opacity-70">
            No orders match your filters.
          </div>
        )}
      </div>

      {/* Modal */}
      <OrderModal order={view} onClose={() => setView(null)} onUpdateStatus={updateStatus} />
    </div>
  );
}
