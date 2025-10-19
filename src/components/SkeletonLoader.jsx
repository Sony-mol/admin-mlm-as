// SkeletonLoader.jsx - Enhanced skeleton loading states for better perceived performance
import React from 'react';

// Enhanced base skeleton component with shimmer effect and better light theme contrast
const SkeletonBase = ({ className = '', children, ...props }) => (
  <div
    className={`relative overflow-hidden bg-gray-200 dark:bg-[rgba(var(--fg),0.08)] rounded ${className}`}
    {...props}
  >
    {/* Shimmer effect overlay with better light theme contrast */}
    <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-gray-300 dark:via-[rgba(var(--fg),0.1)] to-transparent"></div>
    {children}
  </div>
);

// Card skeleton with better light theme contrast
export const SkeletonCard = ({ className = '' }) => (
  <div className={`rounded-2xl border border-gray-200 dark:border-[rgb(var(--border))] bg-white dark:bg-[rgb(var(--card))] p-6 ${className}`}>
    <div className="flex items-center justify-between mb-4">
      <SkeletonBase className="h-4 w-24" />
      <SkeletonBase className="h-8 w-8 rounded-full" />
    </div>
    <SkeletonBase className="h-8 w-32 mb-2" />
    <SkeletonBase className="h-3 w-20" />
  </div>
);

// Table skeleton
export const SkeletonTable = ({ rows = 5, columns = 4, className = '' }) => (
  <div className={`rounded-2xl border border-[rgb(var(--border))] bg-[rgb(var(--card))] overflow-hidden ${className}`}>
    {/* Table header */}
    <div className="border-b border-[rgb(var(--border))] p-4">
      <div className="flex gap-4">
        {Array.from({ length: columns }).map((_, i) => (
          <SkeletonBase key={i} className="h-4 flex-1" />
        ))}
      </div>
    </div>
    
    {/* Table rows */}
    {Array.from({ length: rows }).map((_, rowIndex) => (
      <div key={rowIndex} className="border-b border-[rgb(var(--border))] p-4 last:border-b-0">
        <div className="flex gap-4">
          {Array.from({ length: columns }).map((_, colIndex) => (
            <SkeletonBase key={colIndex} className="h-4 flex-1" />
          ))}
        </div>
      </div>
    ))}
  </div>
);

// Stats card skeleton with better light theme contrast
export const SkeletonStatsCard = ({ className = '' }) => (
  <div className={`rounded-2xl border border-gray-200 dark:border-[rgb(var(--border))] bg-white dark:bg-[rgb(var(--card))] p-6 ${className}`}>
    <div className="flex items-center justify-between mb-4">
      <div>
        <SkeletonBase className="h-4 w-20 mb-2" />
        <SkeletonBase className="h-8 w-16" />
      </div>
      <SkeletonBase className="h-12 w-12 rounded-full" />
    </div>
    <SkeletonBase className="h-3 w-24" />
  </div>
);

// List item skeleton with better light theme contrast
export const SkeletonListItem = ({ className = '' }) => (
  <div className={`flex items-center gap-3 p-3 rounded-lg border border-gray-200 dark:border-[rgb(var(--border))] bg-white dark:bg-[rgb(var(--card))] ${className}`}>
    <SkeletonBase className="h-10 w-10 rounded-full" />
    <div className="flex-1">
      <SkeletonBase className="h-4 w-32 mb-2" />
      <SkeletonBase className="h-3 w-20" />
    </div>
    <SkeletonBase className="h-6 w-16 rounded" />
  </div>
);

// Form skeleton
export const SkeletonForm = ({ fields = 3, className = '' }) => (
  <div className={`space-y-4 ${className}`}>
    {Array.from({ length: fields }).map((_, i) => (
      <div key={i}>
        <SkeletonBase className="h-4 w-24 mb-2" />
        <SkeletonBase className="h-10 w-full" />
      </div>
    ))}
    <div className="flex gap-2 pt-4">
      <SkeletonBase className="h-10 w-20" />
      <SkeletonBase className="h-10 w-20" />
    </div>
  </div>
);

