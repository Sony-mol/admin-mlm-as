// NotificationSystem.jsx - Real-time notification system
import React, { useState, useEffect, createContext, useContext } from 'react';
import { Bell, X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';

// Notification context
const NotificationContext = createContext();

// Custom hook to use notifications
export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within NotificationProvider');
  }
  return context;
};

// Notification types
const notificationTypes = {
  success: {
    icon: CheckCircle,
    color: 'text-green-600',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200'
  },
  error: {
    icon: AlertCircle,
    color: 'text-red-600',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200'
  },
  warning: {
    icon: AlertTriangle,
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-50',
    borderColor: 'border-yellow-200'
  },
  info: {
    icon: Info,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200'
  }
};

// Individual notification component
const NotificationItem = ({ notification, onDismiss }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    // Animate in
    const timer = setTimeout(() => setIsVisible(true), 10);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    // Auto dismiss after duration
    if (notification.duration && notification.duration > 0) {
      const timer = setTimeout(() => {
        handleDismiss();
      }, notification.duration);
      return () => clearTimeout(timer);
    }
  }, [notification.duration]);

  const handleDismiss = () => {
    setIsExiting(true);
    setTimeout(() => {
      onDismiss(notification.id);
    }, 300);
  };

  const config = notificationTypes[notification.type] || notificationTypes.info;
  const Icon = config.icon;

  return (
    <div
      className={`
        transform transition-all duration-300 ease-out
        ${isVisible && !isExiting ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'}
        ${config.bgColor} ${config.borderColor}
        border rounded-lg p-4 shadow-lg max-w-sm w-full
      `}
    >
      <div className="flex items-start gap-3">
        <Icon className={`h-5 w-5 mt-0.5 ${config.color}`} />
        
        <div className="flex-1 min-w-0">
          {notification.title && (
            <h4 className={`font-medium ${config.color} text-sm`}>
              {notification.title}
            </h4>
          )}
          <p className="text-sm text-gray-700 mt-1">
            {notification.message}
          </p>
          {notification.action && (
            <button
              onClick={notification.action.onClick}
              className="text-xs font-medium text-blue-600 hover:text-blue-800 mt-2"
            >
              {notification.action.label}
            </button>
          )}
        </div>
        
        <button
          onClick={handleDismiss}
          className="text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
      
      {/* Progress bar for auto-dismiss */}
      {notification.duration && notification.duration > 0 && (
        <div className="mt-3 h-1 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-current opacity-30 transition-all ease-linear"
            style={{
              width: '100%',
              animation: `shrink ${notification.duration}ms linear forwards`
            }}
          />
        </div>
      )}
    </div>
  );
};

// Notification bell component
const NotificationBell = () => {
  const { notifications, unreadCount, togglePanel } = useNotifications();
  const [isOpen, setIsOpen] = useState(false);

  const handleToggle = () => {
    setIsOpen(!isOpen);
    togglePanel();
  };

  return (
    <div className="relative">
      <button
        onClick={handleToggle}
        className="
          relative inline-flex items-center justify-center 
          h-9 w-9 
          rounded-lg 
          border border-[rgb(var(--border))] 
          hover:bg-[rgba(var(--fg),0.05)] 
          transition-all duration-200
          focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
        "
        title="Notifications"
      >
        <Bell className="h-4 w-4" />
        {unreadCount > 0 && (
          <span className="
            absolute -top-1 -right-1 
            h-5 w-5 
            bg-red-500 
            text-white 
            text-xs 
            font-bold 
            rounded-full 
            flex items-center justify-center
          ">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Notification panel */}
      {isOpen && (
        <div className="
          absolute right-0 top-12 
          w-80 
          bg-[rgb(var(--card))] 
          border border-[rgb(var(--border))] 
          rounded-lg 
          shadow-xl 
          z-50
          max-h-96 overflow-y-auto
        ">
          <div className="p-4 border-b border-[rgb(var(--border))]">
            <h3 className="font-semibold text-[rgb(var(--fg))]">Notifications</h3>
          </div>
          
          <div className="p-2">
            {notifications.length === 0 ? (
              <div className="text-center py-8 text-[rgba(var(--fg),0.5)]">
                <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No notifications</p>
              </div>
            ) : (
              notifications.slice(0, 10).map(notification => (
                <div key={notification.id} className="p-2 hover:bg-[rgba(var(--fg),0.05)] rounded">
                  <div className="flex items-start gap-2">
                    <div className={`h-2 w-2 rounded-full mt-2 ${notification.read ? 'bg-gray-300' : 'bg-blue-500'}`} />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-[rgb(var(--fg))]">
                        {notification.title}
                      </p>
                      <p className="text-xs text-[rgba(var(--fg),0.6)]">
                        {notification.message}
                      </p>
                      <p className="text-xs text-[rgba(var(--fg),0.4)] mt-1">
                        {new Date(notification.timestamp).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// Provider component
export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const [panelOpen, setPanelOpen] = useState(false);

  // Add notification
  const addNotification = (notification) => {
    const id = Date.now().toString();
    const newNotification = {
      id,
      timestamp: new Date().toISOString(),
      read: false,
      duration: 5000, // 5 seconds default
      ...notification
    };

    setNotifications(prev => [newNotification, ...prev.slice(0, 49)]); // Keep last 50

    // Auto-dismiss if duration is set
    if (newNotification.duration > 0) {
      setTimeout(() => {
        dismissNotification(id);
      }, newNotification.duration);
    }
  };

  // Dismiss notification
  const dismissNotification = (id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  // Mark as read
  const markAsRead = (id) => {
    setNotifications(prev =>
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    );
  };

  // Clear all notifications
  const clearAll = () => {
    setNotifications([]);
  };

  // Toggle panel
  const togglePanel = () => {
    setPanelOpen(prev => !prev);
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  const contextValue = {
    notifications,
    unreadCount,
    addNotification,
    dismissNotification,
    markAsRead,
    clearAll,
    togglePanel,
    panelOpen
  };

  return (
    <NotificationContext.Provider value={contextValue}>
      {children}
    </NotificationContext.Provider>
  );
};

// Toast container component
export const NotificationToast = () => {
  const { notifications, dismissNotification } = useNotifications();

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {notifications
        .filter(n => n.showAsToast !== false)
        .slice(0, 5)
        .map(notification => (
          <NotificationItem
            key={notification.id}
            notification={notification}
            onDismiss={dismissNotification}
          />
        ))}
    </div>
  );
};

// Export components
export { NotificationBell };

// Add CSS for progress bar animation
const style = document.createElement('style');
style.textContent = `
  @keyframes shrink {
    from { width: 100%; }
    to { width: 0%; }
  }
`;
document.head.appendChild(style);
