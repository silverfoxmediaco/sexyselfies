const CreatorConnection = require('../models/CreatorConnection');
const CreatorProfile = require('../models/CreatorProfile');
const Creator = require('../models/Creator');
const Member = require('../models/Member');
const CreatorAnalytics = require('../models/CreatorAnalytics');
const mongoose = require('mongoose');
const { sendNotification } = require('../utils/notifications');

// Get swipe stack for member (browse mode)
exports.getSwipeStack = async (req, res) => {
  try {
    const memberId = req.user.id;
    const member = await Member.findById(memberId);

    // Get member's preferences
    const {
      orientation = 'all',
      gender = 'all',
      ageRange = [18, 99],
      bodyType = 'all',
      ethnicity = 'all',
      contentType = 'all',
    } = req.query;

    // Get already swiped creators to exclude
    const swipedCreators = await CreatorConnection.find({
      member: memberId,
      'swipeData.memberSwiped.direction': { $exists: true },
    }).select('creator');

    const excludeIds = swipedCreators.map(c => c.creator);

    // Build query based on filters
    const query = {
      _id: { $nin: excludeIds },
      isActive: true,
      isVerified: true,
      showInBrowse: true, // Check if creator wants to be browsed
    };

    // Apply orientation filter
    if (orientation !== 'all') {
      query.orientation = orientation;
    }

    // Apply gender filter based on member's orientation
    if (member.orientation === 'straight') {
      query.gender = member.gender === 'male' ? 'female' : 'male';
    } else if (member.orientation === 'gay') {
      query.gender = member.gender;
    } else if (member.orientation === 'lesbian') {
      query.gender = 'female';
    }
    // Bi/pan see all genders

    // Apply other filters
    if (ageRange && ageRange.length === 2) {
      query.age = { $gte: ageRange[0], $lte: ageRange[1] };
    }

    if (bodyType !== 'all') {
      query.bodyType = Array.isArray(bodyType) ? { $in: bodyType } : bodyType;
    }

    if (ethnicity !== 'all') {
      query.ethnicity = Array.isArray(ethnicity)
        ? { $in: ethnicity }
        : ethnicity;
    }

    // Get creators - location-based filtering removed since only country data collected
    const creators = await Creator.find(query).limit(50);

    // Shuffle and apply smart algorithm
    const stack = await applySmartAlgorithm(creators, member, {
      orientation,
      preferences: { gender, bodyType, ethnicity },
    });

    // Enrich creator data
    const enrichedStack = await Promise.all(
      stack.map(async creator => {
        const profile = await CreatorProfile.findOne({ creator: creator._id });
        const analytics = await CreatorAnalytics.findOne({
          creator: creator._id,
        });

        return {
          id: creator._id,
          username: creator.username,
          displayName: profile?.branding?.displayName || creator.username,
          age: creator.age,
          bio: profile?.branding?.bio || '',
          profileImage: creator.profileImage,
          coverImage: profile?.branding?.coverImage,
          gallery: creator.gallery?.slice(0, 5), // First 5 images


          attributes: {
            orientation: creator.orientation,
            gender: creator.gender,
            bodyType: creator.bodyType,
            ethnicity: creator.ethnicity,
            height: creator.height,
            interests: creator.interests,
          },

          stats: {
            contentCount: profile?.analytics?.performance?.totalContent || 0,
            avgPrice: profile?.preferences?.pricing?.defaultPrice || 2.99,
            rating: profile?.analytics?.performance?.rating || 0,
            verified: creator.isVerified,
            trending: analytics?.realTime?.trending?.isTrending || false,
            activeNow: isActiveNow(creator.lastActive),
          },

          compatibility: {
            score: calculateCompatibility(member, creator),
            connectionPrediction: predictConnectionSuccess(member, creator),
          },

          contentPreview: {
            hasPhotos: true,
            hasVideos: profile?.preferences?.contentTypes?.includes('video'),
            priceRange: {
              min: 0.99,
              max: 9.99,
            },
          },
        };
      })
    );

    // Track browse session
    await trackBrowseSession(memberId, enrichedStack, req.query);

    res.json({
      success: true,
      stack: enrichedStack,
      filters: {
        orientation,
        gender,
        ageRange,
        distance,
        bodyType,
        ethnicity,
      },
      sessionId: generateSessionId(),
    });
  } catch (error) {
    console.error('Get swipe stack error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching creators',
    });
  }
};

