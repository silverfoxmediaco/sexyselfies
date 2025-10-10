const BlogPost = require('../models/BlogPost');

/**
 * Get all published blog posts (paginated)
 */
exports.getAllPosts = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 12;
    const skip = (page - 1) * limit;

    const posts = await BlogPost.getPublished(limit, skip);
    const total = await BlogPost.countDocuments({ status: 'published' });

    res.json({
      success: true,
      posts,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Get all posts error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch blog posts',
    });
  }
};

/**
 * Get single blog post by slug
 */
exports.getPostBySlug = async (req, res) => {
  try {
    const { slug } = req.params;

    const post = await BlogPost.findOne({ slug, status: 'published' });

    if (!post) {
      return res.status(404).json({
        success: false,
        error: 'Blog post not found',
      });
    }

    // Increment view count
    await post.incrementViews();

    res.json({
      success: true,
      post,
    });
  } catch (error) {
    console.error('Get post by slug error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch blog post',
    });
  }
};

/**
 * Get posts by category
 */
exports.getPostsByCategory = async (req, res) => {
  try {
    const { category } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 12;
    const skip = (page - 1) * limit;

    const posts = await BlogPost.getByCategory(category, limit, skip);
    const total = await BlogPost.countDocuments({
      status: 'published',
      category,
    });

    res.json({
      success: true,
      posts,
      category,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Get posts by category error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch posts by category',
    });
  }
};

/**
 * Search blog posts
 */
exports.searchPosts = async (req, res) => {
  try {
    const { q } = req.query;
    const limit = parseInt(req.query.limit) || 20;

    if (!q || q.trim().length < 2) {
      return res.status(400).json({
        success: false,
        error: 'Search query must be at least 2 characters',
      });
    }

    const posts = await BlogPost.search(q.trim(), limit);

    res.json({
      success: true,
      posts,
      query: q,
      count: posts.length,
    });
  } catch (error) {
    console.error('Search posts error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to search posts',
    });
  }
};

/**
 * Get recent posts (for sidebar/widgets)
 */
exports.getRecentPosts = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 5;

    const posts = await BlogPost.find({ status: 'published' })
      .sort({ publishDate: -1 })
      .limit(limit)
      .select('title slug featuredImage publishDate excerpt')
      .lean();

    res.json({
      success: true,
      posts,
    });
  } catch (error) {
    console.error('Get recent posts error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch recent posts',
    });
  }
};

/**
 * Get popular posts (by views)
 */
exports.getPopularPosts = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 5;

    const posts = await BlogPost.find({ status: 'published' })
      .sort({ views: -1 })
      .limit(limit)
      .select('title slug featuredImage views excerpt')
      .lean();

    res.json({
      success: true,
      posts,
    });
  } catch (error) {
    console.error('Get popular posts error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch popular posts',
    });
  }
};

/**
 * Get all categories
 */
exports.getCategories = async (req, res) => {
  try {
    const categories = await BlogPost.distinct('category', {
      status: 'published',
    });

    // Get post count for each category
    const categoriesWithCount = await Promise.all(
      categories.map(async category => {
        const count = await BlogPost.countDocuments({
          status: 'published',
          category,
        });
        return { name: category, count };
      })
    );

    res.json({
      success: true,
      categories: categoriesWithCount,
    });
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch categories',
    });
  }
};

/**
 * Like a blog post
 */
exports.likePost = async (req, res) => {
  try {
    const { slug } = req.params;

    const post = await BlogPost.findOne({ slug, status: 'published' });

    if (!post) {
      return res.status(404).json({
        success: false,
        error: 'Blog post not found',
      });
    }

    post.likes += 1;
    await post.save();

    res.json({
      success: true,
      likes: post.likes,
    });
  } catch (error) {
    console.error('Like post error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to like post',
    });
  }
};
