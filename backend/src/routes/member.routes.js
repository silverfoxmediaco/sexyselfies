const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth.middleware');

const {
  getMemberProfile,
  updateMemberProfile,
  updatePreferences,
  completeProfile,
  purchaseContent,
  getPurchasedContent,
  likeCreator,
  passCreator,
  // superLikeCreator // Super Like feature disabled
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
router.post('/complete-profile', completeProfile);

// ==========================================
// CREATOR DISCOVERY & PROFILES
// ==========================================
router.get('/creator/:identifier', async (req, res) => {
  try {
    const { identifier } = req.params;
    console.log('🔍 Looking for creator:', identifier);

    // Import Creator model
    const Creator = require('../models/Creator');
    const Content = require('../models/Content');
    const mongoose = require('mongoose');

    // Check if identifier is an ObjectId (24 character hex string)
    const isObjectId =
      mongoose.Types.ObjectId.isValid(identifier) && identifier.length === 24;

    let query;
    if (isObjectId) {
      // Search by ObjectId
      query = { _id: identifier };
      console.log('🔍 Searching by ObjectId:', identifier);
    } else {
      // Search by username or displayName
      query = {
        $or: [{ username: identifier }, { displayName: identifier }],
      };
      console.log('🔍 Searching by username/displayName:', identifier);
    }

    // Find creator
    const creator = await Creator.findOne(query).populate(
      'user',
      'email lastLogin'
    );

    if (!creator) {
      return res.status(404).json({
        success: false,
        message: 'Creator not found',
      });
    }


    // Get creator's content (public previews and locked content)
    const content = await Content.find({
      creator: creator._id,
    })
      .select('title description price media thumbnail createdAt type isFree')
      .sort({ createdAt: -1 })
      .limit(20);

    // Transform creator data for public view
    const creatorProfile = {
      id: creator._id,
      username: creator.username,
      displayName: creator.displayName,
      bio: creator.bio,
      profileImage: creator.profileImage,
      coverImage: creator.coverImage,
      age: creator.age,
      gender: creator.gender,
      orientation: creator.orientation,
      bodyType: creator.bodyType,
      ethnicity: creator.ethnicity,
      isVerified: creator.isVerified,
      isOnline: creator.lastActive > new Date(Date.now() - 15 * 60 * 1000), // Online if active in last 15 min
      lastActive: creator.lastActive,
      location: creator.location,
      contentPrice: creator.contentPrice,
      stats: creator.stats,
      preferences: creator.preferences,
      createdAt: creator.createdAt,
    };

    res.status(200).json({
      success: true,
      data: {
        creator: creatorProfile,
        content: content,
      },
    });
  } catch (error) {
    console.error('Error fetching creator profile:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
});

// ==========================================
// CONTENT & PURCHASES (Direct Payment)
// ==========================================
router.post('/purchase/:contentId', purchaseContent);
router.get('/purchased', getPurchasedContent);

// Browse creators based on member preferences only
router.get('/browse-creators', async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const member = req.user; // Current member from auth middleware

    // Import models
    const Creator = require('../models/Creator');

    // Get member's preferences
    const memberInterestedIn = member.preferences?.interestedIn || ['everyone'];
    const memberAgeRange = member.preferences?.ageRange || { min: 18, max: 99 };

    // Build creator gender filter based on member preferences
    let genderFilter = {};
    if (!memberInterestedIn.includes('everyone')) {
      const allowedGenders = [];
      if (memberInterestedIn.includes('male')) allowedGenders.push('male');
      if (memberInterestedIn.includes('female')) allowedGenders.push('female');

      if (allowedGenders.length > 0) {
        genderFilter = { gender: { $in: allowedGenders } };
      }
    }

    // Base query: verified creators with complete profiles
    const baseQuery = {
      isVerified: true,
      profileComplete: true,
      age: {
        $gte: memberAgeRange.min,
        $lte: memberAgeRange.max
      },
      ...genderFilter
    };

    const creators = await Creator.find(baseQuery)
      .select('username displayName bio profileImage age isVerified gender orientation bodyType')
      .sort({ 'analytics.views.total': -1, createdAt: -1 }) // Popular first
      .limit(limit * 1)
      .skip((page - 1) * limit);

    // Transform for response
    const transformedCreators = creators.map(creator => ({
      id: creator._id,
      username: creator.username,
      displayName: creator.displayName,
      bio: creator.bio,
      profileImage: creator.profileImage,
      age: creator.age,
      isVerified: creator.isVerified,
      gender: creator.gender,
      orientation: creator.orientation,
      bodyType: creator.bodyType
    }));

    res.status(200).json({
      success: true,
      data: transformedCreators,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: await Creator.countDocuments(baseQuery)
      }
    });

  } catch (error) {
    console.error('Browse creators error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching creators',
      error: error.message
    });
  }
});

// ==========================================
// SWIPING ACTIONS
// ==========================================
router.post('/swipe/like/:creatorId', likeCreator);
router.post('/swipe/pass/:creatorId', passCreator);
// router.post('/swipe/superlike/:creatorId', superLikeCreator); // Super Like feature disabled

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
