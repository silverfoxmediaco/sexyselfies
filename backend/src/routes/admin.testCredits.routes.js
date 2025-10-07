// backend/src/routes/admin.testCredits.routes.js
// Admin routes for test credit management

const express = require('express');
const router = express.Router();
const {
  grantTestCredits,
  deductTestCredits,
  setTestCredits,
  getTestCreditBalance,
  getMembersWithTestCredits,
  resetAllTestCredits,
  getTestTransactions,
  bulkGrantTestCredits,
} = require('../controllers/admin.testCredits.controller');
const { protectAdmin } = require('../middleware/admin.auth.middleware');

// All routes require admin authentication
router.use(protectAdmin);

// Test credit management
router.post('/grant', grantTestCredits);
router.post('/deduct', deductTestCredits);
router.post('/set', setTestCredits);
router.post('/bulk-grant', bulkGrantTestCredits);
router.post('/reset-all', resetAllTestCredits);

// Get test credit info
router.get('/balance/:memberId', getTestCreditBalance);
router.get('/members', getMembersWithTestCredits);
router.get('/transactions', getTestTransactions);

module.exports = router;
