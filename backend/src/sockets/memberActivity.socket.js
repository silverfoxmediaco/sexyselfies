// backend/src/sockets/memberActivity.socket.js
// WebSocket handlers for real-time member activity tracking

const MemberAnalytics = require('../models/MemberAnalytics');
const MemberInteraction = require('../models/MemberInteraction');
const Transaction = require('../models/Transaction');
const { trackEvent } = require('../services/analytics.service');

/**
 * Initialize member activity socket handlers
 */
exports.initializeMemberActivitySockets = io => {
  const memberNamespace = io.of('/member-activity');

  memberNamespace.on('connection', socket => {
    console.log(`👤 Member activity socket connected: ${socket.id}`);

    // Authentication
    socket.on('authenticate', async data => {
      try {
        const { userId, role } = data;

        if (!userId) {
          socket.emit('error', { message: 'Authentication required' });
          return socket.disconnect();
        }

        // Store user info in socket
        socket.userId = userId;
        socket.userRole = role;

        // Join user-specific room
        socket.join(`user:${userId}`);

        // Join role-specific room
        socket.join(`role:${role}`);

        // If creator, join creator-specific rooms
        if (role === 'creator') {
          socket.join('creators:all');
          socket.join(`creator:${userId}`);

          // Subscribe to high-value member updates
          await subscribeToHighValueMembers(socket, userId);
        }

        // If member, update online status
        if (role === 'member') {
          await updateMemberOnlineStatus(userId, true);
          socket.join(`member:${userId}`);
        }

        socket.emit('authenticated', {
          success: true,
          userId,
          role,
        });
      } catch (error) {
        console.error('Socket authentication error:', error);
        socket.emit('error', { message: 'Authentication failed' });
      }
    });

    // ============================================
    // REAL-TIME ONLINE STATUS
    // ============================================

    /**
     * Track member coming online
     */
    socket.on('member:online', async data => {
      try {
        const { memberId } = data;

        await updateMemberOnlineStatus(memberId, true);

        // Get member analytics for tier info
        const analytics = await MemberAnalytics.findOne({
          member: memberId,
        }).select('spending.tier activity.level');

        // Notify relevant creators
        if (
          (analytics && analytics.spending.tier === 'whale') ||
          analytics.spending.tier === 'vip'
        ) {
          memberNamespace.to('creators:all').emit('high-value-member:online', {
            memberId,
            tier: analytics.spending.tier,
            activityLevel: analytics.activity.level,
            timestamp: new Date(),
          });
        }

        // Broadcast to monitoring dashboards
        memberNamespace.to('role:admin').emit('member:status-changed', {
          memberId,
          status: 'online',
          timestamp: new Date(),
        });
      } catch (error) {
        console.error('Error updating online status:', error);
        socket.emit('error', { message: 'Failed to update status' });
      }
    });

    /**
     * Track member going offline
     */
    socket.on('member:offline', async data => {
      try {
        const { memberId } = data;

        await updateMemberOnlineStatus(memberId, false);

        // Notify monitoring
        memberNamespace.to('role:admin').emit('member:status-changed', {
          memberId,
          status: 'offline',
          timestamp: new Date(),
        });
      } catch (error) {
        console.error('Error updating offline status:', error);
      }
    });

    /**
     * Track member activity heartbeat
     */
    socket.on('member:heartbeat', async data => {
      try {
        const { memberId, activity } = data;

        // Update last active timestamp
        await MemberAnalytics.findOneAndUpdate(
          { member: memberId },
          {
            $set: {
              'activity.lastActive': new Date(),
              'activity.isOnline': true,
              'activity.currentActivity': activity,
            },
          }
        );

        // Track activity
        await trackEvent({
          category: 'member_activity',
          action: 'heartbeat',
          userId: memberId,
          userType: 'member',
          metadata: { activity },
        });
      } catch (error) {
        console.error('Heartbeat error:', error);
      }
    });

    // ============================================
    // LIVE SPENDING UPDATES
    // ============================================

    /**
     * Broadcast spending update
     */
    socket.on('spending:update', async data => {
      try {
        const { memberId, amount, type } = data;

        // Update member analytics
        const analytics = await MemberAnalytics.findOne({ member: memberId });

        if (analytics) {
          // Update spending windows
          analytics.spending.last24Hours += amount;
          analytics.spending.last7Days += amount;
          analytics.spending.last30Days += amount;
          analytics.spending.lifetime += amount;

          // Check for tier change
          const oldTier = analytics.spending.tier;
          const newTier = determineSpendingTier(analytics.spending);

          if (oldTier !== newTier) {
            analytics.spending.tier = newTier;

            // Broadcast tier change
            memberNamespace.emit('member:tier-changed', {
              memberId,
              oldTier,
              newTier,
              timestamp: new Date(),
            });

            // Special alert for new whales/VIPs
            if (newTier === 'whale' || newTier === 'vip') {
              memberNamespace.to('creators:all').emit('new-high-value-member', {
                memberId,
                tier: newTier,
                spending: analytics.spending.last30Days,
              });
            }
          }

          await analytics.save();

          // Broadcast spending update to relevant parties
          memberNamespace.to(`member:${memberId}`).emit('spending:updated', {
            spending: {
              last24Hours: analytics.spending.last24Hours,
              last30Days: analytics.spending.last30Days,
              tier: analytics.spending.tier,
            },
          });

          // Notify creators who have interacted with this member
          await notifyRelevantCreators(memberId, 'spending:update', {
            amount,
            type,
            newTotal: analytics.spending.last30Days,
            tier: analytics.spending.tier,
          });
        }
      } catch (error) {
        console.error('Spending update error:', error);
        socket.emit('error', { message: 'Failed to update spending' });
      }
    });

    /**
     * Real-time transaction notification
     */
    socket.on('transaction:completed', async data => {
      try {
        const { transactionId, memberId, creatorId, amount } = data;

        // Notify creator immediately
        memberNamespace.to(`creator:${creatorId}`).emit('payment:received', {
          transactionId,
          memberId,
          amount,
          timestamp: new Date(),
        });

        // Update member's real-time spending
        socket.emit('spending:update', {
          memberId,
          amount,
          type: 'purchase',
        });

        // Track conversion for analytics
        await trackEvent({
          category: 'conversion',
          action: 'real_time_purchase',
          value: amount,
          userId: creatorId,
          userType: 'creator',
          metadata: { memberId, transactionId },
        });
      } catch (error) {
        console.error('Transaction notification error:', error);
      }
    });

    // ============================================
    // INSTANT INTERACTION NOTIFICATIONS
    // ============================================

    /**
     * Handle poke interaction
     */
    socket.on('interaction:poke', async data => {
      try {
        const { creatorId, memberId } = data;

        // Create interaction record
        const interaction = new MemberInteraction({
          creator: creatorId,
          member: memberId,
          interactionType: 'poke',
          context: { source: 'real_time' },
        });

        await interaction.save();

        // Instant notification to member
        memberNamespace.to(`member:${memberId}`).emit('notification:poke', {
          creatorId,
          interactionId: interaction._id,
          timestamp: new Date(),
        });

        // Update creator's daily activity
        memberNamespace.to(`creator:${creatorId}`).emit('activity:tracked', {
          type: 'poke',
          memberId,
          success: true,
        });
      } catch (error) {
        console.error('Poke interaction error:', error);
        socket.emit('error', { message: 'Failed to send poke' });
      }
    });

    /**
     * Handle like interaction
     */
    socket.on('interaction:like', async data => {
      try {
        const { creatorId, memberId } = data;

        // Create interaction
        const interaction = new MemberInteraction({
          creator: creatorId,
          member: memberId,
          interactionType: 'like',
          context: { source: 'real_time' },
        });

        await interaction.save();

        // Instant notification
        memberNamespace.to(`member:${memberId}`).emit('notification:like', {
          creatorId,
          interactionId: interaction._id,
          timestamp: new Date(),
        });
      } catch (error) {
        console.error('Like interaction error:', error);
        socket.emit('error', { message: 'Failed to send like' });
      }
    });

    /**
     * Handle real-time message
     */
    socket.on('interaction:message', async data => {
      try {
        const { creatorId, memberId, message } = data;

        // Create interaction with message
        const interaction = new MemberInteraction({
          creator: creatorId,
          member: memberId,
          interactionType: 'message',
          message: {
            content: message,
            isPersonalized: true,
          },
          context: { source: 'real_time_chat' },
        });

        await interaction.save();

        // Instant delivery to member
        memberNamespace.to(`member:${memberId}`).emit('message:received', {
          creatorId,
          message,
          interactionId: interaction._id,
          timestamp: new Date(),
        });

        // Confirm delivery to creator
        socket.emit('message:delivered', {
          memberId,
          interactionId: interaction._id,
        });
      } catch (error) {
        console.error('Message interaction error:', error);
        socket.emit('error', { message: 'Failed to send message' });
      }
    });

    /**
     * Handle member response
     */
    socket.on('member:responded', async data => {
      try {
        const { interactionId, memberId, responseType } = data;

        // Update interaction with response
        const interaction = await MemberInteraction.findByIdAndUpdate(
          interactionId,
          {
            $set: {
              'response.hasResponded': true,
              'response.responseTime': new Date(),
              'response.responseType': responseType,
            },
          },
          { new: true }
        );

        if (interaction) {
          // Notify creator immediately
          memberNamespace
            .to(`creator:${interaction.creator}`)
            .emit('member:response', {
              memberId,
              interactionId,
              responseType,
              responseTime: new Date(),
            });

          // Update response analytics
          await updateResponseAnalytics(interaction.creator, memberId);
        }
      } catch (error) {
        console.error('Member response error:', error);
      }
    });

    // ============================================
    // ACTIVITY TRACKING
    // ============================================

    /**
     * Track member viewing creator profile
     */
    socket.on('activity:profile-view', async data => {
      try {
        const { memberId, creatorId } = data;

        // Track the view
        const interaction = new MemberInteraction({
          creator: creatorId,
          member: memberId,
          interactionType: 'profile_view',
          context: {
            source: 'member_browsing',
            viewedFrom: data.source || 'discovery',
          },
        });

        await interaction.save();

        // Notify creator if member is high-value
        const analytics = await MemberAnalytics.findOne({
          member: memberId,
        }).select('spending.tier');

        if (
          analytics &&
          (analytics.spending.tier === 'whale' ||
            analytics.spending.tier === 'vip')
        ) {
          memberNamespace.to(`creator:${creatorId}`).emit('high-value-view', {
            memberId,
            tier: analytics.spending.tier,
            timestamp: new Date(),
          });
        }
      } catch (error) {
        console.error('Profile view tracking error:', error);
      }
    });

    /**
     * Track content interaction
     */
    socket.on('activity:content-interaction', async data => {
      try {
        const { memberId, contentId, action } = data;

        // Track the interaction
        await trackEvent({
          category: 'content_interaction',
          action,
          label: contentId,
          userId: memberId,
          userType: 'member',
        });

        // Update member's content preferences
        await updateContentPreferences(memberId, contentId, action);

        // Notify content owner
        const Content = require('../models/Content');
        const content = await Content.findById(contentId).select('creator');

        if (content) {
          memberNamespace
            .to(`creator:${content.creator}`)
            .emit('content:interaction', {
              memberId,
              contentId,
              action,
              timestamp: new Date(),
            });
        }
      } catch (error) {
        console.error('Content interaction error:', error);
      }
    });

    // ============================================
    // DISCONNECT HANDLING
    // ============================================

    socket.on('disconnect', async () => {
      console.log(`👤 Member activity socket disconnected: ${socket.id}`);

      // Update offline status if member
      if (socket.userRole === 'member' && socket.userId) {
        await updateMemberOnlineStatus(socket.userId, false);
      }

      // Clean up rooms
      socket.rooms.forEach(room => {
        socket.leave(room);
      });
    });
  });

  console.log('✅ Member activity WebSocket handlers initialized');
};

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Update member online status
 */
