const mongoose = require('mongoose');

const userViolationSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    userType: {
      type: String,
      enum: ['creator', 'member'],
      required: true,
    },
    violations: [
      {
        reportId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'AdminReport',
        },
        type: {
          type: String,
          enum: [
            'content_violation',
            'harassment',
            'spam',
            'fake_account',
            'underage_content',
            'copyright',
            'violence',
            'hate_speech',
            'terms_violation',
            'payment_fraud',
            'ban_evasion',
            'other',
          ],
          required: true,
        },
        severity: {
          type: String,
          enum: ['minor', 'moderate', 'major', 'severe'],
          required: true,
        },
        description: String,
        contentRemoved: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Content',
        },
        issuedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Admin',
          required: true,
        },
        issuedAt: {
          type: Date,
          default: Date.now,
        },
        expiresAt: Date,
        appealed: {
          type: Boolean,
          default: false,
        },
        appealOverturned: {
          type: Boolean,
          default: false,
        },
      },
    ],
    strikes: {
      current: {
        type: Number,
        default: 0,
        min: 0,
        max: 3,
      },
      total: {
        type: Number,
        default: 0,
      },
      history: [
        {
          count: Number,
          reason: String,
          issuedAt: Date,
          expiresAt: Date,
          expired: {
            type: Boolean,
            default: false,
          },
        },
      ],
    },
    suspensions: [
      {
        type: {
          type: String,
          enum: ['temporary', 'permanent'],
          required: true,
        },
        duration: Number, // in hours
        reason: String,
        startDate: {
          type: Date,
          default: Date.now,
        },
        endDate: Date,
        issuedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Admin',
        },
        lifted: {
          type: Boolean,
          default: false,
        },
        liftedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Admin',
        },
        liftedAt: Date,
        liftReason: String,
      },
    ],
    currentStatus: {
      type: String,
      enum: ['good_standing', 'warned', 'suspended', 'banned', 'under_review'],
      default: 'good_standing',
    },
    suspendedUntil: Date,
    bannedAt: Date,
    banReason: String,
    bannedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Admin',
    },
    restrictions: {
      canUploadContent: {
        type: Boolean,
        default: true,
      },
      canMessage: {
        type: Boolean,
        default: true,
      },
      canComment: {
        type: Boolean,
        default: true,
      },
      canWithdraw: {
        type: Boolean,
        default: true,
      },
      payoutsFrozen: {
        type: Boolean,
        default: false,
      },
      frozenUntil: Date,
      frozenAmount: {
        type: Number,
        default: 0,
      },
    },
    warnings: [
      {
        message: String,
        severity: {
          type: String,
          enum: ['info', 'caution', 'final'],
          default: 'caution',
        },
        issuedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Admin',
        },
        issuedAt: {
          type: Date,
          default: Date.now,
        },
        acknowledged: {
          type: Boolean,
          default: false,
        },
        acknowledgedAt: Date,
      },
    ],
    riskScore: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    notes: [
      {
        admin: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Admin',
        },
        note: String,
        date: {
          type: Date,
          default: Date.now,
        },
        private: {
          type: Boolean,
          default: true,
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Indexes
// Note: 'user' field already has index via unique: true
userViolationSchema.index({ currentStatus: 1 });
userViolationSchema.index({ 'strikes.current': 1 });
userViolationSchema.index({ suspendedUntil: 1 });
userViolationSchema.index({ riskScore: -1 });

// Virtual to check if user is currently suspended
userViolationSchema.virtual('isSuspended').get(function () {
  return this.suspendedUntil && this.suspendedUntil > new Date();
});

// Virtual to check if user is banned
userViolationSchema.virtual('isBanned').get(function () {
  return this.currentStatus === 'banned';
});

// Method to add a strike
userViolationSchema.methods.addStrike = async function (
  reason,
  adminId,
  duration = 90
) {
  this.strikes.current += 1;
  this.strikes.total += 1;

  const expiresAt = new Date(Date.now() + duration * 24 * 60 * 60 * 1000);

  this.strikes.history.push({
    count: this.strikes.current,
    reason: reason,
    issuedAt: new Date(),
    expiresAt: expiresAt,
    expired: false,
  });

  // Auto-suspend based on strikes
  if (this.strikes.current === 1) {
    this.currentStatus = 'warned';
  } else if (this.strikes.current === 2) {
    await this.suspend(7 * 24, 'Second strike - 7 day suspension', adminId);
  } else if (this.strikes.current >= 3) {
    await this.ban('Three strikes - permanent ban', adminId);
  }

  await this.calculateRiskScore();
  return this.save();
};

// Method to suspend user
userViolationSchema.methods.suspend = async function (hours, reason, adminId) {
  const endDate = new Date(Date.now() + hours * 60 * 60 * 1000);

  this.suspensions.push({
    type: 'temporary',
    duration: hours,
    reason: reason,
    startDate: new Date(),
    endDate: endDate,
    issuedBy: adminId,
  });

  this.currentStatus = 'suspended';
  this.suspendedUntil = endDate;

  // Apply restrictions
  this.restrictions.canUploadContent = false;
  this.restrictions.canMessage = false;
  this.restrictions.canComment = false;

  await this.calculateRiskScore();
  return this.save();
};

// Method to ban user
userViolationSchema.methods.ban = async function (reason, adminId) {
  this.currentStatus = 'banned';
  this.bannedAt = new Date();
  this.banReason = reason;
  this.bannedBy = adminId;

  // Apply all restrictions
  this.restrictions.canUploadContent = false;
  this.restrictions.canMessage = false;
  this.restrictions.canComment = false;
  this.restrictions.canWithdraw = false;
  this.restrictions.payoutsFrozen = true;

  this.riskScore = 100;

  return this.save();
};

// Method to lift suspension
userViolationSchema.methods.liftSuspension = async function (adminId, reason) {
  if (this.currentStatus === 'suspended' && this.suspensions.length > 0) {
    const currentSuspension = this.suspensions[this.suspensions.length - 1];
    currentSuspension.lifted = true;
    currentSuspension.liftedBy = adminId;
    currentSuspension.liftedAt = new Date();
    currentSuspension.liftReason = reason;

    this.currentStatus = this.strikes.current > 0 ? 'warned' : 'good_standing';
    this.suspendedUntil = null;

    // Restore some restrictions
    this.restrictions.canUploadContent = true;
    this.restrictions.canMessage = true;
    this.restrictions.canComment = true;

    await this.calculateRiskScore();
    return this.save();
  }
};

// Method to add warning
userViolationSchema.methods.addWarning = async function (
  message,
  severity,
  adminId
) {
  this.warnings.push({
    message: message,
    severity: severity,
    issuedBy: adminId,
    issuedAt: new Date(),
  });

  if (this.currentStatus === 'good_standing') {
    this.currentStatus = 'warned';
  }

  await this.calculateRiskScore();
  return this.save();
};

// Method to freeze payouts
userViolationSchema.methods.freezePayouts = async function (days, adminId) {
  this.restrictions.payoutsFrozen = true;
  this.restrictions.frozenUntil = new Date(
    Date.now() + days * 24 * 60 * 60 * 1000
  );

  // Note: Actual frozen amount should be calculated from transactions
  return this.save();
};

// Method to calculate risk score
userViolationSchema.methods.calculateRiskScore = async function () {
  let score = 0;

  // Base score from violations
  score += this.violations.length * 10;

  // Strike multiplier
  score += this.strikes.current * 20;

  // Recent violations (last 30 days) weighted more
  const recentViolations = this.violations.filter(
    v => v.issuedAt > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
  );
  score += recentViolations.length * 15;

  // Severity weights
  this.violations.forEach(v => {
    switch (v.severity) {
      case 'severe':
        score += 25;
        break;
      case 'major':
        score += 15;
        break;
      case 'moderate':
        score += 10;
        break;
      case 'minor':
        score += 5;
        break;
    }
  });

  // Status modifier
  if (this.currentStatus === 'banned') score = 100;
  else if (this.currentStatus === 'suspended') score = Math.max(score, 75);

  this.riskScore = Math.min(score, 100);
  return this.save();
};

// Method to check and expire old strikes
userViolationSchema.methods.checkExpiredStrikes = async function () {
  let strikesRemoved = false;

  this.strikes.history.forEach(strike => {
    if (!strike.expired && strike.expiresAt < new Date()) {
      strike.expired = true;
      if (this.strikes.current > 0) {
        this.strikes.current -= 1;
        strikesRemoved = true;
      }
    }
  });

  if (strikesRemoved) {
    if (this.strikes.current === 0 && this.currentStatus === 'warned') {
      this.currentStatus = 'good_standing';
    }
    await this.calculateRiskScore();
    return this.save();
  }
};

// Static method to get high-risk users
userViolationSchema.statics.getHighRiskUsers = async function (limit = 10) {
  return this.find({ riskScore: { $gte: 70 } })
    .sort('-riskScore')
    .limit(limit)
    .populate('user', 'email role');
};

module.exports = mongoose.model('UserViolation', userViolationSchema);
