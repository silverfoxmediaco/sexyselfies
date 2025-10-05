// message.controller.js
// Path: backend/src/controllers/message.controller.js
// Purpose: Handle all messaging operations between members and creators with monetization

import Message from '../models/Message.js';
import Conversation from '../models/Conversation.js';
import Member from '../models/Member.js';
import Creator from '../models/Creator.js';
import Transaction from '../models/Transaction.js';
import cloudinary from '../config/cloudinary.js';

// Get all conversations for the logged-in user
export const getConversations = async (req, res) => {
  try {
    const userId = req.userId;
    const userType = req.userType; // 'member' or 'creator'

    // Find all conversations for this user
    const conversations = await Conversation.find({
      'participants.user': userId,
      active: true
    })
    .populate('participants.user', 'username displayName profileImage')
    .populate('lastMessage')
    .sort('-lastMessageAt')
    .lean();

    // Format conversations for response
    const formattedConversations = await Promise.all(
      conversations.map(async (conv) => {
        // Get the other participant
        const otherParticipant = conv.participants.find(
          p => p.user._id.toString() !== userId.toString()
        );

        // Get unread count based on user type
        const unreadCount = userType === 'member' 
          ? conv.memberUnreadCount 
          : conv.creatorUnreadCount;

        return {
          id: conv._id,
          conversationId: conv._id,
          otherUser: {
            id: otherParticipant.user._id,
            username: otherParticipant.user.username,
            displayName: otherParticipant.user.displayName,
            avatar: otherParticipant.user.profileImage,
            userType: otherParticipant.userType,
            isOnline: await checkUserOnline(otherParticipant.user._id)
          },
          lastMessage: conv.lastMessage ? {
            content: conv.lastMessage.content,
            type: conv.lastMessage.messageType,
            createdAt: conv.lastMessage.createdAt,
            isPaid: conv.lastMessage.isPaid,
            sender: conv.lastMessage.sender
          } : null,
          unreadCount,
          totalSpent: conv.totalSpent,
          totalEarned: conv.totalEarned,
          isPinned: userType === 'creator' ? conv.creatorPinned : false,
          isMuted: userType === 'member' ? conv.memberMuted : false,
          lastMessageAt: conv.lastMessageAt
        };
      })
    );

    res.json({
      success: true,
      conversations: formattedConversations,
      total: formattedConversations.length
    });

  } catch (error) {
    console.error('Get conversations error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch conversations'
    });
  }
};

// Get messages for a specific conversation
export const getConversation = async (req, res) => {
  try {
    const { userId: otherUserId } = req.params;
    const currentUserId = req.userId;
    const userType = req.userType;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;

    // Generate conversation ID
    const conversationId = Message.getConversationId(currentUserId, otherUserId);

    // Find or create conversation
    let conversation = await Conversation.findOne({
      'participants.user': { $all: [currentUserId, otherUserId] }
    });

    if (!conversation) {
      // Create new conversation
      const currentUser = userType === 'member' 
        ? await Member.findById(currentUserId)
        : await Creator.findById(currentUserId);
        
      const otherUser = userType === 'member'
        ? await Creator.findById(otherUserId)
        : await Member.findById(otherUserId);

      if (!currentUser || !otherUser) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      conversation = await Conversation.create({
        participants: [
          { user: currentUserId, userType },
          { user: otherUserId, userType: userType === 'member' ? 'creator' : 'member' }
        ],
        conversationId
      });
    }

    // Fetch messages with pagination
    const messages = await Message.find({
      conversationId,
      deleted: false
    })
    .populate('sender', 'username displayName profileImage')
    .populate('recipient', 'username displayName profileImage')
    .sort('-createdAt')
    .limit(limit)
    .skip((page - 1) * limit)
    .lean();

    // Mark messages as read
    await Message.updateMany(
      {
        conversationId,
        recipient: currentUserId,
        read: false
      },
      {
        $set: {
          read: true,
          readAt: new Date()
        }
      }
    );

    // Update conversation unread count
    if (userType === 'member') {
      conversation.memberUnreadCount = 0;
    } else {
      conversation.creatorUnreadCount = 0;
    }
    await conversation.save();

    // Get other user info
    const otherUser = userType === 'member'
      ? await Creator.findById(otherUserId).select('username displayName profileImage bio rates')
      : await Member.findById(otherUserId).select('username displayName profileImage');

    res.json({
      success: true,
      messages: messages.reverse(), // Return in chronological order
      conversation: {
        id: conversation._id,
        conversationId,
        otherUser: {
          id: otherUser._id,
          username: otherUser.username,
          displayName: otherUser.displayName,
          avatar: otherUser.profileImage,
          bio: otherUser.bio,
          rates: otherUser.rates
        },
        totalSpent: conversation.totalSpent,
        totalEarned: conversation.totalEarned
      },
      pagination: {
        page,
        limit,
        hasMore: messages.length === limit
      }
    });

  } catch (error) {
    console.error('Get conversation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch conversation'
    });
  }
};

