import React, { useState, useRef } from 'react';
import './MessageBubble.css';

const MessageBubble = ({
  message,
  isMember = false,
  isCreator = false,
  showAvatar = true,
  avatarUrl = null,
  senderName = 'Unknown',
  onReply,
  onDelete,
  onUnlock,
  onImageClick,
  onLongPress,
  isSelected = false,
  showActions = true,
  showReadReceipt = true
}) => {
  const [isLocked, setIsLocked] = useState(message.isLocked || false);
  const [showActionMenu, setShowActionMenu] = useState(false);
  const longPressTimer = useRef(null);
  const touchStartPos = useRef({ x: 0, y: 0 });

  // Format timestamp
  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
  };

  // Handle long press for selection
  const handleTouchStart = (e) => {
    if (!onLongPress) return;
    
    touchStartPos.current = {
      x: e.touches[0].clientX,
      y: e.touches[0].clientY
    };

    longPressTimer.current = setTimeout(() => {
      onLongPress(message);
      // Haptic feedback on mobile
      if (window.navigator?.vibrate) {
        window.navigator.vibrate(50);
      }
    }, 500);
  };

  const handleTouchMove = (e) => {
    if (!longPressTimer.current) return;

    const moveX = Math.abs(e.touches[0].clientX - touchStartPos.current.x);
    const moveY = Math.abs(e.touches[0].clientY - touchStartPos.current.y);

    // Cancel long press if user moves finger too much
    if (moveX > 10 || moveY > 10) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  };

  const handleTouchEnd = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  };

  // Handle unlock content
  const handleUnlock = async () => {
    if (onUnlock) {
      const success = await onUnlock(message);
      if (success) {
        setIsLocked(false);
      }
    }
  };

  // Handle delete
  const handleDelete = () => {
    if (onDelete && (isMember || message.canDelete)) {
      onDelete(message);
      setShowActionMenu(false);
    }
  };

  // Handle reply
  const handleReply = () => {
    if (onReply) {
      onReply(message);
      setShowActionMenu(false);
    }
  };

  // Render message content based on type
  const renderContent = () => {
    // Text message
    if (message.type === 'text' || !message.type) {
      return (
        <p className="message-text">{message.text}</p>
      );
    }

    // Image message
    if (message.type === 'image') {
      if (isLocked) {
        return (
          <div className="locked-content">
            <img 
              src={message.thumbnail || message.mediaUrl} 
              alt="Locked content"
              className="blur-overlay"
            />
            <div className="unlock-overlay">
              <svg width="32" height="32" fill="currentColor" viewBox="0 0 24 24">
                <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z"/>
              </svg>
              <p>Premium Content</p>
              <button 
                className="unlock-button"
                onClick={handleUnlock}
              >
                Unlock for ${message.price || '2.99'}
              </button>
            </div>
          </div>
        );
      }

      return (
        <div className="message-media">
          <img 
            src={message.mediaUrl} 
            alt="Shared image"
            onClick={() => onImageClick?.(message.mediaUrl)}
            loading="lazy"
          />
        </div>
      );
    }

    // Video message
    if (message.type === 'video') {
      if (isLocked) {
        return (
          <div className="locked-content">
            <video 
              poster={message.thumbnail}
              className="blur-overlay"
            >
              <source src={message.mediaUrl} />
            </video>
            <div className="unlock-overlay">
              <svg width="32" height="32" fill="currentColor" viewBox="0 0 24 24">
                <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z"/>
              </svg>
              <p>Premium Video</p>
              <button 
                className="unlock-button"
                onClick={handleUnlock}
              >
                Unlock for ${message.price || '4.99'}
              </button>
            </div>
          </div>
        );
      }

      return (
        <div className="message-media">
          <video 
            controls 
            poster={message.thumbnail}
            preload="metadata"
          >
            <source src={message.mediaUrl} type="video/mp4" />
            Your browser does not support the video tag.
          </video>
        </div>
      );
    }

    // Voice message
    if (message.type === 'voice') {
      return (
        <div className="voice-message">
          <button className="play-pause-btn">
            <svg width="24" height="24" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z"/>
            </svg>
          </button>
          <div className="voice-waveform">
            {[...Array(20)].map((_, i) => (
              <span 
                key={i} 
                className="waveform-bar"
                style={{ height: `${Math.random() * 20 + 10}px` }}
              />
            ))}
          </div>
          <span className="voice-duration">{message.duration || '0:30'}</span>
        </div>
      );
    }

    // Tip message
    if (message.type === 'tip') {
      return (
        <div className="tip-message">
          <svg width="24" height="24" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1.41 16.09V20h-2.67v-1.93c-1.71-.36-3.16-1.46-3.27-3.4h1.96c.1.81.45 1.61 1.67 1.61 1.16 0 1.6-.64 1.6-1.36 0-.84-.68-1.37-2.18-1.81-1.88-.52-3.24-1.42-3.24-3.27 0-1.57 1.26-2.82 2.97-3.17V5h2.67v1.71c1.63.39 2.75 1.48 2.85 3.11h-1.96c-.12-.74-.51-1.36-1.51-1.36-1.01 0-1.51.54-1.51 1.26 0 .77.68 1.16 2.18 1.63 1.88.54 3.24 1.33 3.24 3.36 0 1.67-1.27 2.99-3.09 3.38z"/>
          </svg>
          <p className="tip-amount">${message.amount}</p>
          {message.text && <p className="tip-note">{message.text}</p>}
        </div>
      );
    }

    return null;
  };

  // Check if message is typing indicator
  if (message.type === 'typing') {
    return (
      <div className={`message-bubble-wrapper typing ${isCreator ? 'creator' : ''}`}>
        <div className="message-bubble">
          <div className="typing-indicator">
            <span></span>
            <span></span>
            <span></span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div 
      className={`
        message-bubble-wrapper 
        ${isMember ? 'member' : ''} 
        ${isCreator ? 'creator' : ''} 
        ${isSelected ? 'selected' : ''}
      `}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onContextMenu={(e) => {
        e.preventDefault();
        setShowActionMenu(!showActionMenu);
      }}
    >
      {/* Avatar */}
      {showAvatar && isCreator && (
        <div className="message-avatar">
          <img 
            src={avatarUrl || '/placeholders/beautifulbrunette2.png'} 
            alt={senderName}
          />
        </div>
      )}

      {/* Message Container */}
      <div className="message-container">
        {/* Reply Context */}
        {message.replyTo && (
          <div className="reply-context">
            <span>{message.replyTo.senderName}</span>
            <p>{message.replyTo.text || 'Media message'}</p>
          </div>
        )}

        {/* Message Bubble */}
        <div className="message-bubble">
          {renderContent()}
        </div>

        {/* Message Meta */}
        <div className="message-meta">
          <span className="message-time">{formatTime(message.timestamp)}</span>
          {showReadReceipt && isMember && (
            <span className="message-status">
              {message.status === 'sent' && '✓'}
              {message.status === 'delivered' && '✓✓'}
              {message.status === 'read' && <span className="read">✓✓</span>}
            </span>
          )}
        </div>

        {/* Action Menu */}
        {showActions && showActionMenu && (
          <div className="message-actions">
            <button onClick={handleReply}>Reply</button>
            {(isMember || message.canDelete) && (
              <button onClick={handleDelete} className="delete-btn">Delete</button>
            )}
            <button onClick={() => setShowActionMenu(false)}>Cancel</button>
          </div>
        )}
      </div>
    </div>
  );
};

export default MessageBubble;