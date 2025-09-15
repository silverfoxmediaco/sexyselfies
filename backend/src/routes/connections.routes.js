// backend/src/routes/connections.routes.js
const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth.middleware');

const {
  // Swipe/Discovery
  getSwipeStack,
  swipeAction,
  
  // Connections Management (MyConnections page)
  getConnections,
  getConnectionStats,
  acceptConnection,
  declineConnection,
  pinConnection,
  archiveConnection,
  blockConnection,
  bulkConnectionAction,
  
  // Legacy Match Support
  getMatches,
  getMatch,
  unmatch,
  
  // Messaging
  sendMessage,
  getMessages,
  markMessagesAsRead,
  deleteMessage
} = require('../controllers/connections.controller');

// Debug middleware to see if routes are being hit
router.use((req, res, next) => {
  console.log('🔍 Connections route hit:', req.method, req.path);
  console.log('🔍 Auth header present:', !!req.headers.authorization);
  next();
});

router.use(protect); // All connection routes require authentication

// ============================================
// SWIPING/DISCOVERY ROUTES
// ============================================
router.get('/stack', getSwipeStack); // Get creators to swipe on
router.post('/swipe', swipeAction); // Process swipe (like/pass/superlike)

// ============================================
// CONNECTIONS MANAGEMENT ROUTES (MyConnections)
// ============================================
router.get('/', getConnections); // Get all connections with filters
router.get('/stats', getConnectionStats); // Get connection statistics

// Individual connection actions
router.post('/:connectionId/accept', acceptConnection); // Accept pending connection
router.post('/:connectionId/decline', declineConnection); // Decline pending connection
router.put('/:connectionId/pin', pinConnection); // Pin/Unpin connection
router.put('/:connectionId/archive', archiveConnection); // Archive connection
router.post('/:connectionId/block', blockConnection); // Block connection

// Bulk actions
router.post('/bulk', bulkConnectionAction); // Bulk actions on multiple connections

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