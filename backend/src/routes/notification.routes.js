const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth.middleware');
const { protectAdmin } = require('../middleware/admin.auth.middleware');
const {
  sendAdminVerificationNotification,
  approveVerification,
  rejectVerification
} = require('../controllers/notification.controller');

// User routes (creators submitting verification)
router.post('/admin-verification', protect, sendAdminVerificationNotification);

// Admin routes (approving/rejecting)
router.post('/approve-verification', protectAdmin, approveVerification);
router.post('/reject-verification', protectAdmin, rejectVerification);

module.exports = router;