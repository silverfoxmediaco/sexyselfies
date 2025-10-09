import api from './api.config';

/**
 * Admin Service
 * Handles all admin-related API calls
 */
class AdminService {
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
