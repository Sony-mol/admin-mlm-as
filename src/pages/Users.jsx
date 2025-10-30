import React, { useEffect, useMemo, useState } from 'react';
import Pagination from '../components/Pagination';
import { SkeletonUsersPage } from '../components/SkeletonLoader';
import ExportButton from '../components/ExportButton';
import EnhancedExportButton from '../components/EnhancedExportButton';
import ResponsiveTable from '../components/ResponsiveTable';
import { UserActions } from '../components/TableActions';
import {
  Calendar as CalendarIcon,
  ChevronLeft, ChevronRight,
  ChevronsLeft, ChevronsRight,
  X, Download, User
} from 'lucide-react';

import { API_ENDPOINTS } from '../config/api';

const fmtINR = (n) =>
  Number(n || 0).toLocaleString('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 });
const fmtDate = (iso) => (iso ? new Date(iso).toLocaleDateString('en-IN', { timeZone: "Asia/Kolkata" }) : '');

// Local YYYY-MM-DD (no timezone conversion to UTC)
const ymdLocal = (d) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

const titleCase = (s='') => s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
const normUpper = (s) => String(s || '').toUpperCase();
const levelNumFromString = (val) => {
  // "Level 1" -> 1 ; "1" -> 1 ; 1 -> 1 ; null -> null
  if (val == null) return null;
  const m = String(val).match(/(\d+)/);
  return m ? Number(m[1]) : null;
};

/* ---------- helpers for tier color ---------- */
const tierKey = (label = '') => {
  const s = String(label).toLowerCase();
  if (s.includes('gold')) return 'gold';
  if (s.includes('silver')) return 'silver';
  if (s.includes('bronze')) return 'bronze';
  if (s.includes('diamond')) return 'diamond';
  return '';
};

/* ---------- Shared: status pill ---------- */
function StatusPill({ value }) {
  const key = String(value || '').toLowerCase();
  const badgeClass =
    key === 'shipped' ? 'badge-modern badge-info' :
    key === 'delivered' ? 'badge-modern' :
    key === 'pending' || key === 'processing' ? 'badge-modern badge-warning' :
    key === 'active' || key === 'approved' || key === 'completed' ? 'badge-modern badge-success' :
    key === 'suspended' || key === 'cancelled' || key === 'canceled' || key === 'rejected' ? 'badge-modern badge-danger' :
    'badge-modern badge-info';
  return (
    <span className={badgeClass}>
      {value || '—'}
    </span>
  );
}

function Chip({ children, className = '' }) {
  return (
    <span className={`px-2 py-0.5 text-xs rounded-full border border-[rgb(var(--border))] bg-[rgba(var(--fg),0.06)] ${className}`}>
      {children}
    </span>
  );
}

/* =================== Calendar Popover (multi-date) =================== */
function CalendarPopover({ open, onClose, selectedDates, onToggleDate, onClear }) {
  const [view, setView] = React.useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });

  React.useEffect(() => {
    if (!open) return;
    const onEsc = (e) => e.key === 'Escape' && onClose?.();
    const onOutside = (e) => {
      const pop = document.getElementById('calendar-popover');
      if (pop && !pop.contains(e.target)) onClose?.();
    };
    window.addEventListener('keydown', onEsc);
    window.addEventListener('mousedown', onOutside);
    return () => {
      window.removeEventListener('keydown', onEsc);
      window.removeEventListener('mousedown', onOutside);
    };
  }, [open, onClose]);

  if (!open) return null;

  const monthStart = new Date(view.getFullYear(), view.getMonth(), 1);
  const monthEnd = new Date(view.getFullYear(), view.getMonth() + 1, 0);
  const startOffset = monthStart.getDay(); // 0=Sun
  const daysInMonth = monthEnd.getDate();
  const todayISO = ymdLocal(new Date());

  const grid = [];
  for (let i = 0; i < startOffset; i++) grid.push(null);
  for (let d = 1; d <= daysInMonth; d++) {
    const asDate = new Date(view.getFullYear(), view.getMonth(), d);
    const iso = ymdLocal(asDate);
    grid.push({ day: d, iso });
  }

  const monthLabel = view.toLocaleString('en-IN', { month: 'long' });
  const year = view.getFullYear();

  const cellBase = 'w-9 h-9 grid place-items-center rounded-md text-sm cursor-pointer select-none';
  const btnBase = 'rounded-lg px-2 py-1 border border-[rgb(var(--border))] hover:bg-[rgba(var(--fg),0.05)]';

  return (
    <div
      id="calendar-popover"
      className="absolute z-50 mt-2 right-0 w-[min(340px,92vw)] modern-card shadow-2xl"
      role="dialog"
      aria-modal="true"
      onClick={(e) => e.stopPropagation()}
    >
      {/* Header */}
      <div className="p-3 flex items-center justify-between border-b border-[rgb(var(--border))] gap-2">
        <div className="flex items-center gap-1">
          <button className={btnBase} onClick={() => setView(new Date(view.getFullYear(), view.getMonth() - 1, 1))}>
            <ChevronLeft size={18} />
          </button>
          <button className={btnBase} onClick={() => setView(new Date(view.getFullYear(), view.getMonth() + 1, 1))}>
            <ChevronRight size={18} />
          </button>
        </div>
        <div className="flex items-center gap-2">
          <div className="font-medium">{monthLabel}</div>
          <div className="font-medium">{year}</div>
        </div>
        <div className="flex items-center gap-1">
          <button className={btnBase} onClick={() => setView(new Date(view.getFullYear() - 1, view.getMonth(), 1))}>
            <ChevronsLeft size={18} />
          </button>
          <button className={btnBase} onClick={() => setView(new Date(view.getFullYear() + 1, view.getMonth(), 1))}>
            <ChevronsRight size={18} />
          </button>
        </div>
      </div>

      {/* Weekdays */}
      <div className="px-3 pt-3 grid grid-cols-7 gap-1 text-xs opacity-70">
        {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map((d) => (
          <div key={d} className="text-center">{d}</div>
        ))}
      </div>

      {/* Days */}
      <div className="px-3 pb-3 grid grid-cols-7 gap-1">
        {grid.map((cell, i) => {
          if (!cell) return <div key={i} />;
          const isSelected = selectedDates.has(cell.iso);
          const isToday = todayISO === cell.iso;

          const cls = [
            cellBase,
            isSelected
              ? 'bg-[rgba(var(--accent-1),0.18)] text-[rgb(var(--accent-1))] border border-[rgba(var(--accent-1),0.35)]'
              : 'hover:bg-[rgba(var(--fg),0.06)] border border-transparent',
            isToday && !isSelected ? 'ring-1 ring-[rgb(var(--border))]' : '',
          ].join(' ');

          return (
            <button
              key={cell.iso}
              className={cls}
              onClick={() => onToggleDate?.(cell.iso)} // keep popover open for multi-select
              title={cell.iso}
            >
              {cell.day}
            </button>
          );
        })}
      </div>

      {/* Footer actions */}
      <div className="p-3 flex items-center justify-between border-t border-[rgb(var(--border))]">
        <div className="flex items-center gap-2">
          <button className={btnBase} onClick={() => onToggleDate?.(todayISO)}>Today</button>
          <button className={btnBase} onClick={onClear}>Clear</button>
        </div>
        <button className={btnBase} onClick={onClose}>Done</button>
      </div>
    </div>
  );
}

