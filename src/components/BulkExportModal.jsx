// BulkExportModal.jsx - Advanced bulk export functionality
import React, { useState } from 'react';
import { X, Download, FileText, Table, Database, CheckCircle, AlertCircle, Loader2, Calendar, Filter } from 'lucide-react';
import ExportService, { FieldMappings } from '../services/ExportService';
import { useNotifications } from './NotificationSystem';

const BulkExportModal = ({ isOpen, onClose, dataSources = [] }) => {
  const [selectedSources, setSelectedSources] = useState(new Set());
  const [exportFormat, setExportFormat] = useState('csv');
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [currentExport, setCurrentExport] = useState('');
  const [exportResults, setExportResults] = useState([]);
  const { addNotification } = useNotifications();

  // Handle source selection
  const toggleSource = (sourceId) => {
    const newSelected = new Set(selectedSources);
    if (newSelected.has(sourceId)) {
      newSelected.delete(sourceId);
    } else {
      newSelected.add(sourceId);
    }
    setSelectedSources(newSelected);
  };

  // Handle bulk export
  const handleBulkExport = async () => {
    if (selectedSources.size === 0) {
      addNotification({
        type: 'error',
        title: 'No Sources Selected',
        message: 'Please select at least one data source to export',
        duration: 3000
      });
      return;
    }

    setIsExporting(true);
    setExportProgress(0);
    setExportResults([]);

    const totalSources = selectedSources.size;
    let completedSources = 0;
    const results = [];

    try {
      for (const sourceId of selectedSources) {
        const source = dataSources.find(s => s.id === sourceId);
        if (!source) continue;

        setCurrentExport(source.name);
        
        try {
          // Get data from source
          const data = await source.getData();
          
          if (!data || data.length === 0) {
            results.push({
              source: source.name,
              status: 'warning',
              message: 'No data available',
              count: 0
            });
            continue;
          }

          // Format data for export
          const fieldMapping = FieldMappings[source.dataType] || {};
          const formattedData = ExportService.formatDataForExport(data, fieldMapping);
          
          // Generate filename
          const filename = ExportService.generateFilename(
            `${source.name.toLowerCase().replace(/\s+/g, '_')}`,
            exportFormat
          );

          // Export data
          switch (exportFormat) {
            case 'csv':
              ExportService.exportToCSV(formattedData, filename);
              break;
            case 'excel':
              ExportService.exportToExcel(formattedData, filename, source.name);
              break;
            case 'json':
              ExportService.exportToJSON(formattedData, filename);
              break;
          }

          results.push({
            source: source.name,
            status: 'success',
            message: `Exported ${data.length} records`,
            count: data.length,
            filename
          });

        } catch (error) {
          console.error(`Export error for ${source.name}:`, error);
          results.push({
            source: source.name,
            status: 'error',
            message: error.message || 'Export failed',
            count: 0
          });
        }

        completedSources++;
        setExportProgress(Math.round((completedSources / totalSources) * 100));
        
        // Small delay to prevent UI blocking
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      setExportResults(results);

      // Show completion notification
      const successCount = results.filter(r => r.status === 'success').length;
      const totalRecords = results.reduce((sum, r) => sum + r.count, 0);

      addNotification({
        type: successCount === totalSources ? 'success' : 'warning',
        title: 'Bulk Export Complete',
        message: `Exported ${totalRecords} records from ${successCount}/${totalSources} sources`,
        duration: 5000
      });

    } catch (error) {
      console.error('Bulk export error:', error);
      addNotification({
        type: 'error',
        title: 'Bulk Export Failed',
        message: error.message || 'An error occurred during bulk export',
        duration: 5000
      });
    } finally {
      setIsExporting(false);
      setCurrentExport('');
    }
  };

  // Reset modal state
  const resetModal = () => {
    setSelectedSources(new Set());
    setExportFormat('csv');
    setExportProgress(0);
    setCurrentExport('');
    setExportResults([]);
  };

  // Handle modal close
  const handleClose = () => {
    if (!isExporting) {
      resetModal();
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
              <Download className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Bulk Export
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Export data from multiple sources at once
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            disabled={isExporting}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50"
          >
            <X className="h-5 w-5 text-gray-600 dark:text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          {!isExporting ? (
            <>
              {/* Data Sources Selection */}
              <div className="mb-6">
                <h4 className="text-md font-medium text-gray-900 dark:text-white mb-4">
                  Select Data Sources
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {dataSources.map((source) => (
                    <label
                      key={source.id}
                      className={`
                        flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all duration-200
                        ${selectedSources.has(source.id)
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                          : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                        }
                      `}
                    >
                      <input
                        type="checkbox"
                        checked={selectedSources.has(source.id)}
                        onChange={() => toggleSource(source.id)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <div className="flex-1">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {source.name}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {source.description}
                        </div>
                      </div>
                      <div className="text-xs text-gray-400 dark:text-gray-500">
                        {source.count} records
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Export Format Selection */}
              <div className="mb-6">
                <h4 className="text-md font-medium text-gray-900 dark:text-white mb-4">
                  Export Format
                </h4>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { key: 'csv', label: 'CSV', icon: FileText, color: 'text-green-600' },
                    { key: 'excel', label: 'Excel', icon: Table, color: 'text-blue-600' },
                    { key: 'json', label: 'JSON', icon: Database, color: 'text-purple-600' }
                  ].map((format) => {
                    const IconComponent = format.icon;
                    return (
                      <label
                        key={format.key}
                        className={`
                          flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all duration-200
                          ${exportFormat === format.key
                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                            : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                          }
                        `}
                      >
                        <input
                          type="radio"
                          name="exportFormat"
                          value={format.key}
                          checked={exportFormat === format.key}
                          onChange={(e) => setExportFormat(e.target.value)}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                        />
                        <IconComponent className={`h-5 w-5 ${format.color}`} />
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                          {format.label}
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>
            </>
          ) : (
            /* Export Progress */
            <div className="text-center py-8">
              <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
              <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                Exporting Data
              </h4>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                {currentExport && `Processing: ${currentExport}`}
              </p>
              
              {/* Progress Bar */}
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 mb-4">
                <div 
                  className="bg-blue-600 h-3 rounded-full transition-all duration-300"
                  style={{ width: `${exportProgress}%` }}
                />
              </div>
              
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {exportProgress}% complete
              </p>
            </div>
          )}

          {/* Export Results */}
          {exportResults.length > 0 && (
            <div className="mt-6">
              <h4 className="text-md font-medium text-gray-900 dark:text-white mb-4">
                Export Results
              </h4>
              <div className="space-y-2">
                {exportResults.map((result, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 dark:border-gray-700"
                  >
                    {result.status === 'success' ? (
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    ) : result.status === 'error' ? (
                      <AlertCircle className="h-5 w-5 text-red-600" />
                    ) : (
                      <AlertCircle className="h-5 w-5 text-yellow-600" />
                    )}
                    <div className="flex-1">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {result.source}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {result.message}
                      </div>
                    </div>
                    {result.count > 0 && (
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {result.count} records
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700">
          <button
            onClick={handleClose}
            disabled={isExporting}
            className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-500 transition-colors disabled:opacity-50"
          >
            {isExporting ? 'Exporting...' : 'Cancel'}
          </button>
          <button
            onClick={handleBulkExport}
            disabled={isExporting || selectedSources.size === 0}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isExporting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin inline mr-2" />
                Exporting...
              </>
            ) : (
              <>
                <Download className="h-4 w-4 inline mr-2" />
                Export Selected ({selectedSources.size})
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default BulkExportModal;
