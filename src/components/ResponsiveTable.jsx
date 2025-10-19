// ResponsiveTable.jsx - Enhanced responsive table component for the admin panel
import React, { useState, useEffect, useMemo } from 'react';
import { ChevronLeft, ChevronRight, ChevronUp, ChevronDown, MoreHorizontal, Grid3X3, List, Search, Filter, Download, Eye, Edit, Trash2, CheckSquare, Square } from 'lucide-react';

export default function ResponsiveTable({
  columns = [],
  data = [],
  loading = false,
  emptyMessage = "No data available",
  className = "",
  onRowClick,
  actions,
  pagination = null,
  // Enhanced features
  searchable = true,
  filterable = true,
  selectable = false,
  bulkActions = [],
  onBulkAction = null,
  selectedRows = new Set(),
  onRowSelect = null,
  cardView = true,
  stickyHeader = true,
  virtualScrolling = false,
  rowHeight = 60,
  visibleRows = 20,
  onSearch = null,
  onFilter = null,
  ...props
}) {
  const [sortField, setSortField] = useState('');
  const [sortDirection, setSortDirection] = useState('asc');
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({});
  const [viewMode, setViewMode] = useState('table'); // 'table' or 'card'
  const [isMobile, setIsMobile] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedItems, setSelectedItems] = useState(selectedRows);

  // Detect mobile screen size
  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  // Auto-switch to card view on mobile, but preserve user preference on desktop
  useEffect(() => {
    if (isMobile && cardView) {
      setViewMode('card');
    } else if (!isMobile && viewMode === 'card' && !cardView) {
      // If user is on desktop and cardView is disabled, switch to table
      setViewMode('table');
    }
  }, [isMobile, cardView, viewMode]);

  // Handle sorting
  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Handle search
  const handleSearch = (value) => {
    setSearchTerm(value);
    if (onSearch) {
      onSearch(value);
    }
  };

  // Handle row selection
  const handleRowSelect = (rowId, isSelected) => {
    const newSelected = new Set(selectedItems);
    if (isSelected) {
      newSelected.add(rowId);
    } else {
      newSelected.delete(rowId);
    }
    setSelectedItems(newSelected);
    if (onRowSelect) {
      onRowSelect(newSelected);
    }
  };

  // Handle select all
  const handleSelectAll = (isSelected) => {
    if (isSelected) {
      const allIds = filteredData.map((_, index) => index);
      setSelectedItems(new Set(allIds));
      if (onRowSelect) {
        onRowSelect(new Set(allIds));
      }
    } else {
      setSelectedItems(new Set());
      if (onRowSelect) {
        onRowSelect(new Set());
      }
    }
  };

  // Filter and search data
  const filteredData = useMemo(() => {
    // If searchable and filterable are disabled, use data as-is
    if (!searchable && !filterable) {
      return data;
    }

    let result = [...data];

    // Apply search
    if (searchable && searchTerm) {
      result = result.filter(row => {
        return columns.some(column => {
          const value = row[column.key];
          return value && value.toString().toLowerCase().includes(searchTerm.toLowerCase());
        });
      });
    }

    // Apply filters
    if (filterable) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value) {
          result = result.filter(row => {
            const cellValue = row[key];
            return cellValue && cellValue.toString().toLowerCase().includes(value.toLowerCase());
          });
        }
      });
    }

    return result;
  }, [data, searchTerm, filters, columns, searchable, filterable]);

  // Sort data
  const sortedData = useMemo(() => {
    if (!sortField) return filteredData;

    return [...filteredData].sort((a, b) => {
      const aValue = a[sortField];
      const bValue = b[sortField];
      
      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filteredData, sortField, sortDirection]);

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
      {/* Enhanced Header with Search, Filters, and View Controls */}
      {(searchable || filterable || cardView || selectable) && (
        <div className="p-4 border-b border-[rgb(var(--border))] bg-[rgba(var(--fg),0.02)]">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            {/* Left: Search and Filters */}
            <div className="flex flex-col sm:flex-row gap-3 flex-1">
              {searchable && (
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <input
                    type="text"
                    placeholder="Search..."
                    value={searchTerm}
                    onChange={(e) => handleSearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-[rgb(var(--border))] rounded-lg bg-[rgb(var(--bg))] text-[rgb(var(--fg))] placeholder-[rgba(var(--fg),0.5)] focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              )}
              
              {filterable && (
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className={`px-3 py-2 rounded-lg border border-[rgb(var(--border))] hover:bg-[rgba(var(--fg),0.05)] transition-colors flex items-center gap-2 ${showFilters ? 'bg-blue-50 border-blue-300' : ''}`}
                >
                  <Filter className="h-4 w-4" />
                  <span className="text-sm">Filters</span>
                </button>
              )}
            </div>

            {/* Right: View Controls and Bulk Actions */}
            <div className="flex items-center gap-2">
              {/* Bulk Actions */}
              {selectable && selectedItems.size > 0 && (
                <div className="flex items-center gap-2 mr-4">
                  <span className="text-sm text-[rgba(var(--fg),0.7)]">
                    {selectedItems.size} selected
                  </span>
                  {bulkActions.map((action, index) => (
                    <button
                      key={index}
                      onClick={() => onBulkAction && onBulkAction(action.key, Array.from(selectedItems))}
                      className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                    >
                      {action.label}
                    </button>
                  ))}
                </div>
              )}

              {/* View Mode Toggle */}
              {cardView && (
                <div className="flex border border-[rgb(var(--border))] rounded-lg overflow-hidden">
                  <button
                    onClick={() => setViewMode('table')}
                    className={`px-3 py-2 ${viewMode === 'table' ? 'bg-blue-600 text-white' : 'bg-[rgb(var(--bg))] text-[rgb(var(--fg))] hover:bg-[rgba(var(--fg),0.05)]'} transition-colors`}
                    title="Table View"
                  >
                    <List className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setViewMode('card')}
                    className={`px-3 py-2 ${viewMode === 'card' ? 'bg-blue-600 text-white' : 'bg-[rgb(var(--bg))] text-[rgb(var(--fg))] hover:bg-[rgba(var(--fg),0.05)]'} transition-colors`}
                    title="Card View"
                  >
                    <Grid3X3 className="h-4 w-4" />
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Filters Panel */}
          {showFilters && filterable && (
            <div className="mt-4 p-4 bg-[rgb(var(--bg))] rounded-lg border border-[rgb(var(--border))]">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {columns.filter(col => col.filterable !== false).map((column) => (
                  <div key={column.key}>
                    <label className="block text-sm font-medium text-[rgb(var(--fg))] mb-1">
                      {column.title}
                    </label>
                    <input
                      type="text"
                      placeholder={`Filter by ${column.title.toLowerCase()}...`}
                      value={filters[column.key] || ''}
                      onChange={(e) => setFilters(prev => ({ ...prev, [column.key]: e.target.value }))}
                      className="w-full px-3 py-2 border border-[rgb(var(--border))] rounded-lg bg-[rgb(var(--bg))] text-[rgb(var(--fg))] placeholder-[rgba(var(--fg),0.5)] focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Desktop Table */}
      <div className={`${viewMode === 'table' ? 'block' : 'hidden'} overflow-x-auto`}>
        <table className={`min-w-full divide-y divide-[rgb(var(--border))] ${stickyHeader ? 'sticky-header' : ''}`}>
          <thead className={`bg-[rgba(var(--fg),0.02)] ${stickyHeader ? 'sticky top-0 z-10' : ''}`}>
            <tr>
              {selectable && (
                <th className="px-6 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={selectedItems.size === sortedData.length && sortedData.length > 0}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                </th>
              )}
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
                className={`hover:bg-[rgba(var(--fg),0.02)] transition-colors ${onRowClick ? 'cursor-pointer' : ''} ${selectedItems.has(index) ? 'bg-blue-50' : ''}`}
                onClick={() => onRowClick && onRowClick(row, index)}
              >
                {selectable && (
                  <td className="px-6 py-4 whitespace-nowrap">
                    <input
                      type="checkbox"
                      checked={selectedItems.has(index)}
                      onChange={(e) => handleRowSelect(index, e.target.checked)}
                      onClick={(e) => e.stopPropagation()}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                  </td>
                )}
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

      {/* Mobile Cards / Card View */}
      <div className={`${viewMode === 'card' ? 'block' : 'hidden'}`}>
        <div className="p-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {sortedData.map((row, index) => (
              <div
                key={index}
                className={`p-4 border border-[rgb(var(--border))] rounded-lg bg-[rgb(var(--bg))] ${onRowClick ? 'cursor-pointer hover:shadow-md hover:border-blue-300' : ''} ${selectedItems.has(index) ? 'border-blue-500 bg-blue-50' : ''} transition-all duration-200`}
                onClick={() => onRowClick && onRowClick(row, index)}
              >
                {/* Card Header with Selection */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    {selectable && (
                      <input
                        type="checkbox"
                        checked={selectedItems.has(index)}
                        onChange={(e) => handleRowSelect(index, e.target.checked)}
                        onClick={(e) => e.stopPropagation()}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                    )}
                  </div>
                  {actions && (
                    <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                      {actions(row, index)}
                    </div>
                  )}
                </div>

                {/* Card Content */}
                <div className="space-y-2">
                  {columns.slice(0, 4).map((column) => (
                    <div key={column.key} className="flex justify-between items-start">
                      <span className="text-xs font-medium text-[rgba(var(--fg),0.6)] uppercase tracking-wider">
                        {column.title}
                      </span>
                      <span className={`text-sm text-right ${column.className || ''}`}>
                        {column.render ? column.render(row[column.key], row, index) : row[column.key]}
                      </span>
                    </div>
                  ))}
                  
                  {/* Show more columns if needed */}
                  {columns.length > 4 && (
                    <details className="mt-2">
                      <summary className="text-xs text-blue-600 cursor-pointer hover:text-blue-800">
                        Show more details
                      </summary>
                      <div className="mt-2 space-y-2">
                        {columns.slice(4).map((column) => (
                          <div key={column.key} className="flex justify-between items-start">
                            <span className="text-xs font-medium text-[rgba(var(--fg),0.6)] uppercase tracking-wider">
                              {column.title}
                            </span>
                            <span className={`text-sm text-right ${column.className || ''}`}>
                              {column.render ? column.render(row[column.key], row, index) : row[column.key]}
                            </span>
                          </div>
                        ))}
                      </div>
                    </details>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Mobile List View (fallback for small screens) */}
      <div className={`${viewMode === 'table' ? 'block' : 'hidden'} md:hidden`}>
        {sortedData.map((row, index) => (
          <div
            key={index}
            className={`p-4 border-b border-[rgb(var(--border))] last:border-b-0 ${onRowClick ? 'cursor-pointer hover:bg-[rgba(var(--fg),0.02)]' : ''} ${selectedItems.has(index) ? 'bg-blue-50' : ''}`}
            onClick={() => onRowClick && onRowClick(row, index)}
          >
            <div className="space-y-2">
              {selectable && (
                <div className="flex items-center gap-2 mb-2">
                  <input
                    type="checkbox"
                    checked={selectedItems.has(index)}
                    onChange={(e) => handleRowSelect(index, e.target.checked)}
                    onClick={(e) => e.stopPropagation()}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <span className="text-sm font-medium">Select item</span>
                </div>
              )}
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
                <div className="flex justify-end pt-2" onClick={(e) => e.stopPropagation()}>
                  {actions(row, index)}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Enhanced Pagination */}
      {pagination && (
        <div className="px-6 py-3 bg-[rgba(var(--fg),0.02)] border-t border-[rgb(var(--border))]">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div className="text-sm text-[rgba(var(--fg),0.6)]">
              <div>
                Showing {pagination.start} to {pagination.end} of {pagination.total} results
              </div>
              {(searchable || filterable) && (searchTerm || Object.values(filters).some(f => f)) && (
                <div className="text-xs text-blue-600 mt-1">
                  {sortedData.length} of {data.length} items match your filters
                </div>
              )}
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
