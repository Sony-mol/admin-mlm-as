// TableActions.jsx - Reusable table action components
import React from 'react';
import { Eye, Edit, Trash2, Download, MoreHorizontal, User, Mail, Phone, IndianRupee, UserCheck, UserX, CheckCircle, XCircle } from 'lucide-react';

// Standard action buttons for tables
export const ActionButton = ({ 
  icon: Icon, 
  label, 
  onClick, 
  variant = 'default',
  size = 'sm',
  disabled = false,
  className = ''
}) => {
  const variants = {
    default: 'text-gray-600 hover:text-gray-800 hover:bg-gray-100',
    primary: 'text-blue-600 hover:text-blue-800 hover:bg-blue-50',
    success: 'text-green-600 hover:text-green-800 hover:bg-green-50',
    danger: 'text-red-600 hover:text-red-800 hover:bg-red-50',
    warning: 'text-yellow-600 hover:text-yellow-800 hover:bg-yellow-50'
  };

  const sizes = {
    xs: 'p-1',
    sm: 'p-2',
    md: 'p-3'
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`
        inline-flex items-center justify-center rounded-lg transition-all duration-200
        focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1
        disabled:opacity-50 disabled:cursor-not-allowed
        hover:scale-105 active:scale-95
        ${variants[variant]}
        ${sizes[size]}
        ${className}
      `}
      title={label}
    >
      <Icon className="h-4 w-4" />
      <span className="sr-only">{label}</span>
    </button>
  );
};

// Common action combinations
export const ViewAction = ({ onClick, disabled = false }) => (
  <ActionButton
    icon={Eye}
    label="View Details"
    onClick={onClick}
    variant="primary"
    disabled={disabled}
  />
);

export const EditAction = ({ onClick, disabled = false }) => (
  <ActionButton
    icon={Edit}
    label="Edit"
    onClick={onClick}
    variant="default"
    disabled={disabled}
  />
);

export const DeleteAction = ({ onClick, disabled = false }) => (
  <ActionButton
    icon={Trash2}
    label="Delete"
    onClick={onClick}
    variant="danger"
    disabled={disabled}
  />
);

export const DownloadAction = ({ onClick, disabled = false }) => (
  <ActionButton
    icon={Download}
    label="Download"
    onClick={onClick}
    variant="default"
    disabled={disabled}
  />
);

export const ActivateAction = ({ onClick, disabled = false }) => (
  <ActionButton
    icon={UserCheck}
    label="Activate User"
    onClick={onClick}
    variant="success"
    disabled={disabled}
  />
);

export const SuspendAction = ({ onClick, disabled = false }) => (
  <ActionButton
    icon={UserX}
    label="Suspend User"
    onClick={onClick}
    variant="warning"
    disabled={disabled}
  />
);

