// ResponsiveFilters.jsx - A responsive filter component for the admin panel
import React, { useState } from 'react';
import { Search, Filter, X, ChevronDown, Calendar, DollarSign, Users } from 'lucide-react';

export default function ResponsiveFilters({
  filters = [],
  onFiltersChange,
  onSearch,
  searchPlaceholder = "Search...",
  className = "",
  showSearch = true,
  showFilters = true,
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilters, setActiveFilters] = useState({});

  // Handle search
  const handleSearch = (value) => {
    setSearchTerm(value);
    onSearch && onSearch(value);
  };

  // Handle filter changes
  const handleFilterChange = (filterKey, value) => {
    const newFilters = { ...activeFilters, [filterKey]: value };
    setActiveFilters(newFilters);
    onFiltersChange && onFiltersChange(newFilters);
  };

  // Clear all filters
  const clearAllFilters = () => {
    setActiveFilters({});
    onFiltersChange && onFiltersChange({});
  };

  // Get active filter count
  const activeFilterCount = Object.values(activeFilters).filter(value => 
    value !== '' && value !== null && value !== undefined
  ).length;

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Search and Filter Controls */}
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Search Input */}
        {showSearch && (
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder={searchPlaceholder}
                value={searchTerm}
                onChange={(e) => handleSearch(e.target.value)}
                className="
                  w-full pl-10 pr-4 py-2
                  border border-[rgb(var(--border))] 
                  rounded-lg
                  bg-[rgb(var(--bg))] 
                  text-[rgb(var(--fg))] 
                  placeholder-[rgba(var(--fg),0.5)]
                  focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                  transition-colors duration-200
                "
              />
              {searchTerm && (
                <button
                  onClick={() => handleSearch('')}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X size={16} />
                </button>
              )}
            </div>
          </div>
        )}

        {/* Filter Toggle Button */}
        {showFilters && filters.length > 0 && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="
              px-4 py-2
              border border-[rgb(var(--border))] 
              rounded-lg
              bg-[rgb(var(--card))] 
              text-[rgb(var(--fg))] 
              hover:bg-[rgba(var(--fg),0.05)]
              transition-colors duration-200
              flex items-center gap-2
              whitespace-nowrap
            "
          >
            <Filter size={16} />
            <span>Filters</span>
            {activeFilterCount > 0 && (
              <span className="
                px-2 py-0.5 
                bg-blue-100 text-blue-800 
                text-xs rounded-full
              ">
                {activeFilterCount}
              </span>
            )}
            <ChevronDown 
              size={16} 
              className={`transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
            />
          </button>
        )}
      </div>

      {/* Expandable Filters Panel */}
      {showFilters && filters.length > 0 && isExpanded && (
        <div className="
          p-4 
          border border-[rgb(var(--border))] 
          rounded-lg 
          bg-[rgb(var(--card))] 
          space-y-4
        ">
          {/* Filters Header */}
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-[rgb(var(--fg))]">
              Filter Options
            </h3>
            {activeFilterCount > 0 && (
              <button
                onClick={clearAllFilters}
                className="
                  text-xs text-red-600 
                  hover:text-red-800 
                  flex items-center gap-1
                "
              >
                <X size={12} />
                Clear All
              </button>
            )}
          </div>

          {/* Filters Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filters.map((filter) => (
              <div key={filter.key} className="space-y-2">
                <label className="block text-sm font-medium text-[rgb(var(--fg))]">
                  {filter.label}
                </label>
                
                {/* Render different filter types */}
                {filter.type === 'select' && (
                  <select
                    value={activeFilters[filter.key] || ''}
                    onChange={(e) => handleFilterChange(filter.key, e.target.value)}
                    className="
                      w-full px-3 py-2
                      border border-[rgb(var(--border))] 
                      rounded-lg
                      bg-[rgb(var(--bg))] 
                      text-[rgb(var(--fg))] 
                      focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                      transition-colors duration-200
                    "
                  >
                    <option value="">All {filter.label}</option>
                    {filter.options.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                )}

                {filter.type === 'date' && (
                  <input
                    type="date"
                    value={activeFilters[filter.key] || ''}
                    onChange={(e) => handleFilterChange(filter.key, e.target.value)}
                    className="
                      w-full px-3 py-2
                      border border-[rgb(var(--border))] 
                      rounded-lg
                      bg-[rgb(var(--bg))] 
                      text-[rgb(var(--fg))] 
                      focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                      transition-colors duration-200
                    "
                  />
                )}

                {filter.type === 'number' && (
                  <div className="flex gap-2">
                    <input
                      type="number"
                      placeholder="Min"
                      value={activeFilters[filter.key]?.min || ''}
                      onChange={(e) => handleFilterChange(filter.key, {
                        ...activeFilters[filter.key],
                        min: e.target.value
                      })}
                      className="
                        flex-1 px-3 py-2
                        border border-[rgb(var(--border))] 
                        rounded-lg
                        bg-[rgb(var(--bg))] 
                        text-[rgb(var(--fg))] 
                        placeholder-[rgba(var(--fg),0.5)]
                        focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                        transition-colors duration-200
                      "
                    />
                    <input
                      type="number"
                      placeholder="Max"
                      value={activeFilters[filter.key]?.max || ''}
                      onChange={(e) => handleFilterChange(filter.key, {
                        ...activeFilters[filter.key],
                        max: e.target.value
                      })}
                      className="
                        flex-1 px-3 py-2
                        border border-[rgb(var(--border))] 
                        rounded-lg
                        bg-[rgb(var(--bg))] 
                        text-[rgb(var(--fg))] 
                        placeholder-[rgba(var(--fg),0.5)]
                        focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                        transition-colors duration-200
                      "
                    />
                  </div>
                )}

                {filter.type === 'checkbox' && (
                  <div className="space-y-2 max-h-32 overflow-y-auto">
                    {filter.options.map((option) => (
                      <label key={option.value} className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={(activeFilters[filter.key] || []).includes(option.value)}
                          onChange={(e) => {
                            const currentValues = activeFilters[filter.key] || [];
                            const newValues = e.target.checked
                              ? [...currentValues, option.value]
                              : currentValues.filter(v => v !== option.value);
                            handleFilterChange(filter.key, newValues);
                          }}
                          className="
                            rounded border-[rgb(var(--border))] 
                            text-blue-600 
                            focus:ring-blue-500
                          "
                        />
                        <span className="text-sm text-[rgb(var(--fg))]">
                          {option.label}
                        </span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Active Filters Display */}
      {activeFilterCount > 0 && (
        <div className="flex flex-wrap gap-2">
          {Object.entries(activeFilters).map(([key, value]) => {
            if (!value || value === '' || (Array.isArray(value) && value.length === 0)) {
              return null;
            }

            const filter = filters.find(f => f.key === key);
            if (!filter) return null;

            const displayValue = Array.isArray(value) 
              ? `${value.length} selected`
              : filter.type === 'number' && typeof value === 'object'
              ? `${value.min || '0'} - ${value.max || '∞'}`
              : value;

            return (
              <span
                key={key}
                className="
                  inline-flex items-center gap-1 
                  px-3 py-1 
                  bg-blue-100 text-blue-800 
                  text-sm rounded-full
                "
              >
                <span>{filter.label}: {displayValue}</span>
                <button
                  onClick={() => handleFilterChange(key, filter.type === 'checkbox' ? [] : '')}
                  className="hover:bg-blue-200 rounded-full p-0.5"
                >
                  <X size={12} />
                </button>
              </span>
            );
          })}
        </div>
      )}
    </div>
  );
}
