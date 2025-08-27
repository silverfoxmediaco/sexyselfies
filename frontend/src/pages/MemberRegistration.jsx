import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  User, Mail, Lock, Eye, EyeOff, Phone, Calendar,
  ChevronRight, ChevronLeft, Check, X, AlertCircle,
  Heart, Shield, CreditCard, Users, Sparkles, Gift,
  Camera, UserPlus, Star
} from 'lucide-react';
import authService from '../services/auth.service';
import BottomNavigation from '../components/BottomNavigation';
import { useIsMobile, getUserRole } from '../utils/mobileDetection';
import './MemberRegistration.css';

const MemberRegistration = () => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const userRole = getUserRole();
  
  // Multi-step form state
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 4;
  
  // Form data state
  const [formData, setFormData] = useState({
    // Step 1: Account Info
    email: '',
    username: '',
    password: '',
    confirmPassword: '',
    
    // Step 2: Personal Info
    firstName: '',
    lastName: '',
    dateOfBirth: '',
    phone: '',
    gender: '',
    
    // Step 3: Preferences
    orientation: 'straight',
    interestedIn: [],
    ageRange: [18, 50],
    maxDistance: 25,
    
    // Step 4: Verification
    agreedToTerms: false,
    agreedToAge: false,
    enableNotifications: true
  });
  
  // UI States
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [fieldTouched, setFieldTouched] = useState({});
  
  // Password strength state
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [passwordRequirements, setPasswordRequirements] = useState({
    minLength: false,
    hasUpperCase: false,
    hasLowerCase: false,
    hasNumber: false,
    hasSpecial: false
  });
  
  // Username availability
  const [checkingUsername, setCheckingUsername] = useState(false);
  const [usernameAvailable, setUsernameAvailable] = useState(null);
  
  // Benefits for members
  const memberBenefits = [
    { icon: <Heart size={20} />, title: 'Unlimited Matches', description: 'Connect with creators you love' },
    { icon: <Shield size={20} />, title: 'Verified Profiles', description: 'All creators are ID verified' },
    { icon: <CreditCard size={20} />, title: 'Secure Payments', description: 'Safe & encrypted transactions' },
    { icon: <Gift size={20} />, title: 'Welcome Bonus', description: '10 free credits to start' }
  ];
  
  // Validate email
  const validateEmail = (email) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };
  
  // Check password strength
  const checkPasswordStrength = (password) => {
    let strength = 0;
    const requirements = {
      minLength: password.length >= 8,
      hasUpperCase: /[A-Z]/.test(password),
      hasLowerCase: /[a-z]/.test(password),
      hasNumber: /\d/.test(password),
      hasSpecial: /[!@#$%^&*]/.test(password)
    };
    
    Object.values(requirements).forEach(met => {
      if (met) strength += 20;
    });
    
    setPasswordRequirements(requirements);
    setPasswordStrength(strength);
  };
  
  // Check username availability (mock)
  const checkUsernameAvailability = async (username) => {
    if (!username || username.length < 3) {
      setUsernameAvailable(null);
      return;
    }
    
    setCheckingUsername(true);
    
    // Simulate API call
    setTimeout(() => {
      // Mock check - in production, call your API
      const taken = ['johndoe', 'janedoe', 'testuser'].includes(username.toLowerCase());
      setUsernameAvailable(!taken);
      setCheckingUsername(false);
    }, 500);
  };
  
  // Handle input changes
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    const newValue = type === 'checkbox' ? checked : value;
    
    setFormData(prev => ({
      ...prev,
      [name]: newValue
    }));
    
    // Mark field as touched
    setFieldTouched(prev => ({
      ...prev,
      [name]: true
    }));
    
    // Clear error for this field
    setErrors(prev => ({
      ...prev,
      [name]: ''
    }));
    
    // Special handling for specific fields
    if (name === 'password') {
      checkPasswordStrength(value);
    }
    
    if (name === 'username') {
      checkUsernameAvailability(value);
    }
  };
  
  // Handle interest selection
  const handleInterestToggle = (interest) => {
    setFormData(prev => ({
      ...prev,
      interestedIn: prev.interestedIn.includes(interest)
        ? prev.interestedIn.filter(i => i !== interest)
        : [...prev.interestedIn, interest]
    }));
  };
  
  // Validate current step
  const validateStep = () => {
    const newErrors = {};
    
    switch (currentStep) {
      case 1:
        if (!formData.email) {
          newErrors.email = 'Email is required';
        } else if (!validateEmail(formData.email)) {
          newErrors.email = 'Invalid email format';
        }
        
        if (!formData.username) {
          newErrors.username = 'Username is required';
        } else if (formData.username.length < 3) {
          newErrors.username = 'Username must be at least 3 characters';
        } else if (usernameAvailable === false) {
          newErrors.username = 'Username is already taken';
        }
        
        if (!formData.password) {
          newErrors.password = 'Password is required';
        } else if (passwordStrength < 60) {
          newErrors.password = 'Password is too weak';
        }
        
        if (formData.password !== formData.confirmPassword) {
          newErrors.confirmPassword = 'Passwords do not match';
        }
        break;
        
      case 2:
        if (!formData.firstName) {
          newErrors.firstName = 'First name is required';
        }
        
        if (!formData.lastName) {
          newErrors.lastName = 'Last name is required';
        }
        
        if (!formData.dateOfBirth) {
          newErrors.dateOfBirth = 'Date of birth is required';
        } else {
          const age = new Date().getFullYear() - new Date(formData.dateOfBirth).getFullYear();
          if (age < 18) {
            newErrors.dateOfBirth = 'You must be 18 or older';
          }
        }
        
        if (!formData.gender) {
          newErrors.gender = 'Please select your gender';
        }
        break;
        
      case 3:
        if (formData.interestedIn.length === 0) {
          newErrors.interestedIn = 'Please select at least one preference';
        }
        break;
        
      case 4:
        if (!formData.agreedToTerms) {
          newErrors.agreedToTerms = 'You must agree to the terms of service';
        }
        
        if (!formData.agreedToAge) {
          newErrors.agreedToAge = 'You must confirm you are 18 or older';
        }
        break;
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  // Handle step navigation
  const handleNext = () => {
    if (validateStep()) {
      setCurrentStep(prev => Math.min(prev + 1, totalSteps));
    }
  };
  
  const handlePrevious = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };
  
  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log('🚀 Registration form submitted');
    console.log('📋 Current step:', currentStep);
    console.log('📝 Form data:', formData);
    
    // Only process registration on final step
    if (currentStep !== totalSteps) {
      console.log('⚠️ Not on final step, ignoring submit');
      return;
    }
    
    if (!validateStep()) {
      console.log('❌ Validation failed');
      return;
    }
    
    console.log('✅ Validation passed, submitting registration...');
    setLoading(true);
    
    try {
      // Prepare registration data - match backend expectations
      const registrationData = {
        email: formData.email,
        username: formData.username,
        password: formData.password,
        displayName: formData.username,
        phone: formData.phone || undefined,
        birthDate: formData.dateOfBirth,
        agreeToTerms: formData.agreedToTerms
      };
      
      // API call to register using auth service
      console.log('📤 Sending registration data:', registrationData);
      const response = await authService.memberRegister(registrationData);
      console.log('📥 Registration response:', response);
      
      if (response && response.data && response.data.success) {
        console.log('✅ Registration successful!');
        // Show success message - let them know to check email
        alert(response.data.message || 'Registration successful! Please check your email to verify your account, then login.');
        
        // Redirect to login page as per new flow
        const redirectPath = response.data.redirectTo || '/member/login';
        navigate(redirectPath);
      } else {
        console.log('❌ Registration failed:', response);
        throw new Error(response.message || response.data?.error || 'Registration failed');
      }
    } catch (error) {
      console.error('Registration error:', error);
      setErrors({
        submit: error.message || 'Registration failed. Please try again.'
      });
    } finally {
      setLoading(false);
    }
  };
  
  // Render step content
  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <motion.div 
            className="memberreg-step-content"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            <h2 className="memberreg-step-title">Create Your Account</h2>
            <p className="memberreg-step-subtitle">Join thousands discovering amazing creators</p>
            
            {/* Email Field */}
            <div className="memberreg-form-group">
              <label className="memberreg-label">
                <Mail size={18} />
                <span>Email Address</span>
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="your@email.com"
                className={`memberreg-input ${errors.email ? 'error' : ''}`}
                autoComplete="email"
              />
              {errors.email && (
                <span className="memberreg-error-text">
                  <AlertCircle size={14} />
                  {errors.email}
                </span>
              )}
            </div>
            
            {/* Username Field */}
            <div className="memberreg-form-group">
              <label className="memberreg-label">
                <User size={18} />
                <span>Username</span>
              </label>
              <div className="memberreg-input-wrapper">
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleInputChange}
                  placeholder="Choose a unique username"
                  className={`memberreg-input ${errors.username ? 'error' : ''}`}
                  autoComplete="username"
                />
                {checkingUsername && (
                  <span className="memberreg-input-icon checking">
                    <div className="memberreg-spinner"></div>
                  </span>
                )}
                {usernameAvailable === true && (
                  <span className="memberreg-input-icon success">
                    <Check size={18} />
                  </span>
                )}
                {usernameAvailable === false && (
                  <span className="memberreg-input-icon error">
                    <X size={18} />
                  </span>
                )}
              </div>
              {errors.username && (
                <span className="memberreg-error-text">
                  <AlertCircle size={14} />
                  {errors.username}
                </span>
              )}
            </div>
            
            {/* Password Field */}
            <div className="memberreg-form-group">
              <label className="memberreg-label">
                <Lock size={18} />
                <span>Password</span>
              </label>
              <div className="memberreg-input-wrapper">
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  placeholder="Create a strong password"
                  className={`memberreg-input ${errors.password ? 'error' : ''}`}
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  className="memberreg-input-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              
              {/* Password Strength Indicator */}
              {formData.password && (
                <div className="memberreg-password-strength">
                  <div className="strength-bar">
                    <div 
                      className={`strength-fill strength-${passwordStrength}`}
                      style={{ width: `${passwordStrength}%` }}
                    />
                  </div>
                  <div className="strength-requirements">
                    <span className={passwordRequirements.minLength ? 'met' : ''}>
                      <Check size={12} /> 8+ characters
                    </span>
                    <span className={passwordRequirements.hasUpperCase ? 'met' : ''}>
                      <Check size={12} /> Uppercase
                    </span>
                    <span className={passwordRequirements.hasLowerCase ? 'met' : ''}>
                      <Check size={12} /> Lowercase
                    </span>
                    <span className={passwordRequirements.hasNumber ? 'met' : ''}>
                      <Check size={12} /> Number
                    </span>
                    <span className={passwordRequirements.hasSpecial ? 'met' : ''}>
                      <Check size={12} /> Special char
                    </span>
                  </div>
                </div>
              )}
              
              {errors.password && (
                <span className="memberreg-error-text">
                  <AlertCircle size={14} />
                  {errors.password}
                </span>
              )}
            </div>
            
            {/* Confirm Password Field */}
            <div className="memberreg-form-group">
              <label className="memberreg-label">
                <Lock size={18} />
                <span>Confirm Password</span>
              </label>
              <div className="memberreg-input-wrapper">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  placeholder="Re-enter your password"
                  className={`memberreg-input ${errors.confirmPassword ? 'error' : ''}`}
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  className="memberreg-input-toggle"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {errors.confirmPassword && (
                <span className="memberreg-error-text">
                  <AlertCircle size={14} />
                  {errors.confirmPassword}
                </span>
              )}
            </div>
          </motion.div>
        );
        
      case 2:
        return (
          <motion.div 
            className="memberreg-step-content"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            <h2 className="memberreg-step-title">Personal Information</h2>
            <p className="memberreg-step-subtitle">Tell us a bit about yourself</p>
            
            {/* Name Fields */}
            <div className="memberreg-form-row">
              <div className="memberreg-form-group">
                <label className="memberreg-label">
                  <User size={18} />
                  <span>First Name</span>
                </label>
                <input
                  type="text"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleInputChange}
                  placeholder="John"
                  className={`memberreg-input ${errors.firstName ? 'error' : ''}`}
                />
                {errors.firstName && (
                  <span className="memberreg-error-text">
                    <AlertCircle size={14} />
                    {errors.firstName}
                  </span>
                )}
              </div>
              
              <div className="memberreg-form-group">
                <label className="memberreg-label">
                  <User size={18} />
                  <span>Last Name</span>
                </label>
                <input
                  type="text"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleInputChange}
                  placeholder="Doe"
                  className={`memberreg-input ${errors.lastName ? 'error' : ''}`}
                />
                {errors.lastName && (
                  <span className="memberreg-error-text">
                    <AlertCircle size={14} />
                    {errors.lastName}
                  </span>
                )}
              </div>
            </div>
            
            {/* Date of Birth */}
            <div className="memberreg-form-group">
              <label className="memberreg-label">
                <Calendar size={18} />
                <span>Date of Birth</span>
              </label>
              <input
                type="date"
                name="dateOfBirth"
                value={formData.dateOfBirth}
                onChange={handleInputChange}
                max={new Date(new Date().setFullYear(new Date().getFullYear() - 18)).toISOString().split('T')[0]}
                className={`memberreg-input ${errors.dateOfBirth ? 'error' : ''}`}
              />
              {errors.dateOfBirth && (
                <span className="memberreg-error-text">
                  <AlertCircle size={14} />
                  {errors.dateOfBirth}
                </span>
              )}
            </div>
            
            {/* Phone Number */}
            <div className="memberreg-form-group">
              <label className="memberreg-label">
                <Phone size={18} />
                <span>Phone Number (Optional)</span>
              </label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                placeholder="+1 (555) 123-4567"
                className="memberreg-input"
              />
            </div>
            
            {/* Gender Selection */}
            <div className="memberreg-form-group">
              <label className="memberreg-label">
                <Users size={18} />
                <span>Gender</span>
              </label>
              <div className="memberreg-radio-group">
                <label className="memberreg-radio-option">
                  <input
                    type="radio"
                    name="gender"
                    value="male"
                    checked={formData.gender === 'male'}
                    onChange={handleInputChange}
                  />
                  <span className="radio-custom"></span>
                  <span>Male</span>
                </label>
                
                <label className="memberreg-radio-option">
                  <input
                    type="radio"
                    name="gender"
                    value="female"
                    checked={formData.gender === 'female'}
                    onChange={handleInputChange}
                  />
                  <span className="radio-custom"></span>
                  <span>Female</span>
                </label>
              </div>
              {errors.gender && (
                <span className="memberreg-error-text">
                  <AlertCircle size={14} />
                  {errors.gender}
                </span>
              )}
            </div>
          </motion.div>
        );
        
      case 3:
        return (
          <motion.div 
            className="memberreg-step-content"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            <h2 className="memberreg-step-title">Browse Preferences</h2>
            <p className="memberreg-step-subtitle">Help us find your perfect matches</p>
            
            {/* Sexual Orientation */}
            <div className="memberreg-form-group">
              <label className="memberreg-label">
                <Heart size={18} />
                <span>Your Orientation</span>
              </label>
              <select
                name="orientation"
                value={formData.orientation}
                onChange={handleInputChange}
                className="memberreg-select"
              >
                <option value="straight">Straight</option>
                <option value="gay">Gay</option>
                <option value="lesbian">Lesbian</option>
                <option value="bisexual">Bisexual</option>
                <option value="pansexual">Pansexual</option>
                <option value="asexual">Asexual</option>
                <option value="other">Other</option>
              </select>
            </div>
            
            {/* Interested In */}
            <div className="memberreg-form-group">
              <label className="memberreg-label">
                <Users size={18} />
                <span>Interested In</span>
              </label>
              <div className="memberreg-checkbox-group">
                <label className="memberreg-checkbox-option">
                  <input
                    type="checkbox"
                    checked={formData.interestedIn.includes('male')}
                    onChange={() => handleInterestToggle('male')}
                  />
                  <span className="checkbox-custom"></span>
                  <span>Men</span>
                </label>
                
                <label className="memberreg-checkbox-option">
                  <input
                    type="checkbox"
                    checked={formData.interestedIn.includes('female')}
                    onChange={() => handleInterestToggle('female')}
                  />
                  <span className="checkbox-custom"></span>
                  <span>Women</span>
                </label>
                
                <label className="memberreg-checkbox-option">
                  <input
                    type="checkbox"
                    checked={formData.interestedIn.includes('all')}
                    onChange={() => handleInterestToggle('all')}
                  />
                  <span className="checkbox-custom"></span>
                  <span>Everyone</span>
                </label>
              </div>
              {errors.interestedIn && (
                <span className="memberreg-error-text">
                  <AlertCircle size={14} />
                  {errors.interestedIn}
                </span>
              )}
            </div>
            
            {/* Age Range */}
            <div className="memberreg-form-group">
              <label className="memberreg-label">
                <Calendar size={18} />
                <span>Age Range: {formData.ageRange[0]} - {formData.ageRange[1]}</span>
              </label>
              <div className="memberreg-range-inputs">
                <input
                  type="range"
                  min="18"
                  max="100"
                  value={formData.ageRange[0]}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    ageRange: [parseInt(e.target.value), prev.ageRange[1]]
                  }))}
                  className="memberreg-range"
                />
                <input
                  type="range"
                  min="18"
                  max="100"
                  value={formData.ageRange[1]}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    ageRange: [prev.ageRange[0], parseInt(e.target.value)]
                  }))}
                  className="memberreg-range"
                />
              </div>
            </div>
            
          </motion.div>
        );
        
      case 4:
        return (
          <motion.div 
            className="memberreg-step-content"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            <h2 className="memberreg-step-title">Almost Done!</h2>
            <p className="memberreg-step-subtitle">Review and agree to get started</p>
            
            {/* Terms and Conditions */}
            <div className="memberreg-agreements">
              <label className="memberreg-checkbox-option large">
                <input
                  type="checkbox"
                  name="agreedToTerms"
                  checked={formData.agreedToTerms}
                  onChange={handleInputChange}
                />
                <span className="checkbox-custom"></span>
                <span>
                  I agree to the <Link to="/terms" className="memberreg-link">Terms of Service</Link> and <Link to="/privacy" className="memberreg-link">Privacy Policy</Link>
                </span>
              </label>
              {errors.agreedToTerms && (
                <span className="memberreg-error-text">
                  <AlertCircle size={14} />
                  {errors.agreedToTerms}
                </span>
              )}
              
              <label className="memberreg-checkbox-option large">
                <input
                  type="checkbox"
                  name="agreedToAge"
                  checked={formData.agreedToAge}
                  onChange={handleInputChange}
                />
                <span className="checkbox-custom"></span>
                <span>I confirm that I am 18 years or older</span>
              </label>
              {errors.agreedToAge && (
                <span className="memberreg-error-text">
                  <AlertCircle size={14} />
                  {errors.agreedToAge}
                </span>
              )}
              
              <label className="memberreg-checkbox-option large">
                <input
                  type="checkbox"
                  name="enableNotifications"
                  checked={formData.enableNotifications}
                  onChange={handleInputChange}
                />
                <span className="checkbox-custom"></span>
                <span>Enable push notifications for matches and messages</span>
              </label>
              
            </div>
            
            
            {/* Submit Error */}
            {errors.submit && (
              <div className="memberreg-submit-error">
                <AlertCircle size={20} />
                <span>{errors.submit}</span>
              </div>
            )}
          </motion.div>
        );
        
      default:
        return null;
    }
  };
  
  return (
    <div className="memberreg-page">
      <div className="memberreg-container">
        <div className="memberreg-content">
          {/* Left Side - Benefits */}
          <div className="memberreg-benefits-section">
            <div className="memberreg-logo">
              <Sparkles size={32} />
              <h1>Join SexySelfies</h1>
            </div>
            
            <p className="memberreg-tagline">
              Discover and connect with amazing creators
            </p>
            
            <div className="memberreg-benefits-list">
              {memberBenefits.map((benefit, index) => (
                <motion.div 
                  key={index}
                  className="memberreg-benefit-item"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <div className="benefit-icon-wrapper">
                    {benefit.icon}
                  </div>
                  <div className="benefit-content">
                    <h3>{benefit.title}</h3>
                    <p>{benefit.description}</p>
                  </div>
                </motion.div>
              ))}
            </div>
            
            <div className="memberreg-testimonial">
              <div className="testimonial-stars">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} size={16} fill="currentColor" />
                ))}
              </div>
              <p>"Best platform for discovering authentic creators!"</p>
              <span>- Sarah M., Member since 2024</span>
            </div>
          </div>
          
          {/* Right Side - Registration Form */}
          <div className="memberreg-form-section">
            <form onSubmit={handleSubmit} className="memberreg-form">
              {/* Progress Bar */}
              <div className="memberreg-progress">
                <div className="progress-bar">
                  <div 
                    className="progress-fill"
                    style={{ width: `${(currentStep / totalSteps) * 100}%` }}
                  />
                </div>
                <div className="progress-steps">
                  {[...Array(totalSteps)].map((_, index) => (
                    <div 
                      key={index}
                      className={`progress-step ${currentStep > index ? 'completed' : ''} ${currentStep === index + 1 ? 'active' : ''}`}
                    >
                      {currentStep > index ? <Check size={16} /> : index + 1}
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Step Content */}
              <AnimatePresence mode="wait">
                {renderStepContent()}
              </AnimatePresence>
              
              {/* Navigation Buttons */}
              <div className="memberreg-form-actions">
                {currentStep > 1 && (
                  <button
                    type="button"
                    onClick={handlePrevious}
                    className="memberreg-btn-secondary"
                    disabled={loading}
                  >
                    <ChevronLeft size={18} />
                    <span>Previous</span>
                  </button>
                )}
                
                {currentStep < totalSteps ? (
                  <button
                    type="button"
                    onClick={handleNext}
                    className="memberreg-btn-primary"
                    disabled={loading}
                  >
                    <span>Next</span>
                    <ChevronRight size={18} />
                  </button>
                ) : (
                  <button
                    type="submit"
                    className="memberreg-btn-submit"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <div className="memberreg-spinner"></div>
                        <span>Creating Account...</span>
                      </>
                    ) : (
                      <>
                        <UserPlus size={18} />
                        <span>Complete Registration</span>
                      </>
                    )}
                  </button>
                )}
              </div>
            </form>
            
            {/* Login Link */}
            <div className="memberreg-login-link">
              Already have an account?
              <Link to="/member/login" className="memberreg-link">
                Sign In
              </Link>
            </div>
          </div>
        </div>
      </div>
      
      {/* Bottom Navigation - Mobile Only */}
      {isMobile && <BottomNavigation userRole={userRole} />}
    </div>
  );
};

export default MemberRegistration;