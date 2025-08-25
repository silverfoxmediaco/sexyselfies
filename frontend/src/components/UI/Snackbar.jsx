import React, { useEffect } from 'react';

const Snackbar = ({ 
  open, 
  onClose, 
  message, 
  autoHideDuration = 6000,
  severity = 'info',
  children,
  className = '',
  ...props 
}) => {
  useEffect(() => {
    if (open && autoHideDuration && onClose) {
      const timer = setTimeout(onClose, autoHideDuration);
      return () => clearTimeout(timer);
    }
  }, [open, autoHideDuration, onClose]);

  if (!open) return null;

  return (
    <div className={`snackbar snackbar-${severity} ${className}`} {...props}>
      <div className="snackbar-content">
        {children || message}
      </div>
      {onClose && (
        <button className="snackbar-close" onClick={onClose}>
          ×
        </button>
      )}
    </div>
  );
};

const Alert = ({ severity = 'info', children, className = '', ...props }) => (
  <div className={`alert alert-${severity} ${className}`} {...props}>
    {children}
  </div>
);

export { Snackbar, Alert };
export default Snackbar;