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
  creatorRegister 
} = require('../controllers/auth.controller');
const { protect } = require('../middleware/auth.middleware');
const { 
  validateMemberRegistration, 
  validateCreatorRegistration, 
  validateLogin 
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
      return res.json({ success: false, error: 'User not found', step: 'database_query' });
    }
    
    console.log('🧪 TEST LOGIN: Testing password...');
    const isMatch = await user.matchPassword(password);
    console.log('🧪 TEST LOGIN: Password match:', isMatch);
    
    return res.json({ 
      success: true, 
      step: 'password_check', 
      userExists: true, 
      passwordMatch: isMatch 
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

module.exports = router;