// Send a text message
export const sendMessage = async (req, res) => {
  try {
    const { recipientId, content, tipAmount } = req.body;
    const senderId = req.userId;
    const senderType = req.userType;

    if (!content || !content.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Message content cannot be empty'
      });
    }

    // Get sender and recipient
    const sender = senderType === 'member'
      ? await Member.findById(senderId)
      : await Creator.findById(senderId);
      
    const recipient = senderType === 'member'
      ? await Creator.findById(recipientId)
      : await Member.findById(recipientId);

    if (!sender || !recipient) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if member has enough credits for tip
    let tipCredits = 0;
    if (tipAmount && senderType === 'member') {
      tipCredits = tipAmount * 100; // Convert dollars to credits
      if (sender.credits < tipCredits) {
        return res.status(400).json({
          success: false,
          message: 'Insufficient credits for tip'
        });
      }
    }

    // Create conversation ID
    const conversationId = Message.getConversationId(senderId, recipientId);

    // Find or create conversation
    let conversation = await Conversation.findOne({
      'participants.user': { $all: [senderId, recipientId] }
    });

    if (!conversation) {
      conversation = await Conversation.create({
        participants: [
          { user: senderId, userType: senderType },
          { user: recipientId, userType: senderType === 'member' ? 'creator' : 'member' }
        ],
        conversationId
      });
    }

    // Create message
    const message = new Message({
      conversationId,
      sender: senderId,
      recipient: recipientId,
      content: content.trim(),
      messageType: 'text',
      tipAmount: tipAmount || 0,
      tipCredits: tipCredits
    });

    await message.save();

    // Process tip if included
    if (tipCredits > 0 && senderType === 'member') {
      // Deduct credits from member
      sender.credits -= tipCredits;
      await sender.save();

      // Add earnings to creator
      const creator = recipient;
      const creatorEarnings = tipAmount * 0.8; // 80% to creator
      creator.earnings = (creator.earnings || 0) + creatorEarnings;
      await creator.save();

      // Create transaction record
      await Transaction.create({
        member: senderId,
        creator: recipientId,
        amount: tipAmount,
        credits: tipCredits,
        type: 'tip',
        description: 'Message tip',
        creatorEarnings,
        platformFee: tipAmount * 0.2,
        referenceId: message._id,
        referenceType: 'Message'
      });

      // Update conversation total spent/earned
      conversation.totalSpent += tipAmount;
      conversation.totalEarned += creatorEarnings;
    }

    // Update conversation
    conversation.lastMessage = message._id;
    conversation.lastMessageAt = new Date();
    if (senderType === 'member') {
      conversation.creatorUnreadCount += 1;
    } else {
      conversation.memberUnreadCount += 1;
    }
    await conversation.save();

    // Populate message before sending response
    await message.populate('sender', 'username displayName profileImage');
    await message.populate('recipient', 'username displayName profileImage');

    // Emit socket event for real-time messaging
    const io = req.app.get('io');
    if (io) {
      io.to(recipientId.toString()).emit('new_message', {
        message,
        conversationId
      });
    }

    // Return response with updated credit balance
    const updatedSender = senderType === 'member'
      ? await Member.findById(senderId).select('credits')
      : await Creator.findById(senderId).select('earnings');

    res.json({
      success: true,
      message,
      creditsRemaining: senderType === 'member' ? updatedSender.credits : null,
      earnings: senderType === 'creator' ? updatedSender.earnings : null
    });

  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send message'
    });
  }
};

