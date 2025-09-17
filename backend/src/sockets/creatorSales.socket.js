// backend/src/sockets/creatorSales.socket.js
// WebSocket handlers for real-time creator sales dashboard

const CreatorSalesActivity = require('../models/CreatorSalesActivity');
const MemberInteraction = require('../models/MemberInteraction');
const Transaction = require('../models/Transaction');
const SpecialOffer = require('../models/SpecialOffer');
const { getRealTimeMetrics } = require('../services/analytics.service');

/**
 * Initialize creator sales socket handlers
 */
exports.initializeCreatorSalesSockets = io => {
  const salesNamespace = io.of('/creator-sales');

  // Store active dashboard connections
  const activeDashboards = new Map();

  salesNamespace.on('connection', socket => {
    console.log(`💰 Creator sales socket connected: ${socket.id}`);

    // Authentication and setup
    socket.on('authenticate', async data => {
      try {
        const { creatorId, token } = data;

        // Verify creator identity
        if (!creatorId || !token) {
          socket.emit('error', { message: 'Authentication required' });
          return socket.disconnect();
        }

        // Store creator info
        socket.creatorId = creatorId;
        socket.authenticated = true;

        // Join creator-specific rooms
        socket.join(`creator:${creatorId}`);
        socket.join('creators:active');

        // Initialize dashboard session
        activeDashboards.set(creatorId, {
          socketId: socket.id,
          connectedAt: new Date(),
          lastActivity: new Date(),
        });

        // Send initial dashboard data
        await sendInitialDashboardData(socket, creatorId);

        // Start real-time metrics streaming
        startMetricsStreaming(socket, creatorId);

        socket.emit('authenticated', {
          success: true,
          creatorId,
          timestamp: new Date(),
        });
      } catch (error) {
        console.error('Sales socket authentication error:', error);
        socket.emit('error', { message: 'Authentication failed' });
      }
    });

    // ============================================
    // LIVE SALES DASHBOARD
    // ============================================

    /**
     * Stream real-time metrics
     */
    function startMetricsStreaming(socket, creatorId) {
      // Send metrics every 5 seconds
      const metricsInterval = setInterval(async () => {
        try {
          if (!socket.connected) {
            clearInterval(metricsInterval);
            return;
          }

          const metrics = await getRealTimeMetrics(creatorId);

          socket.emit('metrics:update', {
            metrics,
            timestamp: new Date(),
          });
        } catch (error) {
          console.error('Metrics streaming error:', error);
        }
      }, 5000);

      // Clean up on disconnect
      socket.on('disconnect', () => {
        clearInterval(metricsInterval);
      });
    }

    /**
     * Dashboard widget refresh
     */
    socket.on('dashboard:refresh-widget', async data => {
      try {
        const { widgetType } = data;
        const creatorId = socket.creatorId;

        let widgetData;

        switch (widgetType) {
          case 'revenue':
            widgetData = await getRevenueWidget(creatorId);
            break;
          case 'conversions':
            widgetData = await getConversionsWidget(creatorId);
            break;
          case 'interactions':
            widgetData = await getInteractionsWidget(creatorId);
            break;
          case 'members':
            widgetData = await getActiveMembersWidget(creatorId);
            break;
          case 'leaderboard':
            widgetData = await getLeaderboardWidget(creatorId);
            break;
          default:
            widgetData = null;
        }

        socket.emit('widget:data', {
          widgetType,
          data: widgetData,
          timestamp: new Date(),
        });
      } catch (error) {
        console.error('Widget refresh error:', error);
        socket.emit('error', { message: 'Failed to refresh widget' });
      }
    });

    /**
     * Live activity feed
     */
    socket.on('dashboard:activity-feed', async data => {
      try {
        const creatorId = socket.creatorId;
        const { limit = 20 } = data;

        // Get recent activities
        const activities = await getRecentActivities(creatorId, limit);

        socket.emit('activity:feed', {
          activities,
          timestamp: new Date(),
        });
      } catch (error) {
        console.error('Activity feed error:', error);
      }
    });

    // ============================================
    // REAL-TIME CONVERSION ALERTS
    // ============================================

    /**
     * Broadcast conversion event
     */
    socket.on('conversion:occurred', async data => {
      try {
        const { memberId, amount, interactionType } = data;
        const creatorId = socket.creatorId;

        // Update sales activity
        const salesActivity = await CreatorSalesActivity.findOneAndUpdate(
          { creator: creatorId },
          {
            $inc: {
              'daily.conversions': 1,
              'daily.revenue': amount,
              'metrics.last7Days.totalConversions': 1,
              'metrics.last7Days.totalRevenue': amount,
            },
          },
          { new: true }
        );

        // Calculate conversion rate
        const conversionRate =
          salesActivity.daily.totalInteractions > 0
            ? (
                (salesActivity.daily.conversions /
                  salesActivity.daily.totalInteractions) *
                100
              ).toFixed(2)
            : 0;

        // Broadcast to creator's dashboard
        salesNamespace.to(`creator:${creatorId}`).emit('conversion:alert', {
          memberId,
          amount,
          interactionType,
          conversionRate,
          totalToday: salesActivity.daily.conversions,
          revenueToday: salesActivity.daily.revenue,
          timestamp: new Date(),
          celebration: amount > 100, // Trigger celebration animation for big conversions
        });

        // Check for achievements
        await checkAndUnlockAchievements(salesActivity, socket);

        // Update leaderboard position
        await updateLeaderboardPosition(creatorId, socket);
      } catch (error) {
        console.error('Conversion alert error:', error);
      }
    });

    /**
     * Real-time ROI tracking
     */
    socket.on('roi:calculate', async data => {
      try {
        const { interactionId } = data;
        const creatorId = socket.creatorId;

        // Calculate ROI for interaction
        const {
          trackInteractionROI,
        } = require('../services/analytics.service');
        const roi = await trackInteractionROI(interactionId, creatorId);

        socket.emit('roi:calculated', {
          interactionId,
          roi,
          timestamp: new Date(),
        });
      } catch (error) {
        console.error('ROI calculation error:', error);
      }
    });

    // ============================================
    // INSTANT MEMBER RESPONSES
    // ============================================

    /**
     * Member response notification
     */
    socket.on('member:response-received', async data => {
      try {
        const { memberId, interactionId, responseType } = data;
        const creatorId = socket.creatorId;

        // Get member details
        const MemberAnalytics = require('../models/MemberAnalytics');
        const memberAnalytics = await MemberAnalytics.findOne({
          member: memberId,
        })
          .populate('member', 'username avatar')
          .select('spending.tier activity.level');

        // Broadcast response alert
        salesNamespace.to(`creator:${creatorId}`).emit('response:alert', {
          member: {
            id: memberId,
            username: memberAnalytics?.member.username,
            avatar: memberAnalytics?.member.avatar,
            tier: memberAnalytics?.spending.tier,
          },
          interactionId,
          responseType,
          timestamp: new Date(),
          priority:
            memberAnalytics?.spending.tier === 'whale' ? 'high' : 'normal',
        });

        // Update response metrics
        await updateResponseMetrics(creatorId, responseType);
      } catch (error) {
        console.error('Member response error:', error);
      }
    });

    /**
     * Message read receipt
     */
    socket.on('message:read', async data => {
      try {
        const { memberId, messageId } = data;
        const creatorId = socket.creatorId;

        // Update interaction
        await MemberInteraction.findByIdAndUpdate(messageId, {
          $set: {
            'response.messageRead': true,
            'response.readAt': new Date(),
          },
        });

        // Notify creator
        socket.emit('message:read-receipt', {
          memberId,
          messageId,
          readAt: new Date(),
        });
      } catch (error) {
        console.error('Read receipt error:', error);
      }
    });

    // ============================================
    // COMPETITION UPDATES (GAMIFICATION)
    // ============================================

    /**
     * Leaderboard updates
     */
    socket.on('leaderboard:check', async () => {
      try {
        const creatorId = socket.creatorId;
        const position = await getLeaderboardPosition(creatorId);

        socket.emit('leaderboard:position', position);
      } catch (error) {
        console.error('Leaderboard check error:', error);
      }
    });

    /**
     * Achievement unlocked
     */
    socket.on('achievement:check', async () => {
      try {
        const creatorId = socket.creatorId;
        const salesActivity = await CreatorSalesActivity.findOne({
          creator: creatorId,
        });

        if (salesActivity) {
          await checkAndUnlockAchievements(salesActivity, socket);
        }
      } catch (error) {
        console.error('Achievement check error:', error);
      }
    });

    /**
     * Challenge participation
     */
    socket.on('challenge:join', async data => {
      try {
        const { challengeId } = data;
        const creatorId = socket.creatorId;

        // Join challenge room
        socket.join(`challenge:${challengeId}`);

        // Get challenge details
        const challenge = await getChallenge(challengeId);

        // Broadcast participation
        salesNamespace
          .to(`challenge:${challengeId}`)
          .emit('challenge:participant-joined', {
            creatorId,
            challenge,
            timestamp: new Date(),
          });

        // Send challenge leaderboard
        const challengeLeaderboard = await getChallengeLeaderboard(challengeId);

        socket.emit('challenge:leaderboard', {
          challengeId,
          leaderboard: challengeLeaderboard,
        });
      } catch (error) {
        console.error('Challenge join error:', error);
      }
    });

    /**
     * Live competition updates
     */
    function startCompetitionUpdates(socket, creatorId) {
      // Send competition updates every minute
      const competitionInterval = setInterval(async () => {
        try {
          if (!socket.connected) {
            clearInterval(competitionInterval);
            return;
          }

          // Get current competitions
          const competitions = await getActiveCompetitions();

          // Get creator's position in each
          const positions = await Promise.all(
            competitions.map(async comp => ({
              competitionId: comp._id,
              name: comp.name,
              position: await getCompetitionPosition(creatorId, comp._id),
              timeRemaining: comp.endDate - new Date(),
            }))
          );

          socket.emit('competition:update', {
            competitions: positions,
            timestamp: new Date(),
          });
        } catch (error) {
          console.error('Competition update error:', error);
        }
      }, 60000); // Every minute

      socket.on('disconnect', () => {
        clearInterval(competitionInterval);
      });
    }

    // ============================================
    // GOAL TRACKING
    // ============================================

    /**
     * Goal progress update
     */
    socket.on('goal:check-progress', async () => {
      try {
        const creatorId = socket.creatorId;
        const salesActivity = await CreatorSalesActivity.findOne({
          creator: creatorId,
        });

        if (salesActivity && salesActivity.goals) {
          const activeGoals = salesActivity.goals.filter(
            g => g.status === 'active'
          );

          const goalProgress = activeGoals.map(goal => ({
            id: goal._id,
            type: goal.type,
            target: goal.target,
            current: goal.current,
            progress: ((goal.current / goal.target) * 100).toFixed(2),
            deadline: goal.deadline,
            daysRemaining: Math.ceil(
              (goal.deadline - new Date()) / (1000 * 60 * 60 * 24)
            ),
          }));

          socket.emit('goal:progress', {
            goals: goalProgress,
            timestamp: new Date(),
          });

          // Check for completed goals
          goalProgress.forEach(goal => {
            if (goal.progress >= 100) {
              socket.emit('goal:completed', {
                goalId: goal.id,
                type: goal.type,
                achievement: 'Goal Crusher',
                reward: calculateGoalReward(goal),
              });
            }
          });
        }
      } catch (error) {
        console.error('Goal progress error:', error);
      }
    });

    // ============================================
    // SPECIAL OFFER TRACKING
    // ============================================

    /**
     * Offer performance real-time
     */
    socket.on('offer:track-performance', async data => {
      try {
        const { offerId } = data;

        const offer = await SpecialOffer.findById(offerId);

        if (offer) {
          socket.emit('offer:performance', {
            offerId,
            impressions: offer.performance.impressions,
            redemptions: offer.redemption.totalRedemptions,
            redemptionRate: offer.performance.redemptionRate,
            revenue: offer.performance.totalRevenue,
            timeRemaining: offer.validity.endDate - new Date(),
          });
        }
      } catch (error) {
        console.error('Offer tracking error:', error);
      }
    });

    // ============================================
    // DISCONNECT HANDLING
    // ============================================

    socket.on('disconnect', () => {
      console.log(`💰 Creator sales socket disconnected: ${socket.id}`);

      // Remove from active dashboards
      if (socket.creatorId) {
        activeDashboards.delete(socket.creatorId);
      }

      // Leave all rooms
      socket.rooms.forEach(room => {
        socket.leave(room);
      });
    });
  });

  console.log('✅ Creator sales WebSocket handlers initialized');
};

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Send initial dashboard data
 */
