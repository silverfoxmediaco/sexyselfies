// backend/src/controllers/memberProfile.controller.js
// Controller for creators viewing and interacting with member profiles

const MemberAnalytics = require('../models/MemberAnalytics');
const MemberInteraction = require('../models/MemberInteraction');
const SpecialOffer = require('../models/SpecialOffer');
const CreatorSalesActivity = require('../models/CreatorSalesActivity');
const Member = require('../models/Member');
const Creator = require('../models/Creator');
const { sendNotification } = require('../services/notification.service');
const { calculateMemberScore } = require('../services/memberScoring.service');
const { trackAnalytics } = require('../services/analytics.service');

// ============================================
// MEMBER DISCOVERY & SEARCH
// ============================================

/**
 * Get high-value members for discovery with dynamic sorting
 * @route GET /api/creator/members/discover
 * @param {string} spendingTier - Filter by spending tier (all, new, standard, high, whale, vip)
 * @param {string} activityLevel - Filter by activity level (all, new, low, medium, high, very_high)
 * @param {number} limit - Number of members per page (default: 20)
 * @param {number} page - Page number (default: 1)
 * @param {string} sortBy - Sort field: valueScore, spending, activity, lastActive, engagement (default: valueScore)
 * @param {string} sortOrder - Sort order: asc, desc (default: desc)
 */
