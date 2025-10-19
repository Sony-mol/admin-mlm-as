// ExportButton.jsx - Reusable export functionality component
import React, { useState } from 'react';
import { Download, FileText, Table, Database, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import ExportService, { FieldMappings } from '../services/ExportService';
import { useNotifications } from './NotificationSystem';

const ExportButton = ({ 
  data = [], 
  dataType = 'data', 
  filename = 'export', 
  fieldMapping = null,
  disabled = false,
  className = '',
  showProgress = false,
  onExportStart = null,
  onExportComplete = null
}) => {
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [showFormatMenu, setShowFormatMenu] = useState(false);
  const { addNotification } = useNotifications();

  // Get field mapping for the data type
  const getFieldMapping = () => {
    if (fieldMapping) return fieldMapping;
    return FieldMappings[dataType] || {};
  };

  // Handle export with progress
  const handleExport = async (format) => {
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

      // Format data for export
      const formattedData = ExportService.formatDataForExport(data, getFieldMapping());
      
      // Generate filename with timestamp
      const exportFilename = ExportService.generateFilename(filename, format);
      
      // Show progress notification
      addNotification({
        type: 'info',
        title: 'Export Started',
        message: `Exporting ${data.length} records to ${format.toUpperCase()}...`,
        duration: 2000
      });

      // Export based on format
      switch (format) {
        case 'csv':
          if (showProgress) {
            await ExportService.exportWithProgress(
              formattedData,
              (chunk) => ExportService.exportToCSV(chunk, exportFilename),
              setExportProgress
            );
          } else {
            ExportService.exportToCSV(formattedData, exportFilename);
          }
          break;
          
        case 'excel':
          ExportService.exportToExcel(formattedData, exportFilename, dataType);
          break;
          
        case 'json':
          ExportService.exportToJSON(formattedData, exportFilename);
          break;
          
        default:
          throw new Error(`Unsupported export format: ${format}`);
      }

      // Success notification
      addNotification({
        type: 'success',
        title: 'Export Complete',
        message: `${data.length} records exported successfully to ${exportFilename}`,
        duration: 4000
      });

      if (onExportComplete) onExportComplete(format, data.length);

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
      description: 'Microsoft Excel format',
      icon: Table,
      color: 'text-blue-600'
    },
    {
      key: 'json',
      label: 'JSON',
      description: 'JavaScript Object Notation',
      icon: Database,
      color: 'text-purple-600'
    }
  ];

  return (
    <div className={`relative ${className}`}>
      {/* Export Button */}
      <button
        onClick={() => setShowFormatMenu(!showFormatMenu)}
        disabled={disabled || isExporting || data.length === 0}
        className={`
          inline-flex items-center gap-2 px-4 py-2 rounded-lg border transition-all duration-200
          ${disabled || data.length === 0
            ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
            : 'bg-white hover:bg-gray-50 text-gray-700 border-gray-300 hover:border-gray-400'
          }
          ${isExporting ? 'animate-pulse' : ''}
        `}
        title={data.length === 0 ? 'No data to export' : 'Export data'}
      >
        {isExporting ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Exporting...</span>
            {showProgress && (
              <span className="text-xs">({exportProgress}%)</span>
            )}
          </>
        ) : (
          <>
            <Download className="h-4 w-4" />
            <span>Export ({data.length})</span>
          </>
        )}
      </button>

      {/* Format Selection Menu */}
      {showFormatMenu && !isExporting && (
        <div className="absolute right-0 top-full mt-2 w-64 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50">
          <div className="p-3 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-sm font-medium text-gray-900 dark:text-white">Export Format</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Choose your preferred export format
            </p>
          </div>
          
          <div className="p-2">
            {exportFormats.map((format) => {
              const IconComponent = format.icon;
              return (
                <button
                  key={format.key}
                  onClick={() => handleExport(format.key)}
                  className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
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
                </button>
              );
            })}
          </div>
          
          <div className="p-3 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700">
            <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
              <Database className="h-3 w-3" />
              <span>{data.length} records ready for export</span>
            </div>
          </div>
        </div>
      )}

      {/* Progress Bar (if showProgress is enabled) */}
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

export default ExportButton;
