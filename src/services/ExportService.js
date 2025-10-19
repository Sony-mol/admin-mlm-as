// ExportService.js - Comprehensive data export functionality
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

    // Use provided headers or extract from first object
    const excelHeaders = headers || Object.keys(data[0]);
    
    // Create worksheet
    const worksheet = XLSX.utils.json_to_sheet(data, { header: excelHeaders });
    
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
