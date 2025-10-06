import api from './api.config';

class MessageService {
  // Conversation endpoints
  async getConversations(page = 1, limit = 20) {
    try {
      const response = await api.get('/messages/conversations', {
        params: { page, limit }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching conversations:', error);
      throw error;
    }
  }

  async getConversation(conversationId) {
    try {
      const response = await api.get(`/messages/conversations/${conversationId}`);
      // Backend returns { success: true, data: conversation }, extract the conversation
      return response.data.data || response.data;
    } catch (error) {
      console.error('Error fetching conversation:', error);
      throw error;
    }
  }

  async createOrGetConversation(userId, userModel, username = null) {
    try {
      const payload = { userModel };

      // Support both userId and username lookup
      if (username) {
        payload.username = username;
      } else if (userId) {
        payload.userId = userId;
      } else {
        throw new Error('Either userId or username must be provided');
      }

      const response = await api.post('/messages/conversations/init', payload);
      // Backend returns { success: true, data: conversation }, extract the conversation
      return response.data.data || response.data;
    } catch (error) {
      console.error('Error creating conversation:', error);
      throw error;
    }
  }

  // Message endpoints
  async getMessages(conversationId, page = 1, limit = 50) {
    try {
      const response = await api.get(`/messages/conversations/${conversationId}/messages`, {
        params: { page, limit }
      });
      // Backend returns { success: true, data: messages }, extract the messages array
      return response.data.data || response.data;
    } catch (error) {
      console.error('Error fetching messages:', error);
      throw error;
    }
  }

  async sendMessage(conversationId, content, media = null) {
    try {
      const formData = new FormData();
      formData.append('content', content);
      
      if (media && media.length > 0) {
        media.forEach(file => {
          formData.append('media', file);
        });
      }

      const response = await api.post(
        `/messages/conversations/${conversationId}/messages`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          }
        }
      );
      // Backend returns { success: true, data: message }, extract the message
      return response.data.data || response.data;
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  }

  async sendTip(conversationId, amount, message = '') {
    try {
      const response = await api.post(`/messages/conversations/${conversationId}/tip`, {
        amount,
        message
      });
      return response.data;
    } catch (error) {
      console.error('Error sending tip:', error);
      throw error;
    }
  }

  async unlockMedia(messageId) {
    try {
      const response = await api.post(`/messages/${messageId}/unlock`);
      return response.data;
    } catch (error) {
      console.error('Error unlocking media:', error);
      throw error;
    }
  }

  async deleteMessage(messageId) {
    try {
      const response = await api.delete(`/messages/${messageId}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting message:', error);
      throw error;
    }
  }

  async markAsRead(messageId) {
    try {
      const response = await api.patch(`/messages/${messageId}/read`);
      return response.data;
    } catch (error) {
      console.error('Error marking as read:', error);
      throw error;
    }
  }

  async markAllAsRead(conversationId) {
    try {
      const response = await api.patch(`/messages/conversations/${conversationId}/read-all`);
      return response.data;
    } catch (error) {
      console.error('Error marking all as read:', error);
      throw error;
    }
  }

  // Conversation management
  async archiveConversation(conversationId) {
    try {
      const response = await api.patch(`/messages/conversations/${conversationId}/archive`);
      return response.data;
    } catch (error) {
      console.error('Error archiving conversation:', error);
      throw error;
    }
  }

  async muteConversation(conversationId) {
    try {
      const response = await api.patch(`/messages/conversations/${conversationId}/mute`);
      return response.data;
    } catch (error) {
      console.error('Error muting conversation:', error);
      throw error;
    }
  }

  async updateTypingStatus(conversationId, isTyping) {
    try {
      const response = await api.post(`/messages/conversations/${conversationId}/typing`, {
        isTyping
      });
      return response.data;
    } catch (error) {
      console.error('Error updating typing status:', error);
      throw error;
    }
  }

  async searchMessages(query, conversationId = null) {
    try {
      const params = { query };
      if (conversationId) params.conversationId = conversationId;
      
      const response = await api.get('/messages/search/messages', { params });
      return response.data;
    } catch (error) {
      console.error('Error searching messages:', error);
      throw error;
    }
  }

  async getUnreadCount() {
    try {
      const response = await api.get('/messages/unread-count');
      return response.data;
    } catch (error) {
      console.error('Error getting unread count:', error);
      throw error;
    }
  }

  async getConversationMedia(conversationId) {
    try {
      const response = await api.get(`/messages/conversations/${conversationId}/media`);
      return response.data;
    } catch (error) {
      console.error('Error fetching conversation media:', error);
      throw error;
    }
  }
}

export default new MessageService();