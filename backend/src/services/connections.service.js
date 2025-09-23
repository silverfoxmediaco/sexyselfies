// backend/src/services/connections.service.js
// Central Connection Service - Traffic Cop for All Connection Logic

const CreatorConnection = require('../models/CreatorConnection');
const Member = require('../models/Member');
const Creator = require('../models/Creator');
const User = require('../models/User');
const { sendNotification } = require('../utils/notifications');

class ConnectionService {

  // ============================================
  // CORE CONNECTION PROCESSING
  // ============================================

  /**
   * Process a swipe action and handle connection logic
   * @param {String} memberId - Member's ObjectId
   * @param {String} creatorId - Creator's ObjectId
   * @param {String} direction - 'left', 'right', 'super'
   * @param {Object} swipeData - Additional swipe metadata
   * @returns {Object} Connection result
   */
  async processSwipe(memberId, creatorId, direction, swipeData = {}) {
    try {
      console.log(`🎯 Processing swipe: Member ${memberId} → Creator ${creatorId} (${direction})`);

      // 1. Validate inputs
      if (!['left', 'right', 'super'].includes(direction)) {
        throw new Error('Invalid swipe direction');
      }

      // 2. Get or create connection record
      let connection = await this.getOrCreateConnection(memberId, creatorId);

      // 3. Check if already swiped
      if (connection.swipeData.memberSwiped.direction) {
        return {
          success: false,
          message: 'Already swiped on this creator',
          connection: null,
          isNewConnection: false
        };
      }

      // 4. Record member's swipe
      connection.swipeData.memberSwiped = {
        direction: direction === 'super' ? 'right' : direction,
        swipedAt: new Date(),
        superLike: direction === 'super',
        sessionTime: swipeData.sessionTime || 0,
        viewedPhotos: swipeData.viewedPhotos || 1,
        readBio: swipeData.readBio || false
      };

      // 5. Update browse context
      connection.browseContext = {
        filters: swipeData.filters || {},
        algorithm: {
          score: swipeData.algorithmScore || 0,
          reason: swipeData.browseReason || 'standard',
          position: swipeData.stackPosition || 0
        },
        searchSession: {
          sessionId: swipeData.sessionId,
          totalSwipes: swipeData.totalSwipes || 1,
          rightSwipes: swipeData.rightSwipes || (direction === 'right' ? 1 : 0),
          leftSwipes: swipeData.leftSwipes || (direction === 'left' ? 1 : 0)
        }
      };

      let isNewConnection = false;
      let instantConnection = false;

      // 6. Handle right swipes (potential connections)
      if (direction === 'right' || direction === 'super') {
        connection.memberLiked = true;
        connection.status = 'pending';

        // 7. Check for auto-connect or mutual interest
        const connectionResult = await this.checkForMutualConnection(connection, direction === 'super');
        isNewConnection = connectionResult.isConnected;
        instantConnection = connectionResult.instantConnection;

        // 8. Send notifications
        if (!isNewConnection) {
          await this.notifyCreatorOfPendingConnection(creatorId, memberId, direction === 'super');
        }

      } else if (direction === 'left') {
        // Member passed - mark as rejected
        connection.status = 'rejected';
      }

      // 9. Save connection
      await connection.save();

      // 10. Update analytics
      await this.updateConnectionAnalytics(creatorId, memberId, direction, isNewConnection);

      console.log(`✅ Swipe processed: ${direction} → ${isNewConnection ? 'CONNECTED' : connection.status}`);

      return {
        success: true,
        connection: connection,
        isNewConnection,
        instantConnection,
        message: this.getSwipeResultMessage(direction, isNewConnection, instantConnection)
      };

    } catch (error) {
      console.error('❌ Swipe processing error:', error);
      throw error;
    }
  }

