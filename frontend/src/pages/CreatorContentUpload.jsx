import React, { useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Upload, X, Image, Video, DollarSign, Tag, Eye, EyeOff,
  AlertCircle, CheckCircle, Loader, Plus, TrendingUp,
  Calendar, FileText, Camera, Film, ArrowLeft, ArrowRight,
  Send, Lock, Unlock, Hash, Gift
} from 'lucide-react';
import BottomNavigation from '../components/BottomNavigation';
import CreatorMainHeader from '../components/CreatorMainHeader';
import CreatorMainFooter from '../components/CreatorMainFooter';
import { useIsMobile, useIsDesktop, getUserRole } from '../utils/mobileDetection';
import { uploadApi } from '../services/api.config';
import './CreatorContentUpload.css';

const CreatorContentUpload = () => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const isDesktop = useIsDesktop();
  const userRole = getUserRole();
  const fileInputRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({});
  const [currentStep, setCurrentStep] = useState(1); // 1: Upload, 2: Details, 3: Review
  
  // Form state
  const [uploads, setUploads] = useState([]);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [videoThumbnails, setVideoThumbnails] = useState({});
  const [contentDetails, setContentDetails] = useState({
    title: '',
    description: '',
    category: '',
    tags: [],
    pricing: {
      amount: 2.99,
      currency: 'USD'
    },
    visibility: 'public', // public, private, scheduled
    scheduledDate: null,
    allowTips: true
  });
  
  const [errors, setErrors] = useState({});
  const [isUploading, setIsUploading] = useState(false);

  // Categories
  const contentTypes = [
    { id: 'photos', label: 'Photos', icon: Camera, color: 'blue' },
    { id: 'videos', label: 'Videos', icon: Film, color: 'purple' }
  ];

  // Popular tags
  const popularTags = [
    'exclusive', 'behind-the-scenes', 'daily', 'premium',
    'natural', 'glamour', 'casual', 'professional'
  ];

  // Handle drag events
  const handleDragEnter = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    const files = Array.from(e.dataTransfer.files);
    handleFiles(files);
  }, []);

  // Handle file selection
  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    handleFiles(files);
  };

  const handleFiles = (files) => {
    const validFiles = files.filter(file => {
      const isValid = file.type.startsWith('image/') || file.type.startsWith('video/');
      const isUnderLimit = file.size <= 100 * 1024 * 1024; // 100MB limit
      return isValid && isUnderLimit;
    });

    if (validFiles.length !== files.length) {
      setErrors({ 
        file: 'Some files were rejected. Only images and videos under 100MB are allowed.' 
      });
    }

    const newUploads = validFiles.map(file => ({
      id: Math.random().toString(36).substr(2, 9),
      file,
      preview: URL.createObjectURL(file),
      type: file.type.startsWith('image/') ? 'image' : 'video',
      size: file.size,
      name: file.name,
      progress: 0,
      status: 'pending', // pending, uploading, complete, error
      price: contentDetails.pricing.amount,
      customThumbnail: null // For video custom thumbnails
    }));

    setUploads(prev => [...prev, ...newUploads]);
    setSelectedFiles(prev => [...prev, ...validFiles]);
  };

  // Remove file from upload list
  const removeFile = (id) => {
    setUploads(prev => prev.filter(upload => upload.id !== id));
    // Clean up preview URLs
    const upload = uploads.find(u => u.id === id);
    if (upload?.preview) {
      URL.revokeObjectURL(upload.preview);
    }
    if (upload?.customThumbnail) {
      URL.revokeObjectURL(upload.customThumbnail);
    }
    // Remove video thumbnail from state
    setVideoThumbnails(prev => {
      const newThumbnails = { ...prev };
      delete newThumbnails[id];
      return newThumbnails;
    });
  };

  // Update individual file price
  const updateFilePrice = (id, price) => {
    setUploads(prev => prev.map(upload => 
      upload.id === id ? { ...upload, price: parseFloat(price) } : upload
    ));
  };

  // Toggle tag selection
  const toggleTag = (tag) => {
    setContentDetails(prev => ({
      ...prev,
      tags: prev.tags.includes(tag)
        ? prev.tags.filter(t => t !== tag)
        : [...prev.tags, tag].slice(0, 5) // Max 5 tags
    }));
  };

  // Add custom tag
  const addCustomTag = (e) => {
    if (e.key === 'Enter' && e.target.value.trim()) {
      const newTag = e.target.value.trim().toLowerCase();
      if (!contentDetails.tags.includes(newTag) && contentDetails.tags.length < 5) {
        setContentDetails(prev => ({
          ...prev,
          tags: [...prev.tags, newTag]
        }));
        e.target.value = '';
      }
    }
  };

  // Handle video thumbnail upload
  const handleThumbnailUpload = (videoId, file) => {
    if (!file || !file.type.startsWith('image/')) return;
    
    const thumbnailUrl = URL.createObjectURL(file);
    
    // Update uploads with custom thumbnail
    setUploads(prev => prev.map(upload => 
      upload.id === videoId 
        ? { ...upload, customThumbnail: thumbnailUrl, thumbnailFile: file }
        : upload
    ));
    
    // Store in video thumbnails state for easy access
    setVideoThumbnails(prev => ({
      ...prev,
      [videoId]: { url: thumbnailUrl, file }
    }));
  };

  // Remove custom thumbnail
  const removeThumbnail = (videoId) => {
    const upload = uploads.find(u => u.id === videoId);
    if (upload?.customThumbnail) {
      URL.revokeObjectURL(upload.customThumbnail);
    }
    
    setUploads(prev => prev.map(upload => 
      upload.id === videoId 
        ? { ...upload, customThumbnail: null, thumbnailFile: null }
        : upload
    ));
    
    setVideoThumbnails(prev => {
      const newThumbnails = { ...prev };
      delete newThumbnails[videoId];
      return newThumbnails;
    });
  };

  // Validate form
  const validateForm = () => {
    const newErrors = {};
    
    if (uploads.length === 0) {
      newErrors.files = 'Please select at least one file to upload';
    }
    
    if (!contentDetails.category) {
      newErrors.category = 'Please select a category';
    }
    
    if (contentDetails.tags.length === 0) {
      newErrors.tags = 'Please add at least one tag';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle upload submission
  const handleUpload = async () => {
    if (!validateForm()) return;
    
    setIsUploading(true);
    
    try {
      const token = localStorage.getItem('token');
      
      for (const upload of uploads) {
        const formData = new FormData();
        formData.append('content', upload.file);
        formData.append('title', contentDetails.title || upload.name);
        formData.append('description', contentDetails.description);
        formData.append('type', upload.type); // photo or video
        formData.append('tags', JSON.stringify(contentDetails.tags));
        formData.append('price', upload.price);
        formData.append('isFree', contentDetails.visibility === 'free');
        formData.append('isPreview', contentDetails.visibility === 'preview');
        formData.append('allowTips', contentDetails.allowTips);
        if (contentDetails.scheduledDate) {
          formData.append('scheduledFor', contentDetails.scheduledDate);
        }
        
        // Update upload status
        setUploads(prev => prev.map(u => 
          u.id === upload.id ? { ...u, status: 'uploading' } : u
        ));
        
        // Add custom thumbnail for videos
        if (upload.type === 'video' && upload.thumbnailFile) {
          formData.append('customThumbnail', upload.thumbnailFile);
        }
        
        // Upload with progress tracking - using uploadApi from config
        const response = await uploadApi.post(
          '/creators/content/upload',
          formData,
          {
            onUploadProgress: (progressEvent) => {
              const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
              setUploadProgress(prev => ({ ...prev, [upload.id]: progress }));
              setUploads(prev => prev.map(u => 
                u.id === upload.id ? { ...u, progress } : u
              ));
            }
          }
        );
        
        // Mark as complete and update with backend data
        const backendData = response.data.data;
        console.log('🔍 Backend response data:', backendData);
        console.log('🔍 ContentId from backend:', backendData.contentId);
        setUploads(prev => prev.map(u => 
          u.id === upload.id ? { 
            ...u, 
            status: 'complete',
            contentId: backendData.contentId, // MongoDB _id from backend
            uploadBatch: backendData.uploadBatch, // Batch ID for grouping
            cloudinaryPublicId: backendData.media[0]?.cloudinaryPublicId, // For deletion
            backendUrl: backendData.media[0]?.url // Cloudinary URL
          } : u
        ));
      }
      
      // Show success message
      setTimeout(() => {
        navigate('/creator/content');
      }, 2000);
      
    } catch (error) {
      console.error('Upload error:', error);
      
      // Mark failed uploads
      setUploads(prev => prev.map(u => 
        u.status === 'uploading' ? { ...u, status: 'error' } : u
      ));
      
      setErrors({ 
        submit: error.response?.data?.error || error.response?.data?.message || 'Upload failed. Please try again.' 
      });
    } finally {
      setIsUploading(false);
    }
  };

  // Step 1: File Upload
  const UploadStep = () => (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="creator-content-upload-step"
    >
      <div className="creator-content-upload-step-header">
        <h2>Upload Your Content</h2>
        <p>Share your exclusive photos and videos with your fans</p>
      </div>

      {/* Drop Zone */}
      <div
        className={`creator-content-upload-drop-zone ${isDragging ? 'creator-content-upload-dragging' : ''} ${uploads.length > 0 ? 'creator-content-upload-has-files' : ''}`}
        onDragEnter={handleDragEnter}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*,video/*"
          onChange={handleFileSelect}
          style={{ display: 'none' }}
        />
        
        {uploads.length === 0 ? (
          <div className="creator-content-upload-drop-zone-content">
            <Upload size={48} className="creator-content-upload-drop-icon" />
            <h3>Drag & drop your files here</h3>
            <p>or click to browse</p>
            <div className="creator-content-upload-file-types">
              <span className="creator-content-upload-file-type">
                <Image size={16} />
                Images
              </span>
              <span className="creator-content-upload-file-type">
                <Video size={16} />
                Videos
              </span>
            </div>
            <p className="creator-content-upload-file-limit">Max 100MB per file</p>
          </div>
        ) : (
          <div className="creator-content-upload-add-more">
            <Plus size={24} />
            <span>Add more files</span>
          </div>
        )}
      </div>

      {errors.file && (
        <div className="creator-content-upload-error-message">
          <AlertCircle size={16} />
          {errors.file}
        </div>
      )}

      {/* File Preview Grid */}
      {uploads.length > 0 && (
        <div className="creator-content-upload-file-preview-grid">
          <AnimatePresence>
            {uploads.map((upload) => (
              <motion.div
                key={upload.id}
                className="creator-content-upload-file-preview-card"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                layout
              >
                <div className="creator-content-upload-preview-container">
                  {upload.type === 'image' ? (
                    <img src={upload.preview} alt={upload.name} />
                  ) : (
                    <div className="creator-content-upload-video-preview">
                      {upload.customThumbnail ? (
                        <img 
                          src={upload.customThumbnail} 
                          alt="Custom thumbnail" 
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                      ) : (
                        <>
                          <Video size={32} />
                          <span>Video</span>
                        </>
                      )}
                    </div>
                  )}
                  
                  {/* Upload Progress */}
                  {upload.status === 'uploading' && (
                    <div className="creator-content-upload-progress-overlay">
                      <div className="creator-content-upload-progress-circle">
                        <Loader className="creator-content-upload-spinning" size={24} />
                        <span>{upload.progress}%</span>
                      </div>
                    </div>
                  )}
                  
                  {/* Success Indicator */}
                  {upload.status === 'complete' && (
                    <div className="creator-content-upload-success-overlay">
                      <CheckCircle size={32} />
                      {upload.contentId && (
                        <small style={{ fontSize: '10px', marginTop: '4px', color: 'white' }}>
                          ID: {String(upload.contentId).slice(-8)}
                        </small>
                      )}
                    </div>
                  )}
                  
                  {/* Remove Button */}
                  {upload.status === 'pending' && (
                    <button
                      className="creator-content-upload-remove-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeFile(upload.id);
                      }}
                    >
                      <X size={16} />
                    </button>
                  )}
                </div>
                
                <div className="creator-content-upload-file-info">
                  <p className="creator-content-upload-file-name">{upload.name}</p>
                  
                  {/* Custom Thumbnail Upload for Videos */}
                  {upload.type === 'video' && upload.status === 'pending' && (
                    <div className="creator-content-upload-thumbnail-section">
                      <label className="creator-content-upload-thumbnail-label">
                        Custom Thumbnail (Optional)
                      </label>
                      <div className="creator-content-upload-thumbnail-controls">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files[0];
                            if (file) handleThumbnailUpload(upload.id, file);
                          }}
                          style={{ display: 'none' }}
                          id={`thumbnail-${upload.id}`}
                        />
                        <label 
                          htmlFor={`thumbnail-${upload.id}`}
                          className="creator-content-upload-thumbnail-btn"
                        >
                          <Image size={14} />
                          {upload.customThumbnail ? 'Change' : 'Upload'}
                        </label>
                        {upload.customThumbnail && (
                          <button
                            type="button"
                            onClick={() => removeThumbnail(upload.id)}
                            className="creator-content-upload-thumbnail-remove"
                          >
                            <X size={14} />
                            Remove
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                  
                  <div className="creator-content-upload-file-meta">
                    <span className="creator-content-upload-file-size">
                      {(upload.size / 1024 / 1024).toFixed(2)} MB
                    </span>
                    <div className="creator-content-upload-price-controls">
                      <label className="creator-content-upload-free-checkbox">
                        <input
                          type="checkbox"
                          checked={upload.price === 0}
                          onChange={(e) => updateFilePrice(upload.id, e.target.checked ? 0 : 2.99)}
                          onClick={(e) => e.stopPropagation()}
                        />
                        <span>Free</span>
                      </label>
                      {upload.price > 0 && (
                        <div className="creator-content-upload-price-input">
                          <DollarSign size={14} />
                          <input
                            type="number"
                            min="0.99"
                            max="99.99"
                            step="0.01"
                            value={upload.price}
                            onChange={(e) => updateFilePrice(upload.id, e.target.value)}
                            onClick={(e) => e.stopPropagation()}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

    </motion.div>
  );

  // Step 2: Content Details
  const DetailsStep = () => (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="creator-content-upload-details-step"
    >
      <div className="creator-content-upload-step-header">
        <h2>Add Details</h2>
        <p>Help your fans discover your content</p>
      </div>

      {/* Title */}
      <div className="creator-content-upload-form-group">
        <label className="creator-content-upload-form-label">
          <FileText size={16} />
          Title (Optional)
        </label>
        <input
          type="text"
          className="creator-content-upload-form-input"
          placeholder="Give your content a catchy title..."
          value={contentDetails.title}
          onChange={(e) => setContentDetails(prev => ({ ...prev, title: e.target.value }))}
        />
      </div>

      {/* Description */}
      <div className="creator-content-upload-form-group">
        <label className="creator-content-upload-form-label">
          <FileText size={16} />
          Description (Optional)
        </label>
        <textarea
          className="creator-content-upload-form-textarea"
          placeholder="Tell your fans what makes this content special..."
          rows="3"
          value={contentDetails.description}
          onChange={(e) => setContentDetails(prev => ({ ...prev, description: e.target.value }))}
        />
      </div>

      {/* Categories */}
      <div className="creator-content-upload-form-group">
        <label className="creator-content-upload-form-label">
          <Tag size={16} />
          Category
          <span className="creator-content-upload-required">*</span>
        </label>
        <div className="creator-content-upload-category-grid">
          {contentTypes.map(category => (
            <motion.button
              key={category.id}
              className={`creator-content-upload-category-btn ${contentDetails.category === category.id ? 'creator-content-upload-selected' : ''} creator-content-upload-${category.color}`}
              onClick={() => setContentDetails(prev => ({ ...prev, category: category.id }))}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <category.icon size={20} />
              <span>{category.label}</span>
            </motion.button>
          ))}
        </div>
        {errors.category && (
          <span className="creator-content-upload-error-text">{errors.category}</span>
        )}
      </div>

      {/* Tags */}
      <div className="creator-content-upload-form-group">
        <label className="creator-content-upload-form-label">
          <Hash size={16} />
          Tags (Max 5)
          <span className="creator-content-upload-required">*</span>
        </label>
        <div className="creator-content-upload-tags-section">
          <div className="creator-content-upload-popular-tags">
            {popularTags.map(tag => (
              <button
                key={tag}
                className={`creator-content-upload-tag-btn ${contentDetails.tags.includes(tag) ? 'creator-content-upload-selected' : ''}`}
                onClick={() => toggleTag(tag)}
                disabled={!contentDetails.tags.includes(tag) && contentDetails.tags.length >= 5}
              >
                {tag}
              </button>
            ))}
          </div>
          <input
            type="text"
            className="creator-content-upload-tag-input"
            placeholder="Add custom tag and press Enter..."
            onKeyPress={addCustomTag}
            disabled={contentDetails.tags.length >= 5}
          />
          <div className="creator-content-upload-selected-tags">
            {contentDetails.tags.map(tag => (
              <span key={tag} className="creator-content-upload-selected-tag">
                #{tag}
                <button onClick={() => toggleTag(tag)}>
                  <X size={14} />
                </button>
              </span>
            ))}
          </div>
        </div>
        {errors.tags && (
          <span className="creator-content-upload-error-text">{errors.tags}</span>
        )}
      </div>

      {/* Advanced Settings */}
      <div className="creator-content-upload-advanced-settings">
        <h3>Advanced Settings</h3>
        
        <div className="creator-content-upload-settings-grid">
          
          
          <label className="creator-content-upload-setting-item">
            <input
              type="checkbox"
              checked={contentDetails.allowTips}
              onChange={(e) => setContentDetails(prev => ({ ...prev, allowTips: e.target.checked }))}
            />
            <span className="creator-content-upload-setting-label">
              <DollarSign size={16} />
              Accept tips
            </span>
          </label>
        </div>
      </div>

    </motion.div>
  );

  // Step 3: Review & Publish
  const ReviewStep = () => (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="creator-content-upload-review-step"
    >
      <div className="creator-content-upload-step-header">
        <h2>Review & Publish</h2>
        <p>Make sure everything looks perfect</p>
      </div>

      {/* Content Summary */}
      <div className="creator-content-upload-review-card">
        <h3>Content Summary</h3>
        <div className="creator-content-upload-summary-grid">
          <div className="creator-content-upload-summary-item">
            <span className="creator-content-upload-label">Files:</span>
            <span className="creator-content-upload-value">{uploads.length} items</span>
          </div>
          <div className="creator-content-upload-summary-item">
            <span className="creator-content-upload-label">Category:</span>
            <span className="creator-content-upload-value">{contentDetails.category}</span>
          </div>
          <div className="creator-content-upload-summary-item">
            <span className="creator-content-upload-label">Tags:</span>
            <span className="creator-content-upload-value">{contentDetails.tags.join(', ')}</span>
          </div>
          <div className="creator-content-upload-summary-item">
            <span className="creator-content-upload-label">Total Size:</span>
            <span className="creator-content-upload-value">
              {(uploads.reduce((acc, u) => acc + u.size, 0) / 1024 / 1024).toFixed(2)} MB
            </span>
          </div>
        </div>
      </div>

      {/* Pricing Summary */}
      <div className="creator-content-upload-review-card">
        <h3>Pricing</h3>
        <div className="creator-content-upload-pricing-list">
          {uploads.map(upload => (
            <div key={upload.id} className="creator-content-upload-pricing-item">
              <span className="creator-content-upload-file-name">{upload.name}</span>
              <span className="creator-content-upload-price">${upload.price}</span>
            </div>
          ))}
          <div className="creator-content-upload-pricing-total">
            <span>Average Price:</span>
            <span className="creator-content-upload-total">
              ${(uploads.reduce((acc, u) => acc + u.price, 0) / uploads.length).toFixed(2)}
            </span>
          </div>
        </div>
      </div>

      {/* Visibility Options */}
      <div className="creator-content-upload-visibility-options">
        <h3>Visibility</h3>
        <div className="creator-content-upload-visibility-grid">
          <label className="creator-content-upload-visibility-option">
            <input
              type="radio"
              name="visibility"
              value="free"
              checked={contentDetails.visibility === 'free'}
              onChange={(e) => setContentDetails(prev => ({ ...prev, visibility: e.target.value }))}
            />
            <div className="creator-content-upload-option-content">
              <Gift size={20} />
              <span className="creator-content-upload-option-title">Free</span>
              <span className="creator-content-upload-option-desc">Free sample for everyone</span>
            </div>
          </label>
          
          <label className="creator-content-upload-visibility-option">
            <input
              type="radio"
              name="visibility"
              value="public"
              checked={contentDetails.visibility === 'public'}
              onChange={(e) => setContentDetails(prev => ({ ...prev, visibility: e.target.value }))}
            />
            <div className="creator-content-upload-option-content">
              <Unlock size={20} />
              <span className="creator-content-upload-option-title">Public</span>
              <span className="creator-content-upload-option-desc">Available to all connections</span>
            </div>
          </label>
          
          <label className="creator-content-upload-visibility-option">
            <input
              type="radio"
              name="visibility"
              value="private"
              checked={contentDetails.visibility === 'private'}
              onChange={(e) => setContentDetails(prev => ({ ...prev, visibility: e.target.value }))}
            />
            <div className="creator-content-upload-option-content">
              <Lock size={20} />
              <span className="creator-content-upload-option-title">Private</span>
              <span className="creator-content-upload-option-desc">Only for selected connections</span>
            </div>
          </label>
          
          <label className="creator-content-upload-visibility-option">
            <input
              type="radio"
              name="visibility"
              value="scheduled"
              checked={contentDetails.visibility === 'scheduled'}
              onChange={(e) => setContentDetails(prev => ({ ...prev, visibility: e.target.value }))}
            />
            <div className="creator-content-upload-option-content">
              <Calendar size={20} />
              <span className="creator-content-upload-option-title">Schedule</span>
              <span className="creator-content-upload-option-desc">Post at optimal time</span>
            </div>
          </label>
        </div>
      </div>

      {/* Estimated Earnings */}
      <div className="creator-content-upload-earnings-preview">
        <div className="creator-content-upload-earnings-header">
          <TrendingUp size={20} />
          <span>Estimated Earnings</span>
        </div>
        <div className="creator-content-upload-earnings-content">
          <div className="creator-content-upload-earnings-stat">
            <span className="creator-content-upload-stat-label">Per View:</span>
            <span className="creator-content-upload-stat-value">
              ${(uploads.reduce((acc, u) => acc + u.price, 0) / uploads.length).toFixed(2)}
            </span>
          </div>
          <div className="creator-content-upload-earnings-stat">
            <span className="creator-content-upload-stat-label">Potential (100 views):</span>
            <span className="creator-content-upload-stat-value creator-content-upload-highlight">
              ${(uploads.reduce((acc, u) => acc + u.price, 0) / uploads.length * 100).toFixed(2)}
            </span>
          </div>
        </div>
      </div>

      {errors.submit && (
        <div className="creator-content-upload-error-message">
          <AlertCircle size={16} />
          {errors.submit}
        </div>
      )}
    </motion.div>
  );

  return (
    <div className="creator-content-upload-page">
      {/* Desktop Header */}
      {isDesktop && <CreatorMainHeader />}
      
      {/* Background */}
      <div className="creator-content-upload-bg">
        <div className="creator-content-upload-bg-gradient-1"></div>
        <div className="creator-content-upload-bg-gradient-2"></div>
      </div>

      <div className="creator-content-upload-container">
        {/* Header */}
        <div className="creator-content-upload-header">
          <button 
            className="creator-content-upload-back-btn"
            onClick={() => navigate('/creator/dashboard')}
          >
            <ArrowLeft size={20} />
            <span>Back to Dashboard</span>
          </button>
          
          <div className="creator-content-upload-header-title">
            <h1>Upload Content</h1>
            <p>Share your exclusive content with fans</p>
          </div>
          
        </div>

        {/* Progress Steps */}
        <div className="creator-content-upload-steps">
          <div className={`creator-content-upload-step-indicator ${currentStep >= 1 ? 'creator-content-upload-active' : ''} ${currentStep === 1 ? 'creator-content-upload-current' : ''}`}>
            <div className="creator-content-upload-step-number">
              {currentStep > 1 ? <CheckCircle size={20} /> : '1'}
            </div>
            <span>Upload</span>
          </div>
          
          <div className={`creator-content-upload-step-indicator ${currentStep >= 2 ? 'creator-content-upload-active' : ''} ${currentStep === 2 ? 'creator-content-upload-current' : ''}`}>
            <div className="creator-content-upload-step-number">
              {currentStep > 2 ? <CheckCircle size={20} /> : '2'}
            </div>
            <span>Details</span>
          </div>
          
          <div className={`creator-content-upload-step-indicator ${currentStep >= 3 ? 'creator-content-upload-active' : ''} ${currentStep === 3 ? 'creator-content-upload-current' : ''}`}>
            <div className="creator-content-upload-step-number">
              {currentStep > 3 ? <CheckCircle size={20} /> : '3'}
            </div>
            <span>Review</span>
          </div>
        </div>

        {/* Step Content */}
        <div className="creator-content-upload-step-content">
          <AnimatePresence mode="wait">
            {currentStep === 1 && <UploadStep key="upload" />}
            {currentStep === 2 && <DetailsStep key="details" />}
            {currentStep === 3 && <ReviewStep key="review" />}
          </AnimatePresence>
        </div>

        {/* Navigation */}
        <div className="creator-content-upload-navigation">
          <button
            className="creator-content-upload-nav-btn creator-content-upload-secondary"
            onClick={() => setCurrentStep(prev => Math.max(1, prev - 1))}
            disabled={currentStep === 1}
          >
            <ArrowLeft size={18} />
            <span>Previous</span>
          </button>
          
          {currentStep < 3 ? (
            <button
              className="creator-content-upload-nav-btn creator-content-upload-primary"
              onClick={() => setCurrentStep(prev => prev + 1)}
              disabled={currentStep === 1 && uploads.length === 0}
            >
              <span>Continue</span>
              <ArrowRight size={18} />
            </button>
          ) : (
            <button
              className="creator-content-upload-nav-btn creator-content-upload-publish"
              onClick={handleUpload}
              disabled={isUploading}
            >
              {isUploading ? (
                <>
                  <Loader className="creator-content-upload-spinning" size={18} />
                  <span>Publishing...</span>
                </>
              ) : (
                <>
                  <Send size={18} />
                  <span>Publish Content</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>
      
      {/* Desktop Footer */}
      {isDesktop && <CreatorMainFooter />}
      
      {/* Bottom Navigation - Mobile Only */}
      {isMobile && <BottomNavigation userRole={userRole} />}
    </div>
  );
};

export default CreatorContentUpload;