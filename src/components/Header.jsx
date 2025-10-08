// Header.jsx
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import ThemeToggle from './ThemeToggle';
import { Menu, UserPen } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Header({ collapsed = false, onToggle = () => {} }) {
  const { user, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  const onSignOut = () => {
    logout();
    window.location.href = '/login';
  };

  return (
    <header className="sticky top-0 z-10 flex items-center justify-between px-4 py-3 border-b border-[rgb(var(--border))] bg-[rgb(var(--card))]">
      {/* Left: burger menu */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggle}
          aria-label="Toggle sidebar"
          title="Toggle sidebar"
          className="inline-flex items-center justify-center h-10 w-10 rounded-lg border border-[rgb(var(--border))] hover:bg-[rgba(var(--fg),0.05)] active:scale-[0.98] transition"
        >
          <Menu size={20} strokeWidth={2} aria-hidden="true" />
        </button>
      </div>

      {/* Right: Theme toggle + Profile dropdown */}
      <div className="flex items-center gap-3 relative">
        <ThemeToggle />

        <button
          onClick={() => setMenuOpen((o) => !o)}
          aria-label="Open profile menu"
          className="rounded-full w-9 h-9 flex items-center justify-center bg-[rgb(var(--card))] border border-[rgb(var(--border))] hover:bg-[rgba(var(--fg),0.05)]"
          title={user?.email || 'Profile'}
        >
          <UserPen size={18} strokeWidth={2} aria-hidden="true" />
        </button>

        {menuOpen && (
          <div
            className="absolute right-0 top-12 w-44 rounded-lg bg-[rgb(var(--card))] shadow-xl ring-1 ring-[rgb(var(--border))] z-50"
          >
            <Link
              to="/profile"
              className="block px-4 py-2 hover:bg-[rgba(var(--fg),0.05)]"
              onClick={() => setMenuOpen(false)}
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
    </header>
  );
}
