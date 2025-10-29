import React from 'react';

const ChartContainer = ({ 
  title, 
  subtitle, 
  children, 
  className = '', 
  loading = false,
  error = null,
  actions = null 
}) => {
  if (loading) {
    return (
      <div className={`modern-card p-6 ${className}`}>
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`modern-card p-6 ${className}`}>
        <div className="flex items-center justify-center h-64 text-red-500">
          <div className="text-center">
            <div className="text-lg font-medium mb-2">Chart Error</div>
            <div className="text-sm opacity-70">{error}</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`modern-card p-6 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-[rgb(var(--fg))]">{title}</h3>
          {subtitle && (
            <p className="text-sm text-[rgba(var(--fg),0.6)] mt-1">{subtitle}</p>
          )}
        </div>
        {actions && (
          <div className="flex items-center gap-2">
            {actions}
          </div>
        )}
      </div>
      <div className="w-full">
        {children}
      </div>
    </div>
  );
};

export default ChartContainer;
