const express = require('express');
const router = express.Router();
const Creator = require('../models/Creator');
const CreatorProfile = require('../models/CreatorProfile');
const Content = require('../models/Content');
const CreatorAnalytics = require('../models/CreatorAnalytics');
const { rateLimiter } = require('../middleware/rateLimit.middleware');
const { cacheMiddleware } = require('../middleware/cache.middleware');

// ==========================================
// PUBLIC DISCOVERY ROUTES
// ==========================================

// Get trending creators
router.get('/trending',
  cacheMiddleware(300), // Cache for 5 minutes
  async (req, res) => {
    try {
      const { 
        limit = 20,
        category,
        orientation,
        gender
      } = req.query;
      
      // Build query
      const query = {
        isPaused: { $ne: true }, // Not paused
        isVerified: true
      };
      
      if (category) query.category = category;
      if (orientation) query.orientation = orientation;
      if (gender) query.gender = gender;
      
      // Get trending creators from analytics
      const trendingAnalytics = await CreatorAnalytics.find({
        'realTime.trending.isTrending': true
      })
        .sort('-realTime.trending.trendingScore')
        .limit(parseInt(limit))
        .populate('creator', 'username profileImage bio isVerified');
      
      const creators = trendingAnalytics.map(analytics => ({
        id: analytics.creator._id,
        username: analytics.creator.username,
        profileImage: analytics.creator.profileImage,
        bio: analytics.creator.bio,
        verified: analytics.creator.isVerified,
        trendingScore: analytics.realTime.trending.trendingScore,
        trendingPosition: analytics.realTime.trending.trendingPosition,
        category: analytics.realTime.trending.trendingCategory,
        stats: {
          contentCount: analytics.contentPerformance.byType.photos.total + 
                       analytics.contentPerformance.byType.videos.total,
          avgRating: 4.5, // Would calculate from actual ratings
          priceRange: {
            min: 0.99,
            max: 9.99
          }
        }
      }));
      
      res.json({
        success: true,
        creators,
        total: creators.length
      });
    } catch (error) {
      console.error('Get trending error:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching trending creators'
      });
    }
  }
);

// Browse all public creators with filters
router.get('/creator',
  cacheMiddleware(300),
  async (req, res) => {
    try {
      const {
        page = 1,
        limit = 20,
        category,
        orientation,
        gender,
        ageMin,
        ageMax,
        sortBy = 'popular', // popular, newest, active
        priceRange,
        contentType
      } = req.query;
      
      const skip = (page - 1) * limit;
      
      // Build query
      const query = {
        isPaused: { $ne: true }, // Not paused
        isVerified: true
      };
      
      if (category) query.category = category;
      if (orientation) query.orientation = orientation;
      if (gender) query.gender = gender;
      
      if (ageMin || ageMax) {
        query.age = {};
        if (ageMin) query.age.$gte = parseInt(ageMin);
        if (ageMax) query.age.$lte = parseInt(ageMax);
      }
      
      // Determine sort
      let sort = {};
      switch(sortBy) {
        case 'newest':
          sort = { createdAt: -1 };
          break;
        case 'active':
          sort = { lastActive: -1 };
          break;
        case 'popular':
        default:
          sort = { 'stats.totalFollowers': -1 };
      }
      
      const creators = await Creator.find(query)
        .select('username profileImage bio age location category orientation gender isVerified stats')
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit));
      
      const total = await Creator.countDocuments(query);
      
      // Enrich with basic profile data
      const enrichedCreators = await Promise.all(creators.map(async (creator) => {
        const profile = await CreatorProfile.findOne({ creator: creator._id })
          .select('branding.displayName branding.tagline preferences.pricing analytics.performance.rating');
        
        return {
          id: creator._id,
          username: creator.username,
          displayName: profile?.branding?.displayName || creator.username,
          profileImage: creator.profileImage,
          bio: creator.bio,
          tagline: profile?.branding?.tagline,
          age: creator.age,
          location: {
            city: creator.location?.city,
            state: creator.location?.state,
            country: creator.location?.country
          },
          attributes: {
            category: creator.category,
            orientation: creator.orientation,
            gender: creator.gender
          },
          verified: creator.isVerified,
          stats: {
            followers: creator.stats?.totalFollowers || 0,
            contentCount: creator.stats?.totalContent || 0,
            rating: profile?.analytics?.performance?.rating || 0
          },
          pricing: {
            starting: profile?.preferences?.pricing?.defaultPrice || 2.99
          }
        };
      }));
      
      res.json({
        success: true,
        creators: enrichedCreators,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      });
    } catch (error) {
      console.error('Browse creators error:', error);
      res.status(500).json({
        success: false,
        message: 'Error browsing creators'
      });
    }
  }
);

