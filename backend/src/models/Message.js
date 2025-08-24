const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  match: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Match',
    required: true
  },
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  senderModel: {
    type: String,
    enum: ['Member', 'Creator'],
    required: true
  },
  content: {
    text: {
      type: String,
      maxlength: [1000, 'Message cannot be more than 1000 characters']
    },
    media: [{
      url: String,
      type: {
        type: String,
        enum: ['image', 'video', 'audio']
      },
      thumbnail: String,
      isLocked: {
        type: Boolean,
        default: false
      },
      price: {
        type: Number,
        min: 0.99,
        max: 99.99
      },
      unlockedBy: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Member'
      }]
    }]
  },
  tip: {
    amount: Number,
    message: String
  },
  isRead: {
    type: Boolean,
    default: false
  },
  readAt: Date,
  isDeleted: {
    type: Boolean,
    default: false
  },
  deletedAt: Date,
  deletedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  editedAt: Date,
  replyTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message'
  }
}, {
  timestamps: true
});

// Indexes
messageSchema.index({ match: 1, createdAt: -1 });
messageSchema.index({ sender: 1 });
messageSchema.index({ isRead: 1 });
messageSchema.index({ 'content.media.isLocked': 1 });

// Virtual for checking if message has locked content
messageSchema.virtual('hasLockedContent').get(function() {
  return this.content.media.some(item => item.isLocked);
});

module.exports = mongoose.model('Message', messageSchema);
