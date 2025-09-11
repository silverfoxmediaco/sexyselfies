const CreatorMessage = require('../models/CreatorMessage');
const CreatorConnection = require('../models/CreatorConnection');
const CreatorProfile = require('../models/CreatorProfile');
const Member = require('../models/Member');
const Notification = require('../models/Notification');
const mongoose = require('mongoose');
const cloudinary = require('../config/cloudinary');

// Send a message to a connected member
exports.sendMessage = async (req, res) => {
  try {
    const creatorId = req.user.id;
    const { connectionId, content, mediaType, mediaUrl, price } = req.body;
    
    // Verify connection exists and is active
    const connection = await CreatorConnection.findOne({
      _id: connectionId,
      creator: creatorId,
      status: 'connected'
    });
    
    if (!connection) {
      return res.status(404).json({
        success: false,
        message: 'Connection not found or not active'
      });
    }
    
    // Create message
    const message = new CreatorMessage({
      creator: creatorId,
      member: connection.member,
      connection: connectionId,
      content: {
        text: content,
        media: mediaUrl ? [{
          type: mediaType,
          url: mediaUrl,
          thumbnail: mediaType === 'video' ? await generateVideoThumbnail(mediaUrl) : null
        }] : []
      },
      type: price > 0 ? 'paid' : 'free',
      pricing: {
        isPaid: price > 0,
        price: price || 0,
        currency: 'USD'
      },
      metadata: {
        connectionContext: connection.context,
        memberTier: connection.relationship.memberScore.tier
      }
    });
    
    await message.save();
    
    // Update connection's last message info
    connection.lastMessageAt = new Date();
    connection.messageCount += 1;
    await connection.save();
    
    // Send notification to member
    await sendMessageNotification(connection.member, creatorId, message);
    
    // Populate creator info for response
    await message.populate('creator', 'username profileImage');
    
    res.json({
      success: true,
      message: message
    });
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({
      success: false,
      message: 'Error sending message'
    });
  }
};

// Get messages for a specific connection
exports.getMessages = async (req, res) => {
  try {
    const creatorId = req.user.id;
    const { connectionId } = req.params;
    const { page = 1, limit = 50 } = req.query;
    
    // Verify connection belongs to creator
    const connection = await CreatorConnection.findOne({
      _id: connectionId,
      creator: creatorId
    });
    
    if (!connection) {
      return res.status(404).json({
        success: false,
        message: 'Connection not found'
      });
    }
    
    const messages = await CreatorMessage.find({
      creator: creatorId,
      member: connection.member,
      connection: connectionId
    })
      .sort('-createdAt')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .populate('member', 'username profileImage')
      .populate('creator', 'username profileImage');
    
    // Mark messages as read
    await CreatorMessage.updateMany(
      {
        creator: creatorId,
        member: connection.member,
        connection: connectionId,
        'status.read': false,
        sender: 'member'
      },
      {
        'status.read': true,
        'status.readAt': new Date()
      }
    );
    
    res.json({
      success: true,
      messages,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        hasMore: messages.length === parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching messages'
    });
  }
};

// Get all message threads (connections with messages)
exports.getMessageThreads = async (req, res) => {
  try {
    const creatorId = req.user.id;
    const { filter = 'all', page = 1, limit = 20 } = req.query;
    
    // Build connection query based on filter
    let connectionQuery = {
      creator: creatorId,
      status: 'connected'
    };
    
    if (filter === 'unread') {
      connectionQuery.hasUnreadMessages = true;
    } else if (filter === 'paid') {
      connectionQuery['monetization.totalRevenue'] = { $gt: 0 };
    } else if (filter === 'vip') {
      connectionQuery['relationship.memberScore.tier'] = { $in: ['vip', 'whale'] };
    }
    
    // Get connections with messages
    const connections = await CreatorConnection.find(connectionQuery)
      .sort('-lastMessageAt')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .populate('member', 'username profileImage lastActive')
      .lean();
    
    // Get last message for each thread
    const threads = await Promise.all(
      connections.map(async (connection) => {
        const lastMessage = await CreatorMessage.findOne({
          creator: creatorId,
          member: connection.member._id,
          connection: connection._id
        })
          .sort('-createdAt')
          .lean();
        
        const unreadCount = await CreatorMessage.countDocuments({
          creator: creatorId,
          member: connection.member._id,
          connection: connection._id,
          sender: 'member',
          'status.read': false
        });
        
        return {
          connection: connection,
          lastMessage,
          unreadCount,
          memberInfo: {
            ...connection.member,
            isOnline: isUserOnline(connection.member.lastActive),
            tier: connection.relationship.memberScore.tier,
            totalSpent: connection.monetization.totalRevenue
          }
        };
      })
    );
    
    res.json({
      success: true,
      threads,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        hasMore: connections.length === parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Get message threads error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching message threads'
    });
  }
};