async function sendInitialDashboardData(socket, creatorId) {
  try {
    const salesActivity = await CreatorSalesActivity.findOne({
      creator: creatorId,
    });

    if (!salesActivity) {
      // Create new activity if doesn't exist
      const newActivity = new CreatorSalesActivity({
        creator: creatorId,
        daily: { date: new Date() },
      });
      await newActivity.save();
      salesActivity = newActivity;
    }

    socket.emit('dashboard:initial-data', {
      daily: salesActivity.daily,
      metrics: salesActivity.metrics,
      performance: salesActivity.performance,
      goals: salesActivity.goals.filter(g => g.status === 'active'),
      achievements: salesActivity.gamification.achievements.filter(
        a => a.unlockedAt
      ),
      level: salesActivity.gamification.level,
      points: salesActivity.gamification.points,
      timestamp: new Date(),
    });
  } catch (error) {
    console.error('Error sending initial dashboard data:', error);
  }
}

/**
 * Get revenue widget data
 */
async function getRevenueWidget(creatorId) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const revenue = await Transaction.aggregate([
    {
      $match: {
        creator: creatorId,
        createdAt: { $gte: today },
        status: 'completed',
      },
    },
    {
      $group: {
        _id: null,
        total: { $sum: '$amount' },
        count: { $sum: 1 },
      },
    },
  ]);

  return {
    todayRevenue: revenue[0]?.total || 0,
    transactionCount: revenue[0]?.count || 0,
    avgTransaction: revenue[0] ? revenue[0].total / revenue[0].count : 0,
  };
}