exports.getHighValueMembers = async (req, res) => {
  try {
    const creatorId = req.user.id;
    const {
      spendingTier = 'all',
      activityLevel = 'all',
      limit = 20,
      page = 1,
      category = 'all'
    } = req.query;
    
    // Check creator verification
    const creator = await Creator.findById(creatorId);
    if (!creator.isVerified) {
      return res.status(403).json({
        success: false,
        message: 'Only verified creators can access member profiles',
        requiresVerification: true
      });
    }
    
    // Build query
    const query = {
      'privacy.discoverable': true,
      'privacy.blockedCreators': { $ne: creatorId }
    };
    
    // Apply filters
    if (spendingTier !== 'all') {
      query['spending.tier'] = spendingTier;
    }
    
    if (activityLevel !== 'all') {
      query['activity.level'] = activityLevel;
    }
    
    if (category !== 'all') {
      query['preferences.topCategories.category'] = category;
    }
    
    // Determine sort
    let sort = {};
    switch(sortBy) {
      case 'activity':
        sort = { 'activity.lastActive': -1 };
        break;
      case 'recent':
        sort = { 'metadata.lastPurchase': -1 };
        break;
      case 'value':
      default:
        sort = { 'scoring.valueScore': -1, 'spending.last30Days': -1 };
    }
    
    // Calculate skip for pagination
    const skip = (page - 1) * limit;
    
    // Get all members, then LEFT JOIN with their analytics data
    const memberQuery = {
      role: 'member',
      isActive: true,
      // Exclude blocked creators
      'privacy.blockedCreators': { $ne: creatorId }
    };
    
    // Get all members first (no initial sort - we'll sort after analytics calculation)
    const allMembers = await Member.find(memberQuery)
      .select('username avatar lastActive joinDate preferences spending');
    
    console.log(`👥 Found ${allMembers.length} members in database`);
    
    // Get total count for pagination
    const total = await Member.countDocuments(memberQuery);
    
    // For each member, get their analytics data if it exists
    let membersWithAnalytics = 0;
    let newMembers = 0;
    
    const memberAnalytics = await Promise.all(
      allMembers.map(async (member) => {
        // Try to find analytics for this member
        const analytics = await MemberAnalytics.findOne({ member: member._id });
        
        if (analytics) {
          membersWithAnalytics++;
          // Use existing analytics data
          return {
            member: member,
            activity: analytics.activity,
            spending: analytics.spending,
            engagement: analytics.engagement,
            metadata: analytics.metadata,
            preferences: analytics.preferences,
            scoring: analytics.scoring
          };
        } else {
          newMembers++;
          // Create default analytics for new members
          return {
            member: member,
            activity: {
              lastActive: member.lastActive || new Date(),
              level: 'new' // Mark as new member
            },
            spending: {
              last30Days: member.spending?.last30Days || 0,
              tier: member.spending?.tier || 'new',
              lifetime: member.spending?.lifetime || 0,
              averagePurchase: member.spending?.averagePurchase || 0
            },
            engagement: {
              messageResponseRate: 0 // New members have no response history
            },
            metadata: {
              totalPurchases: member.spending?.totalPurchases || 0
            },
            preferences: {
              topCategories: member.preferences?.contentTypes ? 
                Object.keys(member.preferences.contentTypes).filter(key => member.preferences.contentTypes[key]).map(cat => ({category: cat})) :
                [{category: 'photos'}]
            },
            scoring: {
              valueScore: 25 // Lower score for new members
            }
          };
        }
      })
    );
    
    console.log(`📊 Analytics: ${membersWithAnalytics} with analytics, ${newMembers} new members`);
    
    // 🎯 DYNAMIC SORTING LOGIC - Sort by valueScore for optimal creator targeting
    const sortBy = req.query.sortBy || 'valueScore'; // default to valueScore
    const sortOrder = req.query.sortOrder || 'desc'; // desc = high value first
    
    console.log(`🔄 Sorting ${memberAnalytics.length} members by ${sortBy} (${sortOrder})`);
    
    memberAnalytics.sort((a, b) => {
      let valueA, valueB;
      
      switch (sortBy) {
        case 'valueScore':
          valueA = a.scoring.valueScore;
          valueB = b.scoring.valueScore;
          break;
        case 'spending':
          valueA = a.spending.last30Days;
          valueB = b.spending.last30Days;
          break;
        case 'activity':
          // Convert activity level to numeric for sorting
          const activityLevels = { 'new': 0, 'low': 1, 'medium': 2, 'high': 3, 'very_high': 4 };
          valueA = activityLevels[a.activity.level] || 0;
          valueB = activityLevels[b.activity.level] || 0;
          break;
        case 'lastActive':
          valueA = new Date(a.activity.lastActive);
          valueB = new Date(b.activity.lastActive);
          break;
        case 'engagement':
          valueA = a.engagement.messageResponseRate;
          valueB = b.engagement.messageResponseRate;
          break;
        default:
          // Fallback to valueScore
          valueA = a.scoring.valueScore;
          valueB = b.scoring.valueScore;
      }
      
      if (sortOrder === 'desc') {
        return valueB - valueA; // High to low
      } else {
        return valueA - valueB; // Low to high
      }
    });
    
    // Apply pagination AFTER sorting
    const paginatedMembers = memberAnalytics.slice(skip, skip + parseInt(limit));
    console.log(`📄 Returning ${paginatedMembers.length} members after pagination (${skip}-${skip + parseInt(limit)})`);
    
    // Format response with anonymized data
    const members = await Promise.all(paginatedMembers.map(async (analytics) => {
      // Check previous interactions
      const previousInteraction = await MemberInteraction.findOne({
        creator: creatorId,
        member: analytics.member._id
      }).sort('-createdAt');
      
      return {
        id: analytics.member._id,
        username: analytics.member.username,
        avatar: analytics.member.avatar,
        lastActive: analytics.activity.lastActive,
        isOnline: isOnlineNow(analytics.activity.lastActive),
        stats: {
          last30DaySpend: analytics.spending.last30Days,
          lifetimeSpend: analytics.spending.lifetime,
          spendingTier: analytics.spending.tier,
          activityLevel: analytics.activity.level,
          responseRate: analytics.engagement.messageResponseRate,
          totalPurchases: analytics.metadata.totalPurchases,
          favoriteCategory: analytics.preferences.topCategories[0]?.category || 'Various'
        },
        interaction: {
          hasInteracted: !!previousInteraction,
          lastInteraction: previousInteraction?.createdAt,
          lastInteractionType: previousInteraction?.interactionType
        },
        score: analytics.scoring.valueScore
      };
    }));
    
    // Track discovery session
    await trackAnalytics('member_discovery', {
      creatorId,
      filters: { spendingTier, activityLevel, category },
      resultsCount: members.length
    });
    
    res.json({
      success: true,
      members,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: memberAnalytics.length,
        pages: Math.ceil(memberAnalytics.length / limit)
      },
      sorting: {
        sortBy,
        sortOrder,
        message: `Members sorted by ${sortBy} in ${sortOrder}ending order`
      }
    });
    
  } catch (error) {
    console.error('Get high value members error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching members'
    });
  }
};

/**
 * Search members with advanced filters
 * @route POST /api/creator/members/search
 */
