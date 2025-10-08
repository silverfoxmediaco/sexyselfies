const axios = require('axios');
const crypto = require('crypto');
const ccbillConfig = require('../config/ccbill.config');

/**
 * CCBill Payment Service
 * Handles all CCBill API interactions
 */
class CCBillService {
  constructor() {
    this.config = ccbillConfig;
    this.axiosInstance = axios.create({
      baseURL: this.config.getBaseURL(),
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }

  /**
   * Generate authentication bearer token using OAuth 2.0
   * @param {string} type - 'frontend' or 'backend'
   * @returns {Promise<string>} Bearer token
   */
  async generateBearerToken(type = 'backend') {
    const credentials = type === 'frontend' ? this.config.frontend : this.config.backend;
    const { appId, secret } = credentials;

    console.log(`Generating ${type} bearer token with appId:`, appId);

    // Base64 encode credentials for OAuth
    const authString = `${appId}:${secret}`;
    const base64Auth = Buffer.from(authString).toString('base64');

    try {
      const response = await axios.post(
        'https://api.ccbill.com/ccbill-auth/oauth/token',
        'grant_type=client_credentials',
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Authorization': `Basic ${base64Auth}`
          }
        }
      );

      console.log(`✅ ${type} OAuth token generated successfully`);
      return response.data.access_token;
    } catch (error) {
      console.error('OAuth token generation error:', error.response?.data || error.message);
      throw new Error('Failed to generate OAuth token');
    }
  }

  /**
   * Get frontend token for payment form
   * @returns {Promise<Object>} Token data
   */
  async getFrontendToken() {
    try {
      const token = await this.generateBearerToken('frontend');

      return {
        success: true,
        token,
        appId: this.config.frontend.appId,
        expiresIn: this.config.frontend.tokenValidity,
        subAccount: this.config.subAccounts.token
      };
    } catch (error) {
      console.error('Frontend token generation error:', error);
      throw new Error('Failed to generate frontend token');
    }
  }

