const express = require('express');
const router = express.Router();
const blogController = require('../controllers/blog.controller');

// Public routes - no authentication required

/**
 * GET /api/v1/blog
 * Get all published blog posts (paginated)
 * Query params: page, limit
 */
router.get('/', blogController.getAllPosts);

/**
 * GET /api/v1/blog/recent
 * Get recent posts
 * Query params: limit
 */
router.get('/recent', blogController.getRecentPosts);

/**
 * GET /api/v1/blog/popular
 * Get popular posts (by views)
 * Query params: limit
 */
router.get('/popular', blogController.getPopularPosts);

/**
 * GET /api/v1/blog/categories
 * Get all categories
 */
router.get('/categories', blogController.getCategories);

/**
 * GET /api/v1/blog/search
 * Search blog posts
 * Query params: q (search query), limit
 */
router.get('/search', blogController.searchPosts);

/**
 * GET /api/v1/blog/category/:category
 * Get posts by category
 * Query params: page, limit
 */
router.get('/category/:category', blogController.getPostsByCategory);

/**
 * POST /api/v1/blog/:slug/like
 * Like a blog post
 */
router.post('/:slug/like', blogController.likePost);

/**
 * GET /api/v1/blog/:slug
 * Get single blog post by slug
 * IMPORTANT: This must be LAST to avoid conflicts with other routes
 */
router.get('/:slug', blogController.getPostBySlug);

module.exports = router;
