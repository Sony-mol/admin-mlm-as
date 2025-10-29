// Header.jsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import ThemeToggle from './ThemeToggle';
import { Menu, UserPen, Settings } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { NotificationBell } from './NotificationSystem';

export default function Header({ collapsed = false, onToggle = () => {}, isMobile = false }) {
  const { user, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  const onSignOut = () => {
    logout();
    window.location.href = '/login';
  };

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuOpen && !event.target.closest('.profile-menu')) {
        setMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [menuOpen]);

  return (
    <header className="
      sticky top-0 z-10 
      flex items-center justify-between 
      px-4 py-3
      sm:px-6 sm:py-4
      border-b border-[rgb(var(--border))] 
      bg-[rgb(var(--card))] 
      backdrop-blur-md
      shadow-modern
    ">
      {/* Left: Mobile menu button + responsive title */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggle}
          aria-label="Toggle sidebar"
          title="Toggle sidebar"
          className="
            inline-flex items-center justify-center 
            h-10 w-10 
            rounded-lg 
            border border-[rgb(var(--border))] 
            hover:bg-[rgba(var(--fg),0.05)] 
            active:scale-[0.98] 
            transition-all duration-200
            focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
          "
        >
          <Menu size={20} strokeWidth={2} aria-hidden="true" />
        </button>
        
        {/* Show page title on mobile */}
        {isMobile && (
          <h1 className="text-lg font-bold text-gradient truncate">
            CQwealth
          </h1>
        )}
      </div>

      {/* Right: Settings + Theme toggle + Profile dropdown */}
      <div className="flex items-center gap-2 sm:gap-3 relative">
        {/* Notifications */}
        <NotificationBell />
        
        {/* Settings Button */}
        <Link
          to="/settings"
          className="
            inline-flex items-center justify-center 
            h-9 w-9 
            rounded-lg 
            border border-[rgb(var(--border))] 
            hover:bg-[rgba(var(--fg),0.05)] 
            active:scale-[0.98] 
            transition-all duration-200
            focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
          "
          title="Settings"
          aria-label="Settings"
        >
          <Settings size={18} strokeWidth={2} aria-hidden="true" />
        </Link>

        <ThemeToggle />

        <div className="profile-menu relative">
          <button
            onClick={() => setMenuOpen((o) => !o)}
            aria-label="Open profile menu"
            className="
              rounded-full 
              w-9 h-9 
              flex items-center justify-center 
              bg-gradient-to-r from-blue-500 to-purple-600
              border-none
              text-white
              hover:shadow-modern
              hover:scale-105
              transition-all duration-200
              focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
            "
            title={user?.email || 'Profile'}
          >
            <UserPen size={18} strokeWidth={2} aria-hidden="true" />
          </button>

          {/* Enhanced dropdown menu */}
          {menuOpen && (
            <div
              className="
                absolute right-0 top-12 
                w-48 
                rounded-lg 
                bg-[rgb(var(--card))] 
                shadow-xl 
                ring-1 ring-[rgb(var(--border))] 
                z-50
                border border-[rgb(var(--border))]
              "
            >
              {/* User info header */}
              <div className="px-4 py-3 border-b border-[rgb(var(--border))]">
                <p className="text-sm font-medium text-[rgb(var(--fg))] truncate">
                  {user?.email || 'Admin User'}
                </p>
                <p className="text-xs text-[rgba(var(--fg),0.6)]">
                  Administrator
                </p>
              </div>
              
              {/* Menu items */}
              <div className="py-1">
                <Link
                  to="/profile"
                  className="
                    block px-4 py-2 
                    text-sm text-[rgb(var(--fg))] 
                    hover:bg-[rgba(var(--fg),0.05)]
                    transition-colors duration-200
                  "
                  onClick={() => setMenuOpen(false)}
                >
                  Profile Settings
                </Link>
                <Link
                  to="/settings"
                  className="
                    block px-4 py-2 
                    text-sm text-[rgb(var(--fg))] 
                    hover:bg-[rgba(var(--fg),0.05)]
                    transition-colors duration-200
                  "
                  onClick={() => setMenuOpen(false)}
                >
                  App Settings
                </Link>
                <hr className="my-1 border-[rgb(var(--border))]" />
                <button
                  onClick={onSignOut}
                  className="
                    block w-full text-left px-4 py-2 
                    text-sm text-red-600 
                    hover:bg-red-50 
                    hover:text-red-700
                    transition-colors duration-200
                  "
                >
                  Sign out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