/* =================== Details Modal (responsive) =================== */
function UserModal({ user, onClose }) {
  if (!user) return null;
  const [details, setDetails] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [err, setErr] = React.useState(null);

  React.useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        setErr(null);
        const token = localStorage.getItem('auth') ? JSON.parse(localStorage.getItem('auth')).accessToken : '';
        const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
        const res = await fetch(`${API_ENDPOINTS.USERS}/${user.id}`, { headers, cache: 'no-store' });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        if (mounted) setDetails(data);
      } catch (e) {
        if (mounted) setErr(e.message || 'Failed to load user');
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [user?.id]);

  const u = details || user; // prefer real details when loaded
  const combined = [u.tier, u.level].filter(Boolean).join(' ') || '—';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      aria-modal="true"
      role="dialog"
      onClick={onClose}
      style={{ background: 'rgba(0,0,0,0.5)' }}
    >
      <div
        className="relative w-[min(720px,92vw)] md:w-[min(860px,92vw)] max-h-[90vh] overflow-y-auto modern-card p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-xl font-semibold">User Details</h3>
            <p className="text-sm opacity-70">Complete information about {u.name}</p>
          </div>
          <button onClick={onClose} className="opacity-70 hover:opacity-100 text-xl" aria-label="Close">×</button>
        </div>

        {loading ? (
          <div className="py-12 text-center opacity-70">Loading user…</div>
        ) : err ? (
          <div className="py-12 text-center text-red-600">{err}</div>
        ) : (
        <div className="grid md:grid-cols-2 gap-6 mt-6">
          <div className="space-y-2">
            <div className="text-sm opacity-70">Referral Code</div>
            <div className="font-medium">{u.referenceCode || u.code || '--'}</div>

            <div className="text-sm opacity-70 mt-4">Email</div>
            <div className="font-medium break-all">{u.email}</div>

            {(u.phone || u.phoneNumber) && (
              <>
                <div className="text-sm opacity-70 mt-4">Phone</div>
                <div className="font-medium">{u.phone || u.phoneNumber}</div>
              </>
            )}

            <div className="text-sm opacity-70 mt-4">Joined</div>
            <div className="font-medium">{fmtDate(u.createdAt || u.joinDate)}</div>

            <div className="text-sm opacity-70 mt-4">Referrer</div>
            <div className="font-medium">
              {(u.referrerCode || u.referredByCode) && (u.referrerCode || u.referredByCode) !== '--' ? (
                <div>
                  <div>Code: {u.referrerCode || u.referredByCode}</div>
                  {u.referrerName && <div className="text-sm opacity-70">Name: {u.referrerName}</div>}
                  {u.referrerEmail && <div className="text-sm opacity-70">Email: {u.referrerEmail}</div>}
                </div>
              ) : (
                '--'
              )}
            </div>
          </div>

          <div className="space-y-3">
            <div className="text-sm opacity-70">Tier / Level</div>
            <div className="flex flex-wrap gap-2">
              {u.tier && <Chip className="!bg-transparent" data-tier={tierKey(u.tier)}>{u.tier}</Chip>}
              {u.level && <Chip>{u.level}</Chip>}
              {!user.tier && !user.level && <span className="text-sm opacity-60">{combined}</span>}
            </div>

            <div className="mt-6 grid grid-cols-2 gap-4">
              <div className="rounded-xl border border-[rgb(var(--border))] p-4 text-center">
                <div className="text-2xl font-bold">{Number(u.referralCount || u.referrals || 0).toLocaleString('en-IN')}</div>
                <div className="text-sm opacity-70">Total Referrals</div>
              </div>
              <div className="rounded-xl border border-[rgb(var(--border))] p-4 text-center">
                <UserFinancials userId={u.userId || u.id} />
              </div>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-4">
              <div className="rounded-xl border border-[rgb(var(--border))] p-4">
                <div className="text-xs opacity-70">Status</div>
                <div className="mt-1"><StatusPill value={u.status} /></div>
              </div>
              <div className="rounded-xl border border-[rgb(var(--border))] p-4">
                <div className="text-xs opacity-70">Role</div>
                <div className="mt-1 text-sm font-medium">{u.role || 'USER'}</div>
              </div>
              <div className="rounded-xl border border-[rgb(var(--border))] p-4">
                <div className="text-xs opacity-70">Has Paid Activation</div>
                <div className="mt-1 text-sm font-medium">{String(u.hasPaidActivation ?? '—')}</div>
              </div>
              <div className="rounded-xl border border-[rgb(var(--border))] p-4">
                <div className="text-xs opacity-70">User ID</div>
                <div className="mt-1 text-sm font-medium">{u.userId || u.id || '—'}</div>
              </div>
              <div className="rounded-xl border border-[rgb(var(--border))] p-4 col-span-2">
                <div className="text-xs opacity-70">Referred By</div>
                <div className="mt-1 text-sm font-medium">{u.referredByUser || u.referredByCode || '—'}</div>
              </div>
              <div className="rounded-xl border border-[rgb(var(--border))] p-4">
                <div className="text-xs opacity-70">Created At</div>
                <div className="mt-1 text-sm font-medium">{fmtDate(u.createdAt)}</div>
              </div>
              <div className="rounded-xl border border-[rgb(var(--border))] p-4">
                <div className="text-xs opacity-70">Updated At</div>
                <div className="mt-1 text-sm font-medium">{fmtDate(u.updatedAt)}</div>
              </div>
            </div>
          </div>
        </div>
        )}
      </div>
    </div>
  );
}

