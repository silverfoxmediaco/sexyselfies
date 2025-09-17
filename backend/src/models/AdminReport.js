const mongoose = require('mongoose');

const adminReportSchema = new mongoose.Schema(
  {
    // Link to existing report if applicable
    originalReport: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Report',
    },
    reportedContent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Content',
    },
    reportedUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    reportedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    reportType: {
      type: String,
      enum: [
        'inappropriate_content',
        'underage',
        'harassment',
        'spam',
        'fake_account',
        'violence',
        'self_harm',
        'hate_speech',
        'copyright',
        'terms_violation',
        'manual_review',
        'ai_flagged',
        'other',
      ],
      required: true,
    },
    severity: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical'],
      default: 'medium',
    },
    status: {
      type: String,
      enum: [
        'pending',
        'under_review',
        'resolved',
        'dismissed',
        'escalated',
        'appealed',
      ],
      default: 'pending',
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Admin',
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Admin',
    },
    reviewStartedAt: Date,
    reviewCompletedAt: Date,
    decision: {
      action: {
        type: String,
        enum: [
          'no_action',
          'content_removed',
          'content_hidden',
          'user_warned',
          'user_suspended_24h',
          'user_suspended_7d',
          'user_suspended_30d',
          'user_banned',
          'payout_frozen',
          'false_report',
          'reporter_warned',
        ],
      },
      reason: String,
      details: String,
      evidenceUrls: [String],
    },
    strikes: {
      issued: {
        type: Boolean,
        default: false,
      },
      count: {
        type: Number,
        default: 0,
      },
    },
    notifications: {
      userNotified: {
        type: Boolean,
        default: false,
      },
      userNotifiedAt: Date,
      reporterNotified: {
        type: Boolean,
        default: false,
      },
      reporterNotifiedAt: Date,
    },
    appeal: {
      allowed: {
        type: Boolean,
        default: true,
      },
      deadline: Date,
      submitted: {
        type: Boolean,
        default: false,
      },
      submittedAt: Date,
      reason: String,
      reviewedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Admin',
      },
      decision: {
        type: String,
        enum: ['pending', 'upheld', 'overturned', 'partially_overturned'],
      },
      decisionDate: Date,
      decisionReason: String,
    },
    metadata: {
      source: {
        type: String,
        enum: [
          'user_report',
          'ai_detection',
          'manual_review',
          'automated_scan',
        ],
        default: 'user_report',
      },
      aiConfidence: Number,
      previousViolations: Number,
      relatedReports: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'AdminReport',
        },
      ],
    },
    internalNotes: [
      {
        admin: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Admin',
        },
        note: String,
        timestamp: {
          type: Date,
          default: Date.now,
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Indexes for performance
adminReportSchema.index({ status: 1, severity: -1, createdAt: -1 });
adminReportSchema.index({ reportedUser: 1, status: 1 });
adminReportSchema.index({ assignedTo: 1, status: 1 });
adminReportSchema.index({ 'appeal.deadline': 1 });
adminReportSchema.index({ 'metadata.source': 1 });

// Auto-set severity based on report type
adminReportSchema.pre('save', function (next) {
  if (this.isNew) {
    // Set severity
    switch (this.reportType) {
      case 'underage':
      case 'self_harm':
      case 'violence':
        this.severity = 'critical';
        break;
      case 'hate_speech':
      case 'harassment':
        this.severity = 'high';
        break;
      case 'inappropriate_content':
      case 'fake_account':
      case 'terms_violation':
        this.severity = 'medium';
        break;
      default:
        this.severity = 'low';
    }

    // Set appeal deadline if action taken
    if (
      this.decision &&
      this.decision.action &&
      this.decision.action !== 'no_action' &&
      this.decision.action !== 'false_report'
    ) {
      this.appeal.deadline = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
    }
  }
  next();
});

// Methods
adminReportSchema.methods.assign = async function (adminId) {
  this.assignedTo = adminId;
  this.status = 'under_review';
  this.reviewStartedAt = new Date();
  return this.save();
};

adminReportSchema.methods.resolve = async function (adminId, decision) {
  this.reviewedBy = adminId;
  this.reviewCompletedAt = new Date();
  this.status = 'resolved';
  this.decision = decision;

  // Set appeal deadline for serious actions
  const seriousActions = [
    'user_suspended_7d',
    'user_suspended_30d',
    'user_banned',
    'content_removed',
  ];
  if (seriousActions.includes(decision.action)) {
    this.appeal.allowed = true;
    this.appeal.deadline = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  }

  return this.save();
};

adminReportSchema.methods.addNote = async function (adminId, note) {
  this.internalNotes.push({
    admin: adminId,
    note: note,
    timestamp: new Date(),
  });
  return this.save();
};

// Static methods for dashboard
adminReportSchema.statics.getDashboardStats = async function () {
  const stats = await this.aggregate([
    {
      $facet: {
        byStatus: [{ $group: { _id: '$status', count: { $sum: 1 } } }],
        bySeverity: [
          { $match: { status: 'pending' } },
          { $group: { _id: '$severity', count: { $sum: 1 } } },
        ],
        last24Hours: [
          {
            $match: {
              createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
            },
          },
          { $count: 'total' },
        ],
        criticalPending: [
          { $match: { status: 'pending', severity: 'critical' } },
          { $count: 'total' },
        ],
      },
    },
  ]);

  return stats[0];
};

module.exports = mongoose.model('AdminReport', adminReportSchema);
