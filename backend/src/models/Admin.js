const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const adminSchema = new mongoose.Schema({
  email: {
    type: String,
    required: [true, 'Please provide an email'],
    unique: true,
    lowercase: true,
    match: [
      /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
      'Please provide a valid email'
    ]
  },
  password: {
    type: String,
    required: [true, 'Please provide a password'],
    minlength: 8,
    select: false
  },
  name: {
    type: String,
    required: [true, 'Please provide a name']
  },
  role: {
    type: String,
    enum: ['superAdmin', 'moderator', 'verificationStaff'],
    default: 'moderator'
  },
  permissions: {
    canDeleteUsers: {
      type: Boolean,
      default: false
    },
    canManageAdmins: {
      type: Boolean,
      default: false
    },
    canAccessFinancials: {
      type: Boolean,
      default: false
    },
    canModifyPolicies: {
      type: Boolean,
      default: false
    },
    canReviewContent: {
      type: Boolean,
      default: true
    },
    canSuspendUsers: {
      type: Boolean,
      default: true
    },
    canRemoveContent: {
      type: Boolean,
      default: true
    },
    canApproveIDs: {
      type: Boolean,
      default: false
    }
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastLogin: Date,
  loginAttempts: {
    type: Number,
    default: 0
  },
  lockUntil: Date,
  twoFactorSecret: String,
  twoFactorEnabled: {
    type: Boolean,
    default: false
  },
  actionsLog: [{
    action: String,
    targetUser: {
      type: mongoose.Schema.Types.ObjectId,
      refPath: 'targetUserModel'
    },
    targetUserModel: {
      type: String,
      enum: ['User', 'Creator', 'Member']
    },
    targetContent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Content'
    },
    reason: String,
    timestamp: {
      type: Date,
      default: Date.now
    }
  }],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin'
  }
}, {
  timestamps: true
});

// Virtual for account lock
adminSchema.virtual('isLocked').get(function() {
  return !!(this.lockUntil && this.lockUntil > Date.now());
});

// Encrypt password before saving
adminSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    next();
  }
  
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Match password
adminSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Sign JWT
adminSchema.methods.getSignedJwtToken = function() {
  return jwt.sign(
    { 
      id: this._id,
      role: this.role,
      type: 'admin'
    },
    process.env.JWT_SECRET,
    {
      expiresIn: process.env.JWT_ADMIN_EXPIRE || '8h'
    }
  );
};

// Handle failed login attempts
adminSchema.methods.incLoginAttempts = function() {
  // Reset attempts if lock has expired
  if (this.lockUntil && this.lockUntil < Date.now()) {
    return this.updateOne({
      $set: { loginAttempts: 1 },
      $unset: { lockUntil: 1 }
    });
  }
  
  const updates = { $inc: { loginAttempts: 1 } };
  const maxAttempts = 5;
  const lockTime = 2 * 60 * 60 * 1000; // 2 hours
  
  if (this.loginAttempts + 1 >= maxAttempts && !this.isLocked) {
    updates.$set = { lockUntil: Date.now() + lockTime };
  }
  
  return this.updateOne(updates);
};

// Reset login attempts
adminSchema.methods.resetLoginAttempts = function() {
  return this.updateOne({
    $set: { loginAttempts: 0 },
    $unset: { lockUntil: 1 }
  });
};

// Set permissions based on role
adminSchema.methods.setRolePermissions = function() {
  switch(this.role) {
    case 'superAdmin':
      this.permissions = {
        canDeleteUsers: true,
        canManageAdmins: true,
        canAccessFinancials: true,
        canModifyPolicies: true,
        canReviewContent: true,
        canSuspendUsers: true,
        canRemoveContent: true,
        canApproveIDs: true
      };
      break;
    case 'moderator':
      this.permissions = {
        canDeleteUsers: false,
        canManageAdmins: false,
        canAccessFinancials: false,
        canModifyPolicies: false,
        canReviewContent: true,
        canSuspendUsers: true,
        canRemoveContent: true,
        canApproveIDs: false
      };
      break;
    case 'verificationStaff':
      this.permissions = {
        canDeleteUsers: false,
        canManageAdmins: false,
        canAccessFinancials: false,
        canModifyPolicies: false,
        canReviewContent: false,
        canSuspendUsers: false,
        canRemoveContent: false,
        canApproveIDs: true
      };
      break;
  }
};

// Log admin action
adminSchema.methods.logAction = async function(action, targetUser, targetUserModel, targetContent, reason) {
  this.actionsLog.push({
    action,
    targetUser,
    targetUserModel,
    targetContent,
    reason,
    timestamp: new Date()
  });
  
  // Keep only last 1000 actions in the log
  if (this.actionsLog.length > 1000) {
    this.actionsLog = this.actionsLog.slice(-1000);
  }
  
  await this.save();
};

module.exports = mongoose.model('Admin', adminSchema);