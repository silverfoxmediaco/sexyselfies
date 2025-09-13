// backend/src/routes/session.routes.js
// Session management and analytics routes

const express = require('express');
const router = express.Router();
const { protectWithSession, trackActivity, authorize } = require('../middleware/auth.middleware');

const {
  getSessionAnalytics,
  getMyActiveSessions,
  endSession,
  endAllOtherSessions,
  cleanupExpiredSessions
} = require('../controllers/session.controller');

// ============================================
// SESSION MANAGEMENT (All Users)
// ============================================

// Get current user's active sessions
router.get('/my-sessions', protectWithSession, getMyActiveSessions);

// End a specific session
router.delete('/:sessionId', protectWithSession, endSession);

// End all other sessions (security feature)
router.delete('/end-all-others', protectWithSession, endAllOtherSessions);

// ============================================
// ADMIN SESSION MANAGEMENT (Admin Only)
// ============================================

// Platform-wide session analytics (admin only)
router.get(
  '/admin/analytics', 
  protectWithSession, 
  authorize('admin'),
  getSessionAnalytics
);

// Clean up expired sessions (admin only)
router.post(
  '/admin/cleanup', 
  protectWithSession, 
  authorize('admin'),
  cleanupExpiredSessions
);

module.exports = router;