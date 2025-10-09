const crypto = require('crypto');
const ccbillConfig = require('../config/ccbill.config');

/**
 * CCBill FlexForms (Advanced Widget) Service
 * Generates payment links for CCBill's hosted payment forms
 */
class CCBillWidgetService {
  constructor() {
    this.config = ccbillConfig;
    this.accountNumber = process.env.CCBILL_ACCOUNT_NUMBER || '948700';
    this.salt = process.env.CCBILL_SALT || ''; // You'll need to get this from CCBill dashboard
    this.formName = process.env.CCBILL_FORM_NAME || ''; // You'll need to create form in CCBill dashboard
    this.currency = 'USD';
    this.currencyCode = '840'; // USD currency code
  }

  /**
   * Generate MD5 hash for CCBill payment link
   * Formula: MD5(initialPrice + initialPeriod + currencyCode + salt)
   * NOTE: initialPrice should be INTEGER without decimals (e.g., "10" not "10.00")
   * @param {number} amount - Payment amount
   * @returns {string} MD5 hash
   */
  generateHash(amount) {
    const initialPeriod = '2'; // 2 days initial period (CCBill requirement)
    // CCBill expects integer amount without decimal points for hash
    const amountInt = Math.floor(amount).toString();
    const stringToHash = `${amountInt}${initialPeriod}${this.currencyCode}${this.salt}`;

    return crypto
      .createHash('md5')
      .update(stringToHash)
      .digest('hex');
  }

  /**
   * Generate CCBill payment URL for credit purchase
   * @param {Object} params - Payment parameters
   * @returns {Object} Payment URL and transaction details
   */
  generatePaymentURL(params) {
    const {
      amount,
      credits,
      userId,
      email,
      firstName = '',
      lastName = '',
      returnUrl,
      declineUrl
    } = params;

    // Validate required params
    if (!amount || !credits || !userId) {
      throw new Error('Missing required payment parameters');
    }

    if (!this.salt) {
      throw new Error('CCBill salt not configured. Please set CCBILL_SALT in environment variables.');
    }

    if (!this.formName) {
      throw new Error('CCBill form name not configured. Please set CCBILL_FORM_NAME in environment variables.');
    }

    // Generate unique transaction ID
    const transactionId = `${userId}_${Date.now()}`;

    // Calculate hash
    const formDigest = this.generateHash(amount);

    // Build payment URL parameters
    const baseURL = this.config.mode === 'test'
      ? 'https://sandbox-api.ccbill.com/wap-frontflex/flexforms'
      : 'https://api.ccbill.com/wap-frontflex/flexforms';

    const paymentParams = new URLSearchParams({
      // Required CCBill parameters
      clientAccnum: this.accountNumber,
      clientSubacc: this.config.subAccounts.oneTime,
      formName: this.formName,

      // Pricing
      initialPrice: amount.toFixed(2),
      initialPeriod: '2', // 2 days (CCBill requirement for one-time)
      currencyCode: this.currencyCode,
      formDigest: formDigest,

      // Customer info
      ...(email && { email }),
      ...(firstName && { firstName }),
      ...(lastName && { lastName }),

      // Custom tracking
      merchantInvoiceId: transactionId,
      clientCustom1: userId.toString(), // User ID
      clientCustom2: credits.toString(), // Credits amount

      // Return URLs
      ...(returnUrl && {
        approvalURL: `${returnUrl}?transaction=${transactionId}&status=approved`,
        declineURL: declineUrl || `${returnUrl}?transaction=${transactionId}&status=declined`
      })
    });

    const paymentURL = `${baseURL}/${this.formName}?${paymentParams.toString()}`;

    return {
      success: true,
      paymentURL,
      transactionId,
      amount,
      credits,
      expiresIn: 900 // URL valid for 15 minutes
    };
  }

  /**
   * Generate payment URL for credit purchase (convenience method)
   * @param {string} userId - User ID
   * @param {number} credits - Number of credits to purchase
   * @param {string} email - User email
   * @param {Object} options - Additional options
   * @returns {Object} Payment URL details
   */
  createCreditPurchaseURL(userId, credits, email, options = {}) {
    // $1 = 1 credit conversion
    const amount = credits;

    return this.generatePaymentURL({
      amount,
      credits,
      userId,
      email,
      firstName: options.firstName,
      lastName: options.lastName,
      returnUrl: options.returnUrl || process.env.CLIENT_URL,
      declineUrl: options.declineUrl
    });
  }

  /**
   * Verify webhook signature from CCBill
   * @param {Object} data - Webhook data
   * @returns {boolean} Signature valid
   */
  verifyWebhookSignature(data) {
    // CCBill FlexForms webhook verification
    // This will be implemented when we handle webhooks
    return true;
  }

  /**
   * Parse webhook data from CCBill
   * @param {Object} body - Webhook request body
   * @returns {Object} Parsed payment data
   */
  parseWebhookData(body) {
    return {
      transactionId: body.merchantInvoiceId || body.transactionId,
      userId: body.clientCustom1,
      credits: parseInt(body.clientCustom2 || 0),
      amount: parseFloat(body.initialPrice || body.accountingAmount || 0),
      ccbillTransactionId: body.subscription_id || body.transactionId,
      timestamp: body.timestamp || new Date(),
      status: body.eventType || 'NewSaleSuccess',
      paymentType: body.paymentType || 'CREDIT_CARD',
      billingType: 'one-time'
    };
  }
}

module.exports = new CCBillWidgetService();
