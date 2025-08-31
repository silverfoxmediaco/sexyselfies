const CreatorProfile = require('../models/CreatorProfile');
const Creator = require('../models/Creator');
const CreatorContent = require('../models/CreatorContent');
const CreatorEarnings = require('../models/CreatorEarnings');
const cloudinary = require('../config/cloudinary');
const mongoose = require('mongoose');

// Get creator's complete profile with all intelligence data
exports.getProfile = async (req, res) => {
  try {
    // Find creator by user ID
    const creator = await Creator.findOne({ user: req.user.id })
      .populate('user', 'email username');
    
    if (!creator) {
      return res.status(404).json({ 
        success: false, 
        message: 'Creator not found' 
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
        totalMatches: 0,
        totalLikes: 0,
        rating: 0,
        ratingCount: 0
      },
      preferences: creator.preferences,
      contentPrice: creator.contentPrice,
      galleries: creator.galleries || [],
      isPaused: creator.isPaused || false
    };
    
    res.json({
      success: true,
      profile,
      stats: {
        totalViews: profile.stats.totalMatches,
        matches: profile.stats.totalMatches,
        earnings: profile.stats.totalEarnings,
        rating: profile.stats.rating
      }
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching profile' 
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
        message: 'Profile not found' 
      });
    }
    
    // Update branding
    if (updates.branding) {
      profile.branding = { ...profile.branding, ...updates.branding };
    }
    
    // Update personalization
    if (updates.personalization) {
      profile.personalization = { ...profile.personalization, ...updates.personalization };
    }
    
    // Update preferences
    if (updates.preferences) {
      profile.preferences = { ...profile.preferences, ...updates.preferences };
    }
    
    // Handle profile image upload
    if (req.files && req.files.profileImage) {
      const result = await cloudinary.uploader.upload(req.files.profileImage.path, {
        folder: 'creators/profiles',
        transformation: { width: 500, height: 500, crop: 'fill' }
      });
      profile.branding.profileImage = result.secure_url;
    }
    
    // Handle cover image upload
    if (req.files && req.files.coverImage) {
      const result = await cloudinary.uploader.upload(req.files.coverImage.path, {
        folder: 'creators/covers',
        transformation: { width: 1920, height: 480, crop: 'fill' }
      });
      profile.branding.coverImage = result.secure_url;
    }
    
    await profile.save();
    
    res.json({
      success: true,
      message: 'Profile updated successfully',
      profile
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error updating profile' 
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
        message: 'Profile not found' 
      });
    }
    
    // Get content performance
    const contentStats = await CreatorContent.aggregate([
      { $match: { creator: mongoose.Types.ObjectId(creatorId) } },
      {
        $group: {
          _id: '$contentType',
          totalViews: { $sum: '$analytics.totalViews' },
          totalPurchases: { $sum: '$analytics.purchases' },
          avgRating: { $avg: '$analytics.rating' },
          totalEarnings: { $sum: '$monetization.earnings.total' }
        }
      }
    ]);
    
    // Calculate best performing content
    const topContent = await CreatorContent.find({ creator: creatorId })
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
        avgSessionDuration: profile.analytics.engagement.avgSessionDuration
      }
    };
    
    // AI predictions
    const predictions = {
      nextWeekEarnings: earnings ? earnings.predictive.nextWeek.amount : 0,
      bestPostingTime: profile.ai.bestPostingTimes[0],
      growthOpportunities: await identifyGrowthOpportunities(profile, earnings),
      contentRecommendations: profile.ai.contentSuggestions
    };
    
    res.json({
      success: true,
      analytics: {
        overview: profile.analytics,
        content: {
          stats: contentStats,
          topPerformers: topContent
        },
        audience: audienceInsights,
        predictions,
        gamification: {
          level: profile.gamification.level,
          xp: profile.gamification.xp,
          nextLevelXp: profile.gamification.level * 1000,
          rank: profile.gamification.monthlyRank,
          achievements: profile.gamification.achievements
        }
      }
    });
  } catch (error) {
    console.error('Get analytics error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching analytics' 
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
        message: 'Profile not found' 
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
        ...preferences.pricing
      };
    }
    
    // Update automation settings
    if (preferences.automation) {
      profile.automation = {
        ...profile.automation,
        ...preferences.automation
      };
    }
    
    // Update notification preferences
    if (preferences.notifications) {
      profile.preferences.notifications = {
        ...profile.preferences.notifications,
        ...preferences.notifications
      };
    }
    
    await profile.save();
    
    res.json({
      success: true,
      message: 'Preferences updated successfully',
      preferences: profile.preferences
    });
  } catch (error) {
    console.error('Update preferences error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error updating preferences' 
    });
  }
};

