const express = require('express');
const router = express.Router();

// Only import webhook controller if it exists
let webhookController;
try {
  webhookController = require('../controllers/webhook.controller');
} catch (err) {
  console.log('Webhook controller not found, using stub handlers');
  // Stub handlers if controller doesn't exist
  webhookController = {
    handleCCBillWebhook: (req, res) => res.status(200).send('OK'),
    handleStripeWebhook: (req, res) => res.status(200).json({ received: true }),
    handlePayPalWebhook: (req, res) => res.status(200).json({ received: true }),
    handleCryptoWebhook: (req, res) => res.status(200).json({ received: true })
  };
}

// CCBill webhooks (primary payment processor)
router.post('/ccbill',
  express.urlencoded({ extended: true }),
  webhookController.handleCCBillWebhook
);

// Alternative webhook endpoints for CCBill events
router.post('/ccbill/success',
  express.urlencoded({ extended: true }),
  webhookController.handleCCBillWebhook
);

router.post('/ccbill/failure',
  express.urlencoded({ extended: true }),
  webhookController.handleCCBillWebhook
);

// Stripe webhooks (if you add Stripe later)
router.post('/stripe',
  express.raw({ type: 'application/json' }),
  webhookController.handleStripeWebhook
);

// PayPal webhooks (if you add PayPal later)
router.post('/paypal',
  express.json(),
  webhookController.handlePayPalWebhook
);

// Cryptocurrency webhooks (future)
router.post('/crypto',
  express.json(),
  webhookController.handleCryptoWebhook
);

// Health check for webhooks
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Webhook endpoints are active',
    endpoints: [
      '/webhooks/ccbill',
      '/webhooks/ccbill/success',
      '/webhooks/ccbill/failure',
      '/webhooks/stripe',
      '/webhooks/paypal',
      '/webhooks/crypto'
    ]
  });
});

// Test webhook endpoint (development only)
if (process.env.NODE_ENV === 'development') {
  router.post('/test', express.json(), (req, res) => {
    console.log('Test webhook received:', req.body);
    res.json({
      success: true,
      message: 'Test webhook received',
      data: req.body
    });
  });
}

module.exports = router;