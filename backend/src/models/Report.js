const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema(
  {
    reporter: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    reporterModel: {
      type: String,
      enum: ['Member', 'Creator'],
      required: true,
    },
    reported: {
      type: mongoose.Schema.Types.ObjectId,
      refPath: 'reportedModel',
    },
    reportedModel: {
      type: String,
      enum: ['User', 'Content', 'Message'],
      required: true,
    },
    reason: {
      type: String,
      enum: [
        'inappropriate_content',
        'harassment',
        'spam',
        'fake_profile',
        'underage',
        'copyright',
        'violence',
        'hate_speech',
        'other',
      ],
      required: true,
    },
    description: {
      type: String,
      required: [true, 'Please provide details about the report'],
      maxlength: [1000, 'Description cannot be more than 1000 characters'],
    },
    evidence: [
      {
        type: String, // URLs to screenshots or other evidence
      },
    ],
    status: {
      type: String,
      enum: ['pending', 'investigating', 'resolved', 'dismissed'],
      default: 'pending',
    },
    moderatorNotes: String,
    resolvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    resolvedAt: Date,
    actionTaken: {
      type: String,
      enum: [
        'none',
        'warning',
        'content_removed',
        'account_suspended',
        'account_banned',
      ],
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
reportSchema.index({ status: 1, createdAt: -1 });
reportSchema.index({ reporter: 1 });
reportSchema.index({ reported: 1 });
reportSchema.index({ reason: 1 });

module.exports = mongoose.model('Report', reportSchema);
