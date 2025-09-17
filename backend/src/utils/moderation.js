// Content moderation utility functions
const Report = require('../models/Report');
const UserViolation = require('../models/UserViolation');

// Prohibited words/phrases for text moderation
const PROHIBITED_WORDS = [
  // Add prohibited words here
  // Using placeholder examples
  'prohibited1',
  'prohibited2',
];

// Content guidelines
const CONTENT_GUIDELINES = {
  minAge: 18,
  maxFileSize: 104857600, // 100MB
  allowedImageTypes: ['image/jpeg', 'image/png', 'image/webp'],
  allowedVideoTypes: ['video/mp4', 'video/quicktime', 'video/webm'],
  maxImageDimensions: { width: 4096, height: 4096 },
  maxVideoDuration: 600, // 10 minutes in seconds
};

/**
 * Scan content for violations
 */
exports.scanContent = async (content, type = 'text') => {
  try {
    const results = {
      safe: true,
      violations: [],
      confidence: 100,
      warnings: [],
      suggestions: [],
    };

    switch (type) {
      case 'text':
        const textResults = await moderateText(content);
        results.safe = textResults.safe;
        results.violations = textResults.violations;
        results.confidence = textResults.confidence;
        break;

      case 'image':
        const imageResults = await moderateImage(content);
        results.safe = imageResults.safe;
        results.violations = imageResults.violations;
        results.warnings = imageResults.warnings;
        break;

      case 'video':
        const videoResults = await moderateVideo(content);
        results.safe = videoResults.safe;
        results.violations = videoResults.violations;
        results.warnings = videoResults.warnings;
        break;

      default:
        throw new Error('Invalid content type for moderation');
    }

    // Log moderation results for review
    if (!results.safe) {
      await logModerationIssue(content, type, results);
    }

    return results;
  } catch (error) {
    console.error('Content scanning error:', error);
    throw error;
  }
};

/**
 * Moderate text content
 */
async function moderateText(text) {
  const results = {
    safe: true,
    violations: [],
    confidence: 100,
  };

  if (!text || typeof text !== 'string') {
    return results;
  }

  const lowerText = text.toLowerCase();

  // Check for prohibited words
  for (const word of PROHIBITED_WORDS) {
    if (lowerText.includes(word.toLowerCase())) {
      results.safe = false;
      results.violations.push({
        type: 'prohibited_content',
        severity: 'high',
        detail: 'Contains prohibited words',
      });
    }
  }

  // Check for spam patterns
  if (isSpam(text)) {
    results.safe = false;
    results.violations.push({
      type: 'spam',
      severity: 'medium',
      detail: 'Content appears to be spam',
    });
  }

  // Check for external links (not allowed in messages)
  if (containsExternalLinks(text)) {
    results.safe = false;
    results.violations.push({
      type: 'external_links',
      severity: 'medium',
      detail: 'Contains external links',
    });
  }

  // Check for personal information
  if (containsPersonalInfo(text)) {
    results.violations.push({
      type: 'personal_info',
      severity: 'low',
      detail: 'May contain personal information',
    });
    results.confidence = 80;
  }

  // AI-based moderation (would integrate with service like Perspective API)
  // const aiResults = await checkWithAI(text);
  // if (aiResults.toxicity > 0.7) {
  //   results.safe = false;
  //   results.violations.push({
  //     type: 'toxicity',
  //     severity: 'high',
  //     detail: `Toxicity score: ${aiResults.toxicity}`
  //   });
  // }

  return results;
}

/**
 * Moderate image content
 */
async function moderateImage(imageData) {
  const results = {
    safe: true,
    violations: [],
    warnings: [],
  };

  // Check image properties
  if (imageData.size > CONTENT_GUIDELINES.maxFileSize) {
    results.safe = false;
    results.violations.push({
      type: 'file_size',
      severity: 'low',
      detail: 'Image exceeds maximum file size',
    });
  }

  // Check image type
  if (!CONTENT_GUIDELINES.allowedImageTypes.includes(imageData.mimeType)) {
    results.safe = false;
    results.violations.push({
      type: 'invalid_format',
      severity: 'high',
      detail: 'Invalid image format',
    });
  }

  // AI-based image moderation (would integrate with service like AWS Rekognition)
  // const aiResults = await analyzeImageWithAI(imageData);

  // Mock AI results for development
  const aiResults = {
    nudity: 0.2,
    suggestive: 0.6,
    violence: 0.0,
    drugs: 0.0,
    hate: 0.0,
  };

  // Check for explicit content (not allowed)
  if (aiResults.nudity > 0.8) {
    results.safe = false;
    results.violations.push({
      type: 'explicit_content',
      severity: 'high',
      detail: 'Image contains explicit nudity',
    });
  }

  // Check for suggestive content (allowed but warned)
  if (aiResults.suggestive > 0.5 && aiResults.suggestive <= 0.8) {
    results.warnings.push({
      type: 'suggestive_content',
      detail: 'Image contains suggestive content',
    });
  }

  // Check for violence
  if (aiResults.violence > 0.5) {
    results.safe = false;
    results.violations.push({
      type: 'violence',
      severity: 'high',
      detail: 'Image contains violent content',
    });
  }

  // Check for hate symbols
  if (aiResults.hate > 0.5) {
    results.safe = false;
    results.violations.push({
      type: 'hate_content',
      severity: 'critical',
      detail: 'Image contains hate symbols or content',
    });
  }

  return results;
}

