const CreatorContent = require('../models/CreatorContent');
const CreatorProfile = require('../models/CreatorProfile');
const CreatorEarnings = require('../models/CreatorEarnings');
const CreatorAnalytics = require('../models/CreatorAnalytics');
const cloudinary = require('../config/cloudinary');
const sharp = require('sharp');
const ffmpeg = require('fluent-ffmpeg');
const mongoose = require('mongoose');

// Upload new content with AI analysis
exports.uploadContent = async (req, res) => {
  try {
    const creatorId = req.user.id;
    const { title, description, contentType, pricing } = req.body;
    
    if (!req.files || !req.files.content) {
      return res.status(400).json({
        success: false,
        message: 'No content file provided'
      });
    }
    
    const file = req.files.content;
    
    // Validate file type
    const allowedTypes = {
      photo: ['image/jpeg', 'image/png', 'image/webp'],
      video: ['video/mp4', 'video/quicktime', 'video/webm'],
      audio: ['audio/mpeg', 'audio/wav', 'audio/webm']
    };
    
    if (!allowedTypes[contentType].includes(file.mimetype)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid file type for selected content type'
      });
    }
    
    // Process and upload to CDN
    let uploadResult;
    let mediaMetadata = {};
    
    if (contentType === 'photo') {
      // Process image with Sharp for optimization
      const processedImage = await sharp(file.path)
        .resize(2000, 2000, { 
          fit: 'inside',
          withoutEnlargement: true 
        })
        .jpeg({ quality: 85, progressive: true })
        .toBuffer();
      
      // Upload to Cloudinary
      uploadResult = await cloudinary.uploader.upload_stream(
        {
          folder: 'content/photos',
          resource_type: 'image',
          transformation: [
            { quality: 'auto:best' },
            { fetch_format: 'auto' }
          ]
        },
        processedImage
      );
      
      // Generate blurred preview
      const blurredPreview = await cloudinary.uploader.upload(uploadResult.secure_url, {
        folder: 'content/previews',
        transformation: [
          { effect: 'blur:2000', quality: 50 },
          { width: 400, height: 400, crop: 'fill' }
        ]
      });
      
      mediaMetadata = {
        url: uploadResult.secure_url,
        thumbnailUrl: blurredPreview.secure_url,
        width: uploadResult.width,
        height: uploadResult.height,
        format: uploadResult.format,
        size: uploadResult.bytes
      };
    } else if (contentType === 'video') {
      // Upload video to Cloudinary
      uploadResult = await cloudinary.uploader.upload(file.path, {
        folder: 'content/videos',
        resource_type: 'video',
        eager: [
          { width: 1280, height: 720, crop: 'limit', video_codec: 'h264' },
          { width: 640, height: 360, crop: 'limit', video_codec: 'h264' }
        ]
      });
      
      // Generate video thumbnail
      const thumbnail = await cloudinary.uploader.upload(uploadResult.secure_url, {
        folder: 'content/video-thumbs',
        resource_type: 'video',
        transformation: [
          { effect: 'blur:1500' },
          { width: 400, height: 400, crop: 'fill', gravity: 'center', start_offset: '30%' }
        ]
      });
      
      mediaMetadata = {
        url: uploadResult.secure_url,
        thumbnailUrl: thumbnail.secure_url,
        duration: uploadResult.duration,
        width: uploadResult.width,
        height: uploadResult.height,
        format: uploadResult.format,
        size: uploadResult.bytes
      };
    }
    
    // Perform AI analysis
    const aiAnalysis = await analyzeContent(uploadResult.secure_url, contentType);
    
    // Calculate optimal pricing
    const optimalPrice = await calculateOptimalPrice(creatorId, contentType, aiAnalysis);
    
    // Create content document
    const content = new CreatorContent({
      creator: creatorId,
      title,
      description,
      contentType,
      media: mediaMetadata,
      
      pricing: {
        basePrice: pricing?.basePrice || optimalPrice.base,
        currentPrice: pricing?.currentPrice || optimalPrice.current,
        minPrice: optimalPrice.min,
        maxPrice: optimalPrice.max,
        currency: 'USD',
        
        dynamicPricing: {
          enabled: pricing?.dynamicPricing || true,
          algorithm: 'demand_based',
          lastAdjusted: new Date()
        },
        
        strategy: pricing?.strategy || 'optimal'
      },
      
      ai: {
        tags: aiAnalysis.tags,
        categories: aiAnalysis.categories,
        quality: aiAnalysis.quality,
        safety: aiAnalysis.safety,
        predictions: {
          estimatedViews: aiAnalysis.predictions.views,
          estimatedEarnings: aiAnalysis.predictions.earnings,
          viralPotential: aiAnalysis.predictions.viralScore,
          optimalPostTime: aiAnalysis.predictions.bestTime
        },
        suggestions: aiAnalysis.suggestions,
        autoCaption: aiAnalysis.caption
      },
      
      visibility: {
        status: aiAnalysis.safety.safe ? 'active' : 'review',
        filters: {
          orientation: req.body.orientation || ['all'],
          ageRange: req.body.ageRange || [18, 99],
          location: req.body.location || ['all'],
          gender: req.body.gender || ['all']
        }
      },
      
      metadata: {
        uploadDevice: req.headers['user-agent'],
        uploadIP: req.ip,
        originalFileName: file.originalname
      }
    });
    
    await content.save();
    
    // Update creator profile stats
    await updateCreatorContentStats(creatorId, contentType);
    
    // Schedule optimal posting time if requested
    if (req.body.scheduleOptimal) {
      content.visibility.scheduledFor = new Date(aiAnalysis.predictions.bestTime);
      content.visibility.status = 'scheduled';
      await content.save();
    }
    
    res.json({
      success: true,
      message: 'Content uploaded successfully',
      content: {
        id: content._id,
        title: content.title,
        contentType: content.contentType,
        media: content.media,
        pricing: content.pricing,
        ai: {
          quality: content.ai.quality,
          predictions: content.ai.predictions,
          suggestions: content.ai.suggestions
        },
        status: content.visibility.status
      }
    });
  } catch (error) {
    console.error('Upload content error:', error);
    res.status(500).json({
      success: false,
      message: 'Error uploading content'
    });
  }
};