async function updateMemberOnlineStatus(memberId, isOnline) {
  try {
    await MemberAnalytics.findOneAndUpdate(
      { member: memberId },
      {
        $set: {
          'activity.isOnline': isOnline,
          'activity.lastActive': new Date(),
          'activity.onlineStatusUpdated': new Date(),
        },
      },
      { upsert: true }
    );

    // Track status change
    await trackEvent({
      category: 'member_status',
      action: isOnline ? 'came_online' : 'went_offline',
      userId: memberId,
      userType: 'member',
    });
  } catch (error) {
    console.error('Error updating online status:', error);
  }
}

/**
 * Subscribe creator to high-value member updates
 */
async function subscribeToHighValueMembers(socket, creatorId) {
  try {
    // Join rooms for whale and VIP updates
    socket.join('monitors:whales');
    socket.join('monitors:vips');

    // Get creator's preferences
    const Creator = require('../models/Creator');
    const creator = await Creator.findById(creatorId).select(
      'preferences.notifyHighValueMembers'
    );

    if (creator?.preferences?.notifyHighValueMembers) {
      socket.join('alerts:high-value');
    }
  } catch (error) {
    console.error('Error subscribing to high-value members:', error);
  }
}

/**
 * Determine spending tier
 */
function determineSpendingTier(spending) {
  if (spending.last30Days >= 1000) return 'whale';
  if (spending.last30Days >= 500) return 'vip';
  if (spending.last30Days >= 100) return 'regular';
  if (spending.last30Days > 0) return 'casual';
  return 'new';
}

