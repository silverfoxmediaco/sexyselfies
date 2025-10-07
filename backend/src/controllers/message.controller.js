// message.controller.js
// Path: backend/src/controllers/message.controller.js
// Purpose: Handle all messaging operations between members and creators with monetization

const Message = require('../models/Message');
const Conversation = require('../models/Conversation');
const Member = require('../models/Member');
const Creator = require('../models/Creator');
const Transaction = require('../models/Transaction');
const cloudinary = require('../config/cloudinary');
const emailService = require('../services/email.service');
const User = require('../models/User');

// Get all conversations for the logged-in user
const getConversations = async (req, res) => {
  try {
    const userId = req.user._id;
    const userType = req.user.role; // 'member' or 'creator'

    // Find all conversations for this user
    const userRole = userType === 'member' ? 'member' : 'creator';
    const conversations = await Conversation.find({
      'participants.user': userId,
      [`isDeleted.${userRole}`]: { $ne: true },
      [`isArchived.${userRole}`]: { $ne: true }
    })
    .populate('participants.user', 'username profileImage')
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

        // Skip if no other participant or user not populated
        if (!otherParticipant || !otherParticipant.user) {
          console.warn('Conversation missing other participant:', conv._id);
          return null;
        }

        // Get unread count based on user type (from nested unreadCount object)
        const unreadCount = userType === 'member'
          ? (conv.unreadCount?.member || 0)
          : (conv.unreadCount?.creator || 0);

        return {
          id: conv._id,
          conversationId: conv._id,
          otherUser: {
            id: otherParticipant.user._id,
            username: otherParticipant.user.username,
            displayName: otherParticipant.user.displayName || otherParticipant.user.username,
            // Only show avatar for Creators, not Members (members don't post photos)
            avatar: otherParticipant.userModel === 'Creator'
              ? (otherParticipant.user.profileImage || '/placeholders/default-avatar.png')
              : null,
            userModel: otherParticipant.userModel,
            role: otherParticipant.role,
            isOnline: await checkUserOnline(otherParticipant.user._id)
          },
          lastMessage: conv.lastMessage ? {
            content: conv.lastMessage.content,
            type: conv.lastMessage.messageType,
            createdAt: conv.lastMessage.createdAt,
            sender: conv.lastMessage.sender
          } : null,
          unreadCount,
          isPinned: conv.priority === 'vip' || conv.priority === 'important',
          isMuted: otherParticipant.notificationSettings?.muted || false,
          lastMessageAt: conv.lastMessageAt
        };
      })
    ).then(results => results.filter(r => r !== null)); // Filter out null results

    res.json({
      success: true,
      conversations: formattedConversations,
      total: formattedConversations.length
    });

  } catch (error) {
    console.error('Get conversations error:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch conversations',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get single conversation by ID with populated participants
const getConversation = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const currentUserId = req.user._id;

    // Find conversation and populate participants
    const conversation = await Conversation.findById(conversationId)
      .populate('participants.user', 'username displayName profileImage isOnline lastActive');

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: 'Conversation not found'
      });
    }

    // Verify user is part of conversation
    const isParticipant = conversation.participants.some(
      p => p.user._id.toString() === currentUserId.toString()
    );

    if (!isParticipant) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    res.json({
      success: true,
      data: conversation
    });

  } catch (error) {
    console.error('Get conversation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch conversation'
    });
  }
};

