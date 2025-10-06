import React, { useEffect, useMemo, useState } from 'react';

// Import API configuration
import { API_ENDPOINTS } from '../config/api';
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

/* badges */
function Badge({ children, className = '', tier = '' }) {
  return (
    <span data-tier={tier} className={`px-2 py-0.5 text-xs rounded-full border border-[rgb(var(--border))] ${className}`}>
      {children}
    </span>
  );
}

/* ---------------- Data helpers ---------------- */
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
  let cnt = 0, sum = 0, depth = 0;
  const walk = (n, d = 1) => {
    cnt++;
    sum += Number(n.user.earnings || 0);
    depth = Math.max(depth, d);
    n.children.forEach((c) => walk(c, d + 1));
  };
  roots.forEach((r) => walk(r, 1));
  return { totalUsers: cnt, totalEarnings: sum, activeLevels: depth };
}

/** Spotlight search */
function spotlightSearch(roots, q) {
  const ql = q.trim().toLowerCase();
  if (!ql) return { results: null, highlight: new Set() };
  const out = [];
  const highlight = new Set();
  const walk = (n) => {
    const hay = `${n.user.name} ${n.user.email || ''} ${n.user.code || ''}`.toLowerCase();
    if (hay.includes(ql)) { out.push(n); highlight.add(n.key); }
    n.children.forEach(walk);
  };
  roots.forEach(walk);
  return { results: out, highlight };
}

/* ---------------- Page ---------------- */
export default function ReferralTree() {
  const [users, setUsers] = useState([]);
  const [err, setErr] = useState(null);
  const [loading, setLoading] = useState(true);

  const [q, setQ] = useState('');
  const [levelFilter, setLevelFilter] = useState('All');

  // manual expanded toggles (keys)
  const [manualExpanded, setManualExpanded] = useState(new Set());

  async function load() {
    try {
      setLoading(true);
      const token = localStorage.getItem('auth') ? JSON.parse(localStorage.getItem('auth')).accessToken : '';
      const headers = { 'Authorization': `Bearer ${token}` };
      
      // Fetch real referral tree data from backend
      const users = [];
      
      try {
        console.log('🔍 REFERRAL TREE PAGE - Starting API calls...');
        console.log('🔑 Token:', token ? `${token.substring(0, 20)}...` : 'NO TOKEN');
        console.log('📡 Headers:', headers);
        
        // Fetch referral tree from backend API
        console.log('🌳 Fetching referral tree from: /api/users/referral-tree');
        const usersRes = await fetch(API_ENDPOINTS.USERS + '/referral-tree', { headers });
        console.log('🌳 Users Response Status:', usersRes.status);
        console.log('🌳 Users Response Headers:', Object.fromEntries(usersRes.headers.entries()));
        
        if (usersRes.ok) {
          const treeData = await usersRes.json();
          console.log('✅ Referral Tree Data Received:', treeData);
          console.log('📊 Total Users Found:', treeData.totalUsers);
          console.log('🌳 Root Nodes:', treeData.rootNodes);
          
          // The backend now returns a tree structure, so we need to flatten it for the frontend
          const flattenTree = (nodes) => {
            const result = [];
            const processNode = (node) => {
              result.push({
                id: node.id,
                name: node.name,
                email: node.email,
                code: node.code,
                tier: node.tier,
                level: node.level,
                referrals: node.referrals,
                earnings: node.earnings,
                status: node.status,
                joinDate: node.joinDate,
                referredBy: node.referredBy,
                referredUsers: node.children ? node.children.map(child => child.id) : []
              });
              
              // Process children recursively
              if (node.children && node.children.length > 0) {
                node.children.forEach(child => processNode(child));
              }
            };
            
            nodes.forEach(node => processNode(node));
            return result;
          };
          
          const transformedUsers = flattenTree(treeData.tree);
          setUsers(transformedUsers);
          console.log('✅ Referral tree loaded successfully:', transformedUsers.length);
        } else {
          console.log('❌ Users API Failed:', usersRes.status, await usersRes.text());
          // Fallback to mock data if API fails
          const mockUsers = [
            {
              id: 38,
              name: 'Test User 1',
              email: 'testuser1@example.com',
              code: 'REF209825',
              tier: 'Gold',
              level: 'G1',
              referrals: 1,
              earnings: 475.00,
              status: 'ACTIVE',
              joinDate: '2024-01-15T10:30:00Z',
              referredBy: null,
              referredUsers: [96]
            },
            {
              id: 96,
              name: 'Test User 2',
              email: 'testuser11@example.com',
              code: 'REF209826',
              tier: 'Silver',
              level: 'S1',
              referrals: 0,
              earnings: 250.00,
              status: 'ACTIVE',
              joinDate: '2024-01-20T14:45:00Z',
              referredBy: 38,
              referredUsers: []
            }
          ];
          setUsers(mockUsers);
        }
        
        setErr(null);
        
      } catch (apiError) {
        console.error('💥 Error fetching referral tree from backend:', apiError);
        // Fallback to mock data
        const mockUsers = [
          {
            id: 38,
            name: 'Test User 1',
            email: 'testuser1@example.com',
            code: 'REF209825',
            tier: 'Gold',
            level: 'G1',
            referrals: 1,
            earnings: 475.00,
            status: 'ACTIVE',
            joinDate: '2024-01-15T10:30:00Z',
            referredBy: null,
            referredUsers: [96]
          },
          {
            id: 96,
            name: 'Test User 2',
            email: 'testuser11@example.com',
            code: 'REF209826',
            tier: 'Silver',
            level: 'S1',
            referrals: 0,
            earnings: 250.00,
            status: 'ACTIVE',
            joinDate: '2024-01-20T14:45:00Z',
            referredBy: 38,
            referredUsers: []
          }
        ];
        setUsers(mockUsers);
        setErr(null);
      }
      
    } catch (e) {
      setErr('Failed to load users');
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => { load(); }, []);

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
    const walk = (n) => { s.add(n.key); n.children.forEach(walk); };
    topLevel.forEach(walk);
    setManualExpanded(s);
  };
  const collapseAll = () => setManualExpanded(new Set());

  if (loading)
    return (
      <div className="rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-4 animate-pulse">
        Loading referral tree…
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
      <h2 className="text-2xl font-semibold">Referral Tree</h2>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-4 transition-colors hover:bg-[rgba(var(--fg),0.02)]">
          <div className="text-sm opacity-80">Total Network Users</div>
          <div className="text-3xl font-semibold mt-2">{stats.totalUsers.toLocaleString('en-IN')}</div>
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

      {/* Controls */}
      <div className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] p-4">
        <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center">
          <div className="flex-1 flex items-center gap-2">
            <span>🔎</span>
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search users… (name, email or code)"
              className="w-full px-3 py-2 rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--bg))] transition-colors hover:border-[rgba(var(--accent-1),0.5)]"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={expandAll}
              className="rounded-lg px-3 py-2 border border-[rgb(var(--border))] hover:bg-[rgba(var(--fg),0.05)]"
            >
              Expand All
            </button>
            <button
              onClick={() => {
                setManualExpanded(new Set());
              }}
              className="rounded-lg px-3 py-2 border border-[rgb(var(--border))] hover:bg-[rgba(var(--fg),0.05)]"
            >
              Collapse All
            </button>
          </div>
          <select
            value={levelFilter}
            onChange={(e) => setLevelFilter(e.target.value)}
            className="px-3 py-2 rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--bg))]"
          >
            <option>All</option>
            <option>Beginner</option>
            <option>B1</option><option>B2</option><option>B3</option><option>B4</option>
            <option>S1</option><option>S2</option><option>S3</option>
            <option>G1</option><option>G2</option>
          </select>
        </div>
        {q.trim() && (
          <div className="mt-2 text-xs opacity-70">
            Tap a row to expand/collapse.
          </div>
        )}
      </div>

      {/* Tree */}
      <div className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--card))]">
        {topLevel.length === 0 && (
          <div className="p-6 text-center opacity-70">
            {q.trim() ? 'No matches found.' : 'No data in tree.'}
          </div>
        )}
        {topLevel.map((root) => (
          <Node
            key={root.key}
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
        ))}
      </div>
    </div>
  );
}

