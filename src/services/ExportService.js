// ExportService.js - Enhanced data export functionality with filtering support
import * as XLSX from 'xlsx';

class ExportService {
  // Export data to CSV format
  static exportToCSV(data, filename, headers = null) {
    if (!data || data.length === 0) {
      throw new Error('No data to export');
    }

    // Use provided headers or extract from first object
    const csvHeaders = headers || Object.keys(data[0]);
    
    // Create CSV content
    const csvContent = [
      csvHeaders.join(','),
      ...data.map(row => 
        csvHeaders.map(header => {
          const value = row[header];
          // Escape commas and quotes in CSV
          if (typeof value === 'string' && (value.includes(',') || value.includes('"') || value.includes('\n'))) {
            return `"${value.replace(/"/g, '""')}"`;
          }
          return value || '';
        }).join(',')
      )
    ].join('\n');

    // Create and download file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${filename}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
  }

  // Export data to Excel format
  static exportToExcel(data, filename, sheetName = 'Data', headers = null) {
    if (!data || data.length === 0) {
      throw new Error('No data to export');
    }

    // Use data as-is (no flattening needed since CSV works fine)
    const excelData = data;
    
    // Use provided headers or extract from first object
    const excelHeaders = headers || Object.keys(excelData[0]);
    
    // Create worksheet
    const worksheet = XLSX.utils.json_to_sheet(excelData, { header: excelHeaders });
    
    // Set column widths
    const columnWidths = excelHeaders.map(header => ({
      wch: Math.max(header.length, 15)
    }));
    worksheet['!cols'] = columnWidths;

    // Create workbook
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);


