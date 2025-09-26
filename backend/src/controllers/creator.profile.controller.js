const CreatorProfile = require('../models/CreatorProfile');
const Creator = require('../models/Creator');
const Content = require('../models/Content');
const CreatorEarnings = require('../models/CreatorEarnings');
const { cloudinary } = require('../config/cloudinary');
const mongoose = require('mongoose');

// Get creator's complete profile with all intelligence data
exports.getProfile = async (req, res) => {
  try {
    // Find creator by user ID
    const creator = await Creator.findOne({ user: req.user.id }).populate(
      'user',
      'email username'
    );

    if (!creator) {
      return res.status(404).json({
        success: false,
        message: 'Creator not found',
      });
    }

    // Format profile data
    const profile = {
      _id: creator._id,
      user: creator.user,
      username: creator.username,
      displayName: creator.displayName,
      age: creator.age,
      birthDate: creator.birthDate,
      bio: creator.bio,
      profileImage: creator.profileImage,
      coverImage: creator.coverImage,
      location: creator.location,
      isVerified: creator.isVerified,
      verificationStatus: creator.verificationStatus,
      profileComplete: creator.profileComplete,
      stats: creator.stats || {
        totalEarnings: 0,
        monthlyEarnings: 0,
        totalConnections: 0,
        totalContent: 0,
        totalLikes: 0,
        rating: 0,
        ratingCount: 0,
      },
      contentPrice: creator.contentPrice,
      galleries: creator.galleries || [],
      isPaused: creator.isPaused || false,
    };

    res.json({
      success: true,
      profile,
      stats: {
        totalViews: profile.stats.totalConnections,
        connections: profile.stats.totalConnections,
        earnings: profile.stats.totalEarnings,
        rating: profile.stats.rating,
      },
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching profile',
    });
  }
};