// Send a paid message (creator only)
export const sendPaidMessage = async (req, res) => {
  try {
    const { recipientId, content, creditCost, mediaUrl } = req.body;
    const creatorId = req.userId;

    if (req.userType !== 'creator') {
      return res.status(403).json({
        success: false,
        message: 'Only creators can send paid messages'
      });
    }

    if (!content && !mediaUrl) {
      return res.status(400).json({
        success: false,
        message: 'Message must have content or media'
      });
    }

    if (!creditCost || creditCost < 10) {
      return res.status(400).json({
        success: false,
        message: 'Minimum price is 10 credits'
      });
    }

    const creator = await Creator.findById(creatorId);
    const member = await Member.findById(recipientId);

    if (!creator || !member) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Create conversation ID
    const conversationId = Message.getConversationId(creatorId, recipientId);

    // Find or create conversation
    let conversation = await Conversation.findOne({
      'participants.user': { $all: [creatorId, recipientId] }
    });

    if (!conversation) {
      conversation = await Conversation.create({
        participants: [
          { user: creatorId, userType: 'creator' },
          { user: recipientId, userType: 'member' }
        ],
        conversationId
      });
    }

    // Create paid message
    const message = new Message({
      conversationId,
      sender: creatorId,
      recipient: recipientId,
      content: content?.trim(),
      messageType: mediaUrl ? 'paid_content' : 'text',
      isPaid: true,
      creditCost,
      unlocked: false,
      mediaUrl,
      thumbnailUrl: mediaUrl ? await generateThumbnail(mediaUrl) : null
    });

    await message.save();

    // Update conversation
    conversation.lastMessage = message._id;
    conversation.lastMessageAt = new Date();
    conversation.memberUnreadCount += 1;
    await conversation.save();

    // Populate and return
    await message.populate('sender', 'username displayName profileImage');
    await message.populate('recipient', 'username displayName profileImage');

    // Emit socket event
    const io = req.app.get('io');
    if (io) {
      io.to(recipientId.toString()).emit('new_message', {
        message: {
          ...message.toObject(),
          content: '🔒 Locked content', // Hide content until unlocked
          mediaUrl: null
        },
        conversationId
      });
    }

    res.json({
      success: true,
      message
    });

  } catch (error) {
    console.error('Send paid message error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send paid message'
    });
  }
};

// Unlock a paid message (member only)
export const unlockMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const memberId = req.userId;

    if (req.userType !== 'member') {
      return res.status(403).json({
        success: false,
        message: 'Only members can unlock messages'
      });
    }

    const message = await Message.findById(messageId)
      .populate('sender', 'username displayName')
      .populate('recipient', 'username displayName');

    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Message not found'
      });
    }

    if (message.recipient.toString() !== memberId) {
      return res.status(403).json({
        success: false,
        message: 'You can only unlock messages sent to you'
      });
    }

    if (!message.isPaid || message.unlocked) {
      return res.status(400).json({
        success: false,
        message: 'Message is already unlocked or free'
      });
    }

    const member = await Member.findById(memberId);

    if (member.credits < message.creditCost) {
      return res.status(400).json({
        success: false,
        message: 'Insufficient credits',
        creditsNeeded: message.creditCost,
        creditsAvailable: member.credits
      });
    }

    // Process payment
    const dollarAmount = message.creditCost / 100;
    const creatorEarnings = dollarAmount * 0.8;

    // Deduct credits from member
    member.credits -= message.creditCost;
    await member.save();

    // Add earnings to creator
    const creator = await Creator.findById(message.sender);
    creator.earnings = (creator.earnings || 0) + creatorEarnings;
    await creator.save();

    // Create transaction
    await Transaction.create({
      member: memberId,
      creator: message.sender,
      amount: dollarAmount,
      credits: message.creditCost,
      type: 'content_unlock',
      description: 'Unlocked message content',
      creatorEarnings,
      platformFee: dollarAmount * 0.2,
      referenceId: message._id,
      referenceType: 'Message'
    });

    // Unlock message
    message.unlocked = true;
    message.unlockedBy = [...(message.unlockedBy || []), memberId];
    await message.save();

    // Update conversation totals
    const conversation = await Conversation.findOne({
      'participants.user': { $all: [memberId, message.sender] }
    });
    
    if (conversation) {
      conversation.totalSpent += dollarAmount;
      conversation.totalEarned += creatorEarnings;
      await conversation.save();
    }

    // Emit socket event
    const io = req.app.get('io');
    if (io) {
      io.to(memberId.toString()).emit('content_unlocked', {
        messageId: message._id,
        message
      });
    }

    res.json({
      success: true,
      message,
      creditsRemaining: member.credits
    });

  } catch (error) {
    console.error('Unlock message error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to unlock message'
    });
  }
};

