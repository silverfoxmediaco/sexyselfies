import React, { memo, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Trash2, MessageCircle, Clock } from 'lucide-react';
import ConnectionAvatar from './ConnectionAvatar';
import './ConnectionCard.css';

/**
 * ConnectionCard - Individual connection card component
 *
 * @param {Object} props
 * @param {Object} props.connection - Connection data object
 * @param {Boolean} props.isSelected - Whether card is selected
 * @param {Function} props.onSelect - Callback for selection change
 * @param {Function} props.onDelete - Callback for delete action
 * @param {Boolean} props.showCheckbox - Whether to show selection checkbox
 */
const ConnectionCard = ({
  connection,
  isSelected = false,
  onSelect,
  onDelete,
  showCheckbox = false
}) => {
  const {
    id,
    avatar,
    name,
    username,
    connectionType = 'C',
    connectionTypeColor = '#8e8e93',
    lastMessage = 'No messages yet',
    messageTime,
    isConnected = true
  } = connection;

  // Handle checkbox change
  const handleCheckboxChange = useCallback((e) => {
    e.stopPropagation();
    onSelect(id, e.target.checked);
  }, [id, onSelect]);

  // Handle delete click
  const handleDeleteClick = useCallback((e) => {
    e.stopPropagation();
    onDelete(connection);
  }, [connection, onDelete]);

  // Handle card click (could navigate to chat)
  const handleCardClick = useCallback(() => {
    // Future: Navigate to chat or connection details
    console.log('Card clicked:', connection);
  }, [connection]);

  // Format message time
  const formatMessageTime = useCallback((timeString) => {
    if (!timeString) return '';

    const messageDate = new Date(timeString);
    const now = new Date();
    const diffInHours = (now - messageDate) / (1000 * 60 * 60);

    if (diffInHours < 1) {
      const diffInMinutes = Math.floor((now - messageDate) / (1000 * 60));
      return diffInMinutes < 1 ? 'Just now' : `${diffInMinutes}m ago`;
    }

    if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h ago`;
    }

    if (diffInHours < 48) {
      return 'Yesterday';
    }

    if (diffInHours < 24 * 7) {
      return `${Math.floor(diffInHours / 24)}d ago`;
    }

    return messageDate.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  }, []);

  // Truncate long messages
  const truncateMessage = useCallback((message, maxLength = 60) => {
    if (!message || message.length <= maxLength) return message;
    return message.substring(0, maxLength).trim() + '...';
  }, []);

  const formattedTime = formatMessageTime(messageTime);
  const truncatedMessage = truncateMessage(lastMessage);

  return (
    <motion.div
      className={`ConnectionCard ${isConnected ? 'connected' : 'disconnected'} ${isSelected ? 'selected' : ''}`}
      onClick={handleCardClick}
      whileTap={{ scale: 0.98 }}
      transition={{ duration: 0.1 }}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleCardClick();
        }
      }}
      aria-label={`Connection with ${name}`}
    >
      {/* Selection checkbox */}
      {showCheckbox && (
        <div className="ConnectionCard-select">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={handleCheckboxChange}
            onClick={(e) => e.stopPropagation()}
            aria-label={`Select ${name}`}
            className="ConnectionCard-checkbox"
          />
        </div>
      )}

      {/* Avatar with badge */}
      <div className="ConnectionCard-avatar-container">
        <ConnectionAvatar
          avatar={avatar}
          name={name}
          connectionType={connectionType}
          connectionTypeColor={connectionTypeColor}
        />
      </div>

      {/* Connection info */}
      <div className="ConnectionCard-info">
        <div className="ConnectionCard-header">
          <div className="ConnectionCard-names">
            <h3 className="ConnectionCard-name">{name}</h3>
            {username && (
              <span className="ConnectionCard-username">@{username}</span>
            )}
          </div>
          <div className="ConnectionCard-actions">
            <button
              className="ConnectionCard-delete-btn"
              onClick={handleDeleteClick}
              title="Delete connection"
              aria-label={`Delete connection with ${name}`}
            >
              <Trash2 size={16} />
            </button>
          </div>
        </div>

        <div className="ConnectionCard-message">
          <div className="ConnectionCard-message-content">
            <MessageCircle size={14} className="ConnectionCard-message-icon" />
            <p className="ConnectionCard-message-text">{truncatedMessage}</p>
          </div>
          {formattedTime && (
            <div className="ConnectionCard-message-time">
              <Clock size={12} />
              <span>{formattedTime}</span>
            </div>
          )}
        </div>
      </div>

      {/* Connection status indicator */}
      <div className={`ConnectionCard-status ${isConnected ? 'connected' : 'disconnected'}`}>
        <div className="ConnectionCard-status-dot"></div>
      </div>
    </motion.div>
  );
};


export default memo(ConnectionCard);