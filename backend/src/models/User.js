const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: [true, 'Please provide an email'],
      unique: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email'],
    },
    password: {
      type: String,
      required: [true, 'Please provide a password'],
      minlength: 6,
      select: false,
    },
    role: {
      type: String,
      enum: ['member', 'creator', 'admin'],
      default: 'member',
    },
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    emailVerificationToken: String,
    emailVerificationExpire: Date,
    passwordResetToken: String,
    passwordResetExpire: Date,
    isActive: {
      type: Boolean,
      default: true,
    },
    lastLogin: Date,
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    return next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Compare password method with timeout protection
userSchema.methods.matchPassword = async function (enteredPassword) {
  try {
    // Add timeout protection for bcrypt compare
    const comparePromise = bcrypt.compare(enteredPassword, this.password);
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Password comparison timeout')), 5000)
    );

    return await Promise.race([comparePromise, timeoutPromise]);
  } catch (error) {
    console.error('Password comparison error:', error.message);
    return false; // Fail secure - return false on timeout or error
  }
};

// Generate JWT token (legacy - without session)
userSchema.methods.getSignedJwtToken = function () {
  return jwt.sign({ id: this._id, role: this.role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '7d',
  });
};

// Generate JWT token with session ID (new method)
userSchema.methods.getSignedJwtTokenWithSession = function (sessionId) {
  return jwt.sign(
    {
      id: this._id,
      role: this.role,
      sessionId: sessionId,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: process.env.JWT_EXPIRE || '7d',
    }
  );
};

module.exports = mongoose.model('User', userSchema);
