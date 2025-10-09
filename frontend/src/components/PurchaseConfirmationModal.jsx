import React, { useState, useEffect } from 'react';
import { X, Lock, CreditCard, Zap, AlertCircle } from 'lucide-react';
import './PurchaseConfirmationModal.css';

const PurchaseConfirmationModal = ({
  isOpen,
  onClose,
  onConfirm,
  content,
  memberBalance = 0,
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('real_payment');
  const [error, setError] = useState(null);

  const price = content?.price || 0;
  const hasRealCredits = memberBalance >= price;

  if (!isOpen || !content) return null;

  const handleConfirm = async () => {
    setIsProcessing(true);
    setError(null);

    try {
      await onConfirm(paymentMethod);
      // Modal will be closed by parent on success
    } catch (err) {
      setError(err.message || 'Purchase failed. Please try again.');
      setIsProcessing(false);
    }
  };

  const handleClose = () => {
    if (!isProcessing) {
      setError(null);
      onClose();
    }
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      handleClose();
    }
  };

  return (
    <div
      className="purchase-confirmation-modal-overlay"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="purchase-modal-title"
    >
      <div className="purchase-confirmation-modal">
        {/* Header */}
        <div className="purchase-modal-header">
          <div className="purchase-modal-icon">
            <Lock size={24} />
          </div>
          <h2 id="purchase-modal-title">Unlock Content</h2>
          <button
            className="purchase-modal-close"
            onClick={handleClose}
            disabled={isProcessing}
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content Preview */}
        <div className="purchase-modal-content-preview">
          <div className="purchase-preview-image">
            {content.type === 'video' ? (
              <div className="purchase-preview-video-indicator">
                <Zap size={32} />
                <span>Video</span>
              </div>
            ) : (
              <img
                src={content.url}
                alt={content.title || 'Content'}
                className="purchase-preview-img-blurred"
              />
            )}
            <div className="purchase-preview-overlay">
              <Lock size={48} />
            </div>
          </div>

          {content.title && (
            <h3 className="purchase-content-title">{content.title}</h3>
          )}

          {content.creator && (
            <p className="purchase-creator-name">
              by {content.creator.displayName || content.creator.username}
            </p>
          )}
        </div>

        {/* Price Display */}
        <div className="purchase-modal-price">
          <span className="purchase-price-label">Price:</span>
          <span className="purchase-price-amount">${price.toFixed(2)}</span>
        </div>

        {/* Payment Method Selection */}
        <div className="purchase-payment-methods">
          <h4>Payment Method</h4>

          {/* Real Payment Option */}
          <label className="purchase-payment-option selected">
            <input
              type="radio"
              name="paymentMethod"
              value="real_payment"
              checked={true}
              disabled={isProcessing}
            />
            <div className="purchase-payment-option-content">
              <div className="purchase-payment-icon">
                <CreditCard size={20} />
              </div>
              <div className="purchase-payment-details">
                <span className="purchase-payment-name">Credit Card (CCBill)</span>
                <span className="purchase-payment-balance">
                  Secure payment processing
                </span>
              </div>
            </div>
          </label>
        </div>

        {/* Error Message */}
        {error && (
          <div className="purchase-modal-error">
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        {/* Action Buttons */}
        <div className="purchase-modal-actions">
          <button
            className="purchase-modal-cancel"
            onClick={handleClose}
            disabled={isProcessing}
          >
            Cancel
          </button>
          <button
            className="purchase-modal-confirm"
            onClick={handleConfirm}
            disabled={isProcessing}
          >
            {isProcessing ? (
              <>
                <span className="purchase-spinner"></span>
                Processing...
              </>
            ) : (
              <>
                <Lock size={18} />
                Unlock for ${price.toFixed(2)}
              </>
            )}
          </button>
        </div>

        {/* Payment Info */}
        <div className="purchase-modal-info">
          <p>
            You will be redirected to CCBill secure payment page.
          </p>
          <p className="purchase-modal-note">
            Once unlocked, this content will be saved in your Library.
          </p>
        </div>
      </div>
    </div>
  );
};

export default PurchaseConfirmationModal;
