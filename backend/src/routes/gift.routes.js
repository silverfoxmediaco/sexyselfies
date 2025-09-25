// backend/src/routes/gift.routes.js
// Member-side gift routes

const router = require('express').Router();
const giftController = require('../controllers/gift.controller');
const { protect, authorize } = require('../middleware/auth.middleware');

// ====================================
// MEMBER GIFT ROUTES
// ====================================

/**
 * @route   GET /api/v1/member/gifts/received
 * @desc    Get gifts received by the member
 * @access  Private - Members Only
 */
router.get(
  '/received',
  protect,
  authorize('member'),
  giftController.getMemberGifts
);

/**
 * @route   GET /api/v1/member/gifts/:giftId/view
 * @desc    View a specific gift and mark as viewed
 * @access  Private - Members Only
 */
router.get(
  '/:giftId/view',
  protect,
  authorize('member'),
  giftController.viewGift
);

/**
 * @route   POST /api/v1/member/gifts/:giftId/click-through
 * @desc    Track click-through to creator profile from gift
 * @access  Private - Members Only
 */
router.post(
  '/:giftId/click-through',
  protect,
  authorize('member'),
  giftController.trackClickThrough
);

module.exports = router;