import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Mail, Lock, Eye, EyeOff, User, Calendar, Globe, 
  FileText, Camera, ArrowRight, ArrowLeft, Check, X,
  AlertCircle, Shield, DollarSign, Users, Sparkles
} from 'lucide-react';
import authService from '../services/auth.service';  // ADD THIS IMPORT
import MainHeader from '../components/MainHeader';
import MainFooter from '../components/MainFooter';
import CreatorMainHeader from '../components/CreatorMainHeader';
import CreatorMainFooter from '../components/CreatorMainFooter';
import BottomNavigation from '../components/BottomNavigation';
import { useIsMobile, useIsDesktop, getUserRole } from '../utils/mobileDetection';
import './CreatorRegistration.css';

const CreatorRegistration = () => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const isDesktop = useIsDesktop();
  const userRole = getUserRole();
  
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    // Step 1: Account Info
    email: '',
    password: '',
    confirmPassword: '',
    
    // Step 2: Profile Info
    displayName: '',
    username: '',
    dateOfBirth: '',
    country: '',
    
    // Step 3: Agreement
    agreeToTerms: false,
    agreeToContentPolicy: false,
    over18Confirmation: false,
    taxInfoConsent: false
  });
  
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const countries = [
    'United States', 'Canada', 'United Kingdom', 'Australia', 
    'Germany', 'France', 'Spain', 'Italy', 'Netherlands', 'Other'
  ];
  
  
  const validateStep = (stepNumber) => {
    const newErrors = {};
    
    switch(stepNumber) {
      case 1:
        if (!formData.email) {
          newErrors.email = 'Email is required';
        } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
          newErrors.email = 'Email is invalid';
        }
        
        if (!formData.password) {
          newErrors.password = 'Password is required';
        } else if (formData.password.length < 8) {
          newErrors.password = 'Password must be at least 8 characters';
        } else if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/.test(formData.password)) {
          newErrors.password = 'Password must contain uppercase, lowercase, number, and special character (@$!%*?&)';
        }
        
        if (!formData.confirmPassword) {
          newErrors.confirmPassword = 'Please confirm your password';
        } else if (formData.password !== formData.confirmPassword) {
          newErrors.confirmPassword = 'Passwords do not match';
        }
        break;
        
      case 2:
        if (!formData.displayName) {
          newErrors.displayName = 'Display name is required';
        } else if (formData.displayName.length < 3) {
          newErrors.displayName = 'Display name must be at least 3 characters';
        }
        
        if (!formData.username) {
          newErrors.username = 'Username is required';
        } else if (formData.username.length < 3) {
          newErrors.username = 'Username must be at least 3 characters';
        } else if (!/^[a-zA-Z0-9_]+$/.test(formData.username)) {
          newErrors.username = 'Username can only contain letters, numbers, and underscores';
        }
        
        if (!formData.dateOfBirth) {
          newErrors.dateOfBirth = 'Date of birth is required';
        } else {
          const age = new Date().getFullYear() - new Date(formData.dateOfBirth).getFullYear();
          if (age < 18) {
            newErrors.dateOfBirth = 'You must be at least 18 years old';
          }
        }
        
        if (!formData.country) {
          newErrors.country = 'Please select your country';
        }
        break;
        
      case 3:
        if (!formData.agreeToTerms) {
          newErrors.agreeToTerms = 'You must agree to the terms of service';
        }
        if (!formData.agreeToContentPolicy) {
          newErrors.agreeToContentPolicy = 'You must agree to the content policy';
        }
        if (!formData.over18Confirmation) {
          newErrors.over18Confirmation = 'You must confirm you are over 18';
        }
        if (!formData.taxInfoConsent) {
          newErrors.taxInfoConsent = 'You must consent to provide tax information';
        }
        break;
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleNext = () => {
    if (validateStep(step)) {
      setStep(step + 1);
    }
  };
  
  const handleBack = () => {
    setStep(step - 1);
  };
  
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    // Clear error for this field
    setErrors(prev => ({ ...prev, [name]: undefined }));
  };


  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateStep(3)) {
      return;
    }
    
    setLoading(true);
    
    try {
      // Prepare registration data
      const registrationData = {
        email: formData.email,
        password: formData.password,
        confirmPassword: formData.confirmPassword,
        username: formData.username,
        displayName: formData.displayName,
        birthDate: formData.dateOfBirth,
        country: formData.country,
        agreeToTerms: formData.agreeToTerms,
        agreeToContentPolicy: formData.agreeToContentPolicy,
        over18Confirmation: formData.over18Confirmation,
        taxInfoConsent: formData.taxInfoConsent
      };
      
      console.log('Sending registration data:', registrationData);
      
      // Use the auth service for creator registration
      const response = await authService.creatorRegister(registrationData);
      
      console.log('Frontend received response:', response);
      
      // Check if we got a successful response (auth service already stores tokens)
      if (response && response.success && response.token) {
        // Tokens are already stored by auth service, just store additional info
        localStorage.setItem('userEmail', formData.email);
        localStorage.setItem('displayName', formData.displayName);
        localStorage.setItem('username', formData.username);
        localStorage.setItem('needsVerification', 'true');
        
        // Show success message
        alert('Registration successful! You will now be redirected to complete ID verification.');
        
        // Redirect to ID verification page
        navigate('/creator/verify-id');
      } else if (response && response.success) {
        // Registration succeeded but no immediate token (maybe requires verification first)
        setErrors({ submit: response.message || 'Registration successful but requires verification' });
      } else {
        // Handle API error response
        setErrors({ submit: response?.error || response?.message || 'Registration failed' });
      }
    } catch (error) {
      console.error('Registration error:', error);
      console.error('Full error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
      console.error('Error headers:', error.response?.headers);
      
      // Handle different error types
      if (error.response && error.response.data) {
        // Server responded with error - show the actual backend error
        const backendError = error.response.data;
        
        if (backendError.errors && Array.isArray(backendError.errors)) {
          // Handle validation errors array
          const errorMessages = backendError.errors.map(err => err.message).join(', ');
          setErrors({ submit: errorMessages });
        } else if (backendError.error) {
          // Single error message
          setErrors({ submit: backendError.error });
        } else if (backendError.message) {
          // Alternative error message field
          setErrors({ submit: backendError.message });
        } else {
          // Unknown backend error format
          setErrors({ submit: `Server error (${error.response.status}): ${JSON.stringify(backendError)}` });
        }
      } else if (error.message) {
        // Auth service or network error
        setErrors({ submit: error.message });
      } else {
        // Fallback for unknown errors
        setErrors({ submit: 'An unexpected error occurred. Please try again.' });
      }
    } finally {
      setLoading(false);
    }
  };

  const renderStep = () => {
    switch(step) {
      case 1:
        return (
          <div className="creator-registration-step">
            <h2>Create Your Account</h2>
            <p className="creator-registration-step-subtitle">Join thousands of creators earning on their own terms</p>
            
            <div className="creator-registration-form-group">
              <label htmlFor="email">Email Address</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="your@email.com"
                className={errors.email ? 'creator-registration-input-error' : ''}
              />
              {errors.email && <span className="creator-registration-error-message">{errors.email}</span>}
            </div>
            
            <div className="creator-registration-form-group">
              <label htmlFor="password">Password</label>
              <div className="creator-registration-password-input-wrapper">
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  placeholder="Create a strong password"
                  className={errors.password ? 'creator-registration-input-error' : ''}
                />
                <button
                  type="button"
                  className="creator-registration-password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
              {errors.password && <span className="creator-registration-error-message">{errors.password}</span>}
            </div>
            
            <div className="creator-registration-form-group">
              <label htmlFor="confirmPassword">Confirm Password</label>
              <div className="creator-registration-password-input-wrapper">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  id="confirmPassword"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  placeholder="Re-enter your password"
                  className={errors.confirmPassword ? 'creator-registration-input-error' : ''}
                />
                <button
                  type="button"
                  className="creator-registration-password-toggle"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
              {errors.confirmPassword && <span className="creator-registration-error-message">{errors.confirmPassword}</span>}
            </div>
          </div>
        );
        
      case 2:
        return (
          <div className="creator-registration-step">
            <h2>Profile Information</h2>
            <p className="creator-registration-step-subtitle">Tell us about yourself</p>
            
            <div className="creator-registration-form-group">
              <label htmlFor="displayName">Display Name</label>
              <input
                type="text"
                id="displayName"
                name="displayName"
                value={formData.displayName}
                onChange={handleInputChange}
                placeholder="How you'll appear to members"
                className={errors.displayName ? 'creator-registration-input-error' : ''}
              />
              {errors.displayName && <span className="creator-registration-error-message">{errors.displayName}</span>}
            </div>
            
            <div className="creator-registration-form-group">
              <label htmlFor="username">Username</label>
              <input
                type="text"
                id="username"
                name="username"
                value={formData.username}
                onChange={handleInputChange}
                placeholder="Choose a unique username"
                className={errors.username ? 'creator-registration-input-error' : ''}
              />
              {errors.username && <span className="creator-registration-error-message">{errors.username}</span>}
            </div>
            
            <div className="creator-registration-form-group">
              <label htmlFor="dateOfBirth">Date of Birth</label>
              <input
                type="date"
                id="dateOfBirth"
                name="dateOfBirth"
                value={formData.dateOfBirth}
                onChange={handleInputChange}
                max={new Date(new Date().setFullYear(new Date().getFullYear() - 18)).toISOString().split('T')[0]}
                className={errors.dateOfBirth ? 'creator-registration-input-error' : ''}
              />
              {errors.dateOfBirth && <span className="creator-registration-error-message">{errors.dateOfBirth}</span>}
            </div>
            
            <div className="creator-registration-form-group">
              <label htmlFor="country">Country</label>
              <select
                id="country"
                name="country"
                value={formData.country}
                onChange={handleInputChange}
                className={errors.country ? 'creator-registration-input-error' : ''}
              >
                <option value="">Select your country</option>
                {countries.map(country => (
                  <option key={country} value={country}>{country}</option>
                ))}
              </select>
              {errors.country && <span className="creator-registration-error-message">{errors.country}</span>}
            </div>
          </div>
        );
        
      case 3:
        return (
          <div className="creator-registration-step">
            <h2>Terms & Agreements</h2>
            <p className="creator-registration-step-subtitle">Please review and accept our policies</p>
            
            <div className="creator-registration-agreements">
              <label className="creator-registration-checkbox-label">
                <input
                  type="checkbox"
                  name="agreeToTerms"
                  checked={formData.agreeToTerms}
                  onChange={handleInputChange}
                />
                <span>I agree to the <Link to="/terms">Terms of Service</Link> and <Link to="/privacy">Privacy Policy</Link></span>
              </label>
              {errors.agreeToTerms && <span className="creator-registration-error-message">{errors.agreeToTerms}</span>}
              
              <label className="creator-registration-checkbox-label">
                <input
                  type="checkbox"
                  name="agreeToContentPolicy"
                  checked={formData.agreeToContentPolicy}
                  onChange={handleInputChange}
                />
                <span>I agree to the <Link to="/content-policy">Content Policy</Link> and community guidelines</span>
              </label>
              {errors.agreeToContentPolicy && <span className="creator-registration-error-message">{errors.agreeToContentPolicy}</span>}
              
              <label className="creator-registration-checkbox-label">
                <input
                  type="checkbox"
                  name="over18Confirmation"
                  checked={formData.over18Confirmation}
                  onChange={handleInputChange}
                />
                <span>I confirm that I am 18 years of age or older</span>
              </label>
              {errors.over18Confirmation && <span className="creator-registration-error-message">{errors.over18Confirmation}</span>}
              
              <label className="creator-registration-checkbox-label">
                <input
                  type="checkbox"
                  name="taxInfoConsent"
                  checked={formData.taxInfoConsent}
                  onChange={handleInputChange}
                />
                <span>I consent to provide tax information for earnings</span>
              </label>
              {errors.taxInfoConsent && <span className="creator-registration-error-message">{errors.taxInfoConsent}</span>}
            </div>
            
            {errors.submit && (
              <div className="creator-registration-error-alert">
                <AlertCircle size={20} />
                <span>{errors.submit}</span>
              </div>
            )}
          </div>
        );
        
      default:
        return null;
    }
  };
  
  return (
    <div className="creator-registration-page">
      {/* Desktop Header */}
      {isDesktop && <CreatorMainHeader />}
      
      <div className="creator-registration">
        <div className="creator-registration-wrapper">
          <div className="creator-registration-container">
        <div className="creator-registration-content">
          <div className="creator-registration-header">
            <h1>Become a Creator</h1>
            <p>Start earning from your content today</p>
          </div>
          
          <div className="creator-registration-progress">
            <div className="creator-registration-progress-bar">
              <div 
                className="creator-registration-progress-fill"
                style={{ width: `${(step / 3) * 100}%` }}
              />
            </div>
            <div className="creator-registration-step-indicator">
              Step {step} of 3
            </div>
          </div>
          
          <form onSubmit={handleSubmit} className="creator-registration-form">
            {renderStep()}
            
            <div className="creator-registration-actions">
              {step > 1 && (
                <button
                  type="button"
                  onClick={handleBack}
                  className="creator-registration-btn creator-registration-btn-secondary"
                  disabled={loading}
                >
                  <ArrowLeft size={20} />
                  Back
                </button>
              )}
              
              {step < 3 ? (
                <button
                  type="button"
                  onClick={handleNext}
                  className="creator-registration-btn creator-registration-btn-primary"
                >
                  Next
                  <ArrowRight size={20} />
                </button>
              ) : (
                <button
                  type="submit"
                  className="creator-registration-btn creator-registration-btn-primary"
                  disabled={loading}
                >
                  {loading ? 'Creating Account...' : 'Complete Registration'}
                  {!loading && <Check size={20} />}
                </button>
              )}
            </div>
          </form>
          
          <div className="creator-registration-footer">
            <p>Already have an account? <Link to="/creator/login">Sign In</Link></p>
          </div>
        </div>
          </div>
        </div>
      </div>
      
      {/* Desktop Footer */}
      {isDesktop && <MainFooter />}
      
      {/* Bottom Navigation - Mobile Only */}
      {isMobile && <BottomNavigation userRole={userRole} />}
    </div>
  );
};

export default CreatorRegistration;