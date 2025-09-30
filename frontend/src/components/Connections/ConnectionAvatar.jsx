import React, { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import PropTypes from 'prop-types';
import { User } from 'lucide-react';
import './ConnectionAvatar.css';

/**
 * ConnectionAvatar - Avatar component with connection type badge
 *
 * @param {Object} props
 * @param {String} props.avatar - Avatar image URL
 * @param {String} props.name - User's name for alt text
 * @param {String} props.connectionType - Connection type (S, M, C, etc.)
 * @param {String} props.connectionTypeColor - Badge background color
 * @param {String} props.size - Avatar size (small, medium, large)
 * @param {Boolean} props.showBadge - Whether to show the connection type badge
 * @param {Function} props.onClick - Optional click handler
 */
const ConnectionAvatar = ({
  avatar,
  name = 'User',
  connectionType = 'C',
  connectionTypeColor = '#8e8e93',
  size = 'medium',
  showBadge = true,
  onClick
}) => {
  const [imageError, setImageError] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);

  // Handle image load error
  const handleImageError = useCallback(() => {
    setImageError(true);
    setImageLoading(false);
  }, []);

  // Handle image load success
  const handleImageLoad = useCallback(() => {
    setImageLoading(false);
    setImageError(false);
  }, []);

  // Handle avatar click
  const handleClick = useCallback((e) => {
    if (onClick) {
      e.stopPropagation();
      onClick();
    }
  }, [onClick]);

  // Get avatar size class
  const sizeClass = `ConnectionAvatar--${size}`;

  // Get connection type display text
  const getConnectionTypeText = (type) => {
    const types = {
      'S': 'Subscriber',
      'M': 'Member',
      'C': 'Connection',
      'F': 'Fan',
      'P': 'Premium'
    };
    return types[type] || 'Connection';
  };

  return (
    <div
      className={`ConnectionAvatar ${sizeClass} ${onClick ? 'clickable' : ''}`}
      onClick={handleClick}
      role={onClick ? 'button' : 'img'}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleClick(e);
        }
      } : undefined}
      aria-label={onClick ? `View ${name}'s profile` : `${name}'s avatar`}
    >
      {/* Avatar image or fallback */}
      <div className="ConnectionAvatar-image-container">
        {!imageError && avatar ? (
          <>
            {imageLoading && (
              <div className="ConnectionAvatar-skeleton">
                <motion.div
                  className="ConnectionAvatar-skeleton-shimmer"
                  animate={{
                    x: ['-100%', '100%']
                  }}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    ease: 'linear'
                  }}
                />
              </div>
            )}
            <img
              src={avatar}
              alt={`${name}'s avatar`}
              className="ConnectionAvatar-image"
              onError={handleImageError}
              onLoad={handleImageLoad}
              loading="lazy"
              style={{ opacity: imageLoading ? 0 : 1 }}
            />
          </>
        ) : (
          <div className="ConnectionAvatar-fallback">
            <User size={size === 'small' ? 16 : size === 'large' ? 32 : 24} />
          </div>
        )}
      </div>

      {/* Connection type badge */}
      {showBadge && (
        <motion.div
          className="ConnectionAvatar-badge"
          style={{ backgroundColor: connectionTypeColor }}
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, duration: 0.3, ease: 'backOut' }}
          title={getConnectionTypeText(connectionType)}
          aria-label={getConnectionTypeText(connectionType)}
        >
          <span className="ConnectionAvatar-badge-text">{connectionType}</span>
        </motion.div>
      )}

      {/* Online status indicator (optional) */}
      <div className="ConnectionAvatar-status">
        <div className="ConnectionAvatar-status-dot"></div>
      </div>
    </div>
  );
};

ConnectionAvatar.propTypes = {
  avatar: PropTypes.string,
  name: PropTypes.string,
  connectionType: PropTypes.string,
  connectionTypeColor: PropTypes.string,
  size: PropTypes.oneOf(['small', 'medium', 'large']),
  showBadge: PropTypes.bool,
  onClick: PropTypes.func
};

export default React.memo(ConnectionAvatar);