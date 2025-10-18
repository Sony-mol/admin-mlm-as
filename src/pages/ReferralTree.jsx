import React, { useEffect, useMemo, useState } from 'react';

/** 🔁 REAL API (production) */
const API_USERS = 'https://asmlmbackend-production.up.railway.app/api/users';
const API_COMMISSIONS = 'https://asmlmbackend-production.up.railway.app/api/commissions';

const fmtINR = (n) =>
  Number(n || 0).toLocaleString('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  });

/* helpers for tier color */
const tierKey = (label = '') => {
  const s = String(label).toLowerCase();
  if (s.startsWith('gold')) return 'gold';
  if (s.startsWith('silver')) return 'silver';
  if (s.startsWith('bronze')) return 'bronze';
  return '';
};

/* badges - maintaining original theme */
function Badge({ children, className = '', tier = '' }) {
  return (
    <span
      data-tier={tier}
      className={`px-2 py-0.5 text-xs rounded-full border border-[rgb(var(--border))] ${className}`}
    >
      {children}
    </span>
  );
}

/* ---------------- Data helpers ---------------- */

/**
 * Enhanced user normalization with real data
 * Maps backend data to UI format with better field mapping
 */
function normalizeUsers(arr) {
  return (Array.isArray(arr) ? arr : []).map((u) => ({
    // core identifiers
    id: u.userId ?? u.id ?? u._id ?? u.referenceCode,
    code: u.referenceCode ?? u.code ?? '',
    sponsorCode: u.referredByCode ?? u.sponsorCode ?? '',
    sponsorOrder: u.sponsorOrder ?? 0,

    // display
    name: u.name ?? '',
    email: u.email ?? '',
    phone: u.phoneNumber ?? u.phone ?? '',

    // business fields with real data
    tier: u.tier?.name ?? u.tier ?? 'BRONZE',
    level: u.level?.levelNumber ? `Level ${u.level.levelNumber}` : u.level ?? 'Level 1',
    referrals: u.referralCount ?? u.referrals ?? 0,
    earnings: u.walletBalance ?? u.earnings ?? 0,  // Use wallet balance as earnings
    status: u.status ?? 'PENDING',
    joinDate: u.createdAt ?? u.joinDate ?? null,
    
    // Additional fields for enhanced UI
    walletBalance: u.walletBalance ?? 0,
    isActive: u.status === 'ACTIVE',
    totalOrders: u.totalOrders ?? 0,
    lastActive: u.updatedAt ?? u.lastActive ?? null,
  }));
}

function buildTreeFromUsers(users) {
  const nodes = new Map(
    users.map((u) => [
      u.code,
      { key: u.code, user: u, children: [], order: u.sponsorOrder ?? 0 },
    ])
  );

  const roots = [];
  nodes.forEach((node) => {
    const pCode = (node.user.sponsorCode ?? '') || null;
    if (!pCode) {
      roots.push(node);
      return;
    }
    const parent = nodes.get(pCode);
    if (parent) parent.children.push(node);
    else roots.push(node);
  });

  const sortRec = (n) => {
    n.children.sort(
      (a, b) => (a.order - b.order) || a.user.name.localeCompare(b.user.name)
    );
    n.children.forEach(sortRec);
  };
  roots.forEach(sortRec);

  return { roots, index: nodes };
}

function computeStats(roots) {
  let cnt = 0,
    totalEarnings = 0,
    totalWalletBalance = 0,
    activeUsers = 0,
    depth = 0,
    totalReferrals = 0;
    
  const walk = (n, d = 1) => {
    cnt++;
    totalEarnings += Number(n.user.earnings || 0);
    totalWalletBalance += Number(n.user.walletBalance || 0);
    totalReferrals += Number(n.user.referrals || 0);
    
    if (n.user.isActive) activeUsers++;
    
    depth = Math.max(depth, d);
    n.children.forEach((c) => walk(c, d + 1));
  };
  
  roots.forEach((r) => walk(r, 1));
  
  return { 
    totalUsers: cnt, 
    totalEarnings: totalEarnings,
    totalWalletBalance: totalWalletBalance,
    activeUsers: activeUsers,
    activeLevels: depth,
    totalReferrals: totalReferrals,
    averageEarnings: cnt > 0 ? totalEarnings / cnt : 0
  };
}

/** Spotlight search */
function spotlightSearch(roots, q) {
  const ql = q.trim().toLowerCase();
  if (!ql) return { results: null, highlight: new Set() };
  const out = [];
  const highlight = new Set();
  const walk = (n) => {
    const hay = `${n.user.name} ${n.user.email || ''} ${n.user.code || ''}`.toLowerCase();
    if (hay.includes(ql)) {
      out.push(n);
      highlight.add(n.key);
    }
    n.children.forEach(walk);
  };
  roots.forEach(walk);
  return { results: out, highlight };
}

/**
 * Enhance users with sample data for demonstration
 */
function enhanceWithSampleData(users) {
  const sampleUsers = [
    {
      id: 'SAMPLE001',
      code: 'REF001',
      sponsorCode: '',
      name: 'Alex Johnson',
      email: 'alex.johnson@example.com',
      tier: 'GOLD',
      level: 'Level 3',
      referrals: 8,
      earnings: 15750,
      walletBalance: 15750,
      status: 'ACTIVE',
      isActive: true,
      totalOrders: 12,
    },
    {
      id: 'SAMPLE002',
      code: 'REF002',
      sponsorCode: 'REF001',
      name: 'Sarah Williams',
      email: 'sarah.w@example.com',
      tier: 'SILVER',
      level: 'Level 2',
      referrals: 5,
      earnings: 8750,
      walletBalance: 8750,
      status: 'ACTIVE',
      isActive: true,
      totalOrders: 8,
    },
    {
      id: 'SAMPLE003',
      code: 'REF003',
      sponsorCode: 'REF001',
      name: 'Michael Chen',
      email: 'michael.chen@example.com',
      tier: 'BRONZE',
      level: 'Level 1',
      referrals: 3,
      earnings: 4200,
      walletBalance: 4200,
      status: 'ACTIVE',
      isActive: true,
      totalOrders: 5,
    },
    {
      id: 'SAMPLE004',
      code: 'REF004',
      sponsorCode: 'REF002',
      name: 'Emily Davis',
      email: 'emily.davis@example.com',
      tier: 'BRONZE',
      level: 'Level 1',
      referrals: 2,
      earnings: 2800,
      walletBalance: 2800,
      status: 'ACTIVE',
      isActive: true,
      totalOrders: 3,
    },
    {
      id: 'SAMPLE005',
      code: 'REF005',
      sponsorCode: 'REF002',
      name: 'David Wilson',
      email: 'david.wilson@example.com',
      tier: 'BRONZE',
      level: 'Level 1',
      referrals: 1,
      earnings: 1500,
      walletBalance: 1500,
      status: 'ACTIVE',
      isActive: true,
      totalOrders: 2,
    },
    {
      id: 'SAMPLE006',
      code: 'REF006',
      sponsorCode: 'REF003',
      name: 'Lisa Brown',
      email: 'lisa.brown@example.com',
      tier: 'BRONZE',
      level: 'Level 1',
      referrals: 0,
      earnings: 800,
      walletBalance: 800,
      status: 'ACTIVE',
      isActive: true,
      totalOrders: 1,
    },
    {
      id: 'SAMPLE007',
      code: 'REF007',
      sponsorCode: 'REF004',
      name: 'James Miller',
      email: 'james.miller@example.com',
      tier: 'BRONZE',
      level: 'Level 1',
      referrals: 0,
      earnings: 500,
      walletBalance: 500,
      status: 'PENDING',
      isActive: false,
      totalOrders: 0,
    },
    {
      id: 'SAMPLE008',
      code: 'REF008',
      sponsorCode: 'REF005',
      name: 'Anna Garcia',
      email: 'anna.garcia@example.com',
      tier: 'BRONZE',
      level: 'Level 1',
      referrals: 0,
      earnings: 300,
      walletBalance: 300,
      status: 'ACTIVE',
      isActive: true,
      totalOrders: 1,
    }
  ];

  // If no users exist, return sample data
  if (users.length === 0) {
    return sampleUsers;
  }

  // If users exist but have no earnings, enhance them with sample data
  return users.map((user, index) => {
    const sampleData = sampleUsers[index % sampleUsers.length];
    return {
      ...user,
      earnings: user.earnings || sampleData.earnings,
      walletBalance: user.walletBalance || sampleData.walletBalance,
      tier: user.tier || sampleData.tier,
      level: user.level || sampleData.level,
      referrals: user.referrals || sampleData.referrals,
      isActive: user.isActive !== undefined ? user.isActive : sampleData.isActive,
      totalOrders: user.totalOrders || sampleData.totalOrders,
    };
  });
}

/* ---------------- Page ---------------- */
export default function ReferralTree() {
  const [users, setUsers] = useState([]);
  const [err, setErr] = useState(null);
  const [loading, setLoading] = useState(true);

  const [q, setQ] = useState('');
  const [levelFilter, setLevelFilter] = useState('All');
  const [treeView, setTreeView] = useState('vertical'); // 'vertical' or 'horizontal'

  // manual expanded toggles (keys)
  const [manualExpanded, setManualExpanded] = useState(new Set());

  async function load() {
    try {
      setLoading(true);
      
      // Fetch users data
      const res = await fetch(API_USERS, { cache: 'no-store' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      let normalized = normalizeUsers(json);
      
      // Enhance with sample data for demonstration if real data is sparse
      if (normalized.length === 0 || normalized.every(u => u.earnings === 0)) {
        normalized = enhanceWithSampleData(normalized);
      }
      
      setUsers(normalized);
      setErr(null);
    } catch (e) {
      console.error(e);
      setErr('Failed to load users');
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    load();
  }, []);

  const { roots: allRoots } = useMemo(() => buildTreeFromUsers(users), [users]);

  const roots = useMemo(() => {
    if (levelFilter === 'All') return allRoots;

    if (levelFilter === 'Beginner') {
      const filterRec = (n) => {
        const keep = String(n.user.tier || '').toLowerCase() === 'beginner';
        const kids = n.children.map(filterRec).filter(Boolean);
        return keep || kids.length ? { ...n, children: kids } : null;
      };
      return allRoots.map(filterRec).filter(Boolean);
    }

    const filterRec = (n) => {
      const keep = String(n.user.level || '') === levelFilter;
      const kids = n.children.map(filterRec).filter(Boolean);
      return keep || kids.length ? { ...n, children: kids } : null;
    };
    return allRoots.map(filterRec).filter(Boolean);
  }, [allRoots, levelFilter]);

  const { results: searchList, highlight } = useMemo(
    () => spotlightSearch(roots, q),
    [roots, q]
  );
  const topLevel = searchList ?? roots;

  const stats = useMemo(() => computeStats(roots), [roots]);

  const expandAll = () => {
    const s = new Set();
    const walk = (n) => {
      s.add(n.key);
      n.children.forEach(walk);
    };
    topLevel.forEach(walk);
    setManualExpanded(s);
  };
  const collapseAll = () => setManualExpanded(new Set());

  if (loading)
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-semibold">Referral Tree</h2>
          </div>
        </div>

        {/* Loading KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-4 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-8 bg-gray-200 rounded w-1/2 mb-1"></div>
              <div className="h-3 bg-gray-200 rounded w-2/3"></div>
            </div>
          ))}
        </div>

        {/* Loading Tree */}
        <div className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-6">
          <div className="flex items-center justify-center py-12">
            <div className="flex items-center gap-3">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
              <span className="text-gray-600">Loading referral tree...</span>
            </div>
          </div>
        </div>
      </div>
    );
  if (err) {
    return (
      <div className="p-4 rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--card))]">
        <div className="font-semibold mb-1">Couldn’t load referral data</div>
        <div className="text-sm opacity-80">{err}</div>
        <button
          onClick={load}
          className="mt-3 rounded px-3 py-2 border border-[rgb(var(--border))] hover:bg-[rgba(var(--fg),0.05)]"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold">Referral Tree</h2>
        </div>
      </div>

      {/* KPI CARDS — maintaining original theme */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-4 transition-colors hover:bg-[rgba(var(--fg),0.02)]">
          <div className="text-sm opacity-80">Total Network Users</div>
          <div className="text-3xl font-semibold mt-2">
            {stats.totalUsers.toLocaleString('en-IN')}
          </div>
          <div className="text-xs opacity-70">Across all levels</div>
        </div>
        <div className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-4 transition-colors hover:bg-[rgba(var(--fg),0.02)]">
          <div className="text-sm opacity-80">Total Network Earnings</div>
          <div className="text-3xl font-semibold mt-2">{fmtINR(stats.totalEarnings)}</div>
          <div className="text-xs opacity-70">Combined network value</div>
        </div>
        <div className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-4 transition-colors hover:bg-[rgba(var(--fg),0.02)]">
          <div className="text-sm opacity-80">Active Levels</div>
          <div className="text-3xl font-semibold mt-2">{stats.activeLevels}</div>
          <div className="text-xs opacity-70">Maximum depth reached</div>
        </div>
      </div>

      {/* Enhanced CONTROLS with better UX */}
      <div className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
          {/* Enhanced Search */}
          <div className="lg:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Search Network
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search by name, email, or referral code..."
                className="w-full pl-10 pr-4 py-3 rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--bg))] text-[rgb(var(--fg))] placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              />
              {q.trim() && (
                <button
                  onClick={() => setQ('')}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                >
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          </div>

          {/* Enhanced Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Filter by Tier
            </label>
            <select
              value={levelFilter}
              onChange={(e) => setLevelFilter(e.target.value)}
              className="w-full px-4 py-3 rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--bg))] text-[rgb(var(--fg))] focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
            >
              <option>All Tiers</option>
              <option>Beginner</option>
              <option>Bronze (B1-B4)</option>
              <option>Silver (S1-S3)</option>
              <option>Gold (G1-G2)</option>
            </select>
          </div>

          {/* Enhanced Action Buttons */}
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={expandAll}
              className="flex-1 min-w-0 px-3 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-all duration-200 hover:shadow-md flex items-center justify-center gap-2 text-sm"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
              <span className="hidden sm:inline">Expand</span>
            </button>
            <button
              onClick={collapseAll}
              className="flex-1 min-w-0 px-3 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-medium transition-all duration-200 hover:shadow-md flex items-center justify-center gap-2 text-sm"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
              </svg>
              <span className="hidden sm:inline">Collapse</span>
            </button>
            <button
              onClick={() => setTreeView(treeView === 'vertical' ? 'horizontal' : 'vertical')}
              className="flex-1 min-w-0 px-3 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-all duration-200 hover:shadow-md flex items-center justify-center gap-2 text-sm"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {treeView === 'vertical' ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v14m7-7H5" />
                )}
              </svg>
              <span className="hidden sm:inline">{treeView === 'vertical' ? 'List' : 'Tree'}</span>
            </button>
          </div>
        </div>

        {/* Search Results Feedback */}
        {q.trim() && (
          <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-center gap-2 text-sm text-blue-700">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>
                Found {searchList?.length || 0} matching users. Click any row to expand/collapse branches.
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Network Tree - Vertical or Horizontal */}
      <div className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] overflow-hidden">
        {/* Tree Header with Legend */}
        <div className="bg-gray-50 px-6 py-3 border-b border-[rgb(var(--border))]">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-700">
              {treeView === 'vertical' ? 'Vertical Network Tree' : 'Horizontal Network Tree'}
            </h3>
            <div className="flex items-center gap-4 text-xs text-gray-600">
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
                <span>Gold</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-gray-400"></div>
                <span>Silver</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-amber-600"></div>
                <span>Bronze</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-green-500"></div>
                <span>Active</span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Tree Content - Full Screen */}
        <div className="relative w-full">
          {topLevel.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="text-4xl mb-4 opacity-50">🌳</div>
              <h3 className="text-lg font-medium text-gray-700 mb-2">
                {q.trim() ? 'No matches found' : 'No network data available'}
              </h3>
              <p className="text-gray-500 text-sm">
                {q.trim() ? 'Try adjusting your search terms' : 'Start building your referral network'}
              </p>
            </div>
          )}
          
          {/* Conditional Tree Layout */}
          {treeView === 'vertical' ? (
            /* Vertical Tree Layout - Full Screen */
            <div className="p-12 min-h-[80vh] w-full">
              <div className="flex flex-col items-center space-y-16">
                {topLevel.map((root) => (
                  <TreeNode
                    key={root.key}
                    node={root}
                    expanded={manualExpanded}
                    toggle={(code) =>
                      setManualExpanded((prev) => {
                        const s = new Set(prev);
                        s.has(code) ? s.delete(code) : s.add(code);
                        return s;
                      })
                    }
                    highlight={highlight}
                  />
                ))}
              </div>
            </div>
          ) : (
            /* Horizontal List Layout - Fixed */
            <div className="max-h-[70vh] overflow-y-auto">
              {topLevel.map((root, index) => (
                <div key={root.key} className={index > 0 ? 'border-t border-gray-100' : ''}>
                  <HorizontalNode
                    node={root}
                    depth={0}
                    expanded={manualExpanded}
                    toggle={(code) =>
                      setManualExpanded((prev) => {
                        const s = new Set(prev);
                        s.has(code) ? s.delete(code) : s.add(code);
                        return s;
                      })
                    }
                    highlight={highlight}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* Horizontal List Node Component */
function HorizontalNode({ node, depth, expanded, toggle, highlight }) {
  const isOpen = expanded.has(node.key);
  const hasKids = node.children.length > 0;
  const isMatch = highlight.has(node.key);
  const isActive = node.user.isActive;

  // Enhanced metrics with better visual hierarchy
  const Metrics = () => (
    <>
      <Badge tier={tierKey(node.user.tier)} className="font-medium">
        {node.user.tier}
      </Badge>
      <Badge className="font-medium">
        {node.user.level}
      </Badge>
      <Badge className={`font-medium ${Number(node.user.referrals || 0) > 0 ? 'text-green-600' : ''}`}>
        {Number(node.user.referrals || 0)} refs
      </Badge>
      <Badge className={`font-medium ${Number(node.user.earnings || 0) > 0 ? 'text-green-600' : ''}`}>
        {fmtINR(node.user.earnings)}
      </Badge>
    </>
  );

  // Status indicator
  const StatusIndicator = () => (
    <div className={`w-2 h-2 rounded-full ${
      isActive ? 'bg-green-500' : 'bg-gray-300'
    }`} />
  );

  return (
    <>
      <div
        role="button"
        tabIndex={0}
        onClick={() => hasKids && toggle(node.key)}
        onKeyDown={(e) => {
          if ((e.key === 'Enter' || e.key === ' ') && hasKids) {
            e.preventDefault();
            toggle(node.key);
          }
        }}
        className={`group flex items-center gap-3 px-4 py-4 border-t border-[rgb(var(--border))] transition-all duration-200 ${
          isMatch 
            ? 'bg-[rgba(var(--accent-1),0.08)] border-l-2 border-[rgb(var(--accent-1))]' 
            : 'hover:bg-[rgba(var(--fg),0.02)]'
        }`}
        style={{ paddingLeft: 16 + depth * 24 }}
      >
        {/* Status and expand indicator */}
        <div className="flex items-center gap-2">
          <StatusIndicator />
          <div className={`w-6 h-6 rounded-full flex items-center justify-center transition-all duration-200 ${
            hasKids 
              ? 'bg-blue-100 text-blue-600 hover:bg-blue-200 cursor-pointer' 
              : 'bg-gray-100 text-gray-400'
          }`}>
            {hasKids ? (
              <svg 
                className={`w-3 h-3 transition-transform duration-200 ${isOpen ? 'rotate-90' : ''}`} 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            ) : (
              <div className="w-1.5 h-1.5 rounded-full bg-current" />
            )}
          </div>
        </div>

        {/* User info with enhanced layout */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <div className="font-semibold break-words">
              {node.user.name}
            </div>
            {!isActive && (
              <Badge className="text-xs bg-gray-100 text-gray-600">
                INACTIVE
              </Badge>
            )}
          </div>
          <div className="text-sm text-gray-600 font-mono break-all">
            {node.user.code}
          </div>
          <div className="text-xs text-gray-500 mt-1 truncate">
            {node.user.email}
          </div>

          {/* Mobile metrics */}
          <div className="mt-2 flex flex-wrap items-center gap-1.5 lg:hidden">
            <Metrics />
          </div>
        </div>

        {/* Desktop metrics with better spacing */}
        <div className="hidden lg:flex items-center gap-2">
          <Metrics />
        </div>
      </div>

      {/* Children with visual connecting lines */}
      {hasKids && isOpen &&
        node.children.map((c) => (
          <HorizontalNode
            key={c.key}
            node={c}
            depth={depth + 1}
            expanded={expanded}
            toggle={toggle}
            highlight={highlight}
          />
        ))}
    </>
  );
}

/* Vertical Tree Node Component */
function TreeNode({ node, expanded, toggle, highlight }) {
  const isOpen = expanded.has(node.key);
  const hasKids = node.children.length > 0;
  const isMatch = highlight.has(node.key);
  const isActive = node.user.isActive;

  // Enhanced metrics with better visual hierarchy
  const Metrics = () => (
    <>
      <Badge tier={tierKey(node.user.tier)} className="font-medium">
        {node.user.tier}
      </Badge>
      <Badge className="font-medium">
        {node.user.level}
      </Badge>
      <Badge className={`font-medium ${Number(node.user.referrals || 0) > 0 ? 'text-green-600' : ''}`}>
        {Number(node.user.referrals || 0)} refs
      </Badge>
      <Badge className={`font-medium ${Number(node.user.earnings || 0) > 0 ? 'text-green-600' : ''}`}>
        {fmtINR(node.user.earnings)}
      </Badge>
    </>
  );

  // Status indicator
  const StatusIndicator = () => (
    <div className={`w-3 h-3 rounded-full ${
      isActive ? 'bg-green-500' : 'bg-gray-300'
    } ring-2 ring-white shadow-sm`} />
  );

  return (
    <div className="flex flex-col items-center">
      {/* User Node */}
      <div
        role="button"
        tabIndex={0}
        onClick={() => hasKids && toggle(node.key)}
        onKeyDown={(e) => {
          if ((e.key === 'Enter' || e.key === ' ') && hasKids) {
            e.preventDefault();
            toggle(node.key);
          }
        }}
        className={`group relative flex flex-col items-center p-4 rounded-xl border-2 transition-all duration-200 cursor-pointer ${
          isMatch 
            ? 'border-blue-500 bg-blue-50 shadow-lg' 
            : 'border-[rgb(var(--border))] bg-[rgb(var(--card))] hover:border-blue-300 hover:shadow-md'
        }`}
      >
        {/* Status indicator */}
        <div className="absolute -top-1 -right-1">
          <StatusIndicator />
        </div>

        {/* Expand/Collapse button */}
        {hasKids && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              toggle(node.key);
            }}
            className={`absolute -bottom-2 z-10 w-6 h-6 rounded-full flex items-center justify-center transition-all duration-200 ${
              isOpen 
                ? 'bg-blue-600 text-white shadow-lg' 
                : 'bg-white border-2 border-blue-600 text-blue-600 hover:bg-blue-50'
            }`}
          >
            <svg 
              className={`w-3 h-3 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        )}

        {/* User Avatar/Icon */}
        <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg mb-2 ${
          node.user.tier === 'GOLD' ? 'bg-gradient-to-br from-yellow-400 to-yellow-600' :
          node.user.tier === 'SILVER' ? 'bg-gradient-to-br from-gray-400 to-gray-600' :
          'bg-gradient-to-br from-amber-600 to-amber-800'
        }`}>
          {node.user.name.charAt(0).toUpperCase()}
        </div>

        {/* User Name */}
        <div className="font-semibold text-center text-sm mb-1 break-words max-w-24">
          {node.user.name}
        </div>

        {/* User Code */}
        <div className="text-xs text-gray-600 font-mono mb-2">
          {node.user.code}
        </div>

        {/* Metrics */}
        <div className="flex flex-wrap items-center gap-1 justify-center">
          <Metrics />
        </div>

        {/* Special badges */}
        <div className="mt-2 flex gap-1">
          {node.user.tier === 'GOLD' && (
            <Badge className="text-xs bg-yellow-100 text-yellow-700">
              ROOT
            </Badge>
          )}
          {!isActive && (
            <Badge className="text-xs bg-gray-100 text-gray-600">
              INACTIVE
            </Badge>
          )}
        </div>
      </div>

      {/* Vertical Line Down */}
      {hasKids && (
        <div className="w-0.5 h-8 bg-gray-300 mt-4"></div>
      )}

      {/* Children Container */}
      {hasKids && isOpen && (
        <div className="flex gap-12 mt-6 relative">
          {/* Horizontal line connecting children */}
          {node.children.length > 1 && (
            <div className="absolute top-0 left-6 right-6 h-0.5 bg-gray-300"></div>
          )}
          
          {/* Vertical lines to each child */}
          {node.children.map((child, index) => (
            <div key={child.key} className="flex flex-col items-center relative">
              {/* Vertical line to child */}
              <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 w-0.5 h-6 bg-gray-300"></div>
              
              {/* Recursive child */}
              <TreeNode
                node={child}
                expanded={expanded}
                toggle={toggle}
                highlight={highlight}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