// Action dropdown menu
export const ActionDropdown = ({ actions = [], trigger }) => {
  const [isOpen, setIsOpen] = React.useState(false);

  React.useEffect(() => {
    const handleClickOutside = (event) => {
      if (isOpen && !event.target.closest('.action-dropdown')) {
        setIsOpen(false);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [isOpen]);

  return (
    <div className="relative action-dropdown">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors duration-200"
        aria-label="More actions"
      >
        {trigger || <MoreHorizontal className="h-4 w-4" />}
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-1 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50">
          <div className="py-1">
            {actions.map((action, index) => (
              <button
                key={index}
                onClick={() => {
                  action.onClick();
                  setIsOpen(false);
                }}
                disabled={action.disabled}
                className={`
                  w-full text-left px-4 py-2 text-sm transition-colors duration-200
                  ${action.variant === 'danger' 
                    ? 'text-red-600 hover:bg-red-50' 
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }
                  disabled:opacity-50 disabled:cursor-not-allowed
                `}
              >
                <div className="flex items-center gap-3">
                  {action.icon && <action.icon className="h-4 w-4" />}
                  <span>{action.label}</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// User-specific actions - Only View and Suspend/Activate
export const UserActions = ({ user, onView, onSuspend, onActivate }) => {
  const isActive = user.status === 'ACTIVE';
  
  return (
    <div className="flex items-center gap-1">
      {onView && <ViewAction onClick={() => onView(user)} />}
      {isActive && onSuspend && <SuspendAction onClick={() => onSuspend(user)} />}
      {!isActive && onActivate && <ActivateAction onClick={() => onActivate(user)} />}
    </div>
  );
};

// Order-specific actions
export const OrderActions = ({ order, onView, onEdit, onCancel, onRefund }) => (
  <div className="flex items-center gap-1">
    {onView && <ViewAction onClick={() => onView(order)} />}
    {onEdit && <EditAction onClick={() => onEdit(order)} />}
    <ActionDropdown
      actions={[
        ...(onCancel ? [{
          icon: Trash2,
          label: 'Cancel Order',
          onClick: () => onCancel(order),
          variant: 'danger'
        }] : []),
        ...(onRefund ? [{
          icon: IndianRupee,
          label: 'Process Refund',
          onClick: () => onRefund(order)
        }] : [])
      ]}
    />
  </div>
);

// Payment-specific actions
export const PaymentActions = ({ payment, onView, onApprove, onReject, onRefund }) => (
  <div className="flex items-center gap-1">
    {onView && <ViewAction onClick={() => onView(payment)} />}
    <ActionDropdown
      actions={[
        ...(onApprove ? [{
          icon: Eye,
          label: 'Approve Payment',
          onClick: () => onApprove(payment)
        }] : []),
        ...(onReject ? [{
          icon: Trash2,
          label: 'Reject Payment',
          onClick: () => onReject(payment),
          variant: 'danger'
        }] : []),
        ...(onRefund ? [{
          icon: IndianRupee,
          label: 'Process Refund',
          onClick: () => onRefund(payment)
        }] : [])
      ]}
    />
  </div>
);

// Commission-specific actions
export const CommissionActions = ({ commission, onView, onApprove, onReject }) => {
  // Don't show action buttons for paid or cancelled commissions
  const isCompleted = commission.commissionStatus === 'PAID' || commission.commissionStatus === 'CANCELLED';
  
  return (
    <div className="flex items-center gap-2">
      {onView && <ViewAction onClick={() => onView(commission)} />}
      {!isCompleted && (
        <div className="flex items-center gap-1">
          {onApprove && (
            <button
              onClick={() => onApprove(commission)}
              className="flex items-center gap-1 px-2 py-1 text-xs bg-green-100 text-green-700 rounded-md hover:bg-green-200 transition-colors"
              title="Approve & Pay Commission"
            >
              <CheckCircle className="h-3 w-3" />
              Approve
            </button>
          )}
          {onReject && (
            <button
              onClick={() => onReject(commission)}
              className="flex items-center gap-1 px-2 py-1 text-xs bg-red-100 text-red-700 rounded-md hover:bg-red-200 transition-colors"
              title="Reject Commission"
            >
              <XCircle className="h-3 w-3" />
              Reject
            </button>
          )}
        </div>
      )}
      {isCompleted && (
        <div className="flex items-center gap-1">
          <span className={`px-2 py-1 text-xs rounded-md ${
            commission.commissionStatus === 'PAID' 
              ? 'bg-green-100 text-green-700' 
              : 'bg-red-100 text-red-700'
          }`}>
            {commission.commissionStatus === 'PAID' ? '✅ Paid' : '❌ Cancelled'}
          </span>
        </div>
      )}
    </div>
  );
};

// Withdrawal-specific actions
export const WithdrawalActions = ({ withdrawal, onView, onApprove, onReject }) => {
  // Don't show action buttons for completed or rejected withdrawals
  const isCompleted = withdrawal.status === 'COMPLETED' || withdrawal.status === 'REJECTED';
  
  return (
    <div className="flex items-center gap-2">
      {onView && <ViewAction onClick={() => onView(withdrawal)} />}
      {!isCompleted && (
        <div className="flex items-center gap-1">
          {onApprove && (
            <button
              onClick={() => onApprove(withdrawal)}
              className="flex items-center gap-1 px-2 py-1 text-xs bg-green-100 text-green-700 rounded-md hover:bg-green-200 transition-colors"
              title="Approve Withdrawal"
            >
              <CheckCircle className="h-3 w-3" />
              Approve
            </button>
          )}
          {onReject && (
            <button
              onClick={() => onReject(withdrawal)}
              className="flex items-center gap-1 px-2 py-1 text-xs bg-red-100 text-red-700 rounded-md hover:bg-red-200 transition-colors"
              title="Reject Withdrawal"
            >
              <XCircle className="h-3 w-3" />
              Reject
            </button>
          )}
        </div>
      )}
      {isCompleted && (
        <div className="flex items-center gap-1">
          <span className={`px-2 py-1 text-xs rounded-md ${
            withdrawal.status === 'COMPLETED' 
              ? 'bg-green-100 text-green-700' 
              : 'bg-red-100 text-red-700'
          }`}>
            {withdrawal.status === 'COMPLETED' ? '✅ Completed' : '❌ Rejected'}
          </span>
        </div>
      )}
    </div>
  );
};

// Product-specific actions
export const ProductActions = ({ product, onView, onEdit, onDelete, onDuplicate }) => (
  <div className="flex items-center gap-1">
    {onView && <ViewAction onClick={() => onView(product)} />}
    {onEdit && <EditAction onClick={() => onEdit(product)} />}
    <ActionDropdown
      actions={[
        ...(onDuplicate ? [{
          icon: User,
          label: 'Duplicate Product',
          onClick: () => onDuplicate(product)
        }] : []),
        ...(onDelete ? [{
          icon: Trash2,
          label: 'Delete Product',
          onClick: () => onDelete(product),
          variant: 'danger'
        }] : [])
      ]}
    />
  </div>
);

export const ActivityLogActions = ({ log, onView, onExport }) => (
  <div className="flex items-center gap-1">
    <ActionButton icon={Eye} label="View Details" onClick={() => onView(log)} variant="primary" />
    <ActionButton icon={Download} label="Export Log" onClick={() => onExport(log)} variant="default" />
  </div>
);

export const RewardActions = ({ reward, onView, onClaim }) => (
  <div className="flex items-center gap-1">
    <ActionButton icon={Eye} label="View Details" onClick={() => onView(reward)} variant="primary" />
    {reward.status !== 'claimed' && (
      <ActionButton icon={UserCheck} label="Claim Reward" onClick={() => onClaim(reward)} variant="success" />
    )}
  </div>
);

export default {
  ActionButton,
  ViewAction,
  EditAction,
  DeleteAction,
  DownloadAction,
  ActivateAction,
  SuspendAction,
  ActionDropdown,
  UserActions,
  OrderActions,
  PaymentActions,
  CommissionActions,
  WithdrawalActions,
  ProductActions,
  ActivityLogActions,
  RewardActions
};
