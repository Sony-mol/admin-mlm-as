// ProtectedLayout.jsx
import React, { useEffect, useState } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Header from './Header';
import Sidebar from './Sidebar';

export default function ProtectedLayout() {
  const { user } = useAuth();
  const location = useLocation();

  // Open by default; slides/pushes on desktop, overlays on mobile
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Close with ESC
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') setSidebarOpen(false); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  if (!user) return <Navigate to="/login" state={{ from: location }} replace />;

  return (
    <div className="min-h-screen bg-[rgb(var(--bg))] text-[rgb(var(--fg))]">
      {/* Sidebar always mounted; slides in/out */}
      <Sidebar
        open={sidebarOpen}
        // NEW: when a nav item is tapped on mobile, collapse the sidebar
        onNavigate={() => setSidebarOpen(false)}
      />

      {/* Mobile backdrop — tap to close (hidden on md+) */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/40 md:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Header + main. On desktop, shift when sidebar is open. On mobile, never shift. */}
      <div
        className={`${sidebarOpen ? 'md:ml-72' : 'md:ml-0'} ml-0`}
        style={{ transition: 'margin 300ms ease' }}
      >
        <Header
          collapsed={!sidebarOpen}
          onToggle={() => setSidebarOpen(v => !v)}
        />

        <main className="p-4 min-w-0">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
