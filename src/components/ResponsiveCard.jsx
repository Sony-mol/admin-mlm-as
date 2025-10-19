// ResponsiveCard.jsx - A responsive card component for the admin panel
import React from 'react';
import { Loader2 } from 'lucide-react';

export default function ResponsiveCard({ 
  children, 
  className = "", 
  loading = false,
  title,
  subtitle,
  header,
  footer,
  padding = "default",
  shadow = true,
  hover = true,
  ...props 
}) {
  const paddingClasses = {
    none: '',
    small: 'p-3',
    default: 'p-4 sm:p-6',
    large: 'p-6 sm:p-8',
  };

  const shadowClasses = shadow 
    ? 'shadow-sm hover:shadow-md' 
    : '';

  const hoverClasses = hover 
    ? 'hover:shadow-lg transition-shadow duration-300' 
    : '';

  return (
    <div
      className={`
        rounded-2xl 
        border border-[rgb(var(--border))] 
        bg-[rgb(var(--card))] 
        ${paddingClasses[padding]}
        ${shadowClasses}
        ${hoverClasses}
        ${className}
      `}
      {...props}
    >
      {/* Card Header */}
      {(title || subtitle || header) && (
        <div className="mb-4">
          {header || (
            <>
              {title && (
                <h3 className="
                  text-lg font-semibold 
                  text-[rgb(var(--fg))] 
                  mb-1
                ">
                  {title}
                </h3>
              )}
              {subtitle && (
                <p className="
                  text-sm 
                  text-[rgba(var(--fg),0.7)] 
                  leading-relaxed
                ">
                  {subtitle}
                </p>
              )}
            </>
          )}
        </div>
      )}

      {/* Card Content */}
      <div className="relative">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
            <span className="ml-2 text-sm text-[rgba(var(--fg),0.7)]">
              Loading...
            </span>
          </div>
        ) : (
          children
        )}
      </div>

      {/* Card Footer */}
      {footer && (
        <div className="mt-4 pt-4 border-t border-[rgb(var(--border))]">
          {footer}
        </div>
      )}
    </div>
  );
}

// Responsive Grid Container
export function ResponsiveGrid({ 
  children, 
  cols = { default: 1, sm: 2, lg: 3, xl: 4 },
  gap = "default",
  className = "" 
}) {
  const gapClasses = {
    none: 'gap-0',
    small: 'gap-3',
    default: 'gap-4 sm:gap-6',
    large: 'gap-6 sm:gap-8',
  };

  const colsClasses = `grid-cols-${cols.default}`;
  const smCols = cols.sm ? `sm:grid-cols-${cols.sm}` : '';
  const lgCols = cols.lg ? `lg:grid-cols-${cols.lg}` : '';
  const xlCols = cols.xl ? `xl:grid-cols-${cols.xl}` : '';

  return (
    <div className={`
      grid 
      ${colsClasses} 
      ${smCols} 
      ${lgCols} 
      ${xlCols}
      ${gapClasses[gap]}
      ${className}
    `}>
      {children}
    </div>
  );
}

// Responsive Stats Card
export function StatsCard({ 
  title, 
  value, 
  subtitle, 
  icon: Icon, 
  trend, 
  color = "blue",
  loading = false,
  className = "" 
}) {
  const colorClasses = {
    blue: 'text-blue-600 bg-blue-50 border-blue-200',
    green: 'text-green-600 bg-green-50 border-green-200',
    yellow: 'text-yellow-600 bg-yellow-50 border-yellow-200',
    red: 'text-red-600 bg-red-50 border-red-200',
    purple: 'text-purple-600 bg-purple-50 border-purple-200',
    gray: 'text-gray-600 bg-gray-50 border-gray-200',
  };

  return (
    <ResponsiveCard 
      className={`transition-all duration-300 hover:scale-[1.02] ${className}`}
      loading={loading}
      padding="default"
    >
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-[rgba(var(--fg),0.7)] mb-1">
            {title}
          </p>
          <p className="text-2xl font-bold text-[rgb(var(--fg))] mb-1">
            {value}
          </p>
          {subtitle && (
            <p className="text-xs text-[rgba(var(--fg),0.6)]">
              {subtitle}
            </p>
          )}
          {trend && (
            <div className="flex items-center mt-2">
              <span className={`text-xs font-medium ${trend.positive ? 'text-green-600' : 'text-red-600'}`}>
                {trend.value}
              </span>
              <span className="text-xs text-[rgba(var(--fg),0.6)] ml-1">
                {trend.period}
              </span>
            </div>
          )}
        </div>
        {Icon && (
          <div className={`p-3 rounded-lg border ${colorClasses[color]}`}>
            <Icon size={24} />
          </div>
        )}
      </div>
    </ResponsiveCard>
  );
}

// Responsive Section Container
export function Section({ 
  children, 
  title, 
  subtitle, 
  actions,
  className = "" 
}) {
  return (
    <section className={`space-y-4 sm:space-y-6 ${className}`}>
      {(title || subtitle || actions) && (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            {title && (
              <h2 className="text-xl sm:text-2xl font-bold text-[rgb(var(--fg))]">
                {title}
              </h2>
            )}
            {subtitle && (
              <p className="text-sm text-[rgba(var(--fg),0.7)] mt-1">
                {subtitle}
              </p>
            )}
          </div>
          {actions && (
            <div className="flex flex-wrap gap-2">
              {actions}
            </div>
          )}
        </div>
      )}
      {children}
    </section>
  );
}
