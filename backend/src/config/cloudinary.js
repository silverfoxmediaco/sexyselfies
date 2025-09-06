const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');

// Configure Cloudinary
console.log('Configuring Cloudinary with:', {
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME ? 'SET' : 'MISSING',
  api_key: process.env.CLOUDINARY_API_KEY ? 'SET' : 'MISSING',
  api_secret: process.env.CLOUDINARY_API_SECRET ? 'SET' : 'MISSING'
});

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true  // Force HTTPS URLs
});

// Create storage for profile images
const profileImageStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'sexyselfies/profiles',
    allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
    transformation: [{ width: 500, height: 500, crop: 'fill' }],
    public_id: (req, file) => `profile_${req.user.id}_${Date.now()}`
  }
});

// Create storage for content images and videos (mixed content)
const contentImageStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: (req, file) => {
    const isVideo = file.mimetype && file.mimetype.startsWith('video/');
    return {
      folder: isVideo ? 'sexyselfies/videos' : 'sexyselfies/content',
      resource_type: isVideo ? 'video' : 'image',
      allowed_formats: isVideo 
        ? ['mp4', 'mov', 'avi', 'webm', 'mkv']
        : ['jpg', 'jpeg', 'png', 'gif', 'webp'],
      transformation: isVideo ? [] : [{ width: 1200, height: 1200, crop: 'limit' }],
      public_id: `content_${req.user.id}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    };
  }
});

// Create storage for VERIFICATION DOCUMENTS - THIS WAS MISSING!
const verificationStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'sexyselfies/verification',
    allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
    // No transformation - keep original quality for ID verification
    public_id: (req, file) => `verify_${req.user.id}_${file.fieldname}_${Date.now()}`
  }
});

// Create storage for content videos
const contentVideoStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'sexyselfies/videos',
    resource_type: 'video',
    allowed_formats: ['mp4', 'mov', 'avi', 'webm'],
    public_id: (req, file) => `video_${req.user.id}_${Date.now()}`
  }
});

// Create multer instances
const uploadProfileImage = multer({ 
  storage: profileImageStorage,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

const uploadContentImage = multer({ 
  storage: contentImageStorage,
  limits: { fileSize: 100 * 1024 * 1024 } // 100MB limit for both images and videos
});

// VERIFICATION UPLOAD INSTANCE - THIS WAS MISSING!
const uploadVerification = multer({ 
  storage: verificationStorage,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit for ID photos
});

const uploadContentVideo = multer({ 
  storage: contentVideoStorage,
  limits: { fileSize: 100 * 1024 * 1024 } // 100MB limit
});

module.exports = {
  cloudinary,
  uploadProfileImage,
  uploadContentImage,
  uploadVerification,  // EXPORT THIS FOR upload.routes.js TO USE!
  uploadContentVideo
};