    // Generate and download file
    XLSX.writeFile(workbook, `${filename}.xlsx`);
  }

  // Flatten nested objects for Excel compatibility
  static flattenObject(obj, prefix = '') {
    const flattened = {};
    
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        const newKey = prefix ? `${prefix}.${key}` : key;
        
        if (obj[key] !== null && typeof obj[key] === 'object' && !Array.isArray(obj[key]) && !(obj[key] instanceof Date)) {
          // Recursively flatten nested objects
          Object.assign(flattened, this.flattenObject(obj[key], newKey));
        } else if (Array.isArray(obj[key])) {
          // Handle arrays by joining with commas
          flattened[newKey] = obj[key].join(', ');
        } else {
          // Handle primitive values, dates, and null
          flattened[newKey] = obj[key];
        }
      }
    }
    
    return flattened;
  }

  // Export data to JSON format
  static exportToJSON(data, filename) {
    if (!data || data.length === 0) {
      throw new Error('No data to export');
    }

    const jsonContent = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonContent], { type: 'application/json' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${filename}.json`;
    link.click();
    URL.revokeObjectURL(link.href);
  }

  // Format data for export with proper field mapping
  static formatDataForExport(data, fieldMapping = {}) {
    return data.map(item => {
      const formattedItem = {};
      
      Object.keys(fieldMapping).forEach(key => {
        const mapping = fieldMapping[key];
        let value = item[key];
        
        // Apply transformations
        if (mapping.transform) {
          value = mapping.transform(value, item);
        }
        
        // Use display name or original key
        const displayKey = mapping.displayName || key;
        formattedItem[displayKey] = value;
      });
      
      return formattedItem;
    });
  }

  // Get export progress (for large datasets)
  static async exportWithProgress(data, exportFunction, onProgress) {
    const total = data.length;
    let processed = 0;
    
    const chunks = this.chunkArray(data, 100); // Process in chunks of 100
    
    for (const chunk of chunks) {
      await exportFunction(chunk);
      processed += chunk.length;
      onProgress(Math.round((processed / total) * 100));
      
      // Small delay to prevent UI blocking
      await new Promise(resolve => setTimeout(resolve, 10));
    }
  }

  // Utility to chunk large arrays
  static chunkArray(array, chunkSize) {
    const chunks = [];
    for (let i = 0; i < array.length; i += chunkSize) {
      chunks.push(array.slice(i, i + chunkSize));
    }
    return chunks;
  }

  // Generate filename with timestamp
  static generateFilename(prefix, extension = 'csv') {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    return `${prefix}_${timestamp}.${extension}`;
  }

  // Validate export data
  static validateExportData(data) {
    if (!Array.isArray(data)) {
      throw new Error('Export data must be an array');
    }
    
    if (data.length === 0) {
      throw new Error('No data to export');
    }
    
    if (data.length > 100000) {
      console.warn('Large dataset detected. Consider using pagination or filtering.');
    }
    
    return true;
  }

  // Enhanced export with filtering and sorting
  static exportFilteredData(data, options = {}) {
    const {
      filters = {},
      sortBy = null,
      sortOrder = 'asc',
      limit = null,
      fields = null,
      customMapping = {}
    } = options;

    let filteredData = [...data];

    // Apply filters
    if (Object.keys(filters).length > 0) {
      filteredData = this.applyFilters(filteredData, filters);
    }

    // Apply sorting
    if (sortBy) {
      filteredData = this.applySorting(filteredData, sortBy, sortOrder);
    }

    // Apply field selection
    if (fields && Array.isArray(fields)) {
      filteredData = this.selectFields(filteredData, fields);
    }

    // Apply limit
    if (limit && limit > 0) {
      filteredData = filteredData.slice(0, limit);
    }

    // Apply custom field mapping
    if (Object.keys(customMapping).length > 0) {
      filteredData = this.applyCustomMapping(filteredData, customMapping);
    }

    return filteredData;
  }

  // Apply filters to data
  static applyFilters(data, filters) {
    return data.filter(item => {
      return Object.entries(filters).every(([key, filterValue]) => {
        if (!filterValue) return true; // Skip empty filters

        const itemValue = this.getNestedValue(item, key);

        // Handle different filter types
        if (typeof filterValue === 'object' && filterValue !== null) {
          // Range filter
          if (filterValue.min !== undefined || filterValue.max !== undefined) {
            const numValue = Number(itemValue);
            if (filterValue.min !== undefined && numValue < filterValue.min) return false;
            if (filterValue.max !== undefined && numValue > filterValue.max) return false;
            return true;
          }
          
          // Array filter (multiple values)
          if (Array.isArray(filterValue)) {
            return filterValue.includes(itemValue);
          }
        }

        // String filter (case-insensitive partial match)
        if (typeof filterValue === 'string') {
          return String(itemValue).toLowerCase().includes(filterValue.toLowerCase());
        }

        // Exact match
        return itemValue === filterValue;
      });
    });
  }

  // Apply sorting to data
  static applySorting(data, sortBy, sortOrder = 'asc') {
    return [...data].sort((a, b) => {
      const aValue = this.getNestedValue(a, sortBy);
      const bValue = this.getNestedValue(b, sortBy);

      // Handle null/undefined values
      if (aValue === null || aValue === undefined) return 1;
      if (bValue === null || bValue === undefined) return -1;

      // Handle different data types
      let comparison = 0;
      
      if (typeof aValue === 'number' && typeof bValue === 'number') {
        comparison = aValue - bValue;
      } else if (typeof aValue === 'string' && typeof bValue === 'string') {
        comparison = aValue.localeCompare(bValue);
      } else if (aValue instanceof Date && bValue instanceof Date) {
        comparison = aValue.getTime() - bValue.getTime();
      } else {
        comparison = String(aValue).localeCompare(String(bValue));
      }

      return sortOrder === 'desc' ? -comparison : comparison;
    });
  }

  // Select specific fields from data
  static selectFields(data, fields) {
    return data.map(item => {
      const selectedItem = {};
      fields.forEach(field => {
        selectedItem[field] = this.getNestedValue(item, field);
      });
      return selectedItem;
    });
  }

  // Apply custom field mapping
  static applyCustomMapping(data, customMapping) {
    return data.map(item => {
      const mappedItem = {};
      Object.entries(customMapping).forEach(([originalField, mapping]) => {
        const value = this.getNestedValue(item, originalField);
        const transformedValue = mapping.transform ? mapping.transform(value, item) : value;
        mappedItem[mapping.displayName || originalField] = transformedValue;
      });
      return mappedItem;
    });
  }

  // Get nested object value using dot notation
  static getNestedValue(obj, path) {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }

  // Generate export summary
  static generateExportSummary(data, filters = {}, options = {}) {
    const totalRecords = data.length;
    const filteredRecords = this.exportFilteredData(data, { filters }).length;
    
    return {
      totalRecords,
      filteredRecords,
      filtersApplied: Object.keys(filters).filter(key => filters[key]).length,
      exportOptions: {
        format: options.format || 'csv',
        fields: options.fields?.length || 'all',
        sorted: options.sortBy ? `${options.sortBy} (${options.sortOrder})` : 'none',
        limited: options.limit ? `first ${options.limit}` : 'all'
      },
      timestamp: new Date().toISOString(),
      generatedBy: 'MLM Admin Dashboard'
    };
  }

  // Export with metadata and summary
  static exportWithMetadata(data, format, filename, options = {}) {
    const { includeSummary = true, includeMetadata = true } = options;
    
    const exportData = this.exportFilteredData(data, options);
    
    if (includeSummary || includeMetadata) {
      const summary = this.generateExportSummary(data, options.filters || {}, options);
      
      if (format === 'excel') {
        return this.exportToExcelWithMetadata(exportData, filename, summary, options);
      } else if (format === 'json') {
        return this.exportToJSONWithMetadata(exportData, filename, summary, options);
      }
    }
    
    // Regular export without metadata
    switch (format) {
      case 'csv':
        return this.exportToCSV(exportData, filename);
      case 'excel':
        return this.exportToExcel(exportData, filename);
      case 'json':
        return this.exportToJSON(exportData, filename);
      default:
        throw new Error(`Unsupported export format: ${format}`);
    }
  }

  // Export to Excel with metadata sheet
  static exportToExcelWithMetadata(data, filename, summary, options = {}) {
    const workbook = XLSX.utils.book_new();
    
    // Use data as-is (no flattening needed since CSV works fine)
    const excelData = data;
    
    // Main data sheet
    const worksheet = XLSX.utils.json_to_sheet(excelData);
    
    // Set column widths for data sheet
    if (excelData.length > 0) {
      const headers = Object.keys(excelData[0]);
      const columnWidths = headers.map(header => ({
        wch: Math.max(header.length, 15)
      }));
      worksheet['!cols'] = columnWidths;
    }
    
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Data');
    
    // Summary sheet
    const summaryData = [
      ['Export Summary', ''],
      ['Total Records', summary.totalRecords],
      ['Filtered Records', summary.filteredRecords],
      ['Filters Applied', summary.filtersApplied],
      ['Export Format', summary.exportOptions.format],
      ['Fields Exported', summary.exportOptions.fields],
      ['Sorting', summary.exportOptions.sorted],
      ['Limit', summary.exportOptions.limited],
      ['Generated At', new Date(summary.timestamp).toLocaleString()],
      ['Generated By', summary.generatedBy]
    ];
    
    const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(workbook, summarySheet, 'Export Summary');
    
    // Filters sheet (if any filters applied)
    if (summary.filtersApplied > 0) {
      const filterData = Object.entries(options.filters || {})
        .filter(([key, value]) => value)
        .map(([key, value]) => [key, typeof value === 'object' ? JSON.stringify(value) : value]);
      
      filterData.unshift(['Filter Field', 'Filter Value']);
      const filterSheet = XLSX.utils.aoa_to_sheet(filterData);
      XLSX.utils.book_append_sheet(workbook, filterSheet, 'Applied Filters');
    }
    
    XLSX.writeFile(workbook, `${filename}.xlsx`);
  }

  // Export to JSON with metadata
  static exportToJSONWithMetadata(data, filename, summary, options = {}) {
    const exportPackage = {
      metadata: {
        summary,
        exportedAt: new Date().toISOString(),
        version: '1.0',
        source: 'MLM Admin Dashboard'
      },
      filters: options.filters || {},
      data
    };
    
    const jsonContent = JSON.stringify(exportPackage, null, 2);
    const blob = new Blob([jsonContent], { type: 'application/json' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${filename}.json`;
    link.click();
    URL.revokeObjectURL(link.href);
  }
}

