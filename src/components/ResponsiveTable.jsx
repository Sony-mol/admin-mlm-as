// ResponsiveTable.jsx - A responsive table component for the admin panel
import React from 'react';
import { ChevronLeft, ChevronRight, ChevronUp, ChevronDown, MoreHorizontal } from 'lucide-react';

export default function ResponsiveTable({
  columns = [],
  data = [],
  loading = false,
  emptyMessage = "No data available",
  className = "",
  onRowClick,
  actions,
  pagination = null,
  ...props
}) {
  const [sortField, setSortField] = React.useState('');
  const [sortDirection, setSortDirection] = React.useState('asc');

  // Handle sorting
  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Sort data
  const sortedData = React.useMemo(() => {
    if (!sortField) return data;

    return [...data].sort((a, b) => {
      const aValue = a[sortField];
      const bValue = b[sortField];
      
      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }, [data, sortField, sortDirection]);

  if (loading) {
    return (
      <div className="rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--card))] overflow-hidden">
        <div className="p-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-sm text-[rgba(var(--fg),0.7)]">Loading data...</p>
        </div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--card))] overflow-hidden">
        <div className="p-8 text-center">
          <div className="text-4xl mb-4 opacity-50">📊</div>
          <p className="text-sm text-[rgba(var(--fg),0.7)]">{emptyMessage}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`rounded-lg border border-[rgb(var(--border))] bg-[rgb(var(--card))] overflow-hidden ${className}`} {...props}>
      {/* Desktop Table */}
      <div className="hidden md:block overflow-x-auto">
        <table className="min-w-full divide-y divide-[rgb(var(--border))]">
          <thead className="bg-[rgba(var(--fg),0.02)]">
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  className={`
                    px-6 py-3 text-left text-xs font-medium 
                    text-[rgba(var(--fg),0.6)] uppercase tracking-wider
                    ${column.sortable ? 'cursor-pointer hover:bg-[rgba(var(--fg),0.05)]' : ''}
                    ${column.className || ''}
                  `}
                  onClick={() => column.sortable && handleSort(column.key)}
                >
                  <div className="flex items-center gap-2">
                    {column.title}
                    {column.sortable && (
                      <div className="flex flex-col">
                        <ChevronUp 
                          size={12} 
                          className={`${sortField === column.key && sortDirection === 'asc' ? 'text-blue-600' : 'text-gray-400'}`}
                        />
                        <ChevronDown 
                          size={12} 
                          className={`${sortField === column.key && sortDirection === 'desc' ? 'text-blue-600' : 'text-gray-400'}`}
                        />
                      </div>
                    )}
                  </div>
                </th>
              ))}
              {actions && (
                <th className="px-6 py-3 text-left text-xs font-medium text-[rgba(var(--fg),0.6)] uppercase tracking-wider">
                  Actions
                </th>
              )}
            </tr>
          </thead>
          <tbody className="bg-[rgb(var(--card))] divide-y divide-[rgb(var(--border))]">
            {sortedData.map((row, index) => (
              <tr
                key={index}
                className={`hover:bg-[rgba(var(--fg),0.02)] transition-colors ${onRowClick ? 'cursor-pointer' : ''}`}
                onClick={() => onRowClick && onRowClick(row, index)}
              >
                {columns.map((column) => (
                  <td
                    key={column.key}
                    className={`px-6 py-4 whitespace-nowrap text-sm ${column.className || ''}`}
                  >
                    {column.render ? column.render(row[column.key], row, index) : row[column.key]}
                  </td>
                ))}
                {actions && (
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {actions(row, index)}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Cards */}
      <div className="md:hidden">
        {sortedData.map((row, index) => (
          <div
            key={index}
            className={`p-4 border-b border-[rgb(var(--border))] last:border-b-0 ${onRowClick ? 'cursor-pointer hover:bg-[rgba(var(--fg),0.02)]' : ''}`}
            onClick={() => onRowClick && onRowClick(row, index)}
          >
            <div className="space-y-2">
              {columns.map((column) => (
                <div key={column.key} className="flex justify-between items-start">
                  <span className="text-xs font-medium text-[rgba(var(--fg),0.6)] uppercase tracking-wider">
                    {column.title}
                  </span>
                  <span className={`text-sm text-right ${column.className || ''}`}>
                    {column.render ? column.render(row[column.key], row, index) : row[column.key]}
                  </span>
                </div>
              ))}
              {actions && (
                <div className="flex justify-end pt-2">
                  {actions(row, index)}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Pagination */}
      {pagination && (
        <div className="px-6 py-3 bg-[rgba(var(--fg),0.02)] border-t border-[rgb(var(--border))]">
          <div className="flex items-center justify-between">
            <div className="text-sm text-[rgba(var(--fg),0.6)]">
              Showing {pagination.start} to {pagination.end} of {pagination.total} results
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={pagination.onPrevious}
                disabled={!pagination.hasPrevious}
                className="p-2 rounded-lg border border-[rgb(var(--border))] hover:bg-[rgba(var(--fg),0.05)] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft size={16} />
              </button>
              <span className="text-sm text-[rgba(var(--fg),0.7)]">
                Page {pagination.currentPage} of {pagination.totalPages}
              </span>
              <button
                onClick={pagination.onNext}
                disabled={!pagination.hasNext}
                className="p-2 rounded-lg border border-[rgb(var(--border))] hover:bg-[rgba(var(--fg),0.05)] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Responsive Form Component
export function ResponsiveForm({ children, className = "", ...props }) {
  return (
    <form className={`space-y-4 sm:space-y-6 ${className}`} {...props}>
      {children}
    </form>
  );
}

// Responsive Form Group
export function FormGroup({ 
  label, 
  required = false, 
  error, 
  children, 
  className = "" 
}) {
  return (
    <div className={`space-y-2 ${className}`}>
      {label && (
        <label className="block text-sm font-medium text-[rgb(var(--fg))]">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      {children}
      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}
    </div>
  );
}

// Responsive Input
export function ResponsiveInput({ 
  type = "text", 
  placeholder, 
  value, 
  onChange, 
  disabled = false,
  className = "",
  ...props 
}) {
  return (
    <input
      type={type}
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      disabled={disabled}
      className={`
        w-full px-3 py-2 
        border border-[rgb(var(--border))] 
        rounded-lg 
        bg-[rgb(var(--bg))] 
        text-[rgb(var(--fg))] 
        placeholder-[rgba(var(--fg),0.5)]
        focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
        disabled:opacity-50 disabled:cursor-not-allowed
        transition-colors duration-200
        ${className}
      `}
      {...props}
    />
  );
}

// Responsive Button
export function ResponsiveButton({ 
  children, 
  variant = "primary", 
  size = "medium",
  loading = false,
  disabled = false,
  className = "",
  ...props 
}) {
  const variants = {
    primary: "bg-blue-600 hover:bg-blue-700 text-white",
    secondary: "bg-gray-600 hover:bg-gray-700 text-white",
    success: "bg-green-600 hover:bg-green-700 text-white",
    danger: "bg-red-600 hover:bg-red-700 text-white",
    outline: "border border-[rgb(var(--border))] hover:bg-[rgba(var(--fg),0.05)] text-[rgb(var(--fg))]",
  };

  const sizes = {
    small: "px-3 py-1.5 text-sm",
    medium: "px-4 py-2 text-sm sm:px-6 sm:py-3 sm:text-base",
    large: "px-6 py-3 text-base sm:px-8 sm:py-4 sm:text-lg",
  };

  return (
    <button
      disabled={disabled || loading}
      className={`
        inline-flex items-center justify-center gap-2
        rounded-lg font-medium
        transition-all duration-200
        focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
        disabled:opacity-50 disabled:cursor-not-allowed
        ${variants[variant]}
        ${sizes[size]}
        ${className}
      `}
      {...props}
    >
      {loading && (
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
      )}
      {children}
    </button>
  );
}
