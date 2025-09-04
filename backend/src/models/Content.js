const mongoose = require('mongoose');

const contentSchema = new mongoose.Schema({
  creator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Creator',
    required: true
  },
  type: {
    type: String,
    enum: ['photo', 'video', 'gallery', 'message'],
    required: true
  },
  title: {
    type: String,
    maxlength: [100, 'Title cannot be more than 100 characters']
  },
  description: {
    type: String,
    maxlength: [500, 'Description cannot be more than 500 characters']
  },
  thumbnail: {
    type: String,
    required: [true, 'Thumbnail is required']
  },
  media: [{
    url: String,
    type: {
      type: String,
      enum: ['image', 'video']
    },
    duration: Number, // for videos in seconds
    size: Number, // in bytes
    dimensions: {
      width: Number,
      height: Number
    },
    cloudinaryPublicId: String, // For deletion from Cloudinary
    originalName: String // Original filename for reference
  }],
  uploadBatch: {
    type: String,
    default: function() {
      return new mongoose.Types.ObjectId().toString(); // Generate unique batch ID
    }
  },
  contentOrder: {
    type: Number,
    default: 0 // Order within upload batch
  },
  price: {
    type: Number,
    required: true,
    min: 0, // Allow 0 for free content
    max: 99.99
  },
  isFree: {
    type: Boolean,
    default: false
  },
  isPreview: {
    type: Boolean,
    default: false
  },
  tags: [{
    type: String,
    lowercase: true
  }],
  purchasedBy: [{
    member: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Member'
    },
    purchaseDate: {
      type: Date,
      default: Date.now
    },
    amount: Number
  }],
  stats: {
    views: {
      type: Number,
      default: 0
    },
    likes: {
      type: Number,
      default: 0
    },
    purchases: {
      type: Number,
      default: 0
    },
    revenue: {
      type: Number,
      default: 0
    }
  },
  allowTips: {
    type: Boolean,
    default: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  scheduledFor: Date,
  expiresAt: Date
}, {
  timestamps: true
});

// Indexes
contentSchema.index({ creator: 1, isActive: 1 });
contentSchema.index({ tags: 1 });
contentSchema.index({ price: 1 });
contentSchema.index({ type: 1 });
contentSchema.index({ scheduledFor: 1 });

module.exports = mongoose.model('Content', contentSchema);
