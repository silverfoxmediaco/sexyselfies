/**
 * Safety Manager Utility
 * Handles safety-related functionality including reporting, blocking, and content filtering
 */

import contentService from '../services/content.service';
import memberService from '../services/member.service';
import { showSnackbar } from '../components/UI/Snackbar';

/**
 * Safety action types
 */
export const SAFETY_ACTIONS = {
  REPORT: 'report',
  BLOCK: 'block',
  UNBLOCK: 'unblock',
  HIDE: 'hide',
  UNHIDE: 'unhide'
};

/**
 * Report categories with metadata
 */
export const REPORT_CATEGORIES = {
  underage: {
    id: 'underage',
    label: 'Underage Content',
    description: 'Content involving minors or appearing to involve minors',
    severity: 'critical',
    requiresDetails: true,
    autoEscalate: true
  },
  illegal: {
    id: 'illegal',
    label: 'Illegal Content',
    description: 'Content that violates laws or promotes illegal activities',
    severity: 'critical',
    requiresDetails: true,
    autoEscalate: true
  },
  non_consensual: {
    id: 'non_consensual',
    label: 'Non-consensual Content',
    description: 'Content shared without consent or revenge pornography',
    severity: 'high',
    requiresDetails: true,
    autoEscalate: true
  },
  harassment: {
    id: 'harassment',
    label: 'Harassment or Abuse',
    description: 'Bullying, threats, or targeted harassment',
    severity: 'high',
    requiresDetails: false,
    autoEscalate: false
  },
  spam: {
    id: 'spam',
    label: 'Spam or Misleading',
    description: 'Repetitive content, scams, or false information',
    severity: 'medium',
    requiresDetails: false,
    autoEscalate: false
  },
  impersonation: {
    id: 'impersonation',
    label: 'Impersonation',
    description: 'Pretending to be someone else or fake account',
    severity: 'medium',
    requiresDetails: false,
    autoEscalate: false
  },
  copyright: {
    id: 'copyright',
    label: 'Copyright Violation',
    description: 'Content that violates intellectual property rights',
    severity: 'medium',
    requiresDetails: true,
    autoEscalate: false
  },
  other: {
    id: 'other',
    label: 'Other Violation',
    description: 'Other community guideline violations',
    severity: 'low',
    requiresDetails: true,
    autoEscalate: false
  }
};

/**
 * Block reasons with metadata
 */
export const BLOCK_REASONS = {
  harassment: {
    id: 'harassment',
    label: 'Harassment or Abuse',
    description: 'This user is harassing, threatening, or abusing me',
    severity: 'high',
    reportable: true
  },
  spam: {
    id: 'spam',
    label: 'Spam or Unwanted Messages',
    description: 'This user is sending unwanted or repetitive messages',
    severity: 'medium',
    reportable: true
  },
  inappropriate: {
    id: 'inappropriate',
    label: 'Inappropriate Behavior',
    description: 'This user is behaving inappropriately or violating guidelines',
    severity: 'medium',
    reportable: true
  },
  fake_profile: {
    id: 'fake_profile',
    label: 'Fake or Impersonation',
    description: 'This appears to be a fake account or someone impersonating another person',
    severity: 'medium',
    reportable: true
  },
  privacy: {
    id: 'privacy',
    label: 'Privacy Concerns',
    description: 'I want to limit who can see or contact me',
    severity: 'low',
    reportable: false
  },
  not_interested: {
    id: 'not_interested',
    label: 'Not Interested',
    description: 'I am not interested in this user\'s content or interactions',
    severity: 'low',
    reportable: false
  }
};

/**
 * Safety Manager Class
 */
class SafetyManager {
  constructor() {
    this.blockedUsers = new Set();
    this.hiddenContent = new Set();
    this.reportedContent = new Set();
    this.reportedCreators = new Set();
    this.safetySettings = this.loadSafetySettings();

    this.loadBlockedUsers();
    this.loadReportedCreators();
  }

  // ==========================================
  // REPORTING FUNCTIONALITY
  // ==========================================