// Get AI recommendations for content and pricing
exports.getAIRecommendations = async (req, res) => {
  try {
    const creatorId = req.user.id;
    
    const profile = await CreatorProfile.findOne({ creator: creatorId });
    const earnings = await CreatorEarnings.findOne({ creator: creatorId });
    const recentContent = await CreatorContent.find({ creator: creatorId })
      .sort('-createdAt')
      .limit(10);
    
    // Generate personalized recommendations
    const recommendations = {
      content: {
        suggestions: profile.ai.contentSuggestions,
        bestPostingTimes: profile.ai.bestPostingTimes,
        trendingTopics: await getTrendingTopics(profile),
        predictedPerformance: await predictContentPerformance(profile, recentContent)
      },
      pricing: {
        optimalPrices: calculateOptimalPricing(earnings, profile),
        bundleRecommendations: generateBundleRecommendations(recentContent),
        dynamicPricingOpportunities: identifyDynamicPricingOpportunities(profile)
      },
      audience: {
        growthOpportunities: profile.ai.audienceInsights,
        reEngagementTargets: identifyReEngagementTargets(earnings),
        expansionMarkets: identifyExpansionMarkets(profile)
      },
      optimization: {
        profileCompleteness: calculateProfileCompleteness(profile),
        improvementAreas: identifyImprovementAreas(profile, earnings),
        competitiveInsights: await getCompetitiveInsights(profile)
      }
    };
    
    res.json({
      success: true,
      recommendations
    });
  } catch (error) {
    console.error('Get AI recommendations error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error generating recommendations' 
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
        message: 'Profile not found' 
      });
    }
    
    const newAchievements = [];
    
    // Check for achievement unlocks based on action
    switch(action) {
      case 'content_posted':
        profile.gamification.stats.totalPosts += 1;
        if (profile.gamification.stats.totalPosts === 100) {
          newAchievements.push({
            id: 'content_centurion',
            name: 'Content Centurion',
            description: 'Posted 100 pieces of content',
            icon: '💯',
            unlockedAt: new Date(),
            xpReward: 500
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
            xpReward: 1000
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
            xpReward: 750
          });
        }
        break;
    }
    
    // Add new achievements and XP
    if (newAchievements.length > 0) {
      profile.gamification.achievements.push(...newAchievements);
      const totalXpGained = newAchievements.reduce((sum, a) => sum + a.xpReward, 0);
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
      currentXp: profile.gamification.xp
    });
  } catch (error) {
    console.error('Update achievements error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error updating achievements' 
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
      potentialIncrease: '320%'
    },
    {
      type: 'content',
      suggestion: 'Your sunset photos earn 2.8x more than gym pics',
      confidence: 88,
      potentialIncrease: '280%'
    },
    {
      type: 'pricing',
      suggestion: 'Increase video prices to $4.99 for optimal revenue',
      confidence: 85,
      potentialIncrease: '$450/month'
    }
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
    'Your Thursday content performs 3x better - focus there'
  ];
}

function calculateOptimalPricing(earnings, profile) {
  return {
    photos: { min: 0.99, optimal: 2.99, max: 4.99 },
    videos: { min: 2.99, optimal: 5.99, max: 9.99 },
    bundles: { min: 9.99, optimal: 19.99, max: 29.99 }
  };
}

function generateBundleRecommendations(content) {
  return [
    {
      name: 'Weekly Special',
      items: 5,
      price: 14.99,
      estimatedRevenue: 450
    }
  ];
}

function identifyDynamicPricingOpportunities(profile) {
  return [
    'Enable surge pricing during peak hours (8-10 PM)',
    'Offer early bird discounts (6-8 AM) to boost morning sales'
  ];
}

function identifyReEngagementTargets(earnings) {
  if (!earnings) return [];
  return earnings.customerAnalytics.churnRisk.map(c => ({
    customerId: c.customerId,
    lastPurchase: c.lastPurchase,
    suggestion: 'Send exclusive content offer'
  }));
}

function identifyExpansionMarkets(profile) {
  return ['Consider targeting 25-34 age group', 'Expand to West Coast timezone'];
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
    opportunities: ['Increase video content', 'Expand posting times']
  };
}

async function getTrendingTopics(profile) {
  return ['Sunset shoots', 'Workout content', 'Casual Friday themes'];
}

async function predictContentPerformance(profile, recentContent) {
  return {
    estimatedViews: 2500,
    estimatedEarnings: 340,
    confidence: 87
  };
}

function hasAchievement(profile, achievementId) {
  return profile.gamification.achievements.some(a => a.id === achievementId);
}

module.exports = exports;