// Get creator's content with analytics
exports.getMyContent = async (req, res) => {
  try {
    const creatorId = req.user.id;
    const { 
      page = 1, 
      limit = 20, 
      contentType, 
      status = 'active',
      sortBy = '-createdAt' 
    } = req.query;
    
    const query = { creator: creatorId };
    
    if (contentType) {
      query.contentType = contentType;
    }
    
    if (status !== 'all') {
      query['visibility.status'] = status;
    }
    
    const skip = (page - 1) * limit;
    
    const content = await CreatorContent.find(query)
      .sort(sortBy)
      .limit(parseInt(limit))
      .skip(skip)
      .select('-media.url'); // Don't expose direct URLs in list
    
    const total = await CreatorContent.countDocuments(query);
    
    // Add performance metrics to each content
    const enrichedContent = await Promise.all(content.map(async (item) => {
      const performance = {
        views: item.analytics.totalViews,
        purchases: item.analytics.purchases,
        earnings: item.monetization.earnings.total,
        conversionRate: ((item.analytics.purchases / item.analytics.totalViews) * 100).toFixed(2),
        rating: item.analytics.rating,
        roi: calculateROI(item),
        trending: item.performance.trending.isTrending
      };
      
      return {
        ...item.toObject(),
        performance
      };
    }));
    
    res.json({
      success: true,
      content: enrichedContent,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      },
      summary: {
        totalContent: total,
        totalViews: enrichedContent.reduce((sum, c) => sum + c.analytics.totalViews, 0),
        totalEarnings: enrichedContent.reduce((sum, c) => sum + c.monetization.earnings.total, 0),
        avgConversion: (enrichedContent.reduce((sum, c) => sum + parseFloat(c.performance.conversionRate), 0) / enrichedContent.length).toFixed(2)
      }
    });
  } catch (error) {
    console.error('Get content error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching content'
    });
  }
};

