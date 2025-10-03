import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  DollarSign,
  CreditCard,
  Mail,
  AlertCircle,
  CheckCircle,
  Clock,
  Wallet,
  Info,
  ArrowRight,
  Shield,
  Calendar
} from 'lucide-react';
import paymentService from '../../services/payment.service';
import './PayoutRequestModal.css';

const PayoutRequestModal = ({ onClose, onSubmit, availableAmount = 0, minimumPayout = 50 }) => {
  const [formData, setFormData] = useState({
    requestedAmount: '',
    paypalEmail: '',
    message: ''
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [step, setStep] = useState('form'); // 'form', 'confirm', 'submitted'
  const [payoutSettings, setPayoutSettings] = useState(null);

  useEffect(() => {
    fetchPayoutSettings();
  }, []);

  const fetchPayoutSettings = async () => {
    try {
      setLoading(true);
      const response = await paymentService.getPayoutSettings();
      if (response.data?.settings) {
        setPayoutSettings(response.data.settings);
        if (response.data.settings.paypalEmail) {
          setFormData(prev => ({
            ...prev,
            paypalEmail: response.data.settings.paypalEmail
          }));
        }
      }
    } catch (error) {
      console.error('Error fetching payout settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const validateForm = () => {
    const newErrors = {};

    // Amount validation
    const amount = parseFloat(formData.requestedAmount);
    if (!formData.requestedAmount) {
      newErrors.requestedAmount = 'Amount is required';
    } else if (isNaN(amount) || amount <= 0) {
      newErrors.requestedAmount = 'Please enter a valid amount';
    } else if (amount < minimumPayout) {
      newErrors.requestedAmount = `Minimum payout is $${minimumPayout}`;
    } else if (amount > availableAmount) {
      newErrors.requestedAmount = `Amount cannot exceed available balance of $${availableAmount.toFixed(2)}`;
    }

    // Email validation
    if (!formData.paypalEmail) {
      newErrors.paypalEmail = 'PayPal email is required';
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.paypalEmail)) {
        newErrors.paypalEmail = 'Please enter a valid email address';
      }
    }

    // Message validation (optional but with length limit)
    if (formData.message && formData.message.length > 500) {
      newErrors.message = 'Message cannot exceed 500 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    // Clear error for this field when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  const handleContinue = () => {
    if (validateForm()) {
      setStep('confirm');
    }
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      setSubmitting(true);
      const requestData = {
        requestedAmount: parseFloat(formData.requestedAmount),
        paypalEmail: formData.paypalEmail.trim(),
        message: formData.message.trim()
      };

      await onSubmit(requestData);
      setStep('submitted');
    } catch (error) {
      console.error('Payout request error:', error);
      setErrors({
        submit: error.response?.data?.message || 'Failed to submit payout request. Please try again.'
      });
    } finally {
      setSubmitting(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const calculateProcessingFee = () => {
    const amount = parseFloat(formData.requestedAmount) || 0;
    const feePercentage = 0.029; // 2.9% typical PayPal fee
    const fixedFee = 0.30;
    return Math.max(amount * feePercentage + fixedFee, 0);
  };

  const getNetAmount = () => {
    const amount = parseFloat(formData.requestedAmount) || 0;
    const fee = calculateProcessingFee();
    return Math.max(amount - fee, 0);
  };

  return (
    <AnimatePresence>
      <motion.div
        className="PayoutRequestModal-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div
          className="PayoutRequestModal"
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="PayoutRequestModal-header">
            <div className="PayoutRequestModal-title">
              <Wallet size={24} />
              <h2>Request Payout</h2>
            </div>
            <button
              className="PayoutRequestModal-close-btn"
              onClick={onClose}
              disabled={submitting}
            >
              <X size={20} />
            </button>
          </div>

          {step === 'form' && (
            <motion.div
              className="PayoutRequestModal-content"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
            >
              {/* Available Balance */}
              <div className="PayoutRequestModal-balance-card">
                <div className="PayoutRequestModal-balance-header">
                  <DollarSign size={20} />
                  <span>Available Balance</span>
                </div>
                <div className="PayoutRequestModal-balance-amount">
                  {formatCurrency(availableAmount)}
                </div>
                <div className="PayoutRequestModal-balance-note">
                  Minimum payout: {formatCurrency(minimumPayout)}
                </div>
              </div>

              {/* Form */}
              <div className="PayoutRequestModal-form">
                <div className="PayoutRequestModal-form-group">
                  <label className="PayoutRequestModal-label">
                    <DollarSign size={16} />
                    Request Amount
                  </label>
                  <div className="PayoutRequestModal-input-wrapper">
                    <span className="PayoutRequestModal-input-prefix">$</span>
                    <input
                      type="number"
                      className={`PayoutRequestModal-input ${errors.requestedAmount ? 'error' : ''}`}
                      placeholder="0.00"
                      min={minimumPayout}
                      max={availableAmount}
                      step="0.01"
                      value={formData.requestedAmount}
                      onChange={(e) => handleInputChange('requestedAmount', e.target.value)}
                    />
                    <button
                      type="button"
                      className="PayoutRequestModal-max-btn"
                      onClick={() => handleInputChange('requestedAmount', availableAmount.toFixed(2))}
                    >
                      Max
                    </button>
                  </div>
                  {errors.requestedAmount && (
                    <span className="PayoutRequestModal-error">{errors.requestedAmount}</span>
                  )}
                </div>

                <div className="PayoutRequestModal-form-group">
                  <label className="PayoutRequestModal-label">
                    <Mail size={16} />
                    PayPal Email Address
                  </label>
                  <input
                    type="email"
                    className={`PayoutRequestModal-input ${errors.paypalEmail ? 'error' : ''}`}
                    placeholder="your.paypal@email.com"
                    value={formData.paypalEmail}
                    onChange={(e) => handleInputChange('paypalEmail', e.target.value)}
                  />
                  {errors.paypalEmail && (
                    <span className="PayoutRequestModal-error">{errors.paypalEmail}</span>
                  )}
                  <div className="PayoutRequestModal-input-hint">
                    Make sure this email is associated with your PayPal account
                  </div>
                </div>

                <div className="PayoutRequestModal-form-group">
                  <label className="PayoutRequestModal-label">
                    <Info size={16} />
                    Message (Optional)
                  </label>
                  <textarea
                    className={`PayoutRequestModal-textarea ${errors.message ? 'error' : ''}`}
                    placeholder="Any additional notes for the admin..."
                    rows={3}
                    maxLength={500}
                    value={formData.message}
                    onChange={(e) => handleInputChange('message', e.target.value)}
                  />
                  <div className="PayoutRequestModal-char-count">
                    {formData.message.length}/500
                  </div>
                  {errors.message && (
                    <span className="PayoutRequestModal-error">{errors.message}</span>
                  )}
                </div>

                {/* Fee Breakdown */}
                {formData.requestedAmount && !errors.requestedAmount && (
                  <div className="PayoutRequestModal-fee-breakdown">
                    <h4>Payout Breakdown</h4>
                    <div className="PayoutRequestModal-fee-row">
                      <span>Requested Amount:</span>
                      <span>{formatCurrency(parseFloat(formData.requestedAmount))}</span>
                    </div>
                    <div className="PayoutRequestModal-fee-row">
                      <span>Processing Fee:</span>
                      <span>-{formatCurrency(calculateProcessingFee())}</span>
                    </div>
                    <div className="PayoutRequestModal-fee-row total">
                      <span>Net Amount:</span>
                      <span>{formatCurrency(getNetAmount())}</span>
                    </div>
                  </div>
                )}

                {/* Continue Button */}
                <button
                  className="PayoutRequestModal-continue-btn"
                  onClick={handleContinue}
                  disabled={!formData.requestedAmount || !formData.paypalEmail || Object.keys(errors).length > 0}
                >
                  Continue
                  <ArrowRight size={16} />
                </button>
              </div>
            </motion.div>
          )}

          {step === 'confirm' && (
            <motion.div
              className="PayoutRequestModal-content"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
            >
              <div className="PayoutRequestModal-confirm-section">
                <div className="PayoutRequestModal-confirm-header">
                  <CheckCircle size={24} className="PayoutRequestModal-confirm-icon" />
                  <h3>Confirm Payout Request</h3>
                  <p>Please review your payout details before submitting</p>
                </div>

                <div className="PayoutRequestModal-confirm-details">
                  <div className="PayoutRequestModal-confirm-card">
                    <div className="PayoutRequestModal-confirm-row">
                      <span className="PayoutRequestModal-confirm-label">Amount Requested:</span>
                      <span className="PayoutRequestModal-confirm-value primary">
                        {formatCurrency(parseFloat(formData.requestedAmount))}
                      </span>
                    </div>
                    <div className="PayoutRequestModal-confirm-row">
                      <span className="PayoutRequestModal-confirm-label">PayPal Email:</span>
                      <span className="PayoutRequestModal-confirm-value">{formData.paypalEmail}</span>
                    </div>
                    <div className="PayoutRequestModal-confirm-row">
                      <span className="PayoutRequestModal-confirm-label">Processing Fee:</span>
                      <span className="PayoutRequestModal-confirm-value">
                        {formatCurrency(calculateProcessingFee())}
                      </span>
                    </div>
                    <div className="PayoutRequestModal-confirm-row highlight">
                      <span className="PayoutRequestModal-confirm-label">Net Amount:</span>
                      <span className="PayoutRequestModal-confirm-value">
                        {formatCurrency(getNetAmount())}
                      </span>
                    </div>
                    {formData.message && (
                      <div className="PayoutRequestModal-confirm-message">
                        <span className="PayoutRequestModal-confirm-label">Message:</span>
                        <p>{formData.message}</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="PayoutRequestModal-confirm-info">
                  <div className="PayoutRequestModal-info-item">
                    <Clock size={16} />
                    <span>Processing typically takes 1-3 business days</span>
                  </div>
                  <div className="PayoutRequestModal-info-item">
                    <Shield size={16} />
                    <span>All payouts are reviewed for security</span>
                  </div>
                  <div className="PayoutRequestModal-info-item">
                    <Calendar size={16} />
                    <span>You'll receive an email confirmation once processed</span>
                  </div>
                </div>

                {errors.submit && (
                  <div className="PayoutRequestModal-submit-error">
                    <AlertCircle size={16} />
                    {errors.submit}
                  </div>
                )}

                <div className="PayoutRequestModal-confirm-actions">
                  <button
                    className="PayoutRequestModal-back-btn"
                    onClick={() => setStep('form')}
                    disabled={submitting}
                  >
                    Back to Edit
                  </button>
                  <button
                    className="PayoutRequestModal-submit-btn"
                    onClick={handleSubmit}
                    disabled={submitting}
                  >
                    {submitting ? (
                      <>
                        <div className="PayoutRequestModal-spinner" />
                        Submitting...
                      </>
                    ) : (
                      <>
                        Submit Request
                        <CreditCard size={16} />
                      </>
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {step === 'submitted' && (
            <motion.div
              className="PayoutRequestModal-content"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 }}
            >
              <div className="PayoutRequestModal-success-section">
                <div className="PayoutRequestModal-success-icon">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.2, duration: 0.3 }}
                  >
                    <CheckCircle size={48} />
                  </motion.div>
                </div>
                <h3>Payout Request Submitted!</h3>
                <p>Your payout request has been successfully submitted and is now being reviewed.</p>

                <div className="PayoutRequestModal-success-details">
                  <div className="PayoutRequestModal-success-amount">
                    {formatCurrency(getNetAmount())}
                  </div>
                  <div className="PayoutRequestModal-success-email">
                    will be sent to {formData.paypalEmail}
                  </div>
                </div>

                <div className="PayoutRequestModal-success-timeline">
                  <div className="PayoutRequestModal-timeline-item active">
                    <div className="PayoutRequestModal-timeline-dot" />
                    <span>Request Submitted</span>
                  </div>
                  <div className="PayoutRequestModal-timeline-item">
                    <div className="PayoutRequestModal-timeline-dot" />
                    <span>Under Review</span>
                  </div>
                  <div className="PayoutRequestModal-timeline-item">
                    <div className="PayoutRequestModal-timeline-dot" />
                    <span>Payment Sent</span>
                  </div>
                </div>

                <div className="PayoutRequestModal-success-info">
                  <p>You'll receive an email notification at each step of the process. Processing typically takes 1-3 business days.</p>
                </div>

                <button
                  className="PayoutRequestModal-done-btn"
                  onClick={onClose}
                >
                  Done
                </button>
              </div>
            </motion.div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default PayoutRequestModal;