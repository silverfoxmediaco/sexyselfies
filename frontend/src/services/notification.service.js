import api from './api.config';

/**
 * Notification Service
 * Handles all notification-related API calls
 */
const notificationService = {
  /**
   * Get notifications with optional filtering
   * @param {Object} options - Query options
   * @param {string} options.filter - Filter type: 'all', 'unread', 'connection', 'earnings'
   * @param {number} options.page - Page number (default: 1)
   * @param {number} options.limit - Results per page (default: 20)
   * @param {string} options.type - Specific notification type
   * @param {boolean} options.unreadOnly - Only unread notifications
   * @returns {Promise<Object>} API response with notifications and pagination
   */
  getNotifications: async (options = {}) => {
    try {
      const {
        filter = 'all',
        page = 1,
        limit = 20,
        type = null,
        unreadOnly = false
      } = options;

      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        unreadOnly: unreadOnly.toString()
      });

      // Handle filter mapping
      if (filter === 'unread') {
        queryParams.set('unreadOnly', 'true');
      } else if (filter === 'connections') {
        queryParams.set('type', 'connection');
      } else if (filter === 'earnings') {
        // For earnings, we want both tips and purchases
        // Backend should handle this filter type
        queryParams.set('filter', 'earnings');
      } else if (filter === 'messages') {
        queryParams.set('type', 'message');
      }

      if (type) {
        queryParams.set('type', type);
      }

      const response = await api.get(`/notifications?${queryParams.toString()}`);
      return response;
    } catch (error) {
      console.error('Error fetching notifications:', error);
      throw error;
    }
  },

  /**
   * Mark a specific notification as read
   * @param {string} notificationId - The notification ID
   * @returns {Promise<Object>} API response
   */
  markAsRead: async (notificationId) => {
    try {
      const response = await api.patch(`/notifications/${notificationId}/read`);
      return response;
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw error;
    }
  },

  /**
   * Mark all notifications as read for the current user
   * @returns {Promise<Object>} API response with count of updated notifications
   */
  markAllAsRead: async () => {
    try {
      const response = await api.patch('/notifications/mark-all-read');
      return response;
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      throw error;
    }
  },

  /**
   * Delete a specific notification
   * @param {string} notificationId - The notification ID
   * @returns {Promise<Object>} API response
   */
  deleteNotification: async (notificationId) => {
    try {
      const response = await api.delete(`/notifications/${notificationId}`);
      return response;
    } catch (error) {
      console.error('Error deleting notification:', error);
      throw error;
    }
  },

  /**
   * Get unread notification count for the current user
   * @returns {Promise<Object>} API response with unread count
   */
  getUnreadCount: async () => {
    try {
      const response = await api.get('/notifications/unread/count');
      return response;
    } catch (error) {
      console.error('Error getting unread count:', error);
      throw error;
    }
  },

  /**
   * Create a new notification (typically for system use)
   * @param {Object} notificationData - Notification data
   * @param {string} notificationData.recipientId - Recipient user ID
   * @param {string} notificationData.recipientRole - Recipient role (creator/member)
   * @param {string} notificationData.type - Notification type
   * @param {string} notificationData.title - Notification title
   * @param {string} notificationData.message - Notification message
   * @param {Object} notificationData.from - Sender information
   * @param {number} notificationData.amount - Amount (for tips/purchases)
   * @param {string} notificationData.relatedContentId - Related content ID
   * @param {string} notificationData.actionUrl - Action URL
   * @param {Object} notificationData.metadata - Additional metadata
   * @returns {Promise<Object>} API response with created notification
   */
  createNotification: async (notificationData) => {
    try {
      const response = await api.post('/notifications', notificationData);
      return response;
    } catch (error) {
      console.error('Error creating notification:', error);
      throw error;
    }
  },

  /**
   * Clear all notifications for the current user
   * @param {string} type - Optional: specific notification type to clear
   * @returns {Promise<Object>} API response with count of deleted notifications
   */
  clearAllNotifications: async (type = null) => {
    try {
      const queryParams = type ? `?type=${type}` : '';
      const response = await api.delete(`/notifications/clear${queryParams}`);
      return response;
    } catch (error) {
      console.error('Error clearing notifications:', error);
      throw error;
    }
  },

  /**
   * Get notification statistics for the current user
   * @returns {Promise<Object>} API response with notification stats
   */
  getNotificationStats: async () => {
    try {
      const response = await api.get('/notifications/stats');
      return response;
    } catch (error) {
      console.error('Error getting notification stats:', error);
      throw error;
    }
  },

  /**
   * Update notification preferences
   * @param {Object} preferences - Notification preferences
   * @param {boolean} preferences.email - Email notifications enabled
   * @param {boolean} preferences.push - Push notifications enabled
   * @param {Object} preferences.types - Per-type notification settings
   * @returns {Promise<Object>} API response
   */
  updatePreferences: async (preferences) => {
    try {
      const response = await api.put('/notifications/preferences', preferences);
      return response;
    } catch (error) {
      console.error('Error updating notification preferences:', error);
      throw error;
    }
  },

  /**
   * Get notification preferences for the current user
   * @returns {Promise<Object>} API response with user preferences
   */
  getPreferences: async () => {
    try {
      const response = await api.get('/notifications/preferences');
      return response;
    } catch (error) {
      console.error('Error getting notification preferences:', error);
      throw error;
    }
  },

  /**
   * Subscribe to push notifications
   * @param {Object} subscription - Push subscription object
   * @returns {Promise<Object>} API response
   */
  subscribeToPush: async (subscription) => {
    try {
      const response = await api.post('/notifications/push/subscribe', {
        subscription
      });
      return response;
    } catch (error) {
      console.error('Error subscribing to push notifications:', error);
      throw error;
    }
  },

  /**
   * Unsubscribe from push notifications
   * @param {string} endpoint - Push subscription endpoint
   * @returns {Promise<Object>} API response
   */
  unsubscribeFromPush: async (endpoint) => {
    try {
      const response = await api.post('/notifications/push/unsubscribe', {
        endpoint
      });
      return response;
    } catch (error) {
      console.error('Error unsubscribing from push notifications:', error);
      throw error;
    }
  },

  /**
   * Test push notification
   * @returns {Promise<Object>} API response
   */
  testPushNotification: async () => {
    try {
      const response = await api.post('/notifications/push/test');
      return response;
    } catch (error) {
      console.error('Error testing push notification:', error);
      throw error;
    }
  }
};

export default notificationService;