const mongoose = require('mongoose');
const User = require('../models/User');
const Creator = require('../models/Creator');
const Member = require('../models/Member');
const CreatorProfile = require('../models/CreatorProfile');
const crypto = require('crypto');
const { sendVerificationEmail } = require('../services/notification.service');

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    console.log('Registration request received:', {
      body: req.body,
      headers: req.headers,
      path: req.path
    });
    
    const { email, password, username, displayName, phone, birthDate, agreeToTerms } = req.body;

    // Validate required fields for members
    if (!email || !password || !username || !birthDate || !agreeToTerms) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        success: false,
        error: 'Email, password, username, birth date, and terms agreement are required'
      });
    }

    // Age verification - must be 18+
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }

    if (age < 18) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        success: false,
        error: 'You must be at least 18 years old to join'
      });
    }

    // Check if user exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        success: false,
        error: 'Email already registered'
      });
    }

    // Check if username is taken
    const usernameExists = await Member.findOne({ username });
    if (usernameExists) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        success: false,
        error: 'Username already taken'
      });
    }

    // Create user (member role) with transaction
    const user = await User.create([{
      email,
      password,
      role: 'member',
      isEmailVerified: false
    }], { session });

    // Create member profile with transaction
    await Member.create([{
      user: user[0]._id,
      username,
      displayName: displayName || username,
      birthDate: new Date(birthDate),
      phone: phone || undefined,
      agreeToTerms: true,
      profileComplete: false
    }], { session });

    // Commit transaction
    await session.commitTransaction();
    session.endSession();

    // Send welcome email with login link (outside transaction)
    try {
      await sendVerificationEmail(email, null, username);
    } catch (emailError) {
      console.error('Failed to send welcome email:', emailError);
    }

    // Return success - no token, they need to login
    res.status(201).json({
      success: true,
      message: 'Registration successful! Please check your email and then login to complete your profile.',
      redirectTo: '/member/login'
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Registration failed. Please try again.'
    });
  }
};

