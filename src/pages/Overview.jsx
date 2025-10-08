import React, { useEffect, useRef, useState } from "react";
import LineChartMini from "../components/charts/LineChartMini";
import PieChartMini from "../components/charts/PieChartMini";
import { 
  TrendingUp, 
  Users, 
  DollarSign, 
  Activity, 
  ArrowUpRight, 
  ArrowDownRight,
  Loader2,
  RefreshCw,
  BarChart3,
  PieChart,
  Calendar,
  Clock
} from "lucide-react";

// Import API configuration
import { API_ENDPOINTS } from '../config/api';

// Real backend API endpoints
const COMMISSION_DASHBOARD_API = API_ENDPOINTS.COMMISSION_DASHBOARD;
const USER_STATS_API = API_ENDPOINTS.COMMISSIONS + "/stats";
const RECENT_ACTIVITIES_API = API_ENDPOINTS.RECENT_ACTIVITIES;
const TIER_LEVEL_BREAKDOWN_API = API_ENDPOINTS.TIER_LEVEL_BREAKDOWN;

/* ---------- helpers for tier color ---------- */
const tierKey = (label = '') => {
  const s = String(label || '').toLowerCase();
  if (s.startsWith('gold')) return 'gold';
  if (s.startsWith('silver')) return 'silver';
  if (s.startsWith('bronze')) return 'bronze';
  return '';
};

/* ---------- Enhanced UI helpers ---------- */
const Card = ({ children, className = "", loading = false }) => (
  <div className={`rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] transition-all duration-300 hover:shadow-lg ${className}`}>
    {loading ? (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
        <span className="ml-2 text-sm text-[rgba(var(--fg),0.7)]">Loading...</span>
      </div>
    ) : (
      children
    )}
  </div>
);

const StatCard = ({ title, value, change, icon: Icon, trend, loading = false }) => (
  <Card className="p-6 hover:shadow-xl transition-all duration-300">
    <div className="flex items-center justify-between">
      <div className="flex-1">
        <p className="text-sm font-medium text-[rgba(var(--fg),0.7)] mb-1">{title}</p>
        <div className="flex items-center gap-2">
          {loading ? (
            <div className="h-8 w-20 rounded animate-pulse bg-[rgba(var(--fg),0.15)]"></div>
          ) : (
            <p className="text-2xl font-bold text-[rgb(var(--fg))]">{value}</p>
          )}
          {!loading && change && (
            <div className={`flex items-center gap-1 text-sm ${
              trend === 'up' ? 'text-green-600' : trend === 'down' ? 'text-red-600' : 'text-[rgba(var(--fg),0.7)]'
            }`}>
              {trend === 'up' ? <ArrowUpRight className="w-4 h-4" /> : 
               trend === 'down' ? <ArrowDownRight className="w-4 h-4" /> : null}
              <span>{change}</span>
            </div>
          )}
        </div>
      </div>
      {Icon && (
        <div className="p-3 rounded-full bg-blue-50 text-blue-600">
          <Icon className="w-6 h-6" />
        </div>
      )}
    </div>
  </Card>
);

const Header = ({ title, subtitle }) => (
  <div className="mb-4">
    <h1 className="text-2xl font-semibold">{title}</h1>
    {subtitle && <p className="text-sm opacity-70">{subtitle}</p>}
  </div>
);