/**
 * Moderate video content
 */
async function moderateVideo(videoData) {
  const results = {
    safe: true,
    violations: [],
    warnings: [],
  };

  // Check video properties
  if (videoData.size > CONTENT_GUIDELINES.maxFileSize) {
    results.safe = false;
    results.violations.push({
      type: 'file_size',
      severity: 'low',
      detail: 'Video exceeds maximum file size',
    });
  }

  // Check video type
  if (!CONTENT_GUIDELINES.allowedVideoTypes.includes(videoData.mimeType)) {
    results.safe = false;
    results.violations.push({
      type: 'invalid_format',
      severity: 'high',
      detail: 'Invalid video format',
    });
  }

  // Check video duration
  if (videoData.duration > CONTENT_GUIDELINES.maxVideoDuration) {
    results.safe = false;
    results.violations.push({
      type: 'duration',
      severity: 'low',
      detail: 'Video exceeds maximum duration',
    });
  }

  // Video content moderation would sample frames and analyze
  // This is a simplified version
  // const frames = await extractFrames(videoData);
  // for (const frame of frames) {
  //   const frameResults = await moderateImage(frame);
  //   if (!frameResults.safe) {
  //     results.safe = false;
  //     results.violations.push(...frameResults.violations);
  //   }
  // }

  return results;
}

/**
 * Check if text is spam
 */
function isSpam(text) {
  // Simple spam detection patterns
  const spamPatterns = [
    /\b(click here|buy now|limited time|act now)\b/gi,
    /\b(viagra|cialis|pills)\b/gi,
    /\$\d+\.?\d*\s*(guaranteed|per day|per week)/gi,
    /\b(MLM|pyramid scheme|get rich quick)\b/gi,
    /(.)\1{10,}/g, // Repeated characters
  ];

  for (const pattern of spamPatterns) {
    if (pattern.test(text)) {
      return true;
    }
  }

  // Check for excessive caps
  const capsRatio = (text.match(/[A-Z]/g) || []).length / text.length;
  if (capsRatio > 0.7 && text.length > 10) {
    return true;
  }

  return false;
}

/**
 * Check for external links
 */
function containsExternalLinks(text) {
  const linkPatterns = [
    /https?:\/\/(?!(?:www\.)?sexyselfies\.com)/gi,
    /\b(?:www\.)?[\w-]+\.(?:com|net|org|io|co)\b/gi,
    /@[\w]+\.[\w]+/gi, // Email addresses
  ];

  for (const pattern of linkPatterns) {
    if (pattern.test(text)) {
      return true;
    }
  }

  return false;
}

/**
 * Check for personal information
 */
function containsPersonalInfo(text) {
  const personalInfoPatterns = [
    /\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g, // Phone numbers
    /\b\d{3}-\d{2}-\d{4}\b/g, // SSN
    /\b(?:\d{4}[-\s]?){3}\d{4}\b/g, // Credit card
    /\b[\w._%+-]+@[\w.-]+\.[A-Z|a-z]{2,}\b/g, // Email
  ];

  for (const pattern of personalInfoPatterns) {
    if (pattern.test(text)) {
      return true;
    }
  }

  return false;
}

/**
 * Log moderation issue for review
 */
async function logModerationIssue(content, type, results) {
  try {
    console.log('Moderation issue logged:', {
      type,
      violations: results.violations,
      timestamp: new Date(),
    });

    // In production, this would create a moderation queue item
    // for human review
  } catch (error) {
    console.error('Error logging moderation issue:', error);
  }
}

/**
 * Report content
 */
exports.reportContent = async reportData => {
  try {
    const {
      reporterId,
      targetId,
      targetType, // 'user', 'content', 'message'
      reason,
      description,
      evidence,
    } = reportData;

    // Create report
    const report = await Report.create({
      reporter: reporterId,
      targetId,
      targetType,
      reason,
      description,
      evidence,
      status: 'pending',
      createdAt: new Date(),
    });

    // Auto-moderate based on report type
    if (reason === 'explicit_content' || reason === 'hate_speech') {
      // High priority - auto-hide content pending review
      await autoModerateContent(targetId, targetType, reason);
    }

    // Check if user has multiple reports
    const reportCount = await Report.countDocuments({
      targetId,
      targetType,
      status: 'verified',
    });

    if (reportCount >= 3) {
      // Auto-suspend after 3 verified reports
      await createViolation(targetId, 'multiple_reports', 'high');
    }

    return {
      success: true,
      reportId: report._id,
      message: 'Report submitted successfully',
    };
  } catch (error) {
    console.error('Error reporting content:', error);
    throw error;
  }
};

/**
 * Auto-moderate content based on reports
 */
