import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import CreatorProfilePreview from './CreatorProfilePreview';
import BottomNavigation from '../components/BottomNavigation';
import CreatorMainHeader from '../components/CreatorMainHeader';
import CreatorMainFooter from '../components/CreatorMainFooter';
import { useIsMobile, useIsDesktop, getUserRole } from '../utils/mobileDetection';
import './CreatorProfileSetup.css';

// Icons (using lucide-react or similar)
import { 
  Camera, 
  User, 
  Heart, 
  DollarSign, 
  Sparkles, 
  Check, 
  ChevronRight,
  ChevronLeft,
  Upload,
  AlertCircle,
  TrendingUp,
  Star,
  Lock,
  Zap,
  Users,
  Globe,
  MessageCircle,
  Video,
  Image,
  Bot,
  Clock,
  Shield,
  Eye
} from 'lucide-react';

const CreatorProfileSetup = () => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const isDesktop = useIsDesktop();
  const userRole = getUserRole();

  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [animationDirection, setAnimationDirection] = useState('forward');
  const [completionPercentage, setCompletionPercentage] = useState(0);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  
  // Form validation state
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  
  // AI suggestions state
  const [aiSuggestions, setAiSuggestions] = useState({
    displayName: '',
    bio: '',
    photoPricing: 3.99,
    videoPricing: 7.99,
    messagePricing: 2.99,
    bestPostingTime: '8:00 PM - 10:00 PM',
    estimatedEarnings: { min: 500, max: 2500 },
    topCategories: []
  });
  
  // Form data - UPDATED: discovery to browse
  const [formData, setFormData] = useState({
    // Step 1: Visual Identity
    profilePhoto: null,
    profilePhotoPreview: null,
    coverImage: null,
    coverImagePreview: null,
    displayName: '',
    username: '',
    bio: '',
    
    // Step 2: Browse Settings (CHANGED FROM: Discovery Settings)
    gender: '',
    orientation: '',
    ageRange: [18, 55],
    bodyType: '',
    ethnicity: '',
    languages: [],
    showInBrowse: true,  // CHANGED FROM: showInDiscovery
    browsePreferences: {  // CHANGED FROM: discoveryPreferences
      men: true,
      women: true,
      couples: false
    },
    
    // Step 3: Content & Pricing
    contentTypes: {
      photos: true,
      videos: false,
      messages: true,
      livestream: false
    },
    pricing: {
      photos: { min: 0.99, default: 2.99, max: 9.99 },
      videos: { min: 2.99, default: 5.99, max: 19.99 },
      messages: { min: 0.99, default: 1.99, max: 9.99 }
    },
    pricingStrategy: 'fixed', // fixed, dynamic, ai_optimized
    acceptTips: true,
    bundleDiscounts: true,
    
    // Step 4: Smart Features
    automation: {
      welcomeMessage: {
        enabled: true,
        text: "Hey! Thanks for matching with me 💕 Check out my exclusive content!"
      },
      reEngagement: {
        enabled: true,
        days: 7
      },
      autoMatch: 'verified', // all, verified, manual
      smartPricing: true,
      contentScheduling: true
    },
    instantPayout: true,
    analytics: true,
    
    // Step 5: Verification
    agreeToTerms: false,
    agreeToContentPolicy: false,
    confirmAge: false,
    confirmOwnership: false
  });
  
  // Fetch AI suggestions on mount
  useEffect(() => {
    fetchAISuggestions();
    checkExistingProfile();
  }, []);
  
  // Update completion percentage
  useEffect(() => {
    calculateCompletion();
  }, [formData, currentStep]);
  
  const fetchAISuggestions = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/creator/ai/profile-suggestions', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAiSuggestions(response.data.suggestions);
    } catch (error) {
      console.error('Error fetching AI suggestions:', error);
    }
  };
  
  const checkExistingProfile = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/creator/profile/status', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.profileComplete) {
        navigate('/creator/dashboard');
      }
      
      // Pre-fill any existing data
      if (response.data.existingData) {
        setFormData(prev => ({ ...prev, ...response.data.existingData }));
      }
    } catch (error) {
      console.error('Error checking profile:', error);
    }
  };
  
  const calculateCompletion = () => {
    const totalFields = 25; // Total number of required fields
    let completed = 0;
    
    // Check each field
    if (formData.profilePhoto) completed++;
    if (formData.displayName) completed++;
    if (formData.bio && formData.bio.length > 50) completed++;
    if (formData.gender) completed++;
    if (formData.orientation) completed++;
    // ... add more field checks
    
    const percentage = Math.round((completed / totalFields) * 100);
    setCompletionPercentage(percentage);
  };
  
  // Step validation
  const validateStep = (step) => {
    const newErrors = {};
    
    switch(step) {
      case 1:
        if (!formData.profilePhoto) newErrors.profilePhoto = 'Profile photo is required';
        if (!formData.displayName) newErrors.displayName = 'Display name is required';
        if (!formData.bio || formData.bio.length < 50) {
          newErrors.bio = 'Bio must be at least 50 characters';
        }
        break;
      
      case 2:
        if (!formData.gender) newErrors.gender = 'Please select your gender';
        if (!formData.orientation) newErrors.orientation = 'Please select your orientation';
        break;
      
      case 3:
        if (!Object.values(formData.contentTypes).some(v => v)) {
          newErrors.contentTypes = 'Select at least one content type';
        }
        break;
      
      case 5:
        if (!formData.agreeToTerms) newErrors.terms = 'You must agree to the terms';
        if (!formData.confirmAge) newErrors.age = 'You must confirm you are 18+';
        break;
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  // Navigation handlers
  const handleNext = () => {
    if (validateStep(currentStep)) {
      setAnimationDirection('forward');
      setCurrentStep(prev => prev + 1);
      window.scrollTo(0, 0);
    }
  };
  
  const handleBack = () => {
    setAnimationDirection('backward');
    setCurrentStep(prev => prev - 1);
    window.scrollTo(0, 0);
  };
  
  const handleSubmit = async () => {
    if (!validateStep(5)) return;
    
    setIsLoading(true);
    
    try {
      const token = localStorage.getItem('token');
      const formDataToSend = new FormData();
      
      // Append files
      if (formData.profilePhoto) {
        formDataToSend.append('profilePhoto', formData.profilePhoto);
      }
      if (formData.coverImage) {
        formDataToSend.append('coverImage', formData.coverImage);
      }
      
      // Append other data as JSON
      const dataWithoutFiles = { ...formData };
      delete dataWithoutFiles.profilePhoto;
      delete dataWithoutFiles.coverImage;
      delete dataWithoutFiles.profilePhotoPreview;
      delete dataWithoutFiles.coverImagePreview;
      
      formDataToSend.append('data', JSON.stringify(dataWithoutFiles));
      
      const response = await axios.post(
        '/api/creator/profile/setup',
        formDataToSend,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        }
      );
      
      if (response.data.success) {
        setShowSuccess(true);
        setTimeout(() => {
          navigate('/creator/dashboard');
        }, 2000);
      }
    } catch (error) {
      console.error('Profile setup error:', error);
      setErrors({ submit: error.response?.data?.message || 'An error occurred' });
    } finally {
      setIsLoading(false);
    }
  };
  
  // Step components
  const renderStep = () => {
    switch(currentStep) {
      case 1:
        return <StepOne formData={formData} setFormData={setFormData} errors={errors} />;
      case 2:
        return <StepTwo formData={formData} setFormData={setFormData} errors={errors} />;
      case 3:
        return <StepThree formData={formData} setFormData={setFormData} errors={errors} aiSuggestions={aiSuggestions} />;
      case 4:
        return <StepFour formData={formData} setFormData={setFormData} errors={errors} aiSuggestions={aiSuggestions} />;
      case 5:
        return <StepFive formData={formData} setFormData={setFormData} errors={errors} aiSuggestions={aiSuggestions} onPreview={() => setShowPreview(true)} />;
      default:
        return null;
    }
  };
  
  // Animation variants
  const slideVariants = {
    enter: (direction) => ({
      x: direction === 'forward' ? 1000 : -1000,
      opacity: 0
    }),
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1
    },
    exit: (direction) => ({
      zIndex: 0,
      x: direction === 'forward' ? -1000 : 1000,
      opacity: 0
    })
  };
  
  return (
    <div className="profile-setup-wrapper">
      {/* Desktop Header */}
      {isDesktop && <CreatorMainHeader />}
      {/* Background gradient animation */}
      <div className="animated-bg">
        <div className="gradient-1"></div>
        <div className="gradient-2"></div>
        <div className="gradient-3"></div>
      </div>
      
      {/* Main container */}
      <div className="profile-setup-container">
        {/* Header with progress */}
        <div className="setup-header">
          <div className="logo-section">
            <span className="tagline">Create Your Creator Profile</span>
          </div>
          
          {/* Progress indicator - UPDATED STEP LABEL */}
          <div className="progress-section">
            <div className="step-indicators">
              {[1, 2, 3, 4, 5].map((step) => (
                <div
                  key={step}
                  className={`step-indicator ${currentStep >= step ? 'active' : ''} ${currentStep === step ? 'current' : ''}`}
                >
                  <div className="step-number">
                    {currentStep > step ? <Check size={16} /> : step}
                  </div>
                  <span className="step-label">
                    {step === 1 && 'Identity'}
                    {step === 2 && 'Browse'}  {/* CHANGED FROM: Discovery */}
                    {step === 3 && 'Pricing'}
                    {step === 4 && 'Automation'}
                    {step === 5 && 'Launch'}
                  </span>
                </div>
              ))}
            </div>
            
            <div className="progress-bar">
              <motion.div 
                className="progress-fill"
                initial={{ width: 0 }}
                animate={{ width: `${(currentStep / 5) * 100}%` }}
                transition={{ duration: 0.5, ease: "easeInOut" }}
              />
            </div>
            
            <div className="completion-stats">
              <span className="percentage">{completionPercentage}% Complete</span>
              <span className="estimate">~{6 - currentStep} min remaining</span>
            </div>
          </div>
        </div>
        
        {/* Step content with animations */}
        <div className="setup-content">
          <AnimatePresence initial={false} custom={animationDirection}>
            <motion.div
              key={currentStep}
              custom={animationDirection}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{
                x: { type: "spring", stiffness: 300, damping: 30 },
                opacity: { duration: 0.2 }
              }}
              className="step-content-wrapper"
            >
              {renderStep()}
            </motion.div>
          </AnimatePresence>
        </div>
        
        {/* Navigation buttons */}
        <div className="setup-navigation">
          <button
            className="nav-btn back-btn"
            onClick={handleBack}
            disabled={currentStep === 1}
            style={{ opacity: currentStep === 1 ? 0.3 : 1 }}
          >
            <ChevronLeft size={20} />
            <span>Back</span>
          </button>
          
          <div className="step-counter">
            Step {currentStep} of 5
          </div>
          
          {currentStep < 5 ? (
            <button
              className="nav-btn next-btn"
              onClick={handleNext}
            >
              <span>Continue</span>
              <ChevronRight size={20} />
            </button>
          ) : (
            <button
              className="nav-btn launch-btn"
              onClick={handleSubmit}
              disabled={isLoading}
            >
              {isLoading ? (
                <span className="loading-spinner"></span>
              ) : (
                <>
                  <Zap size={20} />
                  <span>Launch Profile</span>
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
      
      {/* Profile Preview Modal */}
      <CreatorProfilePreview 
        profileData={formData}
        isOpen={showPreview}
        onClose={() => setShowPreview(false)}
      />
      
      {/* Success modal */}
      <AnimatePresence>
        {showSuccess && (
          <motion.div
            className="success-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="success-modal"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", damping: 15 }}
            >
              <div className="success-icon">
                <Sparkles size={60} />
              </div>
              <h2>Profile Created! 🎉</h2>
              <p>Welcome to SexySelfies! Redirecting to your dashboard...</p>
              <div className="success-stats">
                <div className="stat">
                  <TrendingUp size={20} />
                  <span>Est. ${aiSuggestions.estimatedEarnings.min}-${aiSuggestions.estimatedEarnings.max}/mo</span>
                </div>
                <div className="stat">
                  <Star size={20} />
                  <span>Top 10% Profile Quality</span>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// Step 1: Visual Identity
const StepOne = ({ formData, setFormData, errors }) => {
  const profileInputRef = useRef(null);
  const coverInputRef = useRef(null);
  
  
  const handlePhotoChange = (e, type) => {
    const file = e.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onloadend = () => {
      if (type === 'profile') {
        setFormData(prev => ({
          ...prev,
          profilePhoto: file,
          profilePhotoPreview: reader.result
        }));
      } else {
        setFormData(prev => ({
          ...prev,
          coverImage: file,
          coverImagePreview: reader.result
        }));
      }
    };
    reader.readAsDataURL(file);
  };
  
  
  return (
    <div className="step-one">
      <div className="step-header">
        <h2>Let's Create Your Visual Identity</h2>
        <p>Make a stunning first impression that converts viewers into fans</p>
      </div>
      
      {/* Photo uploads with preview */}
      <div className="photo-section">
        <div className="photo-upload-grid">
          {/* Profile photo */}
          <div className="profile-photo-container">
            <label className="photo-upload-label">
              <input
                ref={profileInputRef}
                type="file"
                accept="image/*"
                onChange={(e) => handlePhotoChange(e, 'profile')}
                hidden
              />
              <div className={`photo-upload-box profile ${formData.profilePhotoPreview ? 'has-image' : ''}`}>
                {formData.profilePhotoPreview ? (
                  <div className="photo-preview">
                    <img src={formData.profilePhotoPreview} alt="Profile" />
                    <div className="photo-overlay">
                      <Camera size={24} />
                      <span>Change Photo</span>
                    </div>
                  </div>
                ) : (
                  <div className="upload-prompt">
                    <Camera size={32} />
                    <span className="upload-title">Profile Photo</span>
                    <span className="upload-hint">Click to upload</span>
                  </div>
                )}
              </div>
            </label>
            {errors.profilePhoto && (
              <span className="error-message">{errors.profilePhoto}</span>
            )}
            <div className="photo-tips">
              <span className="tip">✔ Clear face photo</span>
              <span className="tip">✔ Good lighting</span>
              <span className="tip">✔ Min 400x400px</span>
            </div>
          </div>
          
          {/* Cover image */}
          <div className="cover-photo-container">
            <label className="photo-upload-label">
              <input
                ref={coverInputRef}
                type="file"
                accept="image/*"
                onChange={(e) => handlePhotoChange(e, 'cover')}
                hidden
              />
              <div className={`photo-upload-box cover ${formData.coverImagePreview ? 'has-image' : ''}`}>
                {formData.coverImagePreview ? (
                  <div className="photo-preview">
                    <img src={formData.coverImagePreview} alt="Cover" />
                    <div className="photo-overlay">
                      <Upload size={24} />
                      <span>Change Cover</span>
                    </div>
                  </div>
                ) : (
                  <div className="upload-prompt">
                    <Upload size={32} />
                    <span className="upload-title">Cover Image (Optional)</span>
                    <span className="upload-hint">Showcase your style</span>
                  </div>
                )}
              </div>
            </label>
            <div className="photo-tips">
              <span className="tip">✔ 1920x480px ideal</span>
              <span className="tip">✔ Represents your brand</span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Display name and username */}
      <div className="form-group">
        <label className="form-label">
          Display Name
          <span className="required">*</span>
        </label>
        <input
          type="text"
          className={`form-input ${errors.displayName ? 'error' : ''}`}
          placeholder="Choose a catchy name"
          value={formData.displayName}
          onChange={(e) => setFormData(prev => ({ ...prev, displayName: e.target.value }))}
        />
        {errors.displayName && <span className="error-message">{errors.displayName}</span>}
      </div>
      
      {/* Bio */}
      <div className="form-group">
        <label className="form-label">
          Bio
          <span className="required">*</span>
        </label>
        <textarea
          className={`form-input ${errors.bio ? 'error' : ''}`}
          placeholder="Tell potential fans what makes you special..."
          rows="4"
          value={formData.bio}
          onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
        />
        <div className="char-count">
          {formData.bio.length}/500 characters
        </div>
        {errors.bio && <span className="error-message">{errors.bio}</span>}
      </div>
    </div>
  );
};

// Step 2: Browse Settings - UPDATED FROM Discovery Settings
const StepTwo = ({ formData, setFormData, errors }) => {
  return (
    <div className="step-two">
      <div className="step-header">
        <h2>Help Members Find You</h2>
        <p>Set your browse preferences to attract the right audience</p>  {/* CHANGED FROM: discovery preferences */}
      </div>
      
      {/* Gender */}
      <div className="form-group">
        <label className="form-label">
          I identify as
          <span className="required">*</span>
        </label>
        <div className="radio-group">
          {['Male', 'Female', 'Prefer not to say'].map(option => (
            <label key={option} className="radio-label">
              <input
                type="radio"
                name="gender"
                value={option.toLowerCase()}
                checked={formData.gender === option.toLowerCase()}
                onChange={(e) => setFormData(prev => ({ ...prev, gender: e.target.value }))}
              />
              <span className="radio-custom"></span>
              <span>{option}</span>
            </label>
          ))}
        </div>
        {errors.gender && <span className="error-message">{errors.gender}</span>}
      </div>
      
      {/* Orientation */}
      <div className="form-group">
        <label className="form-label">
          My orientation
          <span className="required">*</span>
        </label>
        <div className="radio-group">
          {['Straight', 'Gay', 'Lesbian', 'Bisexual', 'Pansexual', 'Prefer not to say'].map(option => (
            <label key={option} className="radio-label">
              <input
                type="radio"
                name="orientation"
                value={option.toLowerCase()}
                checked={formData.orientation === option.toLowerCase()}
                onChange={(e) => setFormData(prev => ({ ...prev, orientation: e.target.value }))}
              />
              <span className="radio-custom"></span>
              <span>{option}</span>
            </label>
          ))}
        </div>
        {errors.orientation && <span className="error-message">{errors.orientation}</span>}
      </div>
      
      {/* Browse preferences - UPDATED FROM: Discovery preferences */}
      <div className="form-group">
        <label className="form-label">
          I want to be browsed by  {/* CHANGED FROM: discovered by */}
        </label>
        <div className="checkbox-group">
          {Object.entries({
            men: 'Men',
            women: 'Women',
            couples: 'Couples'
          }).map(([key, label]) => (
            <label key={key} className="checkbox-label">
              <input
                type="checkbox"
                checked={formData.browsePreferences[key]}  // CHANGED FROM: discoveryPreferences
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  browsePreferences: {  // CHANGED FROM: discoveryPreferences
                    ...prev.browsePreferences,  // CHANGED FROM: discoveryPreferences
                    [key]: e.target.checked
                  }
                }))}
              />
              <span className="checkbox-custom"></span>
              <span>{label}</span>
            </label>
          ))}
        </div>
      </div>
      
      {/* Body type */}
      <div className="form-group">
        <label className="form-label">Body Type (Optional)</label>
        <select
          className="form-input"
          value={formData.bodyType}
          onChange={(e) => setFormData(prev => ({ ...prev, bodyType: e.target.value }))}
        >
          <option value="">Select...</option>
          <option value="slim">Slim</option>
          <option value="athletic">Athletic</option>
          <option value="average">Average</option>
          <option value="curvy">Curvy</option>
          <option value="plus-size">Plus-size</option>
        </select>
      </div>
    </div>
  );
};