// Get public creator profile (supports both username and ObjectId for backwards compatibility)
router.get('/creator/:identifier',
  cacheMiddleware(300),
  async (req, res) => {
    try {
      const { identifier } = req.params;
      
      // Check if identifier is an ObjectId (24 character hex string)
      const isObjectId = /^[0-9a-fA-F]{24}$/.test(identifier);
      
      let query;
      if (isObjectId) {
        // If it's an ObjectId, find by _id for backwards compatibility
        query = { 
          _id: identifier,
          isPaused: { $ne: true }, // Not paused
          isVerified: true // Only verified creators visible publicly
        };
      } else {
        // If it's not an ObjectId, assume it's a username
        query = { 
          username: identifier,
          isPaused: { $ne: true }, // Not paused
          isVerified: true // Only verified creators visible publicly
        };
      }
      
      const creator = await Creator.findOne(query)
        .select('-password -email -phoneNumber -earnings -paymentInfo');
      
      if (!creator) {
        return res.status(404).json({
          success: false,
          message: 'Creator not found'
        });
      }
      
      // Get profile data
      const profile = await CreatorProfile.findOne({ creator: creator._id })
        .select('branding personalization preferences.contentTypes analytics.performance');
      
      // Get sample content (blurred)
      const sampleContent = await Content.find({
        creator: creator._id,
        'visibility.status': 'active',
        'visibility.public': true
      })
        .select('title contentType media.thumbnailUrl pricing analytics.totalViews createdAt')
        .sort('-createdAt')
        .limit(9);
      
      // Get analytics for public display
      const analytics = await CreatorAnalytics.findOne({ creator: creator._id })
        .select('realTime.trending competitive.marketPosition.percentile');
      
      const publicProfile = {
        id: creator._id,
        username: creator.username,
        displayName: profile?.branding?.displayName || creator.username,
        profileImage: creator.profileImage,
        coverImage: profile?.branding?.coverImage,
        bio: creator.bio,
        tagline: profile?.branding?.tagline,
        
        attributes: {
          age: creator.age,
          location: {
            city: creator.location?.city,
            state: creator.location?.state
          },
          category: creator.category,
          orientation: creator.orientation,
          gender: creator.gender,
          bodyType: creator.bodyType,
          ethnicity: creator.ethnicity
        },
        
        verified: creator.isVerified,
        memberSince: creator.createdAt,
        lastActive: creator.lastActive,
        
        stats: {
          followers: creator.stats?.totalFollowers || 0,
          contentCount: creator.stats?.totalContent || 0,
          rating: profile?.analytics?.performance?.rating || 0,
          percentile: analytics?.competitive?.marketPosition?.percentile,
          trending: analytics?.realTime?.trending?.isTrending || false
        },
        
        content: {
          types: profile?.preferences?.contentTypes || ['photos'],
          samples: sampleContent.map(content => ({
            id: content._id,
            title: content.title,
            type: content.contentType,
            thumbnail: content.media.thumbnailUrl, // Blurred
            views: content.analytics.totalViews,
            price: content.pricing.currentPrice,
            postedAt: content.createdAt
          }))
        },
        
        pricing: {
          starting: profile?.preferences?.pricing?.defaultPrice || 2.99,
          bundles: profile?.preferences?.pricing?.bundlesEnabled || false
        },
        
        customization: {
          brandColors: profile?.branding?.brandColors,
          layout: profile?.personalization?.layoutStyle
        }
      };
      
      res.json({
        success: true,
        creator: publicProfile
      });
    } catch (error) {
      console.error('Get creator profile error:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching creator profile'
      });
    }
  }
);

// Get content categories
router.get('/categories',
  cacheMiddleware(3600), // Cache for 1 hour
  async (req, res) => {
    try {
      const categories = [
        {
          id: 'models',
          name: 'Models',
          description: 'Professional and amateur models',
          icon: '📸',
          count: await Creator.countDocuments({ category: 'models', isActive: true })
        },
        {
          id: 'fitness',
          name: 'Fitness',
          description: 'Fitness enthusiasts and trainers',
          icon: '💪',
          count: await Creator.countDocuments({ category: 'fitness', isActive: true })
        },
        {
          id: 'influencers',
          name: 'Influencers',
          description: 'Social media influencers',
          icon: '⭐',
          count: await Creator.countDocuments({ category: 'influencers', isActive: true })
        },
        {
          id: 'artists',
          name: 'Artists',
          description: 'Creative artists and performers',
          icon: '🎨',
          count: await Creator.countDocuments({ category: 'artists', isActive: true })
        },
        {
          id: 'cosplay',
          name: 'Cosplay',
          description: 'Cosplayers and costume creators',
          icon: '🎭',
          count: await Creator.countDocuments({ category: 'cosplay', isActive: true })
        },
        {
          id: 'musicians',
          name: 'Musicians',
          description: 'Musicians and DJs',
          icon: '🎵',
          count: await Creator.countDocuments({ category: 'musicians', isActive: true })
        },
        {
          id: 'gamers',
          name: 'Gamers',
          description: 'Gaming content creators',
          icon: '🎮',
          count: await Creator.countDocuments({ category: 'gamers', isActive: true })
        },
        {
          id: 'lifestyle',
          name: 'Lifestyle',
          description: 'Lifestyle and fashion creators',
          icon: '✨',
          count: await Creator.countDocuments({ category: 'lifestyle', isActive: true })
        }
      ];
      
      res.json({
        success: true,
        categories
      });
    } catch (error) {
      console.error('Get categories error:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching categories'
      });
    }
  }
);

