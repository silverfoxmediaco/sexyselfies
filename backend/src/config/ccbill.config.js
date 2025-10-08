/**
 * CCBill Payment Gateway Configuration
 *
 * Sub-account Structure:
 * - 0503: Token generation (storing payment methods)
 * - 0504: One-time purchases (tips, PPV content, unlocks)
 * - 0505: Recurring subscriptions
 */

const ccbillConfig = {
  // Environment mode
  mode: process.env.CCBILL_MODE || 'test',

  // Base URLs
  baseURL: {
    test: 'https://api.ccbill.com',
    live: 'https://api.ccbill.com'
  },

  // Frontend credentials (token generation)
  frontend: {
    appId: process.env.CCBILL_FRONTEND_APP_ID,
    secret: process.env.CCBILL_FRONTEND_SECRET,
    tokenValidity: 300 // 5 minutes
  },

  // Backend credentials (payment processing)
  backend: {
    appId: process.env.CCBILL_BACKEND_APP_ID,
    secret: process.env.CCBILL_BACKEND_SECRET,
    tokenValidity: 3600 // 1 hour
  },

  // DataLink credentials (webhooks)
  datalink: {
    username: process.env.CCBILL_DATALINK_USER,
    password: process.env.CCBILL_DATALINK_PASS
  },

  // Sub-accounts
  subAccounts: {
    token: process.env.CCBILL_SUBACCOUNT_TOKEN || '0503',
    oneTime: process.env.CCBILL_SUBACCOUNT_ONETIME || '0504',
    subscription: process.env.CCBILL_SUBACCOUNT_SUBSCRIPTION || '0505'
  },

  // Whitelisted origin
  allowedOrigin: process.env.CCBILL_ALLOWED_ORIGIN || 'https://sexyselfies.com',

  // Currency settings
  currency: 'USD',

  // Platform revenue split (20% platform, 80% creator)
  platformFee: 0.20,
  creatorSplit: 0.80,

  // Payment types
  paymentTypes: {
    TIP: 'tip',
    SUBSCRIPTION: 'subscription',
    PPV: 'ppv',
    UNLOCK: 'unlock'
  },

  // Payment status
  paymentStatus: {
    PENDING: 'pending',
    COMPLETED: 'completed',
    FAILED: 'failed',
    REFUNDED: 'refunded',
    CANCELLED: 'cancelled'
  },

  // Subscription status
  subscriptionStatus: {
    ACTIVE: 'active',
    CANCELLED: 'cancelled',
    EXPIRED: 'expired',
    SUSPENDED: 'suspended'
  },

  // API endpoints
  endpoints: {
    createToken: '/payment-tokens',
    chargeToken: '/transactions/payment-tokens',
    createSubscription: '/subscriptions/payment-tokens',
    cancelSubscription: '/subscriptions',
    getTransaction: '/transactions'
  },

  // Webhook configuration
  webhook: {
    signatureHeader: 'X-CCBill-Signature',
    timestampHeader: 'X-CCBill-Timestamp'
  },

  // Test card numbers (use CVV > 300)
  testCards: {
    visa: '4111111111111111',
    mastercard: '5105105105105100',
    discover: '6011111111111117'
  }
};

/**
 * Get the current base URL based on mode
 */
ccbillConfig.getBaseURL = function() {
  return this.baseURL[this.mode];
};

/**
 * Get full endpoint URL
 */
ccbillConfig.getEndpointURL = function(endpoint) {
  return `${this.getBaseURL()}${endpoint}`;
};

/**
 * Validate configuration
 */
ccbillConfig.validate = function() {
  const required = [
    'CCBILL_FRONTEND_APP_ID',
    'CCBILL_FRONTEND_SECRET',
    'CCBILL_BACKEND_APP_ID',
    'CCBILL_BACKEND_SECRET',
    'CCBILL_DATALINK_USER',
    'CCBILL_DATALINK_PASS'
  ];

  const missing = required.filter(key => !process.env[key]);

  if (missing.length > 0) {
    throw new Error(`Missing required CCBill environment variables: ${missing.join(', ')}`);
  }

  return true;
};

module.exports = ccbillConfig;
