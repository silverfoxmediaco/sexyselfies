import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import socketService from '../services/socket.service';
import messageService from '../services/message.service';
import BottomNavigation from '../components/BottomNavigation';
import CreatorMainHeader from '../components/CreatorMainHeader';
import CreatorMainFooter from '../components/CreatorMainFooter';
import {
  useIsMobile,
  useIsDesktop,
  getUserRole,
} from '../utils/mobileDetection';
import './Messages.css';

const Messages = () => {
  const { conversationId } = useParams();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const isDesktop = useIsDesktop();
  const userRole = getUserRole();
  
  // State management
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [selectedConversations, setSelectedConversations] = useState([]);
  const [messageText, setMessageText] = useState('');
  const [sending, setSending] = useState(false);
  const [showChatView, setShowChatView] = useState(false);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  // Fetch conversations
  const fetchConversations = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await messageService.getConversations();

      // Handle both direct array response and { success, conversations } response
      let convos = Array.isArray(response) ? response : (response.conversations || []);

      // Apply filter
      if (activeFilter === 'unread') {
        convos = convos.filter(c => c.unreadCount > 0);
      } else if (activeFilter === 'online') {
        convos = convos.filter(c => c.otherUser?.isOnline);
      }

      // Sort by last message time
      convos.sort((a, b) => {
        if (a.isPinned && !b.isPinned) return -1;
        if (!a.isPinned && b.isPinned) return 1;
        return new Date(b.lastMessageAt) - new Date(a.lastMessageAt);
      });

      setConversations(convos);
    } catch (error) {
      console.error('Error fetching conversations:', error);
      setConversations([]);
    } finally {
      setIsLoading(false);
    }
  }, [activeFilter]);

  // Fetch messages for selected conversation
  const fetchMessages = useCallback(async (convId) => {
    if (!convId) return;

    setMessagesLoading(true);
    try {
      const messagesData = await messageService.getMessages(convId);

      // Service returns messages array directly (already extracted from response.data.data)
      setMessages(Array.isArray(messagesData) ? messagesData : []);

      // Mark all as read
      await messageService.markAllAsRead(convId);

      // Update unread count in conversations list
      setConversations(prev =>
        prev.map(conv =>
          conv.conversationId === convId || conv.id === convId
            ? { ...conv, unreadCount: 0 }
            : conv
        )
      );
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setMessagesLoading(false);
    }
  }, []);

  // Select a conversation
  const handleConversationClick = useCallback(async (conversation) => {
    setSelectedConversation(conversation);
    setShowChatView(true);
    await fetchMessages(conversation.conversationId);

    // Join Socket.io room for real-time updates
    if (socketService.isConnected()) {
      socketService.joinConversation(conversation.conversationId);
    }
  }, [fetchMessages]);

  // Send message
  const handleSendMessage = async () => {
    if (!messageText.trim() || !selectedConversation || sending) return;

    setSending(true);
    try {
      const convId = selectedConversation.conversationId || selectedConversation.id;
      const sentMessage = await messageService.sendMessage(
        convId,
        messageText.trim()
      );

      // Service returns message directly (already extracted from response.data.data)
      if (sentMessage) {
        setMessages(prev => [...prev, sentMessage]);
        setMessageText('');

        // Update conversation preview
        setConversations(prev => {
          const updated = prev.map(conv => {
            const thisConvId = conv.conversationId || conv.id;
            return thisConvId === convId
              ? {
                  ...conv,
                  lastMessage: sentMessage,
                  lastMessageAt: new Date()
                }
              : conv;
          });
          // Move to top
          return updated.sort((a, b) =>
            new Date(b.lastMessageAt) - new Date(a.lastMessageAt)
          );
        });
      }
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setSending(false);
    }
  };

  // Handle file upload
  const handleFileSelect = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length || !selectedConversation) return;

    setSending(true);
    try {
      const convId = selectedConversation.conversationId || selectedConversation.id;
      const sentMessage = await messageService.sendMessage(
        convId,
        '',
        files
      );

      // Service returns message directly
      if (sentMessage) {
        setMessages(prev => [...prev, sentMessage]);
      }
    } catch (error) {
      console.error('Error sending media:', error);
    } finally {
      setSending(false);
      e.target.value = '';
    }
  };

  // Initialize real-time updates
  useEffect(() => {
    const initializeSocket = () => {
      const token = localStorage.getItem('token');
      if (token && !socketService.isConnected()) {
        socketService.connect(token);
      }

      // Listen for new messages
      socketService.on('new_message', (data) => {
        if (selectedConversation?.conversationId === data.conversationId) {
          setMessages(prev => [...prev, data]);
        }
        // Update conversation list
        fetchConversations();
      });

      // Listen for typing indicators
      socketService.on('user_typing', (data) => {
        // Handle typing indicator
        console.log('User typing:', data);
      });

      // Listen for chat joined confirmation
      socketService.on('chat_joined', (data) => {
        console.log('Joined chat:', data.conversationId);
      });

      // Listen for message sent confirmation
      socketService.on('message_sent', (data) => {
        console.log('Message sent:', data);
      });

      // Listen for messages read
      socketService.on('messages_read', (data) => {
        console.log('Messages read:', data);
      });
    };

    initializeSocket();
    fetchConversations();

    return () => {
      socketService.off('new_message');
      socketService.off('user_typing');
      socketService.off('chat_joined');
      socketService.off('message_sent');
      socketService.off('messages_read');
    };
  }, [fetchConversations, selectedConversation]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Handle search
  const handleSearch = (query) => {
    setSearchQuery(query);
    if (query) {
      const filtered = conversations.filter(conv =>
        conv.otherUser?.username?.toLowerCase().includes(query.toLowerCase()) ||
        conv.otherUser?.displayName?.toLowerCase().includes(query.toLowerCase())
      );
      setConversations(filtered);
    } else {
      fetchConversations();
    }
  };

  // Mark as read
  const markAsRead = async (conversationId, event) => {
    event.stopPropagation();
    try {
      await messageService.markAllAsRead(conversationId);
      setConversations(prev =>
        prev.map(conv =>
          conv.conversationId === conversationId
            ? { ...conv, unreadCount: 0 }
            : conv
        )
      );
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  };

  // Format message preview
  const formatLastMessage = (message) => {
    if (!message) return 'No messages yet';
    
    if (message.messageType === 'tip') {
      return `💰 Sent a $${message.tipAmount} tip`;
    }
    if (message.messageType === 'image') return '📷 Photo';
    if (message.messageType === 'video') return '🎥 Video';
    if (message.isPaid && !message.unlocked) return '🔒 Locked content';
    
    return message.content?.text || message.content || 'Message';
  };

  // Format time
  const formatTime = (date) => {
    if (!date) return '';
    const msgDate = new Date(date);
    const now = new Date();
    const diff = now - msgDate;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (days === 0) {
      const hours = Math.floor(diff / (1000 * 60 * 60));
      if (hours === 0) {
        const mins = Math.floor(diff / (1000 * 60));
        return mins === 0 ? 'Just now' : `${mins}m ago`;
      }
      return `${hours}h ago`;
    }
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days}d ago`;
    return msgDate.toLocaleDateString();
  };

  // Get total unread count
  const getTotalUnread = () => {
    return conversations.reduce((sum, conv) => sum + (conv.unreadCount || 0), 0);
  };

  // Render chat view
  const renderChatView = () => (
    <div className="chat-view">
      {/* Chat Header */}
      <div className="chat-header">
        <button 
          className="back-button"
          onClick={() => {
            setShowChatView(false);
            setSelectedConversation(null);
            setMessages([]);
          }}
        >
          ← Back
        </button>
        <div className="chat-user-info">
          <img 
            src={selectedConversation?.otherUser?.avatar || '/placeholders/beautifulbrunette2.png'} 
            alt={selectedConversation?.otherUser?.username}
          />
          <div>
            <h3>{selectedConversation?.otherUser?.displayName}</h3>
            <span className={selectedConversation?.otherUser?.isOnline ? 'online' : 'offline'}>
              {selectedConversation?.otherUser?.isOnline ? 'Online' : 'Offline'}
            </span>
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div className="messages-area">
        {messagesLoading ? (
          <div className="loading-messages">Loading messages...</div>
        ) : messages.length === 0 ? (
          <div className="no-messages">Start a conversation!</div>
        ) : (
          messages.map(message => {
            // Get current user ID from token or localStorage
            const currentUserId = localStorage.getItem('userId');
            // Check if this message was sent by current user
            const senderId = typeof message.sender === 'object' ? message.sender._id : message.sender;
            const isSent = senderId === currentUserId;

            return (
              <div
                key={message._id}
                className={`message ${isSent ? 'sent' : 'received'}`}
              >
                <div className="message-content">
                  {message.messageType === 'tip' && (
                    <div className="tip-message">
                      💰 ${message.tip?.amount || message.tipAmount}
                    </div>
                  )}
                  {/* Handle both old nested structure (content.text) and new flat structure (content) */}
                  {message.content && (
                    <p>{typeof message.content === 'string' ? message.content : message.content.text}</p>
                  )}
                  {/* Handle both old nested media (content.media) and new top-level media */}
                  {(message.media || message.content?.media)?.map((media, idx) => (
                    <div key={idx} className="media-message">
                      {(media.type === 'image' || media.url?.match(/\.(jpg|jpeg|png|gif|webp)$/i)) && (
                        <img src={media.url} alt="" />
                      )}
                      {(media.type === 'video' || media.url?.match(/\.(mp4|webm|mov)$/i)) && (
                        <video src={media.url} controls />
                      )}
                    </div>
                  ))}
                </div>
                <span className="message-time">{formatTime(message.createdAt)}</span>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className="message-input-container">
        <button 
          className="attach-button"
          onClick={() => fileInputRef.current?.click()}
        >
          📎
        </button>
        <input
          type="text"
          value={messageText}
          onChange={(e) => setMessageText(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
          placeholder="Type a message..."
          disabled={sending}
        />
        <button 
          className="send-button"
          onClick={handleSendMessage}
          disabled={!messageText.trim() || sending}
        >
          {sending ? '⏳' : '➤'}
        </button>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*,video/*"
          onChange={handleFileSelect}
          style={{ display: 'none' }}
        />
      </div>
    </div>
  );

  // Main render
  return (
    <>
      {isDesktop && <CreatorMainHeader />}
      <div className='messages-container'>
        {/* Show chat view on mobile when conversation selected */}
        {isMobile && showChatView && selectedConversation ? (
          renderChatView()
        ) : (
          <>
            {/* Header */}
            <div className='messages-header'>
              <div className='header-top'>
                <h1>Messages</h1>
                {getTotalUnread() > 0 && (
                  <span className='total-unread-badge'>{getTotalUnread()}</span>
                )}
              </div>

              {/* Search Bar */}
              <div className='messages-search'>
                <svg width='20' height='20' viewBox='0 0 20 20' fill='none'>
                  <path
                    d='M9 17A8 8 0 109 1a8 8 0 000 16zm8-8h3m-1 0l-2 2'
                    stroke='currentColor'
                    strokeWidth='2'
                  />
                </svg>
                <input
                  type='text'
                  placeholder='Search conversations...'
                  value={searchQuery}
                  onChange={e => handleSearch(e.target.value)}
                />
              </div>
            </div>

            {/* Filter Tabs */}
            <div className='messages-filters'>
              <button
                className={`filter-btn ${activeFilter === 'all' ? 'active' : ''}`}
                onClick={() => setActiveFilter('all')}
              >
                All
              </button>
              <button
                className={`filter-btn ${activeFilter === 'unread' ? 'active' : ''}`}
                onClick={() => setActiveFilter('unread')}
              >
                Unread {getTotalUnread() > 0 && <span className='filter-badge'>{getTotalUnread()}</span>}
              </button>
              <button
                className={`filter-btn ${activeFilter === 'online' ? 'active' : ''}`}
                onClick={() => setActiveFilter('online')}
              >
                Online Now
              </button>
            </div>

            {/* Conversations List */}
            <div className='conversations-list'>
              {isLoading ? (
                <div className='loading-state'>
                  <div className='loading-spinner'></div>
                  <p>Loading conversations...</p>
                </div>
              ) : conversations.length === 0 ? (
                <div className='empty-state'>
                  <h3>No messages yet</h3>
                  <p>Start a conversation!</p>
                </div>
              ) : (
                conversations.map(conversation => (
                  <div
                    key={conversation.id || conversation.conversationId}
                    className={`conversation-item ${conversation.unreadCount > 0 ? 'unread' : ''}`}
                    onClick={() => handleConversationClick(conversation)}
                  >
                    <div className='conversation-avatar'>
                      <img 
                        src={conversation.otherUser?.avatar || '/placeholders/beautifulbrunette2.png'} 
                        alt={conversation.otherUser?.username} 
                      />
                      {conversation.otherUser?.isOnline && (
                        <span className='online-indicator'></span>
                      )}
                    </div>

                    <div className='conversation-content'>
                      <div className='conversation-header'>
                        <h3>{conversation.otherUser?.displayName || conversation.otherUser?.username}</h3>
                        <span className='conversation-time'>
                          {formatTime(conversation.lastMessageAt)}
                        </span>
                      </div>
                      <div className='conversation-preview'>
                        <p>{formatLastMessage(conversation.lastMessage)}</p>
                      </div>
                    </div>

                    {conversation.unreadCount > 0 && (
                      <div className='conversation-actions'>
                        <div className='unread-badge'>{conversation.unreadCount}</div>
                        <button
                          className='mark-read-btn'
                          onClick={e => markAsRead(conversation.conversationId, e)}
                        >
                          ✓
                        </button>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </>
        )}

        {/* Desktop Chat View */}
        {isDesktop && selectedConversation && renderChatView()}

        {/* Bottom Navigation - Mobile Only */}
        {isMobile && !showChatView && <BottomNavigation userRole={userRole} />}
      </div>
      {isDesktop && <CreatorMainFooter />}
    </>
  );
};

export default Messages;