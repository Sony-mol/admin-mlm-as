import React, { useEffect, useMemo, useState } from 'react';
import { SkeletonReferralTreePage } from '../components/SkeletonLoader';

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
 * Enhanced user normalization with network identification
 * Maps backend data to UI format with better field mapping
 */
function normalizeUsers(arr) {
  return (Array.isArray(arr) ? arr : []).map((u, index) => ({
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
    earnings: u.totalEarnings ?? u.earnings ?? u.walletBalance ?? 0,  // Use totalEarnings if available, fallback to walletBalance
    status: u.status ?? 'PENDING',
    joinDate: u.createdAt ?? u.joinDate ?? null,
    
    // Additional fields for enhanced UI
    walletBalance: u.walletBalance ?? 0,
    isActive: u.status === 'ACTIVE',
    totalOrders: u.totalOrders ?? 0,
    lastActive: u.updatedAt ?? u.lastActive ?? null,
    
    // Network identification
    networkId: u.networkId ?? `NET${String(index + 1).padStart(3, '0')}`,
    networkName: u.networkName ?? `Network ${index + 1}`,
    networkColor: u.networkColor ?? getNetworkColor(index),
    isRootUser: !u.referredByCode && !u.sponsorCode,
  }));
}

/**
 * Generate network colors for visual identification
 */
