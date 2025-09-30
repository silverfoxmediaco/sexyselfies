import api from './api.config';

/**
 * Connections Service
 * Handles all connection-related API calls for both members and creators
 */
class ConnectionsService {

  // ==========================================
  // GET CONNECTIONS
  // ==========================================

  /**
   * Get user's connections with filtering and pagination
   * @param {Object} params - Query parameters
   * @returns {Promise<Object>} Connections data
   */
  async getConnections(params = {}) {
    try {
      const queryParams = new URLSearchParams();

      // Add filters
      if (params.status) queryParams.append('status', params.status);
      if (params.type) queryParams.append('type', params.type);
      if (params.search) queryParams.append('search', params.search);
      if (params.sort) queryParams.append('sort', params.sort);
      if (params.page) queryParams.append('page', params.page);
      if (params.limit) queryParams.append('limit', params.limit);

      const response = await api.get(`/connections?${queryParams}`);

      return {
        success: true,
        connections: response.connections || [],
        stats: response.stats || {},
        total: response.total || 0
      };
    } catch (error) {
      console.error('Get connections error:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Get connection statistics
   * @returns {Promise<Object>} Connection stats
   */
  async getConnectionStats() {
    try {
      const response = await api.get('/connections/stats');
      return response;
    } catch (error) {
      console.error('Get connection stats error:', error);
      throw this.handleError(error);
    }
  }

  // ==========================================
  // CONNECTION ACTIONS
  // ==========================================

  /**
   * Delete a connection
   * @param {string} connectionId - Connection ID to delete
   * @returns {Promise<Object>} Delete result
   */
  async deleteConnection(connectionId) {
    try {
      const response = await api.delete(`/connections/${connectionId}`);
      return response;
    } catch (error) {
      console.error('Delete connection error:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Bulk delete connections
   * @param {Array<string>} connectionIds - Array of connection IDs
   * @returns {Promise<Object>} Bulk delete result
   */
  async bulkDeleteConnections(connectionIds) {
    try {
      const response = await api.post('/connections/bulk', {
        action: 'delete',
        connectionIds
      });
      return response;
    } catch (error) {
      console.error('Bulk delete connections error:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Accept a pending connection (for creators)
   * @param {string} connectionId - Connection ID to accept
   * @returns {Promise<Object>} Accept result
   */
  async acceptConnection(connectionId) {
    try {
      const response = await api.post(`/connections/${connectionId}/accept`);
      return response;
    } catch (error) {
      console.error('Accept connection error:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Decline a pending connection (for creators)
   * @param {string} connectionId - Connection ID to decline
   * @returns {Promise<Object>} Decline result
   */
  async declineConnection(connectionId) {
    try {
      const response = await api.post(`/connections/${connectionId}/decline`);
      return response;
    } catch (error) {
      console.error('Decline connection error:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Pin/Unpin a connection
   * @param {string} connectionId - Connection ID
   * @param {boolean} pin - Whether to pin or unpin
   * @returns {Promise<Object>} Pin result
   */
  async pinConnection(connectionId, pin = true) {
    try {
      const response = await api.put(`/connections/${connectionId}/pin`, { pin });
      return response;
    } catch (error) {
      console.error('Pin connection error:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Archive/Unarchive a connection
   * @param {string} connectionId - Connection ID
   * @param {boolean} archive - Whether to archive or unarchive
   * @returns {Promise<Object>} Archive result
   */
  async archiveConnection(connectionId, archive = true) {
    try {
      const response = await api.put(`/connections/${connectionId}/archive`, { archive });
      return response;
    } catch (error) {
      console.error('Archive connection error:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Block a connection
   * @param {string} connectionId - Connection ID to block
   * @param {string} reason - Reason for blocking
   * @returns {Promise<Object>} Block result
   */
  async blockConnection(connectionId, reason = '') {
    try {
      const response = await api.post(`/connections/${connectionId}/block`, { reason });
      return response;
    } catch (error) {
      console.error('Block connection error:', error);
      throw this.handleError(error);
    }
  }

  // ==========================================
  // SWIPE/DISCOVERY
  // ==========================================

  /**
   * Get swipe stack (creators to swipe on)
   * @param {Object} params - Filter parameters
   * @returns {Promise<Object>} Creators to swipe on
   */
  async getSwipeStack(params = {}) {
    try {
      const response = await api.get('/connections/stack', { params });
      return response;
    } catch (error) {
      console.error('Get swipe stack error:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Process a swipe action
   * @param {string} creatorId - Creator ID being swiped on
   * @param {string} direction - 'left', 'right', or 'super'
   * @param {Object} swipeData - Additional swipe metadata
   * @returns {Promise<Object>} Swipe result
   */
  async swipe(creatorId, direction, swipeData = {}) {
    try {
      const response = await api.post('/connections/swipe', {
        creatorId,
        direction,
        ...swipeData
      });
      return response;
    } catch (error) {
      console.error('Swipe error:', error);
      throw this.handleError(error);
    }
  }

  // ==========================================
  // MESSAGING
  // ==========================================

  /**
   * Send a message to a connection
   * @param {string} connectionId - Connection ID
   * @param {Object} messageData - Message content and metadata
   * @returns {Promise<Object>} Message send result
   */
  async sendMessage(connectionId, messageData) {
    try {
      const response = await api.post(`/connections/${connectionId}/messages`, messageData);
      return response;
    } catch (error) {
      console.error('Send message error:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Get messages for a connection
   * @param {string} connectionId - Connection ID
   * @param {Object} params - Query parameters (page, limit, etc.)
   * @returns {Promise<Object>} Messages data
   */
  async getMessages(connectionId, params = {}) {
    try {
      const response = await api.get(`/connections/${connectionId}/messages`, { params });
      return response;
    } catch (error) {
      console.error('Get messages error:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Mark messages as read
   * @param {string} connectionId - Connection ID
   * @returns {Promise<Object>} Mark read result
   */
  async markMessagesAsRead(connectionId) {
    try {
      const response = await api.put(`/connections/${connectionId}/messages/read`);
      return response;
    } catch (error) {
      console.error('Mark messages as read error:', error);
      throw this.handleError(error);
    }
  }

  /**
   * Delete a message
   * @param {string} messageId - Message ID to delete
   * @returns {Promise<Object>} Delete message result
   */
  async deleteMessage(messageId) {
    try {
      const response = await api.delete(`/connections/messages/${messageId}`);
      return response;
    } catch (error) {
      console.error('Delete message error:', error);
      throw this.handleError(error);
    }
  }

  // ==========================================
  // DATA TRANSFORMATION
  // ==========================================

  /**
   * Transform backend connection data to frontend format
   * @param {Object} connection - Backend connection object
   * @returns {Object} Frontend-formatted connection
   */
  transformConnection(connection) {
    const otherUser = connection.otherUser || connection.member || connection.creator;

    return {
      id: connection._id || connection.id,
      avatar: otherUser?.profileImage || null,
      name: otherUser?.displayName || otherUser?.username || 'Unknown User',
      username: otherUser?.username || '',
      connectionType: this.getConnectionTypeCode(connection.connectionType || 'standard'),
      connectionTypeColor: this.getConnectionTypeColor(connection.connectionType || 'standard'),
      lastMessage: connection.lastMessage?.content || 'No messages yet',
      messageTime: connection.lastMessage?.createdAt || connection.lastInteraction || connection.createdAt,
      isConnected: connection.status === 'active',
      status: connection.status,
      totalSpent: connection.totalSpent || 0,
      contentUnlocked: connection.contentUnlocked || 0,
      messageCount: connection.messageCount || 0,
      isPinned: connection.isPinned || false,
      isArchived: connection.isArchived || false
    };
  }

  /**
   * Get connection type code for badge display
   * @param {string} connectionType - Connection type from backend
   * @returns {string} Single letter code
   */
  getConnectionTypeCode(connectionType) {
    const typeMap = {
      'standard': 'C',
      'subscriber': 'S',
      'member': 'M',
      'fan': 'F',
      'premium': 'P',
      'vip': 'V'
    };
    return typeMap[connectionType] || 'C';
  }

  /**
   * Get connection type color
   * @param {string} connectionType - Connection type from backend
   * @returns {string} Hex color code
   */
  getConnectionTypeColor(connectionType) {
    const colorMap = {
      'standard': '#10b981',    // Green
      'subscriber': '#8e8e93',  // Gray
      'member': '#3b82f6',      // Blue
      'fan': '#f59e0b',         // Orange
      'premium': '#8b5cf6',     // Purple
      'vip': '#ef4444'          // Red
    };
    return colorMap[connectionType] || '#10b981';
  }

  // ==========================================
  // ERROR HANDLING
  // ==========================================

  /**
   * Handle API errors consistently
   * @param {Error} error - Error object
   * @returns {Error} Formatted error
   */
  handleError(error) {
    const message = error.response?.data?.message ||
                   error.response?.data?.error ||
                   error.message ||
                   'An unexpected error occurred';

    const statusCode = error.response?.status || 500;

    const formattedError = new Error(message);
    formattedError.statusCode = statusCode;
    formattedError.originalError = error;

    return formattedError;
  }
}

// Export singleton instance
export default new ConnectionsService();