exports.searchMembers = async (req, res) => {
  try {
    const creatorId = req.user.id;
    const {
      filters = {},
      sort = 'spending_desc',
      limit = 20,
      page = 1
    } = req.body;
    
    // Build complex query
    const query = {
      'privacy.discoverable': true,
      'privacy.blockedCreators': { $ne: creatorId }
    };
    
    // Spending filters
    if (filters.minSpend30Days || filters.maxSpend30Days) {
      query['spending.last30Days'] = {};
      if (filters.minSpend30Days) {
        query['spending.last30Days'].$gte = filters.minSpend30Days;
      }
      if (filters.maxSpend30Days) {
        query['spending.last30Days'].$lte = filters.maxSpend30Days;
      }
    }
    
    // Activity filters
    if (filters.activityLevel && filters.activityLevel.length > 0) {
      query['activity.level'] = { $in: filters.activityLevel };
    }
    
    // Last active filter
    if (filters.lastActiveWithin) {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - filters.lastActiveWithin);
      query['activity.lastActive'] = { $gte: cutoffDate };
    }
    
    // Content preference filters
    if (filters.preferredContent && filters.preferredContent.length > 0) {
      query['preferences.contentTypes'] = { $in: filters.preferredContent };
    }
    
    // Category filters
    if (filters.category && filters.category.length > 0) {
      query['preferences.topCategories.category'] = { $in: filters.category };
    }
    
    // Previous interaction filter
    if (filters.hasInteractedBefore !== undefined) {
      const interactedMembers = await MemberInteraction.distinct('member', {
        creator: creatorId
      });
      
      if (filters.hasInteractedBefore) {
        query['member'] = { $in: interactedMembers };
      } else {
        query['member'] = { $nin: interactedMembers };
      }
    }
    
    // Determine sort
    let sortOption = {};
    switch(sort) {
      case 'activity_desc':
        sortOption = { 'activity.lastActive': -1 };
        break;
      case 'recent_active':
        sortOption = { 'activity.lastActive': -1 };
        break;
      case 'spending_asc':
        sortOption = { 'spending.last30Days': 1 };
        break;
      case 'spending_desc':
      default:
        sortOption = { 'spending.last30Days': -1 };
    }
    
    const skip = (page - 1) * limit;
    
    // Execute search
    const results = await MemberAnalytics.find(query)
      .populate('member', 'username avatar')
      .sort(sortOption)
      .limit(parseInt(limit))
      .skip(skip);
    
    const total = await MemberAnalytics.countDocuments(query);
    
    // Format results
    const members = results.map(analytics => ({
      id: analytics.member._id,
      username: analytics.member.username,
      avatar: analytics.member.avatar,
      stats: {
        last30DaySpend: analytics.spending.last30Days,
        totalSpend: analytics.spending.lifetime,
        spendingTier: analytics.spending.tier,
        activityLevel: analytics.activity.level,
        lastActive: analytics.activity.lastActive
      }
    }));
    
    res.json({
      success: true,
      members,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
    
  } catch (error) {
    console.error('Search members error:', error);
    res.status(500).json({
      success: false,
      message: 'Error searching members'
    });
  }
};

// ============================================
// INDIVIDUAL MEMBER PROFILE
// ============================================

/**
 * Get detailed member profile
 * @route GET /api/creator/members/profile/:memberId
 */
exports.getMemberProfile = async (req, res) => {
  try {
    const creatorId = req.user.id;
    const { memberId } = req.params;
    
    // Get member analytics
    const analytics = await MemberAnalytics.findOne({ member: memberId })
      .populate('member', 'username avatar joinDate lastActive');
    
    if (!analytics) {
      return res.status(404).json({
        success: false,
        message: 'Member not found'
      });
    }
    
    // Check privacy settings
    if (!analytics.privacy.discoverable || 
        analytics.privacy.blockedCreators.includes(creatorId)) {
      return res.status(403).json({
        success: false,
        message: 'Member profile not available'
      });
    }
    
    // Get interaction history
    const interactions = await MemberInteraction.find({
      creator: creatorId,
      member: memberId
    })
    .sort('-createdAt')
    .limit(10);
    
    // Calculate interaction stats
    const interactionStats = {
      totalInteractions: interactions.length,
      lastInteraction: interactions[0]?.createdAt,
      purchases: interactions.filter(i => i.conversion.resulted_in_purchase).length,
      totalSpent: interactions.reduce((sum, i) => 
        sum + (i.conversion.purchaseAmount || 0), 0
      ),
      responseRate: interactions.filter(i => i.response.hasResponded).length / 
                    (interactions.length || 1) * 100
    };
    
    // Get active offers for this member
    const activeOffers = await SpecialOffer.find({
      creator: creatorId,
      'recipients.members.member': memberId,
      'status.current': 'active',
      'validity.endDate': { $gte: new Date() }
    }).select('offer.name offer.type validity.endDate');
    
    // Track profile view
    await trackProfileView(creatorId, memberId);
    
    // Format response
    const profile = {
      member: {
        id: analytics.member._id,
        username: analytics.member.username,
        avatar: analytics.member.avatar,
        joinDate: analytics.member.joinDate,
        lastActive: analytics.activity.lastActive,
        isOnline: isOnlineNow(analytics.activity.lastActive)
      },
      stats: {
        last30DaySpend: analytics.spending.last30Days,
        totalSpend: analytics.spending.lifetime,
        averagePurchase: analytics.spending.averagePurchase,
        contentPurchases: analytics.metadata.totalPurchases,
        favoriteCategory: analytics.preferences.topCategories[0]?.category,
        activityLevel: analytics.activity.level,
        responseRate: analytics.engagement.messageResponseRate,
        preferredContent: getPreferredContentType(analytics.preferences.contentTypes)
      },
      interactions: {
        previousPurchases: interactionStats.purchases,
        lastPurchase: analytics.metadata.lastPurchase,
        hasSubscribed: false, // Would check subscription model
        tipsGiven: interactions.filter(i => i.interactionType === 'tip_received').length,
        totalInteractions: interactionStats.totalInteractions,
        responseRate: interactionStats.responseRate
      },
      badges: generateMemberBadges(analytics),
      activeOffers,
      score: analytics.scoring.valueScore,
      churnRisk: analytics.scoring.churnRisk.level
    };
    
    res.json({
      success: true,
      profile
    });
    
  } catch (error) {
    console.error('Get member profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching member profile'
    });
  }
};