// Send bulk message to multiple connections
exports.sendBulkMessage = async (req, res) => {
  try {
    const creatorId = req.user.id;
    const { connectionIds, content, mediaUrl, mediaType, segment } = req.body;
    
    // Get target connections
    let targetConnections;
    
    if (connectionIds && connectionIds.length > 0) {
      // Specific connections
      targetConnections = await CreatorConnection.find({
        _id: { $in: connectionIds },
        creator: creatorId,
        status: 'connected'
      });
    } else if (segment) {
      // Segment-based targeting
      let segmentQuery = {
        creator: creatorId,
        status: 'connected'
      };
      
      if (segment === 'vip') {
        segmentQuery['relationship.memberScore.tier'] = { $in: ['vip', 'whale'] };
      } else if (segment === 'active') {
        segmentQuery['engagement.lastActiveAt'] = { 
          $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) 
        };
      } else if (segment === 'paying') {
        segmentQuery['monetization.totalRevenue'] = { $gt: 0 };
      }
      
      targetConnections = await CreatorConnection.find(segmentQuery);
    } else {
      return res.status(400).json({
        success: false,
        message: 'No recipients specified'
      });
    }
    
    // Check bulk message limits
    const creator = await CreatorProfile.findOne({ creator: creatorId });
    const dailyLimit = creator?.subscription?.tier === 'premium' ? 500 : 100;
    
    if (targetConnections.length > dailyLimit) {
      return res.status(400).json({
        success: false,
        message: `Bulk message limit exceeded. Maximum ${dailyLimit} recipients per day.`
      });
    }
    
    // Send messages
    const results = await Promise.all(
      targetConnections.map(async (connection) => {
        try {
          const message = new CreatorMessage({
            creator: creatorId,
            member: connection.member,
            connection: connection._id,
            content: {
              text: personalizeMessage(content, connection),
              media: mediaUrl ? [{
                type: mediaType,
                url: mediaUrl
              }] : []
            },
            type: 'bulk',
            metadata: {
              isBulk: true,
              bulkSegment: segment,
              connectionContext: connection.context
            }
          });
          
          await message.save();
          
          // Update connection
          connection.lastMessageAt = new Date();
          connection.messageCount += 1;
          await connection.save();
          
          // Send notification
          await sendMessageNotification(connection.member, creatorId, message);
          
          return { success: true, connectionId: connection._id };
        } catch (error) {
          console.error(`Failed to send to connection ${connection._id}:`, error);
          return { success: false, connectionId: connection._id, error: error.message };
        }
      })
    );
    
    const successCount = results.filter(r => r.success).length;
    const failedCount = results.filter(r => !r.success).length;
    
    res.json({
      success: true,
      message: `Bulk message sent to ${successCount} members`,
      results: {
        sent: successCount,
        failed: failedCount,
        details: results
      }
    });
  } catch (error) {
    console.error('Send bulk message error:', error);
    res.status(500).json({
      success: false,
      message: 'Error sending bulk message'
    });
  }
};

// Mark message as read
exports.markAsRead = async (req, res) => {
  try {
    const creatorId = req.user.id;
    const { messageId } = req.params;
    
    const message = await CreatorMessage.findOneAndUpdate(
      {
        _id: messageId,
        creator: creatorId,
        'status.read': false
      },
      {
        'status.read': true,
        'status.readAt': new Date()
      },
      { new: true }
    );
    
    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Message not found or already read'
      });
    }
    
    res.json({
      success: true,
      message: 'Message marked as read'
    });
  } catch (error) {
    console.error('Mark as read error:', error);
    res.status(500).json({
      success: false,
      message: 'Error marking message as read'
    });
  }
};

