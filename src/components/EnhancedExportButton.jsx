// EnhancedExportButton.jsx - Advanced export functionality with filtering support
import React, { useState } from 'react';
import { 
  Download, 
  FileText, 
  Table, 
  Database, 
  Loader2, 
  CheckCircle, 
  AlertCircle,
  Filter,
  Settings,
  ChevronDown,
  X,
  ArrowUpDown,
  Eye,
  EyeOff
} from 'lucide-react';
import ExportService, { FieldMappings } from '../services/ExportService';
import { useNotifications } from './NotificationSystem';

const EnhancedExportButton = ({ 
  data = [], 
  dataType = 'data', 
  filename = 'export', 
  fieldMapping = null,
  disabled = false,
  className = '',
  showProgress = false,
  onExportStart = null,
  onExportComplete = null,
  // Enhanced options
  availableFields = null,
  currentFilters = {},
  currentSort = null,
  showAdvancedOptions = true,
  defaultFormat = 'excel',
  // New prop to indicate if data is already filtered
  isDataPreFiltered = false,
  totalRecords = null
}) => {
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [showFormatMenu, setShowFormatMenu] = useState(false);
  const [showAdvancedMenu, setShowAdvancedMenu] = useState(false);
  const [exportOptions, setExportOptions] = useState({
    format: defaultFormat,
    includeSummary: true,
    includeMetadata: true,
    includeFilters: true,
    selectedFields: null,
    sortBy: currentSort?.field || null,
    sortOrder: currentSort?.direction || 'asc',
    limit: null,
    customFilters: {}
  });
  const { addNotification } = useNotifications();

  // Get field mapping for the data type
  const getFieldMapping = () => {
    if (fieldMapping) return fieldMapping;
    return FieldMappings[dataType] || {};
  };

  // Get available fields
  const getAvailableFields = () => {
    if (availableFields) return availableFields;
    if (data.length > 0) {
      return Object.keys(data[0]).map(key => ({
        key,
        label: key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()),
        type: typeof data[0][key]
      }));
    }
    return [];
  };

  // Handle export with enhanced options
  const handleExport = async (format = exportOptions.format) => {
    if (!data || data.length === 0) {
      addNotification({
        type: 'error',
        title: 'Export Failed',
        message: 'No data available to export',
        duration: 3000
      });
      return;
    }

    try {
      setIsExporting(true);
      setExportProgress(0);
      
      if (onExportStart) onExportStart();

      // Validate data
      ExportService.validateExportData(data);

      // Prepare export options
      const options = {
        ...exportOptions,
        format,
        filters: isDataPreFiltered ? {} : { ...currentFilters, ...exportOptions.customFilters },
        fields: exportOptions.selectedFields ? exportOptions.selectedFields.map(f => f.key) : null,
        sortBy: exportOptions.sortBy,
        sortOrder: exportOptions.sortOrder,
        limit: exportOptions.limit
      };

      // Generate filename with timestamp
      const exportFilename = ExportService.generateFilename(filename, format);
      
      // Show progress notification
      const summary = isDataPreFiltered ? {
        totalRecords: totalRecords || data.length,
        filteredRecords: data.length,
        filtersApplied: Object.keys(currentFilters).filter(key => {
          const value = currentFilters[key];
          return value && value !== '' && value !== 'ALL' && value !== null && value !== undefined;
        }).length
      } : ExportService.generateExportSummary(data, options.filters, options);
      
      addNotification({
        type: 'info',
        title: 'Export Started',
        message: `Exporting ${summary.filteredRecords} of ${summary.totalRecords} records to ${format.toUpperCase()}...`,
        duration: 2000
      });

      // Export with metadata
      if (exportOptions.includeSummary || exportOptions.includeMetadata) {
        ExportService.exportWithMetadata(data, format, exportFilename, options);
      } else {
        // Regular export
        const exportData = isDataPreFiltered ? data : ExportService.exportFilteredData(data, options);
        
        switch (format) {
          case 'csv':
            ExportService.exportToCSV(exportData, exportFilename);
            break;
          case 'excel':
            ExportService.exportToExcel(exportData, exportFilename);
            break;
          case 'json':
            ExportService.exportToJSON(exportData, exportFilename);
            break;
          default:
            throw new Error(`Unsupported export format: ${format}`);
        }
      }

      // Success notification
      addNotification({
        type: 'success',
        title: 'Export Complete',
        message: `${summary.filteredRecords} records exported successfully to ${exportFilename}`,
        duration: 4000
      });

      if (onExportComplete) onExportComplete(format, summary.filteredRecords);

    } catch (error) {
      console.error('Export error:', error);
      addNotification({
        type: 'error',
        title: 'Export Failed',
        message: error.message || 'An error occurred during export',
        duration: 5000
      });
    } finally {
      setIsExporting(false);
      setExportProgress(0);
      setShowFormatMenu(false);
      setShowAdvancedMenu(false);
    }
  };

  const exportFormats = [
    {
      key: 'csv',
      label: 'CSV',
      description: 'Comma-separated values',
      icon: FileText,
      color: 'text-green-600'
    },
    {
      key: 'excel',
      label: 'Excel',
      description: 'Microsoft Excel format with metadata',
      icon: Table,
      color: 'text-blue-600'
    },
    {
      key: 'json',
      label: 'JSON',
      description: 'JavaScript Object Notation with metadata',
      icon: Database,
      color: 'text-purple-600'
    }
  ];

  const availableFieldsList = getAvailableFields();
  
  // Calculate summary based on whether data is pre-filtered or not
  const summary = isDataPreFiltered ? {
    totalRecords: totalRecords || data.length,
    filteredRecords: data.length,
    filtersApplied: Object.keys(currentFilters).filter(key => {
      const value = currentFilters[key];
      // Don't count empty values or default "ALL" values as active filters
      return value && value !== '' && value !== 'ALL' && value !== null && value !== undefined;
    }).length,
    exportOptions: {
      format: exportOptions.format || 'csv',
      fields: exportOptions.selectedFields?.length || 'all',
      sorted: exportOptions.sortBy ? `${exportOptions.sortBy} (${exportOptions.sortOrder})` : 'none',
      limited: exportOptions.limit ? `first ${exportOptions.limit}` : 'all'
    },
    timestamp: new Date().toISOString(),
    generatedBy: 'MLM Admin Dashboard'
  } : ExportService.generateExportSummary(data, currentFilters, exportOptions);

  return (
    <div className={`relative ${className}`}>
      {/* Main Export Button */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setShowFormatMenu(!showFormatMenu)}
          disabled={disabled || isExporting || data.length === 0}
          className={`
            inline-flex items-center gap-2 px-4 py-2 rounded-lg border transition-all duration-200 font-medium
            ${disabled || data.length === 0
              ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
              : 'bg-green-600 hover:bg-green-700 text-white border-green-600 hover:border-green-700 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-600/40 active:scale-[0.98]'
            }
            ${isExporting ? 'animate-pulse' : ''}
          `}
          title={data.length === 0 ? 'No data to export' : 
            summary.filtersApplied > 0 ? 
              `Export ${summary.filteredRecords} filtered records (${summary.filtersApplied} filters applied)` :
              `Export all ${summary.totalRecords} records`
          }
        >
          {isExporting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Exporting...</span>
            </>
          ) : (
            <>
              <Download className="h-4 w-4" />
              <span>Export {summary.filteredRecords === summary.totalRecords ? `(${summary.totalRecords})` : `(${summary.filteredRecords}/${summary.totalRecords} filtered)`}</span>
            </>
          )}
        </button>

        {/* Advanced Options Button */}
        {showAdvancedOptions && (
          <button
            onClick={() => setShowAdvancedMenu(!showAdvancedMenu)}
            disabled={disabled || isExporting || data.length === 0}
            className={`
              inline-flex items-center gap-1 px-3 py-2 rounded-lg border transition-all duration-200
              ${disabled || data.length === 0
                ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                : 'bg-gray-50 hover:bg-gray-100 text-gray-700 border-gray-300 hover:border-gray-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-500/40'
              }
            `}
            title="Advanced export options"
          >
            <Settings className="h-4 w-4" />
            <ChevronDown className={`h-3 w-3 transition-transform ${showAdvancedMenu ? 'rotate-180' : ''}`} />
          </button>
        )}
      </div>

      {/* Format Selection Menu */}
      {showFormatMenu && !isExporting && (
        <div className="absolute right-0 top-full mt-2 w-72 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50">
          <div className="p-3 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-sm font-medium text-gray- thread-900 dark:text-white">Export Format</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Choose your preferred export format
            </p>
          </div>
          
          <div className="p-2">
            {exportFormats.map((format) => {
              const IconComponent = format.icon;
              const isSelected = exportOptions.format === format.key;
              return (
                <button
                  key={format.key}
                  onClick={() => {
                    setExportOptions(prev => ({ ...prev, format: format.key }));
                    handleExport(format.key);
                  }}
                  className={`
                    w-full flex items-center gap-3 p-3 rounded-lg transition-colors
                    ${isSelected 
                      ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800' 
                      : 'hover:bg-gray-50 dark:hover:bg-gray-700'
                    }
                  `}
                >
                  <IconComponent className={`h-5 w-5 ${format.color}`} />
                  <div className="flex-1 text-left">
                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                      {format.label}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {format.description}
                    </div>
                  </div>
                  {isSelected && <CheckCircle className="h-4 w-4 text-green-600" />}
                </button>
              );
            })}
          </div>
          
          <div className="p-3 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                <div className="flex items-center gap-2">
                  <Database className="h-3 w-3" />
                  <span>{summary.filteredRecords} of {summary.totalRecords} records</span>
                </div>
                {summary.filtersApplied > 0 && (
                  <div className="flex items-center gap-1">
                    <Filter className="h-3 w-3" />
                    <span>{summary.filtersApplied} filters</span>
                  </div>
                )}
              </div>
              {summary.filtersApplied > 0 && (
                <div className="text-xs text-blue-600 dark:text-blue-400">
                  Only filtered records will be exported
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Advanced Options Menu */}
      {showAdvancedMenu && !isExporting && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50">
          <div className="p-3 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-gray-900 dark:text-white">Advanced Export Options</h3>
              <button
                onClick={() => setShowAdvancedMenu(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
          
          <div className="p-4 space-y-4">
            {/* Export Options */}
            <div className="space-y-3">
              <h4 className="text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">Export Options</h4>
              
              <div className="space-y-2">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={exportOptions.includeSummary}
                    onChange={(e) => setExportOptions(prev => ({ ...prev, includeSummary: e.target.checked }))}
                    className="rounded border-gray-300"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">Include export summary</span>
                </label>
                
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={exportOptions.includeMetadata}
                    onChange={(e) => setExportOptions(prev => ({ ...prev, includeMetadata: e.target.checked }))}
                    className="rounded border-gray-300"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">Include metadata</span>
                </label>
                
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={exportOptions.includeFilters}
                    onChange={(e) => setExportOptions(prev => ({ ...prev, includeFilters: e.target.checked }))}
                    className="rounded border-gray-300"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">Include applied filters</span>
                </label>
              </div>
            </div>

            {/* Field Selection */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">Fields</h4>
                <button
                  onClick={() => setExportOptions(prev => ({ 
                    ...prev, 
                    selectedFields: prev.selectedFields ? null : availableFieldsList 
                  }))}
                  className="text-xs text-blue-600 hover:text-blue-800"
                >
                  {exportOptions.selectedFields ? 'Select All' : 'Select None'}
                </button>
              </div>
              
              <div className="max-h-32 overflow-y-auto space-y-1">
                {availableFieldsList.slice(0, 10).map((field) => {
                  const isSelected = !exportOptions.selectedFields || exportOptions.selectedFields.some(f => f.key === field.key);
                  return (
                    <label key={field.key} className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={(e) => {
                          const newSelected = exportOptions.selectedFields || availableFieldsList;
                          if (e.target.checked) {
                            setExportOptions(prev => ({ 
                              ...prev, 
                              selectedFields: [...newSelected, field] 
                            }));
                          } else {
                            setExportOptions(prev => ({ 
                              ...prev, 
                              selectedFields: newSelected.filter(f => f.key !== field.key) 
                            }));
                          }
                        }}
                        className="rounded border-gray-300"
                      />
                      <span className="text-gray-700 dark:text-gray-300">{field.label}</span>
                    </label>
                  );
                })}
                {availableFieldsList.length > 10 && (
                  <div className="text-xs text-gray-500 text-center py-1">
                    ... and {availableFieldsList.length - 10} more fields
                  </div>
                )}
              </div>
            </div>

            {/* Sorting */}
            <div className="space-y-3">
              <h4 className="text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">Sorting</h4>
              
              <div className="flex gap-2">
                <select
                  value={exportOptions.sortBy || ''}
                  onChange={(e) => setExportOptions(prev => ({ ...prev, sortBy: e.target.value || null }))}
                  className="flex-1 text-sm border border-gray-300 rounded px-2 py-1"
                >
                  <option value="">No sorting</option>
                  {availableFieldsList.map(field => (
                    <option key={field.key} value={field.key}>{field.label}</option>
                  ))}
                </select>
                
                {exportOptions.sortBy && (
                  <button
                    onClick={() => setExportOptions(prev => ({ 
                      ...prev, 
                      sortOrder: prev.sortOrder === 'asc' ? 'desc' : 'asc' 
                    }))}
                    className="flex items-center gap-1 px-2 py-1 border border-gray-300 rounded text-sm"
                  >
                    <ArrowUpDown className="h-3 w-3" />
                    {exportOptions.sortOrder === 'asc' ? 'A-Z' : 'Z-A'}
                  </button>
                )}
              </div>
            </div>

            {/* Limit */}
            <div className="space-y-3">
              <h4 className="text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">Limit Records</h4>
              
              <input
                type="number"
                placeholder="No limit"
                value={exportOptions.limit || ''}
                onChange={(e) => setExportOptions(prev => ({ 
                  ...prev, 
                  limit: e.target.value ? parseInt(e.target.value) : null 
                }))}
                className="w-full text-sm border border-gray-300 rounded px-2 py-1"
                min="1"
                max="100000"
              />
            </div>
          </div>
          
          <div className="p-3 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700">
            <div className="flex items-center justify-between">
              <div className="text-xs text-gray-500 dark:text-gray-400">
                {summary.filteredRecords} records will be exported
              </div>
              <button
                onClick={() => handleExport()}
                className="px-3 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700 transition-colors"
              >
                Export Now
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Progress Bar */}
      {isExporting && showProgress && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-3 z-50">
          <div className="flex items-center gap-2 mb-2">
            <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
            <span className="text-sm font-medium text-gray-900 dark:text-white">
              Exporting...
            </span>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {exportProgress}%
            </span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${exportProgress}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default EnhancedExportButton;