// Update content with AI re-analysis
exports.updateContent = async (req, res) => {
  try {
    const creatorId = req.user.id;
    const contentId = req.params.contentId;
    const updates = req.body;
    
    const content = await CreatorContent.findOne({ 
      _id: contentId, 
      creator: creatorId 
    });
    
    if (!content) {
      return res.status(404).json({
        success: false,
        message: 'Content not found'
      });
    }
    
    // Update basic fields
    if (updates.title) content.title = updates.title;
    if (updates.description) content.description = updates.description;
    
    // Update pricing with AI recommendation
    if (updates.pricing) {
      const optimalPrice = await calculateOptimalPrice(
        creatorId, 
        content.contentType,
        content.ai
      );
      
      content.pricing = {
        ...content.pricing,
        ...updates.pricing,
        lastAdjusted: new Date()
      };
      
      // Apply AI pricing suggestion if requested
      if (updates.useAIPricing) {
        content.pricing.currentPrice = optimalPrice.current;
        content.pricing.strategy = 'ai_optimized';
      }
    }
    
    // Update visibility settings
    if (updates.visibility) {
      content.visibility = {
        ...content.visibility,
        ...updates.visibility
      };
    }
    
    // Re-analyze with AI if requested
    if (updates.reanalyze) {
      const aiAnalysis = await analyzeContent(content.media.url, content.contentType);
      content.ai = {
        ...content.ai,
        ...aiAnalysis,
        lastAnalyzed: new Date()
      };
    }
    
    await content.save();
    
    res.json({
      success: true,
      message: 'Content updated successfully',
      content
    });
  } catch (error) {
    console.error('Update content error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating content'
    });
  }
};

// Delete content
exports.deleteContent = async (req, res) => {
  try {
    const creatorId = req.user.id;
    const contentId = req.params.contentId;
    
    const content = await CreatorContent.findOne({ 
      _id: contentId, 
      creator: creatorId 
    });
    
    if (!content) {
      return res.status(404).json({
        success: false,
        message: 'Content not found'
      });
    }
    
    // Soft delete to preserve analytics
    content.visibility.status = 'deleted';
    content.visibility.deletedAt = new Date();
    await content.save();
    
    // Delete from CDN after 30 days (scheduled job)
    
    res.json({
      success: true,
      message: 'Content deleted successfully'
    });
  } catch (error) {
    console.error('Delete content error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting content'
    });
  }
};

