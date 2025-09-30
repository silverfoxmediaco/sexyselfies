// backend/src/routes/connections.routes.js
const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth.middleware');

const {
  // Content Feed Discovery (NEW)
  getContentFeed,
  getContentStats,

  // Swipe/Discovery (LEGACY)
  getSwipeStack,
  swipeAction,

  // Connections Management (MyConnections page)
  getCreatorConnections,
  getCreatorConnectionStats,
  acceptCreatorConnection,
  declineCreatorConnection,
  pinCreatorConnection,
  archiveCreatorConnection,
  blockCreatorConnection,
  bulkCreatorConnectionAction,

  // Legacy Match Support
  getMatches,
  getMatch,
  unmatch,

  // Messaging
  sendMessage,
  getMessages,
  markMessagesAsRead,
  deleteMessage,
} = require('../controllers/connections.controller');

// Debug middleware to see if routes are being hit
router.use((req, res, next) => {
  console.log('🔍 Connections route hit:', req.method, req.path);
  console.log('🔍 Auth header present:', !!req.headers.authorization);
  next();
});

router.use(protect); // All connection routes require authentication

// ============================================
// CONTENT DISCOVERY ROUTES (NEW)
// ============================================
router.get('/content-feed', getContentFeed); // Get global content feed for endless swiping
router.get('/content-stats', getContentStats); // Get content statistics for debugging

// ============================================
// SWIPING/DISCOVERY ROUTES (LEGACY)
// ============================================
router.get('/stack', getSwipeStack); // Get creators to swipe on
router.post('/swipe', swipeAction); // Process swipe (like/pass/superlike)

// ============================================
// CONNECTIONS MANAGEMENT ROUTES (MyConnections)
// ============================================
router.get('/', getCreatorConnections); // Get all connections with filters
router.get('/stats', getCreatorConnectionStats); // Get connection statistics

// Individual connection actions
router.post('/:connectionId/accept', acceptCreatorConnection); // Accept pending connection
router.post('/:connectionId/decline', declineCreatorConnection); // Decline pending connection
router.put('/:connectionId/pin', pinCreatorConnection); // Pin/Unpin connection
router.put('/:connectionId/archive', archiveCreatorConnection); // Archive connection
router.post('/:connectionId/block', blockCreatorConnection); // Block connection

// Bulk actions
router.post('/bulk', bulkCreatorConnectionAction); // Bulk actions on multiple connections

// ============================================
// LEGACY MATCH ROUTES (for backwards compatibility)
// ============================================
router.get('/matches', getMatches); // Get all matches (redirects to connections)
router.get('/:connectionId', getMatch); // Get specific connection details
router.delete('/:connectionId', unmatch); // Disconnect/Unmatch

// ============================================
// MESSAGING ROUTES
// ============================================
router.post('/:connectionId/messages', sendMessage); // Send message
router.get('/:connectionId/messages', getMessages); // Get messages
router.put('/:connectionId/messages/read', markMessagesAsRead); // Mark as read
router.delete('/messages/:messageId', deleteMessage); // Delete message

module.exports = router;