/**
 * Get interaction history with member
 * @route GET /api/creator/members/profile/:memberId/history
 */
exports.getMemberInteractionHistory = async (req, res) => {
  try {
    const creatorId = req.user.id;
    const { memberId } = req.params;
    const { limit = 50, page = 1 } = req.query;
    
    const skip = (page - 1) * limit;
    
    const interactions = await MemberInteraction.find({
      creator: creatorId,
      member: memberId
    })
    .sort('-createdAt')
    .limit(parseInt(limit))
    .skip(skip);
    
    const total = await MemberInteraction.countDocuments({
      creator: creatorId,
      member: memberId
    });
    
    // Format interactions
    const history = interactions.map(interaction => ({
      id: interaction._id,
      type: interaction.interactionType,
      date: interaction.createdAt,
      message: interaction.message?.content,
      response: {
        hasResponded: interaction.response.hasResponded,
        responseType: interaction.response.responseType,
        responseTime: interaction.response.responseTime
      },
      conversion: {
        resulted_in_purchase: interaction.conversion.resulted_in_purchase,
        purchaseAmount: interaction.conversion.purchaseAmount
      },
      status: interaction.status.current
    }));
    
    res.json({
      success: true,
      history,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
    
  } catch (error) {
    console.error('Get interaction history error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching interaction history'
    });
  }
};

// ============================================
// INTERACTION ACTIONS
// ============================================

/**
 * Poke a member
 * @route POST /api/creator/members/profile/:memberId/poke
 */
exports.pokeMember = async (req, res) => {
  try {
    const creatorId = req.user.id;
    const { memberId } = req.params;
    
    // Check if already poked recently
    const recentPoke = await MemberInteraction.findOne({
      creator: creatorId,
      member: memberId,
      interactionType: 'poke',
      createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
    });
    
    if (recentPoke) {
      return res.status(429).json({
        success: false,
        message: 'Already poked this member recently. Wait 24 hours.'
      });
    }
    
    // Check daily limits
    const salesActivity = await CreatorSalesActivity.findOne({ creator: creatorId });
    if (salesActivity && salesActivity.limits.daily.pokes.used >= salesActivity.limits.daily.pokes.limit) {
      return res.status(429).json({
        success: false,
        message: 'Daily poke limit reached',
        limit: salesActivity.limits.daily.pokes.limit
      });
    }
    
    // Get member analytics for context
    const memberAnalytics = await MemberAnalytics.findOne({ member: memberId });
    
    // Create poke interaction
    const interaction = new MemberInteraction({
      creator: creatorId,
      member: memberId,
      interactionType: 'poke',
      context: {
        source: 'member_discovery',
        memberState: {
          spendingTier: memberAnalytics?.spending.tier,
          activityLevel: memberAnalytics?.activity.level,
          previousPurchases: memberAnalytics?.metadata.totalPurchases || 0,
          lifetimeValue: memberAnalytics?.spending.lifetime || 0
        }
      }
    });
    
    await interaction.save();
    
    // Update sales activity
    if (salesActivity) {
      await salesActivity.recordInteraction('pokes', memberId, memberAnalytics?.spending.tier);
    }
    
    // Send notification to member
    const creator = await Creator.findById(creatorId).select('username profileImage');
    await sendNotification(memberId, {
      type: 'poke',
      title: 'Someone noticed you! 👋',
      body: `${creator.username} poked you! Check out their profile`,
      data: {
        creatorId,
        creatorUsername: creator.username,
        creatorImage: creator.profileImage,
        interactionId: interaction._id
      }
    });
    
    res.json({
      success: true,
      message: 'Poke sent successfully',
      interactionId: interaction._id
    });
    
  } catch (error) {
    console.error('Poke member error:', error);
    res.status(500).json({
      success: false,
      message: 'Error sending poke'
    });
  }
};

/**
 * Like a member profile
 * @route POST /api/creator/members/profile/:memberId/like
 */
exports.likeMember = async (req, res) => {
  try {
    const creatorId = req.user.id;
    const { memberId } = req.params;
    
    // Check if already liked
    const existingLike = await MemberInteraction.findOne({
      creator: creatorId,
      member: memberId,
      interactionType: 'like'
    });
    
    if (existingLike) {
      return res.status(400).json({
        success: false,
        message: 'Already liked this member'
      });
    }
    
    // Get member analytics
    const memberAnalytics = await MemberAnalytics.findOne({ member: memberId });
    
    // Create like interaction
    const interaction = new MemberInteraction({
      creator: creatorId,
      member: memberId,
      interactionType: 'like',
      context: {
        source: 'member_discovery',
        memberState: {
          spendingTier: memberAnalytics?.spending.tier,
          activityLevel: memberAnalytics?.activity.level
        }
      }
    });
    
    await interaction.save();
    
    // Update sales activity
    const salesActivity = await CreatorSalesActivity.findOne({ creator: creatorId });
    if (salesActivity) {
      await salesActivity.recordInteraction('likes', memberId, memberAnalytics?.spending.tier);
    }
    
    // Send notification
    const creator = await Creator.findById(creatorId).select('username profileImage');
    await sendNotification(memberId, {
      type: 'like',
      title: 'New admirer! 💕',
      body: `${creator.username} likes your profile!`,
      data: {
        creatorId,
        creatorUsername: creator.username,
        creatorImage: creator.profileImage
      }
    });
    
    res.json({
      success: true,
      message: 'Like sent successfully'
    });
    
  } catch (error) {
    console.error('Like member error:', error);
    res.status(500).json({
      success: false,
      message: 'Error liking member'
    });
  }
};

/**
 * Send message to member
 * @route POST /api/creator/members/profile/:memberId/message
 */
exports.sendMessageToMember = async (req, res) => {
  try {
    const creatorId = req.user.id;
    const { memberId } = req.params;
    const { message, attachments = [] } = req.body;
    
    if (!message || message.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Message content is required'
      });
    }
    
    // Check daily message limit
    const salesActivity = await CreatorSalesActivity.findOne({ creator: creatorId });
    if (salesActivity && 
        salesActivity.limits.daily.messages.used >= salesActivity.limits.daily.messages.limit) {
      return res.status(429).json({
        success: false,
        message: 'Daily message limit reached',
        limit: salesActivity.limits.daily.messages.limit,
        resetAt: salesActivity.limits.daily.messages.resetAt
      });
    }
    
    // Get member analytics
    const memberAnalytics = await MemberAnalytics.findOne({ member: memberId });
    
    // Check if member allows messages
    if (memberAnalytics && !memberAnalytics.privacy.allowBulkMessages) {
      // Check if this is a personalized message (not bulk)
      const isPersonalized = message.length > 100 && !message.includes('{name}');
      
      if (!isPersonalized) {
        return res.status(403).json({
          success: false,
          message: 'Member does not accept bulk messages. Try a more personalized approach.'
        });
      }
    }
    
    // Create message interaction
    const interaction = new MemberInteraction({
      creator: creatorId,
      member: memberId,
      interactionType: 'message',
      message: {
        content: message,
        isPersonalized: true,
        attachments,
        callToAction: detectCallToAction(message)
      },
      context: {
        source: 'member_discovery',
        memberState: {
          spendingTier: memberAnalytics?.spending.tier,
          activityLevel: memberAnalytics?.activity.level,
          lastActiveHours: getHoursSinceActive(memberAnalytics?.activity.lastActive)
        }
      }
    });
    
    await interaction.save();
    
    // Update sales activity
    if (salesActivity) {
      await salesActivity.recordInteraction('messages', memberId, memberAnalytics?.spending.tier);
    }
    
    // Send actual message (would integrate with messaging system)
    // For now, just send notification
    const creator = await Creator.findById(creatorId).select('username profileImage');
    await sendNotification(memberId, {
      type: 'message',
      title: `New message from ${creator.username}`,
      body: message.substring(0, 100) + (message.length > 100 ? '...' : ''),
      data: {
        creatorId,
        creatorUsername: creator.username,
        messageId: interaction._id
      }
    });
    
    res.json({
      success: true,
      message: 'Message sent successfully',
      interactionId: interaction._id
    });
    
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({
      success: false,
      message: 'Error sending message'
    });
  }
};