// Chart skeleton with better light theme contrast
export const SkeletonChart = ({ className = '' }) => (
  <div className={`rounded-2xl border border-gray-200 dark:border-[rgb(var(--border))] bg-white dark:bg-[rgb(var(--card))] p-6 ${className}`}>
    <div className="flex items-center justify-between mb-6">
      <SkeletonBase className="h-6 w-32" />
      <SkeletonBase className="h-8 w-24" />
    </div>
    <div className="space-y-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="flex items-center gap-3">
          <SkeletonBase className="h-4 w-4 rounded" />
          <SkeletonBase className="h-4 flex-1" />
          <SkeletonBase className="h-4 w-12" />
        </div>
      ))}
    </div>
  </div>
);

// Dashboard skeleton
export const SkeletonDashboard = () => (
  <div className="space-y-6">
    {/* Stats cards */}
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <SkeletonStatsCard key={i} />
      ))}
    </div>
    
    {/* Charts */}
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <SkeletonChart />
      <SkeletonChart />
    </div>
    
    {/* Recent activity */}
    <SkeletonCard>
      <SkeletonBase className="h-6 w-40 mb-4" />
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <SkeletonListItem key={i} />
        ))}
      </div>
    </SkeletonCard>
  </div>
);

// User profile skeleton with better light theme contrast
export const SkeletonUserProfile = ({ className = '' }) => (
  <div className={`flex items-center gap-4 p-4 rounded-lg border border-gray-200 dark:border-[rgb(var(--border))] bg-white dark:bg-[rgb(var(--card))] ${className}`}>
    <SkeletonBase className="h-16 w-16 rounded-full" />
    <div className="flex-1">
      <SkeletonBase className="h-5 w-32 mb-2" />
      <SkeletonBase className="h-4 w-48 mb-1" />
      <SkeletonBase className="h-3 w-24" />
    </div>
    <div className="flex gap-2">
      <SkeletonBase className="h-8 w-8 rounded" />
      <SkeletonBase className="h-8 w-8 rounded" />
    </div>
  </div>
);

// Product card skeleton with better light theme contrast
export const SkeletonProductCard = ({ className = '' }) => (
  <div className={`rounded-2xl border border-gray-200 dark:border-[rgb(var(--border))] bg-white dark:bg-[rgb(var(--card))] overflow-hidden ${className}`}>
    <SkeletonBase className="h-48 w-full" />
    <div className="p-4">
      <SkeletonBase className="h-5 w-3/4 mb-2" />
      <SkeletonBase className="h-4 w-1/2 mb-3" />
      <div className="flex items-center justify-between">
        <SkeletonBase className="h-6 w-16" />
        <SkeletonBase className="h-8 w-20 rounded" />
      </div>
    </div>
  </div>
);

// Payment card skeleton with better light theme contrast
export const SkeletonPaymentCard = ({ className = '' }) => (
  <div className={`rounded-2xl border border-gray-200 dark:border-[rgb(var(--border))] bg-white dark:bg-[rgb(var(--card))] p-6 ${className}`}>
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-3">
        <SkeletonBase className="h-10 w-10 rounded-full" />
        <div>
          <SkeletonBase className="h-4 w-24 mb-1" />
          <SkeletonBase className="h-3 w-32" />
        </div>
      </div>
      <SkeletonBase className="h-6 w-16 rounded-full" />
    </div>
    <div className="space-y-2">
      <div className="flex justify-between">
        <SkeletonBase className="h-4 w-20" />
        <SkeletonBase className="h-4 w-16" />
      </div>
      <div className="flex justify-between">
        <SkeletonBase className="h-4 w-24" />
        <SkeletonBase className="h-4 w-20" />
      </div>
    </div>
  </div>
);