// Process swipe action
exports.swipe = async (req, res) => {
  try {
    const memberId = req.user.id;
    const { creatorId, direction, superLike = false } = req.body;

    if (!['left', 'right', 'super'].includes(direction)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid swipe direction',
      });
    }

    // Check if already connected
    let connection = await CreatorConnection.findOne({
      creator: creatorId,
      member: memberId,
    });

    if (connection && connection.swipeData.memberSwiped.direction) {
      return res.status(400).json({
        success: false,
        message: 'Already swiped on this creator',
      });
    }

    // Create or update connection record
    if (!connection) {
      connection = new CreatorConnection({
        creator: creatorId,
        member: memberId,
        status: 'pending',
      });
    }

    // Record swipe data
    connection.swipeData.memberSwiped = {
      direction: superLike ? 'super' : direction,
      swipedAt: new Date(),
      superLike,
      sessionTime: req.body.sessionTime || 0,
      viewedPhotos: req.body.viewedPhotos || 1,
      readBio: req.body.readBio || false,
    };

    // Record browse context
    connection.browseContext = {
      filters: req.body.filters || {},
      algorithm: {
        score: req.body.algorithmScore || 0,
        reason: req.body.browseReason || 'standard',
        position: req.body.stackPosition || 0,
      },
      searchSession: {
        sessionId: req.body.sessionId,
        totalSwipes: req.body.totalSwipes || 1,
        rightSwipes: req.body.rightSwipes || (direction === 'right' ? 1 : 0),
        leftSwipes: req.body.leftSwipes || (direction === 'left' ? 1 : 0),
      },
    };

    let isConnected = false;
    let instantConnection = false;

    // Check for connection if swiped right
    if (direction === 'right' || direction === 'super') {
      // Get creator's settings
      const creatorProfile = await CreatorProfile.findOne({
        creator: creatorId,
      });

      // Check if creator has auto-connect enabled
      if (creatorProfile?.preferences?.autoConnect) {
        connection.swipeData.creatorSwiped = {
          direction: 'right',
          swipedAt: new Date(),
          autoConnected: true,
        };
        connection.status = 'connected';
        connection.connectedAt = new Date();
        isConnected = true;
        instantConnection = true;
      } else {
        // Check if creator already swiped right on this member
        if (connection.swipeData.creatorSwiped?.direction === 'right') {
          connection.status = 'connected';
          connection.connectedAt = new Date();
          isConnected = true;
        } else {
          // Notify creator of the like (especially super likes)
          if (superLike) {
            await notifyCreatorOfSuperLike(creatorId, memberId);
          }
        }
      }
    }

    await connection.save();

    // Update analytics
    await updateSwipeAnalytics(creatorId, memberId, direction, isConnected);

    // If it's a connection, send notifications
    if (isConnected) {
      await handleNewConnection(connection, instantConnection);
    }

    res.json({
      success: true,
      connected: isConnected,
      instantConnection,
      connectionId: isConnected ? connection._id : null,
      message: isConnected
        ? "It's a connection! Start chatting now 🎉"
        : direction === 'right'
          ? 'Like sent!'
          : 'Passed',
    });
  } catch (error) {
    console.error('Swipe error:', error);
    res.status(500).json({
      success: false,
      message: 'Error processing swipe',
    });
  }
};

