import React from "react";
import {
  Home, LayoutDashboard,
  Users, UserRound,
  GitBranch, Network,
  ShoppingCart, Package,
  CreditCard, Wallet,
  Settings, Cog
} from "lucide-react";

// small helper: consistent icon sizing & color
const Ico = ({ as: Icon }) => (
  <Icon size={22} strokeWidth={1.8} className="text-[rgb(var(--fg))]" />
);

export default function IconPreview() {
  const rows = [
    {
      module: "Overview",
      a: { name: "LayoutDashboard", icon: LayoutDashboard },
      b: { name: "Home", icon: Home },
    },
    {
      module: "User Management",
      a: { name: "Users", icon: Users },
      b: { name: "UserRound", icon: UserRound },
    },
    {
      module: "Referral Tree",
      a: { name: "Network", icon: Network },
      b: { name: "GitBranch", icon: GitBranch },
    },
    {
      module: "Orders",
      a: { name: "Package", icon: Package },
      b: { name: "ShoppingCart", icon: ShoppingCart },
    },
    {
      module: "Payments",
      a: { name: "CreditCard", icon: CreditCard },
      b: { name: "Wallet", icon: Wallet },
    },
    {
      module: "Settings",
      a: { name: "Settings", icon: Settings },
      b: { name: "Cog", icon: Cog },
    },
  ];

  return (
    <div className="p-6 space-y-4 rounded-xl border border-[rgb(var(--border))] bg-[rgb(var(--card))]">
      <h2 className="text-xl font-semibold">Sidebar Icon Candidates (Lucide)</h2>
      <div className="text-sm opacity-75">
        Option A and B for each module. Tell me which ones you prefer.
      </div>

      <div className="divide-y divide-[rgb(var(--border))]">
        {rows.map((r) => (
          <div key={r.module} className="grid grid-cols-1 md:grid-cols-3 gap-3 py-3 items-center">
            <div className="font-medium">{r.module}</div>
            <div className="flex items-center gap-3">
              <span className="rounded-md border border-[rgb(var(--border))] px-3 py-2 inline-flex items-center gap-2">
                <Ico as={r.a.icon} /> <span className="text-sm">{r.a.name}</span>
              </span>
            </div>
            <div className="flex items-center gap-3">
              <span className="rounded-md border border-[rgb(var(--border))] px-3 py-2 inline-flex items-center gap-2">
                <Ico as={r.b.icon} /> <span className="text-sm">{r.b.name}</span>
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className="text-xs opacity-70 pt-2">
        Icons shown at 22px, stroke 1.8. We’ll tint active items with your accent and keep the rest in foreground color.
      </div>
    </div>
  );
}