function UserFinancials({ userId }) {
  const [earnings, setEarnings] = React.useState(null);
  const [balance, setBalance] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [err, setErr] = React.useState(null);

  React.useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        setErr(null);
        const token = localStorage.getItem('auth') ? JSON.parse(localStorage.getItem('auth')).accessToken : '';
        const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
        const [earnRes, balRes] = await Promise.all([
          fetch(`/api/commissions/total/${userId}`, { headers, cache: 'no-store' }),
          fetch(`${API_ENDPOINTS.ADMIN_USER_BALANCE}/${userId}/balance`, { headers, cache: 'no-store' })
        ]);
        const earnJson = earnRes.ok ? await earnRes.json() : {};
        const balJson = balRes.ok ? await balRes.json() : {};
        if (mounted) {
          setEarnings(earnJson.totalEarnings ?? earnJson.totalCommissions ?? 0);
          setBalance(balJson.currentBalance ?? balJson.approvedBalance ?? 0);
        }
      } catch (e) {
        if (mounted) setErr(e.message || 'Failed to load finances');
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [userId]);

  if (loading) return <div className="text-sm opacity-70">Loading…</div>;
  if (err) return <div className="text-sm text-red-600">{err}</div>;

  return (
    <div className="text-center">
      <div className="text-2xl font-bold">{fmtINR(earnings)}</div>
      <div className="text-sm opacity-70">Total Earnings</div>
      <div className="mt-3 text-xs opacity-70">Present Wallet Balance: <span className="font-medium">{fmtINR(balance)}</span></div>
    </div>
  );
}

function UserEarningsOnly({ userId }) {
  const [earnings, setEarnings] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [err, setErr] = React.useState(null);

  React.useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        setErr(null);
        const token = localStorage.getItem('auth') ? JSON.parse(localStorage.getItem('auth')).accessToken : '';
        const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
        const earnRes = await fetch(`/api/commissions/total/${userId}`, { headers, cache: 'no-store' });
        const earnJson = earnRes.ok ? await earnRes.json() : {};
        if (mounted) {
          setEarnings(earnJson.totalEarnings ?? earnJson.totalCommissions ?? 0);
        }
      } catch (e) {
        if (mounted) setErr(e.message || 'Failed to load earnings');
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [userId]);

  if (loading) return <div className="text-sm opacity-70">Loading…</div>;
  if (err) return <div className="text-sm text-red-600">{err}</div>;

  return <div className="font-medium">{fmtINR(earnings)}</div>;
}

