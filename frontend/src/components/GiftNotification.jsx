import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Gift,
  X,
  Eye,
  User,
  DollarSign,
  Bell,
  Heart,
  Sparkles,
  Clock
} from 'lucide-react';
import './GiftNotification.css';

const GiftNotification = ({
  notification,
  isVisible,
  onClose,
  onViewGift,
  autoHideDelay = 8000
}) => {
  const [timeLeft, setTimeLeft] = useState(autoHideDelay / 1000);

  useEffect(() => {
    if (!isVisible) return;

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          onClose();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isVisible, onClose]);

  useEffect(() => {
    setTimeLeft(autoHideDelay / 1000);
  }, [notification, autoHideDelay]);

  const handleViewGift = () => {
    if (onViewGift && notification.giftId) {
      onViewGift(notification.giftId);
    }
    onClose();
  };

  const formatTimeAgo = (timestamp) => {
    const now = new Date();
    const giftTime = new Date(timestamp);
    const diffMs = now - giftTime;
    const diffMins = Math.floor(diffMs / (1000 * 60));

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`;
    return `${Math.floor(diffMins / 1440)}d ago`;
  };

  if (!notification) return null;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          className="GiftNotification-container"
          initial={{ opacity: 0, y: -100, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -100, scale: 0.9 }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
        >
          <div className="GiftNotification-content">
            {/* Header */}
            <div className="GiftNotification-header">
              <div className="GiftNotification-icon">
                <Gift size={20} />
                <div className="icon-sparkle">
                  <Sparkles size={12} />
                </div>
              </div>
              <div className="GiftNotification-title">
                <h4>New Gift Received!</h4>
                <div className="GiftNotification-timestamp">
                  <Clock size={12} />
                  {formatTimeAgo(notification.timestamp)}
                </div>
              </div>
              <button
                className="GiftNotification-close"
                onClick={onClose}
                aria-label="Close notification"
              >
                <X size={16} />
              </button>
            </div>

            {/* Gift Preview */}
            <div className="GiftNotification-preview">
              <div className="GiftNotification-thumbnail">
                {notification.contentThumbnail ? (
                  <img
                    src={notification.contentThumbnail}
                    alt={notification.contentTitle}
                    className="thumbnail-image"
                  />
                ) : (
                  <div className="thumbnail-placeholder">
                    {notification.contentType === 'video' ? '🎥' : '📸'}
                  </div>
                )}
              </div>

              <div className="GiftNotification-details">
                <div className="GiftNotification-creator">
                  <User size={14} />
                  <span>From @{notification.creatorUsername}</span>
                </div>

                <h5 className="GiftNotification-content-title">
                  "{notification.contentTitle}"
                </h5>

                <div className="GiftNotification-value">
                  <DollarSign size={14} />
                  <span>${notification.giftValue} value</span>
                </div>

                {notification.message && (
                  <p className="GiftNotification-message">
                    "{notification.message}"
                  </p>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="GiftNotification-actions">
              <button
                className="GiftNotification-btn secondary"
                onClick={onClose}
              >
                Later
              </button>
              <button
                className="GiftNotification-btn primary"
                onClick={handleViewGift}
              >
                <Eye size={16} />
                Open Gift
              </button>
            </div>

            {/* Progress Bar */}
            <div className="GiftNotification-progress">
              <motion.div
                className="progress-bar"
                initial={{ width: "100%" }}
                animate={{ width: "0%" }}
                transition={{ duration: autoHideDelay / 1000, ease: "linear" }}
              />
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default GiftNotification;