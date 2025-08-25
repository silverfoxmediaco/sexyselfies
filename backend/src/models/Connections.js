// backend/src/models/Connections.js
const mongoose = require('mongoose');

const connectionSchema = new mongoose.Schema({
  member: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Member',
    required: true
  },
  creator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Creator',
    required: true
  },
  
  // Connection status
  status: {
    type: String,
    enum: ['pending', 'active', 'rejected', 'expired', 'blocked'],
    default: 'pending'
  },
  
  // Connection type/tier
  connectionType: {
    type: String,
    enum: ['basic', 'verified', 'premium'],
    default: 'basic'
  },
  
  // Member actions
  memberLiked: {
    type: Boolean,
    default: false
  },
  memberSuperLiked: {
    type: Boolean,
    default: false
  },
  
  // Creator actions
  creatorLiked: {
    type: Boolean,
    default: false
  },
  creatorAccepted: {
    type: Boolean,
    default: false
  },
  
  // Connection established
  isConnected: {
    type: Boolean,
    default: false
  },
  connectedAt: Date,
  
  // Messaging
  lastMessage: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message'
  },
  lastMessagePreview: {
    content: String,
    sender: String,
    createdAt: Date
  },
  messageCount: {
    type: Number,
    default: 0
  },
  unreadCount: {
    member: {
      type: Number,
      default: 0
    },
    creator: {
      type: Number,
      default: 0
    }
  },
  
  // Financial tracking
  totalSpent: {
    type: Number,
    default: 0
  },
  subscriptionAmount: {
    type: Number,
    default: 0
  },
  tipsAmount: {
    type: Number,
    default: 0
  },
  
  // Content tracking
  contentUnlocked: {
    type: Number,
    default: 0
  },
  specialOffers: {
    type: Number,
    default: 0
  },
  
  // Connection features
  isPinned: {
    type: Boolean,
    default: false
  },
  isArchived: {
    type: Boolean,
    default: false
  },
  isMuted: {
    type: Boolean,
    default: false
  },
  
  // Connection state
  isActive: {
    type: Boolean,
    default: true
  },
  lastInteraction: {
    type: Date,
    default: Date.now
  },
  
  // Disconnection tracking
  disconnectedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  disconnectedAt: Date,
  disconnectReason: String
}, {
  timestamps: true
});

// Compound index to ensure unique member-creator pairs
connectionSchema.index({ member: 1, creator: 1 }, { unique: true });
// Index for finding connections
connectionSchema.index({ isConnected: 1, isActive: 1 });
connectionSchema.index({ status: 1, isActive: 1 });
// Index for user's connections
connectionSchema.index({ member: 1, isConnected: 1 });
connectionSchema.index({ creator: 1, isConnected: 1 });
// Index for sorting
connectionSchema.index({ isPinned: -1, lastInteraction: -1 });

// Method to establish connection (when both parties like)
connectionSchema.methods.establishConnection = function() {
  this.isConnected = true;
  this.status = 'active';
  this.connectedAt = Date.now();
  this.connectionType = this.memberSuperLiked ? 'premium' : 'verified';
  return this.save();
};

// Method to update last message
connectionSchema.methods.updateLastMessage = function(content, sender) {
  this.lastMessagePreview = {
    content: content.substring(0, 100),
    sender,
    createdAt: Date.now()
  };
  this.messageCount += 1;
  this.lastInteraction = Date.now();
  
  // Update unread count
  if (sender === 'member') {
    this.unreadCount.creator += 1;
  } else {
    this.unreadCount.member += 1;
  }
  
  return this.save();
};

// Method to mark messages as read
connectionSchema.methods.markAsRead = function(userRole) {
  if (userRole === 'member') {
    this.unreadCount.member = 0;
  } else {
    this.unreadCount.creator = 0;
  }
  return this.save();
};

// Method to add spending
connectionSchema.methods.addSpending = function(amount, type = 'tip') {
  this.totalSpent += amount;
  if (type === 'subscription') {
    this.subscriptionAmount += amount;
  } else if (type === 'tip') {
    this.tipsAmount += amount;
  }
  this.lastInteraction = Date.now();
  return this.save();
};

module.exports = mongoose.model('Connection', connectionSchema, 'matches');