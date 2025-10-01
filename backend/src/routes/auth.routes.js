const express = require('express');
const router = express.Router();
const User = require('../models/User'); // For debug endpoint
const {
  register,
  login,
  logout,
  getMe,
  updateProfile,
  updatePassword,
  creatorLogin,
  creatorRegister,
} = require('../controllers/auth.controller');
const { protect } = require('../middleware/auth.middleware');
const {
  validateMemberRegistration,
  validateCreatorRegistration,
  validateLogin,
} = require('../middleware/validation.middleware');

// Member routes
router.post('/register', validateMemberRegistration, register);
router.post('/login', validateLogin, login);

// DEBUG: Test login endpoint to isolate the issue
router.post('/test-login', async (req, res) => {
  try {
    console.log('🧪 TEST LOGIN: Starting...');
    const { email, password } = req.body;

    console.log('🧪 TEST LOGIN: Finding user...');
    const user = await User.findOne({ email }).select('+password');
    console.log('🧪 TEST LOGIN: User found:', !!user);

    if (!user) {
      console.log('🧪 TEST LOGIN: No user found');
      return res.json({
        success: false,
        error: 'User not found',
        step: 'database_query',
      });
    }

    console.log('🧪 TEST LOGIN: Testing password...');
    const isMatch = await user.matchPassword(password);
    console.log('🧪 TEST LOGIN: Password match:', isMatch);

    return res.json({
      success: true,
      step: 'password_check',
      userExists: true,
      passwordMatch: isMatch,
    });
  } catch (error) {
    console.error('🧪 TEST LOGIN ERROR:', error);
    return res.json({ success: false, error: error.message, step: 'error' });
  }
});

// Creator routes
router.post('/creator/register', validateCreatorRegistration, creatorRegister);
router.post('/creator/login', validateLogin, creatorLogin);

// Protected routes
router.get('/me', protect, getMe);
router.put('/profile', protect, updateProfile);
router.post('/logout', protect, logout);
router.put('/updatepassword', protect, updatePassword);

// Push notification routes
router.get('/push/public-key', (req, res) => {
  try {
    const publicKey = process.env.VAPID_PUBLIC_KEY;

    if (!publicKey) {
      return res.status(503).json({
        success: false,
        error: 'Push notifications not configured',
      });
    }

    res.status(200).json({
      success: true,
      data: {
        publicKey,
      },
    });
  } catch (error) {
    console.error('Error getting VAPID public key:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
});

// Push notification subscription
router.post('/push/subscribe', protect, async (req, res) => {
  try {
    const PushSubscription = require('../models/PushSubscription');
    const { subscription, deviceInfo = {} } = req.body;

    if (!subscription || !subscription.endpoint || !subscription.keys) {
      return res.status(400).json({
        success: false,
        error: 'Invalid subscription data',
      });
    }

    // Determine user role from the token
    const userRole = req.user.role || 'member';

    // Create or update the push subscription
    const pushSubscription = await PushSubscription.createOrUpdate(
      req.user.id,
      userRole,
      subscription,
      deviceInfo
    );

    res.status(200).json({
      success: true,
      message: 'Push notification subscription registered successfully',
      data: {
        subscriptionId: pushSubscription._id,
        active: pushSubscription.active,
      },
    });
  } catch (error) {
    console.error('Error registering push subscription:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to register push subscription',
    });
  }
});

module.exports = router;