async function autoModerateContent(targetId, targetType, reason) {
  try {
    // Implementation depends on target type
    console.log(`Auto-moderating ${targetType} ${targetId} for ${reason}`);

    // Would update the content status to 'hidden' or 'under_review'
    // based on targetType
  } catch (error) {
    console.error('Auto-moderation error:', error);
  }
}

/**
 * Create user violation
 */
async function createViolation(userId, violationType, severity) {
  try {
    const violation = await UserViolation.create({
      user: userId,
      type: violationType,
      severity,
      timestamp: new Date(),
      status: 'active',
    });

    // Check total violations for auto-suspension
    const violationCount = await UserViolation.countDocuments({
      user: userId,
      status: 'active',
    });

    if (violationCount >= 5 || severity === 'critical') {
      // Auto-suspend user
      await suspendUser(userId, severity === 'critical' ? 'permanent' : '7d');
    }

    return violation;
  } catch (error) {
    console.error('Error creating violation:', error);
    throw error;
  }
}

/**
 * Suspend user
 */
async function suspendUser(userId, duration) {
  try {
    const User = require('../models/User');

    const suspendedUntil =
      duration === 'permanent'
        ? new Date('2099-12-31')
        : new Date(Date.now() + parseDuration(duration));

    await User.findByIdAndUpdate(userId, {
      status: 'suspended',
      suspendedUntil,
      suspendedAt: new Date(),
    });

    console.log(`User ${userId} suspended until ${suspendedUntil}`);
  } catch (error) {
    console.error('Error suspending user:', error);
  }
}

/**
 * Parse duration string to milliseconds
 */
function parseDuration(duration) {
  const units = {
    h: 60 * 60 * 1000,
    d: 24 * 60 * 60 * 1000,
    w: 7 * 24 * 60 * 60 * 1000,
    m: 30 * 24 * 60 * 60 * 1000,
  };

  const match = duration.match(/(\d+)([hdwm])/);
  if (match) {
    const [, value, unit] = match;
    return parseInt(value) * (units[unit] || 0);
  }

  return 0;
}

/**
 * Check if user is allowed to perform action
 */
exports.checkUserPermissions = async (userId, action) => {
  try {
    const User = require('../models/User');
    const user = await User.findById(userId);

    if (!user) {
      return { allowed: false, reason: 'User not found' };
    }

    // Check if suspended
    if (user.status === 'suspended') {
      if (user.suspendedUntil > new Date()) {
        return {
          allowed: false,
          reason: 'Account suspended',
          until: user.suspendedUntil,
        };
      } else {
        // Suspension expired, update status
        user.status = 'active';
        await user.save();
      }
    }

    // Check if banned
    if (user.status === 'banned') {
      return { allowed: false, reason: 'Account banned' };
    }

    // Check specific action permissions
    const actionLimits = {
      post_content: { max: 50, window: 24 * 60 * 60 * 1000 }, // 50 per day
      send_message: { max: 100, window: 60 * 60 * 1000 }, // 100 per hour
      create_account: { max: 1, window: Infinity }, // 1 account ever
    };

    if (actionLimits[action]) {
      // Would check against rate limits in database
      // For now, allow all actions for active users
    }

    return { allowed: true };
  } catch (error) {
    console.error('Error checking permissions:', error);
    return { allowed: false, reason: 'Error checking permissions' };
  }
};

/**
 * Clean/sanitize user input
 */
exports.sanitizeInput = input => {
  if (typeof input !== 'string') {
    return input;
  }

  // Remove HTML tags
  let cleaned = input.replace(/<[^>]*>/g, '');

  // Remove script tags and content
  cleaned = cleaned.replace(
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
    ''
  );

  // Remove SQL injection attempts
  cleaned = cleaned.replace(
    /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|UNION|CREATE|ALTER)\b)/gi,
    ''
  );

  // Trim whitespace
  cleaned = cleaned.trim();

  return cleaned;
};

/**
 * Validate content before posting
 */
exports.validateContent = async (content, type) => {
  const validation = {
    valid: true,
    errors: [],
    warnings: [],
  };

  // Check content exists
  if (!content) {
    validation.valid = false;
    validation.errors.push('Content is required');
    return validation;
  }

  // Type-specific validation
  switch (type) {
    case 'text':
      if (content.length < 1) {
        validation.valid = false;
        validation.errors.push('Text cannot be empty');
      }
      if (content.length > 5000) {
        validation.valid = false;
        validation.errors.push('Text exceeds maximum length');
      }
      break;

    case 'image':
      if (!content.url && !content.file) {
        validation.valid = false;
        validation.errors.push('Image file is required');
      }
      break;

    case 'video':
      if (!content.url && !content.file) {
        validation.valid = false;
        validation.errors.push('Video file is required');
      }
      break;
  }

  // Run moderation check
  const moderationResults = await exports.scanContent(content, type);

  if (!moderationResults.safe) {
    validation.valid = false;
    validation.errors.push(...moderationResults.violations.map(v => v.detail));
  }

  if (moderationResults.warnings) {
    validation.warnings.push(...moderationResults.warnings.map(w => w.detail));
  }

  return validation;
};

module.exports = exports;
