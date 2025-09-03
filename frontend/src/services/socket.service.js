import { io } from 'socket.io-client';

/**
 * Socket Service
 * Handles real-time WebSocket connections for chat, notifications, and live updates
 */
class SocketService {
  constructor() {
    this.socket = null;
    this.connected = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 1000;
    this.eventHandlers = new Map();
    this.rooms = new Set();
    this.messageQueue = [];
    this.typingTimers = new Map();
  }

  // ==========================================
  // CONNECTION MANAGEMENT
  // ==========================================
  
  /**
   * Initialize socket connection
   */
  connect(token = null) {
    if (this.socket?.connected) {
      console.log('[Socket] Already connected');
      return this.socket;
    }

    const socketUrl = import.meta.env.VITE_SOCKET_URL || 'wss://sexyselfies-api.onrender.com';
    const authToken = token || localStorage.getItem('token');
    
    if (!authToken) {
      console.error('[Socket] No auth token available');
      return null;
    }

    this.socket = io(socketUrl, {
      auth: {
        token: authToken
      },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: this.maxReconnectAttempts,
      reconnectionDelay: this.reconnectDelay,
      reconnectionDelayMax: 10000,
      timeout: 20000,
      autoConnect: true,
      query: {
        device_type: this.getDeviceType(),
        platform: navigator.platform,
        user_role: localStorage.getItem('userRole')
      }
    });

    this.setupEventListeners();
    this.setupConnectionHandlers();
    
    return this.socket;
  }

  /**
   * Disconnect socket
   */
  disconnect() {
    if (this.socket) {
      console.log('[Socket] Disconnecting...');
      
      // Leave all rooms
      this.rooms.forEach(room => {
        this.leaveRoom(room);
      });
      
      // Clear event handlers
      this.eventHandlers.clear();
      
      // Disconnect socket
      this.socket.disconnect();
      this.socket = null;
      this.connected = false;
    }
  }

  /**
   * Reconnect socket
   */
  reconnect() {
    this.disconnect();
    setTimeout(() => {
      this.connect();
    }, this.reconnectDelay);
  }

  // ==========================================
  // CONNECTION HANDLERS
  // ==========================================
  
  /**
   * Setup connection event handlers
   */
  setupConnectionHandlers() {
    // Connection established
    this.socket.on('connect', () => {
      console.log('[Socket] Connected:', this.socket.id);
      this.connected = true;
      this.reconnectAttempts = 0;
      
      // Rejoin rooms
      this.rooms.forEach(room => {
        this.socket.emit('join_room', room);
      });
      
      // Process queued messages
      this.processMessageQueue();
      
      // Notify app of connection
      this.emit('connection_status', { connected: true });
    });

    // Connection lost
    this.socket.on('disconnect', (reason) => {
      console.log('[Socket] Disconnected:', reason);
      this.connected = false;
      
      // Notify app of disconnection
      this.emit('connection_status', { connected: false, reason });
      
      // Handle different disconnection reasons
      if (reason === 'io server disconnect') {
        // Server disconnected, try to reconnect
        this.reconnect();
      }
    });

    // Connection error
    this.socket.on('connect_error', (error) => {
      console.error('[Socket] Connection error:', error.message);
      this.reconnectAttempts++;
      
      if (this.reconnectAttempts >= this.maxReconnectAttempts) {
        console.error('[Socket] Max reconnection attempts reached');
        this.emit('connection_failed', { error: error.message });
      }
    });

    // Reconnection attempt
    this.socket.on('reconnect_attempt', (attemptNumber) => {
      console.log('[Socket] Reconnection attempt:', attemptNumber);
      this.emit('reconnecting', { attempt: attemptNumber });
    });

    // Successful reconnection
    this.socket.on('reconnect', (attemptNumber) => {
      console.log('[Socket] Reconnected after', attemptNumber, 'attempts');
      this.emit('reconnected', { attempts: attemptNumber });
    });

    // Server ping
    this.socket.on('ping', () => {
      this.socket.emit('pong');
    });
  }

  // ==========================================
  // EVENT LISTENERS
  // ==========================================
  