  /**
   * Create payment token from card details
   * @param {Object} cardData - Card information
   * @returns {Promise<Object>} Payment token
   */
  async createPaymentToken(cardData) {
    try {
      const token = await this.generateBearerToken('frontend');

      const requestData = {
        clientAccnum: this.config.subAccounts.token.split('-')[0],
        clientSubacc: this.config.subAccounts.token.split('-')[1],
        cardNum: cardData.cardNumber.replace(/\s/g, ''), // Remove spaces
        expMonth: String(cardData.expiryMonth).padStart(2, '0'), // Ensure 2 digits
        expYear: String(cardData.expiryYear), // Full year (2025)
        cvv2: cardData.cvv,
        firstName: cardData.firstName,
        lastName: cardData.lastName,
        address1: cardData.address1,
        city: cardData.city,
        state: cardData.state,
        zipCode: cardData.zipCode,
        country: cardData.country || 'US',
        email: cardData.email
      };

      console.log('CCBill request data:', JSON.stringify(requestData, null, 2));

      const response = await this.axiosInstance.post(
        this.config.endpoints.createToken,
        requestData,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      return {
        success: true,
        paymentToken: response.data.paymentToken,
        last4: cardData.cardNumber.slice(-4),
        cardType: this.detectCardType(cardData.cardNumber),
        expiryMonth: cardData.expiryMonth,
        expiryYear: cardData.expiryYear
      };
    } catch (error) {
      console.error('Create payment token error:', error.response?.data || error.message);
      console.error('Full error:', JSON.stringify(error.response?.data, null, 2));
      throw new Error(error.response?.data?.generalMessage || 'Failed to create payment token');
    }
  }

  /**
   * Charge a payment token for one-time purchase
   * @param {Object} chargeData - Charge information
   * @returns {Promise<Object>} Transaction result
   */
  async chargePaymentToken(chargeData) {
    try {
      const token = await this.generateBearerToken('backend');

      const response = await this.axiosInstance.post(
        this.config.endpoints.chargeToken,
        {
          clientAccnum: this.config.subAccounts.oneTime.split('-')[0],
          clientSubacc: this.config.subAccounts.oneTime.split('-')[1],
          paymentToken: chargeData.paymentToken,
          amount: chargeData.amount,
          currencyCode: chargeData.currency || this.config.currency,
          description: chargeData.description,
          merchantInvoiceId: chargeData.invoiceId,
          email: chargeData.email
        },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      return {
        success: true,
        transactionId: response.data.transactionId,
        subscriptionId: response.data.subscriptionId,
        amount: response.data.amount,
        status: 'completed'
      };
    } catch (error) {
      console.error('Charge payment token error:', error.response?.data || error.message);
      throw new Error(error.response?.data?.message || 'Payment failed');
    }
  }

  /**
   * Create recurring subscription
   * @param {Object} subscriptionData - Subscription information
   * @returns {Promise<Object>} Subscription result
   */
  async createSubscription(subscriptionData) {
    try {
      const token = await this.generateBearerToken('backend');

      const response = await this.axiosInstance.post(
        this.config.endpoints.createSubscription,
        {
          clientAccnum: this.config.subAccounts.subscription.split('-')[0],
          clientSubacc: this.config.subAccounts.subscription.split('-')[1],
          paymentToken: subscriptionData.paymentToken,
          recurringPrice: subscriptionData.amount,
          recurringPeriod: subscriptionData.period || 30, // days
          currencyCode: subscriptionData.currency || this.config.currency,
          subscriptionTypeId: subscriptionData.subscriptionTypeId,
          description: subscriptionData.description,
          email: subscriptionData.email,
          merchantInvoiceId: subscriptionData.invoiceId
        },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      return {
        success: true,
        subscriptionId: response.data.subscriptionId,
        transactionId: response.data.transactionId,
        amount: response.data.recurringPrice,
        nextBillingDate: response.data.nextBillingDate,
        status: 'active'
      };
    } catch (error) {
      console.error('Create subscription error:', error.response?.data || error.message);
      throw new Error(error.response?.data?.message || 'Failed to create subscription');
    }
  }

  /**
   * Cancel subscription
   * @param {string} subscriptionId - CCBill subscription ID
   * @returns {Promise<Object>} Cancellation result
   */
  async cancelSubscription(subscriptionId) {
    try {
      const token = await this.generateBearerToken('backend');

      const response = await this.axiosInstance.delete(
        `${this.config.endpoints.cancelSubscription}/${subscriptionId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      return {
        success: true,
        subscriptionId,
        status: 'cancelled',
        cancelledAt: new Date()
      };
    } catch (error) {
      console.error('Cancel subscription error:', error.response?.data || error.message);
      throw new Error(error.response?.data?.message || 'Failed to cancel subscription');
    }
  }

  /**
   * Get transaction details
   * @param {string} transactionId - CCBill transaction ID
   * @returns {Promise<Object>} Transaction details
   */
  async getTransaction(transactionId) {
    try {
      const token = await this.generateBearerToken('backend');

      const response = await this.axiosInstance.get(
        `${this.config.endpoints.getTransaction}/${transactionId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      return {
        success: true,
        transaction: response.data
      };
    } catch (error) {
      console.error('Get transaction error:', error.response?.data || error.message);
      throw new Error(error.response?.data?.message || 'Failed to get transaction');
    }
  }

  /**
   * Verify webhook signature
   * @param {string} signature - Webhook signature from header
   * @param {string} timestamp - Webhook timestamp from header
   * @param {string} body - Raw request body
   * @returns {boolean} Signature valid
   */
  verifyWebhookSignature(signature, timestamp, body) {
    try {
      const secret = this.config.datalink.password;

      // Create expected signature: HMAC-SHA256(timestamp + body, secret)
      const message = `${timestamp}${body}`;
      const expectedSignature = crypto
        .createHmac('sha256', secret)
        .update(message)
        .digest('hex');

      // Compare signatures (timing-safe)
      return crypto.timingSafeEqual(
        Buffer.from(signature),
        Buffer.from(expectedSignature)
      );
    } catch (error) {
      console.error('Webhook signature verification error:', error);
      return false;
    }
  }

  /**
   * Detect card type from card number
   * @param {string} cardNumber - Card number
   * @returns {string} Card type
   */
  detectCardType(cardNumber) {
    const patterns = {
      'Visa': /^4[0-9]{12}(?:[0-9]{3})?$/,
      'MasterCard': /^5[1-5][0-9]{14}$/,
      'American Express': /^3[47][0-9]{13}$/,
      'Discover': /^6(?:011|5[0-9]{2})[0-9]{12}$/
    };

    for (const [type, pattern] of Object.entries(patterns)) {
      if (pattern.test(cardNumber.replace(/\s/g, ''))) {
        return type;
      }
    }

    return 'Other';
  }

  /**
   * Validate card number using Luhn algorithm
   * @param {string} cardNumber - Card number
   * @returns {boolean} Valid card number
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
}

module.exports = new CCBillService();
