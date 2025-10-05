const mongoose = require('mongoose');

const conversationSchema = new mongoose.Schema(
  {
    participants: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          refPath: 'participants.userModel',
          required: true,
        },
        userModel: {
          type: String,
          enum: ['Member', 'Creator'],
          required: true,
        },
        role: {
          type: String,
          enum: ['member', 'creator'],
          required: true,
        },
        joinedAt: {
          type: Date,
          default: Date.now,
        },
        lastSeenAt: {
          type: Date,
          default: Date.now,
        },
        isActive: {
          type: Boolean,
          default: true,
        },
        notificationSettings: {
          muted: {
            type: Boolean,
            default: false,
          },
          mutedUntil: Date,
        },
      },
    ],
    lastMessage: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Message',
    },
    lastMessageAt: {
      type: Date,
      default: Date.now,
    },
    lastMessagePreview: {
      text: {
        type: String,
        maxlength: 100,
      },
      messageType: {
        type: String,
        enum: ['text', 'image', 'video', 'audio', 'tip'],
      },
      senderName: String,
      senderModel: {
        type: String,
        enum: ['Member', 'Creator'],
      },
    },
    unreadCount: {
      member: {
        type: Number,
        default: 0,
      },
      creator: {
        type: Number,
        default: 0,
      },
    },
    pinnedMessages: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Message',
      },
    ],
    conversationType: {
      type: String,
      enum: ['direct', 'group', 'broadcast'],
      default: 'direct',
    },
    settings: {
      autoDeleteMessages: {
        enabled: {
          type: Boolean,
          default: false,
        },
        deleteAfterHours: {
          type: Number,
          default: 24,
        },
      },
      allowedMessageTypes: {
        text: {
          type: Boolean,
          default: true,
        },
        media: {
          type: Boolean,
          default: true,
        },
        tips: {
          type: Boolean,
          default: true,
        },
      },
      minimumTipAmount: {
        type: Number,
        default: 1.00,
        min: 0.99,
      },
      welcomeMessage: {
        enabled: {
          type: Boolean,
          default: false,
        },
        text: {
          type: String,
          maxlength: 500,
        },
        media: {
          url: String,
          type: {
            type: String,
            enum: ['image', 'video'],
          },
        },
      },
    },
    metadata: {
      totalMessages: {
        type: Number,
        default: 0,
      },
      totalMediaShared: {
        type: Number,
        default: 0,
      },
      totalTipsAmount: {
        type: Number,
        default: 0,
      },
      totalUnlockedContent: {
        type: Number,
        default: 0,
      },
      firstMessageAt: Date,
    },
    restrictions: {
      isBlocked: {
        type: Boolean,
        default: false,
      },
      blockedBy: {
        type: mongoose.Schema.Types.ObjectId,
        refPath: 'restrictions.blockedByModel',
      },
      blockedByModel: {
        type: String,
        enum: ['Member', 'Creator'],
      },
      blockedAt: Date,
      blockedReason: String,
      isRestricted: {
        type: Boolean,
        default: false,
      },
      restrictedUntil: Date,
      restrictionReason: String,
    },
    subscription: {
      isSubscriptionRequired: {
        type: Boolean,
        default: false,
      },
      subscriptionTier: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'SubscriptionTier',
      },
      freeMessagesRemaining: {
        type: Number,
        default: 0,
      },
      trialPeriod: {
        isActive: {
          type: Boolean,
          default: false,
        },
        endsAt: Date,
      },
    },
    customization: {
      theme: {
        type: String,
        enum: ['default', 'dark', 'custom'],
        default: 'default',
      },
      backgroundColor: String,
      textColor: String,
      nickname: {
        member: String,
        creator: String,
      },
      emoji: {
        type: String,
        default: '💬',
      },
    },
    tags: [
      {
        type: String,
        trim: true,
      },
    ],
    priority: {
      type: String,
      enum: ['normal', 'important', 'vip'],
      default: 'normal',
    },
    isArchived: {
      member: {
        type: Boolean,
        default: false,
      },
      creator: {
        type: Boolean,
        default: false,
      },
    },
    archivedAt: {
      member: Date,
      creator: Date,
    },
    isDeleted: {
      member: {
        type: Boolean,
        default: false,
      },
      creator: {
        type: Boolean,
        default: false,
      },
    },
    deletedAt: {
      member: Date,
      creator: Date,
    },
    reportedBy: [
      {
        reporter: {
          type: mongoose.Schema.Types.ObjectId,
          refPath: 'reportedBy.reporterModel',
        },
        reporterModel: {
          type: String,
          enum: ['Member', 'Creator', 'Admin'],
        },
        reason: String,
        reportedAt: {
          type: Date,
          default: Date.now,
        },
        status: {
          type: String,
          enum: ['pending', 'reviewed', 'resolved'],
          default: 'pending',
        },
      },
    ],
    moderationStatus: {
      type: String,
      enum: ['active', 'flagged', 'suspended', 'banned'],
      default: 'active',
    },
    moderationNotes: String,
    searchableText: {
      type: String,
      select: false,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for performance
conversationSchema.index({ 'participants.user': 1, 'participants.userModel': 1 });
conversationSchema.index({ lastMessageAt: -1 });
conversationSchema.index({ 'unreadCount.member': 1 });
conversationSchema.index({ 'unreadCount.creator': 1 });
conversationSchema.index({ 'isArchived.member': 1, 'isArchived.creator': 1 });
conversationSchema.index({ priority: 1, lastMessageAt: -1 });
conversationSchema.index({ moderationStatus: 1 });
conversationSchema.index({ searchableText: 'text' });
conversationSchema.index({ tags: 1 });

// Compound index for finding conversations between specific users
conversationSchema.index({
  'participants.user': 1,
  'participants.userModel': 1,
  conversationType: 1,
});

// Virtual to check if conversation has unread messages
conversationSchema.virtual('hasUnread').get(function () {
  return this.unreadCount.member > 0 || this.unreadCount.creator > 0;
});

// Virtual to get participant count
conversationSchema.virtual('participantCount').get(function () {
  return this.participants.filter(p => p.isActive).length;
});

// Method to get participant info
conversationSchema.methods.getParticipant = function (userId, userModel) {
  return this.participants.find(
    p => p.user.toString() === userId.toString() && p.userModel === userModel
  );
};

// Method to update last seen
conversationSchema.methods.updateLastSeen = function (userId, userModel) {
  const participant = this.getParticipant(userId, userModel);
  if (participant) {
    participant.lastSeenAt = new Date();
    return this.save();
  }
  return Promise.resolve(this);
};

// Method to mute conversation
conversationSchema.methods.toggleMute = function (userId, userModel, duration) {
  const participant = this.getParticipant(userId, userModel);
  if (participant) {
    participant.notificationSettings.muted = !participant.notificationSettings.muted;
    if (duration && participant.notificationSettings.muted) {
      participant.notificationSettings.mutedUntil = new Date(Date.now() + duration);
    } else {
      participant.notificationSettings.mutedUntil = null;
    }
    return this.save();
  }
  return Promise.resolve(this);
};

// Method to archive conversation
conversationSchema.methods.toggleArchive = function (userId, userModel) {
  const participant = this.getParticipant(userId, userModel);
  if (participant) {
    const role = participant.role === 'member' ? 'member' : 'creator';
    this.isArchived[role] = !this.isArchived[role];
    this.archivedAt[role] = this.isArchived[role] ? new Date() : null;
    return this.save();
  }
  return Promise.resolve(this);
};

// Method to update unread count
conversationSchema.methods.incrementUnread = function (recipientRole) {
  this.unreadCount[recipientRole] += 1;
  return this.save();
};

// Method to reset unread count
conversationSchema.methods.resetUnread = function (userRole) {
  this.unreadCount[userRole] = 0;
  return this.save();
};

// Method to update last message
conversationSchema.methods.updateLastMessage = function (messageId, preview) {
  this.lastMessage = messageId;
  this.lastMessageAt = new Date();
  if (preview) {
    this.lastMessagePreview = preview;
  }
  this.metadata.totalMessages += 1;
  return this.save();
};

// Method to block/unblock conversation
conversationSchema.methods.toggleBlock = function (userId, userModel, reason) {
  if (this.restrictions.isBlocked) {
    this.restrictions.isBlocked = false;
    this.restrictions.blockedBy = null;
    this.restrictions.blockedByModel = null;
    this.restrictions.blockedAt = null;
    this.restrictions.blockedReason = null;
  } else {
    this.restrictions.isBlocked = true;
    this.restrictions.blockedBy = userId;
    this.restrictions.blockedByModel = userModel;
    this.restrictions.blockedAt = new Date();
    this.restrictions.blockedReason = reason;
  }
  return this.save();
};

// Static method to find or create conversation
conversationSchema.statics.findOrCreateConversation = async function (participant1, participant2) {
  const conversation = await this.findOne({
    conversationType: 'direct',
    'participants.user': { $all: [participant1.userId, participant2.userId] },
    'participants.userModel': { $all: [participant1.userModel, participant2.userModel] },
  });

  if (conversation) {
    return conversation;
  }

  return this.create({
    participants: [
      {
        user: participant1.userId,
        userModel: participant1.userModel,
        role: participant1.role,
      },
      {
        user: participant2.userId,
        userModel: participant2.userModel,
        role: participant2.role,
      },
    ],
    conversationType: 'direct',
  });
};

// Static method to get conversations for a user with pagination
conversationSchema.statics.getUserConversations = function (userId, userModel, options = {}) {
  const {
    page = 1,
    limit = 20,
    includeArchived = false,
    sortBy = 'lastMessageAt',
  } = options;

  const query = {
    'participants.user': userId,
    'participants.userModel': userModel,
    [`isDeleted.${userModel.toLowerCase()}`]: false,
  };

  if (!includeArchived) {
    query[`isArchived.${userModel.toLowerCase()}`] = false;
  }

  return this.find(query)
    .populate('lastMessage')
    .sort({ [sortBy]: -1 })
    .limit(limit)
    .skip((page - 1) * limit);
};

// Pre-save middleware to update searchable text
conversationSchema.pre('save', function (next) {
  const searchTerms = [];
  
  if (this.customization.nickname.member) {
    searchTerms.push(this.customization.nickname.member);
  }
  if (this.customization.nickname.creator) {
    searchTerms.push(this.customization.nickname.creator);
  }
  if (this.tags.length) {
    searchTerms.push(...this.tags);
  }
  
  this.searchableText = searchTerms.join(' ').toLowerCase();
  next();
});

const Conversation = mongoose.model('Conversation', conversationSchema);

module.exports = Conversation;