/**
 * Send special offer to member
 * @route POST /api/creator/members/profile/:memberId/special-offer
 */
exports.sendSpecialOffer = async (req, res) => {
  try {
    const creatorId = req.user.id;
    const { memberId } = req.params;
    const {
      offerType,
      discount,
      contentIds = [],
      expiresIn = 48,
      message
    } = req.body;
    
    // Validate offer
    if (!offerType || !message) {
      return res.status(400).json({
        success: false,
        message: 'Offer type and message are required'
      });
    }
    
    // Check daily offer limit
    const salesActivity = await CreatorSalesActivity.findOne({ creator: creatorId });
    if (salesActivity && 
        salesActivity.limits.daily.offers.used >= salesActivity.limits.daily.offers.limit) {
      return res.status(429).json({
        success: false,
        message: 'Daily offer limit reached',
        limit: salesActivity.limits.daily.offers.limit
      });
    }
    
    // Get member analytics
    const memberAnalytics = await MemberAnalytics.findOne({ member: memberId });
    
    // Check if member allows special offers
    if (memberAnalytics && !memberAnalytics.privacy.allowSpecialOffers) {
      return res.status(403).json({
        success: false,
        message: 'Member does not accept special offers'
      });
    }
    
    // Create special offer
    const offer = new SpecialOffer({
      creator: creatorId,
      recipients: {
        members: [{
          member: memberId,
          sentAt: new Date(),
          status: 'pending'
        }],
        totalRecipients: 1
      },
      offer: {
        name: `Special offer for ${memberAnalytics?.member.username || 'member'}`,
        type: offerType,
        discount: {
          percentage: offerType === 'percentage_discount' ? discount : undefined,
          fixedAmount: offerType === 'fixed_discount' ? discount : undefined
        },
        content: {
          items: contentIds.map(id => ({ contentId: id }))
        },
        message: {
          subject: 'Exclusive offer just for you!',
          body: message,
          callToAction: 'Claim Now'
        }
      },
      validity: {
        startDate: new Date(),
        endDate: new Date(Date.now() + expiresIn * 60 * 60 * 1000)
      },
      status: {
        current: 'active'
      }
    });
    
    await offer.save();
    
    // Create interaction record
    const interaction = new MemberInteraction({
      creator: creatorId,
      member: memberId,
      interactionType: 'special_offer',
      specialOffer: {
        offerId: offer._id,
        offerType,
        discount: {
          percentage: offerType === 'percentage_discount' ? discount : undefined,
          amount: offerType === 'fixed_discount' ? discount : undefined
        },
        contentIds,
        expiresAt: offer.validity.endDate
      },
      message: {
        content: message
      },
      context: {
        source: 'member_discovery',
        memberState: {
          spendingTier: memberAnalytics?.spending.tier,
          activityLevel: memberAnalytics?.activity.level
        }
      }
    });
    
    await interaction.save();
    
    // Update sales activity
    if (salesActivity) {
      await salesActivity.recordInteraction('specialOffers', memberId, memberAnalytics?.spending.tier);
    }
    
    // Send notification
    const creator = await Creator.findById(creatorId).select('username profileImage');
    await sendNotification(memberId, {
      type: 'special_offer',
      title: '🎁 Special Offer from ' + creator.username,
      body: `Exclusive ${discount}% off just for you! Expires in ${expiresIn} hours`,
      data: {
        creatorId,
        offerId: offer._id,
        expiresAt: offer.validity.endDate
      }
    });
    
    res.json({
      success: true,
      message: 'Special offer sent successfully',
      offerId: offer._id,
      expiresAt: offer.validity.endDate
    });
    
  } catch (error) {
    console.error('Send special offer error:', error);
    res.status(500).json({
      success: false,
      message: 'Error sending special offer'
    });
  }
};