// Get content analytics
exports.getContentAnalytics = async (req, res) => {
  try {
    const creatorId = req.user.id;
    const contentId = req.params.contentId;
    
    const content = await CreatorContent.findOne({ 
      _id: contentId, 
      creator: creatorId 
    });
    
    if (!content) {
      return res.status(404).json({
        success: false,
        message: 'Content not found'
      });
    }
    
    // Get detailed analytics
    const analytics = {
      overview: {
        title: content.title,
        type: content.contentType,
        posted: content.createdAt,
        status: content.visibility.status
      },
      
      performance: {
        views: content.analytics.totalViews,
        uniqueViewers: content.analytics.uniqueViewers,
        purchases: content.analytics.purchases,
        conversionRate: ((content.analytics.purchases / content.analytics.totalViews) * 100).toFixed(2) + '%',
        avgWatchTime: content.analytics.avgWatchTime,
        completionRate: content.analytics.completionRate,
        shares: content.analytics.shares,
        saves: content.analytics.saves
      },
      
      earnings: {
        total: content.monetization.earnings.total,
        base: content.monetization.earnings.base,
        tips: content.monetization.earnings.tips,
        unlocks: content.monetization.unlocks.length,
        avgPrice: (content.monetization.earnings.total / content.monetization.unlocks.length).toFixed(2),
        bestDay: content.monetization.earnings.bestDay,
        roi: calculateROI(content)
      },
      
      audience: {
        demographics: content.analytics.demographics,
        topCountries: content.analytics.locations.slice(0, 5),
        deviceBreakdown: content.analytics.devices,
        discoverySource: content.analytics.sources
      },
      
      engagement: {
        likes: content.engagement.reactions.filter(r => r.type === 'like').length,
        loves: content.engagement.reactions.filter(r => r.type === 'love').length,
        fires: content.engagement.reactions.filter(r => r.type === 'fire').length,
        comments: content.engagement.comments.length,
        rating: content.analytics.rating,
        sentiment: analyzeCommentSentiment(content.engagement.comments)
      },
      
      ai: {
        qualityScore: content.ai.quality.overall,
        predictions: content.ai.predictions,
        suggestions: content.ai.suggestions,
        tags: content.ai.tags,
        viralScore: content.performance.viralScore
      },
      
      comparison: await getContentComparison(content, creatorId),
      
      optimization: {
        pricingSuggestion: await calculateOptimalPrice(creatorId, content.contentType, content.ai),
        postingTime: content.ai.predictions.optimalPostTime,
        improvementTips: generateImprovementTips(content)
      }
    };
    
    res.json({
      success: true,
      analytics
    });
  } catch (error) {
    console.error('Get analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching analytics'
    });
  }
};

// Bulk operations
exports.bulkUpdateContent = async (req, res) => {
  try {
    const creatorId = req.user.id;
    const { contentIds, updates } = req.body;
    
    if (!contentIds || !Array.isArray(contentIds)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid content IDs'
      });
    }
    
    const result = await CreatorContent.updateMany(
      { 
        _id: { $in: contentIds },
        creator: creatorId 
      },
      {
        $set: updates
      }
    );
    
    res.json({
      success: true,
      message: `Updated ${result.modifiedCount} content items`,
      modified: result.modifiedCount
    });
  } catch (error) {
    console.error('Bulk update error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating content'
    });
  }
};

// Schedule content
exports.scheduleContent = async (req, res) => {
  try {
    const creatorId = req.user.id;
    const { contentId, scheduledFor, useOptimalTime } = req.body;
    
    const content = await CreatorContent.findOne({ 
      _id: contentId, 
      creator: creatorId 
    });
    
    if (!content) {
      return res.status(404).json({
        success: false,
        message: 'Content not found'
      });
    }
    
    let scheduleTime;
    
    if (useOptimalTime) {
      // Get AI-recommended optimal time
      const profile = await CreatorProfile.findOne({ creator: creatorId });
      scheduleTime = profile.ai.bestPostingTimes[0];
    } else {
      scheduleTime = new Date(scheduledFor);
    }
    
    content.visibility.status = 'scheduled';
    content.visibility.scheduledFor = scheduleTime;
    
    await content.save();
    
    res.json({
      success: true,
      message: 'Content scheduled successfully',
      scheduledFor: scheduleTime
    });
  } catch (error) {
    console.error('Schedule content error:', error);
    res.status(500).json({
      success: false,
      message: 'Error scheduling content'
    });
  }
};

// Helper functions

async function analyzeContent(contentUrl, contentType) {
  // This would integrate with AI service (e.g., AWS Rekognition, Google Vision)
  // For now, returning mock data
  
  const analysis = {
    tags: ['selfie', 'indoor', 'casual', 'smiling'],
    categories: ['lifestyle', 'personal'],
    quality: {
      overall: 85,
      lighting: 82,
      composition: 88,
      sharpness: 90,
      appeal: 83
    },
    safety: {
      safe: true,
      nudityLevel: 0.12,
      violenceLevel: 0.01,
      explicitLevel: 0.08
    },
    predictions: {
      views: Math.floor(Math.random() * 5000) + 1000,
      earnings: Math.floor(Math.random() * 500) + 100,
      viralScore: Math.floor(Math.random() * 100),
      bestTime: getOptimalPostTime()
    },
    suggestions: [
      'Lighting could be improved for better quality',
      'This type of content performs best on weekends',
      'Similar content earned $340 last week'
    ],
    caption: 'Feeling cute today! What do you think of this look? 💕'
  };
  
  return analysis;
}