// Get creator's pending likes (for creators to review)
exports.getPendingLikes = async (req, res) => {
  try {
    const creatorId = req.user.id;
    const { page = 1, limit = 20 } = req.query;

    const skip = (page - 1) * limit;

    // Get members who swiped right but creator hasn't responded
    const pendingLikes = await CreatorConnection.find({
      creator: creatorId,
      'swipeData.memberSwiped.direction': { $in: ['right', 'super'] },
      'swipeData.creatorSwiped.direction': { $exists: false },
      status: 'pending',
    })
      .populate('member', 'username profileImage bio age location interests')
      .sort('-swipeData.memberSwiped.swipedAt')
      .skip(skip)
      .limit(parseInt(limit));

    const total = await CreatorConnection.countDocuments({
      creator: creatorId,
      'swipeData.memberSwiped.direction': { $in: ['right', 'super'] },
      'swipeData.creatorSwiped.direction': { $exists: false },
      status: 'pending',
    });

    // Enrich with member data
    const enrichedLikes = pendingLikes.map(like => ({
      id: like._id,
      member: {
        id: like.member._id,
        username: like.member.username,
        profileImage: like.member.profileImage,
        bio: like.member.bio,
        age: like.member.age,
        location: like.member.location,
        interests: like.member.interests,
      },
      superLike: like.swipeData.memberSwiped.superLike,
      likedAt: like.swipeData.memberSwiped.swipedAt,
      viewedPhotos: like.swipeData.memberSwiped.viewedPhotos,
      readBio: like.swipeData.memberSwiped.readBio,
      compatibility: like.browseContext?.algorithm?.score || 0,
      potentialValue: estimateMemberValue(like),
    }));

    res.json({
      success: true,
      pendingLikes: enrichedLikes,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
      stats: {
        totalPending: total,
        superLikes: enrichedLikes.filter(l => l.superLike).length,
        todayLikes: enrichedLikes.filter(
          l => new Date(l.likedAt).toDateString() === new Date().toDateString()
        ).length,
      },
    });
  } catch (error) {
    console.error('Get pending likes error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching pending likes',
    });
  }
};

// Creator responds to a like
exports.respondToLike = async (req, res) => {
  try {
    const creatorId = req.user.id;
    const { connectionId, direction } = req.body;

    if (!['left', 'right'].includes(direction)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid response direction',
      });
    }

    const connection = await CreatorConnection.findOne({
      _id: connectionId,
      creator: creatorId,
      status: 'pending',
    });

    if (!connection) {
      return res.status(404).json({
        success: false,
        message: 'Pending like not found',
      });
    }

    // Record creator's swipe
    connection.swipeData.creatorSwiped = {
      direction,
      swipedAt: new Date(),
      autoConnected: false,
    };

    let isConnected = false;

    if (direction === 'right') {
      // It's a connection!
      connection.status = 'connected';
      connection.connectedAt = new Date();
      isConnected = true;

      // Initialize engagement tracking
      connection.engagement.firstMessageSent.by = null;
      connection.relationship.health.status = 'active';

      await handleNewConnection(connection, false);
    } else {
      // Creator passed
      connection.status = 'disconnected';
      connection.disconnectedAt = new Date();
    }

    await connection.save();

    res.json({
      success: true,
      connected: isConnected,
      message: isConnected ? "It's a connection! 🎉" : 'Passed',
    });
  } catch (error) {
    console.error('Respond to like error:', error);
    res.status(500).json({
      success: false,
      message: 'Error responding to like',
    });
  }
};