// Setup creator profile with images - Initial profile creation
exports.setupProfile = async (req, res) => {
  try {
    console.log('🚀 SETUP PROFILE ENDPOINT HIT! Profile setup request received');
    console.log('Files:', req.files);
    console.log('Body:', req.body);

    // Find creator by user ID
    const creator = await Creator.findOne({ user: req.user.id });

    if (!creator) {
      return res.status(404).json({
        success: false,
        message: 'Creator not found',
      });
    }

    // Parse form data (sent as JSON string)
    let formData = {};
    if (req.body.data) {
      try {
        formData = JSON.parse(req.body.data);
      } catch (e) {
        console.error('Error parsing form data:', e);
        return res.status(400).json({
          success: false,
          message: 'Invalid form data',
        });
      }
    }

    // Handle image uploads
    let profileImageUrl = creator.profileImage;
    let coverImageUrl = creator.coverImage;

    console.log('📸 INITIAL VALUES:');
    console.log('📸 creator.profileImage:', creator.profileImage);
    console.log('📸 creator.coverImage:', creator.coverImage);
    console.log('📸 profileImageUrl (initial):', profileImageUrl);
    console.log('📸 coverImageUrl (initial):', coverImageUrl);

    console.log('🐛 DEBUG: req.files received:', req.files);
    console.log('🐛 DEBUG: req.body data:', req.body.data ? JSON.parse(req.body.data) : req.body);
    console.log('🔍 COVER IMAGE DEBUG: Checking for cover image upload...');
    console.log('🔍 req.files exists:', !!req.files);
    console.log('🔍 req.files.coverImage exists:', !!(req.files && req.files.coverImage));
    console.log('🔍 req.files.coverImage[0] exists:', !!(req.files && req.files.coverImage && req.files.coverImage[0]));
    if (req.files && req.files.coverImage) {
      console.log('🔍 coverImage array length:', req.files.coverImage.length);
      console.log('🔍 coverImage file details:', req.files.coverImage[0]);
    }

    // Upload profile photo if provided
    if (req.files && req.files.profilePhoto && req.files.profilePhoto[0]) {
      try {
        const result = await cloudinary.uploader.upload(
          req.files.profilePhoto[0].path,
          {
            folder: 'sexyselfies/profiles',
            public_id: `profile_${creator._id}_${Date.now()}`,
            overwrite: true,
            quality: 'auto',
            fetch_format: 'auto',
          }
        );
        profileImageUrl = result.secure_url;
        console.log('Profile image uploaded:', result.secure_url);
      } catch (uploadError) {
        console.error('Profile image upload error:', uploadError);
      }
    }

    // Upload cover image if provided
    if (req.files && req.files.coverImage && req.files.coverImage[0]) {
      try {
        console.log('🔵 Starting cover image upload for creator:', creator._id);
        const result = await cloudinary.uploader.upload(
          req.files.coverImage[0].path,
          {
            folder: 'sexyselfies/covers',
            public_id: `cover_${creator._id}_${Date.now()}`,
            overwrite: true,
            quality: 'auto',
            fetch_format: 'auto',
          }
        );
        coverImageUrl = result.secure_url;
        console.log('✅ Cover image uploaded successfully:', result.secure_url);
      } catch (uploadError) {
        console.error('❌ Cover image upload error:', uploadError);
      }
    }

    // Update creator profile
    const updates = {
      displayName: formData.displayName || creator.displayName,
      bio: formData.bio || creator.bio,
      profileImage: profileImageUrl,
      coverImage: coverImageUrl,
      profileComplete: true,
      // Creator identity (root level)
      gender: formData.gender,
      orientation: formData.orientation,
      bodyType: formData.bodyType,
      ethnicity: formData.ethnicity,
      contentTypes: formData.contentTypes || {},
      pricing: formData.pricing || {},
      automation: formData.automation || {},
      instantPayout: formData.instantPayout || false,
    };

    console.log('🔶 BEFORE DATABASE UPDATE:');
    console.log('🔶 Creator ID:', creator._id);
    console.log('🔶 coverImageUrl variable:', coverImageUrl);
    console.log('🔶 updates.coverImage:', updates.coverImage);
    console.log('🔶 Full updates object:', JSON.stringify(updates, null, 2));

    const updatedCreator = await Creator.findByIdAndUpdate(
      creator._id,
      { $set: updates },
      { new: true }
    );

    console.log('🔶 AFTER DATABASE UPDATE:');
    console.log('🔶 updatedCreator.coverImage:', updatedCreator.coverImage);
    console.log('🔶 updatedCreator.profileImage:', updatedCreator.profileImage);
    console.log('🔶 Database update operation completed successfully');

    // Verify with a fresh database query
    const verifyCreator = await Creator.findById(creator._id).select('coverImage profileImage displayName');
    console.log('🔍 VERIFICATION QUERY:');
    console.log('🔍 Fresh DB query coverImage:', verifyCreator.coverImage);
    console.log('🔍 Fresh DB query profileImage:', verifyCreator.profileImage);
    console.log('🔍 Fresh DB query displayName:', verifyCreator.displayName);

    const responseData = {
      success: true,
      message: 'Profile setup completed successfully',
      creator: {
        id: updatedCreator._id,
        displayName: updatedCreator.displayName,
        profileImage: updatedCreator.profileImage,
        coverImage: updatedCreator.coverImage,
        profileComplete: updatedCreator.profileComplete,
      },
    };

    console.log('📤 RESPONSE DATA:');
    console.log('📤 Sending response with coverImage:', responseData.creator.coverImage);
    console.log('📤 Sending response with profileImage:', responseData.creator.profileImage);

    res.json(responseData);
  } catch (error) {
    console.error('Profile setup error:', error);
    res.status(500).json({
      success: false,
      message: 'Error setting up profile',
      error: error.message,
    });
  }
};

