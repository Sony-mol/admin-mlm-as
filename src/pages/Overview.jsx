// src/pages/Overview.jsx
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
  Clock,
} from "lucide-react";

// Import API configuration
import { API_ENDPOINTS } from "../config/api";

// Real backend API endpoints
const COMMISSION_DASHBOARD_API = API_ENDPOINTS.COMMISSION_DASHBOARD;
const USER_STATS_API = API_ENDPOINTS.COMMISSIONS + "/stats";
const RECENT_ACTIVITIES_API = API_ENDPOINTS.RECENT_ACTIVITIES;
const TIER_LEVEL_BREAKDOWN_API = API_ENDPOINTS.TIER_LEVEL_BREAKDOWN;

/* ---------- helpers for tier color ---------- */
const tierKey = (label = "") => {
  const s = String(label || "").toLowerCase();
  if (s.startsWith("gold")) return "gold";
  if (s.startsWith("silver")) return "silver";
  if (s.startsWith("bronze")) return "bronze";
  return "";
};

/* ---------- pretty name for buttons ---------- */
const prettyTierName = (s = "") =>
  String(s || "").replace(/(^|\s)\S/g, (c) => c.toUpperCase());

/* ---------- Enhanced UI helpers ---------- */
const Card = ({ children, className = "", loading = false }) => (
  <div
    className={`rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] transition-all duration-300 hover:shadow-lg ${className}`}
  >
    {loading ? (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
        <span className="ml-2 text-sm text-[rgba(var(--fg),0.7)]">
          Loading...
        </span>
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
        <p className="text-sm font-medium text-[rgba(var(--fg),0.7)] mb-1">
          {title}
        </p>
        <div className="flex items-center gap-2">
          {loading ? (
            <div className="h-8 w-20 rounded animate-pulse bg-[rgba(var(--fg),0.15)]"></div>
          ) : (
            <p className="text-2xl font-bold text-[rgb(var(--fg))]">{value}</p>
          )}
          {!loading && change && (
            <div
              className={`flex items-center gap-1 text-sm ${
                trend === "up"
                  ? "text-green-600"
                  : trend === "down"
                  ? "text-red-600"
                  : "text-[rgba(var(--fg),0.7)]"
              }`}
            >
              {trend === "up" ? (
                <ArrowUpRight className="w-4 h-4" />
              ) : trend === "down" ? (
                <ArrowDownRight className="w-4 h-4" />
              ) : null}
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
    ? n.toLocaleString("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 0,
      })
    : n;

const relTime = (iso) => {
  if (!iso) return "—";
  const d = new Date(iso);
  const sec = (Date.now() - d.getTime()) / 1000;
  if (sec < 60) return "just now";
  if (sec < 3600) return `${Math.floor(sec / 60)}m ago`;
  if (sec < 86400) return `${Math.floor(sec / 3600)}h ago`;
  return (
    d.toLocaleDateString("en-IN", { dateStyle: "medium" }) +
    " " +
    d.toLocaleTimeString("en-IN", { timeStyle: "short" })
  );
};

/* ---------- Modal (robust scroll lock + viewport-bounded) ---------- */
function Modal({ open, onClose, children }) {
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
    <div
      className="fixed inset-0 z-50"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/40" />
      <div className="absolute inset-0 grid place-items-center p-4">
        <div
          className={[
            "w-full max-w-5xl",
            "max-h-[100svh] md:max-h-[85vh]",
            "rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] shadow-2xl",
            "overflow-y-auto",
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
  const title = tierKeyProp ? prettyTierName(tierKeyProp) : "";
  const pie = tierData?.pie ?? [];
  const levels = tierData?.levels ?? [];

  // Responsive pie sizing
  const chartBoxRef = useRef(null);
  const [chartSize, setChartSize] = useState(220);

  useEffect(() => {
    if (!open) return;
    const el = chartBoxRef.current;
    if (!el || typeof ResizeObserver === "undefined") return;

    const ro = new ResizeObserver((entries) => {
      const rect = entries[0]?.contentRect;
      if (!rect) return;
      const candidate = Math.min(rect.width, rect.height) - 24;
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
            <h2 data-tier={tierKeyProp} className="text-xl font-semibold">
              {title} tier
            </h2>
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
          {/* Distribution */}
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
                  {lv.image ? (
                    <img
                      src={lv.image}
                      alt={lv.reward}
                      className="h-20 w-20 md:h-24 md:w-24 object-cover rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--bg))]"
                      loading="lazy"
                    />
                  ) : (
                    <div className="h-20 w-20 md:h-24 md:w-24 rounded-xl border border-[rgb(var(--border))] bg-[rgba(var(--fg),0.05)] grid place-items-center text-xs opacity-60">
                      No image
                    </div>
                  )}
                  <div className="flex-1">
                    <div className="font-medium">
                      Level {lv.level}: {lv.reward}
                    </div>
                    <div className="text-sm opacity-70">
                      {Number(lv.referrals || 0).toLocaleString("en-IN")} referrals
                    </div>
                  </div>
                </li>
              ))}
              {levels.length === 0 && (
                <li className="py-3 text-sm opacity-70">
                  No level data found for this tier.
                </li>
              )}
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
  const [tierData, setTierData] = useState(null); // normalized: keys lowercased
  const [loading, setLoading] = useState(true);
  const [tierOpen, setTierOpen] = useState(false);
  const [tierKeyState, setTierKeyState] = useState(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);

        const token = localStorage.getItem("auth")
          ? JSON.parse(localStorage.getItem("auth")).accessToken
          : "";
        const headers = token ? { Authorization: `Bearer ${token}` } : {};

        // Dashboard
        const dashboardRes = await fetch(COMMISSION_DASHBOARD_API, {
          cache: "no-store",
          headers,
        });
        if (dashboardRes.ok) {
          const dashboardJson = await dashboardRes.json();
          if (mounted) {
            const dash = dashboardJson || {};
            const pendingCount = Number(
              dash.pendingCommissions ?? dash.pendingCount ?? 0
            );
            const paidCount = Number(
              dash.paidCommissions ?? dash.paidCount ?? 0
            );
            const totalPendingAmount = parseFloat(
              (dash.totalPendingAmount ?? 0).toString()
            ) || 0;
            const totalPaidAmount = parseFloat(
              (dash.totalPaidAmount ?? 0).toString()
            ) || 0;
            const totalCommissionAmount = totalPendingAmount + totalPaidAmount;

            setDashboardData((prev) => ({
              ...prev,
              ...dash,
              pendingCommissionsCount: pendingCount,
              paidCommissionsCount: paidCount,
              totalCommissionAmount,
            }));
          }
        }

        // Activities (limit 3)
        const activitiesRes = await fetch(`${RECENT_ACTIVITIES_API}?size=3`, {
          cache: "no-store",
          headers,
        });
        if (activitiesRes.ok) {
          const activitiesJson = await activitiesRes.json();
          if (mounted)
            setRecentActivityLogs(
              Array.isArray(activitiesJson.logs)
                ? activitiesJson.logs.slice(0, 3)
                : []
            );
        }

        // Real users -> count
        const usersRes = await fetch(API_ENDPOINTS.USERS, {
          cache: "no-store",
          headers,
        });
        if (usersRes.ok) {
          const usersJson = await usersRes.json();
          if (mounted) {
            // Compute user growth vs last month using createdAt if available
            const now = new Date();
            const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
            const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
            const startOfPrevMonth = new Date(now.getFullYear(), now.getMonth() - 2, 1);

            const countInRange = (start, end) =>
              usersJson.filter((u) => {
                const ts = u.createdAt || u.created_at || u.registeredAt || u.createdDate;
                if (!ts) return false;
                const d = new Date(ts);
                return d >= start && d < end;
              }).length;

            const lastMonth = countInRange(startOfLastMonth, startOfThisMonth);
            const prevMonth = countInRange(startOfPrevMonth, startOfLastMonth);
            const usersGrowthPct = ((lastMonth - prevMonth) / Math.max(1, prevMonth)) * 100;

            setDashboardData((prev) => ({
              ...prev,
              totalUsers: usersJson.length,
              totalUsersCount: usersJson.length,
              usersGrowthPct,
            }));
          }
        }

        // Pending commissions -> count
        const pendingRes = await fetch(API_ENDPOINTS.PENDING_COMMISSIONS, {
          cache: "no-store",
          headers,
        });
        if (pendingRes.ok) {
          const pendingJson = await pendingRes.json();
          if (mounted) {
            // Growth: last month vs previous month based on createdAt
            const now = new Date();
            const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
            const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
            const startOfPrevMonth = new Date(now.getFullYear(), now.getMonth() - 2, 1);
            const inRange = (arr, start, end) =>
              arr.filter((c) => {
                const ts = c.createdAt || c.created_at || c.timestamp || c.dateCreated;
                if (!ts) return false;
                const d = new Date(ts);
                return d >= start && d < end;
              }).length;
            const last = inRange(pendingJson, startOfLastMonth, startOfThisMonth);
            const prev = inRange(pendingJson, startOfPrevMonth, startOfLastMonth);
            const pendingGrowthPct = ((last - prev) / Math.max(1, prev)) * 100;

            setDashboardData((prev) => ({
              ...prev,
              pendingCommissionsCount: Array.isArray(pendingJson) ? pendingJson.length : 0,
              pendingGrowthPct,
            }));
          }
        }

        // Paid commissions -> count
        const paidRes = await fetch(API_ENDPOINTS.PAID_COMMISSIONS, {
          cache: "no-store",
          headers,
        });
        if (paidRes.ok) {
          const paidJson = await paidRes.json();
          if (mounted) {
            const now = new Date();
            const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
            const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
            const startOfPrevMonth = new Date(now.getFullYear(), now.getMonth() - 2, 1);
            const inRange = (arr, start, end) =>
              arr.filter((c) => {
                const ts = c.createdAt || c.created_at || c.timestamp || c.dateCreated;
                if (!ts) return false;
                const d = new Date(ts);
                return d >= start && d < end;
              }).length;
            const last = inRange(paidJson, startOfLastMonth, startOfThisMonth);
            const prev = inRange(paidJson, startOfPrevMonth, startOfLastMonth);
            const paidGrowthPct = ((last - prev) / Math.max(1, prev)) * 100;

            setDashboardData((prev) => ({
              ...prev,
              paidCommissionsCount: Array.isArray(paidJson) ? paidJson.length : 0,
              paidGrowthPct,
            }));
          }
        }

        // Tier level breakdown (normalize keys + shapes)
        const tierRes = await fetch(TIER_LEVEL_BREAKDOWN_API, {
          cache: "no-store",
          headers,
        });
        if (tierRes.ok) {
          const tierJson = await tierRes.json();
          const normalized = Object.fromEntries(
            Object.entries(tierJson || {}).map(([k, v]) => {
              const pieArray = Array.isArray(v?.pie)
                ? v.pie
                : Array.isArray(v?.distribution)
                ? v.distribution
                : [];
              const levelsArray = Array.isArray(v?.levels) ? v.levels : [];

              return [
                String(k).toLowerCase(),
                {
                  pie: pieArray.map((p) => ({
                    label: String(p.label ?? p.name ?? ""),
                    value: Number(p.value ?? p.count ?? 0) || 0,
                  })),
                  levels: levelsArray.map((l) => ({
                    level: Number(l.level ?? l.levelNumber ?? 0) || 0,
                    reward: String(l.reward ?? l.rewardName ?? ""),
                    referrals:
                      Number(l.referrals ?? l.requiredReferrals ?? 0) || 0,
                    image: l.image ?? l.img ?? "",
                  })),
                },
              ];
            })
          );
          if (mounted) setTierData(normalized);
        }

        // Monthly revenue
        const revenueRes = await fetch(API_ENDPOINTS.MONTHLY_REVENUE, {
          cache: "no-store",
          headers,
        });
        if (revenueRes.ok) {
          const revenueJson = await revenueRes.json();
          if (mounted) {
            // Compute growth vs last month from last two points
            const series = Array.isArray(revenueJson) ? revenueJson : [];
            const last = series.length >= 1 ? Number(series[series.length - 1]?.amount ?? 0) : 0;
            const prev = series.length >= 2 ? Number(series[series.length - 2]?.amount ?? 0) : 0;
            const revenueGrowthPct = ((last - prev) / Math.max(1, prev)) * 100;

            setDashboardData((prev) => ({
              ...prev,
              monthlyRevenue: revenueJson,
              revenueGrowthPct,
            }));
          }
        }

        // Top performers
        const performersRes = await fetch(API_ENDPOINTS.TOP_PERFORMERS, {
          cache: "no-store",
          headers,
        });
        if (performersRes.ok) {
          const performersJson = await performersRes.json();
          if (mounted) {
            setDashboardData((prev) => ({
              ...prev,
              topPerformers: performersJson,
            }));
          }
        }
      } catch (e) {
        console.error("💥 Overview Load Error:", e);
        if (mounted) {
          setDashboardData(null);
          setRecentActivityLogs([]);
          setTierData(null);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  // Transform backend data to match UI
  const kpis = dashboardData
    ? [
        {
          id: "totalRevenue",
          label: "Total Commissions",
          value: dashboardData.totalCommissionAmount || 0,
          delta: {
            direction: (dashboardData.revenueGrowthPct ?? 0) >= 0 ? "up" : "down",
            vsLastMonthPct: Math.abs(dashboardData.revenueGrowthPct ?? 0),
          },
        },
        {
          id: "totalUsers",
          label: "Total Users",
          value: dashboardData.totalUsers || dashboardData.totalUsersCount || 0,
          delta: dashboardData.usersGrowthPct != null ? {
            direction: (dashboardData.usersGrowthPct ?? 0) >= 0 ? "up" : "down",
            vsLastMonthPct: Math.abs(dashboardData.usersGrowthPct ?? 0),
          } : null,
        },
        {
          id: "pendingCommissions",
          label: "Pending Commissions",
          value: dashboardData.pendingCommissionsCount || 0,
          delta: dashboardData.pendingGrowthPct != null ? {
            direction: (dashboardData.pendingGrowthPct ?? 0) >= 0 ? "up" : "down",
            vsLastMonthPct: Math.abs(dashboardData.pendingGrowthPct ?? 0),
          } : null,
        },
        {
          id: "paidCommissions",
          label: "Paid Commissions",
          value: dashboardData.paidCommissionsCount || 0,
          delta: dashboardData.paidGrowthPct != null ? {
            direction: (dashboardData.paidGrowthPct ?? 0) >= 0 ? "up" : "down",
            vsLastMonthPct: Math.abs(dashboardData.paidGrowthPct ?? 0),
          } : null,
        },
      ]
    : [];

  const tiers = tierData || {}; // normalized (keys lowercased)

  // Real revenue data from backend - transform amount to value for chart
  const revenue = (dashboardData?.monthlyRevenue || []).map((item) => ({
    month: item.month,
    value: item.amount,
  }));

  // Real top performers data from backend
  const top = dashboardData?.topPerformers || [];
  const [showAllTop, setShowAllTop] = useState(false);
  const visibleTop = top.slice(0, showAllTop ? 10 : 3);

  // Transform recent activity logs to activities format
  const activities = recentActivityLogs.map((activityLog) => {
    const actor = activityLog.adminId
      ? `Admin ${activityLog.adminId}`
      : activityLog.userId
      ? `User ${activityLog.userId}`
      : "System";
    const action =
      activityLog.description ||
      activityLog.actionType?.replace(/_/g, " ") ||
      "Activity";
    const timestamp = activityLog.createdAt || new Date().toISOString();

    return {
      user: actor,
      action,
      timestamp,
      tier: activityLog.category || "System",
      level: activityLog.severity || "INFO",
    };
  });

  const openTier = (key) => {
    setTierKeyState(String(key).toLowerCase());
    setTierOpen(true);
  };

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
              <div className="font-semibold text-lg mb-2">
                Couldn't load overview
              </div>
              <div className="text-sm text-[rgba(var(--fg),0.7)] mb-4">
                Please check your authentication and try again.
              </div>
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
            const isUp = k.delta ? (k.delta.direction ?? "up") === "up" : true;
            const deltaPct = k.delta ? Math.abs(k.delta.vsLastMonthPct ?? 0).toFixed(1) : null;
            const val =
              k.id === "totalRevenue"
                ? INR(Number(k.value || 0))
                : Number(k.value || 0).toLocaleString("en-IN");

            const getIcon = (id) => {
              switch (id) {
                case "totalRevenue":
                  return DollarSign;
                case "totalUsers":
                  return Users;
                case "pendingCommissions":
                  return Clock;
                case "paidCommissions":
                  return TrendingUp;
                default:
                  return BarChart3;
              }
            };

            return (
              <StatCard
                key={i}
                title={k.label}
                value={val}
                change={deltaPct !== null ? `${deltaPct}% vs last month` : null}
                trend={k.delta ? (isUp ? "up" : "down") : undefined}
                icon={getIcon(k.id)}
              />
            );
          })}
        </section>
      )}

      {/* Enhanced Tiers (dynamic) */}
      <section>
        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <PieChart className="w-5 h-5 text-blue-600" />
                <div className="font-semibold text-lg">
                  User Level Distribution
                </div>
              </div>
              <div className="text-sm text-[rgba(var(--fg),0.7)]">
                Choose a tier to view detailed breakdown
              </div>
            </div>
          </div>

          {tiers && Object.keys(tiers).length > 0 ? (
            (() => {
              const order = ["bronze", "silver", "gold", "platinum"];
              const tierKeys = Object.keys(tiers).sort((a, b) => {
                const la = String(a).toLowerCase();
                const lb = String(b).toLowerCase();
                const ia = order.indexOf(la);
                const ib = order.indexOf(lb);
                if (ia !== -1 && ib !== -1) return ia - ib;
                if (ia !== -1) return -1;
                if (ib !== -1) return 1;
                return String(a).localeCompare(String(b));
              });

              return (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {tierKeys.map((t) => (
                    <button
                      key={t}
                      onClick={() => openTier(t)}
                      data-tier={t}
                      className="rounded-xl border-2 py-6 px-5 bg-[rgb(var(--card))] hover:bg-[rgba(var(--fg),0.05)] transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:scale-105 group"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="text-xs font-medium opacity-70">TIER</div>
                        <div className="w-2 h-2 rounded-full bg-current opacity-60 group-hover:opacity-100 transition-opacity"></div>
                      </div>
                      <div className="text-2xl font-bold mb-1">
                        {prettyTierName(t)}
                      </div>
                      <div className="text-xs opacity-70 group-hover:opacity-90 transition-opacity">
                        Tap to view levels
                      </div>
                    </button>
                  ))}
                </div>
              );
            })()
          ) : (
            <div className="rounded-lg border border-[rgb(var(--border))] p-6 text-center text-sm opacity-70">
              No tiers found. Create a tier and it will appear here automatically.
            </div>
          )}

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
                <div className="text-sm text-[rgba(var(--fg),0.7)]">
                  No revenue data available
                </div>
                <div className="text-xs text-[rgba(var(--fg),0.6)] mt-1">
                  Revenue data will appear here
                </div>
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
          <div className="flex items-center gap-3 text-sm text-[rgba(var(--fg),0.7)]">
            {top.length} {top.length === 1 ? "performer" : "performers"}
            {top.length > 3 && (
              <button
                onClick={() => setShowAllTop((s) => !s)}
                className="px-3 py-1 rounded-lg border border-[rgb(var(--border))] hover:bg-[rgba(var(--fg),0.05)]"
              >
                {showAllTop ? "Show top 3" : "View all"}
              </button>
            )}
          </div>
          </div>

          <div className="space-y-3">
            {visibleTop.map((t, i) => (
              <div
                key={i}
                className="flex items-center gap-4 p-4 rounded-lg border border-[rgb(var(--border))] hover:bg-[rgba(var(--fg),0.03)] transition-colors"
              >
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm">
                    {i + 1}
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-[rgb(var(--fg))] truncate">
                    {t.name}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-[rgba(var(--fg),0.7)]">
                    <span
                      className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        tierKey(t.level) === "gold"
                          ? "bg-yellow-100 text-yellow-800"
                          : tierKey(t.level) === "silver"
                          ? "bg-gray-100 text-gray-800"
                          : tierKey(t.level) === "bronze"
                          ? "bg-amber-100 text-amber-800"
                          : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {t.level}
                    </span>
                    <span>•</span>
                    <span>
                      {Number(t.referrals || 0).toLocaleString("en-IN")} referrals
                    </span>
                  </div>
                </div>
                <div className="flex-shrink-0 text-right">
                  <div className="font-semibold text-green-600">
                    {t.currency === "INR"
                      ? INR(Number(t.amount || 0))
                      : Number(t.amount || 0).toLocaleString("en-IN")}
                  </div>
                  <div className="text-xs text-[rgba(var(--fg),0.6)]">earnings</div>
                </div>
              </div>
            ))}
            {top.length === 0 && (
              <div className="text-center py-8 text-[rgba(var(--fg),0.7)]">
                <Users className="w-12 h-12 mx-auto mb-3 text-[rgba(var(--fg),0.3)]" />
                <div className="text-sm">No performers yet</div>
                <div className="text-xs text-[rgba(var(--fg),0.6)] mt-1">
                  Top performers will appear here
                </div>
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
              <div
                key={i}
                className="flex items-start gap-4 p-4 rounded-lg border border-[rgb(var(--border))] hover:bg-[rgba(var(--fg),0.03)] transition-colors"
              >
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                  <Activity className="w-4 h-4 text-blue-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-[rgb(var(--fg))]">
                      {a.user}
                    </span>
                    {(a.tier || a.level) && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                        {a.tier || a.level}
                      </span>
                    )}
                  </div>
                  <div className="text-sm text-[rgba(var(--fg),0.7)] mb-1">
                    {a.action}
                  </div>
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
                {revenue.length > 1
                  ? `${(
                      ((revenue[revenue.length - 1].value - revenue[0].value) /
                        Math.max(1, revenue[0].value)) *
                      100
                    ).toFixed(1)}% increase over 6 months`
                  : "Revenue data available"}
              </div>
            </div>

            <div className="p-4 rounded-lg bg-blue-50 border border-blue-200">
              <div className="flex items-center gap-2 mb-2">
                <Users className="w-4 h-4 text-blue-600" />
                <div className="font-medium text-blue-800">Top Performer</div>
              </div>
              <div className="text-sm text-blue-700">
                {top.length > 0
                  ? `${top[0].name} with ${top[0].referrals} referrals`
                  : "No performers yet"}
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
