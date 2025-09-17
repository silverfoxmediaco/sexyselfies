const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth.middleware');

const {
  getTransactions,
  getTransaction,
  createPurchase,
  createTip,
  getEarningsReport,
  requestPayout,
  getPayoutHistory,
  handleCCBillWebhook,
} = require('../controllers/transaction.controller');

router.use(protect);

// User transactions
router.get('/', getTransactions); // Get user's transactions
router.get('/:id', getTransaction); // Get specific transaction
router.post('/purchase', createPurchase); // Create purchase transaction
router.post('/tip', createTip); // Send tip to creator

// Creator earnings
router.get('/earnings/report', authorize('creator'), getEarningsReport);
router.post('/payout/request', authorize('creator'), requestPayout);
router.get('/payout/history', authorize('creator'), getPayoutHistory);

// Webhook (no auth needed)
router.post(
  '/webhook/ccbill',
  express.raw({ type: 'application/json' }),
  handleCCBillWebhook
);

module.exports = router;