// Get all connections for a user
exports.getConnections = async (req, res) => {
  try {
    const userId = req.user.id;
    const userType = req.user.type; // 'creator' or 'member'
    const {
      page = 1,
      limit = 20,
      filter = 'all', // all, active, new, at_risk
    } = req.query;

    const skip = (page - 1) * limit;

    // Build query
    const query = {};

    if (userType === 'creator') {
      query.creator = userId;
      // Creators should see both pending (incoming likes) and connected
      query.status = { $in: ['pending', 'connected'] };
    } else {
      query.member = userId;
      // Members only see connected relationships
      query.status = 'connected';
    }

    // Apply filters
    if (filter === 'active') {
      query['relationship.health.status'] = { $in: ['thriving', 'active'] };
    } else if (filter === 'new') {
      query.connectedAt = {
        $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      };
    } else if (filter === 'at_risk') {
      query['relationship.health.churnRisk'] = { $gte: 70 };
    }

    const connections = await CreatorConnection.find(query)
      .populate('creator', 'username profileImage bio isVerified')
      .populate('member', 'username profileImage lastActive')
      .sort('-createdAt')
      .skip(skip)
      .limit(parseInt(limit));

    const total = await CreatorConnection.countDocuments(query);

    // Enrich connections with additional data
    const enrichedConnections = await Promise.all(
      connections.map(async connection => {
        const otherUser =
          userType === 'creator' ? connection.member : connection.creator;

        return {
          id: connection._id,
          user: {
            id: otherUser._id,
            username: otherUser.username,
            profileImage: otherUser.profileImage,
            bio: otherUser.bio,
            verified: otherUser.isVerified,
            lastActive: otherUser.lastActive,
            online: isActiveNow(otherUser.lastActive),
          },
          connectedAt: connection.connectedAt,

          engagement: {
            totalMessages:
              connection.engagement.totalMessages.fromCreator +
              connection.engagement.totalMessages.fromMember,
            lastMessage: connection.engagement.lastMessageAt,
            unreadMessages: await getUnreadCount(connection._id, userId),
            contentUnlocked: connection.engagement.contentUnlocked.count,
            totalSpent: connection.monetization.totalRevenue,
          },

          relationship: {
            status: connection.relationship.health.status,
            churnRisk: connection.relationship.health.churnRisk,
            spendingLevel: connection.relationship.memberScore.spendingLevel,
            loyaltyScore: connection.relationship.memberScore.loyaltyScore,
          },

          lastInteraction: connection.engagement.lastActiveAt,

          notifications: {
            muted:
              !connection.notifications[userType + 'Preferences'].newMessage,
          },
        };
      })
    );

    res.json({
      success: true,
      connections: enrichedConnections,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
      summary: {
        total,
        active: enrichedConnections.filter(
          c =>
            c.relationship.status === 'active' ||
            c.relationship.status === 'thriving'
        ).length,
        atRisk: enrichedConnections.filter(c => c.relationship.churnRisk >= 70)
          .length,
        new: enrichedConnections.filter(
          c =>
            new Date(c.connectedAt) > new Date(Date.now() - 24 * 60 * 60 * 1000)
        ).length,
      },
    });
  } catch (error) {
    console.error('Get connections error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching connections',
    });
  }
};

// Disconnect from someone
exports.disconnect = async (req, res) => {
  try {
    const userId = req.user.id;
    const { connectionId } = req.params;

    const connection = await CreatorConnection.findById(connectionId);

    if (!connection) {
      return res.status(404).json({
        success: false,
        message: 'Connection not found',
      });
    }

    // Verify user is part of this connection
    if (
      connection.creator.toString() !== userId &&
      connection.member.toString() !== userId
    ) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized',
      });
    }

    connection.status = 'disconnected';
    connection.disconnectedAt = new Date();

    await connection.save();

    res.json({
      success: true,
      message: 'Disconnected successfully',
    });
  } catch (error) {
    console.error('Disconnect error:', error);
    res.status(500).json({
      success: false,
      message: 'Error disconnecting',
    });
  }
};

