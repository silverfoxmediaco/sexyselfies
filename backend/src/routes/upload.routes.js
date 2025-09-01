const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth.middleware');
const { uploadVerification, uploadProfileImage } = require('../config/cloudinary');
const Creator = require('../models/Creator');
const Member = require('../models/Member');

console.log('Upload routes loaded - uploadVerification is:', typeof uploadVerification);
console.log('uploadVerification available methods:', uploadVerification ? Object.getOwnPropertyNames(uploadVerification) : 'undefined');

// Test route to verify the endpoint is accessible
router.get('/test', (req, res) => {
  res.json({ message: 'Upload routes are working' });
});

// Use the dedicated uploadVerification for ID documents
let verificationUpload;
try {
  verificationUpload = uploadVerification.fields([
    { name: 'idFront', maxCount: 1 },
    { name: 'idBack', maxCount: 1 },
    { name: 'selfie', maxCount: 1 }
  ]);
  console.log('Successfully configured verificationUpload fields');
} catch (error) {
  console.error('Error configuring verificationUpload fields:', error);
  // Fallback to single file upload
  verificationUpload = uploadVerification.single('file');
}

// Upload verification documents (ID verification)
router.post('/verification', 
  protect, 
  (req, res, next) => {
    console.log('=== VERIFICATION ENDPOINT HIT ===');
    console.log('Request method:', req.method);
    console.log('Request URL:', req.originalUrl);
    console.log('Headers:', req.headers);
    console.log('User from protect middleware:', req.user);
    console.log('Body before multer:', req.body);
    console.log('verificationUpload is:', typeof verificationUpload);
    next();
  },
  (req, res, next) => {
    console.log('=== APPLYING MULTER MIDDLEWARE ===');
    if (typeof verificationUpload !== 'function') {
      console.error('ERROR: verificationUpload is not a function:', verificationUpload);
      return res.status(500).json({
        success: false,
        error: 'File upload configuration error'
      });
    }
    verificationUpload(req, res, next);
  }, 
  async (req, res) => {
    try {
      console.log('=== AFTER MULTER PROCESSING ===');
      console.log('User ID:', req.user?.id);
      console.log('Files received:', req.files ? Object.keys(req.files) : 'None');
      console.log('Body after multer:', req.body);

      // Check if files were uploaded
      if (!req.files || Object.keys(req.files).length === 0) {
        console.log('ERROR: No files uploaded');
        return res.status(400).json({
          success: false,
          error: 'No verification documents uploaded'
        });
      }

      // Get the document URLs in the correct structure
      const verificationData = {
        idType: req.body.idType || 'drivers_license',
        idFrontUrl: null,
        idBackUrl: null,
        selfieUrl: null,
        submittedAt: new Date(),
        status: 'pending'
      };

      // Store URLs with proper field names
      if (req.files.idFront && req.files.idFront[0]) {
        verificationData.idFrontUrl = req.files.idFront[0].path || req.files.idFront[0].url || req.files.idFront[0].filename;
        console.log('ID Front URL:', verificationData.idFrontUrl);
      }
      
      if (req.files.idBack && req.files.idBack[0]) {
        verificationData.idBackUrl = req.files.idBack[0].path || req.files.idBack[0].url || req.files.idBack[0].filename;
        console.log('ID Back URL:', verificationData.idBackUrl);
      }
      
      if (req.files.selfie && req.files.selfie[0]) {
        verificationData.selfieUrl = req.files.selfie[0].path || req.files.selfie[0].url || req.files.selfie[0].filename;
        console.log('Selfie URL:', verificationData.selfieUrl);
      }

      // Check if creator exists, if not create one
      console.log('Looking for creator with user ID:', req.user.id);
      let creator = await Creator.findOne({ user: req.user.id });
      
      if (!creator) {
        console.log('No creator found, creating new one...');
        
        const creatorData = {
          user: req.user.id,
          displayName: req.body.displayName || req.user.username || req.user.email?.split('@')[0] || 'Creator',
          verification: verificationData, // Use verification object instead of verificationDocuments array
          verificationStatus: 'pending',
          verificationSubmittedAt: new Date()
        };
        
        console.log('Creating creator with data:', creatorData);
        
        creator = await Creator.create(creatorData);
        
        console.log('New creator created:', creator._id);
      } else {
        console.log('Found existing creator:', creator._id);
        
        // Update existing creator with proper structure
        creator.verification = verificationData;
        creator.verificationStatus = 'pending';
        creator.verificationSubmittedAt = new Date();
        
        await creator.save();
        
        console.log('Updated existing creator with verification data');
      }

      if (!creator) {
        console.log('ERROR: Failed to create or update creator');
        return res.status(404).json({
          success: false,
          error: 'Failed to create or update creator profile'
        });
      }

      console.log('SUCCESS: Sending response');
      res.status(200).json({
        success: true,
        message: 'Verification documents uploaded successfully',
        data: {
          verification: verificationData,
          creatorId: creator._id,
          verificationStatus: 'pending'
        }
      });
      
    } catch (error) {
      console.error('=== VERIFICATION UPLOAD ERROR ===');
      console.error('Error type:', error.name);
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
      
      // Check for specific error types
      if (error.name === 'ValidationError') {
        console.error('Validation errors:', error.errors);
      }
      
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to upload verification documents',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
    }
});

