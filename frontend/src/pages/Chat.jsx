import React, { useState, useEffect, useRef } from 'react';
import ChatInput from '../components/ChatInput';
import MessageBubble from '../components/MessageBubble';
import './Chat.css';

const Chat = () => {
  // Get connectionId from URL (e.g., /member/chat/123)
  const connectionId = window.location.pathname.split('/').pop();
  const navigate = (path) => window.location.href = path;
  
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
    
    // Simulate receiving messages (replace with Socket.io)
    const interval = setInterval(() => {
      checkForNewMessages();
    }, 5000);
    
    return () => clearInterval(interval);
  }, [connectionId]);
  
  useEffect(() => {
    scrollToBottom();
  }, [messages]);
  
  const fetchCreatorInfo = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/v1/connections/${connectionId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
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
      } else {
        // Use mock data
        setCreator(getMockCreator());
      }
    } catch (error) {
      console.error('Error fetching creator info:', error);
      setCreator(getMockCreator());
    }
  };
  
  const getMockCreator = () => ({
    id: 'creator-1',
    name: 'Luna Rose',
    username: '@lunarose',
    avatar: '/placeholders/beautifulbrunette2.png',
    isOnline: true,
    lastSeen: new Date(),
    connectionType: 'premium'
  });
  
  const fetchMessages = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/v1/connections/${connectionId}/messages`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
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
      } else {
        // Use mock data
        setMessages(getMockMessages());
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
      setMessages(getMockMessages());
    } finally {
      setIsLoading(false);
    }
  };
  
  const getMockMessages = () => [
    {
      id: '1',
      text: 'Hey there! Thanks for connecting with me 😊',
      type: 'text',
      senderId: 'creator-1',
      senderName: 'Luna Rose',
      timestamp: new Date(Date.now() - 3600000),
      status: 'read',
      canDelete: false
    },
    {
      id: '2',
      text: 'Hi Luna! Love your content!',
      type: 'text',
      senderId: 'member-1',
      senderName: 'You',
      timestamp: new Date(Date.now() - 3500000),
      status: 'read',
      canDelete: true
    },
    {
      id: '3',
      text: 'Thank you so much! I just posted some new photos you might like 📸',
      type: 'text',
      senderId: 'creator-1',
      senderName: 'Luna Rose',
      timestamp: new Date(Date.now() - 3400000),
      status: 'read',
      canDelete: false
    },
    {
      id: '4',
      text: 'Check out this exclusive content just for you 💕',
      type: 'image',
      mediaUrl: '/placeholders/beautifulbrunette2.png',
      thumbnail: '/placeholders/beautifulbrunette2.png',
      isLocked: true,
      price: 9.99,
      senderId: 'creator-1',
      senderName: 'Luna Rose',
      timestamp: new Date(Date.now() - 3300000),
      status: 'read',
      canDelete: false
    },
    {
      id: '5',
      text: 'Wow, that looks amazing!',
      type: 'text',
      senderId: 'member-1',
      senderName: 'You',
      timestamp: new Date(Date.now() - 3200000),
      status: 'delivered',
      canDelete: true
    }
  ];
  
  const markMessagesAsRead = async () => {
    try {
      const token = localStorage.getItem('token');
      await fetch(`/api/v1/connections/${connectionId}/messages/read`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
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
  
  const handleSendMessage = async ({ text, replyTo }) => {
    const messageToSend = {
      content: {
        text: text,
        media: null
      },
      replyTo: replyTo
    };
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/v1/connections/${connectionId}/messages`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(messageToSend)
      });
      
      if (response.ok) {
        const data = await response.json();
        
        // Add message to local state
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
        
        // Update status to delivered after a short delay
        setTimeout(() => {
          setMessages(prev => prev.map(msg => 
            msg.id === newMsg.id ? { ...msg, status: 'delivered' } : msg
          ));
        }, 1000);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      throw error; // Let ChatInput handle the error
    }
  };
  
  const handleAttachFile = async (file) => {
    console.log('File selected:', file);
    
    // Create FormData for file upload
    const formData = new FormData();
    formData.append('file', file);
    formData.append('connectionId', connectionId);
    
    try {
      const token = localStorage.getItem('token');
      
      // First upload the file
      const uploadResponse = await fetch('/api/v1/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });
      
      if (uploadResponse.ok) {
        const uploadData = await uploadResponse.json();
        
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
        
        const response = await fetch(`/api/v1/connections/${connectionId}/messages`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(messageToSend)
        });
        
        if (response.ok) {
          const data = await response.json();
          
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
        }
      }
    } catch (error) {
      console.error('Error uploading file:', error);
    }
  };
  
  const handleUnlock = async (message) => {
    console.log(`Unlocking content for $${message.price}`);
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/v1/connections/messages/${message.id}/unlock`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          amount: message.price
        })
      });
      
      if (response.ok) {
        // Update the message to show it's unlocked
        setMessages(prev => prev.map(msg => 
          msg.id === message.id 
            ? { ...msg, isLocked: false }
            : msg
        ));
        return true;
      }
    } catch (error) {
      console.error('Error unlocking content:', error);
    }
    return false;
  };
  
  const handleDelete = async (message) => {
    try {
      const token = localStorage.getItem('token');
      await fetch(`/api/v1/connections/messages/${message.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
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
    console.log('User started typing');
    
    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
  };
  
  const handleStopTyping = () => {
    // Send stop typing to server via Socket.io
    console.log('User stopped typing');
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
    </div>
  );
};

export default Chat;