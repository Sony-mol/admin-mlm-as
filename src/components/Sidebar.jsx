// Sidebar.jsx
import React from "react";
import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  BarChart3,
  Package2,
  Users,
  Network,
  Package,
  CreditCard,
  DollarSign,
  Wallet,
  Activity,
  Award,
  Shield,
  Settings,
} from "lucide-react";

const links = [
  { to: "/",         label: "Overview",        Icon: LayoutDashboard, exact: true },
  { to: "/analytics", label: "Analytics",      Icon: BarChart3 },
  { to: "/products", label: "Products",        Icon: Package2 },
  { to: "/users",    label: "User Management", Icon: Users },
  { to: "/referral", label: "Referral Tree",   Icon: Network },
  { to: "/orders",   label: "Orders",          Icon: Package },
  { to: "/payments", label: "Payments",        Icon: CreditCard },
  { to: "/commissions", label: "Commissions",  Icon: DollarSign },
  { to: "/withdrawals", label: "Withdrawals",  Icon: Wallet },
  { to: "/activity-logs", label: "Activity Logs", Icon: Activity },
  { to: "/tier-management", label: "Tier Management", Icon: Award },
  { to: "/admin-management", label: "Admin Management", Icon: Shield },
  { to: "/settings", label: "Settings",        Icon: Settings },
];

export default function Sidebar({ open = true, onNavigate = () => {} }) {
  const handleNavClick = () => {
    if (typeof window !== 'undefined' && window.matchMedia('(max-width: 767px)').matches) {
      onNavigate(); // collapse on mobile
    }
  };

  return (
    <aside
      className={[
        "fixed left-0 top-0 h-screen",
        "w-[85vw] sm:w-72",
        "border-r border-[rgb(var(--border))] bg-[rgb(var(--card))]",
        "px-3 pb-4 pt-3 z-30",
        "transition-transform duration-300 ease-out",
        "flex flex-col",
        open ? "translate-x-0" : "-translate-x-full",
      ].join(" ")}
      aria-hidden={!open}
      role="dialog"
      aria-modal="true"
    >
      {/* Brand header (fixed) */}
      <div className="mb-3 flex items-center justify-center">
        <img
          src="/Logo-300-x-300-px-150-x-150-px.png"
          alt="CAMGO ADMIN"
          className="h-24 w-auto"
          draggable="false"
        />
      </div>

      {/* Scrollable nav list */}
      <nav className="flex-1 overflow-y-auto overscroll-contain pr-1 space-y-1">
        {links.map(({ to, label, Icon, exact }) => (
          <NavLink
  key={to}
  to={to}
  end={!!exact}
  className="group block focus:outline-none focus-visible:outline-none"
  onClick={handleNavClick}
>
  {({ isActive }) => (
    <div
      className={[
        "relative flex items-center gap-3 px-3 py-2 rounded-lg border transition-all duration-300 ease-out",
        isActive
          ? "text-[rgb(var(--accent-1))] bg-[rgba(var(--accent-1),0.12)] border-[rgba(var(--accent-1),0.35)]"
          : "text-[rgb(var(--fg))] border-transparent",
      ].join(" ")}
    >
      {/* Left accent bar — disabled for active state */}
      {!isActive && (
        <span
          className={[
            "absolute left-0 top-0 h-full w-[3px] rounded-r",
            "bg-[rgb(var(--accent-1))]",
            "origin-top transition-transform duration-300",
            "scale-y-0 group-hover:scale-y-100",
          ].join(" ")}
          aria-hidden="true"
        />
      )}

      {/* Soft radial sweep on hover */}
      <span
        className={[
          "pointer-events-none absolute inset-0 rounded-lg opacity-0",
          "transition-opacity duration-300",
          "group-hover:opacity-100",
          "bg-[radial-gradient(120px_80px_at_left,var(--tw-gradient-from),transparent_70%)]",
          "from-[rgba(var(--accent-1),0.18)]",
        ].join(" ")}
        aria-hidden="true"
      />

      <Icon
        size={20}
        strokeWidth={1.9}
        className={[
          "shrink-0 transition-transform duration-300 ease-out",
          isActive
            ? "translate-x-0.5 scale-[1.05]"
            : "group-hover:translate-x-0.5 group-hover:scale-[1.05]",
        ].join(" ")}
        aria-hidden="true"
      />

      <span
        className={[
          "relative z-[1] whitespace-nowrap transition-all duration-300 ease-out",
          isActive
            ? "translate-x-0.5 tracking-wide"
            : "group-hover:translate-x-0.5 group-hover:tracking-wide",
        ].join(" ")}
      >
        {label}
      </span>
    </div>
  )}
</NavLink>

        ))}
      </nav>
    </aside>
  );
}