// Predefined field mappings for different data types
export const FieldMappings = {
  users: {
    id: { displayName: 'User ID' },
    name: { displayName: 'Full Name' },
    email: { displayName: 'Email Address' },
    phone: { displayName: 'Phone Number' },
    tier: { displayName: 'Tier', transform: (value) => value?.name || value },
    level: { displayName: 'Level', transform: (value) => value?.levelNumber || value },
    status: { displayName: 'Status' },
    totalEarnings: { displayName: 'Total Earnings', transform: (value) => `₹${value || 0}` },
    referralCount: { displayName: 'Referral Count' },
    createdAt: { displayName: 'Join Date', transform: (value) => value ? new Date(value).toLocaleDateString() : '' },
    lastLogin: { displayName: 'Last Login', transform: (value) => value ? new Date(value).toLocaleDateString() : 'Never' }
  },
  
  orders: {
    id: { displayName: 'Order ID' },
    orderNumber: { displayName: 'Order Number' },
    userName: { displayName: 'Customer Name' },
    userEmail: { displayName: 'Customer Email' },
    totalAmount: { displayName: 'Total Amount', transform: (value) => `₹${value || 0}` },
    status: { displayName: 'Status' },
    paymentMethod: { displayName: 'Payment Method' },
    createdAt: { displayName: 'Order Date', transform: (value) => value ? new Date(value).toLocaleDateString() : '' },
    deliveryDate: { displayName: 'Delivery Date', transform: (value) => value ? new Date(value).toLocaleDateString() : 'Not delivered' }
  },
  
  payments: {
    id: { displayName: 'Payment ID' },
    amount: { displayName: 'Amount', transform: (value) => `₹${value || 0}` },
    status: { displayName: 'Status' },
    paymentMethod: { displayName: 'Payment Method' },
    transactionId: { displayName: 'Transaction ID' },
    userName: { displayName: 'User Name' },
    userEmail: { displayName: 'User Email' },
    createdAt: { displayName: 'Payment Date', transform: (value) => value ? new Date(value).toLocaleDateString() : '' }
  },
  
  commissions: {
    id: { displayName: 'Commission ID' },
    amount: { displayName: 'Amount', transform: (value) => `₹${value || 0}` },
    status: { displayName: 'Status' },
    commissionType: { displayName: 'Type' },
    userName: { displayName: 'User Name' },
    userEmail: { displayName: 'User Email' },
    level: { displayName: 'Level' },
    createdAt: { displayName: 'Commission Date', transform: (value) => value ? new Date(value).toLocaleDateString() : '' }
  },
  
  withdrawals: {
    id: { displayName: 'Withdrawal ID' },
    amount: { displayName: 'Amount', transform: (value) => `₹${value || 0}` },
    status: { displayName: 'Status' },
    bankAccount: { displayName: 'Bank Account' },
    userName: { displayName: 'User Name' },
    userEmail: { displayName: 'User Email' },
    requestedAt: { displayName: 'Request Date', transform: (value) => value ? new Date(value).toLocaleDateString() : '' },
    processedAt: { displayName: 'Processed Date', transform: (value) => value ? new Date(value).toLocaleDateString() : 'Not processed' }
  },
  
  products: {
    id: { displayName: 'Product ID' },
    name: { displayName: 'Product Name' },
    price: { displayName: 'Price', transform: (value) => `₹${value || 0}` },
    stock: { displayName: 'Stock Quantity' },
    category: { displayName: 'Category' },
    status: { displayName: 'Status' },
    createdAt: { displayName: 'Created Date', transform: (value) => value ? new Date(value).toLocaleDateString() : '' }
  }
};

export default ExportService;
