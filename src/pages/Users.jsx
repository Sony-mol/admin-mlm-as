import React, { useEffect, useMemo, useState } from 'react';
import {
  Calendar as CalendarIcon,
  ChevronLeft, ChevronRight,
  ChevronsLeft, ChevronsRight,
  X
} from 'lucide-react';

// Import API configuration
import { API_ENDPOINTS } from '../config/api';

const fmtINR = (n) =>
  Number(n || 0).toLocaleString('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 });
const fmtDate = (iso) => (iso ? new Date(iso).toLocaleDateString('en-US') : '');

// Local YYYY-MM-DD (no timezone conversion to UTC)
const ymdLocal = (d) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

/* ---------- helpers for tier color ---------- */
const tierKey = (label = '') => {
  const s = String(label).toLowerCase();
  if (s.startsWith('gold') || s === 'gold' || s === 'g1' || s === 'g2') return 'gold';
  if (s.startsWith('silver') || s === 'silver' || s === 's1' || s === 's2' || s === 's3') return 'silver';
  if (s.startsWith('bronze') || s === 'bronze' || s === 'b1' || s === 'b2' || s === 'b3' || s === 'b4') return 'bronze';
  return '';
};

/* ---------- Shared: status pill ---------- */
function StatusPill({ value }) {
  const key = String(value || '').toLowerCase();
  const color =
    key === 'shipped' ? 'bg-teal-500' :
    key === 'delivered' ? 'bg-violet-600' :
    key === 'pending' || key === 'processing' ? 'bg-amber-500' :
    key === 'active' || key === 'approved' || key === 'completed' ? 'bg-emerald-500' :
    key === 'suspended' || key === 'cancelled' || key === 'canceled' || key === 'rejected' ? 'bg-red-500' :
    'bg-slate-400';
  return (
    <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold text-white ${color}`}>
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

/* =================== Calendar Popover (multi-date, no year button) =================== */
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
      className="absolute z-50 mt-2 right-0 w-[min(340px,92vw)] rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] shadow-2xl"
      role="dialog"
      aria-modal="true"
      onClick={(e) => e.stopPropagation()}
    >
      {/* Header */}
      <div className="p-3 flex items-center justify-between border-b border-[rgb(var(--border))] gap-2">
        {/* Prev/Next month */}
        <div className="flex items-center gap-1">
          <button
            className={btnBase}
            onClick={() => setView(new Date(view.getFullYear(), view.getMonth() - 1, 1))}
            aria-label="Previous month"
            title="Previous month"
          >
            <ChevronLeft size={18} />
          </button>
          <button
            className={btnBase}
            onClick={() => setView(new Date(view.getFullYear(), view.getMonth() + 1, 1))}
            aria-label="Next month"
            title="Next month"
          >
            <ChevronRight size={18} />
          </button>
        </div>

        {/* Month + Year (year is NOT a button anymore) */}
        <div className="flex items-center gap-2">
          <div className="font-medium">{monthLabel}</div>
          <div className="font-medium">{year}</div>
        </div>

        {/* Prev/Next year */}
        <div className="flex items-center gap-1">
          <button
            className={btnBase}
            onClick={() => setView(new Date(view.getFullYear() - 1, view.getMonth(), 1))}
            aria-label="Previous year"
            title="Previous year"
          >
            <ChevronsLeft size={18} />
          </button>
          <button
            className={btnBase}
            onClick={() => setView(new Date(view.getFullYear() + 1, view.getMonth(), 1))}
            aria-label="Next year"
            title="Next year"
          >
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
  const combined = [user.tier, user.level].filter(Boolean).join(' ') || '—';
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      aria-modal="true"
      role="dialog"
      onClick={onClose}
      style={{ background: 'rgba(0,0,0,0.5)' }}
    >
      <div
        className="relative w-[min(720px,92vw)] md:w-[min(860px,92vw)] max-h-[90vh] overflow-y-auto rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-xl font-semibold">User Details</h3>
            <p className="text-sm opacity-70">Complete information about {user.name}</p>
          </div>
          <button onClick={onClose} className="opacity-70 hover:opacity-100 text-xl" aria-label="Close">×</button>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mt-6">
          <div className="space-y-2">
             <div className="text-sm opacity-70">Referral Code</div>
            <div className="font-medium">{user.code}</div>

            <div className="text-sm opacity-70 mt-4">Email</div>
            <div className="font-medium break-all">{user.email}</div>

            {user.phone && (
              <>
                <div className="text-sm opacity-70 mt-4">Phone</div>
                <div className="font-medium">{user.phone}</div>
              </>
            )}

            <div className="text-sm opacity-70 mt-4">Joined</div>
            <div className="font-medium">{fmtDate(user.joinDate)}</div>

             <div className="text-sm opacity-70 mt-4">Referrer</div>
             <div className="font-medium">
               {user.referrerCode && user.referrerCode !== '--' ? (
                 <div>
                   <div>Code: {user.referrerCode}</div>
                   {user.referrerName && <div className="text-sm opacity-70">Name: {user.referrerName}</div>}
                   {user.referrerEmail && <div className="text-sm opacity-70">Email: {user.referrerEmail}</div>}
                 </div>
               ) : (
                 '--'
               )}
             </div>
          </div>

          <div className="space-y-3">
            <div className="text-sm opacity-70">Tier / Level</div>
            <div className="flex flex-wrap gap-2">
              {user.tier && <Chip className="!bg-transparent" data-tier={tierKey(user.tier)}>{user.tier}</Chip>}
              {user.level && <Chip>{user.level}</Chip>}
              {!user.tier && !user.level && <span className="text-sm opacity-60">{combined}</span>}
            </div>

            <div className="mt-6 grid grid-cols-2 gap-4">
              <div className="rounded-xl border border-[rgb(var(--border))] p-4 text-center">
                <div className="text-2xl font-bold">{Number(user.referrals || 0).toLocaleString('en-IN')}</div>
                <div className="text-sm opacity-70">Total Referrals</div>
              </div>
              <div className="rounded-xl border border-[rgb(var(--border))] p-4 text-center">
                <div className="text-2xl font-bold">{fmtINR(user.earnings)}</div>
                <div className="text-sm opacity-70">Total Earnings</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* =================== Page =================== */
// Edit User Modal Component
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
      <div className="relative w-[min(500px,90vw)] rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-6 shadow-2xl">
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

export default function Users() {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);
  const [success, setSuccess] = useState(null);

  const [q, setQ] = useState('');
  const [status, setStatus] = useState('All');
  const [level, setLevel] = useState('All');
  const [selected, setSelected] = useState(null);
  
  // User management states
  const [editingUser, setEditingUser] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);
  
  // Bulk operations states
  const [selectedUsers, setSelectedUsers] = useState(new Set());
  const [bulkAction, setBulkAction] = useState('');

  // calendar filters
  const [selectedDates, setSelectedDates] = useState(() => new Set()); // local YYYY-MM-DD strings
  const [calOpen, setCalOpen] = useState(false);
  
  // Sync referral counts state
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState(null);

  // Sync referral counts function
  async function syncReferralCounts() {
    try {
      setSyncing(true);
      setSyncResult(null);
      const token = localStorage.getItem('auth') ? JSON.parse(localStorage.getItem('auth')).accessToken : '';
      const headers = { 'Authorization': `Bearer ${token}` };
      
      console.log('🔄 Starting referral count synchronization...');
      
      const response = await fetch(`${API_ENDPOINTS.USERS}/sync-referral-counts`, {
        method: 'POST',
        headers
      });
      
      if (!response.ok) {
        throw new Error(`Sync failed with status: ${response.status}`);
      }
      
      const result = await response.json();
      console.log('✅ Sync completed:', result);
      
      setSyncResult({
        success: true,
        message: result.message,
        discrepanciesFound: result.discrepanciesFound,
        usersUpdated: result.usersUpdated,
        totalUsers: result.totalUsers
      });
      
      // Refresh the user list to show updated counts
      await load();
      
    } catch (error) {
      console.error('❌ Sync failed:', error);
      setSyncResult({
        success: false,
        message: 'Failed to sync referral counts: ' + error.message
      });
    } finally {
      setSyncing(false);
    }
  }

  async function load() {
    try {
      setLoading(true);
      const token = localStorage.getItem('auth') ? JSON.parse(localStorage.getItem('auth')).accessToken : '';
      const headers = { 'Authorization': `Bearer ${token}` };
      
      // Fetch real users from backend
      // We'll get users from commission data and user endpoints
      const users = [];
      
      // Fetch real users from backend API
      try {
        console.log('🔍 USERS PAGE - Starting API calls...');
        console.log('🔑 Token:', token ? `${token.substring(0, 20)}...` : 'NO TOKEN');
        console.log('📡 Headers:', headers);
        
        // Fetch real users from /api/users endpoint
        console.log('👥 Fetching real users from:', API_ENDPOINTS.USERS);
        const usersRes = await fetch(API_ENDPOINTS.USERS, { headers });
        console.log('👥 Users Response Status:', usersRes.status);
        console.log('👥 Users Response Headers:', Object.fromEntries(usersRes.headers.entries()));
        
        if (usersRes.ok) {
          const realUsers = await usersRes.json();
          console.log('✅ Real Users Data Received:', realUsers);
          console.log('📊 Total Users Found:', realUsers.length);
          
           // Transform backend user data to match frontend format
           const transformedUsers = realUsers.map(user => ({
             id: user.id,
             code: user.referenceCode || '--', // Show -- for users without referral code
             name: user.name,
             email: user.email,
             phone: user.phoneNumber || 'N/A',
             joinDate: user.createdAt || new Date().toISOString(),
             status: user.status,
             tier: user.tier || 'Bronze',
             level: user.level || 'B1',
             referrals: user.referralCount || 0, // Use real referral count from database
             earnings: user.walletBalance || 0,
             upline: user.referredByCode || '--', // Show referrer code or --
             role: user.role || 'USER',
             // Add referrer information for modal
             referrerName: user.referrerName || null,
             referrerEmail: user.referrerEmail || null,
             referrerCode: user.referredByCode || '--'
           }));
          
          setList(transformedUsers);
          console.log('✅ Users loaded successfully:', transformedUsers.length);
        } else {
          console.log('❌ Users API Failed:', usersRes.status, await usersRes.text());
          // Fallback to mock data if API fails
          const mockUsers = [
            {
              id: 38,
              code: 'REF209825',
              name: 'Test User 1',
              email: 'testuser1@example.com',
              phone: '7416685085',
              joinDate: '2024-01-15T10:30:00Z',
              status: 'ACTIVE',
              tier: 'Gold',
              level: 'G1',
              referrals: 1,
              earnings: 475.00,
              upline: null
            },
            {
              id: 96,
              code: 'REF209826',
              name: 'Test User 2',
              email: 'testuser11@example.com',
              phone: '7416685086',
              joinDate: '2024-01-20T14:45:00Z',
              status: 'ACTIVE',
              tier: 'Silver',
              level: 'S1',
              referrals: 0,
              earnings: 250.00,
              upline: 'REF209825'
            }
          ];
          setList(mockUsers);
        }
      } catch (apiError) {
        console.error('💥 Error fetching users from backend:', apiError);
        // Fallback to mock data
        const mockUsers = [
          {
            id: 38,
            code: 'REF209825',
            name: 'Test User 1',
            email: 'testuser1@example.com',
            phone: '7416685085',
            joinDate: '2024-01-15T10:30:00Z',
            status: 'ACTIVE',
            tier: 'Gold',
            level: 'G1',
            referrals: 1,
            earnings: 475.00,
            upline: null
          },
          {
            id: 96,
            code: 'REF209826',
            name: 'Test User 2',
            email: 'testuser11@example.com',
            phone: '7416685086',
            joinDate: '2024-01-20T14:45:00Z',
            status: 'ACTIVE',
            tier: 'Silver',
            level: 'S1',
            referrals: 0,
            earnings: 250.00,
            upline: 'REF209825'
          }
        ];
        setList(mockUsers);
      }
      
      setErr(null);
    } catch (e) {
      setErr(e.message || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => { load(); }, []);

  // User management functions
  async function updateUserStatus(userId, newStatus) {
    try {
      setActionLoading(true);
      const token = localStorage.getItem('auth') ? JSON.parse(localStorage.getItem('auth')).accessToken : '';
      const headers = { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      };
      
      console.log(`🔄 Updating user ${userId} status to ${newStatus}`);
      const response = await fetch(`${API_ENDPOINTS.USERS}/${userId}/status`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({ status: newStatus })
      });
      
      if (response.ok) {
        console.log(`✅ User ${userId} status updated to ${newStatus}`);
        // Reload the user list
        await load();
        setSelected(null);
      } else {
        console.error(`❌ Failed to update user ${userId} status:`, response.status);
        setErr(`Failed to update user status: ${response.status}`);
      }
    } catch (error) {
      console.error('Error updating user status:', error);
      setErr('Failed to update user status');
    } finally {
      setActionLoading(false);
    }
  }

  async function updateUserDetails(userId, userData) {
    try {
      setActionLoading(true);
      const token = localStorage.getItem('auth') ? JSON.parse(localStorage.getItem('auth')).accessToken : '';
      const headers = { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      };
      
      console.log(`🔄 Updating user ${userId} details:`, userData);
      const response = await fetch(`${API_ENDPOINTS.USERS}/${userId}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(userData)
      });
      
      if (response.ok) {
        console.log(`✅ User ${userId} details updated`);
        // Reload the user list
        await load();
        setEditingUser(null);
      } else {
        console.error(`❌ Failed to update user ${userId} details:`, response.status);
        setErr(`Failed to update user details: ${response.status}`);
      }
    } catch (error) {
      console.error('Error updating user details:', error);
      setErr('Failed to update user details');
    } finally {
      setActionLoading(false);
    }
  }

  async function deleteUser(userId) {
    try {
      setActionLoading(true);
      const token = localStorage.getItem('auth') ? JSON.parse(localStorage.getItem('auth')).accessToken : '';
      const headers = { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      };
      
      console.log(`🗑️ Deleting user ${userId}`);
      const response = await fetch(`${API_ENDPOINTS.USERS}/${userId}`, {
        method: 'DELETE',
        headers
      });
      
      if (response.ok) {
        console.log(`✅ User ${userId} deleted successfully`);
        // Show success message
        setErr(null);
        setSuccess(`User deleted successfully! User ID: ${userId} - All related data has been permanently removed.`);
        // Show success notification
        alert(`✅ User deleted successfully!\n\nUser ID: ${userId}\nAll related data has been permanently removed.`);
        // Reload the user list
        await load();
        setSelected(null);
        // Clear success message after 5 seconds
        setTimeout(() => setSuccess(null), 5000);
      } else {
        console.log(`❌ Failed to delete user: ${response.status}`);
        const errorData = await response.json();
        setErr(`Failed to delete user: ${errorData.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('❌ Error deleting user:', error);
      setErr(`Error deleting user: ${error.message}`);
    } finally {
      setActionLoading(false);
    }
  }

  // Confirmation function
  function confirmUserAction(user, action) {
    setConfirmAction({
      user,
      action,
      message: action === 'suspend' 
        ? `Are you sure you want to suspend ${user.name}? They will not be able to access the system.`
        : action === 'activate'
        ? `Are you sure you want to activate ${user.name}? They will regain access to the system.`
        : `Are you sure you want to DELETE ${user.name}? This action cannot be undone and will permanently remove the user and all their data.`
    });
  }

  async function executeConfirmedAction() {
    if (!confirmAction) return;
    
    const { user, action } = confirmAction;
    
    if (action === 'delete') {
      await deleteUser(user.id);
    } else {
      const newStatus = action === 'suspend' ? 'SUSPENDED' : 'ACTIVE';
      await updateUserStatus(user.id, newStatus);
    }
    
    setConfirmAction(null);
  }

  // Bulk operations functions
  const toggleUserSelection = (userId) => {
    setSelectedUsers(prev => {
      const newSet = new Set(prev);
      if (newSet.has(userId)) {
        newSet.delete(userId);
      } else {
        newSet.add(userId);
      }
      return newSet;
    });
  };

  const selectAllUsers = () => {
    const allIds = filtered.map(u => u.id);
    setSelectedUsers(new Set(allIds));
  };

  const clearUserSelection = () => {
    setSelectedUsers(new Set());
  };

  const confirmBulkUserAction = () => {
    if (selectedUsers.size === 0 || !bulkAction) {
      alert('Please select users and choose an action.');
      return;
    }

    const actionText = bulkAction === 'SUSPENDED' ? 'suspend' : 'activate';
    const selectedUserNames = filtered
      .filter(u => selectedUsers.has(u.id))
      .map(u => u.name)
      .slice(0, 3)
      .join(', ');
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
      const headers = { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      };
      
      console.log(`🔄 Bulk updating ${selectedUsers.size} users to ${bulkAction}`);
      
      // Update each user individually (since we don't have a bulk endpoint yet)
      const updatePromises = Array.from(selectedUsers).map(async (userId) => {
        const response = await fetch(`${API_ENDPOINTS.USERS}/${userId}/status`, {
          method: 'PUT',
          headers,
          body: JSON.stringify({ status: bulkAction })
        });
        
        if (!response.ok) {
          throw new Error(`Failed to update user ${userId}`);
        }
        
        return { userId, success: true };
      });

      const results = await Promise.allSettled(updatePromises);
      const successful = results.filter(r => r.status === 'fulfilled').length;
      const failed = results.filter(r => r.status === 'rejected').length;

      console.log(`✅ Bulk update completed: ${successful} successful, ${failed} failed`);
      alert(`Bulk update completed: ${successful} successful, ${failed} failed`);
      
      // Clear selection and refresh data
      setSelectedUsers(new Set());
      setBulkAction('');
      await load();
      
    } catch (error) {
      console.error('Error in bulk update:', error);
      alert('Failed to update users. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };

  // status action (unchanged)
  async function setUserStatus(user, next) {
    let targetId = user.id;

    if (!targetId && user.code) {
      try {
        let r = await fetch(`${USERS_API}?code=${encodeURIComponent(user.code)}`, { cache: 'no-store' });
        if (r.ok) {
          const arr = await r.json();
          targetId = Array.isArray(arr) && arr[0]?.id;
        }
        if (!targetId) {
          r = await fetch(`${USERS_API}?search=${encodeURIComponent(user.code)}`, { cache: 'no-store' });
          if (r.ok) {
            const arr = await r.json();
            targetId = Array.isArray(arr) && arr.find(x => x.code === user.code)?.id;
          }
        }
      } catch { /* noop */ }
    }

    if (!targetId) {
      alert('Cannot update: missing id for this user. Ensure your /api/users items have an "id".');
      return;
    }

    const updated = { ...user, id: targetId, status: next };

    // optimistic UI
    setList(prev => prev.map(u => (u.id === targetId || u.code === user.code) ? updated : u));
    if (selected?.id === targetId || selected?.code === user.code) setSelected(updated);

    try {
      let res = await fetch(`${USERS_API}/${targetId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated),
      });
      if (!res.ok) {
        res = await fetch(`${USERS_API}/${targetId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: next }),
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
      }
    } catch (e) {
      await load(); // revert
      alert('Could not update status: ' + (e.message || 'unknown error'));
    }
  }

  // Filter: q, status, level, joinDate (multi)
  const filtered = useMemo(() => {
    return list.filter(u => {
      const matchQ =
        q.trim() === '' ||
        [u.name, u.email, u.code].some(x => String(x || '').toLowerCase().includes(q.toLowerCase()));
      const matchStatus = status === 'All' || u.status === status;

      const sel = level;
      const matchLevel =
        sel === 'All' ||
        (sel === 'Beginner' && String(u.tier || '').toLowerCase() === 'beginner') ||
        String(u.level || '') === sel;

      // Join date filter: union of selected dates (if any)
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

      return matchQ && matchStatus && matchLevel && matchDate;
    });
  }, [list, q, status, level, selectedDates]);

  const levelOptions = [
    'All',
    'Beginner',
    'B1','B2','B3','B4',
    'S1','S2','S3',
    'G1','G2'
  ];

  // Calendar handlers
  const toggleDate = (iso) => {
    setSelectedDates(prev => {
      const s = new Set(prev);
      s.has(iso) ? s.delete(iso) : s.add(iso);
      return s;
    });
  };
  const clearDates = () => setSelectedDates(new Set());

  /* =================== Export helpers =================== */

  // Build rows exactly like the sample "User Details" sheet,
  // but use TYPES for Excel: Date for Join Date, Number for Referrals.
  function mapUsersToUserDetailsRows(users) {
    return users.map((u) => ({
      'User Id': u.code || u.id || '',
      'User Name': u.name || '',
      'Mail': u.email || '',
      'Phone Number': u.phone || '',                 // string to preserve leading zeros
      'Join Date': u.joinDate ? new Date(u.joinDate) : '', // real Date cell
      'Referrals': Number(u.referrals ?? 0),         // numeric cell
      'Tier': u.tier || '',
      'Level': u.level || '',
      'Referrence_Id': u.sponsorCode || u.upline || '',
      'Status': u.status || '',
    }));
  }

  // Auto-fit widths with optional fixed overrides (e.g., cap Join Date)
  function autoFitColumns(rows, header, fixed = {}) {
    const cols = header.map((h) => {
      if (fixed[h]) return { key: h, wch: fixed[h] };
      return { key: h, wch: Math.max(10, String(h).length + 2) };
    });
    for (const row of rows) {
      header.forEach((h, i) => {
        if (fixed[h]) return; // respect fixed widths
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

      // 1) Rows & worksheet (Date/Number types come from data)
      const rows = mapUsersToUserDetailsRows(usersToExport);
      const ws = XLSX.utils.json_to_sheet(rows, { skipHeader: false });

      // 2) Fixed header order to match your sample workbook
      const header = [
        'User Id',
        'User Name',
        'Mail',
        'Phone Number',
        'Join Date',
        'Referrals',
        'Tier',
        'Level',
        'Referrence_Id',
        'Status',
      ];
      XLSX.utils.sheet_add_aoa(ws, [header], { origin: 'A1' });

      // 2b) Column widths (cap Join Date so it doesn't get too wide)
      ws['!cols'] = autoFitColumns(rows, header, { 'Join Date': 12 });

      // 2c) Apply Excel cell formats (date & integer) + autofilter
      const range = XLSX.utils.decode_range(ws['!ref'] || 'A1');
      const dateCol = header.indexOf('Join Date');
      const refCol  = header.indexOf('Referrals');

      for (let r = 1; r <= range.e.r; r++) { // skip header at r=0
        if (dateCol >= 0) {
          const addrD = XLSX.utils.encode_cell({ r, c: dateCol });
          const cellD = ws[addrD];
          if (cellD) {
            cellD.z = 'yyyy-mm-dd'; // or 'dd-mmm-yyyy'
          }
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

      // 3) Single-sheet workbook (ignore Payments)
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'User Details');

      // 4) Trigger download
      XLSX.writeFile(wb, 'MLM_Users_Data.xlsx');
    } catch (e) {
      console.error(e);
      alert('Export failed: ' + (e?.message || 'Unknown error'));
    }
  }

  if (loading) {
    return <div className="rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-4 animate-pulse">Loading users…</div>;
  }
  if (err) {
    return (
      <div className="p-4 rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--card))]">
        <div className="font-semibold mb-1">Couldn't load users</div>
        <div className="text-sm opacity-80">{err}</div>
        <button onClick={load} className="mt-3 rounded px-3 py-2 border border-[rgb(var(--border))] hover:bg-[rgba(var(--fg),0.05)]">Retry</button>
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
              {syncResult.success && (
                <div className="mt-2 grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <div className="font-medium text-green-800">Total Users</div>
                    <div className="text-green-700">{syncResult.totalUsers}</div>
                  </div>
                  <div>
                    <div className="font-medium text-green-800">Discrepancies Found</div>
                    <div className="text-green-700">{syncResult.discrepanciesFound}</div>
                  </div>
                  <div>
                    <div className="font-medium text-green-800">Users Updated</div>
                    <div className="text-green-700">{syncResult.usersUpdated}</div>
                  </div>
                </div>
              )}
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
          <span className="text-sm opacity-70">
            {selectedUsers.size} selected
          </span>
          {selectedUsers.size > 0 && (
            <button
              onClick={clearUserSelection}
              className="text-xs px-2 py-1 rounded border border-[rgb(var(--border))] hover:bg-[rgba(var(--fg),0.05)]"
            >
              Clear
            </button>
          )}
        </div>
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
            <>
              🔄 Sync Referrals
            </>
          )}
        </button>
        <button
          onClick={() => handleExport(filtered)}
          className="rounded-lg px-3 py-2 bg-[#217346] text-white hover:bg-[#1e6a3f] shadow-sm focus-visible:outline-none focus-visible:ring-2 
         focus-visible:ring-[#217346]/40 active:scale-[0.98] transition"          
          title="Export current users to Excel"
          aria-label="Export users to Excel"
        >
         Export
        </button>
      </div>

      {/* Bulk Actions */}
      {selectedUsers.size > 0 && (
        <div className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-4">
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
      <div className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-medium">Filters & Selection</h3>
          {filtered.length > 0 && (
            <button
              onClick={selectAllUsers}
              className="px-3 py-2 rounded-lg border border-[rgb(var(--border))] hover:bg-[rgba(var(--fg),0.05)] text-sm"
            >
              Select All ({filtered.length})
            </button>
          )}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-stretch">
          <div className="flex items-center gap-2">
            <span>🔍</span>
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search users…"
              className="w-full px-3 py-2 rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--bg))] transition-colors hover:border-[rgba(var(--accent-1),0.5)]"
            />
          </div>

          <select value={status} onChange={(e) => setStatus(e.target.value)}
            className="px-3 py-2 rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--bg))]">
            <option>All</option><option>Active</option><option>Pending</option><option>Suspended</option>
          </select>

          <select value={level} onChange={(e) => setLevel(e.target.value)}
            className="px-3 py-2 rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--bg))]">
            {[
              'All','Beginner','B1','B2','B3','B4','S1','S2','S3','G1','G2'
            ].map(l => <option key={l} value={l}>{l}</option>)}
          </select>

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
              onToggleDate={toggleDate}
              onClear={clearDates}
            />
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
                  onClick={() => toggleDate(iso)}
                  aria-label={`Remove ${iso}`}
                  title="Remove date"
                >
                  <X size={14} />
                </button>
              </span>
            ))}
            <button
              className="text-xs rounded px-2 py-1 border border-[rgb(var(--border))] hover:bg-[rgba(var(--fg),0.05)]"
              onClick={clearDates}
              title="Clear all dates"
            >
              Clear All
            </button>
          </div>
        )}
      </div>

      {/* Desktop table */}
      <div className="hidden md:block rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] overflow-visible">
        <div className="grid grid-cols-12 px-4 py-3 border-b border-[rgb(var(--border))] text-sm opacity-80">
          <div className="col-span-1">
            <input
              type="checkbox"
              checked={selectedUsers.size === filtered.length && filtered.length > 0}
              onChange={(e) => e.target.checked ? selectAllUsers() : clearUserSelection()}
              className="w-4 h-4"
            />
          </div>
          <div className="col-span-3">User</div>
          <div className="col-span-2">Tier</div>
          <div className="col-span-2">Referrals</div>
          <div className="col-span-2">Earnings</div>
          <div className="col-span-1">Status</div>
          <div className="col-span-1 text-right">Actions</div>
        </div>

        {filtered.map((u) => (
          <div
            key={u.id || u.code}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setSelected(u); } }}
            onClick={() => setSelected(u)}
            className={[
              "grid grid-cols-12 px-4 py-4 my-1",
              "rounded-xl border border-transparent",
              "transition-all duration-200 ease-out",
              "hover:-translate-y-0.5 hover:shadow-lg hover:bg-[rgba(var(--fg),0.03)] hover:border-[rgb(var(--border-hover))]",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(var(--accent-1),0.35)]",
              "border-t border-[rgb(var(--border))]",
              "cursor-pointer",
            ].join(" ")}
          >
            <div className="col-span-1 flex items-center" onClick={(e) => e.stopPropagation()}>
              <input
                type="checkbox"
                checked={selectedUsers.has(u.id)}
                onChange={() => toggleUserSelection(u.id)}
                className="w-4 h-4"
              />
            </div>
            <div className="col-span-3">
              <div className="font-medium">{u.name}</div>
              <div className="text-sm opacity-80 break-all">{u.email}</div>
              <div className="text-xs opacity-60">{u.code}</div>
              <div className="mt-1 text-xs opacity-60">Joined: {fmtDate(u.joinDate)}</div>
            </div>

            <div className="col-span-2 flex items-center gap-2">
              {u.tier && (
                <span data-tier={String(u.tier).toLowerCase()} className="px-2 py-0.5 text-xs rounded-full border">{u.tier}</span>
              )}
              {u.level && <Chip>{u.level}</Chip>}
              {!u.tier && !u.level && <span className="text-sm opacity-60">—</span>}
            </div>

            <div className="col-span-2 flex items-center">{Number(u.referrals || 0).toLocaleString('en-IN')}</div>
            <div className="col-span-2 flex items-center">{fmtINR(u.earnings)}</div>

            <div className="col-span-1 flex items-center">
              <StatusPill value={u.status} />
            </div>

            <div className="col-span-1 flex items-center justify-end gap-3" onClick={(e) => e.stopPropagation()}>
              <button
                title="Edit User"
                onClick={() => setEditingUser(u)}
                className="hover:opacity-100 opacity-80"
              >
                ✏️
              </button>
              <button
                title="Suspend"
                onClick={() => confirmUserAction(u, 'suspend')}
                disabled={u.status === 'Suspended'}
                className={`hover:opacity-100 ${u.status === 'Suspended' ? 'opacity-40 cursor-not-allowed' : 'opacity-80'}`}
              >
                🚫
              </button>
              <button
                title="Activate"
                onClick={() => confirmUserAction(u, 'activate')}
                disabled={u.status === 'Active'}
                className={`hover:opacity-100 ${u.status === 'Active' ? 'opacity-40 cursor-not-allowed' : 'opacity-80'}`}
              >
                ✅
              </button>
              <button
                title="Delete User"
                onClick={() => confirmUserAction(u, 'delete')}
                className="hover:opacity-100 opacity-80 text-red-600 hover:text-red-700"
              >
                🗑️
              </button>
            </div>
          </div>
        ))}

        {filtered.length === 0 && (
          <div className="px-4 py-10 text-center opacity-70">No users match your filters.</div>
        )}
      </div>

      {/* Mobile cards */}
      <div className="md:hidden space-y-3">
        {filtered.map((u) => (
          <div
            key={u.id || u.code}
            className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-4 transition-transform duration-200 hover:-translate-y-0.5 hover:shadow-md active:scale-[0.998]"
            onClick={() => setSelected(u)}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3 min-w-0">
                <input
                  type="checkbox"
                  checked={selectedUsers.has(u.id)}
                  onChange={(e) => {
                    e.stopPropagation();
                    toggleUserSelection(u.id);
                  }}
                  className="w-4 h-4 mt-1"
                />
              <div className="min-w-0">
                <div className="font-medium truncate">{u.name}</div>
                <div className="text-sm opacity-80 truncate">{u.email}</div>
                <div className="text-xs opacity-60">{u.code}</div>
                <div className="mt-1 text-xs opacity-60">Joined: {fmtDate(u.joinDate)}</div>
                </div>
              </div>
              <StatusPill value={u.status} />
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-2">
              {u.tier && <Chip className="!bg-transparent" data-tier={tierKey(u.tier)}>{u.tier}</Chip>}
              {u.level && <Chip>{u.level}</Chip>}
              <Chip>{Number(u.referrals || 0).toLocaleString('en-IN')} referrals</Chip>
              <Chip>{fmtINR(u.earnings)}</Chip>
            </div>
          </div>
        ))}

        {filtered.length === 0 && (
          <div className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-6 text-center opacity-70">
            No users match your filters.
          </div>
        )}
      </div>

      {/* Modal */}
      <UserModal user={selected} onClose={() => setSelected(null)} />

      {/* Confirmation Modal */}
      {confirmAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.5)" }}>
          <div className="relative w-[min(400px,90vw)] rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-6 shadow-2xl">
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

      {/* Edit User Modal */}
      {editingUser && (
        <EditUserModal 
          user={editingUser} 
          onClose={() => setEditingUser(null)}
          onSave={updateUserDetails}
          loading={actionLoading}
        />
      )}
    </div>
  );
}