  /**
   * Creator responds to a pending connection request
   * @param {String} creatorId - Creator's ObjectId
   * @param {String} connectionId - Connection ObjectId
   * @param {String} action - 'accept' or 'decline'
   * @returns {Object} Response result
   */
  async handleConnectionResponse(creatorId, connectionId, action) {
    try {
      console.log(`🎯 Creator ${creatorId} ${action}ing connection ${connectionId}`);

      // 1. Get creator profile to find the actual creator document ID
      const creator = await Creator.findOne({ user: creatorId });
      if (!creator) {
        throw new Error('Creator profile not found');
      }

      console.log(`🔍 Looking for connection ${connectionId} with creator ${creator._id}`);

      // 2. Find the pending connection using creator document ID
      const connection = await CreatorConnection.findOne({
        _id: connectionId,
        creator: creator._id,
        status: 'pending'
      }).populate('member', 'username profileImage')
        .populate('creator', 'displayName username profileImage');

      if (!connection) {
        // Try without creator filter to see if connection exists at all
        const anyConnection = await CreatorConnection.findById(connectionId);
        console.log('🔍 Connection exists:', !!anyConnection);
        if (anyConnection) {
          console.log('🔍 Connection creator:', anyConnection.creator);
          console.log('🔍 Connection status:', anyConnection.status);
        }
        throw new Error('Pending connection not found');
      }

      console.log(`✅ Found connection: ${connection._id}`);

      // 3. Update flat fields (compatible with database structure)
      connection.creatorLiked = action === 'accept';
      connection.creatorAccepted = action === 'accept';

      // 4. Also update nested fields if they exist
      if (!connection.swipeData) {
        connection.swipeData = { creatorSwiped: {} };
      }
      if (!connection.swipeData.creatorSwiped) {
        connection.swipeData.creatorSwiped = {};
      }

      connection.swipeData.creatorSwiped.direction = action === 'accept' ? 'right' : 'left';
      connection.swipeData.creatorSwiped.swipedAt = new Date();
      connection.swipeData.creatorSwiped.autoConnected = false;

      let isNewConnection = false;

      if (action === 'accept') {
        // 3. Establish the connection
        isNewConnection = await this.establishConnection(connection);
      } else {
        // 4. Decline the connection
        connection.status = 'rejected';
        connection.disconnectedAt = new Date();
      }

      await connection.save();

      console.log(`✅ Connection response: ${action} → ${isNewConnection ? 'CONNECTED' : 'REJECTED'}`);

      return {
        success: true,
        connection: connection,
        isNewConnection,
        message: isNewConnection ? "It's a connection! 🎉" : 'Connection declined'
      };

    } catch (error) {
      console.error('❌ Connection response error:', error);
      throw error;
    }
  }

  // ============================================
  // CONNECTION RETRIEVAL (UNIFIED)
  // ============================================

  /**
   * Get connections for a user (works for both members and creators)
   * @param {String} userId - User's ObjectId
   * @param {String} userRole - 'member' or 'creator'
   * @param {Object} filters - Query filters
   * @returns {Object} Connections with metadata
   */
  async getConnectionsForUser(userId, userRole, filters = {}) {
    try {
      console.log(`🔍 Getting connections for ${userRole} ${userId}`);

      // 1. Get user profile and verify we get the correct document ID
      const userProfile = await this.getUserProfile(userId, userRole);
      if (!userProfile) {
        throw new Error(`${userRole} profile not found`);
      }

      console.log(`🔍 User profile found: ${userProfile._id} (${userRole})`);

      // 2. Build base query using the profile document ID (not user ID)
      const query = this.buildConnectionQuery(userProfile._id, userRole, filters);
      console.log('🔍 ConnectionService query built:', JSON.stringify(query, null, 2));

      // 3. Execute query with proper population
      const connections = await CreatorConnection.find(query)
        .populate('member', 'username profileImage lastActive')
        .populate('creator', 'displayName username profileImage isVerified lastActive')
        .sort(this.getConnectionSortOrder(filters.sort))
        .exec();

      // 4. Filter out null populated records
      const validConnections = connections.filter(conn => {
        if (userRole === 'member' && !conn.creator) return false;
        if (userRole === 'creator' && !conn.member) return false;
        return true;
      });

      // 5. Apply search filter if provided
      const searchFiltered = this.applySearchFilter(validConnections, filters.search, userRole);

      // 6. Format connections for frontend
      const formattedConnections = searchFiltered.map(conn =>
        this.formatConnectionForUser(conn, userRole)
      );

      // 7. Generate statistics
      const stats = this.generateConnectionStats(validConnections, userRole);

      console.log(`✅ Found ${formattedConnections.length} connections for ${userRole}`);

      return {
        success: true,
        connections: formattedConnections,
        stats: stats,
        total: formattedConnections.length
      };

    } catch (error) {
      console.error('❌ Get connections error:', error);
      throw error;
    }
  }

