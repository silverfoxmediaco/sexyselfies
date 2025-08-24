const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth.middleware');

const {
  getMemberProfile,
  updateMemberProfile,
  updatePreferences,
  purchaseContent,
  getPurchasedContent,
  likeCreator,
  passCreator,
  superLikeCreator
  // Removed getMatches - using connections system instead
} = require('../controllers/member.controller');

router.use(protect); // All member routes require authentication
router.use(authorize('member')); // Only members can access these routes

// ==========================================
// PROFILE MANAGEMENT
// ==========================================
router.get('/profile', getMemberProfile);
router.put('/profile', updateMemberProfile);
router.put('/preferences', updatePreferences);

// ==========================================
// CONTENT & PURCHASES (Direct Payment)
// ==========================================
router.post('/purchase/:contentId', purchaseContent);
router.get('/purchased', getPurchasedContent);

// ==========================================
// SWIPING ACTIONS
// ==========================================
router.post('/swipe/like/:creatorId', likeCreator);
router.post('/swipe/pass/:creatorId', passCreator);
router.post('/swipe/superlike/:creatorId', superLikeCreator);

// ==========================================
// CONNECTIONS (Redirect to main connections routes)
// ==========================================

// Get all connections
router.get('/connections', (req, res) => {
  const queryString = req._parsedUrl?.search || '';
  res.redirect(307, `/api/v1/connections${queryString}`);
});

// Get connection stats
router.get('/connections/stats', (req, res) => {
  res.redirect(307, '/api/v1/connections/stats');
});

// Legacy matches route - redirect to connections
router.get('/matches', (req, res) => {
  const queryString = req._parsedUrl?.search || '';
  res.redirect(307, `/api/v1/connections${queryString}`);
});

module.exports = router;