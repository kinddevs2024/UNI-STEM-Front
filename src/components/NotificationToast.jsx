import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import './NotificationToast.css';

const NotificationToast = ({ message, type = 'info', duration = 3000, onClose, action }) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    if (duration === null) return;
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(() => {
        if (onClose) onClose();
      }, 300);
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const getIcon = () => {
    switch (type) {
      case 'success':
        return '✓';
      case 'error':
        return '✕';
      case 'warning':
        return '⚠';
      default:
        return 'ℹ';
    }
  };

  return (
    <div className={`notification-toast ${type} ${isVisible ? 'visible' : ''} ${action ? 'has-action' : ''}`} role={type === 'error' ? 'alert' : 'status'}>
      <div className="notification-icon">{getIcon()}</div>
      <div className="notification-message">{message}{action && <Link className="notification-action button-primary" to={action.to} state={action.state}>{action.label}</Link>}</div>
      <button 
        className="notification-close"
        aria-label="Dismiss notification"
        onClick={() => {
          setIsVisible(false);
          setTimeout(() => {
            if (onClose) onClose();
          }, 300);
        }}
      >
        ×
      </button>
    </div>
  );
};

export default NotificationToast;