// Profile image upload endpoint
const profileImageUpload = uploadProfileImage.single('profileImage');

router.post('/profile-image', 
  protect, 
  (req, res, next) => {
    console.log('=== PROFILE IMAGE UPLOAD ENDPOINT HIT ===');
    console.log('Headers:', req.headers);
    console.log('User from protect middleware:', req.user);
    console.log('Body before multer:', req.body);
    next();
  },
  profileImageUpload, 
  async (req, res) => {
    try {
      console.log('=== AFTER MULTER PROCESSING ===');
      console.log('User ID:', req.user?.id);
      console.log('File received:', req.file ? 'YES' : 'NO');
      console.log('File details:', req.file);

      // Check if file was uploaded
      if (!req.file) {
        console.log('ERROR: No file uploaded');
        return res.status(400).json({
          success: false,
          error: 'No image file uploaded'
        });
      }

      const imageUrl = req.file.path || req.file.url || req.file.secure_url;
      console.log('Image URL from Cloudinary:', imageUrl);

      if (!imageUrl) {
        console.log('ERROR: No image URL returned from Cloudinary');
        return res.status(500).json({
          success: false,
          error: 'Failed to get image URL from upload service'
        });
      }

      // Update the Creator document with the new profile image
      const updatedCreator = await Creator.findOneAndUpdate(
        { user: req.user.id },
        { profileImage: imageUrl },
        { new: true, runValidators: true }
      );

      if (!updatedCreator) {
        console.log('ERROR: Creator not found for profile update');
        return res.status(404).json({
          success: false,
          error: 'Creator not found'
        });
      }

      console.log('SUCCESS: Profile image updated for creator:', updatedCreator._id);
      
      res.status(200).json({
        success: true,
        message: 'Profile image updated successfully',
        data: {
          imageUrl: imageUrl,
          creator: {
            id: updatedCreator._id,
            profileImage: updatedCreator.profileImage
          }
        }
      });
      
    } catch (error) {
      console.error('=== PROFILE IMAGE UPLOAD ERROR ===');
      console.error('Error type:', error.name);
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
      
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to upload profile image',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
    }
});

// Simple error handler (since we can't import handleUploadError)
router.use((error, req, res, next) => {
  console.error('=== MULTER/UPLOAD ERROR ===');
  console.error('Error:', error);
  
  if (error.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({
      success: false,
      error: 'File size exceeds the limit'
    });
  }
  
  return res.status(500).json({
    success: false,
    error: error.message || 'File upload failed'
  });
});

// Catch-all route for debugging
router.all('*', (req, res) => {
  console.log('=== UPLOAD ROUTE CATCH-ALL ===');
  console.log('Method:', req.method);
  console.log('Path:', req.path);
  console.log('Original URL:', req.originalUrl);
  console.log('Available routes on this router:', router.stack.map(r => ({
    path: r.route?.path,
    methods: r.route?.methods
  })));
  
  res.status(404).json({
    success: false,
    error: `Upload route not found: ${req.method} ${req.path}`,
    availableRoutes: router.stack.map(r => r.route?.path).filter(Boolean)
  });
});

module.exports = router;