// Search creators
router.get('/search',
  rateLimiter({ max: 30, windowMs: 60 * 1000 }), // 30 searches per minute
  async (req, res) => {
    try {
      const { 
        q,
        type = 'creators', // creators, content
        limit = 20
      } = req.query;
      
      if (!q || q.length < 2) {
        return res.status(400).json({
          success: false,
          message: 'Search query must be at least 2 characters'
        });
      }
      
      let results = [];
      
      if (type === 'creators') {
        // Search creators by username, displayName, bio
        const creators = await Creator.find({
          $or: [
            { username: { $regex: q, $options: 'i' } },
            { bio: { $regex: q, $options: 'i' } }
          ],
          isActive: true,
          'visibility.public': true
        })
          .select('username profileImage bio isVerified')
          .limit(parseInt(limit));
        
        results = creators.map(creator => ({
          type: 'creator',
          id: creator._id,
          username: creator.username,
          profileImage: creator.profileImage,
          bio: creator.bio,
          verified: creator.isVerified
        }));
      } else if (type === 'content') {
        // Search public content
        const content = await Content.find({
          $or: [
            { title: { $regex: q, $options: 'i' } },
            { description: { $regex: q, $options: 'i' } },
            { 'ai.tags': { $in: [new RegExp(q, 'i')] } }
          ],
          'visibility.status': 'active',
          'visibility.public': true
        })
          .select('title contentType media.thumbnailUrl creator')
          .populate('creator', 'username')
          .limit(parseInt(limit));
        
        results = content.map(item => ({
          type: 'content',
          id: item._id,
          title: item.title,
          contentType: item.contentType,
          thumbnail: item.media.thumbnailUrl,
          creator: item.creator.username
        }));
      }
      
      res.json({
        success: true,
        results,
        query: q,
        total: results.length
      });
    } catch (error) {
      console.error('Search error:', error);
      res.status(500).json({
        success: false,
        message: 'Error performing search'
      });
    }
  }
);

// ==========================================
// PLATFORM STATISTICS
// ==========================================

// Get platform statistics
router.get('/stats',
  cacheMiddleware(3600),
  async (req, res) => {
    try {
      const stats = {
        creators: {
          total: await Creator.countDocuments({ isActive: true }),
          verified: await Creator.countDocuments({ isActive: true, isVerified: true }),
          online: await Creator.countDocuments({ 
            isActive: true,
            lastActive: { $gte: new Date(Date.now() - 15 * 60 * 1000) }
          })
        },
        content: {
          total: await Content.countDocuments({ 'visibility.status': 'active' }),
          photos: await Content.countDocuments({ 
            'visibility.status': 'active',
            contentType: 'photo'
          }),
          videos: await Content.countDocuments({ 
            'visibility.status': 'active',
            contentType: 'video'
          })
        },
        members: {
          total: await require('../models/Member').countDocuments({ isActive: true })
        }
      };
      
      res.json({
        success: true,
        stats
      });
    } catch (error) {
      console.error('Get stats error:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching statistics'
      });
    }
  }
);

// ==========================================
// LEGAL & INFORMATION ROUTES
// ==========================================

// Terms of Service
router.get('/terms',
  cacheMiddleware(86400), // Cache for 24 hours
  (req, res) => {
    res.json({
      success: true,
      content: {
        title: 'Terms of Service',
        lastUpdated: '2024-01-01',
        sections: [
          {
            title: 'Acceptance of Terms',
            content: 'By accessing and using SexySelfies, you agree to be bound by these Terms of Service...'
          },
          {
            title: 'Age Requirement',
            content: 'You must be at least 18 years old to use this platform...'
          },
          {
            title: 'Content Guidelines',
            content: 'Content must comply with our community guidelines. No explicit nudity...'
          },
          {
            title: 'Payment Terms',
            content: 'All payments are processed securely. Platform fee is 20%...'
          },
          {
            title: 'Creator Obligations',
            content: 'Creators must verify their identity and maintain accurate information...'
          }
        ]
      }
    });
  }
);

