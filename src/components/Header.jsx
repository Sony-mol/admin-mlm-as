import React from 'react';
import ThemeToggle from './ThemeToggle';
import { Menu } from 'lucide-react';

export default function Header({ collapsed = false, onToggle = () => {} }) {
  return (
    <header className="sticky top-0 z-10 flex items-center justify-between px-4 py-3 border-b border-[rgb(var(--border))] bg-[rgb(var(--card))]">
      <div className="flex items-center gap-3">
        {/* Burger menu icon (always the same, no chevrons) */}
        <button
          onClick={onToggle}
          aria-label="Toggle sidebar"
          title="Toggle sidebar"
          className="inline-flex items-center justify-center h-10 w-10 rounded-lg border border-[rgb(var(--border))] hover:bg-[rgba(var(--fg),0.05)] active:scale-[0.98] transition"
        >
          <Menu size={20} strokeWidth={2} aria-hidden="true" />
        </button>
      </div>

      {/* Theme toggle stays in Header */}
      <div className="flex items-center gap-3">
        <ThemeToggle />
      </div>
    </header>
  );
}