async function calculateOptimalPrice(creatorId, contentType, aiAnalysis) {
  const earnings = await CreatorEarnings.findOne({ creator: creatorId });
  
  // Base prices by content type
  const basePrices = {
    photo: 1.99,
    video: 4.99,
    audio: 0.99,
    text: 0.49
  };
  
  let optimalPrice = basePrices[contentType] || 2.99;
  
  // Adjust based on quality score
  if (aiAnalysis?.quality?.overall) {
    optimalPrice *= (aiAnalysis.quality.overall / 100) + 0.5;
  }
  
  // Adjust based on creator's performance
  if (earnings) {
    const avgPrice = earnings.revenue.averageTransactionValue || optimalPrice;
    optimalPrice = (optimalPrice + avgPrice) / 2;
  }
  
  return {
    min: Math.max(0.99, optimalPrice * 0.5),
    base: optimalPrice,
    current: optimalPrice,
    max: Math.min(9.99, optimalPrice * 2),
    surge: optimalPrice * 1.5
  };
}

async function updateCreatorContentStats(creatorId, contentType) {
  const profile = await CreatorProfile.findOne({ creator: creatorId });
  
  if (profile) {
    profile.analytics.performance.totalContent += 1;
    
    if (!profile.analytics.performance.contentByType[contentType]) {
      profile.analytics.performance.contentByType[contentType] = 0;
    }
    profile.analytics.performance.contentByType[contentType] += 1;
    
    await profile.save();
  }
}

function calculateROI(content) {
  // Simple ROI calculation
  const cost = 10; // Assumed production cost
  const revenue = content.monetization.earnings.total;
  return ((revenue - cost) / cost * 100).toFixed(2) + '%';
}

function analyzeCommentSentiment(comments) {
  // Would use NLP service
  return {
    positive: 65,
    neutral: 25,
    negative: 10
  };
}

async function getContentComparison(content, creatorId) {
  // Compare to creator's average and platform average
  const creatorAvg = await CreatorContent.aggregate([
    { $match: { creator: mongoose.Types.ObjectId(creatorId) } },
    {
      $group: {
        _id: null,
        avgViews: { $avg: '$analytics.totalViews' },
        avgEarnings: { $avg: '$monetization.earnings.total' },
        avgConversion: { $avg: { $divide: ['$analytics.purchases', '$analytics.totalViews'] } }
      }
    }
  ]);
  
  return {
    vsCreatorAverage: {
      views: ((content.analytics.totalViews / creatorAvg[0].avgViews - 1) * 100).toFixed(2) + '%',
      earnings: ((content.monetization.earnings.total / creatorAvg[0].avgEarnings - 1) * 100).toFixed(2) + '%'
    },
    percentile: Math.floor(Math.random() * 100) // Would calculate actual percentile
  };
}

function generateImprovementTips(content) {
  const tips = [];
  
  if (content.ai.quality.lighting < 70) {
    tips.push('Improve lighting for better engagement');
  }
  
  if (content.analytics.completionRate < 50) {
    tips.push('Content may be too long - consider shorter format');
  }
  
  if (content.analytics.purchases / content.analytics.totalViews < 0.02) {
    tips.push('Price may be too high - consider testing lower price point');
  }
  
  return tips;
}

function getOptimalPostTime() {
  // Would use analytics to determine
  const date = new Date();
  date.setHours(20, 0, 0, 0); // 8 PM
  return date;
}

module.exports = exports;