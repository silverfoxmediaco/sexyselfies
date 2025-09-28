const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth.middleware');
const { protectAdmin } = require('../middleware/admin.auth.middleware');
const {
  getUserNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  createNotification,
  deleteNotification,
  sendAdminVerificationNotification,
  approveVerification,
  rejectVerification,
} = require('../controllers/notification.controller');

// Get user's notifications with pagination and filtering
router.get('/', protect, getUserNotifications);

// Get unread notification count for a user
router.get('/unread/count', protect, getUnreadCount);

// Mark a specific notification as read
router.patch('/:id/read', protect, markAsRead);

// Mark all notifications as read for a user
router.patch('/mark-all-read', protect, markAllAsRead);

// Create a new notification (for system use)
router.post('/', protect, createNotification);

// Delete a notification
router.delete('/:id', protect, deleteNotification);

// Legacy verification routes (keeping for backward compatibility)
router.post('/admin-verification', protect, sendAdminVerificationNotification);
router.post('/approve-verification', protectAdmin, approveVerification);
router.post('/reject-verification', protectAdmin, rejectVerification);

module.exports = router;