// Update creator profile with brand customization
exports.updateProfile = async (req, res) => {
  try {
    const creatorId = req.user.id;
    const updates = req.body;

    const profile = await CreatorProfile.findOne({ creator: creatorId });

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: 'Profile not found',
      });
    }

    // Update branding
    if (updates.branding) {
      profile.branding = { ...profile.branding, ...updates.branding };
    }

    // Update personalization
    if (updates.personalization) {
      profile.personalization = {
        ...profile.personalization,
        ...updates.personalization,
      };
    }

    // Update preferences
    if (updates.preferences) {
      profile.preferences = { ...profile.preferences, ...updates.preferences };
    }

    // Handle profile image upload
    if (req.files && req.files.profileImage && req.files.profileImage[0]) {
      const result = await cloudinary.uploader.upload(
        req.files.profileImage[0].path,
        {
          folder: 'creators/profiles',
          transformation: { width: 500, height: 500, crop: 'fill' },
        }
      );
      profile.branding.profileImage = result.secure_url;
    }

    // Handle cover image upload
    if (req.files && req.files.coverImage && req.files.coverImage[0]) {
      const result = await cloudinary.uploader.upload(
        req.files.coverImage[0].path,
        {
          folder: 'creators/covers',
          transformation: { width: 1920, height: 480, crop: 'fill' },
        }
      );
      profile.branding.coverImage = result.secure_url;
    }

    await profile.save();

    res.json({
      success: true,
      message: 'Profile updated successfully',
      profile,
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating profile',
    });
  }
};

// Get creator analytics with AI insights
exports.getAnalytics = async (req, res) => {
  try {
    const creatorId = req.user.id;
    const { period = '7d' } = req.query;

    const profile = await CreatorProfile.findOne({ creator: creatorId });
    const earnings = await CreatorEarnings.findOne({ creator: creatorId });

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: 'Profile not found',
      });
    }

    // Get content performance
    const contentStats = await Content.aggregate([
      { $match: { creator: mongoose.Types.ObjectId(creatorId) } },
      {
        $group: {
          _id: '$contentType',
          totalViews: { $sum: '$analytics.totalViews' },
          totalPurchases: { $sum: '$analytics.purchases' },
          avgRating: { $avg: '$analytics.rating' },
          totalEarnings: { $sum: '$monetization.earnings.total' },
        },
      },
    ]);

    // Calculate best performing content
    const topContent = await Content.find({ creator: creatorId })
      .sort('-monetization.earnings.total')
      .limit(5)
      .select('title contentType analytics monetization ai');

    // Get audience insights
    const audienceInsights = {
      demographics: profile.analytics.audience.demographics,
      topSpenders: earnings ? earnings.customerAnalytics.topSpenders : [],
      engagement: {
        messageRate: profile.analytics.engagement.messageResponseRate,
        repeatPurchaseRate: calculateRepeatPurchaseRate(earnings),
        avgSessionDuration: profile.analytics.engagement.avgSessionDuration,
      },
    };

    // AI predictions
    const predictions = {
      nextWeekEarnings: earnings ? earnings.predictive.nextWeek.amount : 0,
      bestPostingTime: profile.ai.bestPostingTimes[0],
      growthOpportunities: await identifyGrowthOpportunities(profile, earnings),
      contentRecommendations: profile.ai.contentSuggestions,
    };

    res.json({
      success: true,
      analytics: {
        overview: profile.analytics,
        content: {
          stats: contentStats,
          topPerformers: topContent,
        },
        audience: audienceInsights,
        predictions,
        gamification: {
          level: profile.gamification.level,
          xp: profile.gamification.xp,
          nextLevelXp: profile.gamification.level * 1000,
          rank: profile.gamification.monthlyRank,
          achievements: profile.gamification.achievements,
        },
      },
    });
  } catch (error) {
    console.error('Get analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching analytics',
    });
  }
};

// Update creator preferences and discovery settings
exports.updatePreferences = async (req, res) => {
  try {
    const creatorId = req.user.id;
    const { preferences } = req.body;

    const profile = await CreatorProfile.findOne({ creator: creatorId });

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: 'Profile not found',
      });
    }

    // Update content preferences
    if (preferences.contentTypes) {
      profile.preferences.contentTypes = preferences.contentTypes;
    }

    // Update pricing strategy
    if (preferences.pricing) {
      profile.preferences.pricing = {
        ...profile.preferences.pricing,
        ...preferences.pricing,
      };
    }

    // Update automation settings
    if (preferences.automation) {
      profile.automation = {
        ...profile.automation,
        ...preferences.automation,
      };
    }

    // Update notification preferences
    if (preferences.notifications) {
      profile.preferences.notifications = {
        ...profile.preferences.notifications,
        ...preferences.notifications,
      };
    }

    await profile.save();

    res.json({
      success: true,
      message: 'Preferences updated successfully',
      preferences: profile.preferences,
    });
  } catch (error) {
    console.error('Update preferences error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating preferences',
    });
  }
};