// @desc    Register creator
// @route   POST /api/auth/creator/register
// @access  Public
exports.creatorRegister = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    const { 
      email, 
      password, 
      username, 
      displayName, 
      birthDate, 
      country,
      agreeToTerms,
      agreeToContentPolicy,
      over18Confirmation,
      taxInfoConsent 
    } = req.body;

    // Validate required fields for creators
    if (!email || !password || !displayName || !birthDate || 
        !agreeToTerms || !agreeToContentPolicy || !over18Confirmation) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        success: false,
        error: 'All required fields must be provided'
      });
    }

    // Age verification - must be 18+
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }

    if (age < 18) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        success: false,
        error: 'You must be at least 18 years old to become a creator'
      });
    }

    // Check if user exists with this email
    const userExists = await User.findOne({ email });
    if (userExists) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        success: false,
        error: 'Email already registered. Please login or use a different email.'
      });
    }

    // Check if displayName is taken by another creator
    const creatorExists = await Creator.findOne({ displayName });
    if (creatorExists) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        success: false,
        error: 'Display name already taken. Please choose a different name.'
      });
    }

    // Create user with creator role (with transaction)
    const user = await User.create([{
      email,
      password,
      role: 'creator',
      isEmailVerified: false
    }], { session });

    // Create creator profile (with transaction)
    const creator = await Creator.create([{
      user: user[0]._id,
      displayName,
      bio: '',
      profileImage: 'default-avatar.jpg',
      coverImage: '',
      contentPrice: 2.99,
      isVerified: false,
      verificationStatus: 'pending',
      verificationDocuments: [],
      stats: {
        totalEarnings: 0,
        monthlyEarnings: 0,
        totalMatches: 0,
        totalLikes: 0,
        rating: 0,
        ratingCount: 0
      },
      preferences: {
        minAge: 18,
        maxAge: 99,
        interestedIn: ['everyone']
      },
      location: {
        country: country || 'United States'
      },
      isPaused: false
    }], { session });

    // Commit transaction
    await session.commitTransaction();
    session.endSession();

    // Send verification email (outside transaction)
    try {
      await sendVerificationEmail(email, null, displayName);
    } catch (emailError) {
      console.error('Failed to send welcome email to creator:', emailError);
    }

    // Create response data
    const additionalData = {
      message: 'Creator registration successful! Please complete ID verification to start earning.',
      redirectTo: '/creator/verify-id',
      profileComplete: false,
      isVerified: false,
      needsIdVerification: true,
      creatorId: creator[0]._id
    };

    // Send token response (logs them in immediately)
    sendTokenResponse(user[0], 201, res, additionalData);
    
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.error('Creator registration error:', error);
    
    // Send appropriate error message
    let errorMessage = 'Registration failed. Please try again.';
    
    if (error.message && error.message.includes('duplicate key')) {
      if (error.message.includes('email')) {
        errorMessage = 'This email is already registered';
      } else if (error.message.includes('displayName')) {
        errorMessage = 'This display name is already taken';
      }
    } else if (error.message && error.message.includes('validation failed')) {
      errorMessage = 'Please check all required fields and try again';
    }
    
    res.status(500).json({
      success: false,
      error: errorMessage
    });
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Validate email & password
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Please provide an email and password'
      });
    }

    // Check for user
    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials'
      });
    }

    // Check if password matches
    const isMatch = await user.matchPassword(password);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials'
      });
    }

    // Check if user is active
    if (user.isActive === false) {
      return res.status(401).json({
        success: false,
        error: 'Account is deactivated. Please contact support.'
      });
    }

    // Update last login and mark email as verified
    user.lastLogin = Date.now();
    user.isEmailVerified = true;
    await user.save();

    // For creators, check profile completion and verification status
    let additionalData = {};
    
    if (user.role === 'creator') {
      const creator = await Creator.findOne({ user: user._id });
      
      if (creator) {
        additionalData.profileComplete = creator.profileComplete || false;
        additionalData.isVerified = creator.isVerified || false;
        additionalData.needsIdVerification = !creator.idVerificationSubmitted;
        
        // Check if CreatorProfile exists for more detailed completion status
        const creatorProfile = await CreatorProfile.findOne({ creator: creator._id });
        if (!creatorProfile && creator.isVerified) {
          additionalData.profileComplete = false;
        }
        
        // Determine redirect path
        if (additionalData.needsIdVerification) {
          additionalData.redirectTo = '/creator/verify-id';
        } else if (!additionalData.isVerified) {
          additionalData.redirectTo = '/creator/verification-pending';
        } else if (!additionalData.profileComplete) {
          additionalData.redirectTo = '/creator/profile-setup';
        } else {
          additionalData.redirectTo = '/creator/dashboard';
        }
      } else {
        // Creator profile doesn't exist, create it
        await Creator.create({
          user: user._id,
          displayName: user.email.split('@')[0],
          bio: '',
          contentPrice: 2.99,
          isVerified: false,
          profileComplete: false,
          idVerificationSubmitted: false
        });
        additionalData.profileComplete = false;
        additionalData.isVerified = false;
        additionalData.needsIdVerification = true;
        additionalData.redirectTo = '/creator/verify-id';
      }
    } else if (user.role === 'member') {
      const member = await Member.findOne({ user: user._id });
      if (member) {
        if (!member.profileComplete) {
          additionalData.redirectTo = '/member/filters';
          additionalData.profileComplete = false;
          additionalData.isFirstTimeSetup = true;
        } else {
          additionalData.redirectTo = '/member/browse-creators';
          additionalData.profileComplete = true;
        }
        additionalData.credits = member.credits;
        additionalData.username = member.username;
      } else {
        additionalData.redirectTo = '/member/profile-setup';
        additionalData.profileComplete = false;
      }
    } else if (user.role === 'admin') {
      additionalData.redirectTo = '/admin';
    }

    sendTokenResponse(user, 200, res, additionalData);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// @desc    Login creator specifically