/**
 * Get conversions widget data
 */
async function getConversionsWidget(creatorId) {
  const salesActivity = await CreatorSalesActivity.findOne({
    creator: creatorId,
  });

  return {
    todayConversions: salesActivity?.daily.conversions || 0,
    conversionRate: salesActivity?.performance.overallConversionRate || 0,
    bestConvertingType: Object.entries(
      salesActivity?.performance.conversionRates || {}
    ).sort((a, b) => b[1].rate - a[1].rate)[0],
  };
}

/**
 * Get interactions widget data
 */
async function getInteractionsWidget(creatorId) {
  const salesActivity = await CreatorSalesActivity.findOne({
    creator: creatorId,
  });

  return {
    todayInteractions: salesActivity?.daily.totalInteractions || 0,
    responseRate:
      (salesActivity?.daily.responses /
        (salesActivity?.daily.totalInteractions || 1)) *
      100,
    mostUsedType: salesActivity?.daily.segments,
  };
}

/**
 * Get active members widget
 */
async function getActiveMembersWidget(creatorId) {
  const MemberAnalytics = require('../models/MemberAnalytics');

  const activeMembers = await MemberAnalytics.find({
    'activity.isOnline': true,
    'privacy.discoverable': true,
    'privacy.blockedCreators': { $ne: creatorId },
  })
    .select('member spending.tier')
    .limit(10);

  return {
    onlineCount: activeMembers.length,
    whalesOnline: activeMembers.filter(m => m.spending.tier === 'whale').length,
    vipsOnline: activeMembers.filter(m => m.spending.tier === 'vip').length,
  };
}