// Get AI recommendations for content and pricing
exports.getAIRecommendations = async (req, res) => {
  try {
    const creatorId = req.user.id;

    const profile = await CreatorProfile.findOne({ creator: creatorId });
    const earnings = await CreatorEarnings.findOne({ creator: creatorId });
    const recentContent = await Content.find({ creator: creatorId })
      .sort('-createdAt')
      .limit(10);

    // Generate personalized recommendations
    const recommendations = {
      content: {
        suggestions: profile.ai.contentSuggestions,
        bestPostingTimes: profile.ai.bestPostingTimes,
        trendingTopics: await getTrendingTopics(profile),
        predictedPerformance: await predictContentPerformance(
          profile,
          recentContent
        ),
      },
      pricing: {
        optimalPrices: calculateOptimalPricing(earnings, profile),
        bundleRecommendations: generateBundleRecommendations(recentContent),
        dynamicPricingOpportunities:
          identifyDynamicPricingOpportunities(profile),
      },
      audience: {
        growthOpportunities: profile.ai.audienceInsights,
        reEngagementTargets: identifyReEngagementTargets(earnings),
        expansionMarkets: identifyExpansionMarkets(profile),
      },
      optimization: {
        profileCompleteness: calculateProfileCompleteness(profile),
        improvementAreas: identifyImprovementAreas(profile, earnings),
        competitiveInsights: await getCompetitiveInsights(profile),
      },
    };

    res.json({
      success: true,
      recommendations,
    });
  } catch (error) {
    console.error('Get AI recommendations error:', error);
    res.status(500).json({
      success: false,
      message: 'Error generating recommendations',
    });
  }
};

// Track achievement progress and unlock new ones
exports.updateAchievements = async (req, res) => {
  try {
    const creatorId = req.user.id;
    const { action, value } = req.body;

    const profile = await CreatorProfile.findOne({ creator: creatorId });

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: 'Profile not found',
      });
    }

    const newAchievements = [];

    // Check for achievement unlocks based on action
    switch (action) {
      case 'content_posted':
        profile.gamification.stats.totalPosts += 1;
        if (profile.gamification.stats.totalPosts === 100) {
          newAchievements.push({
            id: 'content_centurion',
            name: 'Content Centurion',
            description: 'Posted 100 pieces of content',
            icon: '💯',
            unlockedAt: new Date(),
            xpReward: 500,
          });
        }
        break;

      case 'earnings_milestone':
        if (value >= 1000 && !hasAchievement(profile, 'first_thousand')) {
          newAchievements.push({
            id: 'first_thousand',
            name: 'Four Figure Creator',
            description: 'Earned your first $1,000',
            icon: '💰',
            unlockedAt: new Date(),
            xpReward: 1000,
          });
        }
        break;

      case 'fan_milestone':
        profile.gamification.stats.totalFans = value;
        if (value >= 100 && !hasAchievement(profile, 'century_fans')) {
          newAchievements.push({
            id: 'century_fans',
            name: 'Fan Favorite',
            description: 'Reached 100 fans',
            icon: '🌟',
            unlockedAt: new Date(),
            xpReward: 750,
          });
        }
        break;
    }

    // Add new achievements and XP
    if (newAchievements.length > 0) {
      profile.gamification.achievements.push(...newAchievements);
      const totalXpGained = newAchievements.reduce(
        (sum, a) => sum + a.xpReward,
        0
      );
      profile.gamification.xp += totalXpGained;

      // Check for level up
      const newLevel = Math.floor(profile.gamification.xp / 1000) + 1;
      if (newLevel > profile.gamification.level) {
        profile.gamification.level = newLevel;
        profile.gamification.lastLevelUp = new Date();
      }
    }

    await profile.save();

    res.json({
      success: true,
      newAchievements,
      currentLevel: profile.gamification.level,
      currentXp: profile.gamification.xp,
    });
  } catch (error) {
    console.error('Update achievements error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating achievements',
    });
  }
};

