const Content = require('../models/Content');
const mongoose = require('mongoose');

// Get creator's content (simplified version for content management)
exports.getContent = async (req, res) => {
  try {
    console.log('🔍 DEBUG getContent start:', {
      userId: req.user.id,
      userRole: req.user.role,
    });

    // Find the creator profile first (like upload controller does)
    const Creator = require('../models/Creator');
    const creator = await Creator.findOne({ user: req.user.id });
    if (!creator) {
      console.log('❌ Creator profile not found for user:', req.user.id);
      return res.status(404).json({
        success: false,
        message: 'Creator profile not found',
        content: [],
      });
    }

    const creatorId = creator._id;
    console.log('🔍 DEBUG found creator:', {
      userId: req.user.id,
      creatorId: creatorId,
      creatorIdType: typeof creatorId,
    });

    const {
      page = 1,
      limit = 20,
      contentType,
      sortBy = '-createdAt',
    } = req.query;

    const query = {
      creator: creatorId,
      isActive: true,
    };

    console.log('🔍 DEBUG MongoDB query:', query);

    if (contentType && contentType !== 'all') {
      query.type = contentType;
    }

    const skip = (page - 1) * limit;

    const content = await Content.find(query)
      .sort(sortBy)
      .limit(parseInt(limit))
      .skip(skip);

    const total = await Content.countDocuments(query);

    // Map to frontend expected structure
    const mappedContent = content.map(item => ({
      _id: item._id,
      title: item.title || 'Untitled',
      description: item.description || '',
      type: item.type,
      price: item.price || 0,
      isFree: item.isFree || item.price === 0,
      thumbnail:
        item.customThumbnail?.url ||
        item.thumbnail ||
        (item.media && item.media[0]?.url),
      media: item.media || [],
      views: item.stats?.views || 0,
      likes: item.stats?.likes || 0,
      earnings: item.stats?.revenue || 0,
      createdAt: item.createdAt,
      duration: (item.media && item.media[0]?.duration) || null,
      fileCount: item.media ? item.media.length : 1,
      fileSize:
        item.media && item.media[0]?.size
          ? `${(item.media[0].size / 1024 / 1024).toFixed(1)}MB`
          : 'Unknown',
    }));

    res.json({
      success: true,
      content: mappedContent,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Get content error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching content',
      content: [],
    });
  }
};

// Delete content
exports.deleteContent = async (req, res) => {
  try {
    // Find the creator profile first (like upload controller does)
    const Creator = require('../models/Creator');
    const creator = await Creator.findOne({ user: req.user.id });
    if (!creator) {
      return res.status(404).json({
        success: false,
        message: 'Creator profile not found',
      });
    }

    const creatorId = creator._id;
    const contentId = req.params.contentId;

    const content = await Content.findOne({
      _id: contentId,
      creator: creatorId,
    });

    if (!content) {
      return res.status(404).json({
        success: false,
        message: 'Content not found',
      });
    }

    // Soft delete to preserve analytics
    content.isActive = false;
    await content.save();

    // Optional: Delete from Cloudinary (can be done in scheduled job for performance)
    // if (content.media && content.media.length > 0) {
    //   for (const mediaItem of content.media) {
    //     if (mediaItem.cloudinaryPublicId) {
    //       await cloudinary.uploader.destroy(mediaItem.cloudinaryPublicId);
    //     }
    //   }
    // }

    res.json({
      success: true,
      message: 'Content deleted successfully',
    });
  } catch (error) {
    console.error('Delete content error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting content',
    });
  }
};

// Update content pricing
exports.updateContentPricing = async (req, res) => {
  try {
    // Find the creator profile first (like upload controller does)
    const Creator = require('../models/Creator');
    const creator = await Creator.findOne({ user: req.user.id });
    if (!creator) {
      return res.status(404).json({
        success: false,
        message: 'Creator profile not found',
      });
    }

    const creatorId = creator._id;
    const contentId = req.params.contentId;
    const { price } = req.body;

    if (price === undefined || price < 0 || price > 99.99) {
      return res.status(400).json({
        success: false,
        message: 'Invalid price. Price must be between $0.00 and $99.99',
      });
    }

    const content = await Content.findOne({
      _id: contentId,
      creator: creatorId,
    });

    if (!content) {
      return res.status(404).json({
        success: false,
        message: 'Content not found',
      });
    }

    content.price = price;
    content.isFree = price === 0;
    await content.save();

    res.json({
      success: true,
      message: 'Price updated successfully',
      content: {
        id: content._id,
        price: content.price,
        isFree: content.isFree,
      },
    });
  } catch (error) {
    console.error('Update pricing error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating price',
    });
  }
};

// Update content details (title, description, visibility, etc.)
exports.updateContent = async (req, res) => {
  try {
    // Find the creator profile first
    const Creator = require('../models/Creator');
    const creator = await Creator.findOne({ user: req.user.id });
    if (!creator) {
      return res.status(404).json({
        success: false,
        message: 'Creator profile not found',
      });
    }

    const { contentId } = req.params;
    const {
      title,
      description,
      price,
      visibility,
      tags,
      allow_comments,
      allow_downloads,
    } = req.body;

    // Find and update the content
    const content = await Content.findOne({
      _id: contentId,
      creator: creator._id,
    });

    if (!content) {
      return res.status(404).json({
        success: false,
        message: 'Content not found',
      });
    }

    // Update fields if provided
    if (title !== undefined) content.title = title;
    if (description !== undefined) content.description = description;
    if (price !== undefined) {
      content.price = price;
      content.isFree = price === 0;
    }
    if (visibility !== undefined) content.visibility = visibility;
    if (tags !== undefined) content.tags = tags;
    if (allow_comments !== undefined) content.allowComments = allow_comments;
    if (allow_downloads !== undefined) content.allowDownloads = allow_downloads;

    content.updatedAt = new Date();
    await content.save();

    res.json({
      success: true,
      message: 'Content updated successfully',
      content: {
        id: content._id,
        title: content.title,
        description: content.description,
        price: content.price,
        isFree: content.isFree,
        visibility: content.visibility,
        tags: content.tags,
        allowComments: content.allowComments,
        allowDownloads: content.allowDownloads,
      },
    });
  } catch (error) {
    console.error('Update content error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating content',
    });
  }
};

module.exports = exports;