// Commission card skeleton with better light theme contrast
export const SkeletonCommissionCard = ({ className = '' }) => (
  <div className={`rounded-2xl border border-gray-200 dark:border-[rgb(var(--border))] bg-white dark:bg-[rgb(var(--card))] p-6 ${className}`}>
    <div className="flex items-center justify-between mb-4">
      <SkeletonBase className="h-6 w-32" />
      <SkeletonBase className="h-6 w-16 rounded-full" />
    </div>
    <div className="space-y-3">
      <div className="flex justify-between items-center">
        <SkeletonBase className="h-4 w-20" />
        <SkeletonBase className="h-5 w-24" />
      </div>
      <div className="flex justify-between items-center">
        <SkeletonBase className="h-4 w-24" />
        <SkeletonBase className="h-4 w-16" />
      </div>
    </div>
  </div>
);

// Withdrawal card skeleton with better light theme contrast
export const SkeletonWithdrawalCard = ({ className = '' }) => (
  <div className={`rounded-2xl border border-gray-200 dark:border-[rgb(var(--border))] bg-white dark:bg-[rgb(var(--card))] p-6 ${className}`}>
    <div className="flex items-center justify-between mb-4">
      <div>
        <SkeletonBase className="h-5 w-32 mb-1" />
        <SkeletonBase className="h-3 w-24" />
      </div>
      <SkeletonBase className="h-6 w-20 rounded-full" />
    </div>
    <div className="space-y-2">
      <div className="flex justify-between">
        <SkeletonBase className="h-4 w-20" />
        <SkeletonBase className="h-4 w-24" />
      </div>
      <div className="flex justify-between">
        <SkeletonBase className="h-4 w-16" />
        <SkeletonBase className="h-4 w-20" />
      </div>
    </div>
  </div>
);

// Activity log skeleton with better light theme contrast
export const SkeletonActivityLog = ({ className = '' }) => (
  <div className={`rounded-lg border border-gray-200 dark:border-[rgb(var(--border))] bg-white dark:bg-[rgb(var(--card))] p-4 ${className}`}>
    <div className="flex items-start gap-3">
      <SkeletonBase className="h-8 w-8 rounded-full mt-1" />
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-1">
          <SkeletonBase className="h-4 w-24" />
          <SkeletonBase className="h-3 w-16 rounded-full" />
        </div>
        <SkeletonBase className="h-4 w-full mb-1" />
        <SkeletonBase className="h-3 w-32" />
      </div>
    </div>
  </div>
);

// Enhanced table skeleton with more realistic layout and better light theme contrast
export const SkeletonEnhancedTable = ({ rows = 5, columns = 4, hasActions = true, className = '' }) => (
  <div className={`rounded-2xl border border-gray-200 dark:border-[rgb(var(--border))] bg-white dark:bg-[rgb(var(--card))] overflow-hidden ${className}`}>
    {/* Table header */}
    <div className="border-b border-gray-200 dark:border-[rgb(var(--border))] p-4 bg-gray-50 dark:bg-[rgba(var(--fg),0.02)]">
      <div className="flex gap-4">
        {Array.from({ length: columns }).map((_, i) => (
          <SkeletonBase key={i} className="h-4 flex-1" />
        ))}
        {hasActions && <SkeletonBase className="h-4 w-20" />}
      </div>
    </div>
    
    {/* Table rows */}
    {Array.from({ length: rows }).map((_, rowIndex) => (
      <div key={rowIndex} className="border-b border-gray-100 dark:border-[rgb(var(--border))] p-4 last:border-b-0 hover:bg-gray-50 dark:hover:bg-[rgba(var(--fg),0.02)] transition-colors">
        <div className="flex gap-4 items-center">
          {Array.from({ length: columns }).map((_, colIndex) => (
            <SkeletonBase key={colIndex} className="h-4 flex-1" />
          ))}
          {hasActions && (
            <div className="flex gap-2">
              <SkeletonBase className="h-8 w-8 rounded" />
              <SkeletonBase className="h-8 w-8 rounded" />
              <SkeletonBase className="h-8 w-8 rounded" />
            </div>
          )}
        </div>
      </div>
    ))}
  </div>
);

