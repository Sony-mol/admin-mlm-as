// Breadcrumb.jsx - Enhanced breadcrumb navigation component
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';

// Route mapping for better breadcrumb labels
const routeLabels = {
  '/': 'Overview',
  '/analytics': 'Analytics',
  '/products': 'Products',
  '/users': 'User Management',
  '/referral': 'Referral Tree',
  '/orders': 'Orders',
  '/payments': 'Payments',
  '/commissions': 'Commissions',
  '/withdrawals': 'Withdrawals',
  '/activity-logs': 'Activity Logs',
  '/tier-management': 'Tier Management',
  '/rewards': 'Rewards',
  '/user-rewards': 'User Rewards',
  '/admin-management': 'Admin Management',
  '/terms-management': 'Terms & Privacy',
  '/settings': 'Settings',
  '/profile': 'Profile',
};

export default function Breadcrumb() {
  const location = useLocation();
  
  // Don't show breadcrumb on home page
  if (location.pathname === '/') {
    return null;
  }

  const pathSegments = location.pathname.split('/').filter(Boolean);
  
  const breadcrumbs = [
    {
      label: 'Home',
      path: '/',
      icon: Home,
      isHome: true
    }
  ];

  // Build breadcrumb segments
  let currentPath = '';
  pathSegments.forEach((segment, index) => {
    currentPath += `/${segment}`;
    const label = routeLabels[currentPath] || segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, ' ');
    
    breadcrumbs.push({
      label,
      path: currentPath,
      isLast: index === pathSegments.length - 1
    });
  });

  return (
    <nav className="flex items-center space-x-1 text-sm text-[rgba(var(--fg),0.7)] mb-4" aria-label="Breadcrumb">
      {breadcrumbs.map((breadcrumb, index) => (
        <React.Fragment key={breadcrumb.path}>
          {index > 0 && (
            <ChevronRight className="h-4 w-4 text-[rgba(var(--fg),0.4)]" aria-hidden="true" />
          )}
          
          {breadcrumb.isLast ? (
            <span className="font-medium text-[rgb(var(--fg))] flex items-center gap-1">
              {breadcrumb.icon && <breadcrumb.icon className="h-4 w-4" />}
              {breadcrumb.label}
            </span>
          ) : (
            <Link
              to={breadcrumb.path}
              className="hover:text-[rgb(var(--fg))] transition-colors duration-200 flex items-center gap-1"
            >
              {breadcrumb.icon && <breadcrumb.icon className="h-4 w-4" />}
              {breadcrumb.label}
            </Link>
          )}
        </React.Fragment>
      ))}
    </nav>
  );
}