// Send an image message
export const sendImage = async (req, res) => {
  try {
    const { recipientId } = req.body;
    const senderId = req.userId;
    const senderType = req.userType;
    const imageFile = req.file;

    if (!imageFile) {
      return res.status(400).json({
        success: false,
        message: 'No image provided'
      });
    }

    // Upload to Cloudinary
    const uploadResult = await cloudinary.uploader.upload(imageFile.path, {
      folder: 'messages',
      resource_type: 'image',
      transformation: [
        { width: 1200, height: 1200, crop: 'limit' },
        { quality: 'auto' }
      ]
    });

    // Check if member has enough credits (2 credits for image)
    const imageCreditCost = 200; // 2 credits
    let sender;
    
    if (senderType === 'member') {
      sender = await Member.findById(senderId);
      if (sender.credits < imageCreditCost) {
        // Clean up uploaded image
        await cloudinary.uploader.destroy(uploadResult.public_id);
        
        return res.status(400).json({
          success: false,
          message: 'Insufficient credits. Images cost 2 credits.',
          creditsNeeded: imageCreditCost,
          creditsAvailable: sender.credits
        });
      }
    } else {
      sender = await Creator.findById(senderId);
    }

    const recipient = senderType === 'member'
      ? await Creator.findById(recipientId)
      : await Member.findById(recipientId);

    if (!sender || !recipient) {
      await cloudinary.uploader.destroy(uploadResult.public_id);
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Create conversation ID
    const conversationId = Message.getConversationId(senderId, recipientId);

    // Find or create conversation
    let conversation = await Conversation.findOne({
      'participants.user': { $all: [senderId, recipientId] }
    });

    if (!conversation) {
      conversation = await Conversation.create({
        participants: [
          { user: senderId, userType: senderType },
          { user: recipientId, userType: senderType === 'member' ? 'creator' : 'member' }
        ],
        conversationId
      });
    }

    // Create message
    const message = new Message({
      conversationId,
      sender: senderId,
      recipient: recipientId,
      messageType: 'image',
      mediaUrl: uploadResult.secure_url,
      mediaPublicId: uploadResult.public_id,
      thumbnailUrl: uploadResult.eager?.[0]?.secure_url || uploadResult.secure_url,
      creditCost: senderType === 'member' ? imageCreditCost : 0
    });

    await message.save();

    // Deduct credits if member
    if (senderType === 'member') {
      sender.credits -= imageCreditCost;
      await sender.save();

      // Add small earning to creator for receiving image
      const imageBonus = 0.10; // $0.10 bonus for receiving image
      const creator = recipient;
      creator.earnings = (creator.earnings || 0) + imageBonus;
      await creator.save();

      // Create transaction
      await Transaction.create({
        member: senderId,
        creator: recipientId,
        amount: imageCreditCost / 100,
        credits: imageCreditCost,
        type: 'image_message',
        description: 'Sent image message',
        creatorEarnings: imageBonus,
        platformFee: (imageCreditCost / 100) - imageBonus,
        referenceId: message._id,
        referenceType: 'Message'
      });
    }

    // Update conversation
    conversation.lastMessage = message._id;
    conversation.lastMessageAt = new Date();
    if (senderType === 'member') {
      conversation.creatorUnreadCount += 1;
    } else {
      conversation.memberUnreadCount += 1;
    }
    await conversation.save();

    // Populate and return
    await message.populate('sender', 'username displayName profileImage');
    await message.populate('recipient', 'username displayName profileImage');

    // Emit socket event
    const io = req.app.get('io');
    if (io) {
      io.to(recipientId.toString()).emit('new_message', {
        message,
        conversationId
      });
    }

    res.json({
      success: true,
      message,
      creditsRemaining: senderType === 'member' ? sender.credits : null
    });

  } catch (error) {
    console.error('Send image error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send image'
    });
  }
};

