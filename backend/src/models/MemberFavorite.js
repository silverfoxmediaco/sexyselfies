const mongoose = require('mongoose');

const memberFavoriteSchema = new mongoose.Schema({
  member: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  creator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Creator',
    required: true,
    index: true
  }
}, {
  timestamps: true
});

// Compound index to prevent duplicate favorites and optimize queries
memberFavoriteSchema.index({ member: 1, creator: 1 }, { unique: true });

// Index for efficient lookup of member's favorites
memberFavoriteSchema.index({ member: 1, createdAt: -1 });

module.exports = mongoose.model('MemberFavorite', memberFavoriteSchema);