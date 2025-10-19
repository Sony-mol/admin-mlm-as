// ResponsiveModal.jsx - A responsive modal component for the admin panel
import React, { useEffect } from 'react';
import { X } from 'lucide-react';

export default function ResponsiveModal({
  isOpen = false,
  onClose,
  title,
  children,
  size = 'medium',
  className = '',
  showCloseButton = true,
  closeOnOverlayClick = true,
  closeOnEscape = true,
  ...props
}) {
  // Handle escape key
  useEffect(() => {
    if (!closeOnEscape || !isOpen) return;

    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose, closeOnEscape]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const sizeClasses = {
    small: 'max-w-md',
    medium: 'max-w-lg',
    large: 'max-w-2xl',
    xlarge: 'max-w-4xl',
    full: 'max-w-full mx-4',
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm transition-opacity"
        onClick={closeOnOverlayClick ? onClose : undefined}
        aria-hidden="true"
      />

      {/* Modal Container */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div
          className={`
            relative w-full ${sizeClasses[size]}
            bg-[rgb(var(--card))] 
            rounded-lg 
            shadow-xl 
            border border-[rgb(var(--border))]
            transform transition-all duration-300
            ${className}
          `}
          {...props}
        >
          {/* Header */}
          {title && (
            <div className="flex items-center justify-between p-6 border-b border-[rgb(var(--border))]">
              <h3 className="text-lg font-semibold text-[rgb(var(--fg))]">
                {title}
              </h3>
              {showCloseButton && (
                <button
                  onClick={onClose}
                  className="
                    p-2 
                    rounded-lg 
                    hover:bg-[rgba(var(--fg),0.05)] 
                    transition-colors duration-200
                    focus:outline-none focus:ring-2 focus:ring-blue-500
                  "
                  aria-label="Close modal"
                >
                  <X size={20} className="text-[rgba(var(--fg),0.6)]" />
                </button>
              )}
            </div>
          )}

          {/* Content */}
          <div className="p-6">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}

// Confirmation Modal
export function ConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title = "Confirm Action",
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  type = "warning", // warning, danger, info, success
  loading = false,
}) {
  const typeClasses = {
    warning: {
      icon: "⚠️",
      confirmButton: "bg-yellow-600 hover:bg-yellow-700 text-white",
    },
    danger: {
      icon: "🚨",
      confirmButton: "bg-red-600 hover:bg-red-700 text-white",
    },
    info: {
      icon: "ℹ️",
      confirmButton: "bg-blue-600 hover:bg-blue-700 text-white",
    },
    success: {
      icon: "✅",
      confirmButton: "bg-green-600 hover:bg-green-700 text-white",
    },
  };

  const handleConfirm = () => {
    onConfirm();
  };

  return (
    <ResponsiveModal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      size="small"
      closeOnOverlayClick={!loading}
      closeOnEscape={!loading}
    >
      <div className="text-center space-y-4">
        <div className="text-4xl">{typeClasses[type].icon}</div>
        <p className="text-[rgba(var(--fg),0.8)] leading-relaxed">
          {message}
        </p>
        <div className="flex flex-col sm:flex-row gap-3 pt-4">
          <button
            onClick={onClose}
            disabled={loading}
            className="
              flex-1 px-4 py-2
              border border-[rgb(var(--border))] 
              rounded-lg
              bg-[rgb(var(--bg))] 
              text-[rgb(var(--fg))] 
              hover:bg-[rgba(var(--fg),0.05)]
              transition-colors duration-200
              disabled:opacity-50
            "
          >
            {cancelText}
          </button>
          <button
            onClick={handleConfirm}
            disabled={loading}
            className={`
              flex-1 px-4 py-2
              rounded-lg
              font-medium
              transition-colors duration-200
              disabled:opacity-50
              flex items-center justify-center gap-2
              ${typeClasses[type].confirmButton}
            `}
          >
            {loading && (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
            )}
            {confirmText}
          </button>
        </div>
      </div>
    </ResponsiveModal>
  );
}

// Form Modal
export function FormModal({
  isOpen,
  onClose,
  onSubmit,
  title,
  children,
  submitText = "Save",
  cancelText = "Cancel",
  loading = false,
  size = "medium",
}) {
  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(e);
  };

  return (
    <ResponsiveModal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      size={size}
      closeOnOverlayClick={!loading}
      closeOnEscape={!loading}
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {children}
        
        {/* Form Actions */}
        <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-[rgb(var(--border))]">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="
              flex-1 px-4 py-2
              border border-[rgb(var(--border))] 
              rounded-lg
              bg-[rgb(var(--bg))] 
              text-[rgb(var(--fg))] 
              hover:bg-[rgba(var(--fg),0.05)]
              transition-colors duration-200
              disabled:opacity-50
            "
          >
            {cancelText}
          </button>
          <button
            type="submit"
            disabled={loading}
            className="
              flex-1 px-4 py-2
              bg-blue-600 hover:bg-blue-700 
              text-white rounded-lg 
              font-medium
              transition-colors duration-200
              disabled:opacity-50
              flex items-center justify-center gap-2
            "
          >
            {loading && (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
            )}
            {submitText}
          </button>
        </div>
      </form>
    </ResponsiveModal>
  );
}
