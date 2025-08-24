const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth.middleware');

const {
  uploadVerification,
  getVerificationStatus,
  getPendingVerifications,
  approveVerification,
  rejectVerification
} = require('../controllers/verification.controller');

// Protected routes - Creators
router.post('/upload', protect, authorize('creator'), uploadVerification);
router.get('/status', protect, authorize('creator'), getVerificationStatus);

// Admin only routes
router.get('/pending', protect, authorize('admin'), getPendingVerifications);
router.post('/approve/:userId', protect, authorize('admin'), approveVerification);
router.post('/reject/:userId', protect, authorize('admin'), rejectVerification);

module.exports = router;