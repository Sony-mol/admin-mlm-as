import React from 'react';
import { CheckCircle, XCircle, AlertCircle } from 'lucide-react';

export default function ConfirmationDialog({ 
  isOpen, 
  onClose, 
  type = 'success', // 'success', 'error', 'warning'
  title, 
  message, 
  confirmText = 'OK',
  showCancel = false,
  onConfirm 
}) {
  if (!isOpen) return null;

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircle className="w-12 h-12 text-green-500" />;
      case 'error':
        return <XCircle className="w-12 h-12 text-red-500" />;
      case 'warning':
        return <AlertCircle className="w-12 h-12 text-yellow-500" />;
      default:
        return <CheckCircle className="w-12 h-12 text-blue-500" />;
    }
  };

  const getBgColor = () => {
    switch (type) {
      case 'success':
        return 'bg-green-50 border-green-200';
      case 'error':
        return 'bg-red-50 border-red-200';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200';
      default:
        return 'bg-blue-50 border-blue-200';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60]">
      <div className={`bg-white rounded-xl border-2 p-6 w-full max-w-md mx-4 ${getBgColor()}`}>
        <div className="flex flex-col items-center text-center space-y-4">
          {getIcon()}
          
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {title}
            </h3>
            <p className="text-sm text-gray-600">
              {message}
            </p>
          </div>

          <div className="flex items-center gap-3 w-full">
            {showCancel && (
              <button
                onClick={onClose}
                className="flex-1 px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
            )}
            <button
              onClick={onConfirm || onClose}
              className={`flex-1 px-4 py-2 rounded-lg text-white font-medium ${
                type === 'success' ? 'bg-green-600 hover:bg-green-700' :
                type === 'error' ? 'bg-red-600 hover:bg-red-700' :
                type === 'warning' ? 'bg-yellow-600 hover:bg-yellow-700' :
                'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
