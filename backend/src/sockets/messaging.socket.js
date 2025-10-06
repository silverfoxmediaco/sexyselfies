// backend/src/sockets/messaging.socket.js
// WebSocket handlers for real-time messaging

const Message = require('../models/Message');
const Conversation = require('../models/Conversation');
const Member = require('../models/Member');
const Creator = require('../models/Creator');
const { protect } = require('../middleware/auth.middleware');

/**
 * Initialize messaging socket handlers
 */
exports.initializeMessagingSockets = io => {
  console.log('💬 Initializing messaging sockets...');

  // Authentication middleware for sockets
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) {
        return next(new Error('Authentication token required'));
      }

      // Verify JWT token (similar to protect middleware)
      const jwt = require('jsonwebtoken');
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Get user info
      const User = require('../models/User');
      const user = await User.findById(decoded.id);

      if (!user) {
        return next(new Error('User not found'));
      }

      // Attach user to socket
      socket.user = user;
      socket.userRole = user.role;

      // Get profile based on role
      if (user.role === 'member') {
        socket.profile = await Member.findOne({ user: user._id });
      } else if (user.role === 'creator') {
        socket.profile = await Creator.findOne({ user: user._id });
      }

      next();
    } catch (error) {
      console.error('Socket auth error:', error);
      next(new Error('Authentication failed'));
    }
  });

  // Main connection handler
  io.on('connection', socket => {
    console.log(`💬 User ${socket.user.email} connected (${socket.userRole})`);

    // Join user-specific room
    socket.join(`user:${socket.user.id}`);

    // ============================================
    // CHAT ROOM MANAGEMENT
    // ============================================

    /**
     * Join a chat room for a conversation
     */
    socket.on('join_chat', async data => {
      try {
        const { conversationId } = data;

        // Verify user has access to this conversation
        const conversation = await Conversation.findById(conversationId);
        if (!conversation) {
          return socket.emit('error', { message: 'Conversation not found' });
        }

        // Check if user is a participant in this conversation
        const isParticipant = conversation.participants.some(
          p => p.user.toString() === socket.user._id.toString()
        );

        if (!isParticipant) {
          return socket.emit('error', {
            message: 'Access denied to this chat',
          });
        }

        // Join chat room
        socket.join(`chat:${conversationId}`);
        socket.currentChat = conversationId;

        console.log(`💬 ${socket.user.email} joined chat: ${conversationId}`);

        // Notify other participants user is online
        socket.to(`chat:${conversationId}`).emit('user_joined_chat', {
          userId: socket.user.id,
          userRole: socket.userRole,
          timestamp: new Date(),
        });

        socket.emit('chat_joined', {
          conversationId,
          success: true,
        });
      } catch (error) {
        console.error('Join chat error:', error);
        socket.emit('error', { message: 'Failed to join chat' });
      }
    });

    /**
     * Leave a chat room
     */
    socket.on('leave_chat', data => {
      try {
        const { conversationId } = data;

        if (socket.currentChat === conversationId) {
          socket.leave(`chat:${conversationId}`);
          socket.currentChat = null;

          // Notify other participants
          socket.to(`chat:${conversationId}`).emit('user_left_chat', {
            userId: socket.user.id,
            userRole: socket.userRole,
            timestamp: new Date(),
          });

          console.log(`💬 ${socket.user.email} left chat: ${conversationId}`);
        }
      } catch (error) {
        console.error('Leave chat error:', error);
      }
    });

    // ============================================
    // MESSAGE HANDLING
    // ============================================

    /**
     * Send a message
     */
    socket.on('send_message', async data => {
      try {
        const { conversationId, content, replyTo, clientId } = data;

        // Verify conversation access
        const conversation = await Conversation.findById(conversationId);
        if (!conversation) {
          return socket.emit('message_error', {
            clientId,
            error: 'Conversation not found',
          });
        }

        // Verify user is a participant
        const senderParticipant = conversation.participants.find(
          p => p.user.toString() === socket.user._id.toString()
        );

        if (!senderParticipant) {
          return socket.emit('message_error', {
            clientId,
            error: 'You are not a participant in this conversation',
          });
        }

        // Find recipient
        const recipientParticipant = conversation.participants.find(
          p => p.user.toString() !== socket.user._id.toString()
        );

        // Create message
        const message = await Message.create({
          conversation: conversationId,
          sender: socket.user._id,
          senderModel: senderParticipant.userModel,
          recipient: recipientParticipant.user,
          recipientModel: recipientParticipant.userModel,
          content: typeof content === 'string' ? content : content.text,
          messageType: 'text',
          replyTo: replyTo || null,
          read: false,
        });

        // Populate sender info
        await message.populate('sender', 'username displayName profileImage');

        // Update conversation metadata
        conversation.lastMessage = message._id;
        conversation.lastMessageAt = new Date();
        conversation.metadata.totalMessages += 1;
        conversation.unreadCount[recipientParticipant.role] += 1;
        await conversation.save();

        // Format message for frontend
        const messageData = {
          _id: message._id,
          conversationId,
          content: message.content,
          sender: {
            _id: socket.user._id,
            username: socket.user.username,
            displayName: socket.profile?.displayName || socket.user.username,
            profileImage: socket.profile?.profileImage,
          },
          senderModel: message.senderModel,
          recipient: recipientParticipant.user,
          recipientModel: message.recipientModel,
          messageType: message.messageType,
          read: false,
          createdAt: message.createdAt,
          replyTo: message.replyTo,
          clientId,
        };

        // Send to all users in chat room
        io.to(`chat:${conversationId}`).emit('new_message', messageData);

        // Send delivery confirmation to sender
        socket.emit('message_sent', {
          clientId,
          messageId: message._id,
          timestamp: message.createdAt,
        });

        console.log(
          `💬 Message sent in conversation ${conversationId} by ${socket.user.email}`
        );
      } catch (error) {
        console.error('Send message error:', error);
        socket.emit('message_error', {
          clientId: data.clientId,
          error: 'Failed to send message',
        });
      }
    });

    /**
     * Mark messages as read
     */
    socket.on('mark_messages_read', async data => {
      try {
        const { conversationId } = data;

        // Update unread count in conversation
        const conversation = await Conversation.findById(conversationId);
        if (conversation) {
          const userRole = socket.userRole === 'member' ? 'member' : 'creator';
          conversation.unreadCount[userRole] = 0;
          await conversation.save();
        }

        // Mark messages as read
        await Message.updateMany(
          {
            conversation: conversationId,
            recipient: socket.user._id,
            read: false,
          },
          {
            read: true,
            readAt: new Date(),
          }
        );

        // Notify other participants
        socket.to(`chat:${conversationId}`).emit('messages_read', {
          conversationId,
          readBy: socket.user._id,
          timestamp: new Date(),
        });

        console.log(
          `💬 Messages marked as read in conversation ${conversationId} by ${socket.user.email}`
        );
      } catch (error) {
        console.error('Mark read error:', error);
      }
    });

    /**
     * Delete a message
     */
    socket.on('delete_message', async data => {
      try {
        const { messageId, conversationId } = data;

        // Find and verify message ownership
        const message = await Message.findById(messageId);
        if (!message || message.sender.toString() !== socket.user._id.toString()) {
          return socket.emit('error', {
            message: 'Cannot delete this message',
          });
        }

        // Soft delete message
        message.isDeleted = true;
        message.deletedAt = new Date();
        await message.save();

        // Notify all users in chat
        io.to(`chat:${conversationId}`).emit('message_deleted', {
          messageId,
          conversationId,
          deletedBy: socket.user._id,
          timestamp: new Date(),
        });

        console.log(`💬 Message ${messageId} deleted by ${socket.user.email}`);
      } catch (error) {
        console.error('Delete message error:', error);
        socket.emit('error', { message: 'Failed to delete message' });
      }
    });

    // ============================================
    // TYPING INDICATORS
    // ============================================

    /**
     * User started typing
     */
    socket.on('typing_start', data => {
      try {
        const { conversationId } = data;

        if (socket.currentChat === conversationId) {
          socket.to(`chat:${conversationId}`).emit('user_typing', {
            userId: socket.user._id,
            userRole: socket.userRole,
            timestamp: new Date(),
          });
        }
      } catch (error) {
        console.error('Typing start error:', error);
      }
    });

    /**
     * User stopped typing
     */
    socket.on('typing_stop', data => {
      try {
        const { conversationId } = data;

        if (socket.currentChat === conversationId) {
          socket.to(`chat:${conversationId}`).emit('user_stopped_typing', {
            userId: socket.user._id,
            userRole: socket.userRole,
            timestamp: new Date(),
          });
        }
      } catch (error) {
        console.error('Typing stop error:', error);
      }
    });

    // ============================================
    // ONLINE PRESENCE
    // ============================================

    /**
     * Update online status
     */
    socket.on('update_presence', async data => {
      try {
        const { status } = data; // online, away, busy

        // Update user's online status in database
        if (socket.userRole === 'member') {
          await Member.findByIdAndUpdate(socket.profile._id, {
            isOnline: status === 'online',
            lastActive: new Date(),
          });
        } else if (socket.userRole === 'creator') {
          await Creator.findByIdAndUpdate(socket.profile._id, {
            isOnline: status === 'online',
            lastActive: new Date(),
          });
        }

        // Broadcast status to relevant users
        socket.broadcast.emit('user_status_changed', {
          userId: socket.user.id,
          userRole: socket.userRole,
          status,
          timestamp: new Date(),
        });
      } catch (error) {
        console.error('Presence update error:', error);
      }
    });

    // ============================================
    // DISCONNECT HANDLING
    // ============================================

    socket.on('disconnect', async () => {
      console.log(`💬 User ${socket.user.email} disconnected`);

      try {
        // Update offline status
        if (socket.userRole === 'member') {
          await Member.findByIdAndUpdate(socket.profile._id, {
            isOnline: false,
            lastActive: new Date(),
          });
        } else if (socket.userRole === 'creator') {
          await Creator.findByIdAndUpdate(socket.profile._id, {
            isOnline: false,
            lastActive: new Date(),
          });
        }

        // Notify chat rooms user left
        if (socket.currentChat) {
          socket.to(`chat:${socket.currentChat}`).emit('user_left_chat', {
            userId: socket.user.id,
            userRole: socket.userRole,
            timestamp: new Date(),
          });
        }

        // Broadcast offline status
        socket.broadcast.emit('user_status_changed', {
          userId: socket.user.id,
          userRole: socket.userRole,
          status: 'offline',
          timestamp: new Date(),
        });
      } catch (error) {
        console.error('Disconnect error:', error);
      }
    });

    // ============================================
    // ERROR HANDLING
    // ============================================

    socket.on('error', error => {
      console.error('Socket error:', error);
      socket.emit('error', { message: 'Socket error occurred' });
    });
  });

  console.log('✅ Messaging WebSocket handlers initialized');
};

module.exports = exports;
