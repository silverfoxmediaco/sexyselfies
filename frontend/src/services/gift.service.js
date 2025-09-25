// Gift Service - API integration for gift functionality
import api from './api.config';

/**
 * Creator Gift Services
 */

/**
 * Get creator's content library available for gifting
 * @returns {Promise} Creator's giftable content
 */
export const getCreatorContentLibrary = async () => {
  try {
    console.log('🎁 Fetching creator content library...');

    const response = await api.get('/creator/content/giftable');

    console.log(`✅ Found ${response.data.content?.length || 0} giftable content items`);
    return response.data;
  } catch (error) {
    console.error('❌ Failed to fetch content library:', error);
    throw error;
  }
};

/**
 * Send a gift to a member
 * @param {string} memberId - Member's ID
 * @param {Object} giftData - Gift data {contentId, message}
 * @returns {Promise} Gift sending result
 */
export const sendGift = async (memberId, giftData) => {
  try {
    console.log(`🎁 Sending gift to member ${memberId}:`, giftData);

    const response = await api.post(`/creator/members/profile/${memberId}/gift`, giftData);

    console.log('✅ Gift sent successfully:', response.data.gift);
    return response.data;
  } catch (error) {
    console.error('❌ Failed to send gift:', error);

    // Handle specific error types
    if (error.response?.status === 429) {
      const errorData = error.response.data;
      if (errorData.code === 'DAILY_LIMIT_EXCEEDED') {
        throw new Error('Daily gift limit reached (10 gifts per day)');
      } else if (errorData.code === 'MEMBER_DAILY_LIMIT_EXCEEDED') {
        throw new Error('You already sent a gift to this member today');
      }
    }

    throw error;
  }
};

/**
 * Get gift analytics for creator
 * @param {number} days - Number of days to analyze (default 30)
 * @returns {Promise} Gift analytics data
 */
export const getGiftAnalytics = async (days = 30) => {
  try {
    console.log(`📊 Fetching gift analytics for ${days} days...`);

    const response = await api.get(`/creator/gifts/analytics?days=${days}`);

    console.log('✅ Gift analytics loaded:', response.data.analytics);
    return response.data;
  } catch (error) {
    console.error('❌ Failed to load gift analytics:', error);
    throw error;
  }
};

/**
 * Member Gift Services
 */

/**
 * Get member's received gifts
 * @param {Object} params - Query parameters {page, limit, status}
 * @returns {Promise} Member's received gifts
 */
export const getMemberGifts = async (params = {}) => {
  try {
    const { page = 1, limit = 20, status = 'all' } = params;
    console.log(`🎁 Fetching member gifts - Page ${page}, Status: ${status}`);

    const response = await api.get('/member/gifts/received', {
      params: { page, limit, status }
    });

    console.log(`✅ Found ${response.data.gifts?.length || 0} gifts`);
    return response.data;
  } catch (error) {
    console.error('❌ Failed to fetch member gifts:', error);
    throw error;
  }
};

/**
 * View a specific gift and mark as viewed
 * @param {string} giftId - Gift's ID
 * @returns {Promise} Gift content and details
 */
export const viewGift = async (giftId) => {
  try {
    console.log(`👁️ Viewing gift ${giftId}...`);

    const response = await api.get(`/member/gifts/${giftId}/view`);

    console.log('✅ Gift viewed successfully:', response.data.gift);
    return response.data;
  } catch (error) {
    console.error('❌ Failed to view gift:', error);

    // Handle specific error types
    if (error.response?.status === 410) {
      throw new Error('This gift has expired');
    }

    throw error;
  }
};

/**
 * Track click-through to creator profile from gift
 * @param {string} giftId - Gift's ID
 * @returns {Promise} Tracking result
 */
export const trackGiftClickThrough = async (giftId) => {
  try {
    console.log(`🔗 Tracking click-through for gift ${giftId}...`);

    const response = await api.post(`/member/gifts/${giftId}/click-through`);

    console.log('✅ Click-through tracked successfully');
    return response.data;
  } catch (error) {
    console.error('❌ Failed to track click-through:', error);
    throw error;
  }
};

/**
 * Gift Utility Functions
 */

/**
 * Format gift data for display
 * @param {Object} gift - Raw gift data
 * @returns {Object} Formatted gift data
 */
export const formatGiftForDisplay = (gift) => {
  return {
    id: gift.id,
    creator: {
      id: gift.creator.id,
      username: gift.creator.username,
      profileImage: gift.creator.profileImage,
    },
    content: {
      id: gift.content.id,
      title: gift.content.title,
      type: gift.content.type,
      thumbnailUrl: gift.content.thumbnailUrl,
      fileUrl: gift.content.fileUrl, // Only available after viewing
    },
    originalPrice: gift.originalPrice,
    message: gift.message,
    giftedAt: new Date(gift.giftedAt),
    viewedAt: gift.viewedAt ? new Date(gift.viewedAt) : null,
    status: gift.status,
    isViewed: gift.isViewed,
    timeAgo: getTimeAgo(new Date(gift.giftedAt)),
  };
};

/**
 * Get time ago string for gift timestamps
 * @param {Date} date - Date to format
 * @returns {string} Time ago string
 */
const getTimeAgo = (date) => {
  const now = new Date();
  const diffInSeconds = Math.floor((now - date) / 1000);

  if (diffInSeconds < 60) return 'Just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)}d ago`;

  return date.toLocaleDateString();
};

/**
 * Validate gift data before sending
 * @param {Object} giftData - Gift data to validate
 * @returns {Object} Validation result
 */
export const validateGiftData = (giftData) => {
  const errors = [];

  if (!giftData.contentId) {
    errors.push('Please select content to gift');
  }

  if (!giftData.message || giftData.message.trim().length === 0) {
    errors.push('Please include a message with your gift');
  } else if (giftData.message.length > 500) {
    errors.push('Message must be 500 characters or less');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

/**
 * Get gift status display information
 * @param {Object} gift - Gift object
 * @returns {Object} Status display info
 */
export const getGiftStatusInfo = (gift) => {
  if (gift.isViewed) {
    return {
      status: 'viewed',
      label: 'Viewed',
      color: '#22c55e', // success green
      icon: '👁️',
    };
  }

  return {
    status: 'sent',
    label: 'Sent',
    color: '#f59e0b', // warning orange
    icon: '🎁',
  };
};

export default {
  // Creator services
  getCreatorContentLibrary,
  sendGift,
  getGiftAnalytics,

  // Member services
  getMemberGifts,
  viewGift,
  trackGiftClickThrough,

  // Utilities
  formatGiftForDisplay,
  validateGiftData,
  getGiftStatusInfo,
};