// Helper functions
async function getActiveViewerCount(creatorId) {
  // Implementation would check active sessions/websocket connections
  return Math.floor(Math.random() * 50) + 5;
}

function calculateConversionRate(profile) {
  const views = profile.analytics.performance.totalViews || 1;
  const purchases = profile.analytics.performance.totalPurchases || 0;
  return ((purchases / views) * 100).toFixed(2);
}

async function generateAIContentSuggestions(profile) {
  // AI logic to analyze performance and suggest content
  return [
    {
      type: 'timing',
      suggestion: 'Post at 8:47 PM for 3.2x more engagement',
      confidence: 92,
      potentialIncrease: '320%',
    },
    {
      type: 'content',
      suggestion: 'Your sunset photos earn 2.8x more than gym pics',
      confidence: 88,
      potentialIncrease: '280%',
    },
    {
      type: 'pricing',
      suggestion: 'Increase video prices to $4.99 for optimal revenue',
      confidence: 85,
      potentialIncrease: '$450/month',
    },
  ];
}

function calculateRepeatPurchaseRate(earnings) {
  if (!earnings) return 0;
  const total = earnings.customerAnalytics.totalCustomers || 1;
  const repeat = earnings.customerAnalytics.repeatCustomers || 0;
  return ((repeat / total) * 100).toFixed(2);
}

async function identifyGrowthOpportunities(profile, earnings) {
  return [
    'Enable bundle pricing to increase average order value by 45%',
    'Post 2 more times this week to maintain top 10 ranking',
    'Your Thursday content performs 3x better - focus there',
  ];
}

function calculateOptimalPricing(earnings, profile) {
  return {
    photos: { min: 0.99, optimal: 2.99, max: 4.99 },
    videos: { min: 2.99, optimal: 5.99, max: 9.99 },
    bundles: { min: 9.99, optimal: 19.99, max: 29.99 },
  };
}

function generateBundleRecommendations(content) {
  return [
    {
      name: 'Weekly Special',
      items: 5,
      price: 14.99,
      estimatedRevenue: 450,
    },
  ];
}

function identifyDynamicPricingOpportunities(profile) {
  return [
    'Enable surge pricing during peak hours (8-10 PM)',
    'Offer early bird discounts (6-8 AM) to boost morning sales',
  ];
}

function identifyReEngagementTargets(earnings) {
  if (!earnings) return [];
  return earnings.customerAnalytics.churnRisk.map(c => ({
    customerId: c.customerId,
    lastPurchase: c.lastPurchase,
    suggestion: 'Send exclusive content offer',
  }));
}

function identifyExpansionMarkets(profile) {
  return [
    'Consider targeting 25-34 age group',
    'Expand to West Coast timezone',
  ];
}

function calculateProfileCompleteness(profile) {
  let complete = 0;
  let total = 10;

  if (profile.branding.profileImage) complete++;
  if (profile.branding.coverImage) complete++;
  if (profile.branding.bio) complete++;
  if (profile.personalization.welcomeMessage) complete++;
  if (profile.preferences.contentTypes.length > 0) complete++;
  if (profile.branding.brandColors.primary) complete++;
  if (profile.automation.welcomeMessage.enabled) complete++;
  if (profile.preferences.pricing.strategy) complete++;
  if (profile.branding.displayName) complete++;
  if (profile.personalization.customCSS) complete++;

  return (complete / total) * 100;
}