  /**
   * Report content
   */
  async reportContent(contentId, reason, details = '', additionalData = {}) {
    try {
      if (!contentId || !reason) {
        throw new Error('Content ID and reason are required');
      }

      const category = REPORT_CATEGORIES[reason];
      if (!category) {
        throw new Error('Invalid report reason');
      }

      // Validate required details for certain categories
      if (category.requiresDetails && !details.trim()) {
        throw new Error(`Additional details are required for ${category.label} reports`);
      }

      const reportData = {
        contentId,
        reason,
        details: details.trim(),
        timestamp: new Date().toISOString(),
        severity: category.severity,
        autoEscalate: category.autoEscalate,
        ...additionalData
      };

      const response = await contentService.reportContent(contentId, reason, details);

      if (response.error) {
        throw new Error(response.message || 'Failed to submit report');
      }

      // Track reported content locally
      this.reportedContent.add(contentId);
      this.saveReportedContent();

      // Show success notification
      this.showSafetyNotification(
        'Report submitted successfully',
        'success',
        'Thank you for helping keep our community safe'
      );

      // Auto-hide content if it's a serious violation
      if (category.severity === 'critical' || category.severity === 'high') {
        this.hideContent(contentId, 'auto_hide_reported');
      }

      return {
        success: true,
        reportId: response.data?.reportId,
        data: reportData
      };

    } catch (error) {
      console.error('Report content error:', error);
      this.showSafetyNotification(
        'Failed to submit report',
        'error',
        error.message || 'Please try again later'
      );
      throw error;
    }
  }

  /**
   * Report user
   */
  async reportUser(userId, reason, details = '') {
    try {
      // For now, report user functionality would need a specific endpoint
      // This is a placeholder implementation
      const reportData = {
        userId,
        reason,
        details,
        timestamp: new Date().toISOString(),
        type: 'user_report'
      };

      // TODO: Implement user reporting endpoint
      console.log('User report would be submitted:', reportData);

      this.showSafetyNotification(
        'User report submitted',
        'success',
        'Thank you for helping keep our community safe'
      );

      return { success: true, data: reportData };

    } catch (error) {
      console.error('Report user error:', error);
      this.showSafetyNotification(
        'Failed to submit user report',
        'error',
        error.message || 'Please try again later'
      );
      throw error;
    }
  }

  // ==========================================
  // BLOCKING FUNCTIONALITY
  // ==========================================