// Page-specific skeletons
export const SkeletonUsersPage = () => (
  <div className="space-y-6">
    <div className="flex items-center justify-between">
      <SkeletonBase className="h-8 w-48" />
      <SkeletonBase className="h-10 w-32 rounded" />
    </div>
    <SkeletonEnhancedTable rows={8} columns={5} hasActions={true} />
  </div>
);

export const SkeletonOrdersPage = () => (
  <div className="space-y-6">
    <div className="flex items-center justify-between">
      <SkeletonBase className="h-8 w-48" />
      <SkeletonBase className="h-10 w-32 rounded" />
    </div>
    <SkeletonEnhancedTable rows={6} columns={6} hasActions={true} />
  </div>
);

export const SkeletonPaymentsPage = () => (
  <div className="space-y-6">
    <div className="flex items-center justify-between">
      <SkeletonBase className="h-8 w-48" />
      <SkeletonBase className="h-10 w-32 rounded" />
    </div>
    <SkeletonEnhancedTable rows={7} columns={5} hasActions={true} />
  </div>
);

export const SkeletonCommissionsPage = () => (
  <div className="space-y-6">
    <div className="flex items-center justify-between">
      <SkeletonBase className="h-8 w-48" />
      <SkeletonBase className="h-10 w-32 rounded" />
    </div>
    <SkeletonEnhancedTable rows={6} columns={5} hasActions={true} />
  </div>
);

export const SkeletonWithdrawalsPage = () => (
  <div className="space-y-6">
    <div className="flex items-center justify-between">
      <SkeletonBase className="h-8 w-48" />
      <SkeletonBase className="h-10 w-32 rounded" />
    </div>
    <SkeletonEnhancedTable rows={5} columns={6} hasActions={true} />
  </div>
);

export const SkeletonProductsPage = () => (
  <div className="space-y-6">
    <div className="flex items-center justify-between">
      <SkeletonBase className="h-8 w-48" />
      <SkeletonBase className="h-10 w-32 rounded" />
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: 6 }).map((_, i) => (
        <SkeletonProductCard key={i} />
      ))}
    </div>
  </div>
);

export const SkeletonReferralTreePage = () => (
  <div className="space-y-6">
    <div className="flex items-center justify-between">
      <SkeletonBase className="h-8 w-48" />
      <div className="flex gap-2">
        <SkeletonBase className="h-10 w-24 rounded" />
        <SkeletonBase className="h-10 w-24 rounded" />
      </div>
    </div>
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
      {Array.from({ length: 4 }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  </div>
);

// Add shimmer animation styles
const shimmerStyles = `
  @keyframes shimmer {
    0% { transform: translateX(-100%); }
    100% { transform: translateX(100%); }
  }
`;

// Inject styles into the document
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement('style');
  styleSheet.textContent = shimmerStyles;
  document.head.appendChild(styleSheet);
}

// Export all skeleton components
export default {
  Card: SkeletonCard,
  Table: SkeletonTable,
  EnhancedTable: SkeletonEnhancedTable,
  StatsCard: SkeletonStatsCard,
  ListItem: SkeletonListItem,
  Form: SkeletonForm,
  Chart: SkeletonChart,
  Dashboard: SkeletonDashboard,
  UserProfile: SkeletonUserProfile,
  ProductCard: SkeletonProductCard,
  PaymentCard: SkeletonPaymentCard,
  CommissionCard: SkeletonCommissionCard,
  WithdrawalCard: SkeletonWithdrawalCard,
  ActivityLog: SkeletonActivityLog,
  // Page-specific skeletons
  UsersPage: SkeletonUsersPage,
  OrdersPage: SkeletonOrdersPage,
  PaymentsPage: SkeletonPaymentsPage,
  CommissionsPage: SkeletonCommissionsPage,
  WithdrawalsPage: SkeletonWithdrawalsPage,
  ProductsPage: SkeletonProductsPage,
  ReferralTreePage: SkeletonReferralTreePage,
  Base: SkeletonBase,
};
