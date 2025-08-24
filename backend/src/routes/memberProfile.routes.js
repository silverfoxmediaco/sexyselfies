// memberProfile.routes.js - Routes for creators to view and interact with member profiles

const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth.middleware');
const { verifiedCreatorOnly } = require('../middleware/verification.middleware');

// Controllers
const {
  getMemberProfile,
  searchMembers,
  pokeMember,
  likeMember,
  sendMessageToMember,
  sendSpecialOffer,
  getMemberInteractionHistory,
  getHighValueMembers,
  getMemberAnalytics,
  trackProfileView
} = require('../controllers/memberProfile.controller');

// All routes require authenticated creator
router.use(protect);
router.use(authorize('creator'));

// Only verified creators can access member profiles
router.use(verifiedCreatorOnly);

// ============================================
// MEMBER DISCOVERY & SEARCH ROUTES
// ============================================

// Get high-value members (whales) - main discovery page
router.get('/discover', getHighValueMembers);
// Query params: ?spendingTier=whale&activityLevel=active&limit=20&page=1

// Search members with filters
router.post('/search', searchMembers);
/* Request body:
{
  filters: {
    minSpend30Days: 100,
    maxSpend30Days: 1000,
    activityLevel: ['Very Active', 'Active'],
    preferredContent: ['Photos', 'Videos'],
    category: ['Lifestyle', 'Fashion'],
    hasInteractedBefore: false,
    lastActiveWithin: 7 // days
  },
  sort: 'spending_desc', // or 'activity_desc', 'recent_active'
  limit: 20,
  page: 1
}
*/

// ============================================
// INDIVIDUAL MEMBER PROFILE ROUTES
// ============================================

// Get single member profile with spending stats
router.get('/profile/:memberId', getMemberProfile);
/* Response includes:
{
  member: {
    id,
    username,
    avatar,
    joinDate,
    lastActive,
    isOnline,
    stats: {
      last30DaySpend,
      totalSpend,
      averagePurchase,
      contentPurchases,
      favoriteCategory,
      activityLevel,
      responseRate,
      preferredContent
    },
    interactions: {
      previousPurchases,
      lastPurchase,
      hasSubscribed,
      tipsGiven
    },
    badges: []
  }
}
*/

// Get interaction history with specific member
router.get('/profile/:memberId/history', getMemberInteractionHistory);

// Track profile view (for analytics)
router.post('/profile/:memberId/view', trackProfileView);

// ============================================
// INTERACTION ROUTES
// ============================================

// Poke a member (gentle nudge)
router.post('/profile/:memberId/poke', pokeMember);
/* Creates notification for member:
"CreatorName poked you! Check out their profile"
*/

// Like a member (shows interest)
router.post('/profile/:memberId/like', likeMember);
/* Creates notification for member:
"CreatorName likes your profile!"
*/

// Send personalized message
router.post('/profile/:memberId/message', sendMessageToMember);
/* Request body:
{
  message: "Hi! I noticed you enjoy fitness content...",
  attachments: [] // optional media IDs
}
*/

// Send special offer
router.post('/profile/:memberId/special-offer', sendSpecialOffer);
/* Request body:
{
  offerType: 'discount', // or 'exclusive', 'bundle'
  discount: 25, // percentage
  contentIds: ['content1', 'content2'], // specific content
  expiresIn: 48, // hours
  message: "Special offer just for you!"
}
*/

// ============================================
// ANALYTICS ROUTES
// ============================================

// Get member analytics for creator dashboard
router.get('/analytics', getMemberAnalytics);
/* Response:
{
  totalHighValueMembers: 45,
  totalMemberInteractions: 234,
  conversionRate: 12.5, // % of interactions leading to purchases
  averageMemberValue: 125.50,
  topSpendingMembers: [...],
  mostActiveMembers: [...],
  recentInteractions: [...]
}
*/

// Get member segment analysis
router.get('/analytics/segments', async (req, res) => {
  try {
    const creatorId = req.user.id;
    
    // Analyze member segments
    const segments = await MemberAnalytics.getSegments(creatorId);
    
    res.json({
      success: true,
      segments: {
        whales: segments.whales, // $300+ monthly
        vip: segments.vip, // $100-300 monthly
        regular: segments.regular, // $50-100 monthly
        potential: segments.potential, // <$50 but active
        dormant: segments.dormant // inactive 30+ days
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching member segments'
    });
  }
});

// ============================================
// BULK ACTIONS ROUTES
// ============================================

// Send bulk message to member segment
router.post('/bulk/message', async (req, res) => {
  try {
    const creatorId = req.user.id;
    const { segment, message, offerDetails } = req.body;
    
    // Limit to prevent spam
    const dailyLimit = await checkDailyMessageLimit(creatorId);
    if (!dailyLimit.allowed) {
      return res.status(429).json({
        success: false,
        message: `Daily limit reached. ${dailyLimit.remaining} messages remaining.`
      });
    }
    
    // Send to segment
    const result = await sendBulkMessage(creatorId, segment, message, offerDetails);
    
    res.json({
      success: true,
      sent: result.sent,
      failed: result.failed
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error sending bulk messages'
    });
  }
});

// ============================================
// MIDDLEWARE FUNCTIONS
// ============================================

// Middleware to check if creator is verified
async function verifiedCreatorOnly(req, res, next) {
  try {
    const creator = await Creator.findById(req.user.id);
    
    if (!creator.isVerified) {
      return res.status(403).json({
        success: false,
        message: 'Only verified creators can access member profiles',
        verificationUrl: '/creator/verification'
      });
    }
    
    next();
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error checking verification status'
    });
  }
}

// Rate limiting for interactions
const rateLimit = require('express-rate-limit');

const interactionLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 50, // 50 interactions per hour
  message: 'Too many interactions. Please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

// Apply rate limiting to interaction routes
router.use('/profile/:memberId/poke', interactionLimiter);
router.use('/profile/:memberId/like', interactionLimiter);
router.use('/profile/:memberId/message', interactionLimiter);

// ============================================
// HELPER FUNCTIONS
// ============================================

async function checkDailyMessageLimit(creatorId) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const messageCount = await MemberInteraction.countDocuments({
    creator: creatorId,
    type: 'message',
    createdAt: { $gte: today }
  });
  
  const limit = 100; // Daily limit for messages
  
  return {
    allowed: messageCount < limit,
    remaining: Math.max(0, limit - messageCount)
  };
}

async function sendBulkMessage(creatorId, segment, message, offerDetails) {
  // Get members in segment
  const members = await getMembersBySegment(creatorId, segment);
  
  const results = {
    sent: [],
    failed: []
  };
  
  for (const member of members) {
    try {
      await sendMessageToMember(creatorId, member.id, message, offerDetails);
      results.sent.push(member.id);
    } catch (error) {
      results.failed.push({ memberId: member.id, error: error.message });
    }
  }
  
  return results;
}

async function getMembersBySegment(creatorId, segment) {
  const segmentFilters = {
    whales: { last30DaySpend: { $gte: 300 } },
    vip: { last30DaySpend: { $gte: 100, $lt: 300 } },
    regular: { last30DaySpend: { $gte: 50, $lt: 100 } },
    active: { lastActive: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } }
  };
  
  const filter = segmentFilters[segment] || {};
  
  return await Member.find({
    ...filter,
    'interactions.creators': creatorId
  }).limit(50); // Limit bulk actions
}

module.exports = router;