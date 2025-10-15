import React from 'react';

// Helper functions
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

/* =================== Order Modal Component =================== */
export default function OrderModal({ order, detailedOrder, onClose, onUpdateStatus }) {
  if (!order) return null;
  
  // Use detailed order data if available, otherwise fall back to basic order data
  const displayOrder = detailedOrder || order;
  const statuses = ["PENDING", "CONFIRMED", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED"];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog" aria-modal="true"
      onClick={onClose}
      style={{ background: "rgba(0,0,0,0.5)" }}
    >
      <div
        className="relative w-[min(900px,95vw)] md:w-[min(1000px,95vw)] max-h-[90vh] overflow-y-auto rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between mb-6">
          <div>
            <h3 className="text-2xl font-semibold">Order Details</h3>
            <p className="text-sm opacity-70">Complete information for order {displayOrder.orderNo}</p>
          </div>
          <button onClick={onClose} className="opacity-70 hover:opacity-100 text-2xl" aria-label="Close">×</button>
        </div>

        {/* Order Status Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-[rgb(var(--bg))] rounded-lg p-4">
            <div className="text-sm opacity-70 mb-2">Order Information</div>
            <div className="font-medium text-lg">{displayOrder.orderNo}</div>
            {displayOrder.razorpayOrderId && (
              <div className="text-xs opacity-60 mt-1 break-all">Razorpay: {displayOrder.razorpayOrderId}</div>
            )}
          </div>
          
          <div className="bg-[rgb(var(--bg))] rounded-lg p-4">
            <div className="text-sm opacity-70 mb-2">Payment Status</div>
            <StatusPill value={displayOrder.paymentStatus} />
            {displayOrder.paymentMethod && (
              <div className="text-xs opacity-60 mt-1">via {displayOrder.paymentMethod}</div>
            )}
          </div>
          
          <div className="bg-[rgb(var(--bg))] rounded-lg p-4">
            <div className="text-sm opacity-70 mb-2">Delivery Status</div>
            <StatusPill value={displayOrder.deliveryStatus || 'PENDING'} />
            {displayOrder.isExpired && displayOrder.status === 'PENDING' && (
              <div className="text-xs text-red-500 mt-1">⚠️ Expired</div>
            )}
          </div>
        </div>

        {/* Customer Information */}
        <div className="bg-[rgb(var(--bg))] rounded-lg p-4 mb-6">
          <div className="text-sm font-semibold uppercase opacity-70 mb-3">Customer Information</div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span>👤</span>
                <span className="font-medium">{displayOrder.customerName}</span>
              </div>
              <div className="text-sm opacity-70">ID: {displayOrder.customerCode}</div>
              {displayOrder.userEmail && (
                <div className="text-sm opacity-70">Email: {displayOrder.userEmail}</div>
              )}
              {displayOrder.userPhone && (
                <div className="text-sm opacity-70">Phone: {displayOrder.userPhone}</div>
              )}
            </div>
            <div>
              {displayOrder.referenceCode && (
                <div className="flex items-center gap-2 mb-2">
                  <span>🔗</span>
                  <span className="font-medium">Referral Code: {displayOrder.referenceCode}</span>
                </div>
              )}
              <div className="text-sm opacity-70">Activation: {displayOrder.hasPaidActivation ? '✅ Paid' : '❌ Pending'}</div>
              <div className="text-sm opacity-70">First Order: {displayOrder.isFirstOrder ? 'Yes' : 'No'}</div>
            </div>
          </div>
        </div>

        {/* Shipping Information */}
        {(displayOrder.shippingName || displayOrder.shippingPhone || displayOrder.shippingAddress) && (
          <div className="bg-[rgb(var(--bg))] rounded-lg p-4 mb-6">
            <div className="text-sm font-semibold uppercase opacity-70 mb-3">Shipping Details</div>
            <div className="space-y-3">
              {displayOrder.shippingName && (
                <div className="flex items-center gap-2">
                  <span>📦</span>
                  <span className="font-medium">{displayOrder.shippingName}</span>
                </div>
              )}
              
              {displayOrder.shippingPhone && (
                <div className="flex items-center gap-2">
                  <span>📱</span>
                  <span>{displayOrder.shippingPhone}</span>
                </div>
              )}
              
              {displayOrder.shippingAddress && (
                <div className="flex items-start gap-2">
                  <span>📍</span>
                  <div className="flex-1">
                    <div>{displayOrder.shippingAddress}</div>
                    {(displayOrder.shippingCity || displayOrder.shippingState || displayOrder.shippingPincode) && (
                      <div className="opacity-80 mt-1">
                        {displayOrder.shippingCity && <span>{displayOrder.shippingCity}</span>}
                        {displayOrder.shippingCity && displayOrder.shippingState && <span>, </span>}
                        {displayOrder.shippingState && <span>{displayOrder.shippingState}</span>}
                        {displayOrder.shippingPincode && <span> - {displayOrder.shippingPincode}</span>}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Payment Details */}
        {displayOrder.razorpayPaymentId && (
          <div className="bg-[rgb(var(--bg))] rounded-lg p-4 mb-6">
            <div className="text-sm font-semibold uppercase opacity-70 mb-3">Payment Details</div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <div className="opacity-70">Payment Method</div>
                <div className="font-medium">{displayOrder.paymentMethod || 'RAZORPAY'}</div>
              </div>
              {displayOrder.razorpayPaymentId && (
                <div>
                  <div className="opacity-70">Payment ID</div>
                  <div className="font-medium break-all">{displayOrder.razorpayPaymentId}</div>
                </div>
              )}
              {displayOrder.razorpaySignature && (
                <div className="md:col-span-2">
                  <div className="opacity-70">Transaction Signature</div>
                  <div className="font-mono text-xs break-all">{displayOrder.razorpaySignature}</div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Products */}
        <div className="bg-[rgb(var(--bg))] rounded-lg p-4 mb-6">
          <div className="text-sm font-semibold uppercase opacity-70 mb-3">Products</div>
          <div className="space-y-3">
            {(displayOrder.products || []).map((product, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--card))]">
                <div>
                  <div className="font-medium">{product}</div>
                  <div className="text-sm opacity-70">MLM Activation Package</div>
                </div>
                <div className="text-right">
                  <div className="font-medium">{fmtINR(displayOrder.amount)}</div>
                  <div className="text-sm opacity-70">Qty: 1</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Order Summary & Actions */}
        <div className="bg-[rgb(var(--bg))] rounded-lg p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <div className="text-sm font-semibold uppercase opacity-70 mb-3">Order Summary</div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Order Date:</span>
                  <span>{fmtDate(displayOrder.date)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Total Amount:</span>
                  <span className="font-semibold text-lg">{fmtINR(displayOrder.amount)}</span>
                </div>
                {displayOrder.timeRemaining !== null && displayOrder.status === 'PENDING' && (
                  <div className={`text-sm ${displayOrder.isExpired ? 'text-red-500' : 'text-amber-500'}`}>
                    {displayOrder.isExpired ? '⏰ Order Expired' : `⏱️ ${displayOrder.timeRemaining} min remaining`}
                  </div>
                )}
                {displayOrder.description && (
                  <div className="text-sm opacity-70 mt-2">
                    <span className="font-medium">Notes:</span> {displayOrder.description}
                  </div>
                )}
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-semibold uppercase opacity-70 mb-3">Update Delivery Status</label>
              <select
                value={displayOrder.deliveryStatus || 'PENDING'}
                onChange={(e) => onUpdateStatus && onUpdateStatus(displayOrder, e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--card))] mb-4"
              >
                {statuses.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
              
              <div className="text-xs opacity-60">
                Current status: <span className="font-medium">{displayOrder.deliveryStatus || 'PENDING'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* System Information */}
        <div className="bg-[rgb(var(--bg))] rounded-lg p-4">
          <div className="text-sm font-semibold uppercase opacity-70 mb-3">System Information</div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs opacity-70">
            <div>
              <div>Transaction ID:</div>
              <div className="font-mono">{displayOrder.id}</div>
            </div>
            <div>
              <div>Created:</div>
              <div>{fmtDate(displayOrder.date)}</div>
            </div>
            <div>
              <div>Last Updated:</div>
              <div>{new Date().toLocaleString()}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
