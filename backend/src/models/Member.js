const mongoose = require('mongoose');

const memberSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  username: {
    type: String,
    required: [true, 'Please provide a username'],
    unique: true,
    maxlength: [30, 'Username cannot be more than 30 characters']
  },
  profileImage: {
    type: String,
    default: 'default-avatar.jpg'
  },
  credits: {
    type: Number,
    default: 0,
    min: 0
  },
  preferences: {
    ageRange: {
      min: {
        type: Number,
        default: 18,
        min: 18
      },
      max: {
        type: Number,
        default: 99
      }
    },
    interestedIn: [{
      type: String,
      enum: ['men', 'women', 'everyone']
    }],
    contentTypes: [{
      type: String,
      enum: ['photos', 'videos', 'messages']
    }],
    maxDistance: {
      type: Number,
      default: 100 // kilometers
    }
  },
  purchasedContent: [{
    creator: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Creator'
    },
    content: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Content'
    },
    purchaseDate: {
      type: Date,
      default: Date.now
    },
    amount: Number
  }],
  likes: [{
    creator: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Creator'
    },
    likedAt: {
      type: Date,
      default: Date.now
    }
  }],
  passes: [{
    creator: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Creator'
    },
    passedAt: {
      type: Date,
      default: Date.now
    }
  }],
  superLikes: [{
    creator: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Creator'
    },
    superLikedAt: {
      type: Date,
      default: Date.now
    }
  }],
  dailySuperLikes: {
    count: {
      type: Number,
      default: 1
    },
    resetAt: Date
  },
  location: {
    type: {
      type: String,
      enum: ['Point']
    },
    coordinates: {
      type: [Number]
    }
  },
  lastActive: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Index for location-based queries
memberSchema.index({ location: '2dsphere' });

module.exports = mongoose.model('Member', memberSchema);