/* =================== Edit User Modal =================== */
function EditUserModal({ user, onClose, onSave, loading }) {
  const [formData, setFormData] = useState({
    name: user.name || '',
    email: user.email || '',
    phoneNumber: user.phoneNumber || '',
    status: user.status || 'ACTIVE'
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    await onSave(user.id, formData);
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.5)" }}>
      <div className="relative w-[min(500px,90vw)] modern-card p-6 shadow-2xl">
        <div className="mb-6">
          <h3 className="text-xl font-semibold">Edit User</h3>
          <p className="text-sm text-gray-600 mt-1">Update user information</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Email</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => handleChange('email', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Phone Number</label>
            <input
              type="tel"
              value={formData.phoneNumber}
              onChange={(e) => handleChange('phoneNumber', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Status</label>
            <select
              value={formData.status}
              onChange={(e) => handleChange('status', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="ACTIVE">Active</option>
              <option value="SUSPENDED">Suspended</option>
              <option value="INACTIVE">Inactive</option>
            </select>
          </div>

          <div className="flex gap-3 justify-end pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 rounded-lg bg-gray-500 text-white hover:bg-gray-600 transition-colors"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors"
              disabled={loading}
            >
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* =================== Page =================== */
export default function Users() {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);
  const [success, setSuccess] = useState(null);

  const [q, setQ] = useState('');
  const [status, setStatus] = useState('ALL');     // normalized
  const [tier, setTier] = useState('ALL');         // dynamic from TIER_STRUCTURE
  const [level, setLevel] = useState('ALL');       // dynamic from TIER_STRUCTURE ("Level X")
  const [joinedFrom, setJoinedFrom] = useState('');
  const [joinedTo, setJoinedTo] = useState('');
  const [selected, setSelected] = useState(null);

  // management
  const [editingUser, setEditingUser] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);

  // bulk
  const [selectedUsers, setSelectedUsers] = useState(new Set());
  const [bulkAction, setBulkAction] = useState('');

  // calendar filters
  const [selectedDates, setSelectedDates] = useState(() => new Set());
  const [calOpen, setCalOpen] = useState(false);

  // Sync referral counts
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState(null);

  // Tier structure state
  const [tierStructure, setTierStructure] = useState(null); // raw JSON from API
  const [tierLoading, setTierLoading] = useState(false);

  // ===== Load users + tier structure =====
  async function loadUsers() {
    try {
      setLoading(true);
      const token = localStorage.getItem('auth') ? JSON.parse(localStorage.getItem('auth')).accessToken : '';
      const headers = { 'Authorization': `Bearer ${token}` };

      // Prefer optimized paginated endpoint; gracefully fall back to full list
      const qs = new URLSearchParams();
      // Spring Data uses 0-based pages
      qs.set('page', String(Math.max(0, page - 1)));
      qs.set('size', String(pageSize));
      // Align with created_at index for default sort
      qs.set('sort', 'createdAt,DESC');
      if (q && q.trim()) qs.set('q', q.trim());
      if (status !== 'ALL') qs.set('status', status);
      if (tier !== 'ALL') qs.set('tier', tier);
      if (level !== 'ALL') qs.set('level', String(levelNumFromString(level)));
      if (joinedFrom) qs.set('from', joinedFrom);
      if (joinedTo) qs.set('to', joinedTo);

      let res = await fetch(`${API_ENDPOINTS.USERS_PAGINATED}?${qs.toString()}`, { headers, cache: 'no-store' });
      // If paginated endpoint not available, fall back
      if (!res.ok) {
        console.warn('⚠️ Paginated endpoint unavailable, falling back to /users');
        res = await fetch(API_ENDPOINTS.USERS, { headers, cache: 'no-store' });
      }

      if (res.ok) {
        const payload = await res.json();
        // Support both array and Spring Page response shapes
        const realUsers = Array.isArray(payload) ? payload : (payload.content || payload.users || []);
        const totalFromServer = Array.isArray(payload) ? realUsers.length : (payload.totalElements ?? payload.total ?? realUsers.length);
        console.log('✅ Users fetched successfully (optimized when available). Count:', realUsers.length, 'Total:', totalFromServer);
        const transformedUsers = realUsers.map(user => ({
          id: user.id,
          code: user.referenceCode || '--',
          name: user.name,
          email: user.email,
          phone: user.phoneNumber || 'N/A',
          joinDate: user.createdAt || new Date().toISOString(),
          status: user.status,                  // "ACTIVE" | "SUSPENDED" | ...
          tier: user.tier || null,              // e.g., "BRONZE"
          level: user.level || null,            // e.g., "Level 1"
          referrals: user.referralCount || 0,
          earnings: user.walletBalance || 0,
          upline: user.referredByCode || '--',
          role: user.role || 'USER',
          referrerName: user.referrerName || null,
          referrerEmail: user.referrerEmail || null,
          referrerCode: user.referredByCode || '--'
        }));
        // If server sorted by createdAt,DESC this keeps order; otherwise sort locally
        if (!Array.isArray(payload)) {
          // assume already sorted
          setList(transformedUsers);
        } else {
          transformedUsers.sort((a, b) => new Date(b.joinDate || 0) - new Date(a.joinDate || 0));
          setList(transformedUsers);
        }
        // Track total for server-side pagination UI
        setServerTotal(totalFromServer);
        setErr(null);
      } else {
        setErr(`Couldn't load users: ${res.status}`);
      }
    } catch (e) {
      setErr(e.message || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  }

  async function loadTierStructure() {
    try {
      setTierLoading(true);
      const token = localStorage.getItem('auth') ? JSON.parse(localStorage.getItem('auth')).accessToken : '';
      const headers = { 'Authorization': `Bearer ${token}` };
      const res = await fetch(API_ENDPOINTS.TIER_STRUCTURE, { headers, cache: 'no-store' });
      if (!res.ok) throw new Error(`Tier structure load failed: ${res.status}`);
      const data = await res.json();
      setTierStructure(data);
    } catch (e) {
      console.error('Tier structure error:', e);
      setTierStructure(null); // fallback will kick in later
    } finally {
      setTierLoading(false);
    }
  }

  useEffect(() => {
    // load both, independently
    loadUsers();
    loadTierStructure();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ===== Dynamic Options from tierStructure =====
  const dynamicTierOptions = useMemo(() => {
    // returns array like: ['ALL', 'BRONZE', 'SILVER', 'GOLD', 'DIAMOND', ...] in UPPER
    if (!tierStructure || typeof tierStructure !== 'object') {
      // fallback from user list tiers if structure not available
      const uniq = new Set(list.map(u => normUpper(u.tier)).filter(Boolean));
      return ['ALL', ...Array.from(uniq).sort()];
    }
    const keys = Object.keys(tierStructure); // e.g., ['gold','diamond','silver','demo','bronze']
    const uppers = keys.map(k => normUpper(k));
    return ['ALL', ...Array.from(new Set(uppers)).sort()];
  }, [tierStructure, list]);

  const dynamicLevelOptions = useMemo(() => {
    // If a tier is selected (not ALL), show only that tier's levels; otherwise show all levels across tiers.
    const labelFor = (n) => `Level ${n}`;
    const numbers = new Set();

    if (tierStructure && typeof tierStructure === 'object') {
      const pushLevels = (arr=[]) => {
        for (const x of arr) if (x && typeof x.level === 'number') numbers.add(x.level);
      };

      if (tier !== 'ALL') {
        // find matching key in any case
        const matchKey = Object.keys(tierStructure).find(k => normUpper(k) === tier);
        if (matchKey) pushLevels(tierStructure[matchKey]);
      } else {
        for (const k of Object.keys(tierStructure)) pushLevels(tierStructure[k]);
      }
    } else {
      // fallback from users if structure missing
      for (const u of list) {
        const n = levelNumFromString(u.level);
        if (n != null) numbers.add(n);
      }
    }

    const arr = Array.from(numbers).sort((a,b) => a - b).map(n => labelFor(n));
    return ['ALL', ...arr];
  }, [tierStructure, tier, list]);

  // ===== Sync referral counts (unchanged) =====
  async function syncReferralCounts() {
    try {
      setSyncing(true);
      setSyncResult(null);
      const token = localStorage.getItem('auth') ? JSON.parse(localStorage.getItem('auth')).accessToken : '';
      const headers = { 'Authorization': `Bearer ${token}` };
      const response = await fetch(`${API_ENDPOINTS.USERS}/sync-referral-counts`, {
        method: 'POST',
        headers
      });
      if (!response.ok) throw new Error(`Sync failed with status: ${response.status}`);
      const result = await response.json();
      setSyncResult({
        success: true,
        message: result.message,
        discrepanciesFound: result.discrepanciesFound,
        usersUpdated: result.usersUpdated,
        totalUsers: result.totalUsers
      });
      await loadUsers();
    } catch (error) {
      setSyncResult({
        success: false,
        message: 'Failed to sync referral counts: ' + error.message
      });
    } finally {
      setSyncing(false);
    }
  }

  // ===== Actions (unchanged) =====
  async function updateUserStatus(userId, newStatus) {
    try {
      setActionLoading(true);
      const token = localStorage.getItem('auth') ? JSON.parse(localStorage.getItem('auth')).accessToken : '';
      const headers = { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' };
      const response = await fetch(`${API_ENDPOINTS.USERS}/${userId}/status`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({ status: newStatus })
      });
      if (response.ok) {
        await loadUsers();
        setSelected(null);
      } else {
        setErr(`Failed to update user status: ${response.status}`);
      }
    } catch (error) {
      setErr('Failed to update user status');
    } finally {
      setActionLoading(false);
    }
  }

  async function updateUserDetails(userId, userData) {
    try {
      setActionLoading(true);
      const token = localStorage.getItem('auth') ? JSON.parse(localStorage.getItem('auth')).accessToken : '';
      const headers = { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' };
      const response = await fetch(`${API_ENDPOINTS.USERS}/${userId}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(userData)
      });
      if (response.ok) {
        await loadUsers();
        setEditingUser(null);
      } else {
        setErr(`Failed to update user details: ${response.status}`);
      }
    } catch (error) {
      setErr('Failed to update user details');
    } finally {
      setActionLoading(false);
    }
  }

  // Deleting users is disabled; function intentionally removed

  function confirmUserAction(user, action) {
    // Close user details modal if open
    setSelected(null);
    
    // Increase delay to 300ms to ensure modal animation completes
    setTimeout(() => {
      setConfirmAction({
        user,
        action,
        message: action === 'suspend' 
          ? `Are you sure you want to suspend ${user.name}? They will not be able to access the system.`
          : action === 'activate'
          ? `Are you sure you want to activate ${user.name}? They will regain access to the system.`
          : `Are you sure you want to DELETE ${user.name}? This action cannot be undone and will permanently remove the user and all their data.`
      });
    }, 300);
  }

  async function executeConfirmedAction() {
    if (!confirmAction) return;
    const { user, action } = confirmAction;
    if (action === 'delete') {
      // deletion disabled
      setConfirmAction(null);
      return;
    } else {
      const newStatus = action === 'suspend' ? 'SUSPENDED' : 'ACTIVE';
      await updateUserStatus(user.id, newStatus);
    }
    setConfirmAction(null);
  }

  // ===== Bulk =====
  const toggleUserSelection = (userId) => {
    setSelectedUsers(prev => {
      const s = new Set(prev);
      s.has(userId) ? s.delete(userId) : s.add(userId);
      return s;
    });
  };
  const selectAllUsers = () => setSelectedUsers(new Set(filtered.map(u => u.id)));
  const clearUserSelection = () => setSelectedUsers(new Set());

  const confirmBulkUserAction = () => {
    if (selectedUsers.size === 0 || !bulkAction) {
      alert('Please select users and choose an action.');
      return;
    }
    const actionText = bulkAction === 'SUSPENDED' ? 'suspend' : 'activate';
    const selectedUserNames = filtered.filter(u => selectedUsers.has(u.id)).map(u => u.name).slice(0, 3).join(', ');
    const moreCount = selectedUsers.size > 3 ? ` and ${selectedUsers.size - 3} more` : '';
    setConfirmAction({
      isBulk: true,
      action: bulkAction,
      message: `Are you sure you want to ${actionText} ${selectedUsers.size} users?`,
      details: `Users: ${selectedUserNames}${moreCount}`,
      actionColor: bulkAction === 'SUSPENDED' ? 'red' : 'green'
    });
  };

  const executeConfirmedBulkAction = async () => {
    if (!confirmAction || !confirmAction.isBulk) return;
    await handleBulkUserUpdate();
    setConfirmAction(null);
  };

  const handleBulkUserUpdate = async () => {
    try {
      setActionLoading(true);
      const token = localStorage.getItem('auth') ? JSON.parse(localStorage.getItem('auth')).accessToken : '';
      const headers = { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' };
      const updatePromises = Array.from(selectedUsers).map(async (userId) => {
        const response = await fetch(`${API_ENDPOINTS.USERS}/${userId}/status`, {
          method: 'PUT', headers, body: JSON.stringify({ status: bulkAction })
        });
        if (!response.ok) throw new Error(`Failed to update user ${userId}`);
        return { userId, success: true };
      });
      const results = await Promise.allSettled(updatePromises);
      const successful = results.filter(r => r.status === 'fulfilled').length;
      const failed = results.filter(r => r.status === 'rejected').length;
      alert(`Bulk update completed: ${successful} successful, ${failed} failed`);
      setSelectedUsers(new Set());
      setBulkAction('');
      await loadUsers();
    } catch (error) {
      alert('Failed to update users. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };

  // ===== Filtering =====
  const filtered = useMemo(() => {
    return list.filter(u => {
      const matchQ =
        q.trim() === '' ||
        [u.name, u.email, u.code].some(x => String(x || '').toLowerCase().includes(q.toLowerCase()));

      // status normalized
      const matchStatus = status === 'ALL' || normUpper(u.status) === status;

      // tier normalized (user has 'BRONZE', structure keys can be 'bronze' etc.)
      const matchTier = tier === 'ALL' || normUpper(u.tier) === tier;

      // level: compare by numeric level (robust to "Level 1" vs 1)
      const selectedLevelNum = level === 'ALL' ? null : levelNumFromString(level);
      const userLevelNum = levelNumFromString(u.level);
      const matchLevel = selectedLevelNum == null || (userLevelNum != null && userLevelNum === selectedLevelNum);

      // Join date
      const hasDateFilter = selectedDates.size > 0;
      const matchDate =
        !hasDateFilter ||
        (() => {
          try {
            if (!u.joinDate) return false;
            const jiso = ymdLocal(new Date(u.joinDate));
            return selectedDates.has(jiso);
          } catch {
            return false;
          }
        })();

      const ts = u.joinDate ? new Date(u.joinDate).getTime() : 0;
      const joinedFromOk = !joinedFrom || ts >= new Date(joinedFrom + 'T00:00:00').getTime();
      const joinedToOk = !joinedTo || ts <= new Date(joinedTo + 'T23:59:59').getTime();

      return matchQ && matchStatus && matchTier && matchLevel && matchDate && joinedFromOk && joinedToOk;
    });
  }, [list, q, status, tier, level, selectedDates, joinedFrom, joinedTo]);

  // ===== Pagination =====
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [serverTotal, setServerTotal] = useState(null); // when using server-side pagination
  // Read initial pagination from URL once
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const p = parseInt(params.get('page') || '1', 10);
    const s = parseInt(params.get('size') || '20', 10);
    // filters
    const qParam = params.get('q');
    const stParam = params.get('status');
    const tierParam = params.get('tier');
    const levelParam = params.get('level');
    const fromParam = params.get('from');
    const toParam = params.get('to');
    if (isFinite(p) && p > 0) setPage(p);
    if (isFinite(s) && s > 0) setPageSize(s);
    if (qParam != null) setQ(qParam);
    if (stParam) setStatus(stParam);
    if (tierParam) setTier(tierParam);
    if (levelParam) setLevel(levelParam);
    if (fromParam) setJoinedFrom(fromParam);
    if (toParam) setJoinedTo(toParam);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  // Keep URL in sync on change
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    params.set('page', String(page));
    params.set('size', String(pageSize));
    if (q) params.set('q', q); else params.delete('q');
    if (status && status !== 'ALL') params.set('status', status); else params.delete('status');
    if (tier && tier !== 'ALL') params.set('tier', tier); else params.delete('tier');
    if (level && level !== 'ALL') params.set('level', level); else params.delete('level');
    if (joinedFrom) params.set('from', joinedFrom); else params.delete('from');
    if (joinedTo) params.set('to', joinedTo); else params.delete('to');
    window.history.replaceState({}, '', `${window.location.pathname}?${params.toString()}`);
  }, [page, pageSize, q, status, tier, level, joinedFrom, joinedTo]);
  useEffect(() => { setPage(1); }, [q, status, tier, level, selectedDates, joinedFrom, joinedTo]);
  // When server pagination is active, we show current page slice directly from list
  const paged = useMemo(() => {
    if (serverTotal != null) return list; // list already represents the current page
    const start = (page - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, list, page, pageSize, serverTotal]);

  // Re-fetch when pagination or filters change to leverage indexes on backend
  useEffect(() => {
    loadUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, pageSize, q, status, tier, level, joinedFrom, joinedTo]);

  // ===== Export helpers (unchanged) =====
  function mapUsersToUserDetailsRows(users) {
    return users.map((u) => ({
      'User Id': u.code || u.id || '',
      'User Name': u.name || '',
      'Mail': u.email || '',
      'Phone Number': u.phone || '',
      'Join Date': u.joinDate ? new Date(u.joinDate) : '',
      'Referrals': Number(u.referrals ?? 0),
      'Tier': u.tier || '',
      'Level': u.level || '',
      'Referrence_Id': u.sponsorCode || u.upline || '',
      'Status': u.status || '',
    }));
  }

  function autoFitColumns(rows, header, fixed = {}) {
    const cols = header.map((h) => fixed[h] ? { key: h, wch: fixed[h] } : { key: h, wch: Math.max(10, String(h).length + 2) });
    for (const row of rows) {
      header.forEach((h, i) => {
        if (fixed[h]) return;
        const s = row[h] == null ? '' : String(row[h]);
        const len = s.length + 2;
        if (len > cols[i].wch) cols[i].wch = Math.min(60, len);
      });
    }
    return cols;
  }

  async function handleExport(usersToExport) {
    try {
      const XLSX = await import('xlsx');
      const rows = mapUsersToUserDetailsRows(usersToExport);
      const ws = XLSX.utils.json_to_sheet(rows, { skipHeader: false });
      const header = ['User Id','User Name','Mail','Phone Number','Join Date','Referrals','Tier','Level','Referrence_Id','Status'];
      XLSX.utils.sheet_add_aoa(ws, [header], { origin: 'A1' });
      ws['!cols'] = autoFitColumns(rows, header, { 'Join Date': 12 });
      const range = XLSX.utils.decode_range(ws['!ref'] || 'A1');
      const dateCol = header.indexOf('Join Date');
      const refCol  = header.indexOf('Referrals');
      for (let r = 1; r <= range.e.r; r++) {
        if (dateCol >= 0) {
          const addrD = XLSX.utils.encode_cell({ r, c: dateCol });
          const cellD = ws[addrD];
          if (cellD) cellD.z = 'yyyy-mm-dd';
        }
        if (refCol >= 0) {
          const addrN = XLSX.utils.encode_cell({ r, c: refCol });
          const cellN = ws[addrN];
          if (cellN) {
            const n = Number(cellN.v ?? 0);
            cellN.v = Number.isFinite(n) ? n : 0;
            cellN.t = 'n';
            cellN.z = '0';
          }
        }
      }
      ws['!autofilter'] = { ref: ws['!ref'] };
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'User Details');
      XLSX.writeFile(wb, 'MLM_Users_Data.xlsx');
    } catch (e) {
      console.error(e);
      alert('Export failed: ' + (e?.message || 'Unknown error'));
    }
  }

  // ===== UI ===== Show structure immediately, no loading blocker
  const showSkeleton = loading && list.length === 0;
  
  if (err && list.length === 0) {
    return (
      <div className="p-4 rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--card))]">
        <div className="font-semibold mb-1">Couldn't load users</div>
        <div className="text-sm opacity-80">{err}</div>
        <button onClick={loadUsers} className="mt-3 rounded px-3 py-2 border border-[rgb(var(--border))] hover:bg-[rgba(var(--fg),0.05)]">Retry</button>
      </div>
    );
  }
  if (success) {
    return (
      <div className="p-4 rounded-xl border border-green-200 bg-green-50">
        <div className="font-semibold mb-1 text-green-800">✅ Success!</div>
        <div className="text-sm text-green-700">{success}</div>
        <button onClick={() => setSuccess(null)} className="mt-3 rounded px-3 py-2 bg-green-600 text-white hover:bg-green-700">Close</button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Sync Result Notification */}
      {syncResult && (
        <div className={`rounded-2xl border p-4 ${syncResult.success ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className={`font-semibold mb-1 ${syncResult.success ? 'text-green-800' : 'text-red-800'}`}>
                {syncResult.success ? '✅ Synchronization Complete!' : '❌ Synchronization Failed'}
              </div>
              <div className={`text-sm ${syncResult.success ? 'text-green-700' : 'text-red-700'}`}>
                {syncResult.message}
              </div>
            </div>
            <button 
              onClick={() => setSyncResult(null)} 
              className={`ml-4 px-3 py-1 rounded-lg ${syncResult.success ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'} text-white text-sm`}
            >
              Close
            </button>
          </div>
        </div>
      )}
      
      {/* Header row with Sync and Export buttons */}
      <div className="flex items-center gap-3">
        <h2 className="text-2xl font-semibold flex-1">User Management</h2>
        <div className="flex items-center gap-2">
          <span className="text-sm opacity-70">{selectedUsers.size} selected</span>
          {selectedUsers.size > 0 && (
            <button onClick={clearUserSelection} className="text-xs px-2 py-1 rounded border border-[rgb(var(--border))] hover:bg-[rgba(var(--fg),0.05)]">
              Clear
            </button>
          )}
        </div>
        <EnhancedExportButton
          data={filtered}
          dataType="users"
          filename="users"
          currentFilters={{
            search: q,
            tier: tier,
            status: status,
            level: level,
            joinedFrom: joinedFrom,
            joinedTo: joinedTo
          }}
          currentSort={null}
          showAdvancedOptions={true}
          defaultFormat="excel"
          isDataPreFiltered={true}
          totalRecords={list.length}
        />
        <button
          onClick={syncReferralCounts}
          disabled={syncing}
          className="rounded-lg px-3 py-2 bg-blue-600 text-white hover:bg-blue-700 shadow-sm focus-visible:outline-none focus-visible:ring-2 
         focus-visible:ring-blue-600/40 active:scale-[0.98] transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"          
          title="Sync referral counts with actual database records"
          aria-label="Sync referral counts"
        >
          {syncing ? (
            <>
              <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Syncing...
            </>
          ) : (
            <>🔄 Sync Referrals</>
          )}
        </button>
      </div>

      {/* Bulk Actions */}
      {selectedUsers.size > 0 && (
        <div className="modern-card p-4">
          <div className="flex items-center gap-4">
            <span className="font-medium">Bulk Actions:</span>
            <select
              value={bulkAction}
              onChange={(e) => setBulkAction(e.target.value)}
              className="px-3 py-2 rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--bg))]"
            >
              <option value="">Select Action</option>
              <option value="ACTIVE">Activate Users</option>
              <option value="SUSPENDED">Suspend Users</option>
            </select>
            <button
              onClick={confirmBulkUserAction}
              disabled={!bulkAction || actionLoading}
              className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {actionLoading ? 'Processing...' : `Apply to ${selectedUsers.size} users`}
            </button>
          </div>
        </div>
      )}

      {/* Filters + Calendar */}
      <div className="modern-card p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-medium">Filters & Selection</h3>
          {/* Calendar trigger + popover */}
          <div className="relative">
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); setCalOpen(v => !v); }}
              className="w-full flex items-center justify-center gap-2 rounded-lg px-3 py-2 border border-[rgb(var(--border))] hover:bg-[rgba(var(--fg),0.05)]"
              aria-label="Open calendar to filter by join date"
              title="Filter by join date"
            >
              <CalendarIcon size={18} />
              <span>Calendar</span>
            </button>

            <CalendarPopover
              open={calOpen}
              onClose={() => setCalOpen(false)}
              selectedDates={selectedDates}
              onToggleDate={(iso) => setSelectedDates(prev => { const s = new Set(prev); s.has(iso) ? s.delete(iso) : s.add(iso); return s; })}
              onClear={() => setSelectedDates(new Set())}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-3 items-stretch">
          {/* Search */}
          <div className="flex items-center gap-2 md:col-span-2">
            <span>🔍</span>
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search users…"
              className="w-full px-3 py-2 rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--bg))] transition-colors hover:border-[rgba(var(--accent-1),0.5)]"
            />
          </div>

          {/* Status (UPPER values) */}
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="px-3 py-2 rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--bg))]"
          >
            <option value="ALL">All Statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="PENDING">Pending</option>
            <option value="SUSPENDED">Suspended</option>
          </select>

          {/* Tier (dynamic) */}
          <select
            value={tier}
            onChange={(e) => { setTier(e.target.value); setLevel('ALL'); }} // reset level when tier changes
            className="px-3 py-2 rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--bg))]"
            disabled={tierLoading && !tierStructure}
          >
            {dynamicTierOptions.map(t => (
              <option key={t} value={t}>
                {t === 'ALL' ? 'All Tiers' : titleCase(t)}
              </option>
            ))}
          </select>

          {/* Level (dynamic; shows levels for selected tier or all) */}
          <select
            value={level}
            onChange={(e) => setLevel(e.target.value)}
            className="px-3 py-2 rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--bg))]"
          >
            {dynamicLevelOptions.map(l => (
              <option key={l} value={l}>
                {l === 'ALL' ? 'All Levels' : l}
              </option>
            ))}
          </select>
          
          {/* Joined Date Range */}
          <div className="flex items-center gap-2">
            <input type="date" value={joinedFrom} onChange={(e)=>setJoinedFrom(e.target.value)} className="px-3 py-2 rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--bg))]" />
            <span className="opacity-60">to</span>
            <input type="date" value={joinedTo} onChange={(e)=>setJoinedTo(e.target.value)} className="px-3 py-2 rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--bg))]" />
          </div>
        </div>

        {/* Selected-date chips */}
        {selectedDates.size > 0 && (
          <div className="mt-3 text-sm flex items-center gap-2 flex-wrap">
            {Array.from(selectedDates).sort().map((iso) => (
              <span key={iso} className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 border border-[rgb(var(--border))]">
                {new Date(iso).toLocaleDateString('en-IN', { dateStyle: 'medium' })}
                <button
                  className="opacity-60 hover:opacity-100"
                  onClick={() => setSelectedDates(prev => { const s = new Set(prev); s.delete(iso); return s; })}
                  aria-label={`Remove ${iso}`}
                  title="Remove date"
                >
                  <X size={14} />
                </button>
              </span>
            ))}
            <button
              className="text-xs rounded px-2 py-1 border border-[rgb(var(--border))] hover:bg-[rgba(var(--fg),0.05)]"
              onClick={() => setSelectedDates(new Set())}
              title="Clear all dates"
            >
              Clear All
            </button>
          </div>
        )}
      </div>

      {/* Enhanced Responsive Table */}
      <ResponsiveTable
        columns={[
          {
            key: 'name',
            title: 'User',
            sortable: true,
            render: (value, user) => (
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <User className="h-4 w-4 text-blue-600" />
                </div>
                <div>
                  <div className="font-medium">{user.name}</div>
                  <div className="text-sm text-gray-500">{user.email}</div>
                </div>
              </div>
            )
          },
          {
            key: 'tier',
            title: 'Tier',
            sortable: true,
            render: (value, user) => (
              <div className="flex items-center gap-2">
                {user.tier && (
                  <span data-tier={String(user.tier).toLowerCase()} className="px-2 py-1 text-xs rounded-full border border-gray-200">
                    {user.tier}
                  </span>
                )}
                {user.level && (
                  <span className="px-2 py-1 text-xs rounded-full bg-gray-100">
                    {user.level}
                  </span>
                )}
                {!user.tier && !user.level && <span className="text-sm opacity-60">—</span>}
              </div>
            )
          },
          {
            key: 'referrals',
            title: 'Referrals',
            sortable: true,
            render: (value) => Number(value || 0).toLocaleString('en-IN')
          },
          {
            key: 'totalEarnings',
            title: 'Total Earnings',
            sortable: true,
            render: (value, user) => (
              <div>
                <UserEarningsOnly userId={user.userId || user.id} />
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
            key: 'joinDate',
            title: 'Joined',
            sortable: true,
            render: (value) => value ? new Date(value).toLocaleDateString() : '—'
          }
        ]}
        data={paged}
        loading={loading}
        emptyMessage="No users match your filters."
        searchable={false}
        filterable={false}
        selectable={true}
        bulkActions={[
          { key: 'activate', label: 'Activate Selected' },
          { key: 'suspend', label: 'Suspend Selected' }
        ]}
        onBulkAction={(action, selectedIds) => {
          const selectedUsersData = selectedIds.map(id => list.find(user => user.id === id)).filter(Boolean);
          
          switch (action) {
            case 'activate':
              selectedUsersData.forEach(user => confirmUserAction(user, 'activate'));
              break;
            case 'suspend':
              selectedUsersData.forEach(user => confirmUserAction(user, 'suspend'));
              break;
          }
        }}
        selectedRows={selectedUsers}
        onRowSelect={(selected) => {
          setSelectedUsers(selected);
        }}
        cardView={true}
        stickyHeader={true}
        actions={(user) => (
          <UserActions
            user={user}
            onView={(user) => setSelected(user)}
            onSuspend={(user) => confirmUserAction(user, 'suspend')}
            onActivate={(user) => confirmUserAction(user, 'activate')}
          />
        )}
        onRowClick={(user) => setSelected(user)}
        pagination={{
          currentPage: page,
          totalPages: Math.max(1, Math.ceil((serverTotal != null ? serverTotal : filtered.length) / pageSize)),
          start: (page - 1) * pageSize + 1,
          end: Math.min(page * pageSize, (serverTotal != null ? serverTotal : filtered.length)),
          total: serverTotal != null ? serverTotal : filtered.length,
          hasPrevious: page > 1,
          hasNext: page < Math.max(1, Math.ceil((serverTotal != null ? serverTotal : filtered.length) / pageSize)),
          onPrevious: () => setPage(page - 1),
          onNext: () => setPage(page + 1)
        }}
      />

      {/* Modal - Only show when no confirmation action is pending */}
      {!confirmAction && <UserModal user={selected} onClose={() => setSelected(null)} />}

      {/* Confirmation Modal */}
      {confirmAction && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.6)" }}>
          <div className="relative w-[min(400px,90vw)] modern-card p-6 shadow-2xl">
            <div className="text-center">
              <div className="mb-4 text-2xl">⚠️</div>
              <h3 className="mb-4 text-xl font-semibold">
                {confirmAction.isBulk ? 'Confirm Bulk Action' : 'Confirm Action'}
              </h3>
              <p className="mb-2 text-gray-600">{confirmAction.message}</p>
              {confirmAction.details && (
                <p className="mb-6 text-sm font-medium text-gray-800">{confirmAction.details}</p>
              )}
              
              <div className="flex gap-3 justify-center">
                <button
                  onClick={() => setConfirmAction(null)}
                  className="px-6 py-2 rounded-lg bg-gray-500 text-white hover:bg-gray-600 transition-colors"
                  disabled={actionLoading}
                >
                  Cancel
                </button>
                <button
                  onClick={confirmAction.isBulk ? executeConfirmedBulkAction : executeConfirmedAction}
                  className={`px-6 py-2 rounded-lg text-white transition-colors ${
                    confirmAction.action === 'delete'
                      ? 'bg-red-700 hover:bg-red-800'
                      : confirmAction.action === 'suspend' || confirmAction.action === 'SUSPENDED'
                      ? 'bg-red-600 hover:bg-red-700' 
                      : 'bg-green-600 hover:bg-green-700'
                  }`}
                  disabled={actionLoading}
                >
                  {actionLoading ? 'Processing...' : 
                   confirmAction.isBulk ? 
                     (confirmAction.action === 'SUSPENDED' ? 'Suspend All' : 'Activate All') :
                     (confirmAction.action === 'delete' ? 'Delete User' :
                      confirmAction.action === 'suspend' ? 'Suspend' : 'Activate')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit User Modal removed */}
    </div>
  );
}
