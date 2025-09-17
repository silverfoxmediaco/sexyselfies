const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth.middleware');
const { protectAdmin } = require('../middleware/admin.auth.middleware');

const {
  uploadVerification,
  getVerificationStatus,
  getPendingVerifications,
  approveVerification,
  rejectVerification,
} = require('../controllers/verification.controller');

// Protected routes - Creators
router.post('/upload', protect, authorize('creator'), uploadVerification);
router.get('/status', protect, authorize('creator'), getVerificationStatus);

// Admin only routes
router.get('/pending', protectAdmin, getPendingVerifications);
router.post('/approve/:userId', protectAdmin, approveVerification);
router.post('/reject/:userId', protectAdmin, rejectVerification);

module.exports = router;
