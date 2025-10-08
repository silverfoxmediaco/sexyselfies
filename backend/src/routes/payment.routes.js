const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth.middleware');
const { validatePayment } = require('../middleware/validation.middleware');
const paymentController = require('../controllers/payment.controller');
const webhookController = require('../controllers/webhook.controller');

// CCBill REST API controllers
const ccbillPaymentController = require('../controllers/ccbill.payment.controller');
const ccbillWebhookController = require('../controllers/ccbill.webhook.controller');

// ==========================================
// MEMBER PAYMENT ROUTES
// ==========================================

// Create payment intent for content unlock
router.post(
  '/create-intent',
  protect,
  authorize('member'),
  validatePayment,
  paymentController.createPaymentIntent
);

// Confirm payment
router.post(
  '/confirm',
  protect,
  authorize('member'),
  paymentController.confirmPayment
);

// Process content unlock payment
router.post(
  '/unlock-content',
  protect,
  authorize('member'),
  validatePayment,
  paymentController.processContentUnlock
);

// Process content unlock with TEST CREDITS (Development/QA)
router.post(
  '/unlock-content-test',
  protect,
  authorize('member'),
  paymentController.processContentUnlockWithTestCredits
);

// Process message unlock payment
router.post(
  '/unlock-message',
  protect,
  authorize('member'),
  validatePayment,
  paymentController.processMessageUnlock
);

// Process tip payment
router.post(
  '/tip',
  protect,
  authorize('member'),
  validatePayment,
  paymentController.processTip
);

// Add credits to account
router.post(
  '/credits/add',
  protect,
  authorize('member'),
  validatePayment,
  paymentController.addCredits
);

// Get credit packages
router.get('/credits/packages', paymentController.getCreditPackages);

// Get credit balance (alias for wallet balance for backward compatibility)
router.get('/credits/balance', protect, paymentController.getWalletBalance);

// ==========================================
// CCBILL REST API ROUTES (New Payment System)
// ==========================================

// Get CCBill frontend token for payment form
router.get('/ccbill/token', protect, ccbillPaymentController.getFrontendToken);

// CCBill payment methods
router.post('/ccbill/methods/add', protect, ccbillPaymentController.addPaymentMethod);
router.get('/ccbill/methods', protect, ccbillPaymentController.getPaymentMethods);
router.delete('/ccbill/methods/:id', protect, ccbillPaymentController.removePaymentMethod);

// CCBill payment processing
router.post('/ccbill/tip', protect, authorize('member'), ccbillPaymentController.processTip);
router.post('/ccbill/purchase', protect, authorize('member'), ccbillPaymentController.purchaseContent);

// CCBill subscription management
router.post('/ccbill/subscribe', protect, authorize('member'), ccbillPaymentController.createSubscription);
router.delete('/ccbill/subscription/:id', protect, ccbillPaymentController.cancelSubscription);
router.get('/ccbill/subscriptions', protect, ccbillPaymentController.getUserSubscriptions);

// CCBill payment history
router.get('/ccbill/history', protect, ccbillPaymentController.getPaymentHistory);

// CCBill webhook (REST API version - uses signature verification)
router.post('/webhooks/ccbill-rest', ccbillWebhookController.handleWebhook);

// CCBill test webhook (development only)
if (process.env.NODE_ENV !== 'production') {
  router.post('/webhooks/ccbill-rest/test', ccbillWebhookController.testWebhook);
}

// ==========================================
// PAYMENT METHOD MANAGEMENT
// ==========================================

// Get saved payment methods
router.get('/methods', protect, paymentController.getPaymentMethods);

// Add new payment method
router.post(
  '/methods',
  protect,
  validatePayment,
  paymentController.addPaymentMethod
);

// Remove payment method
router.delete(
  '/methods/:methodId',
  protect,
  paymentController.removePaymentMethod
);

// Set default payment method
router.put(
  '/methods/:methodId/default',
  protect,
  paymentController.setDefaultPaymentMethod
);

// ==========================================
// CREATOR PAYOUT ROUTES
// ==========================================

// Request payout
router.post(
  '/payout/request',
  protect,
  authorize('creator'),
  validatePayment,
  paymentController.requestPayout
);

// Get payout methods
router.get(
  '/payout/methods',
  protect,
  authorize('creator'),
  paymentController.getPayoutMethods
);

// Add payout method (bank account, PayPal, etc)
router.post(
  '/payout/methods',
  protect,
  authorize('creator'),
  validatePayment,
  paymentController.addPayoutMethod
);

// Get payout history
router.get(
  '/payout/history',
  protect,
  authorize('creator'),
  paymentController.getPayoutHistory
);

// Get payout schedule
router.get(
  '/payout/schedule',
  protect,
  authorize('creator'),
  paymentController.getPayoutSchedule
);

// Enable instant payouts
router.post(
  '/payout/instant',
  protect,
  authorize('creator'),
  paymentController.enableInstantPayouts
);

// ==========================================
// TRANSACTION HISTORY
// ==========================================

// Get transaction history
router.get('/transactions', protect, paymentController.getTransactionHistory);

// Get specific transaction
router.get(
  '/transactions/:transactionId',
  protect,
  paymentController.getTransaction
);