// Privacy Policy
router.get('/privacy',
  cacheMiddleware(86400),
  (req, res) => {
    res.json({
      success: true,
      content: {
        title: 'Privacy Policy',
        lastUpdated: '2024-01-01',
        sections: [
          {
            title: 'Information We Collect',
            content: 'We collect information you provide directly to us...'
          },
          {
            title: 'How We Use Your Information',
            content: 'We use the information we collect to provide and improve our services...'
          },
          {
            title: 'Information Sharing',
            content: 'We do not sell or rent your personal information to third parties...'
          },
          {
            title: 'Data Security',
            content: 'We implement appropriate security measures to protect your information...'
          },
          {
            title: 'Your Rights',
            content: 'You have the right to access, update, or delete your personal information...'
          }
        ]
      }
    });
  }
);

// Community Guidelines
router.get('/guidelines',
  cacheMiddleware(86400),
  (req, res) => {
    res.json({
      success: true,
      content: {
        title: 'Community Guidelines',
        lastUpdated: '2024-01-01',
        sections: [
          {
            title: 'Content Standards',
            content: 'Content should be sexy but not pornographic. Lingerie and implied nudity allowed...'
          },
          {
            title: 'Respectful Behavior',
            content: 'Treat all users with respect. Harassment will not be tolerated...'
          },
          {
            title: 'Prohibited Content',
            content: 'No explicit nudity, violence, hate speech, or illegal content...'
          },
          {
            title: 'Reporting',
            content: 'Report any violations using the report button...'
          }
        ]
      }
    });
  }
);

// Contact form
router.post('/contact',
  rateLimiter({ max: 5, windowMs: 60 * 60 * 1000 }), // 5 submissions per hour
  async (req, res) => {
    try {
      const { name, email, subject, message } = req.body;
      
      // Validate inputs
      if (!name || !email || !subject || !message) {
        return res.status(400).json({
          success: false,
          message: 'All fields are required'
        });
      }
      
      // In production, this would send an email or create a support ticket
      console.log('Contact form submission:', { name, email, subject, message });
      
      res.json({
        success: true,
        message: 'Thank you for contacting us. We will respond within 24-48 hours.'
      });
    } catch (error) {
      console.error('Contact form error:', error);
      res.status(500).json({
        success: false,
        message: 'Error submitting contact form'
      });
    }
  }
);

// FAQ
router.get('/faq',
  cacheMiddleware(86400),
  (req, res) => {
    res.json({
      success: true,
      faqs: [
        {
          question: 'How does SexySelfies work?',
          answer: 'SexySelfies is a swipe-to-match platform where you can discover creators and unlock their content...'
        },
        {
          question: 'How much does it cost?',
          answer: 'There are no subscriptions! You only pay for the content you want, starting at $0.99...'
        },
        {
          question: 'How do I become a creator?',
          answer: 'Sign up as a creator, verify your identity, and start posting content...'
        },
        {
          question: 'How do creators get paid?',
          answer: 'Creators receive 80% of all earnings, with payouts available weekly or instantly...'
        },
        {
          question: 'Is my information secure?',
          answer: 'Yes, we use industry-standard encryption and never store payment details...'
        }
      ]
    });
  }
);

// ==========================================
// APP CONFIGURATION
// ==========================================

// Get app configuration (for mobile/PWA)
router.get('/config',
  cacheMiddleware(300),
  (req, res) => {
    res.json({
      success: true,
      config: {
        appName: 'SexySelfies',
        version: '1.0.0',
        minVersion: '1.0.0',
        features: {
          swipeDiscovery: true,
          messaging: true,
          videoCalls: false,
          liveStreaming: false,
          stories: false,
          instantPayouts: true
        },
        pricing: {
          minPrice: 0.99,
          maxPrice: 99.99,
          currency: 'USD',
          platformFee: 0.20
        },
        limits: {
          maxUploadSize: 104857600, // 100MB
          maxPhotosPerPost: 10,
          maxVideoLength: 600, // 10 minutes
          maxMessageLength: 1000
        },
        urls: {
          termsOfService: '/api/public/terms',
          privacyPolicy: '/api/public/privacy',
          communityGuidelines: '/api/public/guidelines',
          support: '/api/public/contact'
        },
        maintenance: {
          enabled: false,
          message: null
        }
      }
    });
  }
);

// Health check
router.get('/health',
  (req, res) => {
    res.json({
      success: true,
      status: 'healthy',
      timestamp: new Date(),
      uptime: process.uptime()
    });
  }
);

module.exports = router;