/**
 * Track profile view
 * @route POST /api/creator/members/profile/:memberId/view
 */
exports.trackProfileView = async (req, res) => {
  try {
    const creatorId = req.user.id;
    const { memberId } = req.params;
    
    await trackProfileView(creatorId, memberId);
    
    res.json({
      success: true,
      message: 'Profile view tracked'
    });
    
  } catch (error) {
    console.error('Track profile view error:', error);
    res.status(500).json({
      success: false,
      message: 'Error tracking profile view'
    });
  }
};

// ============================================
// ANALYTICS
// ============================================

/**
 * Get member analytics for creator
 * @route GET /api/creator/members/analytics
 */
exports.getMemberAnalytics = async (req, res) => {
  try {
    const creatorId = req.user.id;
    const { days = 30 } = req.query;
    
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    // Get interaction stats
    const interactionStats = await MemberInteraction.aggregate([
      {
        $match: {
          creator: creatorId,
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: null,
          totalInteractions: { $sum: 1 },
          totalResponses: {
            $sum: { $cond: ['$response.hasResponded', 1, 0] }
          },
          totalConversions: {
            $sum: { $cond: ['$conversion.resulted_in_purchase', 1, 0] }
          },
          totalRevenue: {
            $sum: { $ifNull: ['$conversion.purchaseAmount', 0] }
          }
        }
      }
    ]);
    
    // Get unique members engaged
    const uniqueMembers = await MemberInteraction.distinct('member', {
      creator: creatorId,
      createdAt: { $gte: startDate }
    });
    
    // Get segment breakdown
    const segmentStats = await MemberInteraction.aggregate([
      {
        $match: {
          creator: creatorId,
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: '$context.memberState.spendingTier',
          count: { $sum: 1 },
          conversions: {
            $sum: { $cond: ['$conversion.resulted_in_purchase', 1, 0] }
          },
          revenue: {
            $sum: { $ifNull: ['$conversion.purchaseAmount', 0] }
          }
        }
      }
    ]);
    
    // Get best performing interaction types
    const bestTypes = await MemberInteraction.getBestPerformingTypes(creatorId);
    
    // Get conversion rate
    const conversionStats = await MemberInteraction.getConversionRate(creatorId, days);
    
    res.json({
      success: true,
      analytics: {
        overview: {
          totalInteractions: interactionStats[0]?.totalInteractions || 0,
          uniqueMembersEngaged: uniqueMembers.length,
          totalResponses: interactionStats[0]?.totalResponses || 0,
          totalConversions: interactionStats[0]?.totalConversions || 0,
          totalRevenue: interactionStats[0]?.totalRevenue || 0,
          conversionRate: conversionStats.rate,
          responseRate: interactionStats[0] ? 
            (interactionStats[0].totalResponses / interactionStats[0].totalInteractions * 100) : 0
        },
        segments: segmentStats,
        bestPerforming: bestTypes,
        period: {
          days,
          startDate,
          endDate: new Date()
        }
      }
    });
    
  } catch (error) {
    console.error('Get member analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching analytics'
    });
  }
};

