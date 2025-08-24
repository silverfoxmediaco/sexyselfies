import React, { useState, useEffect } from 'react';
import './Messages.css';

const Messages = () => {
  const navigate = (path) => window.location.href = path;
  const [conversations, setConversations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('all'); // all, unread, online
  const [selectedConversations, setSelectedConversations] = useState([]);

  useEffect(() => {
    fetchConversations();
  }, [activeFilter]);

  const fetchConversations = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('token');
      
      // Fetch active connections with messages
      const params = new URLSearchParams({
        status: 'active',
        sort: '-lastInteraction'
      });
      
      const response = await fetch(`/api/v1/connections?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        
        // Transform connections to conversations format
        let convos = data.data.map(conn => ({
          id: conn.id,
          connectionId: conn.id,
          name: conn.connectionData.creatorName,
          username: conn.connectionData.creatorUsername,
          avatar: conn.connectionData.avatar || '/placeholders/beautifulbrunette2.png',
          isOnline: conn.connectionData.isOnline,
          lastMessage: conn.lastMessage,
          lastMessageTime: conn.lastMessageTime,
          unreadCount: conn.unreadCount,
          isPinned: conn.isPinned,
          connectionType: conn.connectionType,
          isTyping: false,
          isMuted: false
        }));
        
        // Apply filter
        if (activeFilter === 'unread') {
          convos = convos.filter(c => c.unreadCount > 0);
        } else if (activeFilter === 'online') {
          convos = convos.filter(c => c.isOnline);
        }
        
        // Sort pinned first, then by last message
        convos.sort((a, b) => {
          if (a.isPinned && !b.isPinned) return -1;
          if (!a.isPinned && b.isPinned) return 1;
          return 0;
        });
        
        setConversations(convos);
      } else {
        // Use mock data as fallback
        setConversations(getMockConversations());
      }
    } catch (error) {
      console.error('Error fetching conversations:', error);
      setConversations(getMockConversations());
    } finally {
      setIsLoading(false);
    }
  };

  const getMockConversations = () => {
    const mock = [
      {
        id: 1,
        connectionId: 1,
        name: 'Luna Rose',
        username: '@lunarose',
        avatar: '/placeholders/beautifulbrunette2.png',
        isOnline: true,
        lastMessage: 'Hey babe! Just uploaded some spicy new content 🔥',
        lastMessageTime: '2 min ago',
        unreadCount: 3,
        isPinned: true,
        connectionType: 'premium',
        isTyping: false,
        isMuted: false
      },
      {
        id: 2,
        connectionId: 2,
        name: 'Sophia Sweet',
        username: '@sophiasweet',
        avatar: '/placeholders/cuteblondeselfie1.png',
        isOnline: true,
        lastMessage: 'Thanks for the tip! You\'re amazing 😘',
        lastMessageTime: '15 min ago',
        unreadCount: 0,
        isPinned: false,
        connectionType: 'verified',
        isTyping: true,
        isMuted: false
      },
      {
        id: 3,
        connectionId: 3,
        name: 'Mia Diamond',
        username: '@miadiamond',
        avatar: '/placeholders/beautifulbrunette4.png',
        isOnline: false,
        lastMessage: 'Good morning! How are you today?',
        lastMessageTime: '2 hours ago',
        unreadCount: 1,
        isPinned: false,
        connectionType: 'basic',
        isTyping: false,
        isMuted: false
      },
      {
        id: 4,
        connectionId: 4,
        name: 'Ashley Fire',
        username: '@ashleyfire',
        avatar: '/placeholders/cuteblondeselfie2.png',
        isOnline: false,
        lastMessage: 'Can\'t wait to chat more later!',
        lastMessageTime: 'Yesterday',
        unreadCount: 0,
        isPinned: false,
        connectionType: 'verified',
        isTyping: false,
        isMuted: true
      }
    ];
    
    if (activeFilter === 'unread') {
      return mock.filter(c => c.unreadCount > 0);
    } else if (activeFilter === 'online') {
      return mock.filter(c => c.isOnline);
    }
    return mock;
  };

  const handleConversationClick = (conversation) => {
    // Navigate to chat with this connection
    navigate(`/member/chat/${conversation.connectionId}`);
  };

  const handleSearch = (query) => {
    setSearchQuery(query);
    // Filter conversations based on search
    if (query) {
      const filtered = conversations.filter(conv => 
        conv.name.toLowerCase().includes(query.toLowerCase()) ||
        conv.username.toLowerCase().includes(query.toLowerCase())
      );
      setConversations(filtered);
    } else {
      fetchConversations();
    }
  };

  const toggleConversationSelection = (id) => {
    setSelectedConversations(prev => 
      prev.includes(id) 
        ? prev.filter(cId => cId !== id)
        : [...prev, id]
    );
  };

  const handleBulkAction = async (action) => {
    // Implement bulk actions (delete, mute, archive)
    console.log(`Bulk ${action} for:`, selectedConversations);
    setSelectedConversations([]);
    fetchConversations();
  };

  const markAsRead = async (conversationId, event) => {
    event.stopPropagation();
    try {
      const token = localStorage.getItem('token');
      await fetch(`/api/v1/connections/${conversationId}/messages/read`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      // Update local state
      setConversations(prev => prev.map(conv => 
        conv.connectionId === conversationId 
          ? { ...conv, unreadCount: 0 }
          : conv
      ));
    } catch (error) {
      console.error('Error marking as read:', error);
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

  const getTotalUnread = () => {
    return conversations.reduce((sum, conv) => sum + conv.unreadCount, 0);
  };

  return (
    <div className="messages-container">
      {/* Header */}
      <div className="messages-header">
        <div className="header-top">
          <h1>Messages</h1>
          {getTotalUnread() > 0 && (
            <span className="total-unread-badge">{getTotalUnread()}</span>
          )}
        </div>
        
        {/* Search Bar */}
        <div className="messages-search">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M9 17A8 8 0 109 1a8 8 0 000 16zm8-8h3m-1 0l-2 2" stroke="currentColor" strokeWidth="2"/>
          </svg>
          <input
            type="text"
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
          />
          {searchQuery && (
            <button 
              className="clear-search"
              onClick={() => handleSearch('')}
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="messages-filters">
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
          Unread
          {getTotalUnread() > 0 && (
            <span className="filter-badge">{getTotalUnread()}</span>
          )}
        </button>
        <button
          className={`filter-btn ${activeFilter === 'online' ? 'active' : ''}`}
          onClick={() => setActiveFilter('online')}
        >
          Online Now
        </button>
      </div>

      {/* Bulk Actions */}
      {selectedConversations.length > 0 && (
        <div className="bulk-actions">
          <span>{selectedConversations.length} selected</span>
          <div className="bulk-buttons">
            <button onClick={() => handleBulkAction('mute')}>
              <svg width="16" height="16" fill="currentColor">
                <path d="M8 2A6 6 0 002 8c0 1.1.3 2.1.8 3l7.2-7.2A6 6 0 008 2zm6 6c0-1.1-.3-2.1-.8-3L6 12.2A6 6 0 0014 8z"/>
              </svg>
              Mute
            </button>
            <button onClick={() => handleBulkAction('archive')}>
              <svg width="16" height="16" fill="currentColor">
                <path d="M2 4h12v10H2V4zm2 2v6h8V6H4z"/>
              </svg>
              Archive
            </button>
            <button onClick={() => handleBulkAction('delete')} className="delete-btn">
              <svg width="16" height="16" fill="currentColor">
                <path d="M5 2v2H2v2h12V4h-3V2H5zm1 4v6h1V6H6zm3 0v6h1V6H9zm3 0v6h1V6h-1z"/>
              </svg>
              Delete
            </button>
            <button onClick={() => setSelectedConversations([])} className="cancel-btn">
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Conversations List */}
      <div className="conversations-list">
        {isLoading ? (
          <div className="loading-state">
            <div className="loading-spinner"></div>
            <p>Loading conversations...</p>
          </div>
        ) : conversations.length === 0 ? (
          <div className="empty-state">
            <svg width="80" height="80" viewBox="0 0 80 80" fill="none">
              <circle cx="40" cy="40" r="30" stroke="currentColor" strokeWidth="2" opacity="0.2"/>
              <path d="M25 35h30M25 45h20" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            <h3>No messages yet</h3>
            <p>Connect with creators to start chatting!</p>
            <button 
              className="explore-btn"
              onClick={() => navigate('/member/connections')}
            >
              View Connections
            </button>
          </div>
        ) : (
          conversations.map(conversation => (
            <div 
              key={conversation.id}
              className={`conversation-item ${conversation.unreadCount > 0 ? 'unread' : ''}`}
              onClick={() => handleConversationClick(conversation)}
            >
              {/* Selection Checkbox */}
              <div className="conversation-select">
                <input
                  type="checkbox"
                  checked={selectedConversations.includes(conversation.id)}
                  onChange={(e) => {
                    e.stopPropagation();
                    toggleConversationSelection(conversation.id);
                  }}
                  onClick={(e) => e.stopPropagation()}
                />
              </div>

              {/* Avatar */}
              <div className="conversation-avatar">
                <img src={conversation.avatar} alt={conversation.name} />
                {conversation.isOnline && <span className="online-indicator"></span>}
                <span 
                  className="connection-badge"
                  style={{backgroundColor: getConnectionTypeColor(conversation.connectionType)}}
                >
                  {conversation.connectionType[0].toUpperCase()}
                </span>
              </div>

              {/* Content */}
              <div className="conversation-content">
                <div className="conversation-header">
                  <div className="conversation-name-wrapper">
                    <h3>{conversation.name}</h3>
                    {conversation.isPinned && (
                      <svg className="pinned-icon" width="14" height="14" fill="#FFD700">
                        <path d="M7 1L5.5 5.5 1 7l4.5 1.5L7 13l1.5-4.5L13 7l-4.5-1.5L7 1z"/>
                      </svg>
                    )}
                    {conversation.isMuted && (
                      <svg className="muted-icon" width="14" height="14" fill="#8E8E93">
                        <path d="M7 1A6 6 0 001 7c0 1.1.3 2.1.8 3l7.2-7.2A6 6 0 007 1zm6 6c0-1.1-.3-2.1-.8-3L5 11.2A6 6 0 0013 7z"/>
                      </svg>
                    )}
                  </div>
                  <span className="conversation-time">{conversation.lastMessageTime}</span>
                </div>
                
                <div className="conversation-preview">
                  {conversation.isTyping ? (
                    <div className="typing-indicator">
                      <span></span>
                      <span></span>
                      <span></span>
                    </div>
                  ) : (
                    <p>{conversation.lastMessage}</p>
                  )}
                </div>
              </div>

              {/* Unread Badge & Actions */}
              <div className="conversation-actions">
                {conversation.unreadCount > 0 && (
                  <div className="unread-badge">
                    {conversation.unreadCount > 99 ? '99+' : conversation.unreadCount}
                  </div>
                )}
                {conversation.unreadCount > 0 && (
                  <button 
                    className="mark-read-btn"
                    onClick={(e) => markAsRead(conversation.connectionId, e)}
                    title="Mark as read"
                  >
                    <svg width="16" height="16" fill="currentColor">
                      <path d="M6 10.8L3.4 8.2 2 9.6 6 13.6 14 5.6 12.6 4.2z"/>
                    </svg>
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Floating New Message Button */}
      <button 
        className="new-message-fab"
        onClick={() => navigate('/member/connections')}
        title="New conversation"
      >
        <svg width="24" height="24" fill="currentColor">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm5 11h-4v4h-2v-4H7v-2h4V7h2v4h4v2z"/>
        </svg>
      </button>
    </div>
  );
};

export default Messages;