// Send a message to a conversation (route handler for POST /conversations/:conversationId/messages)
const sendMessageToConversation = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const senderId = req.user._id;
    const senderType = req.user.role;

    // Extract content from either FormData or JSON body
    let content = req.body.content;
    const media = req.files; // From multer upload

    // Validate content
    if (!content || !content.trim()) {
      if (!media || media.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Message must have content or media'
        });
      }
      content = ''; // Empty text with media is allowed
    }

    // Find the conversation
    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: 'Conversation not found'
      });
    }

    // Verify sender is a participant
    const senderParticipant = conversation.participants.find(
      p => p.user.toString() === senderId.toString()
    );
    if (!senderParticipant) {
      return res.status(403).json({
        success: false,
        message: 'You are not a participant in this conversation'
      });
    }

    // Find the recipient (the other participant)
    const recipientParticipant = conversation.participants.find(
      p => p.user.toString() !== senderId.toString()
    );
    if (!recipientParticipant) {
      return res.status(400).json({
        success: false,
        message: 'No recipient found in conversation'
      });
    }

    const recipientId = recipientParticipant.user;

    // Create message document
    const messageData = {
      conversation: conversationId,
      sender: senderId,
      senderModel: senderParticipant.userModel,
      recipient: recipientId,
      recipientModel: recipientParticipant.userModel,
      content: content.trim(),
      messageType: media && media.length > 0 ? 'media' : 'text',
      read: false
    };

    // Handle media uploads if present
    if (media && media.length > 0) {
      // TODO: Upload to Cloudinary and add media URLs
      // For now, just mark as media type
      messageData.media = media.map(file => ({
        type: file.mimetype.startsWith('image') ? 'image' : 'video',
        url: file.path, // Temporary - should be Cloudinary URL
        size: file.size
      }));
    }

    const message = await Message.create(messageData);

    // Update conversation metadata
    conversation.lastMessage = message._id;
    conversation.lastMessageAt = new Date();
    conversation.metadata.totalMessages += 1;

    // Increment unread count for recipient
    const recipientRole = recipientParticipant.role;
    conversation.unreadCount[recipientRole] += 1;

    await conversation.save();

    // Populate sender info for response
    await message.populate('sender', 'username displayName profileImage');

    // Send email notification to recipient (async, don't await)
    try {
      const recipientUser = await User.findById(recipientId);
      const senderUser = await User.findById(senderId);

      if (recipientUser && recipientUser.email && senderUser) {
        // Get sender's display name
        const senderProfile = senderParticipant.userModel === 'Creator'
          ? await Creator.findOne({ user: senderId })
          : await Member.findOne({ user: senderId });

        const senderDisplayName = senderProfile?.displayName || senderUser.username || 'Someone';
        const recipientDisplayName = recipientUser.username || 'User';

        // Determine message link based on recipient role
        const messageLink = `${process.env.CLIENT_URL}/${recipientParticipant.role}/messages/${conversationId}`;

        // Send email (don't await - fire and forget)
        emailService.sendNewMessageEmail({
          recipientEmail: recipientUser.email,
          recipientName: recipientDisplayName,
          senderName: senderDisplayName,
          messagePreview: content.substring(0, 100) + (content.length > 100 ? '...' : ''),
          messageLink
        }).catch(err => {
          console.error('Email send error (non-blocking):', err.message);
        });
      }
    } catch (emailError) {
      // Log but don't fail the request if email fails
      console.error('Error preparing email notification:', emailError.message);
    }

    res.status(201).json({
      success: true,
      data: message
    });

  } catch (error) {
    console.error('Send message to conversation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send message',
      error: error.message
    });
  }
};