// Delete a message
exports.deleteMessage = async (req, res) => {
  try {
    const creatorId = req.user.id;
    const { messageId } = req.params;
    
    const message = await CreatorMessage.findOne({
      _id: messageId,
      creator: creatorId
    });
    
    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Message not found'
      });
    }
    
    // Soft delete
    message.status.deleted = true;
    message.status.deletedAt = new Date();
    await message.save();
    
    res.json({
      success: true,
      message: 'Message deleted'
    });
  } catch (error) {
    console.error('Delete message error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting message'
    });
  }
};

// Get message analytics
exports.getMessageAnalytics = async (req, res) => {
  try {
    const creatorId = req.user.id;
    const { period = '7d' } = req.query;
    
    // Check if creator has any messages or connections
    const hasMessages = await CreatorMessage.countDocuments({ creator: creatorId }) > 0;
    const hasConnections = await CreatorConnection.countDocuments({ creator: creatorId }) > 0;
    
    // Return default analytics for new creators
    if (!hasMessages && !hasConnections) {
      return res.json({
        success: true,
        data: {
          totalMessages: 0,
          paidMessages: 0,
          purchasedMessages: 0,
          revenue: 0,
          averagePrice: 0,
          responseRate: 0,
          conversionRate: 0,
          topPerforming: [],
          recent: [],
          trends: {
            messages: [],
            revenue: [],
            purchases: []
          },
          insights: [
            {
              type: 'getting_started',
              message: 'Connect with members to start messaging',
              action: 'Browse members to connect with'
            }
          ]
        }
      });
    }
    
    const startDate = getStartDate(period);
    
    // Get message stats
    const totalMessages = await CreatorMessage.countDocuments({
      creator: creatorId,
      createdAt: { $gte: startDate }
    });
    
    const paidMessages = await CreatorMessage.countDocuments({
      creator: creatorId,
      type: 'paid',
      createdAt: { $gte: startDate }
    });
    
    const purchasedMessages = await CreatorMessage.countDocuments({
      creator: creatorId,
      type: 'paid',
      'purchase.isPurchased': true,
      createdAt: { $gte: startDate }
    });
    
    // Get revenue from messages
    const messageRevenue = await CreatorMessage.aggregate([
      {
        $match: {
          creator: mongoose.Types.ObjectId(creatorId),
          type: 'paid',
          'purchase.isPurchased': true,
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$pricing.price' },
          count: { $sum: 1 }
        }
      }
    ]);
    
    // Get response rates
    const sentByCreator = await CreatorMessage.countDocuments({
      creator: creatorId,
      sender: 'creator',
      createdAt: { $gte: startDate }
    });
    
    const responses = await CreatorMessage.countDocuments({
      creator: creatorId,
      sender: 'member',
      'metadata.isResponse': true,
      createdAt: { $gte: startDate }
    });
    
    // Get top conversations
    const topConversations = await CreatorMessage.aggregate([
      {
        $match: {
          creator: mongoose.Types.ObjectId(creatorId),
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: '$connection',
          messageCount: { $sum: 1 },
          revenue: {
            $sum: {
              $cond: [
                { $eq: ['$purchase.isPurchased', true] },
                '$pricing.price',
                0
              ]
            }
          },
          lastMessage: { $max: '$createdAt' }
        }
      },
      {
        $sort: { revenue: -1 }
      },
      {
        $limit: 10
      }
    ]);
    
    // Populate connection details
    const topConversationsWithDetails = await CreatorConnection.populate(
      topConversations,
      {
        path: '_id',
        populate: {
          path: 'member',
          select: 'username profileImage'
        }
      }
    );
    
    const analytics = {
      overview: {
        totalMessages,
        paidMessages,
        purchasedMessages,
        conversionRate: paidMessages > 0 ? 
          ((purchasedMessages / paidMessages) * 100).toFixed(2) : 0,
        revenue: messageRevenue[0]?.total || 0,
        avgMessageValue: messageRevenue[0]?.count > 0 ?
          (messageRevenue[0].total / messageRevenue[0].count).toFixed(2) : 0
      },
      
      engagement: {
        sentMessages: sentByCreator,
        receivedResponses: responses,
        responseRate: sentByCreator > 0 ?
          ((responses / sentByCreator) * 100).toFixed(2) : 0,
        avgResponseTime: '2.5 hours' // Would calculate actual
      },
      
      topConversations: topConversationsWithDetails.map(conv => ({
        connection: conv._id,
        member: conv._id?.member,
        messageCount: conv.messageCount,
        revenue: conv.revenue,
        lastMessage: conv.lastMessage
      })),
      
      trends: {
        daily: await getDailyMessageTrends(creatorId, startDate),
        hourly: await getHourlyMessagePattern(creatorId)
      },
      
      recommendations: generateMessageRecommendations(analytics)
    };
    
    res.json({
      success: true,
      analytics
    });
  } catch (error) {
    console.error('Get message analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching message analytics'
    });
  }
};