/* ---------------- Row component (responsive) ---------------- */
function Node({ node, depth, expanded, toggle, highlight }) {
  const isOpen = expanded.has(node.key);
  const hasKids = node.children.length > 0;
  const isMatch = highlight.has(node.key);

  // Right-side metrics block (desktop/tablet)
  const Metrics = () => (
    <>
      {node.user.tier && (
        <Badge tier={tierKey(node.user.tier)}>{node.user.tier}</Badge>
      )}
      {node.user.level && <Badge>{node.user.level}</Badge>}
      <Badge>{Number(node.user.referrals || 0).toLocaleString('en-IN')} referrals</Badge>
      <Badge>{fmtINR(node.user.earnings)}</Badge>
    </>
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
        className={`flex flex-wrap items-start gap-3 px-4 py-3 border-t border-[rgb(var(--border))] transition-colors ${
          isMatch ? 'bg-[rgba(var(--accent-1),0.08)]' : 'hover:bg-[rgba(var(--fg),0.04)]'
        }`}
        style={{ paddingLeft: 12 + depth * 20 }}
      >
        <span
          className={`w-6 text-base md:text-lg select-none ${hasKids ? 'opacity-90' : 'opacity-30'} mt-0.5`}
          aria-hidden="true"
        >
          {hasKids ? (isOpen ? '▾' : '▸') : '·'}
        </span>

        {/* Name + code (full width; let it wrap on mobile) */}
        <div className="min-w-0 flex-1">
          <div className="font-medium break-words">{node.user.name}</div>
          <div className="text-xs opacity-70 break-all">{node.user.code}</div>

          {/* On mobile, put metrics BELOW the name so it has full width */}
          <div className="mt-2 flex flex-wrap items-center gap-2 md:hidden">
            <Metrics />
          </div>
        </div>

        {/* On md+ keep metrics on the right, aligned */}
        <div className="ml-auto hidden md:flex flex-wrap items-center gap-2">
          <Metrics />
        </div>
      </div>

      {hasKids && isOpen && node.children.map((c) => (
        <Node
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
