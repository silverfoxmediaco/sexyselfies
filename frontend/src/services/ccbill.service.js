/**
 * CCBill Payment Service
 * Frontend service for handling CCBill payments
 */

import api from './api.config';

class CCBillService {
  /**
   * Get frontend token for payment form
   */
  async getFrontendToken() {
    try {
      const response = await api.get('/payments/ccbill/token');
      return response.data;
    } catch (error) {
      console.error('Get frontend token error:', error);
      throw error.response?.data || error;
    }
  }

  /**
   * Add payment method
   */
  async addPaymentMethod(cardData, setAsDefault = false) {
    try {
      const response = await api.post('/payments/ccbill/methods/add', {
        cardData,
        setAsDefault
      });
      return response.data;
    } catch (error) {
      console.error('Add payment method error:', error);
      throw error.response?.data || error;
    }
  }

  /**
   * Get user's payment methods
   */
  async getPaymentMethods() {
    try {
      const response = await api.get('/payments/ccbill/methods');
      return response.data;
    } catch (error) {
      console.error('Get payment methods error:', error);
      throw error.response?.data || error;
    }
  }

  /**
   * Remove payment method
   */
  async removePaymentMethod(methodId) {
    try {
      const response = await api.delete(`/payments/ccbill/methods/${methodId}`);
      return response.data;
    } catch (error) {
      console.error('Remove payment method error:', error);
      throw error.response?.data || error;
    }
  }

  /**
   * Process tip payment
   */
  async sendTip(creatorId, amount, paymentMethodId, message = '') {
    try {
      const response = await api.post('/payments/ccbill/tip', {
        creatorId,
        amount,
        paymentMethodId,
        message
      });
      return response.data;
    } catch (error) {
      console.error('Send tip error:', error);
      throw error.response?.data || error;
    }
  }

  /**
   * Purchase content
   */
  async purchaseContent(contentId, paymentMethodId) {
    try {
      const response = await api.post('/payments/ccbill/purchase', {
        contentId,
        paymentMethodId
      });
      return response.data;
    } catch (error) {
      console.error('Purchase content error:', error);
      throw error.response?.data || error;
    }
  }

  /**
   * Create subscription
   */
  async createSubscription(creatorId, tier, amount, paymentMethodId, billingCycle = 'monthly') {
    try {
      const response = await api.post('/payments/ccbill/subscribe', {
        creatorId,
        tier,
        amount,
        paymentMethodId,
        billingCycle
      });
      return response.data;
    } catch (error) {
      console.error('Create subscription error:', error);
      throw error.response?.data || error;
    }
  }

  /**
   * Cancel subscription
   */
  async cancelSubscription(subscriptionId, reason = '') {
    try {
      const response = await api.delete(`/payments/ccbill/subscription/${subscriptionId}`, {
        data: { reason }
      });
      return response.data;
    } catch (error) {
      console.error('Cancel subscription error:', error);
      throw error.response?.data || error;
    }
  }

  /**
   * Get user subscriptions
   */
  async getUserSubscriptions(status = null) {
    try {
      const params = status ? { status } : {};
      const response = await api.get('/payments/ccbill/subscriptions', { params });
      return response.data;
    } catch (error) {
      console.error('Get subscriptions error:', error);
      throw error.response?.data || error;
    }
  }

  /**
   * Get payment history
   */
  async getPaymentHistory(options = {}) {
    try {
      const params = {
        type: options.type,
        status: options.status,
        limit: options.limit || 50
      };
      const response = await api.get('/payments/ccbill/history', { params });
      return response.data;
    } catch (error) {
      console.error('Get payment history error:', error);
      throw error.response?.data || error;
    }
  }

  /**
   * Validate card number using Luhn algorithm
   */
  validateCardNumber(cardNumber) {
    const digits = cardNumber.replace(/\s/g, '');

    if (!/^\d+$/.test(digits)) return false;

    let sum = 0;
    let isEven = false;

    for (let i = digits.length - 1; i >= 0; i--) {
      let digit = parseInt(digits[i]);

      if (isEven) {
        digit *= 2;
        if (digit > 9) {
          digit -= 9;
        }
      }

      sum += digit;
      isEven = !isEven;
    }

    return sum % 10 === 0;
  }

  /**
   * Detect card type from card number
   */
  detectCardType(cardNumber) {
    const patterns = {
      'Visa': /^4[0-9]{12}(?:[0-9]{3})?$/,
      'MasterCard': /^5[1-5][0-9]{14}$/,
      'American Express': /^3[47][0-9]{13}$/,
      'Discover': /^6(?:011|5[0-9]{2})[0-9]{12}$/
    };

    const cleanNumber = cardNumber.replace(/\s/g, '');

    for (const [type, pattern] of Object.entries(patterns)) {
      if (pattern.test(cleanNumber)) {
        return type;
      }
    }

    return 'Unknown';
  }

  /**
   * Format card number with spaces
   */
  formatCardNumber(cardNumber) {
    const cleanNumber = cardNumber.replace(/\s/g, '');
    const matches = cleanNumber.match(/.{1,4}/g);
    return matches ? matches.join(' ') : cleanNumber;
  }

  /**
   * Format expiry date
   */
  formatExpiryDate(value) {
    const cleanValue = value.replace(/\D/g, '');

    if (cleanValue.length >= 2) {
      return `${cleanValue.slice(0, 2)}/${cleanValue.slice(2, 4)}`;
    }

    return cleanValue;
  }

  /**
   * Validate CVV
   */
  validateCVV(cvv, cardType = 'Visa') {
    const cleanCVV = cvv.replace(/\D/g, '');

    if (cardType === 'American Express') {
      return /^\d{4}$/.test(cleanCVV);
    }

    return /^\d{3}$/.test(cleanCVV);
  }

  /**
   * Validate expiry date
   */
  validateExpiryDate(month, year) {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;

    const expiryYear = parseInt(year);
    const expiryMonth = parseInt(month);

    if (expiryMonth < 1 || expiryMonth > 12) {
      return false;
    }

    if (expiryYear < currentYear) {
      return false;
    }

    if (expiryYear === currentYear && expiryMonth < currentMonth) {
      return false;
    }

    return true;
  }
}

export default new CCBillService();
