// backend/src/routes/content.routes.js
const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth.middleware');
const { 
  checkContentUnlock, 
  checkSpendingLimit,
  validateUnlockPrice,
  trackUnlock,
  checkBundleUnlock
} = require('../middleware/unlock.middleware');
const { rateLimiter } = require('../middleware/rateLimit.middleware');

const {
  getAllContent,
  getContent,
  getContentPreview,
  createContent,
  updateContent,
  deleteContent,
  unlockContent,  // Changed from purchaseContent
  likeContent,
  unlikeContent,
  reportContent,
  getCreatorContent,
  getBundledContent,
  unlockBundle,
  getMyUnlockedContent,
  getContentStats
} = require('../controllers/content.controller');

// ============================================
// PUBLIC ROUTES (No auth required)
// ============================================

// Browse all content (blurred previews only)
router.get('/', getAllContent);

// Get single content preview (blurred if not unlocked)
router.get('/:id/preview', getContentPreview);

// Get creator's public content list
router.get('/creator/:creatorId', getCreatorContent);

// ============================================
// PROTECTED ROUTES (Auth required)
// ============================================
router.use(protect);

// ------------------------------------------
// MEMBER ROUTES
// ------------------------------------------

// Get single content (full access if unlocked, preview if not)
router.get('/:id', 
  checkContentUnlock,  // Sets req.hasAccess
  getContent
);

// Unlock single content (micro-transaction)
router.post('/:id/unlock',
  authorize('member'),
  validateUnlockPrice,  // Validates minimum price only ($0.99+)
  checkSpendingLimit,   // Checks daily spending limits if set
  trackUnlock,          // Analytics tracking
  unlockContent         // Process the unlock
);

// Bundle operations
router.get('/bundle/:bundleId',
  authorize('member'),
  checkBundleUnlock,
  getBundledContent
);

router.post('/bundle/:bundleId/unlock',
  authorize('member'),
  validateUnlockPrice,
  checkSpendingLimit,
  trackUnlock,
  unlockBundle
);

// Get all content I've unlocked
router.get('/my/unlocked',
  authorize('member'),
  getMyUnlockedContent
);

// Like/unlike content (free action)
router.post('/:id/like',
  authorize('member'),
  rateLimiter({ windowMs: 1000, max: 10 }), // Prevent spam
  likeContent
);

router.delete('/:id/like',
  authorize('member'),
  unlikeContent
);

// Report inappropriate content
router.post('/:id/report',
  authorize('member'),
  rateLimiter({ windowMs: 60000, max: 5 }), // Max 5 reports per minute
  reportContent
);

// ------------------------------------------
// CREATOR ROUTES
// ------------------------------------------

// Create new content with pricing
router.post('/',
  authorize('creator'),
  rateLimiter({ windowMs: 60000, max: 20 }), // Max 20 uploads per minute
  createContent
);

// Update content (including price changes)
router.put('/:id',
  authorize('creator'),
  updateContent
);

// Delete content (soft delete, preserves unlock history)
router.delete('/:id',
  authorize('creator'),
  deleteContent
);

// Get content statistics
router.get('/:id/stats',
  authorize('creator'),
  getContentStats  // Views, unlocks, revenue, etc.
);

// ------------------------------------------
// ADMIN ROUTES
// ------------------------------------------

// Admin can view any content
router.get('/:id/admin',
  authorize('admin'),
  (req, res, next) => {
    req.hasAccess = true; // Admin bypass
    next();
  },
  getContent
);

module.exports = router;