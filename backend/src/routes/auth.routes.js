const router = require('express').Router();
const { 
  register, 
  login, 
  logout, 
  getMe, 
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

// Creator routes  
router.post('/creator/register', validateCreatorRegistration, creatorRegister);
router.post('/creator/login', validateLogin, creatorLogin);

// Protected routes
router.get('/me', protect, getMe);
router.post('/logout', protect, logout);
router.put('/updatepassword', protect, updatePassword);

module.exports = router;