// Step 3: Content & Pricing
const StepThree = ({ formData, setFormData, errors, aiSuggestions }) => {
  return (
    <div className="step-three">
      <div className="step-header">
        <h2>Set Your Content & Pricing</h2>
        <p>Choose what you'll share and how much you'll earn</p>
      </div>
      
      {/* Content types */}
      <div className="form-group">
        <label className="form-label">
          Content Types You'll Share
          <span className="required">*</span>
        </label>
        <div className="content-types-grid">
          <div 
            className={`content-type-card ${formData.contentTypes.photos ? 'active' : ''}`}
            onClick={() => setFormData(prev => ({
              ...prev,
              contentTypes: { ...prev.contentTypes, photos: !prev.contentTypes.photos }
            }))}
          >
            <Image size={24} />
            <span>Photos</span>
            <span className="price-range">$0.99 - $9.99</span>
          </div>
          
          <div 
            className={`content-type-card ${formData.contentTypes.videos ? 'active' : ''}`}
            onClick={() => setFormData(prev => ({
              ...prev,
              contentTypes: { ...prev.contentTypes, videos: !prev.contentTypes.videos }
            }))}
          >
            <Video size={24} />
            <span>Videos</span>
            <span className="price-range">$2.99 - $19.99</span>
          </div>
          
          <div 
            className={`content-type-card ${formData.contentTypes.messages ? 'active' : ''}`}
            onClick={() => setFormData(prev => ({
              ...prev,
              contentTypes: { ...prev.contentTypes, messages: !prev.contentTypes.messages }
            }))}
          >
            <MessageCircle size={24} />
            <span>Messages</span>
            <span className="price-range">$0.99 - $9.99</span>
          </div>
        </div>
        {errors.contentTypes && <span className="error-message">{errors.contentTypes}</span>}
      </div>
      
      {/* Pricing strategy */}
      <div className="form-group">
        <label className="form-label">Pricing Strategy</label>
        <div className="strategy-cards">
          <div 
            className={`strategy-card ${formData.pricingStrategy === 'fixed' ? 'active' : ''}`}
            onClick={() => setFormData(prev => ({ ...prev, pricingStrategy: 'fixed' }))}
          >
            <Lock size={20} />
            <span className="strategy-title">Fixed Prices</span>
            <span className="strategy-desc">You set the prices</span>
          </div>
          
          <div 
            className={`strategy-card ${formData.pricingStrategy === 'dynamic' ? 'active' : ''}`}
            onClick={() => setFormData(prev => ({ ...prev, pricingStrategy: 'dynamic' }))}
          >
            <TrendingUp size={20} />
            <span className="strategy-title">Dynamic Pricing</span>
            <span className="strategy-desc">Prices adjust with demand</span>
          </div>
          
          <div 
            className={`strategy-card ${formData.pricingStrategy === 'ai_optimized' ? 'active' : ''}`}
            onClick={() => setFormData(prev => ({ ...prev, pricingStrategy: 'ai_optimized' }))}
          >
            <Bot size={20} />
            <span className="strategy-title">AI Optimized</span>
            <span className="strategy-desc">Let AI maximize earnings</span>
          </div>
        </div>
      </div>
      
      {/* Default prices */}
      {formData.contentTypes.photos && (
        <div className="form-group">
          <label className="form-label">
            Photo Price
            <span className="ai-suggestion">AI suggests: ${aiSuggestions.photoPricing}</span>
          </label>
          <input
            type="number"
            className="form-input"
            min="0.99"
            max="9.99"
            step="0.01"
            value={formData.pricing.photos.default}
            onChange={(e) => setFormData(prev => ({
              ...prev,
              pricing: {
                ...prev.pricing,
                photos: { ...prev.pricing.photos, default: parseFloat(e.target.value) }
              }
            }))}
          />
        </div>
      )}
    </div>
  );
};