/**
 * Get leaderboard widget
 */
async function getLeaderboardWidget(creatorId) {
  return await getLeaderboardPosition(creatorId);
}

/**
 * Get recent activities
 */
async function getRecentActivities(creatorId, limit) {
  const activities = [];

  // Get recent interactions
  const interactions = await MemberInteraction.find({ creator: creatorId })
    .sort('-createdAt')
    .limit(limit)
    .populate('member', 'username avatar');

  interactions.forEach(interaction => {
    activities.push({
      type: 'interaction',
      subtype: interaction.interactionType,
      member: interaction.member,
      timestamp: interaction.createdAt,
      converted: interaction.conversion.resulted_in_purchase,
    });
  });

  // Sort by timestamp
  activities.sort((a, b) => b.timestamp - a.timestamp);

  return activities.slice(0, limit);
}

/**
 * Check and unlock achievements
 */
async function checkAndUnlockAchievements(salesActivity, socket) {
  const achievements = salesActivity.gamification.achievements;

  // Check each achievement
  achievements.forEach(achievement => {
    if (
      !achievement.unlockedAt &&
      checkAchievementCriteria(achievement, salesActivity)
    ) {
      achievement.unlockedAt = new Date();
      achievement.progress = 100;

      // Notify creator
      socket.emit('achievement:unlocked', {
        achievement: {
          id: achievement.id,
          name: achievement.name,
          description: achievement.description,
          icon: achievement.icon,
          points: achievement.points,
        },
        totalPoints: salesActivity.gamification.points + achievement.points,
      });

      // Update points
      salesActivity.gamification.points += achievement.points;
    }
  });

  await salesActivity.save();
}