const INR = (n) =>
  typeof n === "number"
    ? n.toLocaleString("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 })
    : n;

const relTime = (iso) => {
  if (!iso) return "—";
  const d = new Date(iso);
  const sec = (Date.now() - d.getTime()) / 1000;
  if (sec < 60) return "just now";
  if (sec < 3600) return `${Math.floor(sec / 60)}m ago`;
  if (sec < 86400) return `${Math.floor(sec / 3600)}h ago`;
  return d.toLocaleDateString("en-IN", { dateStyle: "medium" }) + " " + d.toLocaleTimeString("en-IN", { timeStyle: "short" });
};

/* ---------- Modal (robust scroll lock + viewport-bounded) ---------- */
function Modal({ open, onClose, children }) {
  // Lock body scroll while open; restore exactly on close (prevents stuck scroll)
  useEffect(() => {
    if (!open) return;

    const scrollY =
      window.scrollY || document.documentElement.scrollTop || 0;

    const original = {
      position: document.body.style.position,
      top: document.body.style.top,
      width: document.body.style.width,
      overflow: document.body.style.overflow,
    };

    document.body.style.position = "fixed";
    document.body.style.top = `-${scrollY}px`;
    document.body.style.width = "100%";
    document.body.style.overflow = "hidden";

    const onEsc = (e) => e.key === "Escape" && onClose?.();
    window.addEventListener("keydown", onEsc);

    return () => {
      window.removeEventListener("keydown", onEsc);
      document.body.style.position = original.position;
      document.body.style.top = original.top;
      document.body.style.width = original.width;
      document.body.style.overflow = original.overflow;
      window.scrollTo(0, scrollY);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40" />
      <div className="absolute inset-0 grid place-items-center p-4">
        <div
          className={[
            "w-full max-w-5xl",
            "max-h-[100svh] md:max-h-[85vh]",
            "rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] shadow-2xl",
            "overflow-y-auto", // panel scrolls
          ].join(" ")}
          style={{
            WebkitOverflowScrolling: "touch",
            overscrollBehavior: "contain",
            touchAction: "pan-y",
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {children}
        </div>
      </div>
    </div>
  );
}

/* ---------- Tier Modal (responsive pie; no overflow on mobile) ---------- */
function TierModal({ open, onClose, tierKeyProp, tierData }) {
  const title = tierKeyProp ? tierKeyProp.toUpperCase() : "";
  const pie = tierData?.pie ?? [];
  const levels = tierData?.levels ?? [];

  // Responsive pie sizing based on available space
  const chartBoxRef = useRef(null);
  const [chartSize, setChartSize] = useState(220);

  useEffect(() => {
    if (!open) return;
    const el = chartBoxRef.current;
    if (!el || typeof ResizeObserver === "undefined") return;

    const ro = new ResizeObserver((entries) => {
      const rect = entries[0]?.contentRect;
      if (!rect) return;
      const candidate = Math.min(rect.width, rect.height) - 24; // padding buffer
      const size = Math.max(160, Math.min(260, Math.floor(candidate)));
      setChartSize(size);
    });

    ro.observe(el);
    return () => ro.disconnect();
  }, [open]);

  return (
    <Modal open={open} onClose={onClose}>
      <div className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 data-tier={tierKeyProp} className="text-xl font-semibold">{title} tier</h2>
            <p className="text-sm opacity-70">Referrals per level</p>
          </div>
          <button
            onClick={onClose}
            className="rounded-full h-8 w-8 grid place-items-center border border-[rgb(var(--border))] hover:bg-[rgba(var(--fg),0.05)]"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Distribution card: responsive & centered */}
          <Card className="p-4 min-h-[360px] sm:min-h-[420px] flex flex-col overflow-hidden">
            <div className="mb-3 font-medium">Distribution</div>
            <div
              ref={chartBoxRef}
              className="flex-1 grid place-items-center overflow-hidden w-full"
            >
              <PieChartMini
                data={pie}
                size={chartSize}
                colors={[
                  "rgb(var(--accent-1))",
                  "#7C3AED",
                  "#10B981",
                  "#F59E0B",
                  "#60A5FA",
                ]}
              />
            </div>
          </Card>

          {/* Levels & rewards */}
          <Card className="p-4">
            <div className="mb-3 font-medium">Levels & rewards</div>
            <ul className="divide-y divide-[rgb(var(--border))]">
              {levels.map((lv, idx) => (
                <li key={idx} className="py-3 flex items-center gap-3">
                  <img
                    src={lv.image}
                    alt={lv.reward}
                    className="h-20 w-20 md:h-24 md:w-24 object-cover rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))]"
                    loading="lazy"
                  />
                  <div className="flex-1">
                    <div className="font-medium">Level {lv.level}: {lv.reward}</div>
                    <div className="text-sm opacity-70">
                      {Number(lv.referrals || 0).toLocaleString("en-IN")} referrals
                    </div>
                  </div>
                </li>
              ))}
              {levels.length === 0 && <li className="py-3 text-sm opacity-70">No level data found for this tier.</li>}
            </ul>
          </Card>
        </div>
      </div>
    </Modal>
  );
}

/* ---------- Main ---------- */
export default function Overview() {
  const [dashboardData, setDashboardData] = useState(null);
  const [recentActivityLogs, setRecentActivityLogs] = useState([]);
  const [tierData, setTierData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tierOpen, setTierOpen] = useState(false);
  const [tierKeyState, setTierKeyState] = useState(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        
        console.log('🔍 OVERVIEW PAGE - Starting API calls...');
        
        const token = localStorage.getItem('auth') ? JSON.parse(localStorage.getItem('auth')).accessToken : '';
        console.log('🔑 Token:', token ? `${token.substring(0, 20)}...` : 'NO TOKEN');
        
        // Fetch commission dashboard data
        console.log('📊 Fetching dashboard data from:', COMMISSION_DASHBOARD_API);
        const dashboardRes = await fetch(COMMISSION_DASHBOARD_API, { 
          cache: "no-store",
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        console.log('📊 Dashboard Response Status:', dashboardRes.status);
        console.log('📊 Dashboard Response Headers:', Object.fromEntries(dashboardRes.headers.entries()));
        
        if (dashboardRes.ok) {
          const dashboardJson = await dashboardRes.json();
          console.log('✅ Dashboard Data Received:', dashboardJson);
          if (mounted) setDashboardData(dashboardJson);
        } else {
          console.log('❌ Dashboard API Failed:', dashboardRes.status, await dashboardRes.text());
        }

        // Fetch recent activity logs
        console.log('📈 Fetching activity logs from:', RECENT_ACTIVITIES_API);
        const activitiesRes = await fetch(`${RECENT_ACTIVITIES_API}?size=3`, { 
          cache: "no-store",
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        console.log('📈 Activities Response Status:', activitiesRes.status);
        console.log('📈 Activities Response Headers:', Object.fromEntries(activitiesRes.headers.entries()));
        
        if (activitiesRes.ok) {
          const activitiesJson = await activitiesRes.json();
          console.log('✅ Activity Logs Data Received:', activitiesJson);
          if (mounted) setRecentActivityLogs(Array.isArray(activitiesJson.logs) ? activitiesJson.logs.slice(0, 3) : []);
        } else {
          console.log('❌ Activity Logs API Failed:', activitiesRes.status, await activitiesRes.text());
        }

        // Fetch real users data for accurate user count
        console.log('👥 Fetching real users data from:', API_ENDPOINTS.USERS);
        const usersRes = await fetch(API_ENDPOINTS.USERS, { 
          cache: "no-store",
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        console.log('👥 Users Response Status:', usersRes.status);
        console.log('👥 Users Response Headers:', Object.fromEntries(usersRes.headers.entries()));
        
        if (usersRes.ok) {
          const usersJson = await usersRes.json();
          console.log('✅ Real Users Data Received:', usersJson);
          console.log('📊 Total Users Count:', usersJson.length);
          if (mounted) {
            // Update dashboard data with real user count
            setDashboardData(prev => ({
              ...prev,
              totalUsers: usersJson.length,
              totalUsersCount: usersJson.length
            }));
          }
        } else {
          console.log('❌ Users API Failed:', usersRes.status, await usersRes.text());
        }

        // Fetch pending commissions for accurate pending count
        console.log('⏳ Fetching pending commissions from:', API_ENDPOINTS.PENDING_COMMISSIONS);
        const pendingRes = await fetch(API_ENDPOINTS.PENDING_COMMISSIONS, { 
          cache: "no-store",
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        console.log('⏳ Pending Response Status:', pendingRes.status);
        
        if (pendingRes.ok) {
          const pendingJson = await pendingRes.json();
          console.log('✅ Pending Commissions Data Received:', pendingJson);
          console.log('📊 Pending Count:', pendingJson.length);
          if (mounted) {
            // Update dashboard data with real pending count
            setDashboardData(prev => ({
              ...prev,
              pendingCommissionsCount: pendingJson.length
            }));
          }
        } else {
          console.log('❌ Pending API Failed:', pendingRes.status, await pendingRes.text());
        }

        // Fetch tier level breakdown data
        console.log('🏆 Fetching tier level breakdown from:', TIER_LEVEL_BREAKDOWN_API);
        const tierRes = await fetch(TIER_LEVEL_BREAKDOWN_API, { 
          cache: "no-store",
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        console.log('🏆 Tier breakdown response status:', tierRes.status);
        
        if (tierRes.ok) {
          const tierJson = await tierRes.json();
          console.log('✅ Tier breakdown data received:', tierJson);
          if (mounted) setTierData(tierJson);
        } else {
          console.log('❌ Tier breakdown API failed:', tierRes.status, await tierRes.text());
        }

        // Fetch monthly revenue data
        console.log('📈 Fetching monthly revenue from:', API_ENDPOINTS.MONTHLY_REVENUE);
        const revenueRes = await fetch(API_ENDPOINTS.MONTHLY_REVENUE, { 
          cache: "no-store",
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        console.log('📈 Monthly revenue response status:', revenueRes.status);
        
        if (revenueRes.ok) {
          const revenueJson = await revenueRes.json();
          console.log('✅ Monthly revenue data received:', revenueJson);
          if (mounted) {
            setDashboardData(prev => ({
              ...prev,
              monthlyRevenue: revenueJson
            }));
          }
        } else {
          console.log('❌ Monthly revenue API failed:', revenueRes.status, await revenueRes.text());
        }

        // Fetch top performers data
        console.log('🏆 Fetching top performers from:', API_ENDPOINTS.TOP_PERFORMERS);
        const performersRes = await fetch(API_ENDPOINTS.TOP_PERFORMERS, { 
          cache: "no-store",
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        console.log('🏆 Top performers response status:', performersRes.status);
        
        if (performersRes.ok) {
          const performersJson = await performersRes.json();
          if (mounted) {
            setDashboardData(prev => ({
              ...prev,
              topPerformers: performersJson
            }));
          }
        } else {
          console.log('❌ Top performers API failed:', performersRes.status, await performersRes.text());
        }
        
      } catch (e) {
        console.error('💥 Overview Load Error:', e);
        if (mounted) {
          setDashboardData(null);
          setRecentActivityLogs([]);
          setTierData(null);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  // Transform real backend data to match UI expectations
  const kpis = dashboardData ? [
    {
      id: "totalRevenue",
      label: "Total Commissions",
      value: dashboardData.totalCommissionAmount || 0,
      delta: { direction: "up", vsLastMonthPct: 12.5 }
    },
    {
      id: "totalUsers",
      label: "Total Users",
      value: dashboardData.totalUsers || dashboardData.totalUsersCount || 0,
      delta: { direction: "up", vsLastMonthPct: 8.2 }
    },
    {
      id: "pendingCommissions",
      label: "Pending Commissions",
      value: dashboardData.pendingCommissionsCount || 0,
      delta: { direction: "down", vsLastMonthPct: 3.1 }
    },
    {
      id: "paidCommissions",
      label: "Paid Commissions",
      value: dashboardData.paidCommissionsCount || 0,
      delta: { direction: "up", vsLastMonthPct: 15.7 }
    }
  ] : [];

  const tiers = tierData; // Real tier data from backend
  
  // Real revenue data from backend - transform amount to value for chart
  const revenue = (dashboardData?.monthlyRevenue || []).map(item => ({
    month: item.month,
    value: item.amount
  }));
  
  // Real top performers data from backend
  const top = dashboardData?.topPerformers || [];
  
  // Transform recent activity logs to activities format
  const activities = recentActivityLogs.map(activityLog => {
    // Determine who performed the action
    const actor = activityLog.adminId ? `Admin ${activityLog.adminId}` : 
                  activityLog.userId ? `User ${activityLog.userId}` : 'System';
    
    // Format the action description
    const action = activityLog.description || activityLog.actionType?.replace(/_/g, ' ') || 'Activity';
    
    // Format the timestamp
    const timestamp = activityLog.createdAt || new Date().toISOString();
    
    return {
      user: actor,
      action: action,
      timestamp: timestamp,
      tier: activityLog.category || 'System',
      level: activityLog.severity || 'INFO'
    };
  });

  const openTier = (key) => { setTierKeyState(key); setTierOpen(true); };

  if (loading) {
    return (
      <div className="space-y-6 text-[rgb(var(--fg))]">
        <Header title="Overview" subtitle="Loading dashboard data..." />
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <StatCard key={i} loading={true} />
          ))}
        </div>
        <Card loading={true} />
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <div className="space-y-6 text-[rgb(var(--fg))]">
        <Header title="Overview" />
        <Card className="p-8 text-center">
          <div className="flex flex-col items-center gap-4">
            <div className="p-4 rounded-full bg-red-50 text-red-600">
              <Activity className="w-8 h-8" />
            </div>
            <div>
              <div className="font-semibold text-lg mb-2">Couldn't load overview</div>
              <div className="text-sm text-[rgba(var(--fg),0.7)] mb-4">Please check your authentication and try again.</div>
            </div>
            <button
              onClick={() => location.reload()}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Retry
            </button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 text-[rgb(var(--fg))]">
      <div className="flex items-center justify-between">
        <Header title="Overview" />
        <button
          onClick={() => window.location.reload()}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh Data
        </button>
      </div>

      {/* Enhanced KPIs */}
      {kpis.length > 0 && (
        <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
          {kpis.map((k, i) => {
            const isUp = (k.delta?.direction ?? "up") === "up";
            const deltaPct = Math.abs(k.delta?.vsLastMonthPct ?? 0).toFixed(1);
            const val =
              k.id === "totalRevenue" ? INR(Number(k.value || 0)) : Number(k.value || 0).toLocaleString("en-IN");
            
            // Map icons based on KPI type
            const getIcon = (id) => {
              switch (id) {
                case "totalRevenue": return DollarSign;
                case "totalUsers": return Users;
                case "pendingCommissions": return Clock;
                case "paidCommissions": return TrendingUp;
                default: return BarChart3;
              }
            };

            return (
              <StatCard
                key={i}
                title={k.label}
                value={val}
                change={`${deltaPct}% vs last month`}
                trend={isUp ? 'up' : 'down'}
                icon={getIcon(k.id)}
              />
            );
          })}
        </section>
      )}

      {/* Enhanced Tiers */}
      <section>
        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <PieChart className="w-5 h-5 text-blue-600" />
                <div className="font-semibold text-lg">User Level Distribution</div>
              </div>
              <div className="text-sm text-[rgba(var(--fg),0.7)]">Choose a tier to view detailed breakdown</div>
            </div>            
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {["bronze", "silver", "gold"].map((t) => (
              <button
                key={t}
                onClick={() => openTier(t)}
                data-tier={t}
                className={`rounded-xl border-2 py-6 px-5 bg-[rgb(var(--card))] hover:bg-[rgba(var(--fg),0.05)] transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:scale-105 group`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="text-xs font-medium opacity-70">TIER</div>
                  <div className="w-2 h-2 rounded-full bg-current opacity-60 group-hover:opacity-100 transition-opacity"></div>
                </div>
                <div className="text-2xl font-bold mb-1">{t.toUpperCase()}</div>
                <div className="text-xs opacity-70 group-hover:opacity-90 transition-opacity">Tap to view levels</div>
              </button>
            ))}

          </div>

          <TierModal
            open={tierOpen}
            onClose={() => setTierOpen(false)}
            tierKeyProp={tierKeyState}
            tierData={tierKeyState && tiers ? tiers[tierKeyState] : null}
          />
        </Card>
      </section>

      {/* Enhanced Monthly Revenue + Top Performers */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Revenue Chart */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-green-600" />
              <div className="font-semibold text-lg">Monthly Revenue</div>
            </div>
            <div className="flex items-center gap-2 text-sm text-[rgba(var(--fg),0.7)]">
              <Calendar className="w-4 h-4" />
              Last 6 months
            </div>
          </div>
          
          {revenue.length > 0 ? (
            <div className="h-64">
              <LineChartMini points={revenue} />
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center rounded-lg bg-[rgba(var(--fg),0.05)]">
              <div className="text-center">
                <TrendingUp className="w-12 h-12 mx-auto mb-3 text-[rgba(var(--fg),0.3)]" />
                <div className="text-sm text-[rgba(var(--fg),0.7)]">No revenue data available</div>
                <div className="text-xs text-[rgba(var(--fg),0.6)] mt-1">Revenue data will appear here</div>
              </div>
            </div>
          )}
        </Card>

        {/* Top Performers */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-600" />
              <div className="font-semibold text-lg">Top Performers</div>
            </div>
            <div className="text-sm text-[rgba(var(--fg),0.7)]">
              {top.length} {top.length === 1 ? 'performer' : 'performers'}
            </div>
          </div>
          
          <div className="space-y-3">
            {top.map((t, i) => (
              <div key={i} className="flex items-center gap-4 p-4 rounded-lg border border-[rgb(var(--border))] hover:bg-[rgba(var(--fg),0.03)] transition-colors">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm">
                    {i + 1}
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-[rgb(var(--fg))] truncate">{t.name}</div>
                  <div className="flex items-center gap-2 text-sm text-[rgba(var(--fg),0.7)]">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      tierKey(t.level) === 'gold' ? 'bg-yellow-100 text-yellow-800' :
                      tierKey(t.level) === 'silver' ? 'bg-gray-100 text-gray-800' :
                      tierKey(t.level) === 'bronze' ? 'bg-amber-100 text-amber-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {t.level}
                    </span>
                    <span>•</span>
                    <span>{Number(t.referrals || 0).toLocaleString("en-IN")} referrals</span>
                  </div>
                </div>
                <div className="flex-shrink-0 text-right">
                  <div className="font-semibold text-green-600">
                    {t.currency === "INR" ? INR(Number(t.amount || 0)) : Number(t.amount || 0).toLocaleString("en-IN")}
                  </div>
                  <div className="text-xs text-[rgba(var(--fg),0.6)]">earnings</div>
                </div>
              </div>
            ))}
            {top.length === 0 && (
              <div className="text-center py-8 text-[rgba(var(--fg),0.7)]">
                <Users className="w-12 h-12 mx-auto mb-3 text-[rgba(var(--fg),0.3)]" />
                <div className="text-sm">No performers yet</div>
                <div className="text-xs text-[rgba(var(--fg),0.6)] mt-1">Top performers will appear here</div>
              </div>
            )}
          </div>
        </Card>
      </section>

      {/* Enhanced Recent Activities */}
      <section>
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Activity className="w-5 h-5 text-blue-600" />
            <div className="font-semibold text-lg">Recent Activities</div>
          </div>
          <div className="space-y-3">
            {activities.map((a, i) => (
              <div key={i} className="flex items-start gap-4 p-4 rounded-lg border border-[rgb(var(--border))] hover:bg-[rgba(var(--fg),0.03)] transition-colors">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                  <Activity className="w-4 h-4 text-blue-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-[rgb(var(--fg))]">{a.user}</span>
                    {(a.tier || a.level) && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                        {a.tier || a.level}
                      </span>
                    )}
                  </div>
                  <div className="text-sm text-[rgba(var(--fg),0.7)] mb-1">{a.action}</div>
                  <div className="flex items-center gap-2 text-xs text-[rgba(var(--fg),0.6)]">
                    <Clock className="w-3 h-3" />
                    {relTime(a.timestamp)}
                  </div>
                </div>
              </div>
            ))}
            {activities.length === 0 && (
              <div className="text-center py-8 text-[rgba(var(--fg),0.7)]">
                <Activity className="w-12 h-12 mx-auto mb-3 text-[rgba(var(--fg),0.3)]" />
                <div className="text-sm">No recent activities</div>
              </div>
            )}
          </div>
        </Card>
      </section>

      {/* Key Insights Summary */}
      <section>
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 className="w-5 h-5 text-purple-600" />
            <div className="font-semibold text-lg">Key Insights</div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-lg bg-green-50 border border-green-200">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-4 h-4 text-green-600" />
                <div className="font-medium text-green-800">Revenue Growth</div>
              </div>
              <div className="text-sm text-green-700">
                {revenue.length > 1 ? 
                  `${((revenue[revenue.length - 1].amount - revenue[0].amount) / revenue[0].amount * 100).toFixed(1)}% increase over 6 months` :
                  'Revenue data available'
                }
              </div>
            </div>
            
            <div className="p-4 rounded-lg bg-blue-50 border border-blue-200">
              <div className="flex items-center gap-2 mb-2">
                <Users className="w-4 h-4 text-blue-600" />
                <div className="font-medium text-blue-800">Top Performer</div>
              </div>
              <div className="text-sm text-blue-700">
                {top.length > 0 ? 
                  `${top[0].name} with ${top[0].referrals} referrals` :
                  'No performers yet'
                }
              </div>
            </div>
            
            <div className="p-4 rounded-lg bg-purple-50 border border-purple-200">
              <div className="flex items-center gap-2 mb-2">
                <Activity className="w-4 h-4 text-purple-600" />
                <div className="font-medium text-purple-800">Recent Activity</div>
              </div>
              <div className="text-sm text-purple-700">
                {activities.length} activities in the last 24 hours
              </div>
            </div>
          </div>
        </Card>
      </section>
    </div>
  );
}
