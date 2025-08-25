// backend/src/controllers/connections.controller.js
const Connection = require('../models/Connections');
const Member = require('../models/Member');
const Creator = require('../models/Creator');
const Message = require('../models/Message');

// ============================================
// SWIPE/BROWSE FUNCTIONS
// ============================================

// @desc    Get swipe stack (creators to swipe on)
// @route   GET /api/connections/stack
// @access  Private
exports.getSwipeStack = async (req, res, next) => {
  try {
    console.log('GetSwipeStack called by user:', req.user.id);
    
    // Get member document
    const member = await Member.findOne({ user: req.user.id });
    
    if (!member) {
      return res.status(404).json({
        success: false,
        error: 'Member profile not found'
      });
    }

    // Get IDs of creators already interacted with
    const existingConnections = await Connection.find({ 
      member: member._id 
    }).select('creator');
    
    const excludedIds = existingConnections.map(c => c.creator);
    console.log('Excluding creators:', excludedIds.length);

    // Build query for available creators
    const query = {
      _id: { $nin: excludedIds },
      // Check for both undefined and false for isPaused
      $or: [
        { isPaused: false },
        { isPaused: { $exists: false } }
      ],
      // Check for verified status
      isVerified: true
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

    // Transform creators to match frontend expectations
    const transformedCreators = creators.map(creator => {
      // Handle location data
      let location = { city: 'Unknown', state: '', distance: 0 };
      if (creator.location) {
        location = {
          city: creator.location.city || 'Unknown',
          state: creator.location.state || '',
          distance: 0 // Calculate if needed
        };
      }

      return {
        _id: creator._id,
        id: creator._id.toString(),
        displayName: creator.displayName || 'Unknown',
        profileImage: creator.profileImage || '/placeholders/beaufitulbrunette1.png',
        bio: creator.bio || '',
        isVerified: creator.isVerified || false,
        isOnline: isUserOnline(creator.lastActive),
        lastActive: creator.lastActive || creator.createdAt,
        location: location,
        contentPrice: creator.contentPrice || 2.99,
        stats: creator.stats || {},
        createdAt: creator.createdAt,
        // Additional fields for UI
        age: calculateAge(creator.birthDate) || 25,
        gender: creator.gender || 'female',
        verified: creator.isVerified || false
      };
    });

    // If no creators found, return demo data for testing
    if (transformedCreators.length === 0 && process.env.NODE_ENV === 'development') {
      console.log('No creators found, returning demo data');
      const demoCreators = [
        {
          _id: '507f1f77bcf86cd799439011',
          id: '507f1f77bcf86cd799439011',
          displayName: 'Demo Creator 1',
          profileImage: '/placeholders/beaufitulbrunette1.png',
          bio: 'This is a demo creator for testing',
          isVerified: true,
          isOnline: true,
          lastActive: new Date(),
          location: { city: 'Los Angeles', state: 'CA', distance: 10 },
          contentPrice: 2.99,
          age: 24,
          gender: 'female',
          verified: true,
          createdAt: new Date()
        },
        {
          _id: '507f1f77bcf86cd799439012',
          id: '507f1f77bcf86cd799439012',
          displayName: 'Demo Creator 2',
          profileImage: '/placeholders/beautifulbrunette2.png',
          bio: 'Another demo creator',
          isVerified: true,
          isOnline: false,
          lastActive: new Date(Date.now() - 3600000),
          location: { city: 'New York', state: 'NY', distance: 25 },
          contentPrice: 3.99,
          age: 26,
          gender: 'female',
          verified: true,
          createdAt: new Date()
        }
      ];
      
      return res.status(200).json({
        success: true,
        count: demoCreators.length,
        data: demoCreators,
        isDemoData: true
      });
    }

    res.status(200).json({
      success: true,
      count: transformedCreators.length,
      data: transformedCreators
    });
  } catch (error) {
    console.error('GetSwipeStack error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

// @desc    Process swipe action
// @route   POST /api/connections/swipe
// @access  Private
exports.swipeAction = async (req, res, next) => {
  try {
    const { creatorId, action } = req.body; // action: 'like', 'pass', 'superlike'
    const userId = req.user.id;
    const userRole = req.user.role;

    let connection;
    let isNewConnection = false;

    if (userRole === 'member') {
      const member = await Member.findOne({ user: userId });
      const creator = await Creator.findById(creatorId);

      if (!creator) {
        return res.status(404).json({
          success: false,
          error: 'Creator not found'
        });
      }

      // Check if connection exists
      connection = await Connection.findOne({
        member: member._id,
        creator: creator._id
      });

      if (!connection) {
        connection = new Connection({
          member: member._id,
          creator: creator._id
        });
      }

      switch (action) {
        case 'like':
          member.likes.push({ creator: creator._id });
          connection.memberLiked = true;
          connection.status = 'pending';
          break;
        case 'superlike':
          member.superLikes.push({ creator: creator._id });
          connection.memberLiked = true;
          connection.memberSuperLiked = true;
          connection.connectionType = 'premium';
          connection.status = 'pending';
          break;
        case 'pass':
          member.passes.push({ creator: creator._id });
          connection.status = 'rejected';
          break;
      }

      await member.save();

      // Check if it's a mutual connection
      if (connection.memberLiked && connection.creatorLiked) {
        await connection.establishConnection();
        isNewConnection = true;

        // Update creator stats
        creator.stats.totalConnections = (creator.stats.totalConnections || 0) + 1;
        await creator.save();
      }

      await connection.save();
    }

    res.status(200).json({
      success: true,
      isConnected: connection.isConnected,
      isNewConnection,
      data: connection
    });
  } catch (error) {
    console.error('SwipeAction error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// ============================================
// MY CONNECTIONS PAGE FUNCTIONS
// ============================================

// @desc    Get all connections for MyConnections page
// @route   GET /api/connections
// @access  Private
exports.getConnections = async (req, res, next) => {
  try {
    const userRole = req.user.role;
    const { status, type, sort = '-lastInteraction', search } = req.query;
    
    let query = { isActive: true };

    // Build query based on user role
    if (userRole === 'member') {
      const member = await Member.findOne({ user: req.user.id });
      if (!member) {
        return res.status(404).json({
          success: false,
          error: 'Member profile not found'
        });
      }
      query.member = member._id;
    } else if (userRole === 'creator') {
      const creator = await Creator.findOne({ user: req.user.id });
      if (!creator) {
        return res.status(404).json({
          success: false,
          error: 'Creator profile not found'
        });
      }
      query.creator = creator._id;
    }

    // Apply filters
    if (status) {
      if (status === 'active') {
        query.isConnected = true;
        query.status = 'active';
      } else {
        query.status = status;
      }
    }
    if (type) query.connectionType = type;

    // Get connections
    let connections = await Connection.find(query)
      .populate('member', 'username profileImage')
      .populate({
        path: 'creator',
        select: 'displayName profileImage bio isOnline',
        populate: {
          path: 'profile',
          select: 'tagline subscriptionPrice'
        }
      })
      .populate('lastMessage')
      .sort(sort);

    // Apply search filter if provided
    if (search) {
      connections = connections.filter(conn => {
        const searchTarget = userRole === 'member' ? conn.creator : conn.member;
        return searchTarget.displayName?.toLowerCase().includes(search.toLowerCase()) ||
               searchTarget.username?.toLowerCase().includes(search.toLowerCase());
      });
    }

    // Format for frontend
    const formattedConnections = connections.map(conn => ({
      id: conn._id,
      connectionData: userRole === 'member' ? {
        creatorName: conn.creator.displayName,
        creatorUsername: `@${conn.creator.username || conn.creator.displayName}`,
        avatar: conn.creator.profileImage,
        isOnline: conn.creator.isOnline
      } : {
        memberName: conn.member.username,
        memberUsername: `@${conn.member.username}`,
        avatar: conn.member.profileImage
      },
      connectionType: conn.connectionType,
      status: conn.status,
      lastMessage: conn.lastMessagePreview?.content || 'No messages yet',
      lastMessageTime: formatTime(conn.lastMessagePreview?.createdAt || conn.lastInteraction),
      unreadCount: userRole === 'member' ? conn.unreadCount.member : conn.unreadCount.creator,
      isPinned: conn.isPinned,
      subscriptionAmount: conn.subscriptionAmount,
      totalSpent: conn.totalSpent,
      connectedSince: conn.connectedAt,
      messageCount: conn.messageCount,
      contentUnlocked: conn.contentUnlocked,
      specialOffers: conn.specialOffers
    }));

    res.status(200).json({
      success: true,
      count: formattedConnections.length,
      data: formattedConnections
    });
  } catch (error) {
    console.error('GetConnections error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// @desc    Get connection statistics
// @route   GET /api/connections/stats
// @access  Private
exports.getConnectionStats = async (req, res, next) => {
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

    const stats = await Connection.aggregate([
      { $match: query },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    const formattedStats = {
      total: 0,
      active: 0,
      pending: 0,
      expired: 0,
      rejected: 0
    };

    stats.forEach(stat => {
      formattedStats[stat._id] = stat.count;
      formattedStats.total += stat.count;
    });

    res.status(200).json({
      success: true,
      data: formattedStats
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// @desc    Accept connection request
// @route   POST /api/connections/:connectionId/accept
// @access  Private
exports.acceptConnection = async (req, res, next) => {
  try {
    const connection = await Connection.findById(req.params.connectionId);

    if (!connection) {
      return res.status(404).json({
        success: false,
        error: 'Connection not found'
      });
    }

    // Member accepting creator's request
    if (req.user.role === 'member') {
      connection.memberLiked = true;
      if (connection.creatorLiked) {
        await connection.establishConnection();
      }
    }
    // Creator accepting member's request
    else if (req.user.role === 'creator') {
      connection.creatorLiked = true;
      connection.creatorAccepted = true;
      if (connection.memberLiked) {
        await connection.establishConnection();
      }
    }

    await connection.save();

    res.status(200).json({
      success: true,
      data: connection
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// @desc    Decline connection request
// @route   POST /api/connections/:connectionId/decline
// @access  Private
exports.declineConnection = async (req, res, next) => {
  try {
    const connection = await Connection.findByIdAndUpdate(
      req.params.connectionId,
      {
        status: 'rejected',
        lastInteraction: Date.now()
      },
      { new: true }
    );

    if (!connection) {
      return res.status(404).json({
        success: false,
        error: 'Connection not found'
      });
    }

    res.status(200).json({
      success: true,
      data: connection
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// @desc    Pin/Unpin connection
// @route   PUT /api/connections/:connectionId/pin
// @access  Private
exports.pinConnection = async (req, res, next) => {
  try {
    const connection = await Connection.findById(req.params.connectionId);

    if (!connection) {
      return res.status(404).json({
        success: false,
        error: 'Connection not found'
      });
    }

    connection.isPinned = !connection.isPinned;
    await connection.save();

    res.status(200).json({
      success: true,
      data: connection
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// @desc    Archive connection
// @route   PUT /api/connections/:connectionId/archive
// @access  Private
exports.archiveConnection = async (req, res, next) => {
  try {
    const connection = await Connection.findByIdAndUpdate(
      req.params.connectionId,
      {
        isArchived: true,
        lastInteraction: Date.now()
      },
      { new: true }
    );

    if (!connection) {
      return res.status(404).json({
        success: false,
        error: 'Connection not found'
      });
    }

    res.status(200).json({
      success: true,
      data: connection
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// @desc    Block connection
// @route   POST /api/connections/:connectionId/block
// @access  Private
exports.blockConnection = async (req, res, next) => {
  try {
    const connection = await Connection.findByIdAndUpdate(
      req.params.connectionId,
      {
        status: 'blocked',
        isActive: false,
        disconnectedBy: req.user.id,
        disconnectedAt: Date.now(),
        disconnectReason: 'blocked'
      },
      { new: true }
    );

    if (!connection) {
      return res.status(404).json({
        success: false,
        error: 'Connection not found'
      });
    }

    res.status(200).json({
      success: true,
      data: connection
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// @desc    Bulk action on connections
// @route   POST /api/connections/bulk
// @access  Private
exports.bulkConnectionAction = async (req, res, next) => {
  try {
    const { connectionIds, action } = req.body;
    
    let updateData = {};
    
    switch(action) {
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
          error: 'Invalid action'
        });
    }

    updateData.lastInteraction = Date.now();

    const result = await Connection.updateMany(
      { _id: { $in: connectionIds } },
      updateData
    );

    res.status(200).json({
      success: true,
      modified: result.modifiedCount
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// ============================================
// EXISTING FUNCTIONS (LEGACY SUPPORT)
// ============================================

// @desc    Get all connections (legacy - redirects to getConnections)
// @route   GET /api/connections/matches
// @access  Private
exports.getMatches = async (req, res, next) => {
  req.query.status = 'active';
  return exports.getConnections(req, res, next);
};

// @desc    Get specific connection
// @route   GET /api/connections/:connectionId
// @access  Private
exports.getMatch = async (req, res, next) => {
  try {
    const connection = await Connection.findById(req.params.connectionId)
      .populate('member', 'username profileImage')
      .populate('creator', 'displayName profileImage bio');

    if (!connection) {
      return res.status(404).json({
        success: false,
        error: 'Connection not found'
      });
    }

    res.status(200).json({
      success: true,
      data: connection
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// @desc    Disconnect (formerly unmatch)
// @route   DELETE /api/connections/:connectionId
// @access  Private
exports.unmatch = async (req, res, next) => {
  try {
    const connection = await Connection.findById(req.params.connectionId);

    if (!connection) {
      return res.status(404).json({
        success: false,
        error: 'Connection not found'
      });
    }

    connection.isActive = false;
    connection.status = 'expired';
    connection.disconnectedBy = req.user.id;
    connection.disconnectedAt = Date.now();
    await connection.save();

    res.status(200).json({
      success: true,
      message: 'Successfully disconnected'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
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
    const connection = await Connection.findById(req.params.connectionId);

    if (!connection || !connection.isConnected) {
      return res.status(404).json({
        success: false,
        error: 'Connection not found or not active'
      });
    }

    const userRole = req.user.role;
    const message = await Message.create({
      connection: connection._id,
      sender: req.user.id,
      senderModel: userRole === 'member' ? 'Member' : 'Creator',
      content: {
        text,
        media
      }
    });

    // Update connection with last message
    await connection.updateLastMessage(text, userRole);

    res.status(201).json({
      success: true,
      data: message
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
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
      isDeleted: false
    })
    .sort({ createdAt: -1 })
    .limit(limit * 1)
    .skip((page - 1) * limit)
    .populate('sender', 'email');

    const count = await Message.countDocuments({
      connection: req.params.connectionId,
      isDeleted: false
    });

    res.status(200).json({
      success: true,
      count: messages.length,
      total: count,
      pages: Math.ceil(count / limit),
      data: messages.reverse()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// @desc    Mark messages as read
// @route   PUT /api/connections/:connectionId/messages/read
// @access  Private
exports.markMessagesAsRead = async (req, res, next) => {
  try {
    const connection = await Connection.findById(req.params.connectionId);
    const userRole = req.user.role;

    // Reset unread count
    await connection.markAsRead(userRole);

    // Mark messages as read
    await Message.updateMany(
      {
        connection: req.params.connectionId,
        sender: { $ne: req.user.id },
        isRead: false
      },
      {
        isRead: true,
        readAt: Date.now()
      }
    );

    res.status(200).json({
      success: true,
      message: 'Messages marked as read'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
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
        error: 'Message not found'
      });
    }

    // Check if user is the sender
    if (message.sender.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to delete this message'
      });
    }

    message.isDeleted = true;
    message.deletedAt = Date.now();
    message.deletedBy = req.user.id;
    await message.save();

    res.status(200).json({
      success: true,
      message: 'Message deleted'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
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