// ============================================
// HELPER FUNCTIONS
// ============================================

function isOnlineNow(lastActive) {
  if (!lastActive) return false;
  const minutesAgo = (Date.now() - new Date(lastActive)) / (1000 * 60);
  return minutesAgo < 5;
}

function getHoursSinceActive(lastActive) {
  if (!lastActive) return null;
  return Math.floor((Date.now() - new Date(lastActive)) / (1000 * 60 * 60));
}

function detectCallToAction(message) {
  const ctas = {
    'check out': 'check_content',
    'subscribe': 'subscribe',
    'special offer': 'special_offer',
    'view profile': 'view_profile',
    'exclusive': 'special_offer'
  };
  
  const lowerMessage = message.toLowerCase();
  for (const [keyword, cta] of Object.entries(ctas)) {
    if (lowerMessage.includes(keyword)) {
      return cta;
    }
  }
  
  return 'none';
}

function getPreferredContentType(contentTypes) {
  if (!contentTypes) return 'Various';
  
  const types = Object.entries(contentTypes)
    .filter(([_, data]) => data.count > 0)
    .sort((a, b) => b[1].count - a[1].count);
  
  return types[0]?.[0] || 'Various';
}

function generateMemberBadges(analytics) {
  const badges = [];
  
  if (analytics.spending.tier === 'whale') {
    badges.push({ type: 'whale', label: 'Big Spender' });
  } else if (analytics.spending.tier === 'vip') {
    badges.push({ type: 'vip', label: 'VIP Member' });
  }
  
  if (analytics.activity.level === 'very-active') {
    badges.push({ type: 'active', label: 'Super Active' });
  }
  
  if (analytics.metadata.totalPurchases > 50) {
    badges.push({ type: 'loyal', label: 'Loyal Fan' });
  }
  
  if (analytics.spending.velocity.trend === 'increasing') {
    badges.push({ type: 'rising', label: 'Rising Spender' });
  }
  
  return badges;
}

