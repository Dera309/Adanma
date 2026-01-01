import React, { useEffect, useState, memo } from 'react';
import { ToastMessage } from './ToastProvider';

interface ToastProps {
  toast: ToastMessage;
  onRemove: () => void;
}

const Toast: React.FC<ToastProps> = memo(({ toast, onRemove }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    // Trigger entrance animation
    const timer = setTimeout(() => setIsVisible(true), 10);
    return () => clearTimeout(timer);
  }, []);

  const handleClose = () => {
    setIsExiting(true);
    setTimeout(onRemove, 300); // Match CSS transition duration
  };

  const getIcon = () => {
    switch (toast.type) {
      case 'success':
        return '✓';
      case 'error':
        return '✗';
      case 'warning':
        return '⚠';
      case 'info':
        return 'ℹ';
      default:
        return 'ℹ';
    }
  };

  return (
    <div 
      className={`toast toast-${toast.type} ${isVisible ? 'toast-visible' : ''} ${isExiting ? 'toast-exiting' : ''}`}
      role="alert"
      aria-live={toast.type === 'error' ? 'assertive' : 'polite'}
      aria-atomic="true"
    >
      <div className="toast-icon" aria-hidden="true">
        {getIcon()}
      </div>
      
      <div className="toast-content">
        <div className="toast-title">{toast.title}</div>
        {toast.message && (
          <div className="toast-message">{toast.message}</div>
        )}
      </div>

      {toast.action && (
        <button 
          className="toast-action"
          onClick={toast.action.onClick}
          type="button"
        >
          {toast.action.label}
        </button>
      )}

      <button 
        className="toast-close"
        onClick={handleClose}
        aria-label={`Close ${toast.type} notification: ${toast.title}`}
        type="button"
      >
        ×
      </button>
    </div>
  );
});

Toast.displayName = 'Toast';

export default Toast;