// Get connection analytics for creator
exports.getConnectionAnalytics = async (req, res) => {
  try {
    const creatorId = req.user.id;
    const { period = '30d' } = req.query;

    const periodDate = getPeriodStartDate(period);

    // Get all connections for analytics
    const allConnections = await CreatorConnection.find({
      creator: creatorId,
      createdAt: { $gte: periodDate },
    });

    const activeConnections = await CreatorConnection.find({
      creator: creatorId,
      status: 'connected',
      'relationship.health.status': { $in: ['thriving', 'active'] },
    });

    const analytics = {
      overview: {
        totalSwipesReceived: allConnections.length,
        rightSwipes: allConnections.filter(
          c =>
            c.swipeData.memberSwiped.direction === 'right' ||
            c.swipeData.memberSwiped.direction === 'super'
        ).length,
        superLikes: allConnections.filter(
          c => c.swipeData.memberSwiped.superLike
        ).length,
        connections: allConnections.filter(c => c.status === 'connected')
          .length,
        activeConnections: activeConnections.length,
      },

      conversionRates: {
        swipeToConnection: calculateConversionRate(
          allConnections.filter(
            c => c.swipeData.memberSwiped.direction === 'right'
          ).length,
          allConnections.filter(c => c.status === 'connected').length
        ),
        connectionToMessage: calculateConversionRate(
          allConnections.filter(c => c.status === 'connected').length,
          allConnections.filter(c => c.engagement.totalMessages.fromMember > 0)
            .length
        ),
        connectionToPurchase: calculateConversionRate(
          allConnections.filter(c => c.status === 'connected').length,
          allConnections.filter(c => c.monetization.totalRevenue > 0).length
        ),
      },

      revenue: {
        fromConnections: activeConnections.reduce(
          (sum, c) => sum + c.monetization.totalRevenue,
          0
        ),
        averagePerConnection:
          activeConnections.length > 0
            ? activeConnections.reduce(
                (sum, c) => sum + c.monetization.totalRevenue,
                0
              ) / activeConnections.length
            : 0,
        topConnections: await CreatorConnection.findTopSpenders(creatorId, 5),
      },

      engagement: {
        avgMessagesPerConnection: calculateAverage(
          activeConnections.map(
            c =>
              c.engagement.totalMessages.fromCreator +
              c.engagement.totalMessages.fromMember
          )
        ),
        responseRate: calculateResponseRate(activeConnections),
        avgResponseTime: calculateAvgResponseTime(activeConnections),
      },

      demographics: await getConnectionDemographics(creatorId, periodDate),

      trends: {
        daily: await getDailyConnectionTrends(creatorId, periodDate),
        hourly: await getHourlyConnectionPatterns(creatorId),
      },

      insights: generateConnectionInsights(analytics, activeConnections),
    };

    res.json({
      success: true,
      analytics,
    });
  } catch (error) {
    console.error('Get connection analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching analytics',
    });
  }
};

// Update connection preferences
exports.updateConnectionPreferences = async (req, res) => {
  try {
    const userId = req.user.id;
    const { connectionId } = req.params;
    const { notifications } = req.body;

    const connection = await CreatorConnection.findById(connectionId);

    if (!connection) {
      return res.status(404).json({
        success: false,
        message: 'Connection not found',
      });
    }

    const userType =
      connection.creator.toString() === userId ? 'creator' : 'member';

    if (notifications) {
      connection.notifications[userType + 'Preferences'] = {
        ...connection.notifications[userType + 'Preferences'],
        ...notifications,
      };
    }

    await connection.save();

    res.json({
      success: true,
      message: 'Preferences updated',
    });
  } catch (error) {
    console.error('Update preferences error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating preferences',
    });
  }
};

// Helper functions

async function applySmartAlgorithm(creators, member, filters) {
  // Score and sort creators based on multiple factors
  const scoredCreators = creators.map(creator => {
    let score = 0;

    // Location proximity removed - only country data collected

    // Activity level
    if (isActiveNow(creator.lastActive)) {
      score += 50;
    }

    // Verification status
    if (creator.isVerified) {
      score += 30;
    }

    // Content freshness
    const daysSinceLastContent = Math.floor(
      (Date.now() - new Date(creator.lastContentAt)) / (1000 * 60 * 60 * 24)
    );
    if (daysSinceLastContent < 7) {
      score += 40;
    }

    // Random factor for diversity
    score += Math.random() * 20;

    return { ...creator.toObject(), score };
  });

  // Sort by score
  scoredCreators.sort((a, b) => b.score - a.score);

  // Inject some randomness to avoid predictability
  const shuffled = [];
  while (scoredCreators.length > 0) {
    const index =
      Math.random() < 0.7
        ? 0
        : Math.floor(Math.random() * Math.min(5, scoredCreators.length));
    shuffled.push(scoredCreators.splice(index, 1)[0]);
  }

  return shuffled;
}

function calculateCompatibility(member, creator) {
  let score = 50; // Base score

  // Orientation compatibility
  if (
    isOrientationCompatible(
      member.orientation,
      creator.orientation,
      member.gender,
      creator.gender
    )
  ) {
    score += 30;
  }

  // Interest overlap
  const commonInterests =
    member.interests?.filter(i => creator.interests?.includes(i)).length || 0;
  score += commonInterests * 5;

  // Age compatibility
  const ageDiff = Math.abs(member.age - creator.age);
  if (ageDiff < 5) score += 10;
  else if (ageDiff < 10) score += 5;

  return Math.min(100, score);
}

