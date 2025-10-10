const mongoose = require('mongoose');

const blogPostSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    content: {
      type: String,
      required: true,
    },
    excerpt: {
      type: String,
      default: '',
    },
    featuredImage: {
      type: String,
      default: '',
    },
    author: {
      name: {
        type: String,
        default: 'Sexy Selfies Team',
      },
      email: {
        type: String,
        default: '',
      },
    },
    category: {
      type: String,
      default: 'Sex Talk',
    },
    tags: [
      {
        type: String,
      },
    ],
    status: {
      type: String,
      enum: ['published', 'draft', 'archived'],
      default: 'published',
    },
    publishDate: {
      type: Date,
      default: Date.now,
    },
    modifiedDate: {
      type: Date,
      default: Date.now,
    },
    views: {
      type: Number,
      default: 0,
    },
    likes: {
      type: Number,
      default: 0,
    },
    // WordPress metadata for migration tracking
    wordpressId: {
      type: Number,
      unique: true,
      sparse: true,
    },
    wordpressUrl: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

// Index for faster queries
blogPostSchema.index({ slug: 1 });
blogPostSchema.index({ status: 1, publishDate: -1 });
blogPostSchema.index({ category: 1, status: 1 });

// Virtual for URL
blogPostSchema.virtual('url').get(function () {
  return `/blog/${this.slug}`;
});

// Method to increment views
blogPostSchema.methods.incrementViews = async function () {
  this.views += 1;
  return this.save();
};

// Static method to get published posts
blogPostSchema.statics.getPublished = function (limit = 10, skip = 0) {
  return this.find({ status: 'published' })
    .sort({ publishDate: -1 })
    .limit(limit)
    .skip(skip)
    .select('-__v');
};

// Static method to get posts by category
blogPostSchema.statics.getByCategory = function (
  category,
  limit = 10,
  skip = 0
) {
  return this.find({ status: 'published', category })
    .sort({ publishDate: -1 })
    .limit(limit)
    .skip(skip)
    .select('-__v');
};

// Static method to search posts
blogPostSchema.statics.search = function (query, limit = 10) {
  return this.find({
    status: 'published',
    $or: [
      { title: { $regex: query, $options: 'i' } },
      { content: { $regex: query, $options: 'i' } },
      { excerpt: { $regex: query, $options: 'i' } },
      { tags: { $in: [new RegExp(query, 'i')] } },
    ],
  })
    .sort({ publishDate: -1 })
    .limit(limit)
    .select('-__v');
};

module.exports = mongoose.model('BlogPost', blogPostSchema);