// Send a tip with message
export const sendTip = async (req, res) => {
  try {
    const { recipientId, amount, message: tipMessage } = req.body;
    const memberId = req.userId;

    if (req.userType !== 'member') {
      return res.status(403).json({
        success: false,
        message: 'Only members can send tips'
      });
    }

    if (!amount || amount < 1) {
      return res.status(400).json({
        success: false,
        message: 'Minimum tip amount is $1'
      });
    }

    const member = await Member.findById(memberId);
    const creator = await Creator.findById(recipientId);

    if (!member || !creator) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const tipCredits = amount * 100;

    if (member.credits < tipCredits) {
      return res.status(400).json({
        success: false,
        message: 'Insufficient credits',
        creditsNeeded: tipCredits,
        creditsAvailable: member.credits
      });
    }

    // Create conversation ID
    const conversationId = Message.getConversationId(memberId, recipientId);

    // Find or create conversation
    let conversation = await Conversation.findOne({
      'participants.user': { $all: [memberId, recipientId] }
    });

    if (!conversation) {
      conversation = await Conversation.create({
        participants: [
          { user: memberId, userType: 'member' },
          { user: recipientId, userType: 'creator' }
        ],
        conversationId
      });
    }

    // Create tip message
    const message = new Message({
      conversationId,
      sender: memberId,
      recipient: recipientId,
      content: tipMessage || `Sent you a $${amount} tip! 💰`,
      messageType: 'tip',
      tipAmount: amount,
      tipCredits
    });

    await message.save();

    // Process payment
    member.credits -= tipCredits;
    await member.save();

    const creatorEarnings = amount * 0.8;
    creator.earnings = (creator.earnings || 0) + creatorEarnings;
    await creator.save();

    // Create transaction
    await Transaction.create({
      member: memberId,
      creator: recipientId,
      amount,
      credits: tipCredits,
      type: 'tip',
      description: tipMessage || 'Direct tip',
      creatorEarnings,
      platformFee: amount * 0.2,
      referenceId: message._id,
      referenceType: 'Message'
    });

    // Update conversation
    conversation.lastMessage = message._id;
    conversation.lastMessageAt = new Date();
    conversation.creatorUnreadCount += 1;
    conversation.totalSpent += amount;
    conversation.totalEarned += creatorEarnings;
    await conversation.save();

    // Populate and return
    await message.populate('sender', 'username displayName profileImage');
    await message.populate('recipient', 'username displayName profileImage');

    // Emit socket event
    const io = req.app.get('io');
    if (io) {
      io.to(recipientId.toString()).emit('new_message', {
        message,
        conversationId
      });

      // Special tip notification
      io.to(recipientId.toString()).emit('tip_received', {
        from: member.username,
        amount,
        message: tipMessage
      });
    }

    res.json({
      success: true,
      message,
      creditsRemaining: member.credits
    });

  } catch (error) {
    console.error('Send tip error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send tip'
    });
  }
};

// Delete a message
export const deleteMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const userId = req.userId;

    const message = await Message.findById(messageId);

    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Message not found'
      });
    }

    // Only sender can delete their own messages
    if (message.sender.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'You can only delete your own messages'
      });
    }

    // Soft delete
    message.deleted = true;
    message.deletedAt = new Date();
    await message.save();

    // If it's an image, delete from Cloudinary
    if (message.messageType === 'image' && message.mediaPublicId) {
      try {
        await cloudinary.uploader.destroy(message.mediaPublicId);
      } catch (cloudinaryError) {
        console.error('Error deleting image from Cloudinary:', cloudinaryError);
      }
    }

    // Emit socket event
    const io = req.app.get('io');
    if (io) {
      io.to(message.recipient.toString()).emit('message_deleted', {
        messageId,
        conversationId: message.conversationId
      });
    }

    res.json({
      success: true,
      message: 'Message deleted successfully'
    });

  } catch (error) {
    console.error('Delete message error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete message'
    });
  }
};