  /**
   * Setup socket event listeners
   */
  setupEventListeners() {
    // New message
    this.socket.on('new_message', (data) => {
      this.handleNewMessage(data);
    });

    // Message status updates
    this.socket.on('message_delivered', (data) => {
      this.emit('message_delivered', data);
    });

    this.socket.on('message_read', (data) => {
      this.emit('message_read', data);
    });

    // Typing indicators
    this.socket.on('user_typing', (data) => {
      this.emit('user_typing', data);
    });

    this.socket.on('user_stopped_typing', (data) => {
      this.emit('user_stopped_typing', data);
    });

    // Online status
    this.socket.on('user_online', (data) => {
      this.emit('user_online', data);
    });

    this.socket.on('user_offline', (data) => {
      this.emit('user_offline', data);
    });

    // Notifications
    this.socket.on('notification', (data) => {
      this.handleNotification(data);
    });

    // Match events
    this.socket.on('new_match', (data) => {
      this.handleNewMatch(data);
    });

    // Creator events
    this.socket.on('new_subscriber', (data) => {
      this.emit('new_subscriber', data);
    });

    this.socket.on('new_tip', (data) => {
      this.emit('new_tip', data);
    });

    this.socket.on('content_purchased', (data) => {
      this.emit('content_purchased', data);
    });

    // Member events
    this.socket.on('creator_went_live', (data) => {
      this.emit('creator_went_live', data);
    });

    this.socket.on('new_content_available', (data) => {
      this.emit('new_content_available', data);
    });

    // System events
    this.socket.on('system_announcement', (data) => {
      this.emit('system_announcement', data);
    });

    this.socket.on('maintenance_mode', (data) => {
      this.emit('maintenance_mode', data);
    });

    // Error handling
    this.socket.on('error', (error) => {
      console.error('[Socket] Error:', error);
      this.emit('socket_error', error);
    });
  }

  // ==========================================
  // ROOM MANAGEMENT
  // ==========================================
  
  /**
   * Join a room
   */
  joinRoom(room) {
    if (!this.socket?.connected) {
      console.error('[Socket] Not connected');
      return false;
    }

    console.log('[Socket] Joining room:', room);
    this.socket.emit('join_room', room);
    this.rooms.add(room);
    return true;
  }

  /**
   * Leave a room
   */
  leaveRoom(room) {
    if (!this.socket?.connected) {
      return false;
    }

    console.log('[Socket] Leaving room:', room);
    this.socket.emit('leave_room', room);
    this.rooms.delete(room);
    return true;
  }

  /**
   * Join chat room
   */
  joinChat(chatId) {
    return this.joinRoom(`chat_${chatId}`);
  }

  /**
   * Leave chat room
   */
  leaveChat(chatId) {
    return this.leaveRoom(`chat_${chatId}`);
  }

  // ==========================================
  // MESSAGING
  // ==========================================
  
  /**
   * Send message
   */
  sendMessage(recipientId, message) {
    const messageData = {
      recipient_id: recipientId,
      message: message.text,
      type: message.type || 'text',
      media_url: message.media_url,
      reply_to: message.reply_to,
      timestamp: new Date().toISOString(),
      client_id: this.generateClientId()
    };

    if (!this.connected) {
      // Queue message if not connected
      this.messageQueue.push(messageData);
      return messageData.client_id;
    }

    this.socket.emit('send_message', messageData);
    return messageData.client_id;
  }

  /**
   * Send typing indicator
   */
  sendTyping(recipientId) {
    if (!this.socket?.connected) return;

    // Clear existing timer
    if (this.typingTimers.has(recipientId)) {
      clearTimeout(this.typingTimers.get(recipientId));
    }

    // Send typing event
    this.socket.emit('typing', { recipient_id: recipientId });

    // Auto-stop typing after 3 seconds
    const timer = setTimeout(() => {
      this.sendStoppedTyping(recipientId);
    }, 3000);

    this.typingTimers.set(recipientId, timer);
  }

  /**
   * Send stopped typing indicator
   */
  sendStoppedTyping(recipientId) {
    if (!this.socket?.connected) return;

    // Clear timer
    if (this.typingTimers.has(recipientId)) {
      clearTimeout(this.typingTimers.get(recipientId));
      this.typingTimers.delete(recipientId);
    }

    this.socket.emit('stopped_typing', { recipient_id: recipientId });
  }

  /**
   * Mark message as read
   */
  markMessageRead(messageId, senderId) {
    if (!this.socket?.connected) return;

    this.socket.emit('mark_read', { 
      message_id: messageId,
      sender_id: senderId 
    });
  }

  /**
   * Delete message
   */
  deleteMessage(messageId) {
    if (!this.socket?.connected) return;

    this.socket.emit('delete_message', { message_id: messageId });
  }

  // ==========================================
  // NOTIFICATIONS
  // ==========================================
  
  /**
   * Subscribe to notifications
   */
  subscribeToNotifications() {
    if (!this.socket?.connected) return;

    this.socket.emit('subscribe_notifications');
  }

  /**
   * Unsubscribe from notifications
   */
  unsubscribeFromNotifications() {
    if (!this.socket?.connected) return;

    this.socket.emit('unsubscribe_notifications');
  }

  /**
   * Mark notification as read
   */
  markNotificationRead(notificationId) {
    if (!this.socket?.connected) return;

    this.socket.emit('mark_notification_read', { 
      notification_id: notificationId 
    });
  }

