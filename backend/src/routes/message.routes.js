const express = require('express');
const router = express.Router();
const multer = require('multer');
const {
  sendMessage,
  getConversationMessages,
  getConversations,
  getConversation,
  markAsRead,
  deleteMessage,
  editMessage,
  replyToMessage,
  sendTip,
  unlockMedia,
  searchMessages,
  getUnreadCount,
  markAllAsRead,
  pinMessage,
  unpinMessage,
  archiveConversation,
  unarchiveConversation,
  muteConversation,
  unmuteConversation,
  blockUser,
  unblockUser,
  reportMessage,
  clearConversation,
  getConversationMedia,
  getSharedMedia,
  createOrGetConversation,
  updateTypingStatus,
  getPinnedMessages,
} = require('../controllers/messageController');

const { authenticate, checkRole } = require('../middleware/auth');
const { validateMessage, validateTip } = require('../middleware/validation');
const { checkSubscription } = require('../middleware/subscription');

// Configure multer for media uploads with mobile-optimized settings
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit for mobile uploads
    files: 10, // Maximum 10 files per upload
  },
  fileFilter: (req, file, cb) => {
    const allowedMimeTypes = [
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'video/mp4',
      'video/quicktime',
      'video/webm',
      'audio/mpeg',
      'audio/wav',
      'audio/webm',
      'audio/aac',
    ];
    
    if (allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only images, videos, and audio files are allowed.'));
    }
  },
});

// Apply authentication to all routes
router.use(authenticate);

// Conversation Management Routes

// Get all conversations for the authenticated user with pagination
router.get('/conversations', getConversations);

// Create or get existing conversation
router.post('/conversations/init', createOrGetConversation);

// Get single conversation details
router.get('/conversations/:conversationId', getConversation);

// Get conversation media gallery (for media tab in mobile)
router.get('/conversations/:conversationId/media', getConversationMedia);

// Get pinned messages for a conversation
router.get('/conversations/:conversationId/pinned', getPinnedMessages);

// Archive conversation
router.patch('/conversations/:conversationId/archive', archiveConversation);

// Unarchive conversation
router.patch('/conversations/:conversationId/unarchive', unarchiveConversation);

// Mute conversation notifications
router.patch('/conversations/:conversationId/mute', muteConversation);

// Unmute conversation notifications
router.patch('/conversations/:conversationId/unmute', unmuteConversation);

// Clear conversation history
router.delete('/conversations/:conversationId/clear', clearConversation);

// Message Routes

// Get messages for a conversation with pagination
router.get(
  '/conversations/:conversationId/messages',
  checkSubscription('messaging'),
  getConversationMessages
);

// Send a text or media message
router.post(
  '/conversations/:conversationId/messages',
  checkSubscription('messaging'),
  upload.array('media', 10),
  validateMessage,
  sendMessage
);

// Edit a message (text only)
router.patch('/messages/:messageId', validateMessage, editMessage);

// Delete a message (soft delete)
router.delete('/messages/:messageId', deleteMessage);

// Reply to a message
router.post(
  '/messages/:messageId/reply',
  checkSubscription('messaging'),
  upload.array('media', 10),
  validateMessage,
  replyToMessage
);

// Pin a message
router.patch('/messages/:messageId/pin', pinMessage);

// Unpin a message
router.patch('/messages/:messageId/unpin', unpinMessage);

// Mark message(s) as read
router.patch('/messages/:messageId/read', markAsRead);

// Mark all messages in a conversation as read
router.patch('/conversations/:conversationId/read-all', markAllAsRead);

// Report a message
router.post('/messages/:messageId/report', reportMessage);

// Monetization Routes

// Send a tip with a message
router.post(
  '/conversations/:conversationId/tip',
  checkSubscription('tipping'),
  validateTip,
  sendTip
);

// Unlock paid media content
router.post(
  '/messages/:messageId/unlock',
  checkSubscription('premium_content'),
  unlockMedia
);

// Real-time Status Routes

// Update typing status (for typing indicators)
router.post('/conversations/:conversationId/typing', updateTypingStatus);

// Search and Discovery Routes

// Search messages within conversations
router.get('/search/messages', searchMessages);

// Get shared media across all conversations
router.get('/shared-media', getSharedMedia);

// User Management Routes

// Block a user
router.post('/users/:userId/block', blockUser);

// Unblock a user
router.delete('/users/:userId/block', unblockUser);

// Notification Routes

// Get unread message count (for app badges)
router.get('/unread-count', getUnreadCount);

// Error handling middleware
router.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        error: 'File size too large. Maximum size is 50MB.',
      });
    }
    if (error.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        success: false,
        error: 'Too many files. Maximum 10 files per upload.',
      });
    }
  }
  
  if (error.message && error.message.includes('Invalid file type')) {
    return res.status(400).json({
      success: false,
      error: error.message,
    });
  }
  
  next(error);
});

module.exports = router;