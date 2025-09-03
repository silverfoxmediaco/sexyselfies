import api, { uploadApi } from './api.config';
import authService from './auth.service';

/**
 * Member Service
 * Handles all member-related API calls including discovery, matching, purchases, and interactions
 */
class MemberService {
  // ==========================================
  // AUTHENTICATION
  // ==========================================
  
  /**
   * Member login
   */
  async login(credentials) {
    try {
      const response = await authService.memberLogin(credentials.email, credentials.password, credentials.rememberMe);
      return {
        success: true,
        token: response.token,
        user: response.user
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Member register
   */
  async register(data) {
    try {
      const response = await authService.memberRegister(data);
      return response;
    } catch (error) {
      throw error;
    }
  }

  // ==========================================
  // MEMBER PROFILE
  // ==========================================
  
  /**
   * Get member profile
   */
  async getProfile() {
    try {
      const response = await api.get('/auth/me');
      return response;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Update member profile
   */
  async updateProfile(data) {
    try {
      const response = await api.put('/auth/profile', {
        username: data.username,
        displayName: data.displayName
      });
      return response;
    } catch (error) {
      throw this.handleError(error);
    }
  }


  /**
   * Delete account
   */
  async deleteAccount(password, reason) {
    try {
      const response = await api.delete('/member/profile', {
        data: { password, reason }
      });
      return response;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // ==========================================
  // DISCOVERY & BROWSING
  // ==========================================
  
  /**
   * Get swipe stack of creators to browse
   */
  async getSwipeStack(params = {}) {
    try {
      const response = await api.get('/connections/stack', {
        params
      });
      return response;
    } catch (error) {
      // If the first endpoint fails, try the alternative
      try {
        const fallbackResponse = await api.get('/member/discover', {
          params
        });
        return fallbackResponse;
      } catch (fallbackError) {
        throw this.handleError(error);
      }
    }
  }

  /**
   * Process swipe action (like/pass/superlike)
   */
  async swipeAction(creatorId, action) {
    try {
      const response = await api.post('/connections/swipe', {
        creatorId,
        action // 'like', 'pass', 'superlike'
      });
      return response;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Browse creators (swipe interface)
   */
  async browseCreators(params = {}) {
    try {
      const response = await api.get('/member/discover', {
        params: {
          categories: params.categories,
          gender: params.gender,
          orientation: params.orientation,
          age_min: params.age_min || 18,
          age_max: params.age_max || 99,
          distance: params.distance, // km
          price_min: params.price_min,
          price_max: params.price_max,
          verified_only: params.verified_only || false,
          online_now: params.online_now || false,
          new_creators: params.new_creators || false,
          sort: params.sort || 'recommended', // 'recommended', 'popular', 'nearest', 'newest'
          exclude_seen: params.exclude_seen || true,
          limit: params.limit || 10
        }
      });
      return response;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Get creator profile details
   */
  async getCreatorProfile(creatorId) {
    try {
      const response = await api.get(`/member/creators/${creatorId}`);
      return response;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Get creator's public content preview
   */
  async getCreatorContent(creatorId, params = {}) {
    try {
      const response = await api.get(`/member/creators/${creatorId}/content`, {
        params: {
          type: params.type, // 'photos', 'videos', 'all'
          page: params.page || 1,
          limit: params.limit || 20
        }
      });
      return response;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Search creators
   */
  async searchCreators(query, filters = {}) {
    try {
      const response = await api.get('/member/search/creators', {
        params: {
          q: query,
          ...filters
        }
      });
      return response;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // ==========================================
  // SWIPING & MATCHING
  // ==========================================
  
  /**
   * Swipe on creator profile
   */
  async swipeCreator(creatorId, action) {
    try {
      const response = await api.post('/member/swipe', {
        creator_id: creatorId,
        action: action, // 'like', 'superlike', 'pass'
        swiped_at: new Date().toISOString()
      });
      return response;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Undo last swipe
   */
  async undoSwipe() {
    try {
      const response = await api.post('/member/swipe/undo');
      return response;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Get matches
   */
  async getMatches(params = {}) {
    try {
      const response = await api.get('/member/matches', {
        params: {
          filter: params.filter || 'all', // 'all', 'new', 'online', 'subscribed'
          sort: params.sort || 'recent', // 'recent', 'alphabetical', 'active'
          page: params.page || 1,
          limit: params.limit || 20
        }
      });
      return response;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Unmatch with creator
   */
  async unmatch(creatorId, reason) {
    try {
      const response = await api.delete(`/member/matches/${creatorId}`, {
        data: { reason }
      });
      return response;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // ==========================================
  // SUBSCRIPTIONS
  // ==========================================
  
  /**
   * Subscribe to creator
   */
  async subscribeToCreator(creatorId, data = {}) {
    try {
      const response = await api.post(`/member/creators/${creatorId}/subscribe`, {
        subscription_tier: data.tier || 'basic', // 'basic', 'vip', 'premium'
        duration: data.duration || 1, // months
        auto_renew: data.auto_renew !== false,
        payment_method: data.payment_method || 'credits'
      });
      return response;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Cancel subscription
   */
  async cancelSubscription(creatorId, reason) {
    try {
      const response = await api.delete(`/member/creators/${creatorId}/subscribe`, {
        data: { 
          reason,
          cancel_immediately: false // false = cancel at end of period
        }
      });
      return response;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Get active subscriptions
   */
  async getSubscriptions(params = {}) {
    try {
      const response = await api.get('/member/subscriptions', {
        params: {
          status: params.status || 'active', // 'active', 'expired', 'cancelled', 'all'
          page: params.page || 1,
          limit: params.limit || 20
        }
      });
      return response;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Reactivate subscription
   */
  async reactivateSubscription(creatorId) {
    try {
      const response = await api.post(`/member/subscriptions/${creatorId}/reactivate`);
      return response;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // ==========================================
  // PURCHASES & PAYMENTS
  // ==========================================
  
  /**
   * Purchase content
   */
  async purchaseContent(contentId, paymentMethod = 'credits') {
    try {
      const response = await api.post(`/member/content/${contentId}/purchase`, {
        payment_method: paymentMethod
      });
      return response;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Purchase message
   */
  async purchaseMessage(messageId, paymentMethod = 'credits') {
    try {
      const response = await api.post(`/member/messages/${messageId}/purchase`, {
        payment_method: paymentMethod
      });
      return response;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Get purchased content
   */
  async getPurchasedContent(params = {}) {
    try {
      const response = await api.get('/member/purchased', {
        params: {
          type: params.type, // 'photos', 'videos', 'messages', 'all'
          creator_id: params.creator_id,
          sort: params.sort || 'recent', // 'recent', 'oldest', 'creator'
          page: params.page || 1,
          limit: params.limit || 20
        }
      });
      return response;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Buy credits
   */
  async buyCredits(package_id, paymentMethod) {
    try {
      const response = await api.post('/member/credits/purchase', {
        package_id,
        payment_method: paymentMethod, // 'card', 'paypal', 'crypto'
        return_url: `${window.location.origin}/member/credits/success`,
        cancel_url: `${window.location.origin}/member/credits/cancel`
      });
      return response;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Get credit packages
   */
  async getCreditPackages() {
    try {
      const response = await api.get('/member/credits/packages');
      return response;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Get credit balance
   */
  async getCreditBalance() {
    try {
      const response = await api.get('/member/credits/balance');
      return response;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Get transaction history
   */
  async getTransactionHistory(params = {}) {
    try {
      const response = await api.get('/member/transactions', {
        params: {
          type: params.type, // 'purchase', 'subscription', 'tip', 'credit', 'all'
          start_date: params.start_date,
          end_date: params.end_date,
          page: params.page || 1,
          limit: params.limit || 20
        }
      });
      return response;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // ==========================================
  // MESSAGES & CHAT
  // ==========================================
  
  /**
   * Get conversations
   */
  async getConversations(params = {}) {
    try {
      const response = await api.get('/member/messages/conversations', {
        params: {
          filter: params.filter || 'all', // 'all', 'unread', 'matches', 'subscribed'
          sort: params.sort || 'recent',
          page: params.page || 1,
          limit: params.limit || 20
        }
      });
      return response;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Get messages with creator
   */
  async getMessages(creatorId, params = {}) {
    try {
      const response = await api.get(`/member/messages/${creatorId}`, {
        params: {
          page: params.page || 1,
          limit: params.limit || 50
        }
      });
      return response;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Send message
   */
  async sendMessage(creatorId, data) {
    try {
      const formData = new FormData();
      formData.append('message', data.message || '');
      formData.append('message_type', data.message_type || 'text');
      
      if (data.media) {
        formData.append('media', data.media);
      }
      
      if (data.tip_amount) {
        formData.append('tip_amount', data.tip_amount);
      }
      
      const response = await uploadApi.post(`/member/messages/${creatorId}/send`, formData);
      return response;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Send tip with message
   */
  async sendTip(creatorId, amount, message = '') {
    try {
      const response = await api.post(`/member/creators/${creatorId}/tip`, {
        amount,
        message,
        payment_method: 'credits'
      });
      return response;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Mark messages as read
   */
  async markMessagesAsRead(creatorId) {
    try {
      const response = await api.put(`/member/messages/${creatorId}/read`);
      return response;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Report message
   */
  async reportMessage(messageId, reason, details) {
    try {
      const response = await api.post(`/member/messages/${messageId}/report`, {
        reason, // 'spam', 'inappropriate', 'scam', 'harassment', 'other'
        details
      });
      return response;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // ==========================================
  // INTERACTIONS
  // ==========================================
  
  /**
   * Like content
   */
  async likeContent(contentId) {
    try {
      const response = await api.post(`/member/content/${contentId}/like`);
      return response;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Unlike content
   */
  async unlikeContent(contentId) {
    try {
      const response = await api.delete(`/member/content/${contentId}/like`);
      return response;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Comment on content
   */
  async commentOnContent(contentId, comment) {
    try {
      const response = await api.post(`/member/content/${contentId}/comment`, {
        comment
      });
      return response;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Delete comment
   */
  async deleteComment(commentId) {
    try {
      const response = await api.delete(`/member/comments/${commentId}`);
      return response;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Report content
   */
  async reportContent(contentId, reason, details) {
    try {
      const response = await api.post(`/member/content/${contentId}/report`, {
        reason, // 'inappropriate', 'copyright', 'spam', 'misleading', 'other'
        details
      });
      return response;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Report creator
   */
  async reportCreator(creatorId, reason, details) {
    try {
      const response = await api.post(`/member/creators/${creatorId}/report`, {
        reason, // 'fake', 'scam', 'inappropriate', 'harassment', 'other'
        details
      });
      return response;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Block creator
   */
  async blockCreator(creatorId, reason) {
    try {
      const response = await api.post(`/member/creators/${creatorId}/block`, {
        reason
      });
      return response;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Unblock creator
   */
  async unblockCreator(creatorId) {
    try {
      const response = await api.delete(`/member/creators/${creatorId}/block`);
      return response;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Get blocked creators
   */
  async getBlockedCreators() {
    try {
      const response = await api.get('/member/blocked');
      return response;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // ==========================================
  // FAVORITES & LISTS
  // ==========================================
  
  /**
   * Add creator to favorites
   */
  async addToFavorites(creatorId) {
    try {
      const response = await api.post(`/member/favorites/${creatorId}`);
      return response;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Remove from favorites
   */
  async removeFromFavorites(creatorId) {
    try {
      const response = await api.delete(`/member/favorites/${creatorId}`);
      return response;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Get favorites
   */
  async getFavorites(params = {}) {
    try {
      const response = await api.get('/member/favorites', {
        params: {
          page: params.page || 1,
          limit: params.limit || 20
        }
      });
      return response;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Create custom list
   */
  async createList(name, description) {
    try {
      const response = await api.post('/member/lists', {
        name,
        description
      });
      return response;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Add creator to list
   */
  async addToList(listId, creatorId) {
    try {
      const response = await api.post(`/member/lists/${listId}/creators/${creatorId}`);
      return response;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // ==========================================
  // SETTINGS & PREFERENCES
  // ==========================================
  
  /**
   * Get settings
   */
  async getSettings() {
    try {
      const response = await api.get('/member/settings');
      return response;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Update settings
   */
  async updateSettings(data) {
    try {
      const response = await api.put('/member/settings', data);
      return response;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Update discovery preferences
   */
  async updateDiscoveryPreferences(data) {
    try {
      const response = await api.put('/member/settings/discovery', {
        show_me: data.show_me, // 'everyone', 'women', 'men', 'other'
        age_range: data.age_range,
        distance: data.distance,
        categories: data.categories,
        price_range: data.price_range,
        verified_only: data.verified_only
      });
      return response;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Update notification preferences
   */
  async updateNotificationPreferences(data) {
    try {
      const response = await api.put('/member/settings/notifications', {
        email_notifications: data.email_notifications,
        push_notifications: data.push_notifications,
        sms_notifications: data.sms_notifications,
        notification_types: data.notification_types
      });
      return response;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Update privacy settings
   */
  async updatePrivacySettings(data) {
    try {
      const response = await api.put('/member/settings/privacy', {
        profile_visibility: data.profile_visibility, // 'public', 'matches_only', 'private'
        show_online_status: data.show_online_status,
        show_last_seen: data.show_last_seen,
        allow_screenshots: data.allow_screenshots,
        discoverable: data.discoverable,
        show_spending_tier: data.show_spending_tier
      });
      return response;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Update payment methods
   */
  async updatePaymentMethods(data) {
    try {
      const response = await api.put('/member/settings/payment', data);
      return response;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // ==========================================
  // ANALYTICS & ACTIVITY
  // ==========================================
  
  /**
   * Get activity summary
   */
  async getActivitySummary(period = '30d') {
    try {
      const response = await api.get('/member/activity', {
        params: { period }
      });
      return response;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Get spending summary
   */
  async getSpendingSummary(params = {}) {
    try {
      const response = await api.get('/member/spending', {
        params: {
          start_date: params.start_date,
          end_date: params.end_date,
          group_by: params.group_by || 'month'
        }
      });
      return response;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // ==========================================
  // HELPER METHODS
  // ==========================================
  
  /**
   * Handle service errors
   */
  handleError(error) {
    if (error.response) {
      const { status, data } = error.response;
      
      switch (status) {
        case 400:
          return { 
            error: true, 
            message: data.message || 'Invalid request',
            errors: data.errors || {}
          };
        case 401:
          return { 
            error: true, 
            message: 'Please login to continue.',
            code: 'UNAUTHORIZED'
          };
        case 402:
          return { 
            error: true, 
            message: 'Insufficient credits. Please purchase more credits.',
            code: 'PAYMENT_REQUIRED'
          };
        case 403:
          return { 
            error: true, 
            message: 'Access denied. You may need to subscribe to view this content.',
            code: 'FORBIDDEN'
          };
        case 404:
          return { 
            error: true, 
            message: 'Content not found',
            code: 'NOT_FOUND'
          };
        case 422:
          return { 
            error: true, 
            message: 'Validation failed',
            errors: data.errors || {}
          };
        case 429:
          return { 
            error: true, 
            message: 'Too many requests. Please slow down.',
            code: 'RATE_LIMITED'
          };
        default:
          return { 
            error: true, 
            message: data.message || 'Something went wrong'
          };
      }
    }
    
    if (!navigator.onLine) {
      return { 
        error: true, 
        message: 'No internet connection',
        code: 'OFFLINE'
      };
    }
    
    return { 
      error: true, 
      message: error.message || 'An unexpected error occurred'
    };
  }
}

// Create and export singleton instance
const memberService = new MemberService();
export default memberService;