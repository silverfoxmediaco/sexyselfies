// backend/src/sockets/messaging.socket.js
// WebSocket handlers for real-time messaging

const Message = require('../models/Message');
const CreatorConnection = require('../models/CreatorConnection');
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
     * Join a chat room for a connection
     */
    socket.on('join_chat', async data => {
      try {
        const { connectionId } = data;

        // Verify user has access to this connection
        const connection = await CreatorConnection.findById(connectionId);
        if (!connection) {
          return socket.emit('error', { message: 'CreatorConnection not found' });
        }

        // Check if user is part of this connection
        let hasAccess = false;
        if (
          socket.userRole === 'member' &&
          connection.member.toString() === socket.profile._id.toString()
        ) {
          hasAccess = true;
        } else if (
          socket.userRole === 'creator' &&
          connection.creator.toString() === socket.profile._id.toString()
        ) {
          hasAccess = true;
        }

        if (!hasAccess) {
          return socket.emit('error', {
            message: 'Access denied to this chat',
          });
        }

        // Join chat room
        socket.join(`chat:${connectionId}`);
        socket.currentChat = connectionId;

        console.log(`💬 ${socket.user.email} joined chat: ${connectionId}`);

        // Notify other participants user is online
        socket.to(`chat:${connectionId}`).emit('user_joined_chat', {
          userId: socket.user.id,
          userRole: socket.userRole,
          timestamp: new Date(),
        });

        socket.emit('chat_joined', {
          connectionId,
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
        const { connectionId } = data;

        if (socket.currentChat === connectionId) {
          socket.leave(`chat:${connectionId}`);
          socket.currentChat = null;

          // Notify other participants
          socket.to(`chat:${connectionId}`).emit('user_left_chat', {
            userId: socket.user.id,
            userRole: socket.userRole,
            timestamp: new Date(),
          });

          console.log(`💬 ${socket.user.email} left chat: ${connectionId}`);
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
        const { connectionId, content, replyTo, clientId } = data;

        // Verify connection access
        const connection = await CreatorConnection.findById(connectionId);
        if (!connection || !connection.isConnected) {
          return socket.emit('message_error', {
            clientId,
            error: 'CreatorConnection not found or not active',
          });
        }

        // Create message
        const message = await Message.create({
          connection: connectionId,
          sender: socket.user.id,
          senderModel: socket.userRole === 'member' ? 'Member' : 'Creator',
          content: {
            text: content.text,
            media: content.media || null,
          },
          replyTo: replyTo || null,
          clientId,
        });

        // Populate sender info
        await message.populate([
          { path: 'sender', select: 'email' },
          { path: 'replyTo', select: 'content createdAt' },
        ]);

        // Update connection's last message
        connection.lastMessagePreview = {
          content: content.text,
          createdAt: message.createdAt,
          senderId: socket.user.id,
        };
        connection.lastInteraction = new Date();

        // Update unread counts
        if (socket.userRole === 'member') {
          connection.unreadCount.creator += 1;
        } else {
          connection.unreadCount.member += 1;
        }

        await connection.save();

        // Format message for frontend
        const messageData = {
          id: message._id,
          connectionId,
          content: message.content,
          sender: socket.user.id,
          senderModel: message.senderModel,
          senderName:
            socket.userRole === 'member'
              ? 'Member'
              : socket.profile.displayName,
          timestamp: message.createdAt,
          replyTo: message.replyTo,
          clientId,
          status: 'sent',
        };

        // Send to all users in chat room
        io.to(`chat:${connectionId}`).emit('new_message', messageData);

        // Send delivery confirmation to sender
        socket.emit('message_sent', {
          clientId,
          messageId: message._id,
          timestamp: message.createdAt,
        });

        console.log(
          `💬 Message sent in chat ${connectionId} by ${socket.user.email}`
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
        const { connectionId } = data;

        // Update unread count in connection
        const connection = await CreatorConnection.findById(connectionId);
        if (connection) {
          if (socket.userRole === 'member') {
            connection.unreadCount.member = 0;
          } else {
            connection.unreadCount.creator = 0;
          }
          await connection.save();
        }

        // Mark messages as read
        await Message.updateMany(
          {
            connection: connectionId,
            sender: { $ne: socket.user.id },
            isRead: false,
          },
          {
            isRead: true,
            readAt: new Date(),
          }
        );

        // Notify other participants
        socket.to(`chat:${connectionId}`).emit('messages_read', {
          connectionId,
          readBy: socket.user.id,
          timestamp: new Date(),
        });

        console.log(
          `💬 Messages marked as read in chat ${connectionId} by ${socket.user.email}`
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
        const { messageId, connectionId } = data;

        // Find and verify message ownership
        const message = await Message.findById(messageId);
        if (!message || message.sender.toString() !== socket.user.id) {
          return socket.emit('error', {
            message: 'Cannot delete this message',
          });
        }

        // Soft delete message
        message.isDeleted = true;
        message.deletedAt = new Date();
        await message.save();

        // Notify all users in chat
        io.to(`chat:${connectionId}`).emit('message_deleted', {
          messageId,
          connectionId,
          deletedBy: socket.user.id,
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
        const { connectionId } = data;

        if (socket.currentChat === connectionId) {
          socket.to(`chat:${connectionId}`).emit('user_typing', {
            userId: socket.user.id,
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
        const { connectionId } = data;

        if (socket.currentChat === connectionId) {
          socket.to(`chat:${connectionId}`).emit('user_stopped_typing', {
            userId: socket.user.id,
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
