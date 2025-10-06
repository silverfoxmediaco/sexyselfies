const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema(
  {
    conversation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Conversation',
      required: true,
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      refPath: 'senderModel',
      required: true,
    },
    senderModel: {
      type: String,
      enum: ['Member', 'Creator'],
      required: true,
    },
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      refPath: 'recipientModel',
      required: true,
    },
    recipientModel: {
      type: String,
      enum: ['Member', 'Creator'],
      required: true,
    },
    messageType: {
      type: String,
      enum: ['text', 'media', 'image', 'video', 'audio', 'tip'],
      default: 'text',
    },
    read: {
      type: Boolean,
      default: false,
    },
    content: {
      type: String,
      maxlength: [1000, 'Message cannot be more than 1000 characters'],
      default: '',
    },
    media: [
      {
        url: String,
        type: {
          type: String,
          enum: ['image', 'video', 'audio'],
        },
        thumbnail: String,
        size: Number,
        isLocked: {
          type: Boolean,
          default: false,
        },
        price: {
          type: Number,
          min: 0.99,
          max: 99.99,
        },
        unlockedBy: [
          {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Member',
          },
        ],
      },
    ],
    tip: {
      amount: Number,
      message: String,
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    readAt: Date,
    isDeleted: {
      type: Boolean,
      default: false,
    },
    deletedAt: Date,
    deletedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    editedAt: Date,
    replyTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Message',
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
messageSchema.index({ conversation: 1, createdAt: -1 });
messageSchema.index({ sender: 1 });
messageSchema.index({ recipient: 1 });
messageSchema.index({ read: 1 });
messageSchema.index({ 'media.isLocked': 1 });

// Virtual for checking if message has locked content
messageSchema.virtual('hasLockedContent').get(function () {
  return this.media && this.media.some(item => item.isLocked);
});

module.exports = mongoose.model('Message', messageSchema);
