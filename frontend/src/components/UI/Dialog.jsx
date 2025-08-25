import React from 'react';

const Dialog = ({ open, onClose, children, className = '', ...props }) => {
  if (!open) return null;

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget && onClose) {
      onClose();
    }
  };

  return (
    <div className={`dialog-backdrop ${className}`} onClick={handleBackdropClick} {...props}>
      <div className="dialog-container">
        {children}
      </div>
    </div>
  );
};

const DialogTitle = ({ children, className = '', ...props }) => (
  <div className={`dialog-title ${className}`} {...props}>
    {children}
  </div>
);

const DialogContent = ({ children, className = '', ...props }) => (
  <div className={`dialog-content ${className}`} {...props}>
    {children}
  </div>
);

const DialogActions = ({ children, className = '', ...props }) => (
  <div className={`dialog-actions ${className}`} {...props}>
    {children}
  </div>
);

export { Dialog, DialogTitle, DialogContent, DialogActions };
export default Dialog;