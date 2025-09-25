import React, { useState, useEffect, useCallback } from 'react';
import { AnimatePresence } from 'framer-motion';
import GiftNotification from './GiftNotification';
import './GiftNotificationManager.css';

const GiftNotificationManager = ({
  onViewGift,
  maxNotifications = 3,
  defaultAutoHideDelay = 8000
}) => {
  const [notifications, setNotifications] = useState([]);

  // Add a new gift notification
  const addNotification = useCallback((giftData) => {
    const notification = {
      id: `gift-${giftData.giftId || Date.now()}`,
      type: 'gift',
      giftId: giftData.giftId,
      creatorUsername: giftData.creatorUsername,
      contentTitle: giftData.contentTitle,
      contentType: giftData.contentType,
      contentThumbnail: giftData.contentThumbnail,
      giftValue: giftData.giftValue,
      message: giftData.message,
      timestamp: giftData.timestamp || new Date().toISOString(),
      autoHideDelay: giftData.autoHideDelay || defaultAutoHideDelay,
    };

    setNotifications(prev => {
      // Remove oldest notification if we're at max capacity
      let newNotifications = prev.length >= maxNotifications
        ? prev.slice(1)
        : prev;

      // Add new notification
      return [...newNotifications, notification];
    });
  }, [maxNotifications, defaultAutoHideDelay]);

  // Remove a specific notification
  const removeNotification = useCallback((notificationId) => {
    setNotifications(prev => prev.filter(n => n.id !== notificationId));
  }, []);

  // Clear all notifications
  const clearAllNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  // Handle gift view
  const handleViewGift = useCallback((giftId) => {
    if (onViewGift) {
      onViewGift(giftId);
    }
    // Remove the notification after viewing
    setNotifications(prev => prev.filter(n => n.giftId !== giftId));
  }, [onViewGift]);

  // Listen for gift notifications from WebSocket or other sources
  useEffect(() => {
    const handleGiftNotification = (event) => {
      if (event.detail && event.detail.type === 'gift') {
        addNotification(event.detail.data);
      }
    };

    // Listen for custom events
    window.addEventListener('giftNotification', handleGiftNotification);

    return () => {
      window.removeEventListener('giftNotification', handleGiftNotification);
    };
  }, [addNotification]);

  // Expose manager functions globally for easy access
  useEffect(() => {
    window.giftNotificationManager = {
      addNotification,
      removeNotification,
      clearAllNotifications,
    };

    return () => {
      delete window.giftNotificationManager;
    };
  }, [addNotification, removeNotification, clearAllNotifications]);

  return (
    <div className="GiftNotificationManager">
      <AnimatePresence mode="popLayout">
        {notifications.map((notification, index) => (
          <div
            key={notification.id}
            className="GiftNotificationManager-item"
            style={{
              zIndex: 2000 - index,
              transform: `translateY(${index * 10}px)`,
            }}
          >
            <GiftNotification
              notification={notification}
              isVisible={true}
              onClose={() => removeNotification(notification.id)}
              onViewGift={handleViewGift}
              autoHideDelay={notification.autoHideDelay}
            />
          </div>
        ))}
      </AnimatePresence>
    </div>
  );
};

export default GiftNotificationManager;