function identifyImprovementAreas(profile, earnings) {
  const areas = [];

  if (!profile.branding.coverImage) {
    areas.push('Add a cover image to increase profile views by 40%');
  }
  if (!profile.automation.welcomeMessage.enabled) {
    areas.push('Enable welcome messages to boost engagement by 25%');
  }
  if (profile.analytics.engagement.messageResponseRate < 50) {
    areas.push('Improve message response rate for better fan retention');
  }

  return areas;
}

async function getCompetitiveInsights(profile) {
  return {
    ranking: profile.gamification.monthlyRank,
    percentile: `Top ${Math.min(100, profile.gamification.monthlyRank)}%`,
    strengths: ['High engagement rate', 'Consistent posting'],
    opportunities: ['Increase video content', 'Expand posting times'],
  };
}

async function getTrendingTopics(profile) {
  return ['Sunset shoots', 'Workout content', 'Casual Friday themes'];
}

async function predictContentPerformance(profile, recentContent) {
  return {
    estimatedViews: 2500,
    estimatedEarnings: 340,
    confidence: 87,
  };
}

// Get public creator profile by username (for member viewing)
exports.getProfileByUsername = async (req, res) => {
  try {
    const { username } = req.params;

    // Find creator by username
    const creator = await Creator.findOne({ username })
      .populate('user', 'email username')
      .select('-verificationDocuments -payoutDetails'); // Exclude private fields

    if (!creator) {
      return res.status(404).json({
        success: false,
        message: 'Creator not found',
      });
    }

    // Get creator's content (sample for preview)
    const content = await Content.find({
      creator: creator._id,
      isActive: true,
    })
      .limit(20)
      .select('type price thumbnails createdAt views likes');

    // Format public profile data
    const publicProfile = {
      _id: creator._id,
      username: creator.username,
      displayName: creator.displayName,
      age: creator.age,
      bio: creator.bio,
      profileImage: creator.profileImage,
      coverImage: creator.coverImage,
      location: creator.location?.country
        ? { country: creator.location.country }
        : null,
      isVerified: creator.isVerified,
      stats: {
        totalLikes: creator.stats?.totalLikes || 0,
        rating: creator.stats?.rating || 0,
        ratingCount: creator.stats?.ratingCount || 0,
        contentCount: content.length,
      },
      contentPrice: creator.contentPrice,
      isPaused: creator.isPaused || false,
      content: content,
    };

    res.json({
      success: true,
      data: publicProfile,
    });
  } catch (error) {
    console.error('Get profile by username error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching creator profile',
    });
  }
};

// Update profile photo
exports.updateProfilePhoto = async (req, res) => {
  try {
    console.log('Profile photo upload request received');
    console.log('User ID:', req.user?.id);
    console.log('Files:', req.files);
    console.log('File:', req.file);
    console.log('Body:', req.body);

    const creatorId = req.user.id;

    // Check if file was uploaded (handle both single file and fields middleware)
    const file =
      req.file ||
      (req.files && req.files.profilePhoto && req.files.profilePhoto[0]);
    if (!file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded',
      });
    }

    // Find creator
    const creator = await Creator.findOne({ user: creatorId });
    if (!creator) {
      return res.status(404).json({
        success: false,
        message: 'Creator not found',
      });
    }

    // Upload to Cloudinary
    const uploadResult = await cloudinary.uploader.upload(file.path, {
      folder: `sexyselfies/creators/${creatorId}`,
      public_id: `profile_${Date.now()}`,
      transformation: [
        { width: 400, height: 400, crop: 'fill', gravity: 'face' },
        { quality: 'auto', fetch_format: 'auto' },
      ],
    });

    // Update creator profile image
    creator.profileImage = uploadResult.secure_url;
    await creator.save();

    console.log('Profile photo updated successfully:', uploadResult.secure_url);

    res.json({
      success: true,
      message: 'Profile photo updated successfully',
      data: {
        profileImage: uploadResult.secure_url,
      },
    });
  } catch (error) {
    console.error('Update profile photo error:', error);
    console.error('Error details:', error.message);
    console.error('Error stack:', error.stack);
    res.status(500).json({
      success: false,
      message: 'Error updating profile photo',
      error:
        process.env.NODE_ENV === 'development'
          ? error.message
          : 'Internal server error',
    });
  }
};