  /**
   * Get pending connection requests for creators
   * @param {String} creatorId - Creator's ObjectId
   * @param {Object} options - Pagination and filter options
   * @returns {Object} Pending connections
   */
  async getPendingConnectionsForCreator(creatorId, options = {}) {
    try {
      console.log(`🔍 Getting pending connections for creator ${creatorId}`);

      const { page = 1, limit = 20 } = options;
      const skip = (page - 1) * limit;

      // 1. Get creator profile
      const creator = await Creator.findOne({ user: creatorId });
      if (!creator) {
        throw new Error('Creator profile not found');
      }

      // 2. Find pending connections where member swiped right
      const pendingConnections = await CreatorConnection.find({
        creator: creator._id,
        status: 'pending',
        'swipeData.memberSwiped.direction': { $in: ['right'] },
        $or: [
          { 'swipeData.creatorSwiped.direction': { $exists: false } },
          { 'swipeData.creatorSwiped.direction': null }
        ]
      })
      .populate('member', 'username profileImage lastActive')
      .populate({
        path: 'member',
        populate: { path: 'user', select: 'email createdAt' }
      })
      .sort('-swipeData.memberSwiped.swipedAt')
      .skip(skip)
      .limit(parseInt(limit));

      // 3. Get total count
      const total = await CreatorConnection.countDocuments({
        creator: creator._id,
        status: 'pending',
        'swipeData.memberSwiped.direction': { $in: ['right'] },
        $or: [
          { 'swipeData.creatorSwiped.direction': { $exists: false } },
          { 'swipeData.creatorSwiped.direction': null }
        ]
      });

      // 4. Format pending connections
      const formattedPending = pendingConnections.map(conn => ({
        id: conn._id,
        member: {
          id: conn.member._id,
          username: conn.member.username,
          profileImage: this.getCleanProfileImage(conn.member.profileImage, 'member'),
          lastActive: conn.member.lastActive,
          joinDate: conn.member.user?.createdAt,
          isOnline: this.isUserOnline(conn.member.lastActive)
        },
        swipeData: {
          direction: conn.swipeData.memberSwiped.direction,
          swipedAt: conn.swipeData.memberSwiped.swipedAt,
          superLike: conn.swipeData.memberSwiped.superLike,
          viewedPhotos: conn.swipeData.memberSwiped.viewedPhotos,
          readBio: conn.swipeData.memberSwiped.readBio,
          sessionTime: conn.swipeData.memberSwiped.sessionTime
        },
        compatibility: conn.relationship?.compatibility?.score || 0,
        createdAt: conn.createdAt
      }));

      console.log(`✅ Found ${formattedPending.length} pending connections`);

      return {
        success: true,
        pendingConnections: formattedPending,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        },
        stats: {
          totalPending: total,
          superLikes: formattedPending.filter(p => p.swipeData.superLike).length,
          todayRequests: formattedPending.filter(p =>
            new Date(p.swipeData.swipedAt).toDateString() === new Date().toDateString()
          ).length
        }
      };

    } catch (error) {
      console.error('❌ Get pending connections error:', error);
      throw error;
    }
  }

  // ============================================
  // CONNECTION STATE MANAGEMENT
  // ============================================

  /**
   * Establish a connection between member and creator
   * @param {Object} connection - Connection document
   * @returns {Boolean} Success status
   */
  async establishConnection(connection) {
    try {
      console.log(`🤝 Establishing connection ${connection._id}`);

      // 1. Update connection status (flat schema)
      connection.status = 'connected';
      connection.connectedAt = new Date();
      connection.isConnected = true;
      connection.lastInteraction = new Date();

      // 2. Initialize engagement tracking (handle both nested and flat)
      if (connection.engagement) {
        connection.engagement.lastActiveAt = new Date();
      }
      if (connection.relationship?.health) {
        connection.relationship.health.status = 'active';
        connection.relationship.health.lastInteraction = new Date();
      }

      // 3. Send notifications to both parties
      await this.notifyBothPartiesOfConnection(connection);

      // 4. Update creator stats
      await this.updateCreatorConnectionStats(connection.creator);

      console.log(`✅ Connection established: ${connection._id}`);
      return true;

    } catch (error) {
      console.error('❌ Establish connection error:', error);
      return false;
    }
  }

  // ============================================
  // HELPER METHODS
  // ============================================

  /**
   * Get or create a connection record
   */
  async getOrCreateConnection(memberId, creatorId) {
    let connection = await CreatorConnection.findOne({
      member: memberId,
      creator: creatorId
    });

    if (!connection) {
      connection = new CreatorConnection({
        member: memberId,
        creator: creatorId,
        status: 'pending'
      });
    }

    return connection;
  }

  /**
   * Check if connection should be auto-established
   */
  async checkForMutualConnection(connection, isSuperLike) {
    // Check if creator has auto-connect enabled
    const creator = await Creator.findById(connection.creator);

    // For now, we'll require creator response for all connections
    // Auto-connect logic can be added here if needed

    return {
      isConnected: false,
      instantConnection: false
    };
  }

  /**
   * Build connection query based on user role and filters
   */
  buildConnectionQuery(profileId, userRole, filters) {
    const query = {};

    // Base query by user role
    if (userRole === 'creator') {
      query.creator = profileId;
      // Creators see both pending (incoming requests) and connected
      query.status = { $in: ['pending', 'connected'] };
    } else {
      query.member = profileId;
      // Members only see connected relationships
      query.status = 'connected';
    }

    // Apply status filter
    if (filters.status) {
      if (filters.status === 'active') {
        // Active means connected status (don't require isConnected flag)
        query.status = 'connected';
      } else if (filters.status === 'pending') {
        query.status = 'pending';
        query.memberLiked = true; // Only show pending where member actually liked
      } else {
        query.status = filters.status;
      }
    }

    // Apply type filter
    if (filters.type) {
      query.connectionType = filters.type;
    }

    return query;
  }

  /**
   * Get user profile based on role
   */
  async getUserProfile(userId, userRole) {
    if (userRole === 'creator') {
      return await Creator.findOne({ user: userId });
    } else {
      return await Member.findOne({ user: userId });
    }
  }

  /**
   * Format connection for frontend consumption
   */
  formatConnectionForUser(connection, userRole) {
    const otherUser = userRole === 'creator' ? connection.member : connection.creator;

    return {
      id: connection._id,
      status: connection.status,
      connectedAt: connection.connectedAt,
      otherUser: {
        id: otherUser._id,
        username: otherUser.username || otherUser.displayName,
        displayName: otherUser.displayName || otherUser.username,
        profileImage: this.getCleanProfileImage(otherUser.profileImage, userRole === 'creator' ? 'member' : 'creator'),
        isVerified: otherUser.isVerified || false,
        isOnline: this.isUserOnline(otherUser.lastActive),
        lastActive: otherUser.lastActive
      },
      engagement: {
        totalMessages: connection.messageCount || 0,
        lastMessageAt: connection.lastMessagePreview?.createdAt,
        contentUnlocked: connection.contentUnlocked || 0,
        totalSpent: connection.totalSpent || 0
      },
      relationship: {
        health: 'active', // Default for flat schema
        churnRisk: 0,
        spendingLevel: connection.totalSpent > 50 ? 'regular' : connection.totalSpent > 0 ? 'casual' : 'free'
      },
      lastInteraction: connection.lastInteraction || connection.createdAt,
      isPinned: connection.isPinned || false,
      isMuted: connection.isMuted || false
    };
  }

  /**
   * Generate connection statistics
   */
  generateConnectionStats(connections, userRole) {
    const stats = {
      total: connections.length,
      connected: 0,
      pending: 0,
      active: 0,
      dormant: 0
    };

    connections.forEach(conn => {
      if (conn.status === 'connected' || conn.isConnected) stats.connected++;
      if (conn.status === 'pending') stats.pending++;

      // For flat schema, consider active if connected and recent activity
      if (conn.isConnected && conn.lastInteraction) {
        const daysSinceInteraction = (Date.now() - new Date(conn.lastInteraction)) / (1000 * 60 * 60 * 24);
        if (daysSinceInteraction < 7) {
          stats.active++;
        } else {
          stats.dormant++;
        }
      }
    });

    return stats;
  }

  /**
   * Apply search filter to connections
   */
  applySearchFilter(connections, search, userRole) {
    if (!search) return connections;

    return connections.filter(conn => {
      const otherUser = userRole === 'creator' ? conn.member : conn.creator;
      const searchLower = search.toLowerCase();

      return (
        otherUser?.username?.toLowerCase().includes(searchLower) ||
        otherUser?.displayName?.toLowerCase().includes(searchLower)
      );
    });
  }

  /**
   * Get connection sort order
   */
  getConnectionSortOrder(sort) {
    switch (sort) {
      case 'newest': return { createdAt: -1 };
      case 'oldest': return { createdAt: 1 };
      case 'active': return { lastInteraction: -1 };
      case 'spending': return { totalSpent: -1 };
      default: return { lastInteraction: -1, isPinned: -1 };
    }
  }

  /**
   * Clean profile image URLs
   */
  getCleanProfileImage(profileImage, userType) {
    if (!profileImage || profileImage === 'default-avatar.jpg' || !profileImage.startsWith('http')) {
      return userType === 'creator'
        ? '/placeholders/beaufitulbrunette1.png'
        : '/placeholders/member-default.png';
    }
    return profileImage;
  }

  /**
   * Check if user is currently online
   */
  isUserOnline(lastActive) {
    if (!lastActive) return false;
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    return new Date(lastActive) > fiveMinutesAgo;
  }

  /**
   * Get appropriate swipe result message
   */
  getSwipeResultMessage(direction, isConnected, instantConnection) {
    if (isConnected) {
      return instantConnection ? "Instant connection! 🎉" : "It's a connection! 💕";
    }

    switch (direction) {
      case 'right': return 'Like sent! 💕';
      case 'super': return 'Super like sent! ⭐';
      case 'left': return 'Passed';
      default: return 'Action completed';
    }
  }

  /**
   * Send notification to creator about pending connection
   */
  async notifyCreatorOfPendingConnection(creatorId, memberId, isSuperLike) {
    try {
      const member = await Member.findById(memberId).populate('user', 'email');
      const creator = await Creator.findById(creatorId).populate('user', '_id');

      await sendNotification(creator.user._id, {
        type: 'connection_request',
        title: isSuperLike ? 'Super Like Received! ⭐' : 'New Connection Request! 💕',
        body: `${member.username || 'Someone'} wants to connect with you!`,
        data: {
          memberId: memberId,
          memberUsername: member.username,
          isSuperLike: isSuperLike,
          type: 'connection_request'
        },
        category: 'connection',
        actionUrl: `/creator/connections?filter=pending`
      });

      console.log(`📱 Notification sent to creator ${creatorId} about pending connection`);
    } catch (error) {
      console.error('❌ Error sending pending connection notification:', error);
    }
  }

  /**
   * Notify both parties when connection is established
   */
  async notifyBothPartiesOfConnection(connection) {
    try {
      const [member, creator] = await Promise.all([
        Member.findById(connection.member).populate('user', '_id email'),
        Creator.findById(connection.creator).populate('user', '_id email')
      ]);

      // Notify member
      await sendNotification(member.user._id, {
        type: 'new_connection',
        title: "It's a Connection! 💕",
        body: `You connected with ${creator.displayName || creator.username}!`,
        data: {
          connectionId: connection._id,
          creatorId: connection.creator,
          creatorUsername: creator.username,
          type: 'new_connection'
        },
        category: 'connection',
        actionUrl: `/member/connections`
      });

      // Notify creator
      await sendNotification(creator.user._id, {
        type: 'new_connection',
        title: 'New Connection! 💕',
        body: `You connected with ${member.username}!`,
        data: {
          connectionId: connection._id,
          memberId: connection.member,
          memberUsername: member.username,
          type: 'new_connection'
        },
        category: 'connection',
        actionUrl: `/creator/connections`
      });

      console.log(`📱 Connection notifications sent for ${connection._id}`);
    } catch (error) {
      console.error('❌ Error sending connection notifications:', error);
    }
  }

  /**
   * Update creator connection statistics
   */
  async updateCreatorConnectionStats(creatorId) {
    try {
      const creator = await Creator.findById(creatorId);
      if (creator) {
        const connectionCount = await CreatorConnection.countDocuments({
          creator: creatorId,
          status: 'connected'
        });

        creator.stats.totalConnections = connectionCount;
        await creator.save();
      }
    } catch (error) {
      console.error('❌ Error updating creator stats:', error);
    }
  }

  /**
   * Update connection analytics
   */
  async updateConnectionAnalytics(creatorId, memberId, direction, isConnected) {
    try {
      // Update analytics here if needed
      console.log(`📊 Analytics updated: ${direction} swipe → ${isConnected ? 'connected' : 'pending'}`);
    } catch (error) {
      console.error('❌ Error updating analytics:', error);
    }
  }

  /**
   * Find ideal members for a creator (placeholder implementation)
   * @param {String} creatorId - Creator's ObjectId
   * @param {Object} options - Search options
   * @returns {Object} Match results
   */
  async findIdealMembers(creatorId, options = {}) {
    try {
      console.log(`🔍 Finding ideal members for creator ${creatorId}`);

      // Placeholder implementation - return empty matches for now
      return {
        success: true,
        matches: [],
        summary: {
          avgCompatibility: 0,
          totalChecked: 0
        }
      };
    } catch (error) {
      console.error('❌ Error finding ideal members:', error);
      return {
        success: false,
        matches: [],
        summary: {
          avgCompatibility: 0,
          totalChecked: 0
        }
      };
    }
  }
}

module.exports = new ConnectionService();