// Sidebar.jsx
import React, { useState } from "react";
import { NavLink, Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  LayoutDashboard,
  BarChart3,
  Package2,
  Users,
  Network,
  Package,
  CreditCard,
  DollarSign,
  UserPen,
  Settings,
  Activity,
  Award,
  Wallet,
  Shield,
} from "lucide-react";

const links = [
  { to: "/",         label: "Overview",        Icon: LayoutDashboard, exact: true },
  { to: "/analytics", label: "Analytics",      Icon: BarChart3 },
  { to: "/products", label: "Products",         Icon: Package2 },
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
  const { user, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();

  const onSignOut = () => { logout(); navigate('/login'); };

  // Close the sidebar on mobile after clicking a nav link
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
        open ? "translate-x-0" : "-translate-x-full",
      ].join(" ")}
      aria-hidden={!open}
      role="dialog"
      aria-modal="true"
    >
      {/* Sidebar header: brand + profile (Theme toggle stays in Header) */}
      <div className="mb-4 flex items-center justify-between gap-2">
        <h1 className="text-lg font-bold tracking-wide">CAMGO ADMIN</h1>

        {/* Profile dropdown with solid background & ring */}
        <div className="relative">
          <button
            onClick={() => setMenuOpen(o => !o)}
            aria-label="Open profile menu"
            className="rounded-full w-9 h-9 flex items-center justify-center bg-[rgb(var(--card))] border border-[rgb(var(--border))] hover:bg-[rgba(var(--fg),0.05)]"
            title={user?.email || 'Profile'}
          >
            <UserPen size={18} strokeWidth={2} aria-hidden="true" />
          </button>

          {menuOpen && (
            <div
              className="
                absolute right-0 mt-2 w-44 rounded-lg
                bg-[rgb(var(--card))] shadow-xl
                ring-1 ring-[rgb(var(--border))]
                z-50
              "
            >
              <Link
                to="/profile"
                className="block px-4 py-2 hover:bg-[rgba(var(--fg),0.05)]"
                onClick={() => { setMenuOpen(false); handleNavClick(); }}
              >
                Profile
              </Link>
              <button
                onClick={onSignOut}
                className="block w-full text-left px-4 py-2 hover:bg-[rgba(var(--fg),0.05)]"
              >
                Sign out
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="space-y-1">
        {links.map(({ to, label, Icon, exact }) => (
          <NavLink
            key={to}
            to={to}
            end={!!exact}
            className="group block focus:outline-none"
            onClick={handleNavClick} // <-- collapse on mobile tap
          >
            {({ isActive }) => (
              <div
                className={[
                  "relative flex items-center gap-3 px-3 py-2 rounded-lg transition-colors",
                  "text-base",
                  isActive
                    ? "text-[rgb(var(--accent-1))] bg-[rgba(var(--accent-1),0.12)] border border-[rgba(var(--accent-1),0.35)]"
                    : "text-[rgb(var(--fg))] hover:bg-[rgba(var(--fg),0.05)] border border-transparent",
                ].join(" ")}
              >
                <Icon className="shrink-0" size={20} strokeWidth={1.9} aria-hidden="true" />
                <span className="whitespace-nowrap">{label}</span>
              </div>
            )}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
