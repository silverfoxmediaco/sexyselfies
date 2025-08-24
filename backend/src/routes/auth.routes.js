const express = require('express');
const router = express.Router();
const {
  register,
  login,
  creatorLogin,
  getMe,
  logout,
  updatePassword
} = require('../controllers/auth.controller');
const { protect } = require('../middleware/auth.middleware');

// Public routes
router.post('/register', register);
router.post('/login', login);
router.post('/creator/login', creatorLogin); // Creator-specific login

// Protected routes
router.post('/logout', protect, logout);
router.get('/me', protect, getMe);
router.put('/updatepassword', protect, updatePassword);

module.exports = router;