function hasAchievement(profile, achievementId) {
  return profile.gamification.achievements.some(a => a.id === achievementId);
}

// Update cover image
exports.updateCoverImage = async (req, res) => {
  try {
    console.log('Cover image upload request received');
    console.log('User ID:', req.user?.id);
    console.log('Files:', req.files);
    console.log('File:', req.file);

    const creatorId = req.user.id;

    // Check if file was uploaded
    const file =
      req.file ||
      (req.files && req.files.coverImage && req.files.coverImage[0]);

    if (!file) {
      return res.status(400).json({
        success: false,
        message: 'No cover image file uploaded',
      });
    }

    // Find creator
    const creator = await Creator.findOne({ user: creatorId });
    if (!creator) {
      return res.status(404).json({
        success: false,
        message: 'Creator not found',
      });
    }

    // Upload to Cloudinary with cover image dimensions
    const uploadResult = await cloudinary.uploader.upload(file.path, {
      folder: `sexyselfies/creators/${creatorId}`,
      public_id: `cover_${Date.now()}`,
      transformation: [
        { width: 1920, height: 480, crop: 'fill', gravity: 'center' },
        { quality: 'auto', fetch_format: 'auto' },
      ],
    });

    // Update creator cover image
    creator.coverImage = uploadResult.secure_url;
    await creator.save();

    console.log('Cover image updated successfully:', uploadResult.secure_url);

    res.json({
      success: true,
      message: 'Cover image updated successfully',
      data: {
        coverImage: uploadResult.secure_url,
      },
    });
  } catch (error) {
    console.error('Cover image upload error:', error);
    res.status(500).json({
      success: false,
      message: 'Error uploading cover image',
      error: error.message,
    });
  }
};

// Update both profile and cover images
exports.updateProfileImages = async (req, res) => {
  try {
    console.log('Profile images upload request received');
    console.log('User ID:', req.user?.id);
    console.log('Files:', req.files);

    const creatorId = req.user.id;
    const results = {};

    // Find creator
    const creator = await Creator.findOne({ user: creatorId });
    if (!creator) {
      return res.status(404).json({
        success: false,
        message: 'Creator not found',
      });
    }

    // Handle profile photo upload
    const profileFile =
      req.files && req.files.profilePhoto && req.files.profilePhoto[0];

    if (profileFile) {
      const profileUploadResult = await cloudinary.uploader.upload(profileFile.path, {
        folder: `sexyselfies/creators/${creatorId}`,
        public_id: `profile_${Date.now()}`,
        transformation: [
          { width: 400, height: 400, crop: 'fill', gravity: 'face' },
          { quality: 'auto', fetch_format: 'auto' },
        ],
      });

      creator.profileImage = profileUploadResult.secure_url;
      results.profileImage = profileUploadResult.secure_url;
    }

    // Handle cover image upload
    const coverFile =
      req.files && req.files.coverImage && req.files.coverImage[0];

    if (coverFile) {
      const coverUploadResult = await cloudinary.uploader.upload(coverFile.path, {
        folder: `sexyselfies/creators/${creatorId}`,
        public_id: `cover_${Date.now()}`,
        transformation: [
          { width: 1920, height: 480, crop: 'fill', gravity: 'center' },
          { quality: 'auto', fetch_format: 'auto' },
        ],
      });

      creator.coverImage = coverUploadResult.secure_url;
      results.coverImage = coverUploadResult.secure_url;
    }

    // Check if at least one image was uploaded
    if (!profileFile && !coverFile) {
      return res.status(400).json({
        success: false,
        message: 'No image files uploaded',
      });
    }

    // Save creator with updated images
    await creator.save();

    console.log('Profile images updated successfully:', results);

    res.json({
      success: true,
      message: 'Profile images updated successfully',
      data: results,
    });
  } catch (error) {
    console.error('Profile images upload error:', error);
    res.status(500).json({
      success: false,
      message: 'Error uploading profile images',
      error: error.message,
    });
  }
};

module.exports = exports;