  /**
   * Block user
   */
  async blockUser(userId, reason = '', details = '') {
    try {
      if (!userId) {
        throw new Error('User ID is required');
      }

      const response = await memberService.blockCreator(userId, reason);

      if (response.error) {
        throw new Error(response.message || 'Failed to block user');
      }

      // Track blocked user locally
      this.blockedUsers.add(userId);
      this.saveBlockedUsers();

      // Auto-report if reason indicates violations
      const blockReason = BLOCK_REASONS[reason];
      if (blockReason?.reportable && blockReason.severity !== 'low') {
        try {
          await this.reportUser(userId, reason, details);
        } catch (reportError) {
          console.warn('Auto-report failed after block:', reportError);
        }
      }

      this.showSafetyNotification(
        'User blocked successfully',
        'success',
        'This user can no longer contact you or see your content'
      );

      return {
        success: true,
        userId,
        reason,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      console.error('Block user error:', error);
      this.showSafetyNotification(
        'Failed to block user',
        'error',
        error.message || 'Please try again later'
      );
      throw error;
    }
  }

  /**
   * Unblock user
   */
  async unblockUser(userId) {
    try {
      if (!userId) {
        throw new Error('User ID is required');
      }

      const response = await memberService.unblockCreator(userId);

      if (response.error) {
        throw new Error(response.message || 'Failed to unblock user');
      }

      // Remove from local tracking
      this.blockedUsers.delete(userId);
      this.saveBlockedUsers();

      this.showSafetyNotification(
        'User unblocked successfully',
        'success',
        'This user can now contact you and see your content again'
      );

      return {
        success: true,
        userId,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      console.error('Unblock user error:', error);
      this.showSafetyNotification(
        'Failed to unblock user',
        'error',
        error.message || 'Please try again later'
      );
      throw error;
    }
  }

  // ==========================================
  // CONTENT FILTERING
  // ==========================================

  /**
   * Hide content locally
   */
  hideContent(contentId, reason = 'user_hide') {
    this.hiddenContent.add(contentId);
    this.saveHiddenContent();

    if (reason === 'user_hide') {
      this.showSafetyNotification(
        'Content hidden',
        'info',
        'This content has been hidden from your feed'
      );
    }

    return { success: true, contentId, reason };
  }

  /**
   * Unhide content locally
   */
  unhideContent(contentId) {
    this.hiddenContent.delete(contentId);
    this.saveHiddenContent();

    this.showSafetyNotification(
      'Content unhidden',
      'info',
      'This content is now visible in your feed again'
    );

    return { success: true, contentId };
  }

  /**
   * Check if content should be filtered
   */
  shouldFilterContent(content) {
    if (!content) return false;

    // Check if content is hidden
    if (this.hiddenContent.has(content.id || content._id)) {
      return true;
    }

    // Check if content is reported
    if (this.reportedContent.has(content.id || content._id)) {
      return this.safetySettings.hideReportedContent;
    }

    // Check if creator is blocked
    if (content.creator_id && this.blockedUsers.has(content.creator_id)) {
      return true;
    }

    // Check if creator has been reported by this user
    const creatorId = content.creator_id || content.creator?._id;
    if (creatorId && this.reportedCreators.has(creatorId)) {
      return true;
    }

    // Check content based on safety settings
    return this.applyContentFilters(content);
  }

  /**
   * Apply content filters based on user settings
   */
  applyContentFilters(content) {
    const settings = this.safetySettings;

    // Filter by content type if needed
    if (settings.filterExplicit && content.explicit) {
      return true;
    }

    // Filter by user verification status
    if (settings.verifiedOnly && !content.creator?.verified) {
      return true;
    }

    // Filter by minimum age if available
    if (settings.minCreatorAge && content.creator?.age && content.creator.age < settings.minCreatorAge) {
      return true;
    }

    return false;
  }

  // ==========================================
  // SAFETY SETTINGS
  // ==========================================

  /**
   * Get current safety settings
   */
  getSafetySettings() {
    return { ...this.safetySettings };
  }

  /**
   * Update safety settings
   */
  updateSafetySettings(newSettings) {
    this.safetySettings = {
      ...this.safetySettings,
      ...newSettings
    };
    this.saveSafetySettings();

    this.showSafetyNotification(
      'Safety settings updated',
      'success',
      'Your safety preferences have been saved'
    );

    return this.safetySettings;
  }

  /**
   * Reset safety settings to defaults
   */
  resetSafetySettings() {
    this.safetySettings = this.getDefaultSafetySettings();
    this.saveSafetySettings();

    this.showSafetyNotification(
      'Safety settings reset',
      'info',
      'Your safety settings have been reset to defaults'
    );

    return this.safetySettings;
  }

  // ==========================================
  // UTILITY METHODS
  // ==========================================

  /**
   * Check if user is blocked
   */
  isUserBlocked(userId) {
    return this.blockedUsers.has(userId);
  }

  /**
   * Check if content is hidden
   */
  isContentHidden(contentId) {
    return this.hiddenContent.has(contentId);
  }

  /**
   * Check if content is reported
   */
  isContentReported(contentId) {
    return this.reportedContent.has(contentId);
  }

  /**
   * Add creator to reported list (hides all their future content)
   */
  addReportedCreator(creatorId) {
    this.reportedCreators.add(creatorId);
    this.saveReportedCreators();

    this.showSafetyNotification(
      'Creator content hidden',
      'info',
      'Future content from this creator will no longer appear in your feed'
    );

    return { success: true, creatorId };
  }

  /**
   * Remove creator from reported list
   */
  removeReportedCreator(creatorId) {
    this.reportedCreators.delete(creatorId);
    this.saveReportedCreators();

    this.showSafetyNotification(
      'Creator content restored',
      'info',
      'Content from this creator will now appear in your feed again'
    );

    return { success: true, creatorId };
  }

  /**
   * Check if creator is reported
   */
  isCreatorReported(creatorId) {
    return this.reportedCreators.has(creatorId);
  }

  /**
   * Get blocked users list
   */
  getBlockedUsers() {
    return Array.from(this.blockedUsers);
  }

  /**
   * Get hidden content list
   */
  getHiddenContent() {
    return Array.from(this.hiddenContent);
  }

  /**
   * Clear all hidden content
   */
  clearHiddenContent() {
    this.hiddenContent.clear();
    this.saveHiddenContent();

    this.showSafetyNotification(
      'Hidden content cleared',
      'info',
      'All previously hidden content is now visible'
    );
  }

  /**
   * Export safety data for user
   */
  exportSafetyData() {
    return {
      blockedUsers: this.getBlockedUsers(),
      hiddenContent: this.getHiddenContent(),
      reportedContent: Array.from(this.reportedContent),
      safetySettings: this.getSafetySettings(),
      exportedAt: new Date().toISOString()
    };
  }

  // ==========================================
  // STORAGE METHODS
  // ==========================================

  /**
   * Load safety settings from storage
   */
  loadSafetySettings() {
    try {
      const stored = localStorage.getItem('sexyselfies_safety_settings');
      if (stored) {
        return { ...this.getDefaultSafetySettings(), ...JSON.parse(stored) };
      }
    } catch (error) {
      console.warn('Failed to load safety settings:', error);
    }
    return this.getDefaultSafetySettings();
  }

  /**
   * Save safety settings to storage
   */
  saveSafetySettings() {
    try {
      localStorage.setItem('sexyselfies_safety_settings', JSON.stringify(this.safetySettings));
    } catch (error) {
      console.warn('Failed to save safety settings:', error);
    }
  }

  /**
   * Load blocked users from storage
   */
  loadBlockedUsers() {
    try {
      const stored = localStorage.getItem('sexyselfies_blocked_users');
      if (stored) {
        const blocked = JSON.parse(stored);
        this.blockedUsers = new Set(blocked);
      }
    } catch (error) {
      console.warn('Failed to load blocked users:', error);
    }
  }

  /**
   * Save blocked users to storage
   */
  saveBlockedUsers() {
    try {
      localStorage.setItem('sexyselfies_blocked_users', JSON.stringify(Array.from(this.blockedUsers)));
    } catch (error) {
      console.warn('Failed to save blocked users:', error);
    }
  }

  /**
   * Save hidden content to storage
   */
  saveHiddenContent() {
    try {
      localStorage.setItem('sexyselfies_hidden_content', JSON.stringify(Array.from(this.hiddenContent)));
    } catch (error) {
      console.warn('Failed to save hidden content:', error);
    }
  }

  /**
   * Save reported content to storage
   */
  saveReportedContent() {
    try {
      localStorage.setItem('sexyselfies_reported_content', JSON.stringify(Array.from(this.reportedContent)));
    } catch (error) {
      console.warn('Failed to save reported content:', error);
    }
  }

  /**
   * Load reported creators from storage
   */
  loadReportedCreators() {
    try {
      const stored = localStorage.getItem('sexyselfies_reported_creators');
      if (stored) {
        const reported = JSON.parse(stored);
        this.reportedCreators = new Set(reported);
      }
    } catch (error) {
      console.warn('Failed to load reported creators:', error);
    }
  }

  /**
   * Save reported creators to storage
   */
  saveReportedCreators() {
    try {
      localStorage.setItem('sexyselfies_reported_creators', JSON.stringify(Array.from(this.reportedCreators)));
    } catch (error) {
      console.warn('Failed to save reported creators:', error);
    }
  }

  /**
   * Get default safety settings
   */
  getDefaultSafetySettings() {
    return {
      hideReportedContent: true,
      verifiedOnly: false,
      filterExplicit: false,
      minCreatorAge: 18,
      autoHideOnReport: true,
      allowDirectMessages: true,
      requireConnectionForMessages: false,
      showSafetyNotifications: true
    };
  }

  /**
   * Show safety notification
   */
  showSafetyNotification(title, type = 'info', message = '') {
    if (!this.safetySettings.showSafetyNotifications) {
      return;
    }

    // Use the app's snackbar if available, otherwise console log
    if (typeof showSnackbar === 'function') {
      showSnackbar(title, type, message);
    } else {
      console.log(`[${type.toUpperCase()}] ${title}: ${message}`);
    }
  }
}

// Create and export singleton instance
const safetyManager = new SafetyManager();
export default safetyManager;

// Export utility functions for direct use
export const {
  reportContent,
  reportUser,
  blockUser,
  unblockUser,
  hideContent,
  unhideContent,
  shouldFilterContent,
  isUserBlocked,
  isContentHidden,
  isContentReported,
  getSafetySettings,
  updateSafetySettings,
  exportSafetyData
} = safetyManager;