// Mark messages as read
export const markAsRead = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const userId = req.userId;
    const userType = req.userType;

    const result = await Message.updateMany(
      {
        conversationId,
        recipient: userId,
        read: false
      },
      {
        $set: {
          read: true,
          readAt: new Date()
        }
      }
    );

    // Update conversation unread count
    const conversation = await Conversation.findOne({
      conversationId
    });

    if (conversation) {
      if (userType === 'member') {
        conversation.memberUnreadCount = 0;
      } else {
        conversation.creatorUnreadCount = 0;
      }
      await conversation.save();
    }

    // Emit socket event for read receipts
    const io = req.app.get('io');
    if (io && result.modifiedCount > 0) {
      const otherUserId = conversation.participants.find(
        p => p.user.toString() !== userId
      )?.user;

      if (otherUserId) {
        io.to(otherUserId.toString()).emit('messages_read', {
          conversationId,
          readBy: userId
        });
      }
    }

    res.json({
      success: true,
      markedCount: result.modifiedCount
    });

  } catch (error) {
    console.error('Mark as read error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark messages as read'
    });
  }
};

// Get media messages from conversation
export const getMediaMessages = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const userId = req.userId;

    // Verify user is part of conversation
    const conversation = await Conversation.findOne({
      conversationId,
      'participants.user': userId
    });

    if (!conversation) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    const mediaMessages = await Message.find({
      conversationId,
      messageType: { $in: ['image', 'video', 'paid_content'] },
      deleted: false
    })
    .select('mediaUrl thumbnailUrl messageType createdAt sender isPaid unlocked')
    .populate('sender', 'username displayName')
    .sort('-createdAt')
    .lean();

    res.json({
      success: true,
      media: mediaMessages
    });

  } catch (error) {
    console.error('Get media messages error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch media messages'
    });
  }
};

// Search messages
export const searchMessages = async (req, res) => {
  try {
    const { query, conversationId } = req.query;
    const userId = req.userId;

    if (!query || query.length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Search query must be at least 2 characters'
      });
    }

    const searchFilter = {
      deleted: false,
      $or: [
        { sender: userId },
        { recipient: userId }
      ],
      content: { $regex: query, $options: 'i' }
    };

    if (conversationId) {
      searchFilter.conversationId = conversationId;
    }

    const messages = await Message.find(searchFilter)
      .populate('sender', 'username displayName profileImage')
      .populate('recipient', 'username displayName profileImage')
      .sort('-createdAt')
      .limit(50)
      .lean();

    res.json({
      success: true,
      messages,
      total: messages.length
    });

  } catch (error) {
    console.error('Search messages error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to search messages'
    });
  }
};

// Archive/unarchive conversation
export const archiveConversation = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { archive } = req.body;
    const userId = req.userId;
    const userType = req.userType;

    const conversation = await Conversation.findOne({
      _id: conversationId,
      'participants.user': userId
    });

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: 'Conversation not found'
      });
    }

    if (userType === 'member') {
      conversation.memberArchived = archive;
    } else {
      // Creators can't archive, they pin instead
      return res.status(400).json({
        success: false,
        message: 'Creators use pin feature instead of archive'
      });
    }

    await conversation.save();

    res.json({
      success: true,
      archived: archive
    });

  } catch (error) {
    console.error('Archive conversation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to archive conversation'
    });
  }
};

// Mute/unmute conversation
export const muteConversation = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { mute } = req.body;
    const userId = req.userId;
    const userType = req.userType;

    const conversation = await Conversation.findOne({
      _id: conversationId,
      'participants.user': userId
    });

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: 'Conversation not found'
      });
    }

    if (userType === 'member') {
      conversation.memberMuted = mute;
    } else {
      // Creators can pin important conversations
      conversation.creatorPinned = mute; // Using mute as pin for creators
    }

    await conversation.save();

    res.json({
      success: true,
      muted: mute
    });

  } catch (error) {
    console.error('Mute conversation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mute conversation'
    });
  }
};

// Helper function to check if user is online
async function checkUserOnline(userId) {
  // This would check against your socket connections or Redis cache
  // For now, return false as placeholder
  return false;
}

// Helper function to generate thumbnail
async function generateThumbnail(mediaUrl) {
  // For images, return the same URL
  // For videos, you'd generate a thumbnail
  return mediaUrl;
}

export default {
  getConversations,
  getConversation,
  sendMessage,
  sendPaidMessage,
  unlockMessage,
  sendImage,
  sendTip,
  deleteMessage,
  markAsRead,
  getMediaMessages,
  searchMessages,
  archiveConversation,
  muteConversation
};