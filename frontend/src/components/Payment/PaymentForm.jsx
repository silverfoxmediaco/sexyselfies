import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { CreditCard, Lock, AlertCircle } from 'lucide-react';
import ccbillService from '../../services/ccbill.service';
import './PaymentForm.css';

const PaymentForm = ({ onSuccess, onCancel, amount = null, description = '' }) => {
  const [formData, setFormData] = useState({
    cardNumber: '',
    expiryDate: '',
    cvv: '',
    firstName: '',
    lastName: '',
    address1: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'US'
  });

  const [cardType, setCardType] = useState('');
  const [errors, setErrors] = useState({});
  const [isProcessing, setIsProcessing] = useState(false);
  const [showCVVInfo, setShowCVVInfo] = useState(false);

  // Detect card type on number change
  useEffect(() => {
    if (formData.cardNumber.length >= 4) {
      const type = ccbillService.detectCardType(formData.cardNumber);
      setCardType(type);
    } else {
      setCardType('');
    }
  }, [formData.cardNumber]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    let formattedValue = value;

    // Format card number
    if (name === 'cardNumber') {
      formattedValue = ccbillService.formatCardNumber(value.replace(/\s/g, '')).slice(0, 19);
    }

    // Format expiry date
    if (name === 'expiryDate') {
      formattedValue = ccbillService.formatExpiryDate(value).slice(0, 5);
    }

    // Format CVV
    if (name === 'cvv') {
      formattedValue = value.replace(/\D/g, '').slice(0, cardType === 'American Express' ? 4 : 3);
    }

    // Format zip code
    if (name === 'zipCode') {
      formattedValue = value.replace(/[^0-9-]/g, '').slice(0, 10);
    }

    setFormData(prev => ({
      ...prev,
      [name]: formattedValue
    }));

    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: null
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    // Validate card number
    if (!formData.cardNumber) {
      newErrors.cardNumber = 'Card number is required';
    } else if (!ccbillService.validateCardNumber(formData.cardNumber)) {
      newErrors.cardNumber = 'Invalid card number';
    }

    // Validate expiry date
    if (!formData.expiryDate) {
      newErrors.expiryDate = 'Expiry date is required';
    } else {
      const [month, year] = formData.expiryDate.split('/');
      const fullYear = year ? `20${year}` : '';
      if (!ccbillService.validateExpiryDate(month, fullYear)) {
        newErrors.expiryDate = 'Invalid or expired date';
      }
    }

    // Validate CVV
    if (!formData.cvv) {
      newErrors.cvv = 'CVV is required';
    } else if (!ccbillService.validateCVV(formData.cvv, cardType)) {
      newErrors.cvv = cardType === 'American Express' ? 'CVV must be 4 digits' : 'CVV must be 3 digits';
    }

    // Validate name
    if (!formData.firstName.trim()) {
      newErrors.firstName = 'First name is required';
    }
    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Last name is required';
    }

    // Validate address
    if (!formData.address1.trim()) {
      newErrors.address1 = 'Address is required';
    }
    if (!formData.city.trim()) {
      newErrors.city = 'City is required';
    }
    if (!formData.state.trim()) {
      newErrors.state = 'State is required';
    }
    if (!formData.zipCode.trim()) {
      newErrors.zipCode = 'ZIP code is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsProcessing(true);

    try {
      // Parse expiry date
      const [month, year] = formData.expiryDate.split('/');
      const fullYear = `20${year}`;

      // Prepare card data
      const cardData = {
        cardNumber: formData.cardNumber.replace(/\s/g, ''),
        expiryMonth: parseInt(month),
        expiryYear: parseInt(fullYear),
        cvv: formData.cvv,
        firstName: formData.firstName,
        lastName: formData.lastName,
        address1: formData.address1,
        city: formData.city,
        state: formData.state,
        zipCode: formData.zipCode,
        country: formData.country
      };

      // Add payment method
      const result = await ccbillService.addPaymentMethod(cardData, true);

      if (result.success) {
        onSuccess(result.data);
      }
    } catch (error) {
      console.error('Payment form error:', error);
      setErrors({
        submit: error.error || 'Failed to add payment method. Please try again.'
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <motion.div
      className="PaymentForm"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="PaymentForm-header">
        <CreditCard size={24} className="PaymentForm-header-icon" />
        <h2>Add Payment Method</h2>
        {amount && (
          <div className="PaymentForm-amount">
            ${amount.toFixed(2)}
          </div>
        )}
      </div>

      {description && (
        <p className="PaymentForm-description">{description}</p>
      )}

      <form onSubmit={handleSubmit} className="PaymentForm-form">
        {/* Card Number */}
        <div className="PaymentForm-field">
          <label htmlFor="cardNumber">Card Number</label>
          <div className="PaymentForm-card-input">
            <input
              type="text"
              id="cardNumber"
              name="cardNumber"
              value={formData.cardNumber}
              onChange={handleInputChange}
              placeholder="1234 5678 9012 3456"
              className={errors.cardNumber ? 'error' : ''}
              autoComplete="cc-number"
            />
            {cardType && (
              <span className={`PaymentForm-card-type ${cardType.toLowerCase().replace(/\s/g, '-')}`}>
                {cardType}
              </span>
            )}
          </div>
          {errors.cardNumber && (
            <span className="PaymentForm-error">
              <AlertCircle size={14} />
              {errors.cardNumber}
            </span>
          )}
        </div>

        {/* Expiry Date and CVV */}
        <div className="PaymentForm-row">
          <div className="PaymentForm-field">
            <label htmlFor="expiryDate">Expiry Date</label>
            <input
              type="text"
              id="expiryDate"
              name="expiryDate"
              value={formData.expiryDate}
              onChange={handleInputChange}
              placeholder="MM/YY"
              className={errors.expiryDate ? 'error' : ''}
              autoComplete="cc-exp"
            />
            {errors.expiryDate && (
              <span className="PaymentForm-error">
                <AlertCircle size={14} />
                {errors.expiryDate}
              </span>
            )}
          </div>

          <div className="PaymentForm-field">
            <label htmlFor="cvv">
              CVV
              <button
                type="button"
                className="PaymentForm-cvv-info"
                onMouseEnter={() => setShowCVVInfo(true)}
                onMouseLeave={() => setShowCVVInfo(false)}
              >
                ?
              </button>
            </label>
            <input
              type="text"
              id="cvv"
              name="cvv"
              value={formData.cvv}
              onChange={handleInputChange}
              placeholder={cardType === 'American Express' ? '1234' : '123'}
              className={errors.cvv ? 'error' : ''}
              autoComplete="cc-csc"
            />
            {showCVVInfo && (
              <div className="PaymentForm-cvv-tooltip">
                3-digit code on back of card (4 digits for Amex)
              </div>
            )}
            {errors.cvv && (
              <span className="PaymentForm-error">
                <AlertCircle size={14} />
                {errors.cvv}
              </span>
            )}
          </div>
        </div>

        {/* Name */}
        <div className="PaymentForm-row">
          <div className="PaymentForm-field">
            <label htmlFor="firstName">First Name</label>
            <input
              type="text"
              id="firstName"
              name="firstName"
              value={formData.firstName}
              onChange={handleInputChange}
              className={errors.firstName ? 'error' : ''}
              autoComplete="given-name"
            />
            {errors.firstName && (
              <span className="PaymentForm-error">
                <AlertCircle size={14} />
                {errors.firstName}
              </span>
            )}
          </div>

          <div className="PaymentForm-field">
            <label htmlFor="lastName">Last Name</label>
            <input
              type="text"
              id="lastName"
              name="lastName"
              value={formData.lastName}
              onChange={handleInputChange}
              className={errors.lastName ? 'error' : ''}
              autoComplete="family-name"
            />
            {errors.lastName && (
              <span className="PaymentForm-error">
                <AlertCircle size={14} />
                {errors.lastName}
              </span>
            )}
          </div>
        </div>

        {/* Address */}
        <div className="PaymentForm-field">
          <label htmlFor="address1">Street Address</label>
          <input
            type="text"
            id="address1"
            name="address1"
            value={formData.address1}
            onChange={handleInputChange}
            className={errors.address1 ? 'error' : ''}
            autoComplete="address-line1"
          />
          {errors.address1 && (
            <span className="PaymentForm-error">
              <AlertCircle size={14} />
              {errors.address1}
            </span>
          )}
        </div>

        {/* City, State, ZIP */}
        <div className="PaymentForm-row-3">
          <div className="PaymentForm-field">
            <label htmlFor="city">City</label>
            <input
              type="text"
              id="city"
              name="city"
              value={formData.city}
              onChange={handleInputChange}
              className={errors.city ? 'error' : ''}
              autoComplete="address-level2"
            />
            {errors.city && (
              <span className="PaymentForm-error">
                <AlertCircle size={14} />
                {errors.city}
              </span>
            )}
          </div>

          <div className="PaymentForm-field">
            <label htmlFor="state">State</label>
            <input
              type="text"
              id="state"
              name="state"
              value={formData.state}
              onChange={handleInputChange}
              className={errors.state ? 'error' : ''}
              autoComplete="address-level1"
              maxLength="2"
            />
            {errors.state && (
              <span className="PaymentForm-error">
                <AlertCircle size={14} />
                {errors.state}
              </span>
            )}
          </div>

          <div className="PaymentForm-field">
            <label htmlFor="zipCode">ZIP Code</label>
            <input
              type="text"
              id="zipCode"
              name="zipCode"
              value={formData.zipCode}
              onChange={handleInputChange}
              className={errors.zipCode ? 'error' : ''}
              autoComplete="postal-code"
            />
            {errors.zipCode && (
              <span className="PaymentForm-error">
                <AlertCircle size={14} />
                {errors.zipCode}
              </span>
            )}
          </div>
        </div>

        {/* Submit Error */}
        {errors.submit && (
          <div className="PaymentForm-submit-error">
            <AlertCircle size={16} />
            {errors.submit}
          </div>
        )}

        {/* Security Notice */}
        <div className="PaymentForm-security">
          <Lock size={14} />
          <span>Secured by CCBill - Your information is encrypted and safe</span>
        </div>

        {/* Buttons */}
        <div className="PaymentForm-buttons">
          <button
            type="button"
            onClick={onCancel}
            className="PaymentForm-btn-cancel"
            disabled={isProcessing}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="PaymentForm-btn-submit"
            disabled={isProcessing}
          >
            {isProcessing ? 'Processing...' : amount ? `Pay $${amount.toFixed(2)}` : 'Add Card'}
          </button>
        </div>
      </form>
    </motion.div>
  );
};

export default PaymentForm;