function isOrientationCompatible(
  memberOri,
  creatorOri,
  memberGender,
  creatorGender
) {
  if (memberOri === 'straight') {
    return creatorGender !== memberGender;
  }
  if (memberOri === 'gay' || memberOri === 'lesbian') {
    return creatorGender === memberGender;
  }
  return true; // Bi/pan are compatible with all
}

function predictConnectionSuccess(member, creator) {
  // Simple prediction based on compatibility and activity
  const compatibility = calculateCompatibility(member, creator);
  const activityScore = isActiveNow(creator.lastActive) ? 20 : 0;

  return Math.min(95, compatibility * 0.7 + activityScore + Math.random() * 10);
}

function isActiveNow(lastActive) {
  if (!lastActive) return false;
  const minutesAgo = (Date.now() - new Date(lastActive)) / (1000 * 60);
  return minutesAgo < 15;
}

async function trackBrowseSession(memberId, stack, filters) {
  // Track for analytics
  // Would store in analytics collection
  console.log(
    `Browse session for member ${memberId}: ${stack.length} creators shown`
  );
}

function generateSessionId() {
  return (
    'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9)
  );
}

async function notifyCreatorOfSuperLike(creatorId, memberId) {
  const member = await Member.findById(memberId).select(
    'username profileImage'
  );

  await sendNotification(creatorId, {
    type: 'super_like',
    title: 'You got a Super Like! 💫',
    body: `${member.username} super liked you!`,
    data: {
      memberId,
      memberUsername: member.username,
      memberImage: member.profileImage,
    },
  });
}

async function updateSwipeAnalytics(
  creatorId,
  memberId,
  direction,
  isConnected
) {
  // Update creator analytics - browse funnel
  const analytics = await CreatorAnalytics.findOne({ creator: creatorId });
  if (analytics) {
    analytics.funnels.browse.swipedRight++;
    if (isConnected) {
      analytics.funnels.browse.connected++;
    }
    await analytics.save();
  }
}

async function handleNewConnection(connection, instantConnection) {
  // Send notifications to both parties
  const creator = await Creator.findById(connection.creator).select(
    'username profileImage'
  );
  const member = await Member.findById(connection.member).select(
    'username profileImage'
  );

  // Notify member
  await sendNotification(connection.member, {
    type: 'new_connection',
    title: instantConnection
      ? 'Instant Connection! 🎉'
      : "It's a Connection! 💕",
    body: `You connected with ${creator.username}!`,
    data: {
      connectionId: connection._id,
      creatorId: connection.creator,
      creatorUsername: creator.username,
      creatorImage: creator.profileImage,
    },
  });

  // Notify creator if not instant connection
  if (!instantConnection) {
    await sendNotification(connection.creator, {
      type: 'new_connection',
      title: 'New Connection! 💕',
      body: `You connected with ${member.username}!`,
      data: {
        connectionId: connection._id,
        memberId: connection.member,
        memberUsername: member.username,
        memberImage: member.profileImage,
      },
    });
  }
}

function estimateMemberValue(connection) {
  // Estimate based on profile and behavior
  let value = 50; // Base value

  if (connection.swipeData.memberSwiped.superLike) value += 30;
  if (connection.swipeData.memberSwiped.readBio) value += 10;
  if (connection.swipeData.memberSwiped.viewedPhotos > 3) value += 20;

  return value;
}

async function getUnreadCount(connectionId, userId) {
  // Would query messages collection
  return Math.floor(Math.random() * 5);
}

function getPeriodStartDate(period) {
  const now = new Date();
  switch (period) {
    case '24h':
      return new Date(now - 24 * 60 * 60 * 1000);
    case '7d':
      return new Date(now - 7 * 24 * 60 * 60 * 1000);
    case '30d':
      return new Date(now - 30 * 24 * 60 * 60 * 1000);
    default:
      return new Date(now - 30 * 24 * 60 * 60 * 1000);
  }
}

function calculateConversionRate(total, converted) {
  if (total === 0) return 0;
  return ((converted / total) * 100).toFixed(2);
}

function calculateAverage(numbers) {
  if (numbers.length === 0) return 0;
  return numbers.reduce((a, b) => a + b, 0) / numbers.length;
}

