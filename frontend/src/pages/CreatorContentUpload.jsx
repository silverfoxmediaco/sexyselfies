import React, { useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import {
  Upload, X, Image, Video, DollarSign, Tag, Eye, EyeOff,
  AlertCircle, CheckCircle, Loader, Plus, Sparkles, TrendingUp,
  Calendar, Clock, FileText, Camera, Film, ArrowLeft, ArrowRight,
  Save, Send, Info, Zap, Lock, Unlock, Star, Hash, MessageCircle
} from 'lucide-react';
import BottomNavigation from '../components/BottomNavigation';
import { useIsMobile, getUserRole } from '../utils/mobileDetection';
import './CreatorContentUpload.css';

const CreatorContentUpload = () => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const userRole = getUserRole();
  const fileInputRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({});
  const [currentStep, setCurrentStep] = useState(1); // 1: Upload, 2: Details, 3: Review
  
  // Form state
  const [uploads, setUploads] = useState([]);
  const [selectedFiles, setSelectedFiles] = useState([]);
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
    watermark: true,
    allowComments: true,
    allowTips: true
  });
  
  const [errors, setErrors] = useState({});
  const [isUploading, setIsUploading] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState({
    suggestedPrice: 3.99,
    suggestedTags: ['lifestyle', 'fashion', 'exclusive'],
    bestPostTime: '8:00 PM EST',
    estimatedEarnings: '$15-45'
  });

  // Categories
  const categories = [
    { id: 'photos', label: 'Photos', icon: Camera, color: 'blue' },
    { id: 'videos', label: 'Videos', icon: Film, color: 'purple' },
    { id: 'lifestyle', label: 'Lifestyle', icon: Star, color: 'pink' },
    { id: 'fashion', label: 'Fashion', icon: Tag, color: 'green' },
    { id: 'fitness', label: 'Fitness', icon: TrendingUp, color: 'orange' },
    { id: 'artistic', label: 'Artistic', icon: Sparkles, color: 'teal' }
  ];

  // Popular tags
  const popularTags = [
    'exclusive', 'behind-the-scenes', 'daily', 'premium',
    'lifestyle', 'fashion', 'fitness', 'artistic',
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
      price: contentDetails.pricing.amount
    }));

    setUploads(prev => [...prev, ...newUploads]);
    setSelectedFiles(prev => [...prev, ...validFiles]);
  };

  // Remove file from upload list
  const removeFile = (id) => {
    setUploads(prev => prev.filter(upload => upload.id !== id));
    // Clean up preview URL
    const upload = uploads.find(u => u.id === id);
    if (upload?.preview) {
      URL.revokeObjectURL(upload.preview);
    }
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
        formData.append('category', contentDetails.category);
        formData.append('tags', JSON.stringify(contentDetails.tags));
        formData.append('price', upload.price);
        formData.append('visibility', contentDetails.visibility);
        formData.append('watermark', contentDetails.watermark);
        formData.append('allowComments', contentDetails.allowComments);
        formData.append('allowTips', contentDetails.allowTips);
        
        // Update upload status
        setUploads(prev => prev.map(u => 
          u.id === upload.id ? { ...u, status: 'uploading' } : u
        ));
        
        // Upload with progress tracking
        const response = await axios.post(
          '/api/creator/content/upload',
          formData,
          {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'multipart/form-data'
            },
            onUploadProgress: (progressEvent) => {
              const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
              setUploadProgress(prev => ({ ...prev, [upload.id]: progress }));
              setUploads(prev => prev.map(u => 
                u.id === upload.id ? { ...u, progress } : u
              ));
            }
          }
        );
        
        // Mark as complete
        setUploads(prev => prev.map(u => 
          u.id === upload.id ? { ...u, status: 'complete' } : u
        ));
      }
      
      // Show success message
      setTimeout(() => {
        navigate('/creator/content');
      }, 2000);
      
    } catch (error) {
      console.error('Upload error:', error);
      setErrors({ submit: 'Failed to upload content. Please try again.' });
    } finally {
      setIsUploading(false);
    }
  };

  // Step 1: File Upload
  const UploadStep = () => (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="upload-step"
    >
      <div className="step-header">
        <h2>Upload Your Content</h2>
        <p>Share your exclusive photos and videos with your fans</p>
      </div>

      {/* Drop Zone */}
      <div
        className={`drop-zone ${isDragging ? 'dragging' : ''} ${uploads.length > 0 ? 'has-files' : ''}`}
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
          <div className="drop-zone-content">
            <Upload size={48} className="drop-icon" />
            <h3>Drag & drop your files here</h3>
            <p>or click to browse</p>
            <div className="file-types">
              <span className="file-type">
                <Image size={16} />
                Images
              </span>
              <span className="file-type">
                <Video size={16} />
                Videos
              </span>
            </div>
            <p className="file-limit">Max 100MB per file</p>
          </div>
        ) : (
          <div className="add-more">
            <Plus size={24} />
            <span>Add more files</span>
          </div>
        )}
      </div>

      {errors.file && (
        <div className="error-message">
          <AlertCircle size={16} />
          {errors.file}
        </div>
      )}

      {/* File Preview Grid */}
      {uploads.length > 0 && (
        <div className="file-preview-grid">
          <AnimatePresence>
            {uploads.map((upload) => (
              <motion.div
                key={upload.id}
                className="file-preview-card"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                layout
              >
                <div className="preview-container">
                  {upload.type === 'image' ? (
                    <img src={upload.preview} alt={upload.name} />
                  ) : (
                    <div className="video-preview">
                      <Video size={32} />
                      <span>Video</span>
                    </div>
                  )}
                  
                  {/* Upload Progress */}
                  {upload.status === 'uploading' && (
                    <div className="upload-progress-overlay">
                      <div className="progress-circle">
                        <Loader className="spinning" size={24} />
                        <span>{upload.progress}%</span>
                      </div>
                    </div>
                  )}
                  
                  {/* Success Indicator */}
                  {upload.status === 'complete' && (
                    <div className="upload-success-overlay">
                      <CheckCircle size={32} />
                    </div>
                  )}
                  
                  {/* Remove Button */}
                  {upload.status === 'pending' && (
                    <button
                      className="remove-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeFile(upload.id);
                      }}
                    >
                      <X size={16} />
                    </button>
                  )}
                </div>
                
                <div className="file-info">
                  <p className="file-name">{upload.name}</p>
                  <div className="file-meta">
                    <span className="file-size">
                      {(upload.size / 1024 / 1024).toFixed(2)} MB
                    </span>
                    <div className="price-input">
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
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* AI Price Suggestion */}
      {uploads.length > 0 && (
        <div className="ai-suggestion-card">
          <div className="suggestion-header">
            <Sparkles size={18} />
            <span>AI Recommendation</span>
          </div>
          <div className="suggestion-content">
            <p>Based on your content type and market analysis:</p>
            <div className="suggestion-items">
              <div className="suggestion-item">
                <span className="label">Suggested Price:</span>
                <span className="value">${aiSuggestions.suggestedPrice}</span>
              </div>
              <div className="suggestion-item">
                <span className="label">Est. Earnings:</span>
                <span className="value">{aiSuggestions.estimatedEarnings}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );

  // Step 2: Content Details
  const DetailsStep = () => (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="details-step"
    >
      <div className="step-header">
        <h2>Add Details</h2>
        <p>Help your fans discover your content</p>
      </div>

      {/* Title */}
      <div className="form-group">
        <label className="form-label">
          <FileText size={16} />
          Title (Optional)
        </label>
        <input
          type="text"
          className="form-input"
          placeholder="Give your content a catchy title..."
          value={contentDetails.title}
          onChange={(e) => setContentDetails(prev => ({ ...prev, title: e.target.value }))}
        />
      </div>

      {/* Description */}
      <div className="form-group">
        <label className="form-label">
          <FileText size={16} />
          Description (Optional)
        </label>
        <textarea
          className="form-textarea"
          placeholder="Tell your fans what makes this content special..."
          rows="3"
          value={contentDetails.description}
          onChange={(e) => setContentDetails(prev => ({ ...prev, description: e.target.value }))}
        />
      </div>

      {/* Categories */}
      <div className="form-group">
        <label className="form-label">
          <Tag size={16} />
          Category
          <span className="required">*</span>
        </label>
        <div className="category-grid">
          {categories.map(category => (
            <motion.button
              key={category.id}
              className={`category-btn ${contentDetails.category === category.id ? 'selected' : ''} ${category.color}`}
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
          <span className="error-text">{errors.category}</span>
        )}
      </div>

      {/* Tags */}
      <div className="form-group">
        <label className="form-label">
          <Hash size={16} />
          Tags (Max 5)
          <span className="required">*</span>
        </label>
        <div className="tags-section">
          <div className="popular-tags">
            {popularTags.map(tag => (
              <button
                key={tag}
                className={`tag-btn ${contentDetails.tags.includes(tag) ? 'selected' : ''}`}
                onClick={() => toggleTag(tag)}
                disabled={!contentDetails.tags.includes(tag) && contentDetails.tags.length >= 5}
              >
                {tag}
              </button>
            ))}
          </div>
          <input
            type="text"
            className="tag-input"
            placeholder="Add custom tag and press Enter..."
            onKeyPress={addCustomTag}
            disabled={contentDetails.tags.length >= 5}
          />
          <div className="selected-tags">
            {contentDetails.tags.map(tag => (
              <span key={tag} className="selected-tag">
                #{tag}
                <button onClick={() => toggleTag(tag)}>
                  <X size={14} />
                </button>
              </span>
            ))}
          </div>
        </div>
        {errors.tags && (
          <span className="error-text">{errors.tags}</span>
        )}
      </div>

      {/* Advanced Settings */}
      <div className="advanced-settings">
        <h3>Advanced Settings</h3>
        
        <div className="settings-grid">
          <label className="setting-item">
            <input
              type="checkbox"
              checked={contentDetails.watermark}
              onChange={(e) => setContentDetails(prev => ({ ...prev, watermark: e.target.checked }))}
            />
            <span className="setting-label">
              <Lock size={16} />
              Add watermark
            </span>
          </label>
          
          <label className="setting-item">
            <input
              type="checkbox"
              checked={contentDetails.allowComments}
              onChange={(e) => setContentDetails(prev => ({ ...prev, allowComments: e.target.checked }))}
            />
            <span className="setting-label">
              <MessageCircle size={16} />
              Allow comments
            </span>
          </label>
          
          <label className="setting-item">
            <input
              type="checkbox"
              checked={contentDetails.allowTips}
              onChange={(e) => setContentDetails(prev => ({ ...prev, allowTips: e.target.checked }))}
            />
            <span className="setting-label">
              <DollarSign size={16} />
              Accept tips
            </span>
          </label>
        </div>
      </div>

      {/* AI Suggestions */}
      <div className="ai-suggestion-card">
        <div className="suggestion-header">
          <Sparkles size={18} />
          <span>AI Insights</span>
        </div>
        <div className="suggestion-content">
          <div className="insight-item">
            <Clock size={16} />
            <span>Best posting time: {aiSuggestions.bestPostTime}</span>
          </div>
          <div className="insight-item">
            <Tag size={16} />
            <span>Suggested tags: {aiSuggestions.suggestedTags.join(', ')}</span>
          </div>
        </div>
      </div>
    </motion.div>
  );

  // Step 3: Review & Publish
  const ReviewStep = () => (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="review-step"
    >
      <div className="step-header">
        <h2>Review & Publish</h2>
        <p>Make sure everything looks perfect</p>
      </div>

      {/* Content Summary */}
      <div className="review-card">
        <h3>Content Summary</h3>
        <div className="summary-grid">
          <div className="summary-item">
            <span className="label">Files:</span>
            <span className="value">{uploads.length} items</span>
          </div>
          <div className="summary-item">
            <span className="label">Category:</span>
            <span className="value">{contentDetails.category}</span>
          </div>
          <div className="summary-item">
            <span className="label">Tags:</span>
            <span className="value">{contentDetails.tags.join(', ')}</span>
          </div>
          <div className="summary-item">
            <span className="label">Total Size:</span>
            <span className="value">
              {(uploads.reduce((acc, u) => acc + u.size, 0) / 1024 / 1024).toFixed(2)} MB
            </span>
          </div>
        </div>
      </div>

      {/* Pricing Summary */}
      <div className="review-card">
        <h3>Pricing</h3>
        <div className="pricing-list">
          {uploads.map(upload => (
            <div key={upload.id} className="pricing-item">
              <span className="file-name">{upload.name}</span>
              <span className="price">${upload.price}</span>
            </div>
          ))}
          <div className="pricing-total">
            <span>Average Price:</span>
            <span className="total">
              ${(uploads.reduce((acc, u) => acc + u.price, 0) / uploads.length).toFixed(2)}
            </span>
          </div>
        </div>
      </div>

      {/* Visibility Options */}
      <div className="visibility-options">
        <h3>Visibility</h3>
        <div className="visibility-grid">
          <label className="visibility-option">
            <input
              type="radio"
              name="visibility"
              value="public"
              checked={contentDetails.visibility === 'public'}
              onChange={(e) => setContentDetails(prev => ({ ...prev, visibility: e.target.value }))}
            />
            <div className="option-content">
              <Unlock size={20} />
              <span className="option-title">Public</span>
              <span className="option-desc">Available to all matches</span>
            </div>
          </label>
          
          <label className="visibility-option">
            <input
              type="radio"
              name="visibility"
              value="private"
              checked={contentDetails.visibility === 'private'}
              onChange={(e) => setContentDetails(prev => ({ ...prev, visibility: e.target.value }))}
            />
            <div className="option-content">
              <Lock size={20} />
              <span className="option-title">Private</span>
              <span className="option-desc">Only for selected fans</span>
            </div>
          </label>
          
          <label className="visibility-option">
            <input
              type="radio"
              name="visibility"
              value="scheduled"
              checked={contentDetails.visibility === 'scheduled'}
              onChange={(e) => setContentDetails(prev => ({ ...prev, visibility: e.target.value }))}
            />
            <div className="option-content">
              <Calendar size={20} />
              <span className="option-title">Schedule</span>
              <span className="option-desc">Post at optimal time</span>
            </div>
          </label>
        </div>
      </div>

      {/* Estimated Earnings */}
      <div className="earnings-preview">
        <div className="earnings-header">
          <TrendingUp size={20} />
          <span>Estimated Earnings</span>
        </div>
        <div className="earnings-content">
          <div className="earnings-stat">
            <span className="stat-label">Per View:</span>
            <span className="stat-value">
              ${(uploads.reduce((acc, u) => acc + u.price, 0) / uploads.length).toFixed(2)}
            </span>
          </div>
          <div className="earnings-stat">
            <span className="stat-label">Potential (100 views):</span>
            <span className="stat-value highlight">
              ${(uploads.reduce((acc, u) => acc + u.price, 0) / uploads.length * 100).toFixed(2)}
            </span>
          </div>
        </div>
      </div>

      {errors.submit && (
        <div className="error-message">
          <AlertCircle size={16} />
          {errors.submit}
        </div>
      )}
    </motion.div>
  );

  return (
    <div className="content-upload-page">
      {/* Background */}
      <div className="upload-bg">
        <div className="bg-gradient-1"></div>
        <div className="bg-gradient-2"></div>
      </div>

      <div className="upload-container">
        {/* Header */}
        <div className="upload-header">
          <button 
            className="back-btn"
            onClick={() => navigate('/creator/dashboard')}
          >
            <ArrowLeft size={20} />
            <span>Back to Dashboard</span>
          </button>
          
          <div className="header-title">
            <h1>Upload Content</h1>
            <p>Share your exclusive content with fans</p>
          </div>
          
          <div className="header-actions">
            <button className="save-draft-btn">
              <Save size={18} />
              <span>Save Draft</span>
            </button>
          </div>
        </div>

        {/* Progress Steps */}
        <div className="upload-steps">
          <div className={`step ${currentStep >= 1 ? 'active' : ''} ${currentStep === 1 ? 'current' : ''}`}>
            <div className="step-number">
              {currentStep > 1 ? <CheckCircle size={20} /> : '1'}
            </div>
            <span>Upload</span>
          </div>
          
          <div className={`step ${currentStep >= 2 ? 'active' : ''} ${currentStep === 2 ? 'current' : ''}`}>
            <div className="step-number">
              {currentStep > 2 ? <CheckCircle size={20} /> : '2'}
            </div>
            <span>Details</span>
          </div>
          
          <div className={`step ${currentStep >= 3 ? 'active' : ''} ${currentStep === 3 ? 'current' : ''}`}>
            <div className="step-number">
              {currentStep > 3 ? <CheckCircle size={20} /> : '3'}
            </div>
            <span>Review</span>
          </div>
        </div>

        {/* Step Content */}
        <div className="step-content">
          <AnimatePresence mode="wait">
            {currentStep === 1 && <UploadStep key="upload" />}
            {currentStep === 2 && <DetailsStep key="details" />}
            {currentStep === 3 && <ReviewStep key="review" />}
          </AnimatePresence>
        </div>

        {/* Navigation */}
        <div className="upload-navigation">
          <button
            className="nav-btn secondary"
            onClick={() => setCurrentStep(prev => Math.max(1, prev - 1))}
            disabled={currentStep === 1}
          >
            <ArrowLeft size={18} />
            <span>Previous</span>
          </button>
          
          {currentStep < 3 ? (
            <button
              className="nav-btn primary"
              onClick={() => setCurrentStep(prev => prev + 1)}
              disabled={currentStep === 1 && uploads.length === 0}
            >
              <span>Continue</span>
              <ArrowRight size={18} />
            </button>
          ) : (
            <button
              className="nav-btn publish"
              onClick={handleUpload}
              disabled={isUploading}
            >
              {isUploading ? (
                <>
                  <Loader className="spinning" size={18} />
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
      
      {/* Bottom Navigation - Mobile Only */}
      {isMobile && <BottomNavigation userRole={userRole} />}
    </div>
  );
};

export default CreatorContentUpload;