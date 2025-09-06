const { uploadProfileImage, uploadContentImage, uploadContentVideo } = require('../config/cloudinary');
const multer = require('multer');

// Middleware for profile image upload
exports.profileImageUpload = uploadProfileImage.single('profileImage');

// Middleware for content image upload (multiple)
exports.contentImagesUpload = uploadContentImage.array('content', 10); // Max 10 files (images/videos)

// Middleware for content with custom thumbnails
exports.contentWithThumbnailUpload = uploadContentImage.fields([
  { name: 'content', maxCount: 10 }, // Content files
  { name: 'customThumbnail', maxCount: 1 } // Custom thumbnail for videos
]);

// Middleware for content video upload
exports.contentVideoUpload = uploadContentVideo.single('video');

// Error handler for upload errors
exports.handleUploadError = (error, req, res, next) => {
  if (error.message === 'File too large') {
    return res.status(400).json({
      success: false,
      error: 'File size exceeds the limit'
    });
  }
  
  if (error.message === 'Invalid file type') {
    return res.status(400).json({
      success: false,
      error: 'Invalid file format'
    });
  }
  
  return res.status(500).json({
    success: false,
    error: 'File upload failed'
  });
};
