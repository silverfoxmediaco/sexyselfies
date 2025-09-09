import React, { useState, useEffect, useRef } from 'react';
import ChatInput from '../components/ChatInput';
import MessageBubble from '../components/MessageBubble';
import socketService from '../services/socket.service';
import MainHeader from '../components/MainHeader';
import MainFooter from '../components/MainFooter';
import BottomNavigation from '../components/BottomNavigation';
import { useIsMobile, useIsDesktop, getUserRole } from '../utils/mobileDetection';
import api from '../services/api.config';
import './Chat.css';

const Chat = () => {
  // Get connectionId from URL (e.g., /member/chat/123)
  const connectionId = window.location.pathname.split('/').pop();
  const navigate = (path) => window.location.href = path;
  const isMobile = useIsMobile();
  const isDesktop = useIsDesktop();
  const userRole = getUserRole();
  
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [creator, setCreator] = useState(null);
  const [isTyping, setIsTyping] = useState(false);
  const [showActions, setShowActions] = useState(false);
  const [selectedMessages, setSelectedMessages] = useState([]);
  const [replyTo, setReplyTo] = useState(null);
  const [currentUserId, setCurrentUserId] = useState(null);
  
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  
  useEffect(() => {
    // Get current user ID from localStorage or token
    const userInfo = JSON.parse(localStorage.getItem('userInfo') || '{}');
    setCurrentUserId(userInfo.id || 'member-1');
    
    fetchCreatorInfo();
    fetchMessages();
    markMessagesAsRead();
    initializeRealTimeChat();
    
    return () => {
      cleanupRealTimeChat();
    };
  }, [connectionId]);

  // Initialize real-time chat
  const initializeRealTimeChat = () => {
    try {
      // Connect to Socket.io if not already connected
      const token = localStorage.getItem('token');
      if (token && !socketService.isConnected()) {
        socketService.connect(token);
      }

      // Join chat room
      socketService.socket?.emit('join_chat', { connectionId });

      // Set up real-time event handlers
      setupRealTimeHandlers();
      
      console.log('💬 Real-time chat initialized for connection:', connectionId);
    } catch (error) {
      console.error('Failed to initialize real-time chat:', error);
      // Fall back to polling
      startMessagePolling();
    }
  };

  // Setup real-time event handlers
  const setupRealTimeHandlers = () => {
    if (!socketService.socket) return;

    // Listen for new messages
    socketService.socket.on('new_message', (messageData) => {
      if (messageData.connectionId === connectionId) {
        handleNewRealtimeMessage(messageData);
      }
    });

    // Listen for typing indicators
    socketService.socket.on('user_typing', (data) => {
      setIsTyping(true);
    });

    socketService.socket.on('user_stopped_typing', (data) => {
      setIsTyping(false);
    });

    // Listen for message status updates
    socketService.socket.on('messages_read', (data) => {
      if (data.connectionId === connectionId) {
        updateMessageStatuses('read');
      }
    });

    // Listen for message deletions
    socketService.socket.on('message_deleted', (data) => {
      if (data.connectionId === connectionId) {
        removeMessageFromList(data.messageId);
      }
    });

    // Listen for user status changes
    socketService.socket.on('user_status_changed', (data) => {
      if (creator && creator.id === data.userId) {
        setCreator(prev => ({
          ...prev,
          isOnline: data.status === 'online'
        }));
      }
    });
  };

  // Cleanup real-time chat
  const cleanupRealTimeChat = () => {
    if (socketService.socket) {
      socketService.socket.emit('leave_chat', { connectionId });
      
      // Remove event listeners
      socketService.socket.off('new_message');
      socketService.socket.off('user_typing');
      socketService.socket.off('user_stopped_typing');
      socketService.socket.off('messages_read');
      socketService.socket.off('message_deleted');
      socketService.socket.off('user_status_changed');
    }
  };

  // Fallback to polling if real-time fails
  const startMessagePolling = () => {
    const interval = setInterval(() => {
      checkForNewMessages();
    }, 5000);
    
    // Store interval for cleanup
    typingTimeoutRef.current = interval;
  };
  
  useEffect(() => {
    scrollToBottom();
  }, [messages]);
  
  const fetchCreatorInfo = async () => {
    try {
      const data = await api.get(`/v1/connections/${connectionId}`);
      
      // Extract creator info from connection
      setCreator({
        id: data.data.creator._id,
        name: data.data.creator.displayName,
        username: `@${data.data.creator.username}`,
        avatar: data.data.creator.profileImage || '/placeholders/beautifulbrunette2.png',
        isOnline: data.data.creator.isOnline,
        lastSeen: data.data.creator.lastActive,
        connectionType: data.data.connectionType
      });
    } catch (error) {
      console.error('Error fetching creator info:', error);
      setCreator({
        id: 'unknown',
        name: 'Unknown Creator',
        username: '@unknown',
        avatar: '/placeholders/default-avatar.png',
        isOnline: false,
        lastSeen: new Date(),
        connectionType: 'basic'
      });
    }
  };
  
  const fetchMessages = async () => {
    setIsLoading(true);
    try {
      const data = await api.get(`/v1/connections/${connectionId}/messages`);
      setMessages(data.data.map(msg => ({
          id: msg._id,
          text: msg.content?.text,
          type: msg.content?.media ? (msg.content.media.type || 'image') : 'text',
          mediaUrl: msg.content?.media?.url,
          thumbnail: msg.content?.media?.thumbnail,
          isLocked: msg.content?.media?.isLocked || false,
          price: msg.content?.media?.price,
          senderId: msg.sender,
          senderName: msg.senderModel === 'Member' ? 'You' : creator?.name,
          timestamp: new Date(msg.createdAt),
          status: msg.isRead ? 'read' : 'delivered',
          replyTo: msg.replyTo,
          canDelete: msg.senderModel === 'Member'
        })));
    } catch (error) {
      console.error('Error fetching messages:', error);
      setMessages([]);
    } finally {
      setIsLoading(false);
    }
  };
  
  const markMessagesAsRead = async () => {
    try {
      await api.put(`/v1/connections/${connectionId}/messages/read`);
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  };
  
  const checkForNewMessages = () => {
    // This would be replaced with Socket.io real-time updates
    // For now, just simulate typing indicator occasionally
    if (Math.random() > 0.8) {
      setIsTyping(true);
      setTimeout(() => setIsTyping(false), 3000);
    }
  };

  // Handle new real-time message
  const handleNewRealtimeMessage = (messageData) => {
    const newMessage = {
      id: messageData.id,
      text: messageData.content?.text,
      type: messageData.content?.media ? 'image' : 'text',
      mediaUrl: messageData.content?.media?.url,
      thumbnail: messageData.content?.media?.thumbnail,
      isLocked: messageData.content?.media?.isLocked || false,
      price: messageData.content?.media?.price,
      senderId: messageData.sender,
      senderName: messageData.senderName,
      timestamp: new Date(messageData.timestamp),
      status: 'delivered',
      replyTo: messageData.replyTo,
      canDelete: messageData.senderModel === 'Member'
    };

    setMessages(prev => [...prev, newMessage]);

    // Mark as read after a delay
    setTimeout(() => {
      updateMessageStatuses('read');
      markMessagesAsRead();
    }, 1000);
  };

  // Update message statuses
  const updateMessageStatuses = (status) => {
    setMessages(prev => prev.map(msg => ({ ...msg, status })));
  };

  // Remove message from list
  const removeMessageFromList = (messageId) => {
    setMessages(prev => prev.filter(msg => msg.id !== messageId));
  };
  
  const handleSendMessage = async ({ text, replyTo }) => {
    try {
      // Try to send via Socket.io first (real-time)
      if (socketService.isConnected()) {
        const clientId = Date.now().toString();
        
        // Add optimistic message immediately
        const optimisticMsg = {
          id: clientId,
          text: text,
          type: 'text',
          senderId: currentUserId,
          senderName: 'You',
          timestamp: new Date(),
          status: 'sending',
          replyTo: replyTo ? messages.find(m => m.id === replyTo) : null,
          canDelete: true
        };
        
        setMessages(prev => [...prev, optimisticMsg]);

        // Send via Socket.io
        socketService.socket.emit('send_message', {
          connectionId,
          content: { text, media: null },
          replyTo,
          clientId
        });

        // Listen for confirmation
        socketService.socket.once('message_sent', (data) => {
          if (data.clientId === clientId) {
            setMessages(prev => prev.map(msg => 
              msg.id === clientId 
                ? { ...msg, id: data.messageId, status: 'sent' }
                : msg
            ));
          }
        });

        socketService.socket.once('message_error', (error) => {
          if (error.clientId === clientId) {
            // Remove failed message and fall back to API
            setMessages(prev => prev.filter(msg => msg.id !== clientId));
            fallbackToApiSend({ text, replyTo });
          }
        });

      } else {
        // Fall back to direct API call
        await fallbackToApiSend({ text, replyTo });
      }

    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  };

  // Fallback API send method
  const fallbackToApiSend = async ({ text, replyTo }) => {
    const messageToSend = {
      content: { text: text, media: null },
      replyTo: replyTo
    };
    
    const data = await api.post(`/v1/connections/${connectionId}/messages`, messageToSend);
      
      const newMsg = {
        id: data.data._id || Date.now().toString(),
        text: text,
        type: 'text',
        senderId: currentUserId,
        senderName: 'You',
        timestamp: new Date(),
        status: 'sent',
        replyTo: replyTo ? messages.find(m => m.id === replyTo) : null,
        canDelete: true
      };
      
      setMessages(prev => [...prev, newMsg]);
      
      setTimeout(() => {
        setMessages(prev => prev.map(msg => 
          msg.id === newMsg.id ? { ...msg, status: 'delivered' } : msg
        ));
      }, 1000);
  };
  
  const handleAttachFile = async (file) => {
    console.log('File selected:', file);
    
    // Create FormData for file upload
    const formData = new FormData();
    formData.append('file', file);
    formData.append('connectionId', connectionId);
    
    try {
      // First upload the file using uploadApi from api.config
      const uploadData = await api.post('/v1/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
        
        // Then send message with media
        const messageToSend = {
          content: {
            text: '',
            media: {
              type: file.type.startsWith('image') ? 'image' : 'video',
              url: uploadData.url,
              thumbnail: uploadData.thumbnail
            }
          }
        };
        
        const data = await api.post(`/v1/connections/${connectionId}/messages`, messageToSend);
          
          // Add message to local state
          const newMsg = {
            id: data.data._id || Date.now().toString(),
            type: file.type.startsWith('image') ? 'image' : 'video',
            mediaUrl: uploadData.url,
            thumbnail: uploadData.thumbnail,
            senderId: currentUserId,
            senderName: 'You',
            timestamp: new Date(),
            status: 'sent',
            canDelete: true
          };
          
          setMessages(prev => [...prev, newMsg]);
    } catch (error) {
      console.error('Error uploading file:', error);
    }
  };
  
  const handleUnlock = async (message) => {
    console.log(`Unlocking content for $${message.price}`);
    
    try {
      await api.post(`/v1/connections/messages/${message.id}/unlock`, {
        amount: message.price
      });
        // Update the message to show it's unlocked
      setMessages(prev => prev.map(msg => 
        msg.id === message.id 
          ? { ...msg, isLocked: false }
          : msg
      ));
      return true;
    } catch (error) {
      console.error('Error unlocking content:', error);
    }
    return false;
  };
  
  const handleDelete = async (message) => {
    try {
      await api.delete(`/v1/connections/messages/${message.id}`);
      
      // Remove from local state
      setMessages(prev => prev.filter(msg => msg.id !== message.id));
      setSelectedMessages(prev => prev.filter(id => id !== message.id));
    } catch (error) {
      console.error('Error deleting message:', error);
    }
  };
  
  const handleReply = (message) => {
    setReplyTo({
      id: message.id,
      text: message.text || 'Media message',
      senderName: message.senderName
    });
  };
  
  const handleLongPress = (message) => {
    if (selectedMessages.includes(message.id)) {
      setSelectedMessages(prev => prev.filter(id => id !== message.id));
    } else {
      setSelectedMessages(prev => [...prev, message.id]);
    }
  };
  
  const handleImageClick = (imageUrl) => {
    // Open image in full screen or modal
    console.log('Opening image:', imageUrl);
    // You can implement a full-screen image viewer here
  };
  
  const handleStartTyping = () => {
    // Send typing indicator to server via Socket.io
    if (socketService.isConnected()) {
      socketService.socket.emit('typing_start', { connectionId });
    }
    
    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
  };
  
  const handleStopTyping = () => {
    // Send stop typing to server via Socket.io
    if (socketService.isConnected()) {
      socketService.socket.emit('typing_stop', { connectionId });
    }
  };
  
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };
  
  const formatTime = (date) => {
    const now = new Date();
    const diff = now - date;
    const hours = date.getHours();
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const time = `${hours}:${minutes}`;
    
    if (diff < 86400000) { // Today
      return time;
    } else if (diff < 172800000) { // Yesterday
      return `Yesterday ${time}`;
    } else {
      return date.toLocaleDateString();
    }
  };
  
  const getConnectionTypeColor = (type) => {
    switch(type) {
      case 'premium': return '#FFD700';
      case 'verified': return '#17D2C2';
      case 'basic': return '#8E8E93';
      default: return '#8E8E93';
    }
  };
  
  return (
    <div className="chat-container">
      {/* Desktop Header */}
      {isDesktop && <MainHeader />}
      {/* Header */}
      <div className="chat-header">
        <button 
          className="back-button"
          onClick={() => navigate('/member/messages')}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
            <path d="M15 18l-6-6 6-6"/>
          </svg>
        </button>
        
        <div className="chat-header-info" onClick={() => setShowActions(!showActions)}>
          <div className="creator-avatar">
            <img src={creator?.avatar} alt={creator?.name} />
            {creator?.isOnline && <span className="online-indicator"></span>}
          </div>
          <div className="creator-details">
            <h2>{creator?.name}</h2>
            <span className="status">
              {isTyping ? 'Typing...' : creator?.isOnline ? 'Online' : `Last seen ${formatTime(new Date(creator?.lastSeen))}`}
            </span>
          </div>
          <span 
            className="connection-type-badge"
            style={{backgroundColor: getConnectionTypeColor(creator?.connectionType)}}
          >
            {creator?.connectionType?.[0].toUpperCase()}
          </span>
        </div>
        
        <button 
          className="menu-button"
          onClick={() => setShowActions(!showActions)}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
            <circle cx="12" cy="5" r="2"/>
            <circle cx="12" cy="12" r="2"/>
            <circle cx="12" cy="19" r="2"/>
          </svg>
        </button>
      </div>
      
      {/* Action Menu */}
      {showActions && (
        <div className="chat-actions">
          <button onClick={() => navigate(`/creator/${creator?.id}`)}>
            View Profile
          </button>
          <button onClick={() => console.log('Send tip')}>
            Send Tip 💰
          </button>
          <button onClick={() => console.log('Mute')}>
            Mute Notifications 🔕
          </button>
          <button className="danger" onClick={() => console.log('Block')}>
            Block User 🚫
          </button>
        </div>
      )}
      
      {/* Messages Area */}
      <div className="messages-area">
        {isLoading ? (
          <div className="loading-messages">
            <div className="loading-spinner"></div>
            <p>Loading messages...</p>
          </div>
        ) : messages.length === 0 ? (
          <div className="no-messages">
            <p>No messages yet</p>
            <p>Say hi to start the conversation! 👋</p>
          </div>
        ) : (
          <>
            {messages.map((message) => (
              <MessageBubble
                key={message.id}
                message={message}
                isMember={message.senderId === currentUserId}
                isCreator={message.senderId !== currentUserId}
                showAvatar={message.senderId !== currentUserId}
                avatarUrl={creator?.avatar}
                senderName={message.senderName}
                onReply={handleReply}
                onDelete={handleDelete}
                onUnlock={handleUnlock}
                onImageClick={handleImageClick}
                onLongPress={handleLongPress}
                isSelected={selectedMessages.includes(message.id)}
                showActions={true}
                showReadReceipt={true}
              />
            ))}
            
            {/* Typing Indicator */}
            {isTyping && (
              <MessageBubble
                message={{ type: 'typing' }}
                isCreator={true}
                showAvatar={true}
                avatarUrl={creator?.avatar}
                senderName={creator?.name}
              />
            )}
            
            <div ref={messagesEndRef} />
          </>
        )}
      </div>
      
      {/* Chat Input Component */}
      <ChatInput
        onSendMessage={handleSendMessage}
        onAttachFile={handleAttachFile}
        replyTo={replyTo}
        onCancelReply={() => setReplyTo(null)}
        placeholder="Type a message..."
        showAttachment={true}
        showVoice={true}
        onStartTyping={handleStartTyping}
        onStopTyping={handleStopTyping}
        disabled={isLoading}
      />
      
      {/* Desktop Footer */}
      {isDesktop && <MainFooter />}
      
      {/* Bottom Navigation - Mobile Only */}
      {isMobile && <BottomNavigation userRole={userRole} />}
    </div>
  );
};

export default Chat;