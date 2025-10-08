/**
 * CCBill Payment Routes
 * All CCBill payment and webhook endpoints
 */

const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth.middleware');
const paymentController = require('../controllers/ccbill.payment.controller');
const webhookController = require('../controllers/ccbill.webhook.controller');

// Payment token endpoint (requires authentication)
router.get('/token', protect, paymentController.getFrontendToken);

// Payment method management
router.post('/methods/add', protect, paymentController.addPaymentMethod);
router.get('/methods', protect, paymentController.getPaymentMethods);
router.delete('/methods/:id', protect, paymentController.removePaymentMethod);

// Payment processing
router.post('/tip', protect, paymentController.processTip);
router.post('/purchase', protect, paymentController.purchaseContent);

// Subscription management
router.post('/subscribe', protect, paymentController.createSubscription);
router.delete('/subscription/:id', protect, paymentController.cancelSubscription);
router.get('/subscriptions', protect, paymentController.getUserSubscriptions);

// Payment history
router.get('/history', protect, paymentController.getPaymentHistory);

// Webhook endpoints (NO authentication - uses signature verification)
router.post('/webhooks/ccbill', webhookController.handleWebhook);

// Test webhook (development only)
if (process.env.NODE_ENV !== 'production') {
  router.post('/webhooks/ccbill/test', webhookController.testWebhook);
}

module.exports = router;
