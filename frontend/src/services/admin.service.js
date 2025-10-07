import api from './api.config';

/**
 * Admin Service
 * Handles all admin-related API calls
 */
class AdminService {
  // ==========================================
  // TEST CREDITS MANAGEMENT
  // ==========================================

  /**
   * Grant test credits to a member
   */
  async grantTestCredits(memberId, amount, note = '') {
    try {
      const response = await api.post('/admin/test-credits/grant', {
        memberId,
        amount,
        note,
      });
      return response;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Deduct test credits from a member
   */
  async deductTestCredits(memberId, amount, reason = '') {
    try {
      const response = await api.post('/admin/test-credits/deduct', {
        memberId,
        amount,
        reason,
      });
      return response;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Set test credits balance for a member (override)
   */
  async setTestCredits(memberId, amount) {
    try {
      const response = await api.post('/admin/test-credits/set', {
        memberId,
        amount,
      });
      return response;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Bulk grant test credits to multiple members
   */
  async bulkGrantTestCredits(memberIds, amount, note = '') {
    try {
      const response = await api.post('/admin/test-credits/bulk-grant', {
        memberIds,
        amount,
        note,
      });
      return response;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Reset all test credits (QA cleanup)
   */
  async resetAllTestCredits() {
    try {
      const response = await api.post('/admin/test-credits/reset-all');
      return response;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Get test credit balance for a member
   */
  async getTestCreditBalance(memberId) {
    try {
      const response = await api.get(`/admin/test-credits/balance/${memberId}`);
      return response;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Get all members with test credits
   */
  async getMembersWithTestCredits() {
    try {
      const response = await api.get('/admin/test-credits/members');
      return response;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Get test transaction history
   */
  async getTestTransactions(page = 1, limit = 50, memberId = null) {
    try {
      const params = { page, limit };
      if (memberId) {
        params.memberId = memberId;
      }
      const response = await api.get('/admin/test-credits/transactions', {
        params,
      });
      return response;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // ==========================================
  // ERROR HANDLING
  // ==========================================

  handleError(error) {
    if (error.response) {
      // Server responded with error
      const message = error.response.data?.message || 'An error occurred';
      return new Error(message);
    } else if (error.request) {
      // Request made but no response
      return new Error('No response from server');
    } else {
      // Something else happened
      return new Error(error.message || 'An error occurred');
    }
  }
}

export default new AdminService();
