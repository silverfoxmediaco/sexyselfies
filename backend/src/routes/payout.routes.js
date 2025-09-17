const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth.middleware');
const {
  protectAdmin,
  requirePermission,
} = require('../middleware/admin.auth.middleware');
const {
  createPayoutRequest,
  getCreatorPayoutRequests,
  getAvailableEarnings,
  cancelPayoutRequest,
  getAdminPayoutRequests,
  approvePayoutRequest,
  rejectPayoutRequest,
  markPayoutProcessed,
} = require('../controllers/payout.controller');

// Creator routes
router.post('/request', protect, createPayoutRequest);
router.get('/requests', protect, getCreatorPayoutRequests);
router.get('/available', protect, getAvailableEarnings);
router.put('/cancel/:requestId', protect, cancelPayoutRequest);

// Admin routes
router.get(
  '/admin/requests',
  protectAdmin,
  requirePermission('canAccessFinancials'),
  getAdminPayoutRequests
);

router.put(
  '/admin/requests/:requestId/approve',
  protectAdmin,
  requirePermission('canAccessFinancials'),
  approvePayoutRequest
);

router.put(
  '/admin/requests/:requestId/reject',
  protectAdmin,
  requirePermission('canAccessFinancials'),
  rejectPayoutRequest
);

router.put(
  '/admin/requests/:requestId/processed',
  protectAdmin,
  requirePermission('canAccessFinancials'),
  markPayoutProcessed
);

module.exports = router;
