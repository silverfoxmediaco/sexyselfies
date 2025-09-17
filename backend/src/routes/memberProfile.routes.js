// backend/src/routes/memberProfile.routes.js

const router = require('express').Router();
const memberProfileController = require('../controllers/memberProfile.controller');
const { protect, authorize } = require('../middleware/auth.middleware');
const {
  verifiedCreatorOnly,
  checkVerificationLevel,
} = require('../middleware/verification.middleware');
const {
  checkDailyInteractionLimit,
  checkMessageQuota,
  preventSpam,
  bulkActionLimits,
} = require('../middleware/salesLimits.middleware');
const {
  anonymizeMemberData,
  checkMemberOptIn,
  respectBlockList,
  dataVisibilityRules,
} = require('../middleware/privacy.middleware');

// ====================================
// DISCOVERY ROUTES
// ====================================

/**
 * @route   GET /api/v1/creator/members/discover
 * @desc    Discover high-value members (whales and VIPs)
 * @access  Private - Verified Creators Only
 */
router.get(
  '/discover',
  protect,
  authorize('creator'),
  verifiedCreatorOnly,
  anonymizeMemberData,
  memberProfileController.getHighValueMembers
);

/**
 * @route   POST /api/v1/creator/members/search
 * @desc    Advanced search for members with filters
 * @access  Private - Verified Creators Only
 */
router.post(
  '/search',
  protect,
  authorize('creator'),
  verifiedCreatorOnly,
  anonymizeMemberData,
  memberProfileController.searchMembers
);

// ====================================
// MEMBER PROFILE ROUTES
// ====================================

/**
 * @route   GET /api/v1/creator/members/profile/:memberId
 * @desc    View detailed member profile with spending stats
 * @access  Private - Verified Creators Only
 */
router.get(
  '/profile/:memberId',
  protect,
  authorize('creator'),
  verifiedCreatorOnly,
  checkMemberOptIn,
  respectBlockList,
  dataVisibilityRules,
  memberProfileController.getMemberProfile
);

/**
 * @route   GET /api/v1/creator/members/profile/:memberId/history
 * @desc    Get interaction history with a member
 * @access  Private - Verified Creators Only
 */
router.get(
  '/profile/:memberId/history',
  protect,
  authorize('creator'),
  verifiedCreatorOnly,
  respectBlockList,
  memberProfileController.getMemberInteractionHistory
);

// ====================================
// INTERACTION ROUTES
// ====================================

/**
 * @route   POST /api/v1/creator/members/profile/:memberId/poke
 * @desc    Send a poke to a member (gentle nudge)
 * @access  Private - Verified Creators Only
 * @limits  50 pokes per day, 1 per member per 24 hours
 */
router.post(
  '/profile/:memberId/poke',
  protect,
  authorize('creator'),
  verifiedCreatorOnly,
  checkMemberOptIn,
  respectBlockList,
  checkDailyInteractionLimit('poke', 50),
  preventSpam,
  memberProfileController.pokeMember
);

/**
 * @route   POST /api/v1/creator/members/profile/:memberId/like
 * @desc    Like a member's profile
 * @access  Private - Verified Creators Only
 */
router.post(
  '/profile/:memberId/like',
  protect,
  authorize('creator'),
  verifiedCreatorOnly,
  checkMemberOptIn,
  respectBlockList,
  memberProfileController.likeMember
);

/**
 * @route   POST /api/v1/creator/members/profile/:memberId/message
 * @desc    Send personalized message to a member
 * @access  Private - Verified Creators Only
 * @limits  100 messages per day, 20 per hour
 */
router.post(
  '/profile/:memberId/message',
  protect,
  authorize('creator'),
  verifiedCreatorOnly,
  checkMemberOptIn,
  respectBlockList,
  checkMessageQuota,
  checkDailyInteractionLimit('message', 100),
  preventSpam,
  memberProfileController.sendMessageToMember
);

/**
 * @route   POST /api/v1/creator/members/profile/:memberId/special-offer
 * @desc    Send special offer to a member
 * @access  Private - Premium Creators Only
 * @limits  10 special offers per day
 */
router.post(
  '/profile/:memberId/special-offer',
  protect,
  authorize('creator'),
  verifiedCreatorOnly,
  checkVerificationLevel('premium'),
  checkMemberOptIn,
  respectBlockList,
  checkDailyInteractionLimit('special_offer', 10),
  memberProfileController.sendSpecialOffer
);

/**
 * @route   POST /api/v1/creator/members/profile/:memberId/view
 * @desc    Track profile view (silent tracking)
 * @access  Private - Verified Creators Only
 */
router.post(
  '/profile/:memberId/view',
  protect,
  authorize('creator'),
  verifiedCreatorOnly,
  memberProfileController.trackProfileView
);

// ====================================
// ANALYTICS ROUTES
// ====================================

/**
 * @route   GET /api/v1/creator/members/analytics
 * @desc    Get member analytics and conversion metrics
 * @access  Private - Verified Creators Only
 */
router.get(
  '/analytics',
  protect,
  authorize('creator'),
  verifiedCreatorOnly,
  memberProfileController.getMemberAnalytics
);

/**
 * @route   GET /api/v1/creator/members/segments
 * @desc    Get member segments (whales, VIPs, etc.)
 * @access  Private - Verified Creators Only
 */
router.get(
  '/segments',
  protect,
  authorize('creator'),
  verifiedCreatorOnly,
  memberProfileController.getMemberSegments
);

// ====================================
// BULK OPERATIONS (Premium Feature)
// ====================================

/**
 * @route   POST /api/v1/creator/members/bulk/message
 * @desc    Send bulk message to member segment
 * @access  Private - Premium Creators Only
 * @limits  1 bulk campaign per day, max 100 recipients
 */
router.post(
  '/bulk/message',
  protect,
  authorize('creator'),
  verifiedCreatorOnly,
  checkVerificationLevel('premium'),
  bulkActionLimits,
  memberProfileController.sendBulkMessage
);

/**
 * @route   POST /api/v1/creator/members/bulk/offer
 * @desc    Send bulk special offer to member segment
 * @access  Private - VIP Creators Only
 * @limits  1 bulk offer per week
 */
router.post(
  '/bulk/offer',
  protect,
  authorize('creator'),
  verifiedCreatorOnly,
  checkVerificationLevel('vip'),
  bulkActionLimits,
  memberProfileController.sendBulkOffer
);

module.exports = router;
