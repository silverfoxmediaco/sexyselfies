const mongoose = require('mongoose');

const payoutRequestSchema = new mongoose.Schema({
  creator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Creator',
    required: true,
    index: true
  },
  requestedAmount: {
    type: Number,
    required: true,
    min: 1
  },
  availableAmount: {
    type: Number,
    required: true,
    min: 0
  },
  paypalEmail: {
    type: String,
    required: true,
    match: [
      /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
      'Please provide a valid PayPal email'
    ]
  },
  status: {
    type: String,
    required: true,
    enum: ['pending', 'approved', 'processed', 'rejected', 'cancelled'],
    default: 'pending',
    index: true
  },
  message: {
    type: String,
    maxlength: 500
  },
  
  // Admin processing details
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin'
  },
  reviewedAt: Date,
  adminNotes: String,
  
  // Payout processing details
  processedAt: Date,
  paymentReference: String, // PayPal transaction ID or reference
  
  // Rejection details
  rejectionReason: String,
  rejectedAt: Date,
  
  // Email tracking
  adminNotificationSent: {
    type: Boolean,
    default: false
  },
  creatorNotificationSent: {
    type: Boolean,
    default: false
  },
  
  // Associated transactions
  transactions: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Transaction'
  }]
}, {
  timestamps: true
});

// Indexes for performance
payoutRequestSchema.index({ creator: 1, status: 1 });
payoutRequestSchema.index({ status: 1, createdAt: -1 });
payoutRequestSchema.index({ createdAt: -1 });

// Calculate earnings eligibility
payoutRequestSchema.methods.calculateEligibleAmount = async function() {
  const Transaction = require('./Transaction');
  
  const result = await Transaction.aggregate([
    {
      $match: {
        creator: this.creator,
        status: 'completed',
        payoutProcessed: false
      }
    },
    {
      $group: {
        _id: null,
        totalEarnings: { $sum: '$creatorEarnings' },
        transactionIds: { $push: '$_id' }
      }
    }
  ]);

  return result[0] || { totalEarnings: 0, transactionIds: [] };
};

// Send admin notification
payoutRequestSchema.methods.sendAdminNotification = async function() {
  const { createTransporter, sendPayoutRequestNotification } = require('../controllers/notification.controller');
  
  try {
    await sendPayoutRequestNotification({
      payoutRequest: this,
      type: 'new_request'
    });
    
    this.adminNotificationSent = true;
    await this.save();
  } catch (error) {
    console.error('Failed to send admin notification:', error);
  }
};

// Approve payout request
payoutRequestSchema.methods.approve = async function(adminId, notes = '') {
  this.status = 'approved';
  this.reviewedBy = adminId;
  this.reviewedAt = new Date();
  this.adminNotes = notes;
  
  return await this.save();
};

// Reject payout request
payoutRequestSchema.methods.reject = async function(adminId, reason) {
  this.status = 'rejected';
  this.reviewedBy = adminId;
  this.reviewedAt = new Date();
  this.rejectionReason = reason;
  this.rejectedAt = new Date();
  
  return await this.save();
};

// Mark as processed (after PayPal payment sent)
payoutRequestSchema.methods.markProcessed = async function(paymentReference = '') {
  const Transaction = require('./Transaction');
  
  this.status = 'processed';
  this.processedAt = new Date();
  this.paymentReference = paymentReference;
  
  // Mark associated transactions as payout processed
  if (this.transactions.length > 0) {
    await Transaction.updateMany(
      { _id: { $in: this.transactions } },
      { payoutProcessed: true }
    );
  }
  
  return await this.save();
};

// Virtual for display amount
payoutRequestSchema.virtual('displayAmount').get(function() {
  return `$${this.requestedAmount.toFixed(2)}`;
});

// Static method to get pending requests
payoutRequestSchema.statics.getPendingRequests = function() {
  return this.find({ status: 'pending' })
    .populate('creator', 'displayName profileImage')
    .populate('creator.user', 'email')
    .sort('-createdAt');
};

// Static method to get requests by status
payoutRequestSchema.statics.getByStatus = function(status) {
  return this.find({ status })
    .populate('creator', 'displayName profileImage')
    .populate('reviewedBy', 'name email')
    .sort('-createdAt');
};

module.exports = mongoose.model('PayoutRequest', payoutRequestSchema);