function getNetworkColor(index) {
  const colors = [
    'bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-orange-500', 
    'bg-pink-500', 'bg-indigo-500', 'bg-teal-500', 'bg-red-500',
    'bg-yellow-500', 'bg-cyan-500', 'bg-lime-500', 'bg-amber-500'
  ];
  return colors[index % colors.length];
}

  function buildTreeFromUsers(users) {
    console.log('=== buildTreeFromUsers START ===');
    console.log('Input users to buildTreeFromUsers:', users);
    
    const nodes = new Map(
      users.map((u) => [
        u.code,
        { key: u.code, user: u, children: [], order: u.sponsorOrder ?? 0 },
      ])
    );

    console.log('Created nodes map:', nodes);

    const roots = [];
    nodes.forEach((node) => {
      const pCode = (node.user.sponsorCode ?? '') || null;
      console.log(`Processing node ${node.user.name} (${node.user.code}), sponsor: ${pCode}`);
      
      if (!pCode) {
        console.log(`Adding ${node.user.name} as root`);
        roots.push(node);
        return;
      }
      
      const parent = nodes.get(pCode);
      if (parent) {
        console.log(`Adding ${node.user.name} as child of ${parent.user.name}`);
        parent.children.push(node);
      } else {
        console.log(`Parent ${pCode} not found for ${node.user.name}, adding as orphaned root`);
        // If parent not found, add as root but mark as orphaned
        node.user.isOrphaned = true;
        roots.push(node);
      }
    });

    const sortRec = (n) => {
      n.children.sort(
        (a, b) => (a.order - b.order) || a.user.name.localeCompare(b.user.name)
      );
      n.children.forEach(sortRec);
    };
    roots.forEach(sortRec);

    console.log('Final roots:', roots);
    console.log('Final nodes index:', nodes);
    console.log('=== buildTreeFromUsers END ===');
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

/** Network filtering function */
function filterNetworks(roots, filters, mode = 'strict') {
  if (!hasActiveFilters(filters)) return roots;
  
  if (mode === 'strict') {
    return filterNetworksStrict(roots, filters);
  } else {
    return filterNetworksNetwork(roots, filters);
  }
}

/** Strict filtering - show matching nodes and their children */
function filterNetworksStrict(roots, filters) {
  const filtered = [];
  
  const walk = (node) => {
    if (matchesFilters(node.user, filters)) {
      // This node matches, include it with ALL its children (not filtered)
      filtered.push({
        ...node,
        children: node.children // Include all children, don't filter them
      });
    } else {
      // This node doesn't match, check its children
      node.children.forEach(walk);
    }
  };
  
  roots.forEach(walk);
  return filtered;
}

/** Recursively filter children in strict mode */
function filterChildrenStrict(children, filters) {
  const filtered = [];
  
  children.forEach(child => {
    if (matchesFilters(child.user, filters)) {
      // This child matches, include it with ALL its descendants
      filtered.push({
        ...child,
        children: child.children // Include all descendants, don't filter them
      });
    } else {
      // This child doesn't match, but check if it has matching descendants
      const filteredDescendants = filterChildrenStrict(child.children, filters);
      if (filteredDescendants.length > 0) {
        // Include this child as a bridge to matching descendants
        filtered.push({
          ...child,
          children: filteredDescendants
        });
      }
    }
  });
  
  return filtered;
}

/** Network filtering - show entire networks if any member matches */
function filterNetworksNetwork(roots, filters) {
  const filtered = [];
  
  const walk = (node) => {
    // Check if this node or any descendant matches
    if (hasMatchingDescendants(node, filters)) {
      filtered.push({
        ...node,
        children: filterChildrenNetwork(node.children, filters)
      });
    }
  };
  
  roots.forEach(walk);
  return filtered;
}

/** Recursively filter children in network mode */
function filterChildrenNetwork(children, filters) {
  const filtered = [];
  
  children.forEach(child => {
    if (hasMatchingDescendants(child, filters)) {
      filtered.push({
        ...child,
        children: filterChildrenNetwork(child.children, filters)
      });
    }
  });
  
  return filtered;
}

/** Check if user matches current filters */
function matchesFilters(user, filters) {
  // Tier filter
  if (filters.tiers.length > 0 && !filters.tiers.includes(user.tier)) {
    return false;
  }
  
  // Status filter
  if (filters.statuses.length > 0) {
    const userStatus = user.isActive ? 'ACTIVE' : user.status || 'INACTIVE';
    if (!filters.statuses.includes(userStatus)) {
      return false;
    }
  }
  
  // Network filter
  if (filters.networks.length > 0 && !filters.networks.includes(user.networkId)) {
    return false;
  }
  
  // Earnings range filter
  const earnings = Number(user.earnings || 0);
  if (filters.minEarnings && earnings < Number(filters.minEarnings)) {
    return false;
  }
  if (filters.maxEarnings && earnings > Number(filters.maxEarnings)) {
    return false;
  }
  
  // Referrals range filter
  const referrals = Number(user.referrals || 0);
  if (filters.minReferrals && referrals < Number(filters.minReferrals)) {
    return false;
  }
  if (filters.maxReferrals && referrals > Number(filters.maxReferrals)) {
    return false;
  }
  
  // Date range filter
  if (filters.dateRange.start || filters.dateRange.end) {
    const joinDate = new Date(user.joinDate);
    if (filters.dateRange.start && joinDate < new Date(filters.dateRange.start)) {
      return false;
    }
    if (filters.dateRange.end && joinDate > new Date(filters.dateRange.end)) {
      return false;
    }
  }
  
  return true;
}

/** Check if node has any descendants that match filters */
function hasMatchingDescendants(node, filters) {
  if (matchesFilters(node.user, filters)) return true;
  return node.children.some(child => hasMatchingDescendants(child, filters));
}

/** Check if any filters are active */
function hasActiveFilters(filters) {
  return filters.tiers.length > 0 ||
         filters.statuses.length > 0 ||
         filters.networks.length > 0 ||
         filters.minEarnings ||
         filters.maxEarnings ||
         filters.minReferrals ||
         filters.maxReferrals ||
         filters.dateRange.start ||
         filters.dateRange.end;
}

/** Get available filter options from users */
function getFilterOptions(users) {
  const options = {
    tiers: [...new Set(users.map(u => u.tier))].filter(Boolean),
    statuses: [...new Set(users.map(u => u.isActive ? 'ACTIVE' : u.status || 'INACTIVE'))].filter(Boolean),
    networks: [...new Set(users.map(u => u.networkId))].filter(Boolean),
    minEarnings: Math.min(...users.map(u => Number(u.earnings || 0))),
    maxEarnings: Math.max(...users.map(u => Number(u.earnings || 0))),
    minReferrals: Math.min(...users.map(u => Number(u.referrals || 0))),
    maxReferrals: Math.max(...users.map(u => Number(u.referrals || 0)))
  };
  return options;
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
       level: 'Level 8',
       referrals: 8,
       earnings: 15750,
       walletBalance: 15750,
       status: 'ACTIVE',
       isActive: true,
       totalOrders: 12,
       networkId: 'NET001',
       networkName: 'Gold Network',
       networkColor: 'bg-yellow-500',
       isRootUser: true,
     },
     {
       id: 'SAMPLE002',
       code: 'REF002',
       sponsorCode: 'REF001',
       name: 'Sarah Williams',
       email: 'sarah.w@example.com',
       tier: 'SILVER',
       level: 'Level 6',
       referrals: 5,
       earnings: 8750,
       walletBalance: 8750,
       status: 'ACTIVE',
       isActive: true,
       totalOrders: 8,
       networkId: 'NET001',
       networkName: 'Gold Network',
       networkColor: 'bg-yellow-500',
       isRootUser: false,
     },
     {
       id: 'SAMPLE003',
       code: 'REF003',
       sponsorCode: 'REF001',
       name: 'Michael Chen',
       email: 'michael.chen@example.com',
       tier: 'BRONZE',
       level: 'Level 2',
       referrals: 3,
       earnings: 4200,
       walletBalance: 4200,
       status: 'ACTIVE',
       isActive: true,
       totalOrders: 5,
       networkId: 'NET001',
       networkName: 'Gold Network',
       networkColor: 'bg-yellow-500',
       isRootUser: false,
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
       networkId: 'NET001',
       networkName: 'Gold Network',
       networkColor: 'bg-yellow-500',
       isRootUser: false,
     },
     {
       id: 'SAMPLE009',
       code: 'REF009',
       sponsorCode: '',
       name: 'David Smith',
       email: 'david.smith@example.com',
       tier: 'BRONZE',
       level: 'Level 3',
       referrals: 4,
       earnings: 2500,
       walletBalance: 2500,
       status: 'ACTIVE',
       isActive: true,
       totalOrders: 3,
       networkId: 'NET002',
       networkName: 'Bronze Network',
       networkColor: 'bg-amber-500',
       isRootUser: true,
     },
     {
       id: 'SAMPLE010',
       code: 'REF010',
       sponsorCode: 'REF009',
       name: 'Lisa Wilson',
       email: 'lisa.wilson@example.com',
       tier: 'BRONZE',
       level: 'Level 1',
       referrals: 2,
       earnings: 800,
       walletBalance: 800,
       status: 'ACTIVE',
       isActive: true,
       totalOrders: 1,
       networkId: 'NET002',
       networkName: 'Bronze Network',
       networkColor: 'bg-amber-500',
       isRootUser: false,
     },
     {
       id: 'SAMPLE011',
       code: 'REF011',
       sponsorCode: '',
       name: 'Charan Kumar',
       email: 'charan.kumar@example.com',
       tier: 'SILVER',
       level: 'Level 2',
       referrals: 6,
       earnings: 810,
       walletBalance: 810,
       status: 'ACTIVE',
       isActive: true,
       totalOrders: 4,
       networkId: 'NET003',
       networkName: 'Silver Network',
       networkColor: 'bg-gray-500',
       isRootUser: true,
     },
     {
       id: 'SAMPLE012',
       code: 'REF012',
       sponsorCode: 'REF011',
       name: 'Priya Sharma',
       email: 'priya.sharma@example.com',
       tier: 'SILVER',
       level: 'Level 1',
       referrals: 3,
       earnings: 600,
       walletBalance: 600,
       status: 'ACTIVE',
       isActive: true,
       totalOrders: 2,
       networkId: 'NET003',
       networkName: 'Silver Network',
       networkColor: 'bg-gray-500',
       isRootUser: false,
     },
     {
       id: 'SAMPLE013',
       code: 'REF013',
       sponsorCode: 'REF542909', // Gouhar's referral code
       name: 'Gouhar Child 1',
       email: 'gouhar.child1@example.com',
       tier: 'BRONZE',
       level: 'Level 1',
       referrals: 0,
       earnings: 100,
       walletBalance: 100,
       status: 'ACTIVE',
       isActive: true,
       totalOrders: 1,
       networkId: 'NET007',
       networkName: 'Network 7',
       networkColor: 'bg-teal-500',
       isRootUser: false,
     },
     {
       id: 'SAMPLE014',
       code: 'REF014',
       sponsorCode: 'REF542909', // Gouhar's referral code
       name: 'Gouhar Child 2',
       email: 'gouhar.child2@example.com',
       tier: 'BRONZE',
       level: 'Level 1',
       referrals: 0,
       earnings: 80,
       walletBalance: 80,
       status: 'ACTIVE',
       isActive: true,
       totalOrders: 1,
       networkId: 'NET007',
       networkName: 'Network 7',
       networkColor: 'bg-teal-500',
       isRootUser: false,
     }
  ];

  // If no users exist, return sample data
  if (users.length === 0) {
    return sampleUsers;
  }

  // If users exist but have no earnings, enhance them with sample data
  const enhancedUsers = users.map((user, index) => {
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

  // ALWAYS add Gouhar's children if Gouhar exists
  const gouharExists = enhancedUsers.some(u => u.code === 'REF542909');
  if (gouharExists) {
    console.log('Gouhar found, adding his children to enhanced users');
    const gouharChildren = [
      {
        id: 'SAMPLE013',
        code: 'REF013',
        sponsorCode: 'REF542909',
        name: 'Gouhar Child 1',
        email: 'gouhar.child1@example.com',
        tier: 'BRONZE',
        level: 'Level 1',
        referrals: 0,
        earnings: 100,
        walletBalance: 100,
        status: 'ACTIVE',
        isActive: true,
        totalOrders: 1,
        networkId: 'NET007',
        networkName: 'Network 7',
        networkColor: 'bg-teal-500',
        isRootUser: false,
      },
      {
        id: 'SAMPLE014',
        code: 'REF014',
        sponsorCode: 'REF542909',
        name: 'Gouhar Child 2',
        email: 'gouhar.child2@example.com',
        tier: 'BRONZE',
        level: 'Level 1',
        referrals: 0,
        earnings: 80,
        walletBalance: 80,
        status: 'ACTIVE',
        isActive: true,
        totalOrders: 1,
        networkId: 'NET007',
        networkName: 'Network 7',
        networkColor: 'bg-teal-500',
        isRootUser: false,
      }
    ];
    return [...enhancedUsers, ...gouharChildren];
  }

  return enhancedUsers;
}

/* ---------------- Page ---------------- */
export default function ReferralTree() {
  const [users, setUsers] = useState([]);
  const [err, setErr] = useState(null);
  const [loading, setLoading] = useState(true);

  const [q, setQ] = useState('');
  const [treeView, setTreeView] = useState('vertical'); // 'vertical' or 'horizontal'
  const [zoomLevel, setZoomLevel] = useState(1); // Zoom level for tree view

  // manual expanded toggles (keys)
  const [manualExpanded, setManualExpanded] = useState(new Set());

  // Filter UI state
  const [showFilters, setShowFilters] = useState(false);

  // Network filtering state
  const [filters, setFilters] = useState({
    tiers: [], // ['GOLD', 'SILVER', 'BRONZE']
    statuses: [], // ['ACTIVE', 'PENDING', 'INACTIVE']
    networks: [], // Network IDs or names
    minEarnings: '',
    maxEarnings: '',
    minReferrals: '',
    maxReferrals: '',
    dateRange: {
      start: '',
      end: ''
    }
  });

  // Filter mode: 'strict' (only matching nodes) or 'network' (show networks with any matching members)
  const [filterMode, setFilterMode] = useState('strict');

  async function load() {
    try {
      setLoading(true);
      
      // Fetch users data
      const res = await fetch(API_USERS, { cache: 'no-store' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      let normalized = normalizeUsers(json);
      
      // Use real data only - no sample data enhancement
      // normalized = enhanceWithSampleData(normalized);
      
      // Debug: Log actual earnings data
      console.log('=== REAL EARNINGS DATA ===');
      console.log('Total users:', normalized.length);
      console.log('Sample user earnings:', normalized.slice(0, 5).map(u => ({
        name: u.name,
        earnings: u.earnings,
        walletBalance: u.walletBalance,
        totalEarnings: u.totalEarnings
      })));
      
      const totalEarnings = normalized.reduce((sum, user) => sum + (user.earnings || 0), 0);
      console.log('Total calculated earnings:', totalEarnings);
      console.log('=========================');
      
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

  const { roots: allRoots } = useMemo(() => {
    console.log('=== BUILDING TREE FROM USERS ===');
    console.log('Input users:', users);
    console.log('Users with REF542909 sponsor code:', users.filter(u => u.sponsorCode === 'REF542909'));
    
    const result = buildTreeFromUsers(users);
    console.log('Built tree roots:', result.roots);
    console.log('Tree index:', result.index);
    
    // Check specifically for Gouhar
    const gouharNode = result.index.get('REF542909');
    if (gouharNode) {
      console.log('Gouhar node found:', gouharNode);
      console.log('Gouhar children:', gouharNode.children);
      console.log('Gouhar has kids:', gouharNode.children.length > 0);
    } else {
      console.log('Gouhar node NOT found in tree index');
    }
    
    // Check for Gouhar's children in the index
    const gouharChild1 = result.index.get('REF013');
    const gouharChild2 = result.index.get('REF014');
    console.log('Gouhar Child 1 found:', gouharChild1);
    console.log('Gouhar Child 2 found:', gouharChild2);
    
    console.log('=== TREE BUILDING COMPLETE ===');
    return result;
  }, [users]);


  const roots = useMemo(() => {
    console.log('=== ROOTS - APPLYING FILTERS ===');
    console.log('allRoots:', allRoots);
    console.log('filters:', filters);
    console.log('filterMode:', filterMode);
    
    // Apply network filtering with the selected mode
    const filteredRoots = filterNetworks(allRoots, filters, filterMode);
    console.log('filteredRoots:', filteredRoots);
    
    return filteredRoots;
  }, [allRoots, filters, filterMode]);

  const { results: searchList, highlight } = useMemo(
    () => spotlightSearch(roots, q),
    [roots, q]
  );
  const topLevel = searchList ?? roots;

  const stats = useMemo(() => computeStats(roots), [roots]);

  // Filter management functions
  const updateFilter = (filterType, value) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: value
    }));
  };

  const toggleArrayFilter = (filterType, value) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: prev[filterType].includes(value)
        ? prev[filterType].filter(item => item !== value)
        : [...prev[filterType], value]
    }));
  };

  const clearAllFilters = () => {
    setFilters({
      tiers: [],
      statuses: [],
      networks: [],
      minEarnings: '',
      maxEarnings: '',
      minReferrals: '',
      maxReferrals: '',
      dateRange: {
        start: '',
        end: ''
      }
    });
  };

  const clearFilter = (filterType) => {
    if (filterType === 'dateRange') {
      setFilters(prev => ({
        ...prev,
        dateRange: { start: '', end: '' }
      }));
    } else {
      setFilters(prev => ({
        ...prev,
        [filterType]: Array.isArray(prev[filterType]) ? [] : ''
      }));
    }
  };

  // Get available filter options
  const filterOptions = useMemo(() => getFilterOptions(users), [users]);

  const expandAll = () => {
    const s = new Set();
    const walk = (n) => {
      s.add(n.key);
      n.children.forEach(walk);
    };
    topLevel.forEach(walk);
    setManualExpanded(s);
    // Auto zoom out when expanding all to show full tree
    if (treeView === 'vertical') {
      setZoomLevel(0.7);
    }
  };
  const collapseAll = () => {
    setManualExpanded(new Set());
    setZoomLevel(1);
  };

  // Zoom functions
  const zoomIn = () => setZoomLevel(prev => Math.min(prev + 0.2, 2));
  const zoomOut = () => setZoomLevel(prev => Math.max(prev - 0.2, 0.3));
  const resetZoom = () => setZoomLevel(1);

  if (loading) return <SkeletonReferralTreePage />;
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
         {/* Search and Filters Row - Compact */}
         <div className="flex flex-col sm:flex-row gap-4 mb-6">
           {/* Enhanced Search */}
           <div className="flex-1">
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

           {/* Filter Networks Button - Compact */}
           <div className="sm:w-64">
             <label className="block text-sm font-medium text-gray-700 mb-2">
               Filters
             </label>
             <button
               onClick={() => setShowFilters(!showFilters)}
               className="w-full px-4 py-3 rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--bg))] text-[rgb(var(--fg))] hover:bg-[rgba(var(--fg),0.05)] transition-all duration-200 flex items-center justify-between"
             >
               <div className="flex items-center gap-2">
                 <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                 </svg>
                 <span className="text-sm">
                   {hasActiveFilters(filters) ? `${Object.values(filters).flat().filter(Boolean).length} Active` : 'Filter Options'}
                 </span>
               </div>
               <svg 
                 className={`h-4 w-4 text-gray-400 transition-transform duration-200 ${showFilters ? 'rotate-180' : ''}`} 
                 fill="none" 
                 stroke="currentColor" 
                 viewBox="0 0 24 24"
               >
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
               </svg>
             </button>
           </div>
         </div>

         {/* Advanced Filters Panel */}
         {showFilters && (
           <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
             {/* Compact Header */}
             <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
               <h3 className="text-base font-semibold text-gray-800">Filter Networks</h3>
               <div className="flex items-center gap-3">
                 {/* Filter Mode Selector */}
                 <div className="flex items-center gap-2">
                   <label className="text-xs font-medium text-gray-600">Mode:</label>
                   <select
                     value={filterMode}
                     onChange={(e) => setFilterMode(e.target.value)}
                     className="px-2 py-1 border border-gray-300 rounded text-xs bg-white focus:ring-1 focus:ring-blue-500"
                     title={filterMode === 'strict' ? 'Show only matching users + their children' : 'Show entire networks containing matching users'}
                   >
                     <option value="strict">Strict</option>
                     <option value="network">Network</option>
                   </select>
                 </div>
                 <button
                   onClick={clearAllFilters}
                   className="text-xs text-red-600 hover:text-red-800 flex items-center gap-1 px-2 py-1 rounded hover:bg-red-50"
                 >
                   <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                   </svg>
                   Clear All
                 </button>
               </div>
             </div>

             {/* Clean Filter Layout */}
             <div className="space-y-6">
               {/* Primary Filters Row */}
               <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                 {/* Tier Filter - Dropdown */}
                 <div>
                   <label className="block text-sm font-medium text-gray-700 mb-2">Tier</label>
                   <select
                     multiple
                     value={filters.tiers}
                     onChange={(e) => {
                       const selectedTiers = Array.from(e.target.selectedOptions, option => option.value);
                       updateFilter('tiers', selectedTiers);
                     }}
                     className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                     size="3"
                   >
                     {filterOptions.tiers.map(tier => (
                       <option key={tier} value={tier}>{tier}</option>
                     ))}
                   </select>
                   <div className="text-xs text-gray-500 mt-1">Hold Ctrl/Cmd to select multiple</div>
                 </div>

                 {/* Status Filter - Dropdown */}
                 <div>
                   <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                   <select
                     multiple
                     value={filters.statuses}
                     onChange={(e) => {
                       const selectedStatuses = Array.from(e.target.selectedOptions, option => option.value);
                       updateFilter('statuses', selectedStatuses);
                     }}
                     className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                     size="3"
                   >
                     {filterOptions.statuses.map(status => (
                       <option key={status} value={status}>{status}</option>
                     ))}
                   </select>
                   <div className="text-xs text-gray-500 mt-1">Hold Ctrl/Cmd to select multiple</div>
                 </div>

                 {/* Network Filter - Searchable Dropdown */}
                 <div>
                   <label className="block text-sm font-medium text-gray-700 mb-2">Network</label>
                   <select
                     multiple
                     value={filters.networks}
                     onChange={(e) => {
                       const selectedNetworks = Array.from(e.target.selectedOptions, option => option.value);
                       updateFilter('networks', selectedNetworks);
                     }}
                     className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                     size="4"
                   >
                     {filterOptions.networks.map(network => (
                       <option key={network} value={network}>{network}</option>
                     ))}
                   </select>
                   <div className="text-xs text-gray-500 mt-1">Hold Ctrl/Cmd to select multiple</div>
                 </div>
               </div>

               {/* Range Filters Row */}
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 {/* Earnings Range */}
                 <div>
                   <label className="block text-sm font-medium text-gray-700 mb-2">Earnings Range</label>
                   <div className="grid grid-cols-2 gap-2">
                     <input
                       type="number"
                       placeholder="Min ₹"
                       value={filters.minEarnings}
                       onChange={(e) => updateFilter('minEarnings', e.target.value)}
                       className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                     />
                     <input
                       type="number"
                       placeholder="Max ₹"
                       value={filters.maxEarnings}
                       onChange={(e) => updateFilter('maxEarnings', e.target.value)}
                       className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                     />
                   </div>
                 </div>

                 {/* Referrals Range */}
                 <div>
                   <label className="block text-sm font-medium text-gray-700 mb-2">Referrals Range</label>
                   <div className="grid grid-cols-2 gap-2">
                     <input
                       type="number"
                       placeholder="Min refs"
                       value={filters.minReferrals}
                       onChange={(e) => updateFilter('minReferrals', e.target.value)}
                       className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                     />
                     <input
                       type="number"
                       placeholder="Max refs"
                       value={filters.maxReferrals}
                       onChange={(e) => updateFilter('maxReferrals', e.target.value)}
                       className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                     />
                   </div>
                 </div>
               </div>

               {/* Date Range Row */}
               <div>
                 <label className="block text-sm font-medium text-gray-700 mb-2">Join Date Range</label>
                 <div className="grid grid-cols-2 gap-2">
                   <input
                     type="date"
                     value={filters.dateRange.start}
                     onChange={(e) => updateFilter('dateRange', { ...filters.dateRange, start: e.target.value })}
                     className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                   />
                   <input
                     type="date"
                     value={filters.dateRange.end}
                     onChange={(e) => updateFilter('dateRange', { ...filters.dateRange, end: e.target.value })}
                     className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                   />
                 </div>
               </div>
             </div>
           </div>
         )}

         {/* Action Buttons Row - Properly Aligned */}
         <div className="flex flex-wrap gap-3 items-center justify-between">
           {/* Tree Control Buttons */}
           <div className="flex gap-3">
            <button
              onClick={expandAll}
               className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-all duration-200 hover:shadow-md flex items-center gap-2 text-sm min-w-[100px] justify-center"
            >
               <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
               </svg>
               <span>Expand</span>
            </button>
            <button
              onClick={collapseAll}
               className="px-4 py-2.5 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-medium transition-all duration-200 hover:shadow-md flex items-center gap-2 text-sm min-w-[100px] justify-center"
             >
               <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
               </svg>
               <span>Collapse</span>
             </button>
             <button
               onClick={() => setTreeView(treeView === 'vertical' ? 'horizontal' : 'vertical')}
               className="px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-all duration-200 hover:shadow-md flex items-center gap-2 text-sm min-w-[100px] justify-center"
             >
               <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                 {treeView === 'vertical' ? (
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                 ) : (
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v14m7-7H5" />
                 )}
               </svg>
               <span>{treeView === 'vertical' ? 'List' : 'Tree'}</span>
            </button>
          </div>

           {/* Zoom Controls */}
           <div className="flex gap-3 items-center">
             <button
               onClick={zoomIn}
               className="px-4 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-all duration-200 hover:shadow-md flex items-center gap-2 text-sm min-w-[100px] justify-center"
               title="Zoom In"
             >
               <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
               </svg>
               <span>Zoom In</span>
             </button>
             <button
               onClick={zoomOut}
               className="px-4 py-2.5 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-medium transition-all duration-200 hover:shadow-md flex items-center gap-2 text-sm min-w-[100px] justify-center"
               title="Zoom Out"
             >
               <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM13 10H7" />
               </svg>
               <span>Zoom Out</span>
             </button>
             <button
               onClick={resetZoom}
               className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-all duration-200 hover:shadow-md flex items-center gap-2 text-sm min-w-[100px] justify-center"
               title="Reset Zoom"
             >
               <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
               </svg>
               <span>Reset</span>
             </button>
             
             {/* Zoom Level Indicator */}
             <div className="flex items-center px-4 py-2.5 bg-gray-100 rounded-lg text-sm font-medium min-w-[80px] justify-center">
               <span className="text-gray-700">{Math.round(zoomLevel * 100)}%</span>
             </div>
          </div>
        </div>

        {/* Active Filters Display */}
        {hasActiveFilters(filters) && (
          <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-center gap-2 text-sm text-blue-700 mb-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
              </svg>
              <span className="font-medium">Active Filters:</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {/* Tier Filters */}
              {filters.tiers.map(tier => (
                <span key={`tier-${tier}`} className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                  {tier}
                  <button
                    onClick={() => toggleArrayFilter('tiers', tier)}
                    className="hover:bg-blue-200 rounded-full p-0.5"
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </span>
              ))}
              
              {/* Status Filters */}
              {filters.statuses.map(status => (
                <span key={`status-${status}`} className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                  {status}
                  <button
                    onClick={() => toggleArrayFilter('statuses', status)}
                    className="hover:bg-green-200 rounded-full p-0.5"
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </span>
              ))}
              
              {/* Network Filters */}
              {filters.networks.map(network => (
                <span key={`network-${network}`} className="inline-flex items-center gap-1 px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded-full">
                  {network}
                  <button
                    onClick={() => toggleArrayFilter('networks', network)}
                    className="hover:bg-purple-200 rounded-full p-0.5"
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </span>
              ))}
              
              {/* Range Filters */}
              {filters.minEarnings && (
                <span className="inline-flex items-center gap-1 px-2 py-1 bg-orange-100 text-orange-800 text-xs rounded-full">
                  Earnings: {filters.minEarnings}+
                  <button
                    onClick={() => updateFilter('minEarnings', '')}
                    className="hover:bg-orange-200 rounded-full p-0.5"
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </span>
              )}
              
              {filters.maxEarnings && (
                <span className="inline-flex items-center gap-1 px-2 py-1 bg-orange-100 text-orange-800 text-xs rounded-full">
                  Earnings: ≤{filters.maxEarnings}
                  <button
                    onClick={() => updateFilter('maxEarnings', '')}
                    className="hover:bg-orange-200 rounded-full p-0.5"
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </span>
              )}
              
              {/* Clear All Button */}
              <button
                onClick={clearAllFilters}
                className="inline-flex items-center gap-1 px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full hover:bg-red-200 transition-colors"
              >
                Clear All
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        )}

        {/* Search Results Feedback */}
        {q.trim() && (
          <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-center gap-2 text-sm text-blue-700">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div className="flex flex-wrap items-center gap-4">
                <span>
                  Showing {topLevel.length} users matching "{q}"
                </span>
                <button
                  onClick={() => setQ('')}
                  className="text-xs bg-blue-100 hover:bg-blue-200 px-2 py-1 rounded transition-colors"
                >
                  Clear Search
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Network Tree - Vertical or Horizontal */}
      <div className="rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] overflow-hidden">
        {/* Tree Header with Legend */}
        <div className="bg-gray-50 px-6 py-3 border-b border-[rgb(var(--border))]">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-gray-700">
                {treeView === 'vertical' ? 'Vertical Network Tree' : 'Horizontal Network Tree'}
              </h3>
              <p className="text-xs text-gray-500 mt-1">
                {hasActiveFilters(filters) ? (
                  <span className="flex items-center gap-2">
                    <span>Showing: Filtered Networks ({filterMode === 'strict' ? 'Strict Mode' : 'Network Mode'})</span>
                    <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full text-xs">
                      {roots.length} networks
                    </span>
                  </span>
                ) : (
                  'Showing: All Networks'
                )}
              </p>
            </div>
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
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                <span>Network</span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Tree Content - Full Screen with Zoom */}
        <div className="relative w-full overflow-auto">
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
            /* Vertical Tree Layout - Full Screen with Zoom */
            <div 
              className="p-12 min-h-[80vh] w-full"
              style={{
                transform: `scale(${zoomLevel})`,
                transformOrigin: 'top center',
                width: `${100 / zoomLevel}%`,
                minWidth: '100%'
              }}
            >
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
        onClick={() => {
          console.log('Node clicked:', node.key, 'hasKids:', hasKids);
          if (hasKids) {
            toggle(node.key);
          }
        }}
        onKeyDown={(e) => {
          if ((e.key === 'Enter' || e.key === ' ') && hasKids) {
            e.preventDefault();
            toggle(node.key);
          }
        }}
        className={`group relative flex flex-col items-center p-4 rounded-xl border-2 transition-all duration-200 ${
          hasKids ? 'cursor-pointer' : 'cursor-default'
        } ${
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
              console.log('Expand button clicked for:', node.key, 'Current expanded:', Array.from(expanded));
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

        {/* User Avatar/Icon with Network Color */}
        <div className="relative">
          <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg mb-2 ${
            node.user.tier === 'GOLD' ? 'bg-gradient-to-br from-yellow-400 to-yellow-600' :
            node.user.tier === 'SILVER' ? 'bg-gradient-to-br from-gray-400 to-gray-600' :
            'bg-gradient-to-br from-amber-600 to-amber-800'
          }`}>
            {node.user.name.charAt(0).toUpperCase()}
          </div>
          {/* Network Color Indicator */}
          <div className={`absolute -top-1 -right-1 w-4 h-4 rounded-full border-2 border-white ${node.user.networkColor}`} 
               title={`Network: ${node.user.networkName}`} />
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
        <div className="mt-2 flex flex-col gap-1 items-center">
          <div className="flex gap-1">
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
          {/* Network Badge */}
          <Badge className={`text-xs text-white ${node.user.networkColor} border-0`}>
            {node.user.networkName}
          </Badge>
        </div>
      </div>

      {/* Vertical Line Down */}
      {hasKids && (
        <div className="w-0.5 h-8 bg-gray-300 mt-4"></div>
      )}

      {/* Children Container */}
      {hasKids && isOpen && (
        <div className="flex gap-8 mt-6 relative flex-wrap justify-center">
          {/* Horizontal line connecting children */}
          {node.children.length > 1 && (
            <div className="absolute top-0 left-8 right-8 h-0.5 bg-gray-300"></div>
          )}
          
          {/* Vertical lines to each child */}
          {node.children.map((child, index) => (
            <div key={child.key} className="flex flex-col items-center relative min-w-[120px]">
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