function calculateResponseRate(connections) {
  const responded = connections.filter(
    c => c.engagement.totalMessages.fromCreator > 0
  ).length;
  return calculateConversionRate(connections.length, responded);
}

function calculateAvgResponseTime(connections) {
  // Would calculate actual response times
  return 15; // minutes
}

async function getConnectionDemographics(creatorId, periodDate) {
  // Would aggregate connection demographics
  return {
    age: [
      { range: '18-24', count: 35, percentage: 35 },
      { range: '25-34', count: 45, percentage: 45 },
      { range: '35-44', count: 15, percentage: 15 },
      { range: '45+', count: 5, percentage: 5 },
    ],
    gender: [
      { type: 'male', count: 60, percentage: 60 },
      { type: 'female', count: 35, percentage: 35 },
      { type: 'other', count: 5, percentage: 5 },
    ],
    orientation: [
      { type: 'straight', count: 70, percentage: 70 },
      { type: 'bi', count: 20, percentage: 20 },
      { type: 'gay', count: 10, percentage: 10 },
    ],
  };
}

async function getDailyConnectionTrends(creatorId, periodDate) {
  // Would aggregate daily connection data
  return Array.from({ length: 7 }, (_, i) => ({
    date: new Date(Date.now() - i * 24 * 60 * 60 * 1000),
    connections: Math.floor(Math.random() * 20) + 5,
    messages: Math.floor(Math.random() * 50) + 10,
    revenue: Math.floor(Math.random() * 200) + 50,
  }));
}

async function getHourlyConnectionPatterns(creatorId) {
  // Would analyze hourly patterns
  return Array.from({ length: 24 }, (_, hour) => ({
    hour,
    connections: Math.floor(Math.random() * 10),
    activity: hour >= 20 && hour <= 23 ? 'high' : 'normal',
  }));
}

function generateConnectionInsights(analytics, activeConnections) {
  const insights = [];

  if (analytics.overview.superLikes > 5) {
    insights.push(
      'You received ' +
        analytics.overview.superLikes +
        ' super likes this period!'
    );
  }

  if (analytics.conversionRates.connectionToPurchase < 20) {
    insights.push(
      'Tip: Engage with connections quickly to increase conversions'
    );
  }

  if (analytics.revenue.averagePerConnection < 10) {
    insights.push(
      'Consider offering exclusive content to increase connection value'
    );
  }

  return insights;
}

// Find or create connection for messaging
exports.findOrCreateConnection = async (req, res) => {
  try {
    const creatorId = req.user.id;
    const { memberId } = req.body;

    console.log('🔍 [findOrCreateConnection] Looking for connection:', { creatorId, memberId });

    // First try to find existing connection
    let connection = await CreatorConnection.findOne({
      $or: [
        { creator: creatorId, member: memberId },
        { member: creatorId, creator: memberId } // In case of reversed roles
      ]
    });

    if (connection) {
      console.log('✅ [findOrCreateConnection] Found existing connection:', connection._id);
      return res.json({
        success: true,
        connection: {
          id: connection._id,
          status: connection.status,
          createdAt: connection.createdAt
        },
        existed: true
      });
    }

    // Create new connection if none exists
    console.log('📝 [findOrCreateConnection] Creating new connection');

    connection = new CreatorConnection({
      creator: creatorId,
      member: memberId,
      status: 'connected', // Auto-connect for messaging
      context: 'direct_message',
      createdAt: new Date(),
      connectionSource: 'creator_initiated',
      swipeData: {
        creatorSwiped: {
          direction: 'right',
          swipedAt: new Date()
        }
      },
      relationship: {
        memberScore: {
          tier: 'new',
          score: 0
        }
      },
      monetization: {
        totalRevenue: 0
      },
      engagement: {
        lastActiveAt: new Date()
      }
    });

    await connection.save();
    console.log('✅ [findOrCreateConnection] Created new connection:', connection._id);

    res.json({
      success: true,
      connection: {
        id: connection._id,
        status: connection.status,
        createdAt: connection.createdAt
      },
      existed: false
    });

  } catch (error) {
    console.error('Find or create connection error:', error);
    res.status(500).json({
      success: false,
      message: 'Error finding or creating connection',
      error: error.message
    });
  }
};

module.exports = exports;