// Send a text message (legacy function - kept for backward compatibility)
const sendMessage = async (req, res) => {
  try {
    const { recipientId, content, tipAmount } = req.body;
    const senderId = req.user._id;
    const senderType = req.user.role;

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
const sendPaidMessage = async (req, res) => {
  try {
    const { recipientId, content, creditCost, mediaUrl } = req.body;
    const creatorId = req.user._id;

    if (req.user.role !== 'creator') {
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
const unlockMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const memberId = req.user._id;

    if (req.user.role !== 'member') {
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
const sendImage = async (req, res) => {
  try {
    const { recipientId } = req.body;
    const senderId = req.user._id;
    const senderType = req.user.role;
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
const sendTip = async (req, res) => {
  try {
    const { recipientId, amount, message: tipMessage } = req.body;
    const memberId = req.user._id;

    if (req.user.role !== 'member') {
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
const deleteMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const userId = req.user._id;

    const message = await Message.findById(messageId);

    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Message not found'
      });
    }

    // Only sender can delete their own messages
    if (message.sender.toString() !== userId.toString()) {
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
const markAsRead = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user._id;
    const userType = req.user.role;

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
const getMediaMessages = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user._id;

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
const searchMessages = async (req, res) => {
  try {
    const { query, conversationId } = req.query;
    const userId = req.user._id;

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
const archiveConversation = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { archive } = req.body;
    const userId = req.user._id;
    const userType = req.user.role;

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
const muteConversation = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { mute } = req.body;
    const userId = req.user._id;
    const userType = req.user.role;

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

// Additional required functions for routes
const getConversationMessages = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { page = 1, limit = 50 } = req.query;

    const messages = await Message.find({ conversation: conversationId })
      .sort('createdAt') // Oldest first (chronological order)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .populate({
        path: 'sender',
        select: 'username displayName profileImage'
      })
      .populate({
        path: 'recipient',
        select: 'username displayName profileImage'
      })
      .lean();

    res.json({ success: true, data: messages });
  } catch (error) {
    console.error('Error fetching conversation messages:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

const editMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const { content } = req.body;

    const message = await Message.findByIdAndUpdate(
      messageId,
      { content, edited: true, editedAt: Date.now() },
      { new: true }
    );

    res.json({ success: true, data: message });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const replyToMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const { content } = req.body;

    const originalMessage = await Message.findById(messageId);
    const newMessage = await Message.create({
      conversation: originalMessage.conversation,
      sender: req.user._id,
      content,
      replyTo: messageId
    });

    res.json({ success: true, data: newMessage });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const unlockMedia = async (req, res) => {
  // Alias for unlockMessage
  return unlockMessage(req, res);
};

const getUnreadCount = async (req, res) => {
  try {
    const userId = req.user._id;
    const count = await Message.countDocuments({
      recipient: userId,
      read: false
    });

    res.json({ success: true, data: { count } });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const markAllAsRead = async (req, res) => {
  try {
    const { conversationId } = req.params;

    await Message.updateMany(
      { conversation: conversationId, recipient: req.user._id, read: false },
      { read: true, readAt: Date.now() }
    );

    res.json({ success: true, message: 'All messages marked as read' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const pinMessage = async (req, res) => {
  try {
    const { messageId } = req.params;

    const message = await Message.findByIdAndUpdate(
      messageId,
      { pinned: true },
      { new: true }
    );

    res.json({ success: true, data: message });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const unpinMessage = async (req, res) => {
  try {
    const { messageId } = req.params;

    const message = await Message.findByIdAndUpdate(
      messageId,
      { pinned: false },
      { new: true }
    );

    res.json({ success: true, data: message });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const unarchiveConversation = async (req, res) => {
  try {
    const { conversationId } = req.params;

    const conversation = await Conversation.findByIdAndUpdate(
      conversationId,
      { archived: false },
      { new: true }
    );

    res.json({ success: true, data: conversation });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const unmuteConversation = async (req, res) => {
  try {
    const { conversationId } = req.params;

    const conversation = await Conversation.findByIdAndUpdate(
      conversationId,
      { muted: false },
      { new: true }
    );

    res.json({ success: true, data: conversation });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const blockUser = async (req, res) => {
  try {
    const { userId } = req.params;

    // Add user to blocked list
    await Member.findByIdAndUpdate(
      req.user._id,
      { $addToSet: { blockedUsers: userId } }
    );

    res.json({ success: true, message: 'User blocked' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const unblockUser = async (req, res) => {
  try {
    const { userId } = req.params;

    // Remove user from blocked list
    await Member.findByIdAndUpdate(
      req.user._id,
      { $pull: { blockedUsers: userId } }
    );

    res.json({ success: true, message: 'User unblocked' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const reportMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const { reason } = req.body;

    // Create report (assuming Report model exists)
    // await Report.create({ message: messageId, reporter: req.user._id, reason });

    res.json({ success: true, message: 'Message reported' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const clearConversation = async (req, res) => {
  try {
    const { conversationId } = req.params;

    await Message.deleteMany({ conversation: conversationId });

    res.json({ success: true, message: 'Conversation cleared' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const getConversationMedia = async (req, res) => {
  // Alias for getMediaMessages
  return getMediaMessages(req, res);
};

const getSharedMedia = async (req, res) => {
  try {
    const userId = req.user._id;

    const messages = await Message.find({
      $or: [{ sender: userId }, { recipient: userId }],
      'media.0': { $exists: true }
    })
      .populate('sender recipient', 'username displayName profileImage')
      .sort('-createdAt')
      .lean();

    res.json({ success: true, data: messages });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const createOrGetConversation = async (req, res) => {
  try {
    const { userId, username, userModel } = req.body;
    const currentUserId = req.user._id;
    let targetUserId = userId;

    // If username provided instead of userId, look up the user based on userModel
    if (username && !userId) {
      if (userModel === 'Creator') {
        // CRITICAL: Only allow messaging to VERIFIED and NOT PAUSED creators
        const creator = await Creator.findOne({
          username,
          isVerified: true,        // Must be verified (age + identity confirmed)
          isPaused: { $ne: true }  // Must not be paused
        }).select('_id username isVerified');

        if (!creator) {
          return res.status(404).json({
            success: false,
            message: 'Creator not found or not available for messaging. Creators must be verified to receive messages.'
          });
        }

        // Double-check verification status for safety
        if (!creator.isVerified) {
          return res.status(403).json({
            success: false,
            message: 'This creator is not verified and cannot receive messages'
          });
        }

        targetUserId = creator._id;
      } else if (userModel === 'Member') {
        // Look up member by username
        const member = await Member.findOne({ username }).select('_id username');

        if (!member) {
          return res.status(404).json({
            success: false,
            message: 'Member not found'
          });
        }

        targetUserId = member._id;
      } else {
        return res.status(400).json({
          success: false,
          message: 'Invalid userModel. Must be "Creator" or "Member"'
        });
      }
    }

    if (!targetUserId) {
      return res.status(400).json({
        success: false,
        message: 'Either userId or username is required'
      });
    }

    // If userId was provided directly, verify the user exists
    if (userId) {
      if (userModel === 'Creator') {
        const creator = await Creator.findOne({
          _id: userId,
          isVerified: true,
          isPaused: { $ne: true }
        }).select('_id isVerified');

        if (!creator || !creator.isVerified) {
          return res.status(403).json({
            success: false,
            message: 'This creator is not verified and cannot receive messages'
          });
        }
      } else if (userModel === 'Member') {
        const member = await Member.findById(userId).select('_id');
        if (!member) {
          return res.status(404).json({
            success: false,
            message: 'Member not found'
          });
        }
      }
    }

    // Determine current user's type and role based on req.user.role
    const currentUserRole = req.user.role; // 'member' or 'creator' (lowercase)
    const currentUserModel = currentUserRole === 'creator' ? 'Creator' : 'Member'; // Capitalized

    // CRITICAL: Prevent creator-to-creator conversations
    // Creators can ONLY message Members, Members can ONLY message Creators
    if (currentUserModel === 'Creator' && userModel === 'Creator') {
      return res.status(403).json({
        success: false,
        message: 'Creators cannot message other creators'
      });
    }

    if (currentUserModel === 'Member' && userModel === 'Member') {
      return res.status(403).json({
        success: false,
        message: 'Members cannot message other members'
      });
    }

    // Check if conversation exists
    let conversation = await Conversation.findOne({
      'participants.user': { $all: [currentUserId, targetUserId] }
    })
    .populate('participants.user', 'username displayName profileImage isOnline lastActive');

    if (!conversation) {
      // Create new conversation with both userModel and role
      conversation = await Conversation.create({
        participants: [
          {
            user: currentUserId,
            userModel: currentUserModel,  // 'Member' or 'Creator' (capitalized)
            role: currentUserRole          // 'member' or 'creator' (lowercase)
          },
          {
            user: targetUserId,
            userModel: userModel,           // 'Creator' from request
            role: userModel.toLowerCase()   // 'creator' (lowercase)
          }
        ]
      });

      // Populate after creation
      conversation = await Conversation.findById(conversation._id)
        .populate('participants.user', 'username displayName profileImage isOnline lastActive');
    }

    res.json({ success: true, data: conversation });
  } catch (error) {
    console.error('Create or get conversation error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

const updateTypingStatus = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { isTyping } = req.body;

    // Emit socket event for typing status
    // req.io.to(conversationId).emit('typing', { userId: req.user._id, isTyping });

    res.json({ success: true, message: 'Typing status updated' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const getPinnedMessages = async (req, res) => {
  try {
    const { conversationId } = req.params;

    const messages = await Message.find({
      conversation: conversationId,
      pinned: true
    })
      .populate('sender', 'username displayName profileImage')
      .sort('-createdAt')
      .lean();

    res.json({ success: true, data: messages });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

module.exports = {
  getConversations,
  getConversation,
  sendMessage,
  sendMessageToConversation,
  sendPaidMessage,
  unlockMessage,
  sendImage,
  sendTip,
  deleteMessage,
  markAsRead,
  getMediaMessages,
  searchMessages,
  archiveConversation,
  muteConversation,
  // Added functions
  getConversationMessages,
  editMessage,
  replyToMessage,
  unlockMedia,
  getUnreadCount,
  markAllAsRead,
  pinMessage,
  unpinMessage,
  unarchiveConversation,
  unmuteConversation,
  blockUser,
  unblockUser,
  reportMessage,
  clearConversation,
  getConversationMedia,
  getSharedMedia,
  createOrGetConversation,
  updateTypingStatus,
  getPinnedMessages,
};