// Step 4: Smart Features
const StepFour = ({ formData, setFormData, errors, aiSuggestions }) => {
  return (
    <div className="step-four">
      <div className="step-header">
        <h2>Work Smarter with Automation</h2>
        <p>Set up smart features to save time and earn more</p>
      </div>
      
      {/* Welcome message */}
      <div className="form-group">
        <label className="form-label">
          <MessageCircle size={18} />
          Welcome Message (Auto-sent to new matches)
        </label>
        <div className="automation-card">
          <label className="switch-label">
            <input
              type="checkbox"
              checked={formData.automation.welcomeMessage.enabled}
              onChange={(e) => setFormData(prev => ({
                ...prev,
                automation: {
                  ...prev.automation,
                  welcomeMessage: {
                    ...prev.automation.welcomeMessage,
                    enabled: e.target.checked
                  }
                }
              }))}
            />
            <span className="switch"></span>
            <span>Enable welcome message</span>
          </label>
          
          {formData.automation.welcomeMessage.enabled && (
            <textarea
              className="form-input"
              placeholder="Hi! Thanks for matching..."
              value={formData.automation.welcomeMessage.text}
              onChange={(e) => setFormData(prev => ({
                ...prev,
                automation: {
                  ...prev.automation,
                  welcomeMessage: {
                    ...prev.automation.welcomeMessage,
                    text: e.target.value
                  }
                }
              }))}
              rows="3"
            />
          )}
        </div>
      </div>
      
      {/* Auto-match settings */}
      <div className="form-group">
        <label className="form-label">
          <Users size={18} />
          Auto-Match Settings
        </label>
        <div className="radio-group">
          <label className="radio-label">
            <input
              type="radio"
              name="autoMatch"
              value="manual"
              checked={formData.automation.autoMatch === 'manual'}
              onChange={(e) => setFormData(prev => ({
                ...prev,
                automation: { ...prev.automation, autoMatch: e.target.value }
              }))}
            />
            <span className="radio-custom"></span>
            <span>Manual review all likes</span>
          </label>
          
          <label className="radio-label">
            <input
              type="radio"
              name="autoMatch"
              value="verified"
              checked={formData.automation.autoMatch === 'verified'}
              onChange={(e) => setFormData(prev => ({
                ...prev,
                automation: { ...prev.automation, autoMatch: e.target.value }
              }))}
            />
            <span className="radio-custom"></span>
            <span>Auto-match verified members</span>
          </label>
          
          <label className="radio-label">
            <input
              type="radio"
              name="autoMatch"
              value="all"
              checked={formData.automation.autoMatch === 'all'}
              onChange={(e) => setFormData(prev => ({
                ...prev,
                automation: { ...prev.automation, autoMatch: e.target.value }
              }))}
            />
            <span className="radio-custom"></span>
            <span>Auto-match everyone</span>
          </label>
        </div>
      </div>
      
      {/* Payout method */}
      <div className="form-group">
        <label className="form-label">
          <DollarSign size={18} />
          Payout Method
        </label>
        <div className="payout-options">
          <label className="radio-label">
            <input
              type="radio"
              name="payout"
              value="weekly"
              checked={!formData.instantPayout}
              onChange={() => setFormData(prev => ({ ...prev, instantPayout: false }))}
            />
            <span className="radio-custom"></span>
            <div>
              <span>Weekly Payouts</span>
              <span className="option-desc">No fees, paid every Friday</span>
            </div>
          </label>
          
          <label className="radio-label">
            <input
              type="radio"
              name="payout"
              value="instant"
              checked={formData.instantPayout}
              onChange={() => setFormData(prev => ({ ...prev, instantPayout: true }))}
            />
            <span className="radio-custom"></span>
            <div>
              <span>Instant Payouts</span>
              <span className="option-desc">2.5% fee, get paid in minutes</span>
            </div>
          </label>
        </div>
      </div>
      
      {/* AI Features */}
      <div className="form-group">
        <label className="form-label">
          <Bot size={18} />
          AI Features
        </label>
        <div className="ai-features">
          <div className="ai-feature">
            <Clock size={16} />
            <span>Best posting time: {aiSuggestions.bestPostingTime}</span>
          </div>
          <div className="ai-feature">
            <TrendingUp size={16} />
            <span>Estimated earnings: ${aiSuggestions.estimatedEarnings.min}-${aiSuggestions.estimatedEarnings.max}/mo</span>
          </div>
        </div>
      </div>
    </div>
  );
};