// Download transaction report
router.get(
  '/transactions/export',
  protect,
  paymentController.exportTransactions
);

// Dispute transaction
router.post(
  '/transactions/:transactionId/dispute',
  protect,
  paymentController.disputeTransaction
);

// ==========================================
// SUBSCRIPTION MANAGEMENT (Future feature)
// ==========================================

// Get subscription plans
router.get('/subscriptions/plans', paymentController.getSubscriptionPlans);

// Create subscription
router.post(
  '/subscriptions',
  protect,
  authorize('member'),
  validatePayment,
  paymentController.createSubscription
);

// Cancel subscription
router.delete(
  '/subscriptions/:subscriptionId',
  protect,
  authorize('member'),
  paymentController.cancelSubscription
);

// Update subscription
router.put(
  '/subscriptions/:subscriptionId',
  protect,
  authorize('member'),
  paymentController.updateSubscription
);

// ==========================================
// TAX & COMPLIANCE
// ==========================================

// Get tax information
router.get(
  '/tax/info',
  protect,
  authorize('creator'),
  paymentController.getTaxInfo
);

// Submit tax forms (W9, W8-BEN, etc)
router.post(
  '/tax/forms',
  protect,
  authorize('creator'),
  paymentController.submitTaxForms
);

// Get tax documents (1099s)
router.get(
  '/tax/documents',
  protect,
  authorize('creator'),
  paymentController.getTaxDocuments
);

// ==========================================
// PRICING & FEES
// ==========================================

// Get platform fees
router.get('/fees', paymentController.getPlatformFees);

// Calculate fees for amount
router.post('/fees/calculate', paymentController.calculateFees);

// Get exchange rates (for international)
router.get('/rates', paymentController.getExchangeRates);

// ==========================================
// WEBHOOKS (No auth required - verified by signature)
// ==========================================

// Stripe webhooks
router.post(
  '/webhooks/stripe',
  express.raw({ type: 'application/json' }),
  webhookController.handleStripeWebhook
);

// PayPal webhooks
router.post(
  '/webhooks/paypal',
  express.json(),
  webhookController.handlePayPalWebhook
);

// CCBill webhooks (adult payment processor)
router.post(
  '/webhooks/ccbill',
  express.urlencoded({ extended: true }),
  webhookController.handleCCBillWebhook
);

// Cryptocurrency webhooks (future)
router.post(
  '/webhooks/crypto',
  express.json(),
  webhookController.handleCryptoWebhook
);

// ==========================================
// REFUNDS & CHARGEBACKS
// ==========================================

// Request refund
router.post(
  '/refund',
  protect,
  authorize('member'),
  validatePayment,
  paymentController.requestRefund
);

// Get refund status
router.get('/refund/:refundId', protect, paymentController.getRefundStatus);

// Handle chargeback (admin only)
router.post(
  '/chargeback/:transactionId',
  protect,
  authorize('admin'),
  paymentController.handleChargeback
);

// ==========================================
// ANALYTICS & REPORTING
// ==========================================

// Get payment analytics (creator)
router.get(
  '/analytics',
  protect,
  authorize('creator'),
  paymentController.getPaymentAnalytics
);

// Get revenue report
router.get(
  '/analytics/revenue',
  protect,
  authorize('creator'),
  paymentController.getRevenueReport
);

// Get customer spending analytics
router.get(
  '/analytics/customers',
  protect,
  authorize('creator'),
  paymentController.getCustomerAnalytics
);

// ==========================================
// PROMOTIONAL & DISCOUNTS
// ==========================================

// Apply promo code
router.post('/promo/apply', protect, paymentController.applyPromoCode);

// Validate promo code
router.get('/promo/validate/:code', paymentController.validatePromoCode);

// Create promo code (creator)
router.post(
  '/promo/create',
  protect,
  authorize('creator'),
  paymentController.createPromoCode
);

// ==========================================
// WALLET & BALANCE
// ==========================================

// Get wallet balance
router.get('/wallet/balance', protect, paymentController.getWalletBalance);

// Get wallet transactions
router.get(
  '/wallet/transactions',
  protect,
  paymentController.getWalletTransactions
);

// Transfer between wallets (internal)
router.post(
  '/wallet/transfer',
  protect,
  validatePayment,
  paymentController.transferFunds
);

// ==========================================
// ERROR HANDLING
// ==========================================

// Payment error handler
router.use((error, req, res, next) => {
  console.error('Payment route error:', error);

  // Handle Stripe errors
  if (error.type === 'StripeCardError') {
    return res.status(400).json({
      success: false,
      message: 'Card declined',
      error: error.message,
    });
  }

  // Handle insufficient funds
  if (error.code === 'insufficient_funds') {
    return res.status(400).json({
      success: false,
      message: 'Insufficient funds',
      error: 'Please add credits or use a different payment method',
    });
  }

  // Handle rate limit
  if (error.code === 'rate_limit') {
    return res.status(429).json({
      success: false,
      message: 'Too many requests',
      error: 'Please wait before trying again',
    });
  }

  // Default error
  res.status(error.status || 500).json({
    success: false,
    message: error.message || 'Payment processing error',
  });
});

module.exports = router;
