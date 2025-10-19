// ProtectedLayout.jsx
import React, { useEffect, useState } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Header from './Header';
import Sidebar from './Sidebar';

export default function ProtectedLayout() {
  const { user } = useAuth();
  const location = useLocation();

  // Responsive sidebar state management
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  // Handle responsive behavior
  useEffect(() => {
    const checkScreenSize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      
      // Auto-close sidebar on mobile, auto-open on desktop
      if (mobile && sidebarOpen) {
        setSidebarOpen(false);
      } else if (!mobile && !sidebarOpen) {
        setSidebarOpen(true);
      }
    };

    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    
    return () => window.removeEventListener('resize', checkScreenSize);
  }, [sidebarOpen]);

  // Close with ESC or overlay click
  useEffect(() => {
    const onKey = (e) => { 
      if (e.key === 'Escape' && isMobile) {
        setSidebarOpen(false);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isMobile]);

  // Auto-close sidebar on mobile navigation
  const handleNavigate = () => {
    if (isMobile) {
      setSidebarOpen(false);
    }
  };

  if (!user) return <Navigate to="/login" state={{ from: location }} replace />;

  return (
    <div className="min-h-screen bg-[rgb(var(--bg))] text-[rgb(var(--fg))]">
      {/* Enhanced Sidebar with better responsive behavior */}
      <Sidebar
        open={sidebarOpen}
        onNavigate={handleNavigate}
        isMobile={isMobile}
      />

      {/* Mobile backdrop with improved UX */}
      {sidebarOpen && isMobile && (
        <div
          className="fixed inset-0 z-20 bg-black/50 backdrop-blur-sm"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Main content area with responsive margins */}
      <div
        className={`
          transition-all duration-300 ease-in-out
          ${sidebarOpen && !isMobile ? 'ml-72' : 'ml-0'}
          min-h-screen
        `}
      >
        <Header
          collapsed={!sidebarOpen}
          onToggle={() => setSidebarOpen(v => !v)}
          isMobile={isMobile}
        />

        {/* Responsive main content */}
        <main className="
          px-4 py-4
          sm:px-6 sm:py-6
          lg:px-8 lg:py-8
          min-w-0
          max-w-full
          overflow-x-hidden
        ">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
