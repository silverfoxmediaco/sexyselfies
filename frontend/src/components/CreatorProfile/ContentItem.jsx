import React from 'react';
import { Heart, Video, Camera, Lock, CheckCircle } from 'lucide-react';
import './ContentItem.css';

const ContentItem = ({ content, onClick, isPurchased = false }) => {
  const getTimeAgo = (timestamp) => {
    if (!timestamp || timestamp === 'Invalid Date' || isNaN(new Date(timestamp))) {
      return 'recently';
    }
    const minutes = Math.floor((Date.now() - new Date(timestamp)) / 60000);
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  const handleClick = () => {
    if (onClick) {
      onClick(content);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleClick();
    }
  };

  return (
    <div
      className="ContentItem-container"
      tabIndex={0}
      onClick={handleClick}
      onKeyPress={handleKeyPress}
      role="button"
      aria-label={`View ${content.title || 'content'}`}
    >
      <div className="ContentItem-thumbnail">
        {content.thumbnail || content.image ? (
          <img
            src={content.thumbnail || content.image}
            alt={content.title || content.alt || 'Content'}
            className={content.isBlurred ? 'blurred' : ''}
            loading="lazy"
          />
        ) : (
          <div className="ContentItem-placeholder">
            <Camera size={24} />
          </div>
        )}

        {/* Content Type Indicator */}
        {content.type === 'video' && (
          <div className="ContentItem-type-indicator">
            <Video size={14} />
            <span>{content.duration || '0:30'}</span>
          </div>
        )}

        {/* Free Badge */}
        {!content.isLocked && !content.price && (
          <div className="ContentItem-free-badge">FREE</div>
        )}

        {/* Purchased Badge */}
        {isPurchased && (
          <div className="ContentItem-purchased-badge">
            <CheckCircle size={16} />
          </div>
        )}

        {/* Lock Overlay for Paid Content */}
        {content.isLocked && !isPurchased && (
          <div className="ContentItem-lock-overlay">
            <Lock size={20} />
            <span className="ContentItem-price">
              ${content.price || '2.99'}
            </span>
          </div>
        )}
      </div>

      <div className="ContentItem-info">
        <span className="ContentItem-likes">
          <Heart
            size={12}
            fill={content.isLiked ? 'currentColor' : 'none'}
          />
          <span>{content.likes || 0}</span>
        </span>
        <span className="ContentItem-date">
          {getTimeAgo(content.date || content.createdAt)}
        </span>
      </div>
    </div>
  );
};

export default ContentItem;