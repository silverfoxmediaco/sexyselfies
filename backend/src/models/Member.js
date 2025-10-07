const mongoose = require('mongoose');

const memberSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    username: {
      type: String,
      required: [true, 'Please provide a username'],
      unique: true,
      maxlength: [30, 'Username cannot be more than 30 characters'],
    },
    credits: {
      type: Number,
      default: 0,
      min: 0,
    },
    testCredits: {
      type: Number,
      default: 0,
      min: 0,
      comment: 'Test credits for development/QA testing - not real money',
    },
    preferences: {
      ageRange: {
        min: {
          type: Number,
          default: 18,
          min: 18,
        },
        max: {
          type: Number,
          default: 99,
        },
      },
      interestedIn: [
        {
          type: String,
          enum: ['male', 'female', 'everyone'],
        },
      ],
      bodyTypePreferences: [
        {
          type: String,
          enum: ['slim', 'slender', 'athletic', 'average', 'curvy', 'plus-size', 'bbw', 'muscular', 'dad-bod', 'mom-bod'],
        },
      ],
      contentTypes: [
        {
          type: String,
          enum: ['photos', 'videos', 'messages'],
        },
      ],
      maxDistance: {
        type: Number,
        default: 100, // kilometers
      },
    },
    purchasedContent: [
      {
        creator: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Creator',
        },
        content: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Content',
        },
        purchaseDate: {
          type: Date,
          default: Date.now,
        },
        amount: Number,
      },
    ],
    likes: [
      {
        creator: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Creator',
        },
        likedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    passes: [
      {
        creator: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Creator',
        },
        passedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    // Super Like fields removed - feature disabled
    // superLikes: [{
    //   creator: {
    //     type: mongoose.Schema.Types.ObjectId,
    //     ref: 'Creator'
    //   },
    //   superLikedAt: {
    //     type: Date,
    //     default: Date.now
    //   }
    // }],
    // dailySuperLikes: {
    //   count: {
    //     type: Number,
    //     default: 1
    //   },
    //   resetAt: Date
    // },
    location: {
      type: {
        type: String,
        enum: ['Point'],
      },
      coordinates: {
        type: [Number],
      },
    },
    lastActive: {
      type: Date,
      default: Date.now,
    },
    profileComplete: {
      type: Boolean,
      default: false,
    },
    displayName: String,
    birthDate: Date,
    phone: String,
    gender: {
      type: String,
      enum: ['male', 'female'],
      required: [true, 'Please specify your gender'],
    },
    agreeToTerms: {
      type: Boolean,
      default: false,
    },
    marketingOptIn: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Index for location-based queries
memberSchema.index({ location: '2dsphere' });

// Cascade deletion hooks - Clean up related data when member is deleted
memberSchema.pre('findOneAndDelete', async function () {
  const memberId = this.getQuery()._id;
  if (memberId) {
    console.log(`🧹 Cleaning up data for deleted member: ${memberId}`);

    // Import models (avoid circular dependency by requiring here)
    const CreatorConnection = require('./CreatorConnection');
    const Message = require('./Message');

    try {
      // Delete all connections where this member is involved
      const deletedCreatorConnections = await CreatorConnection.deleteMany({
        member: memberId,
      });
      console.log(
        `🗑️ Deleted ${deletedCreatorConnections.deletedCount} connections for member ${memberId}`
      );

      // Delete all messages where this member is sender or recipient
      const deletedMessages = await Message.deleteMany({
        $or: [{ sender: memberId }, { recipient: memberId }],
      });
      console.log(
        `🗑️ Deleted ${deletedMessages.deletedCount} messages for member ${memberId}`
      );
    } catch (error) {
      console.error(
        `❌ Error during cascade deletion for member ${memberId}:`,
        error
      );
    }
  }
});

memberSchema.pre('deleteOne', async function () {
  const memberId = this.getQuery()._id;
  if (memberId) {
    console.log(`🧹 Cleaning up data for deleted member: ${memberId}`);

    // Import models
    const CreatorConnection = require('./CreatorConnection');
    const Message = require('./Message');

    try {
      // Delete all connections where this member is involved
      const deletedCreatorConnections = await CreatorConnection.deleteMany({
        member: memberId,
      });
      console.log(
        `🗑️ Deleted ${deletedCreatorConnections.deletedCount} connections for member ${memberId}`
      );

      // Delete all messages where this member is sender or recipient
      const deletedMessages = await Message.deleteMany({
        $or: [{ sender: memberId }, { recipient: memberId }],
      });
      console.log(
        `🗑️ Deleted ${deletedMessages.deletedCount} messages for member ${memberId}`
      );
    } catch (error) {
      console.error(
        `❌ Error during cascade deletion for member ${memberId}:`,
        error
      );
    }
  }
});

module.exports = mongoose.model('Member', memberSchema);
