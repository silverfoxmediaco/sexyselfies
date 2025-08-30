const mongoose = require('mongoose');

const creatorSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  displayName: {
    type: String,
    required: [true, 'Please provide a display name'],
    maxlength: [50, 'Display name cannot be more than 50 characters']
  },
  bio: {
    type: String,
    maxlength: [500, 'Bio cannot be more than 500 characters']
  },
  profileImage: {
    type: String,
    default: 'default-avatar.jpg'
  },
  coverImage: String,
  galleries: [{
    title: String,
    thumbnail: String,
    images: [String],
    price: {
      type: Number,
      required: true,
      min: 0.99,
      max: 99.99
    },
    purchasedBy: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Member'
    }]
  }],
  contentPrice: {
    type: Number,
    default: 2.99,
    min: 0.99,
    max: 99.99
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  verificationStatus: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  profileComplete: {
    type: Boolean,
    default: false
  },
  idVerificationSubmitted: {
    type: Boolean,
    default: false
  },
  verificationDocuments: [String],
  verification: {
    idType: String,
    idFrontUrl: String,
    idBackUrl: String,
    selfieUrl: String,
    submittedAt: Date,
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending'
    }
  },
  verificationSubmittedAt: Date,
  verificationApprovedAt: Date,
  verificationRejectedAt: Date,
  verificationRejectionReason: String,
  stats: {
    totalEarnings: {
      type: Number,
      default: 0
    },
    monthlyEarnings: {
      type: Number,
      default: 0
    },
    totalMatches: {
      type: Number,
      default: 0
    },
    totalLikes: {
      type: Number,
      default: 0
    },
    rating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5
    },
    ratingCount: {
      type: Number,
      default: 0
    }
  },
  socialLinks: {
    instagram: String,
    twitter: String,
    tiktok: String
  },
  preferences: {
    minAge: {
      type: Number,
      default: 18,
      min: 18
    },
    maxAge: {
      type: Number,
      default: 99
    },
    interestedIn: [{
      type: String,
      enum: ['men', 'women', 'everyone']
    }]
  },
  location: {
    type: {
      type: String,
      enum: ['Point'],
      required: false
    },
    coordinates: {
      type: [Number],
      required: false
    },
    city: String,
    state: String,
    country: String
  },
  lastActive: {
    type: Date,
    default: Date.now
  },
  isPaused: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Index for location-based queries (will add back when coordinates are properly set)
// creatorSchema.index({ location: '2dsphere' });
// Index for search
creatorSchema.index({ displayName: 'text', bio: 'text' });

module.exports = mongoose.model('Creator', creatorSchema);
