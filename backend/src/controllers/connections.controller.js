// backend/src/controllers/connections.controller.js
const CreatorConnection = require('../models/CreatorConnection');
const Member = require('../models/Member');
const Creator = require('../models/Creator');
const Message = require('../models/Message');
const { sendNotification } = require('../utils/notifications');
const connectionService = require('../services/connections.service');

// ============================================
// SWIPE/BROWSE FUNCTIONS
// ============================================

// @desc    Get swipe stack (creators to swipe on)
// @route   GET /api/connections/stack
// @access  Private
exports.getSwipeStack = async (req, res, next) => {
  try {
    console.log('🎯 GetSwipeStack called by user:', req.user.id);
    console.log('🎯 Request query params:', req.query);

    // Get member document
    const member = await Member.findOne({ user: req.user.id });

    if (!member) {
      return res.status(404).json({
        success: false,
        error: 'Member profile not found',
      });
    }

    // Get IDs of creators already interacted with
    const existingCreatorConnections = await CreatorConnection.find({
      member: member._id,
    }).select('creator');

    const excludedIds = existingCreatorConnections.map(c => c.creator);
    console.log('Excluding creators:', excludedIds.length);

    // Build query for available creators
    const query = {
      _id: { $nin: excludedIds },
      // Check for both undefined and false for isPaused
      $or: [{ isPaused: false }, { isPaused: { $exists: false } }],
      // Check for verified status
      isVerified: true,
    };

    console.log('Query:', JSON.stringify(query, null, 2));

    // First check how many creators exist
    const totalCreators = await Creator.countDocuments({});
    console.log('Total creators in database:', totalCreators);

    // Check how many are verified
    const verifiedCreators = await Creator.countDocuments({ isVerified: true });
    console.log('Verified creators:', verifiedCreators);

    // Get creators matching preferences
    const creators = await Creator.find(query)
      .populate('user', 'email lastLogin')
      .limit(10)
      .sort({ lastActive: -1, createdAt: -1 })
      .lean();

    console.log('Found creators:', creators.length);

    // Get Content model for populating creator content
    const Content = require('../models/Content');

    // Get content for each creator (mix of free and paid for browse display)
    const creatorsWithContent = await Promise.all(
      creators.map(async creator => {
        // Get recent content for this creator (limit to 5 for swipe display)
        const creatorContent = await Content.find({
          creator: creator._id,
          status: 'approved', // Only show approved content
        })
          .select('thumbnail media price isFree type title')
          .sort({ createdAt: -1 })
          .limit(5)
          .lean();

        // Transform content for frontend - free content shows actual images, paid shows thumbnails for blur effect
        const photos = creatorContent.map(content => ({
          url: content.isFree
            ? content.media[0]?.url || content.thumbnail
            : content.thumbnail,
          price: content.price,
          isFree: content.isFree,
          isPaid: !content.isFree,
          type: content.type,
          title: content.title || '',
        }));

        return { ...creator, photos };
      })
    );

    // Transform creators to match frontend expectations
    const transformedCreators = creatorsWithContent.map(creator => {
      // Location removed - only country data collected, no point in city/distance display

      // Fix profile image URL
      let profileImageUrl = creator.profileImage;
      if (
        profileImageUrl === 'default-avatar.jpg' ||
        !profileImageUrl ||
        !profileImageUrl.startsWith('http')
      ) {
        profileImageUrl = '/placeholders/beaufitulbrunette1.png';
      }

      // Generate username if missing - use displayName or fallback to creator ID
      let username = creator.username;
      if (!username) {
        if (creator.displayName) {
          // Convert display name to username format (lowercase, no spaces)
          username = creator.displayName
            .toLowerCase()
            .replace(/\s+/g, '')
            .replace(/[^a-z0-9]/g, '');
        } else {
          // Fallback to creator ID last 8 characters
          username = `creator${creator._id.toString().slice(-8)}`;
        }

        // Update the creator with the generated username (fire-and-forget)
        Creator.findByIdAndUpdate(
          creator._id,
          { username },
          { new: true }
        ).catch(err => {
          console.warn('Failed to update creator username:', err);
        });
      }

      return {
        _id: creator._id,
        id: creator._id.toString(),
        username: username,
        displayName: creator.displayName || 'Unknown',
        profileImage: profileImageUrl,
        bio: creator.bio || '',
        isVerified: creator.isVerified || false,
        isOnline: isUserOnline(creator.lastActive),
        lastActive: creator.lastActive || creator.createdAt,
        contentPrice: creator.contentPrice || 2.99,
        stats: creator.stats || {},
        createdAt: creator.createdAt,
        // Additional fields for UI
        age: calculateAge(creator.birthDate) || 25,
        gender: creator.gender || 'female',
        verified: creator.isVerified || false,
        // Include creator content for swipe display
        photos: creator.photos || [],
      };
    });

    // If no creators found, return demo data for testing
    if (
      transformedCreators.length === 0 &&
      process.env.NODE_ENV === 'development'
    ) {
      console.log('No creators found, returning demo data');
      const demoCreators = [
        {
          _id: '507f1f77bcf86cd799439011',
          id: '507f1f77bcf86cd799439011',
          username: 'democreator1',
          displayName: 'Demo Creator 1',
          profileImage: '/placeholders/beaufitulbrunette1.png',
          bio: 'This is a demo creator for testing',
          isVerified: true,
          isOnline: true,
          lastActive: new Date(),
          contentPrice: 2.99,
          age: 24,
          gender: 'female',
          verified: true,
          createdAt: new Date(),
        },
        {
          _id: '507f1f77bcf86cd799439012',
          id: '507f1f77bcf86cd799439012',
          username: 'democreator2',
          displayName: 'Demo Creator 2',
          profileImage: '/placeholders/beautifulbrunette2.png',
          bio: 'Another demo creator',
          isVerified: true,
          isOnline: false,
          lastActive: new Date(Date.now() - 3600000),
          contentPrice: 3.99,
          age: 26,
          gender: 'female',
          verified: true,
          createdAt: new Date(),
        },
      ];

      return res.status(200).json({
        success: true,
        count: demoCreators.length,
        data: demoCreators,
        isDemoData: true,
      });
    }

    res.status(200).json({
      success: true,
      count: transformedCreators.length,
      data: transformedCreators,
    });
  } catch (error) {
    console.error('GetSwipeStack error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    });
  }
};

// @desc    Process swipe action
// @route   POST /api/connections/swipe
// @access  Private
exports.swipeAction = async (req, res, next) => {
  try {
    console.log('🎯 SwipeAction called:', req.body);

    const { creatorId, action } = req.body; // action: 'like', 'pass' (superlike removed)
    const userId = req.user.id;
    const userRole = req.user.role;

    // Only members can swipe
    if (userRole !== 'member') {
      return res.status(403).json({
        success: false,
        error: 'Only members can swipe on creators',
      });
    }

    // Get member profile
    const member = await Member.findOne({ user: userId });
    if (!member) {
      return res.status(404).json({
        success: false,
        error: 'Member profile not found',
      });
    }

    // Validate action
    const direction = action === 'like' ? 'right' : action === 'pass' ? 'left' : action;

    // Use ConnectionService to process the swipe
    const result = await connectionService.processSwipe(
      member._id,
      creatorId,
      direction,
      {
        sessionTime: req.body.sessionTime || 0,
        viewedPhotos: req.body.viewedPhotos || 1,
        readBio: req.body.readBio || false,
        filters: req.body.filters || {},
        sessionId: req.body.sessionId
      }
    );

    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: result.message,
      });
    }

    // Update member's like/pass arrays for compatibility
    if (direction === 'right') {
      member.likes.push({ creator: creatorId });
    } else if (direction === 'left') {
      member.passes.push({ creator: creatorId });
    }
    await member.save();

    console.log(`✅ Swipe processed: ${action} → ${result.isNewConnection ? 'CONNECTED' : 'PENDING'}`);

    res.status(200).json({
      success: true,
      isConnected: result.isNewConnection,
      isNewCreatorConnection: result.isNewConnection,
      data: result.connection,
      message: result.message
    });

  } catch (error) {
    console.error('❌ SwipeAction error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

// ============================================
// MY CONNECTIONS PAGE FUNCTIONS
// ============================================

// @desc    Get all connections for MyCreatorConnections page
// @route   GET /api/connections
// @access  Private
exports.getCreatorConnections = async (req, res, next) => {
  try {
    console.log(
      '🔗 GetCreatorConnections called by user:',
      req.user.id,
      'role:',
      req.user.role
    );
    console.log('🔗 Request query params:', req.query);

    const userRole = req.user.role;
    const filters = {
      status: req.query.status,
      type: req.query.type,
      sort: req.query.sort || '-lastInteraction',
      search: req.query.search
    };

    // Use ConnectionService to get connections
    const result = await connectionService.getConnectionsForUser(
      req.user.id,
      userRole,
      filters
    );

    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: 'Failed to retrieve connections',
      });
    }

    // Format connections for legacy compatibility
    const formattedConnections = result.connections.map(conn => ({
      id: conn.id,
      connectionData: userRole === 'member' ? {
        creatorName: conn.otherUser.displayName,
        creatorUsername: `@${conn.otherUser.username}`,
        avatar: conn.otherUser.profileImage,
        isOnline: conn.otherUser.isOnline,
      } : {
        memberName: conn.otherUser.username,
        memberUsername: `@${conn.otherUser.username}`,
        avatar: conn.otherUser.profileImage,
      },
      connectionType: conn.connectionType || 'standard',
      status: conn.status,
      lastMessage: 'No messages yet', // Can be enhanced later
      lastMessageTime: formatTime(conn.lastInteraction),
      unreadCount: 0, // Can be enhanced later
      isPinned: conn.isPinned,
      subscriptionAmount: 0,
      totalSpent: conn.engagement.totalSpent,
      connectedSince: conn.connectedAt,
      messageCount: conn.engagement.totalMessages,
      contentUnlocked: conn.engagement.contentUnlocked,
      specialOffers: [],
    }));

    console.log(`✅ Retrieved ${formattedConnections.length} connections for ${userRole}`);

    res.status(200).json({
      success: true,
      count: formattedConnections.length,
      data: formattedConnections,
      stats: result.stats
    });

  } catch (error) {
    console.error('❌ GetCreatorConnections error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

// @desc    Get connection statistics
// @route   GET /api/connections/stats
// @access  Private
exports.getCreatorConnectionStats = async (req, res, next) => {
  try {
    const userRole = req.user.role;
    let query = {};

    if (userRole === 'member') {
      const member = await Member.findOne({ user: req.user.id });
      query.member = member._id;
    } else {
      const creator = await Creator.findOne({ user: req.user.id });
      query.creator = creator._id;
    }

    const stats = await CreatorConnection.aggregate([
      { $match: query },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
        },
      },
    ]);

    const formattedStats = {
      total: 0,
      active: 0,
      pending: 0,
      expired: 0,
      rejected: 0,
    };

    stats.forEach(stat => {
      formattedStats[stat._id] = stat.count;
      formattedStats.total += stat.count;
    });

    res.status(200).json({
      success: true,
      data: formattedStats,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

// @desc    Accept connection request
// @route   POST /api/connections/:connectionId/accept
// @access  Private
exports.acceptCreatorConnection = async (req, res, next) => {
  try {
    console.log(`🎯 Accept connection: ${req.params.connectionId} by ${req.user.role} ${req.user.id}`);

    // Only creators can accept connection requests (members send requests)
    if (req.user.role !== 'creator') {
      return res.status(403).json({
        success: false,
        error: 'Only creators can accept connection requests',
      });
    }

    // Use ConnectionService to handle the response
    const result = await connectionService.handleConnectionResponse(
      req.user.id,
      req.params.connectionId,
      'accept'
    );

    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: result.message || 'Failed to accept connection',
      });
    }

    console.log(`✅ Connection accepted: ${req.params.connectionId}`);

    res.status(200).json({
      success: true,
      data: result.connection,
      isNewConnection: result.isNewConnection,
      message: result.message
    });

  } catch (error) {
    console.error('❌ Accept connection error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

// @desc    Decline connection request
// @route   POST /api/connections/:connectionId/decline
// @access  Private
exports.declineCreatorConnection = async (req, res, next) => {
  try {
    console.log(`🎯 Decline connection: ${req.params.connectionId} by ${req.user.role} ${req.user.id}`);

    // Only creators can decline connection requests (members send requests)
    if (req.user.role !== 'creator') {
      return res.status(403).json({
        success: false,
        error: 'Only creators can decline connection requests',
      });
    }

    // Use ConnectionService to handle the response
    const result = await connectionService.handleConnectionResponse(
      req.user.id,
      req.params.connectionId,
      'decline'
    );

    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: result.message || 'Failed to decline connection',
      });
    }

    console.log(`✅ Connection declined: ${req.params.connectionId}`);

    res.status(200).json({
      success: true,
      data: result.connection,
      message: result.message
    });

  } catch (error) {
    console.error('❌ Decline connection error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

// @desc    Pin/Unpin connection
// @route   PUT /api/connections/:connectionId/pin
// @access  Private
exports.pinCreatorConnection = async (req, res, next) => {
  try {
    const connection = await CreatorConnection.findById(req.params.connectionId);

    if (!connection) {
      return res.status(404).json({
        success: false,
        error: 'CreatorConnection not found',
      });
    }

    connection.isPinned = !connection.isPinned;
    await connection.save();

    res.status(200).json({
      success: true,
      data: connection,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

// @desc    Archive connection
// @route   PUT /api/connections/:connectionId/archive
// @access  Private
exports.archiveCreatorConnection = async (req, res, next) => {
  try {
    const connection = await CreatorConnection.findByIdAndUpdate(
      req.params.connectionId,
      {
        isArchived: true,
        lastInteraction: Date.now(),
      },
      { new: true }
    );

    if (!connection) {
      return res.status(404).json({
        success: false,
        error: 'CreatorConnection not found',
      });
    }

    res.status(200).json({
      success: true,
      data: connection,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

// @desc    Block connection
// @route   POST /api/connections/:connectionId/block
// @access  Private
exports.blockCreatorConnection = async (req, res, next) => {
  try {
    const connection = await CreatorConnection.findByIdAndUpdate(
      req.params.connectionId,
      {
        status: 'blocked',
        isActive: false,
        disconnectedBy: req.user.id,
        disconnectedAt: Date.now(),
        disconnectReason: 'blocked',
      },
      { new: true }
    );

    if (!connection) {
      return res.status(404).json({
        success: false,
        error: 'CreatorConnection not found',
      });
    }

    res.status(200).json({
      success: true,
      data: connection,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

// @desc    Bulk action on connections
// @route   POST /api/connections/bulk
// @access  Private
exports.bulkCreatorConnectionAction = async (req, res, next) => {
  try {
    const { connectionIds, action } = req.body;

    let updateData = {};

    switch (action) {
      case 'archive':
        updateData = { isArchived: true };
        break;
      case 'unarchive':
        updateData = { isArchived: false };
        break;
      case 'mute':
        updateData = { isMuted: true };
        break;
      case 'unmute':
        updateData = { isMuted: false };
        break;
      default:
        return res.status(400).json({
          success: false,
          error: 'Invalid action',
        });
    }

    updateData.lastInteraction = Date.now();

    const result = await CreatorConnection.updateMany(
      { _id: { $in: connectionIds } },
      updateData
    );

    res.status(200).json({
      success: true,
      modified: result.modifiedCount,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

// ============================================
// EXISTING FUNCTIONS (LEGACY SUPPORT)
// ============================================

// @desc    Get all connections (legacy - redirects to getCreatorConnections)
// @route   GET /api/connections/matches
// @access  Private
exports.getMatches = async (req, res, next) => {
  req.query.status = 'active';
  return exports.getCreatorConnections(req, res, next);
};

// @desc    Get specific connection
// @route   GET /api/connections/:connectionId
// @access  Private
exports.getMatch = async (req, res, next) => {
  try {
    const connection = await CreatorConnection.findById(req.params.connectionId)
      .populate('member', 'username profileImage')
      .populate('creator', 'displayName profileImage bio');

    if (!connection) {
      return res.status(404).json({
        success: false,
        error: 'CreatorConnection not found',
      });
    }

    res.status(200).json({
      success: true,
      data: connection,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

// @desc    Disconnect (formerly unmatch)
// @route   DELETE /api/connections/:connectionId
// @access  Private
exports.unmatch = async (req, res, next) => {
  try {
    const connection = await CreatorConnection.findById(req.params.connectionId);

    if (!connection) {
      return res.status(404).json({
        success: false,
        error: 'CreatorConnection not found',
      });
    }

    connection.isActive = false;
    connection.status = 'expired';
    connection.disconnectedBy = req.user.id;
    connection.disconnectedAt = Date.now();
    await connection.save();

    res.status(200).json({
      success: true,
      message: 'Successfully disconnected',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

// ============================================
// MESSAGING FUNCTIONS
// ============================================

// @desc    Send message
// @route   POST /api/connections/:connectionId/messages
// @access  Private
exports.sendMessage = async (req, res, next) => {
  try {
    const { text, media } = req.body;
    const connection = await CreatorConnection.findById(req.params.connectionId);

    if (!connection || !connection.isConnected) {
      return res.status(404).json({
        success: false,
        error: 'CreatorConnection not found or not active',
      });
    }

    const userRole = req.user.role;
    const message = await Message.create({
      connection: connection._id,
      sender: req.user.id,
      senderModel: userRole === 'member' ? 'Member' : 'Creator',
      content: {
        text,
        media,
      },
    });

    // Update connection with last message
    await connection.updateLastMessage(text, userRole);

    res.status(201).json({
      success: true,
      data: message,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

// @desc    Get messages
// @route   GET /api/connections/:connectionId/messages
// @access  Private
exports.getMessages = async (req, res, next) => {
  try {
    const { page = 1, limit = 50 } = req.query;

    const messages = await Message.find({
      connection: req.params.connectionId,
      isDeleted: false,
    })
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .populate('sender', 'email');

    const count = await Message.countDocuments({
      connection: req.params.connectionId,
      isDeleted: false,
    });

    res.status(200).json({
      success: true,
      count: messages.length,
      total: count,
      pages: Math.ceil(count / limit),
      data: messages.reverse(),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

// @desc    Mark messages as read
// @route   PUT /api/connections/:connectionId/messages/read
// @access  Private
exports.markMessagesAsRead = async (req, res, next) => {
  try {
    const connection = await CreatorConnection.findById(req.params.connectionId);
    const userRole = req.user.role;

    // Reset unread count
    await connection.markAsRead(userRole);

    // Mark messages as read
    await Message.updateMany(
      {
        connection: req.params.connectionId,
        sender: { $ne: req.user.id },
        isRead: false,
      },
      {
        isRead: true,
        readAt: Date.now(),
      }
    );

    res.status(200).json({
      success: true,
      message: 'Messages marked as read',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

// @desc    Delete message
// @route   DELETE /api/connections/messages/:messageId
// @access  Private
exports.deleteMessage = async (req, res, next) => {
  try {
    const message = await Message.findById(req.params.messageId);

    if (!message) {
      return res.status(404).json({
        success: false,
        error: 'Message not found',
      });
    }

    // Check if user is the sender
    if (message.sender.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to delete this message',
      });
    }

    message.isDeleted = true;
    message.deletedAt = Date.now();
    message.deletedBy = req.user.id;
    await message.save();

    res.status(200).json({
      success: true,
      message: 'Message deleted',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

// ============================================
// HELPER FUNCTIONS
// ============================================

function formatTime(date) {
  if (!date) return 'Never';

  const now = new Date();
  const messageDate = new Date(date);
  const diffMs = now - messageDate;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins} min ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;

  return messageDate.toLocaleDateString();
}

// Helper function to determine if user is online
function isUserOnline(lastActive) {
  if (!lastActive) return false;
  const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
  return new Date(lastActive) > fiveMinutesAgo;
}

// Helper function to calculate age from birthDate
function calculateAge(birthDate) {
  if (!birthDate) return null;
  const today = new Date();
  const birth = new Date(birthDate);
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age;
}

module.exports = exports;
