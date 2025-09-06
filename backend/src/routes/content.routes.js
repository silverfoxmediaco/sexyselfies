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

// Get single content (full access if unlocked, preview if not) - PUBLIC
router.get('/:id', 
  // Custom middleware for public content access
  async (req, res, next) => {
    try {
      const { id: contentId } = req.params;
      
      // Check if content exists
      const content = await require('../models/Content').findById(contentId);
      if (!content) {
        return res.status(404).json({
          success: false,
          message: 'Content not found'
        });
      }
      
      // Default to no access for unauthenticated users
      req.hasAccess = false;
      
      // If user is authenticated, check for access
      if (req.user) {
        const memberId = req.user.id;
        
        // Creator always has access to their own content
        if (content.creator.toString() === memberId) {
          req.hasAccess = true;
        } else {
          // Check if member has purchased this content
          const Transaction = require('../models/Transaction');
          const transaction = await Transaction.findOne({
            memberId,
            contentId,
            type: 'content_unlock',
            status: 'completed'
          });
          
          if (transaction) {
            req.hasAccess = true;
          }
        }
      }
      
      // Store content for controller
      req.content = content;
      next();
    } catch (error) {
      console.error('Content access check error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error checking content access'
      });
    }
  },
  getContent
);

// ============================================
// PROTECTED ROUTES (Auth required)
// ============================================
router.use(protect);

// ------------------------------------------
// MEMBER ROUTES
// ------------------------------------------

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