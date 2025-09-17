const Creator = require('../models/Creator');
const Member = require('../models/Member');
const Content = require('../models/Content');
const { cloudinary } = require('../config/cloudinary');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');

// Create storage for verification documents (separate configuration)
const verificationStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'sexyselfies/verification',
    allowed_formats: ['jpg', 'jpeg', 'png', 'pdf'],
    public_id: (req, file) => `verification_${req.user.id}_${Date.now()}`,
  },
});

const uploadVerificationDocs = multer({
  storage: verificationStorage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
});

// Upload profile image for creator or member
exports.uploadProfileImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No file uploaded',
      });
    }

    const imageUrl = req.file.path;
    const publicId = req.file.filename;

    // Update based on user role
    if (req.user.role === 'creator') {
      // Delete old profile image from Cloudinary if it exists
      const creator = await Creator.findOne({ user: req.user.id });
      if (
        creator &&
        creator.profileImage &&
        creator.profileImage !== 'default-avatar.jpg'
      ) {
        const oldPublicId = creator.profileImage.split('/').pop().split('.')[0];
        await cloudinary.uploader.destroy(
          `sexyselfies/profiles/${oldPublicId}`
        );
      }

      // Update creator profile
      await Creator.findOneAndUpdate(
        { user: req.user.id },
        { profileImage: imageUrl },
        { new: true, upsert: true }
      );
    } else if (req.user.role === 'member') {
      // Delete old profile image from Cloudinary if it exists
      const member = await Member.findOne({ user: req.user.id });
      if (
        member &&
        member.profileImage &&
        member.profileImage !== 'default-avatar.jpg'
      ) {
        const oldPublicId = member.profileImage.split('/').pop().split('.')[0];
        await cloudinary.uploader.destroy(
          `sexyselfies/profiles/${oldPublicId}`
        );
      }

      // Update member profile
      await Member.findOneAndUpdate(
        { user: req.user.id },
        { profileImage: imageUrl },
        { new: true, upsert: true }
      );
    }

    res.status(200).json({
      success: true,
      data: {
        imageUrl: imageUrl,
        publicId: publicId,
      },
    });
  } catch (error) {
    console.error('Profile image upload error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

// Upload cover image for creator
exports.uploadCoverImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No file uploaded',
      });
    }

    if (req.user.role !== 'creator') {
      return res.status(403).json({
        success: false,
        error: 'Only creators can upload cover images',
      });
    }

    const imageUrl = req.file.path;
    const publicId = req.file.filename;

    // Delete old cover image from Cloudinary if it exists
    const creator = await Creator.findOne({ user: req.user.id });
    if (creator && creator.coverImage) {
      const oldPublicId = creator.coverImage.split('/').pop().split('.')[0];
      await cloudinary.uploader.destroy(`sexyselfies/profiles/${oldPublicId}`);
    }

    // Update creator profile
    await Creator.findOneAndUpdate(
      { user: req.user.id },
      { coverImage: imageUrl },
      { new: true }
    );

    res.status(200).json({
      success: true,
      data: {
        imageUrl: imageUrl,
        publicId: publicId,
      },
    });
  } catch (error) {
    console.error('Cover image upload error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

// Upload content (images or video)
exports.uploadContent = async (req, res) => {
  try {
    console.log('🔍 Upload request received');
    console.log('User:', req.user?.id, req.user?.role);
    console.log('Files:', req.files?.length || 0);
    console.log('Body:', req.body);

    if (req.user.role !== 'creator') {
      console.log('❌ Access denied: not a creator');
      return res.status(403).json({
        success: false,
        error: 'Only creators can upload content',
      });
    }

    console.log('🔍 Finding creator profile...');
    const creator = await Creator.findOne({ user: req.user.id });
    if (!creator) {
      console.log('❌ Creator profile not found');
      return res.status(404).json({
        success: false,
        error: 'Creator profile not found',
      });
    }
    console.log('✅ Creator found:', creator._id);

    const {
      title,
      description,
      price,
      type,
      tags,
      isFree,
      isPreview,
      allowTips,
      scheduledFor,
      expiresAt,
    } = req.body;

    // Handle multiple images or single video
    console.log('🔍 Processing files...');
    const mediaFiles = req.files?.content || (req.file ? [req.file] : []);
    const customThumbnail = req.files?.customThumbnail?.[0]; // Custom thumbnail for videos
    console.log('Media files found:', mediaFiles?.length || 0);
    console.log('Custom thumbnail:', customThumbnail ? 'Yes' : 'No');

    if (!mediaFiles || mediaFiles.length === 0) {
      console.log('❌ No files uploaded');
      return res.status(400).json({
        success: false,
        error: 'No files uploaded',
      });
    }

    // Generate batch ID for this upload session
    console.log('🔍 Generating upload batch ID...');
    const mongoose = require('mongoose');
    const uploadBatch = new mongoose.Types.ObjectId().toString();
    console.log('Upload batch:', uploadBatch);

    // Process media files
    console.log('🔍 Processing media files...');
    const media = await Promise.all(
      mediaFiles.map(async (file, index) => {
        console.log(`Processing file ${index + 1}:`, {
          filename: file.filename,
          originalname: file.originalname,
          mimetype: file.mimetype,
          path: file.path,
        });
        // Get file metadata - file should be from Cloudinary multer middleware
        let dimensions = {};
        let duration = null;

        // Determine file type from mimetype since resource_type might not be set
        const isVideo = file.mimetype && file.mimetype.startsWith('video/');

        if (isVideo) {
          // For videos, try to get metadata from Cloudinary
          try {
            const resource = await cloudinary.api.resource(file.filename, {
              resource_type: 'video',
            });
            duration = resource.duration;
            dimensions = {
              width: resource.width,
              height: resource.height,
            };
          } catch (error) {
            console.log('Could not get video metadata:', error.message);
            // Use defaults
            dimensions = { width: 1280, height: 720 };
          }
        } else {
          // For images, use basic dimensions
          dimensions = {
            width: 1200,
            height: 1200,
          };
        }

        return {
          url: file.path, // Cloudinary URL
          type: isVideo ? 'video' : 'photo', // Match Content model enum
          duration: duration,
          size: file.size,
          dimensions: dimensions,
          cloudinaryPublicId: file.filename, // Cloudinary public ID
          originalName: file.originalname, // Original filename
        };
      })
    );

    // Set thumbnail (custom thumbnail, first image, or auto-generated video thumbnail)
    let thumbnail = media[0].url;
    if (customThumbnail && media[0].type === 'video') {
      // Use custom thumbnail for videos
      console.log('🔍 Using custom thumbnail for video');
      thumbnail = customThumbnail.path;
    } else if (media[0].type === 'video') {
      // Generate auto video thumbnail
      console.log('🔍 Using auto-generated thumbnail for video');
      thumbnail = thumbnail.replace('/upload/', '/upload/so_0/');
    }

    // Prepare custom thumbnail data if provided
    let customThumbnailData = null;
    if (customThumbnail && media[0].type === 'video') {
      customThumbnailData = {
        url: customThumbnail.path,
        cloudinaryPublicId: customThumbnail.filename,
        isCustom: true,
      };
      console.log('🔍 Custom thumbnail data:', customThumbnailData);
    }

    // Create content document
    console.log('🔍 Creating content document...');
    console.log('Content data:', {
      creator: creator._id,
      type: type || (media[0].type === 'video' ? 'video' : 'photo'),
      title: title || '',
      description: description || '',
      thumbnail: thumbnail,
      customThumbnail: customThumbnailData,
      mediaCount: media.length,
      uploadBatch: uploadBatch,
      price: parseFloat(price) || creator.contentPrice || 2.99,
      allowTips: allowTips === 'true' || allowTips === true,
    });

    // Robust type mapping - handle all possible frontend inputs
    let contentType;
    if (type === 'image' || type === 'photo') {
      contentType = 'photo';
    } else if (type === 'video') {
      contentType = 'video';
    } else {
      // Auto-detect from media if type not provided or unknown
      contentType = media[0].type === 'video' ? 'video' : 'photo';
    }

    // Validate and clean data before saving
    const cleanTitle = (title || '').substring(0, 100); // Enforce max length
    const cleanDescription = (description || '').substring(0, 500); // Enforce max length
    const cleanPrice = Math.min(
      Math.max(parseFloat(price) || creator.contentPrice || 2.99, 0),
      99.99
    ); // Enforce price range

    console.log('🔍 Final content data before save:', {
      creator: creator._id,
      type: contentType,
      title: cleanTitle,
      description: cleanDescription,
      thumbnail: thumbnail,
      price: cleanPrice,
      mediaCount: media.length,
      mediaTypes: media.map(m => m.type),
    });

    const content = await Content.create({
      creator: creator._id,
      type: contentType,
      title: cleanTitle,
      description: cleanDescription,
      thumbnail: thumbnail,
      customThumbnail: customThumbnailData,
      media: media,
      uploadBatch: uploadBatch,
      contentOrder: 0, // Will be updated if multiple files in batch
      price: cleanPrice,
      isFree: isFree === 'true' || isFree === true || cleanPrice === 0,
      isPreview: isPreview === 'true' || isPreview === true,
      allowTips: allowTips === 'true' || allowTips === true,
      tags: tags ? (Array.isArray(tags) ? tags : JSON.parse(tags || '[]')) : [],
      scheduledFor: scheduledFor ? new Date(scheduledFor) : null,
      expiresAt: expiresAt ? new Date(expiresAt) : null,
      isActive: !scheduledFor || new Date(scheduledFor) <= new Date(),
    });

    res.status(201).json({
      success: true,
      data: {
        contentId: content._id,
        uploadBatch: uploadBatch,
        title: content.title,
        description: content.description,
        price: content.price,
        type: content.type,
        media: content.media.map(m => ({
          url: m.url,
          type: m.type,
          size: m.size,
          dimensions: m.dimensions,
          cloudinaryPublicId: m.cloudinaryPublicId,
          originalName: m.originalName,
        })),
        thumbnail: content.thumbnail,
        tags: content.tags,
        allowTips: content.allowTips,
        isActive: content.isActive,
        createdAt: content.createdAt,
      },
    });
  } catch (error) {
    console.error('💥 Content upload error:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

// Upload gallery
exports.uploadGallery = async (req, res) => {
  try {
    if (req.user.role !== 'creator') {
      return res.status(403).json({
        success: false,
        error: 'Only creators can upload galleries',
      });
    }

    const creator = await Creator.findOne({ user: req.user.id });
    if (!creator) {
      return res.status(404).json({
        success: false,
        error: 'Creator profile not found',
      });
    }

    const { title, price } = req.body;

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No files uploaded',
      });
    }

    if (!title || !price) {
      return res.status(400).json({
        success: false,
        error: 'Title and price are required for galleries',
      });
    }

    // Get image URLs
    const images = req.files.map(file => file.path);
    const thumbnail = images[0]; // Use first image as thumbnail

    // Create gallery
    const gallery = {
      title: title,
      thumbnail: thumbnail,
      images: images,
      price: parseFloat(price),
      purchasedBy: [],
    };

    // Add gallery to creator
    creator.galleries.push(gallery);
    await creator.save();

    res.status(201).json({
      success: true,
      data: gallery,
    });
  } catch (error) {
    console.error('Gallery upload error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

// Upload verification documents
exports.uploadVerificationDocuments = async (req, res) => {
  try {
    if (req.user.role !== 'creator') {
      return res.status(403).json({
        success: false,
        error: 'Only creators can upload verification documents',
      });
    }

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No files uploaded',
      });
    }

    const documentUrls = req.files.map(file => file.path);

    // Update creator with verification documents
    const creator = await Creator.findOneAndUpdate(
      { user: req.user.id },
      {
        $push: { verificationDocuments: { $each: documentUrls } },
      },
      { new: true }
    );

    res.status(200).json({
      success: true,
      data: {
        documents: documentUrls,
        message:
          'Verification documents uploaded successfully. Our team will review them shortly.',
      },
    });
  } catch (error) {
    console.error('Verification document upload error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

// Middleware export for verification documents
exports.verificationDocsUpload = uploadVerificationDocs.array('documents', 5); // Max 5 documents

// Delete uploaded file from Cloudinary
exports.deleteUploadedFile = async (req, res) => {
  try {
    const { publicId, resourceType = 'image' } = req.body;

    if (!publicId) {
      return res.status(400).json({
        success: false,
        error: 'Public ID is required',
      });
    }

    // Delete from Cloudinary
    const result = await cloudinary.uploader.destroy(publicId, {
      resource_type: resourceType,
    });

    if (result.result !== 'ok') {
      return res.status(400).json({
        success: false,
        error: 'Failed to delete file',
      });
    }

    res.status(200).json({
      success: true,
      message: 'File deleted successfully',
    });
  } catch (error) {
    console.error('File deletion error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

// Get upload signature for direct upload from frontend
exports.getUploadSignature = async (req, res) => {
  try {
    const { uploadPreset, folder } = req.body;

    const timestamp = Math.round(new Date().getTime() / 1000);
    const signature = cloudinary.utils.api_sign_request(
      {
        timestamp: timestamp,
        upload_preset: uploadPreset,
        folder: folder || 'sexyselfies/temp',
      },
      process.env.CLOUDINARY_API_SECRET
    );

    res.status(200).json({
      success: true,
      data: {
        signature: signature,
        timestamp: timestamp,
        cloudName: process.env.CLOUDINARY_CLOUD_NAME,
        apiKey: process.env.CLOUDINARY_API_KEY,
      },
    });
  } catch (error) {
    console.error('Signature generation error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};