// @route   POST /api/auth/creator/login
// @access  Public
exports.creatorLogin = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Validate email & password
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Please provide an email and password'
      });
    }

    // Check for user with creator role
    const user = await User.findOne({ email, role: 'creator' }).select('+password');
    
    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Invalid creator credentials'
      });
    }

    // Check if password matches
    const isMatch = await user.matchPassword(password);
    
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials'
      });
    }

    // Check if user is active
    if (user.isActive === false) {
      return res.status(401).json({
        success: false,
        error: 'Account is deactivated. Please contact support.'
      });
    }

    // Check creator profile
    let creator = await Creator.findOne({ user: user._id });
    
    let profileComplete = false;
    let isVerified = false;
    let needsIdVerification = true;
    
    if (!creator) {
      // Create creator profile if it doesn't exist
      creator = await Creator.create({
        user: user._id,
        displayName: user.email.split('@')[0],
        bio: '',
        contentPrice: 2.99,
        isVerified: false,
        profileComplete: false,
        idVerificationSubmitted: false
      });
    } else {
      profileComplete = creator.profileComplete || false;
      isVerified = creator.isVerified || false;
      needsIdVerification = !creator.idVerificationSubmitted;
      
      // Check if CreatorProfile exists
      if (isVerified && !profileComplete) {
        const creatorProfile = await CreatorProfile.findOne({ creator: creator._id });
        if (!creatorProfile) {
          profileComplete = false;
        }
      }
    }

    // Update last login
    user.lastLogin = Date.now();
    await user.save();

    const additionalData = {
      profileComplete,
      isVerified,
      needsIdVerification,
      creatorId: creator._id
    };

    sendTokenResponse(user, 200, res, additionalData);
  } catch (error) {
    console.error('Creator login error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    
    let profile;
    let additionalData = {};
    
    if (user.role === 'creator') {
      profile = await Creator.findOne({ user: user._id });
      if (profile) {
        additionalData = {
          isVerified: profile.isVerified,
          profileComplete: profile.profileComplete,
          earnings: profile.totalEarnings || 0,
          contentCount: profile.contentCount || 0
        };
      }
    } else if (user.role === 'member') {
      profile = await Member.findOne({ user: user._id });
      if (profile) {
        additionalData = {
          credits: profile.credits,
          subscription: profile.subscriptionStatus
        };
      }
    }

    res.status(200).json({
      success: true,
      data: {
        user: {
          id: user._id,
          email: user.email,
          role: user.role,
          createdAt: user.createdAt,
          lastLogin: user.lastLogin,
          ...additionalData
        },
        profile
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// @desc    Log user out / clear cookie
// @route   POST /api/auth/logout
// @access  Private
exports.logout = async (req, res, next) => {
  res.cookie('token', 'none', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true
  });

  res.status(200).json({
    success: true,
    data: {}
  });
};

// @desc    Update password
// @route   PUT /api/auth/updatepassword
// @access  Private
exports.updatePassword = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).select('+password');

    // Check current password
    if (!(await user.matchPassword(req.body.currentPassword))) {
      return res.status(401).json({
        success: false,
        error: 'Password is incorrect'
      });
    }

    user.password = req.body.newPassword;
    await user.save();

    sendTokenResponse(user, 200, res);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Helper function to get token from model, create cookie and send response
const sendTokenResponse = (user, statusCode, res, additionalData = {}) => {
  // Create token
  const token = user.getSignedJwtToken();

  const options = {
    expires: new Date(
      Date.now() + 7 * 24 * 60 * 60 * 1000 // 7 days
    ),
    httpOnly: true
  };

  if (process.env.NODE_ENV === 'production') {
    options.secure = true;
  }

  const responseData = {
    success: true,
    token,
    user: {
      id: user._id,
      email: user.email,
      role: user.role
    },
    ...additionalData
  };

  res
    .status(statusCode)
    .cookie('token', token, options)
    .json(responseData);
};