/**
 * Get member segments for creator
 * @route GET /api/creator/members/segments
 */
exports.getMemberSegments = async (req, res) => {
  try {
    const creatorId = req.user.id;
    
    // Get all segments with counts
    const segments = await MemberAnalytics.aggregate([
      {
        $match: {
          'privacy.discoverable': true,
          'privacy.blockedCreators': { $ne: creatorId }
        }
      },
      {
        $group: {
          _id: '$spending.tier',
          count: { $sum: 1 },
          avgSpend30Days: { $avg: '$spending.last30Days' },
          avgLifetimeSpend: { $avg: '$spending.lifetime' }
        }
      },
      { $sort: { count: -1 } }
    ]);
    
    res.json({
      success: true,
      segments: segments.map(seg => ({
        tier: seg._id,
        count: seg.count,
        averageMonthlySpend: Math.round(seg.avgSpend30Days || 0),
        averageLifetimeValue: Math.round(seg.avgLifetimeSpend || 0)
      }))
    });
    
  } catch (error) {
    console.error('Get member segments error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching member segments'
    });
  }
};

/**
 * Send bulk message to member segment
 * @route POST /api/creator/members/bulk/message
 */
exports.sendBulkMessage = async (req, res) => {
  try {
    const creatorId = req.user.id;
    const { message, segment, maxRecipients = 50 } = req.body;
    
    if (!message || !segment) {
      return res.status(400).json({
        success: false,
        message: 'Message and segment are required'
      });
    }
    
    // Get members in segment
    const query = {
      'privacy.discoverable': true,
      'privacy.blockedCreators': { $ne: creatorId },
      'privacy.allowBulkMessages': true
    };
    
    if (segment !== 'all') {
      query['spending.tier'] = segment;
    }
    
    const members = await MemberAnalytics.find(query)
      .limit(maxRecipients)
      .select('member');
    
    // Send messages (simplified)
    let sentCount = 0;
    for (const memberAnalytics of members) {
      try {
        // Create interaction record
        await new MemberInteraction({
          creator: creatorId,
          member: memberAnalytics.member,
          interactionType: 'bulk_message',
          message: { content: message, isBulk: true }
        }).save();
        
        sentCount++;
      } catch (err) {
        console.log('Failed to send to member:', memberAnalytics.member);
      }
    }
    
    res.json({
      success: true,
      message: `Bulk message sent to ${sentCount} members`,
      sentCount
    });
    
  } catch (error) {
    console.error('Send bulk message error:', error);
    res.status(500).json({
      success: false,
      message: 'Error sending bulk message'
    });
  }
};

/**
 * Send bulk offer to member segment
 * @route POST /api/creator/members/bulk/offer
 */
exports.sendBulkOffer = async (req, res) => {
  try {
    const creatorId = req.user.id;
    const { offerData, segment, maxRecipients = 25 } = req.body;
    
    if (!offerData || !segment) {
      return res.status(400).json({
        success: false,
        message: 'Offer data and segment are required'
      });
    }
    
    // Get members in segment
    const query = {
      'privacy.discoverable': true,
      'privacy.blockedCreators': { $ne: creatorId },
      'privacy.allowSpecialOffers': true
    };
    
    if (segment !== 'all') {
      query['spending.tier'] = segment;
    }
    
    const members = await MemberAnalytics.find(query)
      .limit(maxRecipients)
      .select('member');
    
    // Create bulk offer
    const offer = new SpecialOffer({
      creator: creatorId,
      recipients: {
        members: members.map(m => ({
          member: m.member,
          sentAt: new Date(),
          status: 'pending'
        })),
        totalRecipients: members.length
      },
      offer: offerData,
      status: { current: 'active' }
    });
    
    await offer.save();
    
    res.json({
      success: true,
      message: `Bulk offer sent to ${members.length} members`,
      offerId: offer._id,
      recipientCount: members.length
    });
    
  } catch (error) {
    console.error('Send bulk offer error:', error);
    res.status(500).json({
      success: false,
      message: 'Error sending bulk offer'
    });
  }
};

async function trackProfileView(creatorId, memberId) {
  // Create profile view interaction
  const interaction = new MemberInteraction({
    creator: creatorId,
    member: memberId,
    interactionType: 'profile_view',
    context: {
      source: 'member_discovery'
    }
  });
  
  await interaction.save();
  
  // Update sales activity
  const salesActivity = await CreatorSalesActivity.findOne({ creator: creatorId });
  if (salesActivity) {
    await salesActivity.recordInteraction('profileViews', memberId);
  }
  
  return interaction;
}