// Step 5: Verification & Launch - WITH PREVIEW BUTTON ADDED
const StepFive = ({ formData, setFormData, errors, aiSuggestions, onPreview }) => {
  return (
    <div className="step-five">
      <div className="step-header">
        <h2>Ready to Launch! 🚀</h2>
        <p>Review and agree to our guidelines to start earning</p>
      </div>
      
      {/* Terms and agreements */}
      <div className="agreements-section">
        <div className="agreement-card">
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={formData.agreeToTerms}
              onChange={(e) => setFormData(prev => ({ ...prev, agreeToTerms: e.target.checked }))}
            />
            <span className="checkbox-custom"></span>
            <span>
              I agree to the <a href="/terms" target="_blank">Terms of Service</a> and understand the 80/20 revenue split
            </span>
          </label>
        </div>
        
        <div className="agreement-card">
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={formData.agreeToContentPolicy}
              onChange={(e) => setFormData(prev => ({ ...prev, agreeToContentPolicy: e.target.checked }))}
            />
            <span className="checkbox-custom"></span>
            <span>
              I agree to the <a href="/content-policy" target="_blank">Content Policy</a> (no explicit nudity)
            </span>
          </label>
        </div>
        
        <div className="agreement-card">
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={formData.confirmAge}
              onChange={(e) => setFormData(prev => ({ ...prev, confirmAge: e.target.checked }))}
            />
            <span className="checkbox-custom"></span>
            <span>I confirm I am 18 years or older</span>
          </label>
        </div>
        
        <div className="agreement-card">
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={formData.confirmOwnership}
              onChange={(e) => setFormData(prev => ({ ...prev, confirmOwnership: e.target.checked }))}
            />
            <span className="checkbox-custom"></span>
            <span>I own all content I will upload</span>
          </label>
        </div>
      </div>
      
      {/* Profile preview */}
      <div className="profile-preview-section">
        <h3>Your Profile Preview</h3>
        <div className="preview-card">
          <div className="preview-header">
            {formData.coverImagePreview && (
              <img src={formData.coverImagePreview} alt="Cover" className="preview-cover" />
            )}
            <div className="preview-profile-section">
              {formData.profilePhotoPreview && (
                <img src={formData.profilePhotoPreview} alt="Profile" className="preview-avatar" />
              )}
              <div className="preview-info">
                <h4>{formData.displayName || 'Your Name'}</h4>
                <div className="preview-badges">
                  <span className="badge verified">
                    <Shield size={14} />
                    Verified
                  </span>
                </div>
              </div>
            </div>
          </div>
          <div className="preview-bio">
            <p>{formData.bio || 'Your bio will appear here...'}</p>
          </div>
          <div className="preview-stats">
            <div className="stat">
              <Star size={16} />
              <span>New Creator</span>
            </div>
            <div className="stat">
              <TrendingUp size={16} />
              <span>Est. ${aiSuggestions.estimatedEarnings.min}-${aiSuggestions.estimatedEarnings.max}/mo</span>
            </div>
          </div>
        </div>
        
        {/* PREVIEW BUTTON ADDED HERE */}
        <button
          type="button"
          className="preview-full-btn"
          onClick={onPreview}
        >
          <Eye size={18} />
          <span>Preview How Members See You</span>
        </button>
      </div>
      
      {errors.terms && <span className="error-message">{errors.terms}</span>}
      {errors.age && <span className="error-message">{errors.age}</span>}
      
    </div>
  );
};

export default CreatorProfileSetup;