import React, { useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, X, Trash2, Users } from 'lucide-react';
import './DeleteConfirmationModal.css';

/**
 * DeleteConfirmationModal - Confirmation dialog for deleting connections
 *
 * @param {Object} props
 * @param {Boolean} props.isOpen - Whether modal is open
 * @param {Function} props.onConfirm - Confirm deletion callback
 * @param {Function} props.onCancel - Cancel deletion callback
 * @param {Object} props.connection - Single connection to delete (for individual delete)
 * @param {Number} props.bulkCount - Number of connections for bulk delete
 */
const DeleteConfirmationModal = ({
  isOpen = false,
  onConfirm,
  onCancel,
  connection = null,
  bulkCount = 0
}) => {
  const isBulkDelete = bulkCount > 0;

  // Handle escape key
  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Escape') {
      onCancel();
    }
  }, [onCancel]);

  // Handle backdrop click
  const handleBackdropClick = useCallback((e) => {
    if (e.target === e.currentTarget) {
      onCancel();
    }
  }, [onCancel]);

  // Add/remove event listeners
  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, handleKeyDown]);

  // Focus management
  useEffect(() => {
    if (isOpen) {
      // Focus the confirm button after animation
      const timer = setTimeout(() => {
        const confirmBtn = document.querySelector('.DeleteConfirmationModal-confirm');
        if (confirmBtn) {
          confirmBtn.focus();
        }
      }, 300);

      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="DeleteConfirmationModal-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={handleBackdropClick}
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-modal-title"
          aria-describedby="delete-modal-description"
        >
          <motion.div
            className="DeleteConfirmationModal"
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{
              duration: 0.3,
              ease: [0.16, 1, 0.3, 1]
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="DeleteConfirmationModal-header">
              <div className="DeleteConfirmationModal-icon-container">
                <AlertTriangle size={24} className="DeleteConfirmationModal-warning-icon" />
              </div>
              <button
                className="DeleteConfirmationModal-close"
                onClick={onCancel}
                aria-label="Close dialog"
                title="Close"
              >
                <X size={20} />
              </button>
            </div>

            {/* Content */}
            <div className="DeleteConfirmationModal-content">
              <h2 id="delete-modal-title" className="DeleteConfirmationModal-title">
                {isBulkDelete
                  ? `Delete ${bulkCount} Connections?`
                  : `Delete Connection?`
                }
              </h2>

              <div id="delete-modal-description" className="DeleteConfirmationModal-description">
                {isBulkDelete ? (
                  <div className="DeleteConfirmationModal-bulk-info">
                    <div className="DeleteConfirmationModal-bulk-icon">
                      <Users size={20} />
                    </div>
                    <div>
                      <p>
                        You're about to delete <strong>{bulkCount} connections</strong>.
                      </p>
                      <p>
                        This will permanently remove all chat history and shared content with these users.
                      </p>
                    </div>
                  </div>
                ) : connection ? (
                  <div className="DeleteConfirmationModal-single-info">
                    <p>
                      You're about to delete your connection with <strong>{connection.name}</strong>.
                    </p>
                    <p>
                      This will permanently remove all chat history and shared content with this user.
                    </p>
                  </div>
                ) : (
                  <p>Are you sure you want to delete this connection?</p>
                )}

                <div className="DeleteConfirmationModal-warning">
                  <AlertTriangle size={16} />
                  <span>This action cannot be undone.</span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="DeleteConfirmationModal-actions">
              <button
                className="DeleteConfirmationModal-cancel"
                onClick={onCancel}
                type="button"
              >
                Cancel
              </button>
              <button
                className="DeleteConfirmationModal-confirm"
                onClick={onConfirm}
                type="button"
                autoFocus
              >
                <Trash2 size={16} />
                <span>
                  {isBulkDelete
                    ? `Delete ${bulkCount} Connections`
                    : 'Delete Connection'
                  }
                </span>
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};


export default React.memo(DeleteConfirmationModal);