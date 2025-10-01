// backend/src/routes/content.routes.js
const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth.middleware');
const {
  checkContentUnlock,
  checkSpendingLimit,
  validateUnlockPrice,
  trackUnlock,
  checkBundleUnlock,
} = require('../middleware/unlock.middleware');

const {
  getAllContent,
  getContent,
  getContentPreview,
  createContent,
  updateContent,
  deleteContent,
  unlockContent, // Changed from purchaseContent
  likeContent,
  unlikeContent,
  reportContent,
  getCreatorContent,
  getBundledContent,
  unlockBundle,
  getMyUnlockedContent,
  getContentStats,
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
router.get(
  '/:id',
  // Custom middleware for public content access
  async (req, res, next) => {
    try {
      const { id: contentId } = req.params;
      console.log(`🔍 Content request for ID: ${contentId}`);

      // Check if content exists
      const Content = require('../models/Content');
      const content = await Content.findById(contentId).populate(
        'creator',
        'user username profileImage isVerified'
      );

      if (!content) {
        console.log(`❌ Content not found: ${contentId}`);
        return res.status(404).json({
          success: false,
          message: 'Content not found',
        });
      }

      console.log(
        `✅ Content found: ${content.title || 'Untitled'} by ${content.creator?.username}`
      );

      // Default to no access for unauthenticated users
      req.hasAccess = false;

      // If user is authenticated, check for access
      if (req.user) {
        const userId = req.user.id;
        console.log(`👤 Authenticated user: ${userId}`);

        // Creator always has access to their own content
        if (content.creator.user.toString() === userId) {
          console.log(`🎨 Creator viewing own content`);
          req.hasAccess = true;
        } else {
          // Check if member has purchased this content
          const Transaction = require('../models/Transaction');
          const transaction = await Transaction.findOne({
            member: userId,
            content: contentId,
            type: 'content_unlock',
            status: 'completed',
          });

          if (transaction) {
            console.log(`💰 Content unlocked via transaction`);
            req.hasAccess = true;
          } else {
            console.log(`🔒 Content locked for user`);
          }
        }
      } else {
        console.log(`👤 Unauthenticated user - preview mode`);
      }

      // Store content for controller
      req.content = content;
      next();
    } catch (error) {
      console.error('Content access check error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error checking content access',
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
router.post(
  '/:id/unlock',
  authorize('member', 'creator'), // Allow both members and creators to unlock content
  validateUnlockPrice, // Validates minimum price only ($0.99+)
  checkSpendingLimit, // Checks daily spending limits if set
  trackUnlock, // Analytics tracking
  unlockContent // Process the unlock
);

// Bundle operations
router.get(
  '/bundle/:bundleId',
  authorize('member'),
  checkBundleUnlock,
  getBundledContent
);

router.post(
  '/bundle/:bundleId/unlock',
  authorize('member'),
  validateUnlockPrice,
  checkSpendingLimit,
  trackUnlock,
  unlockBundle
);

// Get all content I've unlocked
router.get('/my/unlocked', authorize('member'), getMyUnlockedContent);

// Like/unlike content (free action)
router.post(
  '/:id/like',
  authorize('member'),
  likeContent
);

router.delete('/:id/like', authorize('member'), unlikeContent);

// Report inappropriate content
router.post(
  '/:id/report',
  authorize('member'),
  reportContent
);

// ------------------------------------------
// CREATOR ROUTES
// ------------------------------------------

// Create new content with pricing
router.post(
  '/',
  authorize('creator'),
  createContent
);

// Update content (including price changes)
router.put('/:id', authorize('creator'), updateContent);

// Delete content (soft delete, preserves unlock history)
router.delete('/:id', authorize('creator'), deleteContent);

// Get content statistics
router.get(
  '/:id/stats',
  authorize('creator'),
  getContentStats // Views, unlocks, revenue, etc.
);

// ------------------------------------------
// ADMIN ROUTES
// ------------------------------------------

// Admin can view any content
router.get(
  '/:id/admin',
  authorize('admin'),
  (req, res, next) => {
    req.hasAccess = true; // Admin bypass
    next();
  },
  getContent
);

module.exports = router;
