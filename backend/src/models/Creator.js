const mongoose = require('mongoose');

const creatorSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    username: {
      type: String,
      maxlength: [30, 'Username cannot be more than 30 characters'],
    },
    displayName: {
      type: String,
      required: [true, 'Please provide a display name'],
      maxlength: [50, 'Display name cannot be more than 50 characters'],
    },
    birthDate: {
      type: Date,
    },
    age: {
      type: Number,
      min: 18,
    },
    gender: {
      type: String,
      enum: ['male', 'female'],
      required: false, // Will be collected during profile setup
    },
    orientation: {
      type: String,
      enum: ['straight', 'gay', 'lesbian', 'bisexual', 'pansexual'],
    },
    bodyType: {
      type: String,
      enum: ['slim', 'athletic', 'average', 'curvy', 'plus-size', 'muscular'],
    },
    ethnicity: String,
    bio: {
      type: String,
      maxlength: [500, 'Bio cannot be more than 500 characters'],
    },
    profileImage: {
      type: String,
      default: 'default-avatar.jpg',
    },
    coverImage: String,
    galleries: [
      {
        title: String,
        thumbnail: String,
        images: [String],
        price: {
          type: Number,
          required: true,
          min: 0.99,
          max: 99.99,
        },
        purchasedBy: [
          {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Member',
          },
        ],
      },
    ],
    contentPrice: {
      type: Number,
      default: 2.99,
      min: 0.99,
      max: 99.99,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    verificationStatus: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
    },
    profileComplete: {
      type: Boolean,
      default: false,
    },
    idVerificationSubmitted: {
      type: Boolean,
      default: false,
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
        default: 'pending',
      },
    },
    verificationSubmittedAt: Date,
    verificationApprovedAt: Date,
    verificationRejectedAt: Date,
    verificationRejectionReason: String,
    stats: {
      totalEarnings: {
        type: Number,
        default: 0,
      },
      monthlyEarnings: {
        type: Number,
        default: 0,
      },
      totalConnections: {
        type: Number,
        default: 0,
      },
      totalContent: {
        type: Number,
        default: 0,
      },
      totalLikes: {
        type: Number,
        default: 0,
      },
      rating: {
        type: Number,
        default: 0,
        min: 0,
        max: 5,
      },
      ratingCount: {
        type: Number,
        default: 0,
      },
    },
    socialLinks: {
      instagram: String,
      twitter: String,
      tiktok: String,
    },
    preferences: {
      // Discovery preferences - who should see this creator's profile
      minAge: {
        type: Number,
        default: 18,
        min: 18,
      },
      maxAge: {
        type: Number,
        default: 99,
      },
      interestedIn: [
        {
          type: String,
          enum: ['male', 'female', 'everyone'],
        },
      ],
      showInBrowse: {
        type: Boolean,
        default: true,
      },
    },
    location: {
      type: {
        type: String,
        enum: ['Point'],
        required: false,
      },
      coordinates: {
        type: [Number],
        required: false,
      },
      city: String,
      state: String,
      country: String,
    },
    lastActive: {
      type: Date,
      default: Date.now,
    },
    isPaused: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Index for location-based queries (will add back when coordinates are properly set)
// creatorSchema.index({ location: '2dsphere' });
// Index for search
creatorSchema.index({ displayName: 'text', bio: 'text' });

// Cascade deletion hooks - Clean up related data when creator is deleted
creatorSchema.pre('findOneAndDelete', async function () {
  const creatorId = this.getQuery()._id;
  if (creatorId) {
    console.log(`🧹 Cleaning up data for deleted creator: ${creatorId}`);

    // Import models (avoid circular dependency by requiring here)
    const Connection = require('./Connections');
    const Message = require('./Message');
    const Content = require('./Content');

    try {
      // Delete all connections where this creator is involved
      const deletedConnections = await Connection.deleteMany({
        creator: creatorId,
      });
      console.log(
        `🗑️ Deleted ${deletedConnections.deletedCount} connections for creator ${creatorId}`
      );

      // Delete all messages where this creator is sender or recipient
      const deletedMessages = await Message.deleteMany({
        $or: [{ sender: creatorId }, { recipient: creatorId }],
      });
      console.log(
        `🗑️ Deleted ${deletedMessages.deletedCount} messages for creator ${creatorId}`
      );

      // Delete all content uploaded by this creator
      const deletedContent = await Content.deleteMany({ creator: creatorId });
      console.log(
        `🗑️ Deleted ${deletedContent.deletedCount} content items for creator ${creatorId}`
      );
    } catch (error) {
      console.error(
        `❌ Error during cascade deletion for creator ${creatorId}:`,
        error
      );
    }
  }
});

creatorSchema.pre('deleteOne', async function () {
  const creatorId = this.getQuery()._id;
  if (creatorId) {
    console.log(`🧹 Cleaning up data for deleted creator: ${creatorId}`);

    // Import models
    const Connection = require('./Connections');
    const Message = require('./Message');
    const Content = require('./Content');

    try {
      // Delete all connections where this creator is involved
      const deletedConnections = await Connection.deleteMany({
        creator: creatorId,
      });
      console.log(
        `🗑️ Deleted ${deletedConnections.deletedCount} connections for creator ${creatorId}`
      );

      // Delete all messages where this creator is sender or recipient
      const deletedMessages = await Message.deleteMany({
        $or: [{ sender: creatorId }, { recipient: creatorId }],
      });
      console.log(
        `🗑️ Deleted ${deletedMessages.deletedCount} messages for creator ${creatorId}`
      );

      // Delete all content uploaded by this creator
      const deletedContent = await Content.deleteMany({ creator: creatorId });
      console.log(
        `🗑️ Deleted ${deletedContent.deletedCount} content items for creator ${creatorId}`
      );
    } catch (error) {
      console.error(
        `❌ Error during cascade deletion for creator ${creatorId}:`,
        error
      );
    }
  }
});

module.exports = mongoose.model('Creator', creatorSchema);