/**
 * Notify relevant creators about member activity
 */
async function notifyRelevantCreators(memberId, eventType, data) {
  try {
    // Find creators who have interacted with this member
    const interactions = await MemberInteraction.find({
      member: memberId,
      createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
    }).distinct('creator');

    // Notify each creator
    interactions.forEach(creatorId => {
      io.of('/member-activity')
        .to(`creator:${creatorId}`)
        .emit(`member:${eventType}`, {
          memberId,
          ...data,
        });
    });
  } catch (error) {
    console.error('Error notifying creators:', error);
  }
}

/**
 * Update response analytics
 */
async function updateResponseAnalytics(creatorId, memberId) {
  try {
    const CreatorSalesActivity = require('../models/CreatorSalesActivity');

    await CreatorSalesActivity.findOneAndUpdate(
      { creator: creatorId },
      {
        $inc: {
          'daily.responses': 1,
          'metrics.last7Days.totalResponses': 1,
          'metrics.last30Days.totalResponses': 1,
        },
      }
    );
  } catch (error) {
    console.error('Error updating response analytics:', error);
  }
}

/**
 * Update content preferences
 */
async function updateContentPreferences(memberId, contentId, action) {
  try {
    // This would update member's content preference analytics
    // Implementation depends on your content model structure
  } catch (error) {
    console.error('Error updating content preferences:', error);
  }
}

module.exports = exports;