// Upload message media
exports.uploadMessageMedia = async (req, res) => {
  try {
    const creatorId = req.user.id;
    
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }
    
    // Upload to Cloudinary
    const result = await cloudinary.uploader.upload(req.file.path, {
      folder: `creators/${creatorId}/messages`,
      resource_type: 'auto',
      transformation: [
        { quality: 'auto:good' },
        { fetch_format: 'auto' }
      ]
    });
    
    res.json({
      success: true,
      media: {
        url: result.secure_url,
        type: result.resource_type,
        thumbnail: result.resource_type === 'video' ? 
          result.secure_url.replace(/\.[^/.]+$/, '.jpg') : null
      }
    });
  } catch (error) {
    console.error('Upload message media error:', error);
    res.status(500).json({
      success: false,
      message: 'Error uploading media'
    });
  }
};

// Helper functions

function isUserOnline(lastActive) {
  if (!lastActive) return false;
  const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
  return new Date(lastActive) > fiveMinutesAgo;
}

async function generateVideoThumbnail(videoUrl) {
  // Would generate actual thumbnail
  return videoUrl.replace(/\.[^/.]+$/, '.jpg');
}

async function sendMessageNotification(memberId, creatorId, message) {
  try {
    const creator = await CreatorProfile.findOne({ creator: creatorId })
      .select('displayName profileImage');
    
    const notification = new Notification({
      recipient: memberId,
      type: 'message',
      title: `New message from ${creator.displayName}`,
      message: message.content.text ? 
        message.content.text.substring(0, 100) : 
        'Sent you a photo',
      data: {
        creatorId,
        messageId: message._id,
        connectionId: message.connection
      }
    });
    
    await notification.save();
    
    // Send push notification if enabled
    // await sendPushNotification(memberId, notification);
  } catch (error) {
    console.error('Send notification error:', error);
  }
}

function personalizeMessage(template, connection) {
  // Simple personalization
  let message = template;
  
  if (connection.member?.username) {
    message = message.replace('{name}', connection.member.username);
  }
  
  if (connection.relationship?.memberScore?.tier) {
    message = message.replace('{tier}', connection.relationship.memberScore.tier);
  }
  
  return message;
}

function getStartDate(period) {
  const now = new Date();
  
  switch(period) {
    case '24h':
      return new Date(now - 24 * 60 * 60 * 1000);
    case '7d':
      return new Date(now - 7 * 24 * 60 * 60 * 1000);
    case '30d':
      return new Date(now - 30 * 24 * 60 * 60 * 1000);
    default:
      return new Date(now - 7 * 24 * 60 * 60 * 1000);
  }
}

async function getDailyMessageTrends(creatorId, startDate) {
  // Would aggregate daily message counts
  return [];
}

async function getHourlyMessagePattern(creatorId) {
  // Would analyze hourly patterns
  return [];
}

function generateMessageRecommendations(analytics) {
  const recommendations = [];
  
  if (analytics?.overview?.conversionRate < 20) {
    recommendations.push('Consider lowering message prices to increase conversions');
  }
  
  if (analytics?.engagement?.responseRate < 50) {
    recommendations.push('Send more engaging opening messages to increase responses');
  }
  
  recommendations.push('Peak messaging hours are 7-10 PM');
  
  return recommendations;
}

module.exports = exports;