  // ==========================================
  // PRESENCE
  // ==========================================
  
  /**
   * Update online status
   */
  updateOnlineStatus(status) {
    if (!this.socket?.connected) return;

    this.socket.emit('update_status', { 
      status // 'online', 'away', 'busy', 'offline'
    });
  }

  /**
   * Get online users
   */
  getOnlineUsers(userIds) {
    if (!this.socket?.connected) return;

    this.socket.emit('get_online_users', { user_ids: userIds });
  }

  // ==========================================
  // LIVE STREAMING
  // ==========================================
  
  /**
   * Join live stream
   */
  joinLiveStream(streamId) {
    return this.joinRoom(`stream_${streamId}`);
  }

  /**
   * Leave live stream
   */
  leaveLiveStream(streamId) {
    return this.leaveRoom(`stream_${streamId}`);
  }

  /**
   * Send live comment
   */
  sendLiveComment(streamId, comment) {
    if (!this.socket?.connected) return;

    this.socket.emit('live_comment', {
      stream_id: streamId,
      comment
    });
  }

  /**
   * Send live reaction
   */
  sendLiveReaction(streamId, reaction) {
    if (!this.socket?.connected) return;

    this.socket.emit('live_reaction', {
      stream_id: streamId,
      reaction // 'like', 'love', 'fire', etc.
    });
  }

  // ==========================================
  // EVENT HANDLING
  // ==========================================
  
  /**
   * Handle new message
   */
  handleNewMessage(data) {
    // Show notification if app is in background
    if (document.hidden && 'Notification' in window && Notification.permission === 'granted') {
      new Notification(`New message from ${data.sender_name}`, {
        body: data.message,
        icon: data.sender_avatar || '/icons/icon-192x192.png',
        badge: '/icons/badge-72x72.png',
        vibrate: [200, 100, 200],
        tag: `message_${data.message_id}`,
        data: {
          url: `/messages/${data.sender_id}`
        }
      });
    }

    this.emit('new_message', data);
  }

  /**
   * Handle notification
   */
  handleNotification(data) {
    // Show system notification
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(data.title, {
        body: data.body,
        icon: data.icon || '/icons/icon-192x192.png',
        badge: '/icons/badge-72x72.png',
        vibrate: [200],
        tag: `notification_${data.id}`,
        data: {
          url: data.url
        }
      });
    }

    this.emit('notification', data);
  }

  /**
   * Handle new match
   */
  handleNewMatch(data) {
    // Show match notification
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('It\'s a Match! 🎉', {
        body: `You matched with ${data.creator_name}!`,
        icon: data.creator_avatar || '/icons/icon-192x192.png',
        badge: '/icons/badge-72x72.png',
        vibrate: [200, 100, 200, 100, 200],
        tag: `match_${data.match_id}`,
        data: {
          url: `/matches/${data.creator_id}`
        }
      });
    }

    this.emit('new_match', data);
  }

  // ==========================================
  // EVENT EMITTER
  // ==========================================
  
  /**
   * Register event handler
   */
  on(event, handler) {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, new Set());
    }
    this.eventHandlers.get(event).add(handler);
  }

  /**
   * Unregister event handler
   */
  off(event, handler) {
    if (this.eventHandlers.has(event)) {
      this.eventHandlers.get(event).delete(handler);
    }
  }

  /**
   * Emit event to registered handlers
   */
  emit(event, data) {
    if (this.eventHandlers.has(event)) {
      this.eventHandlers.get(event).forEach(handler => {
        try {
          handler(data);
        } catch (error) {
          console.error(`[Socket] Error in event handler for ${event}:`, error);
        }
      });
    }
  }

  // ==========================================
  // UTILITY METHODS
  // ==========================================
  
  /**
   * Process queued messages
   */
  processMessageQueue() {
    if (this.messageQueue.length === 0) return;

    console.log('[Socket] Processing', this.messageQueue.length, 'queued messages');
    
    while (this.messageQueue.length > 0) {
      const message = this.messageQueue.shift();
      this.socket.emit('send_message', message);
    }
  }

  /**
   * Generate client ID for message tracking
   */
  generateClientId() {
    return `${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }

  /**
   * Get device type
   */
  getDeviceType() {
    const userAgent = navigator.userAgent;
    if (/tablet|ipad/i.test(userAgent)) return 'tablet';
    if (/mobile|android|iphone/i.test(userAgent)) return 'mobile';
    return 'desktop';
  }

  /**
   * Check if connected
   */
  isConnected() {
    return this.connected && this.socket?.connected;
  }

  /**
   * Get socket ID
   */
  getSocketId() {
    return this.socket?.id;
  }
}

// Create and export singleton instance
const socketService = new SocketService();
export default socketService;