/**
 * Check achievement criteria
 */
function checkAchievementCriteria(achievement, salesActivity) {
  // Implementation depends on achievement type
  switch (achievement.id) {
    case 'first_conversion':
      return salesActivity.metrics.allTime.totalConversions >= 1;
    case 'whale_hunter':
      return salesActivity.metrics.whaleConversions >= 1;
    case 'centurion':
      return salesActivity.metrics.allTime.totalInteractions >= 100;
    default:
      return false;
  }
}

/**
 * Get leaderboard position
 */
async function getLeaderboardPosition(creatorId) {
  const allCreators = await CreatorSalesActivity.find({})
    .sort('-metrics.last30Days.totalRevenue')
    .select('creator metrics.last30Days.totalRevenue');

  const position =
    allCreators.findIndex(c => c.creator.toString() === creatorId) + 1;
  const total = allCreators.length;
  const percentile =
    position > 0 ? Math.round((1 - position / total) * 100) : 0;

  return {
    position,
    total,
    percentile,
    nearbyCreators: allCreators.slice(
      Math.max(0, position - 2),
      Math.min(total, position + 3)
    ),
  };
}

/**
 * Update leaderboard position
 */
async function updateLeaderboardPosition(creatorId, socket) {
  const position = await getLeaderboardPosition(creatorId);

  socket.emit('leaderboard:updated', position);

  // Check for rank improvements
  const previousPosition = socket.previousPosition || position.position;

  if (position.position < previousPosition) {
    socket.emit('rank:improved', {
      previousRank: previousPosition,
      newRank: position.position,
      spotsGained: previousPosition - position.position,
    });
  }

  socket.previousPosition = position.position;
}

/**
 * Update response metrics
 */
async function updateResponseMetrics(creatorId, responseType) {
  await CreatorSalesActivity.findOneAndUpdate(
    { creator: creatorId },
    {
      $inc: {
        'daily.responses': 1,
        [`daily.responseTypes.${responseType}`]: 1,
      },
    }
  );
}

/**
 * Get active competitions
 */
async function getActiveCompetitions() {
  // This would fetch from a Competition model
  return [];
}

/**
 * Get competition position
 */
async function getCompetitionPosition(creatorId, competitionId) {
  // This would calculate position in specific competition
  return 1;
}

/**
 * Get challenge details
 */
async function getChallenge(challengeId) {
  // This would fetch from a Challenge model
  return {
    id: challengeId,
    name: 'Daily Conversion Challenge',
    target: 10,
    reward: 500,
  };
}

/**
 * Get challenge leaderboard
 */
async function getChallengeLeaderboard(challengeId) {
  // This would fetch challenge participants and their progress
  return [];
}

/**
 * Calculate goal reward
 */
function calculateGoalReward(goal) {
  const baseReward = 100;
  const difficultyMultiplier = goal.target / 10;

  return Math.round(baseReward * difficultyMultiplier);
}

module.exports = exports;
