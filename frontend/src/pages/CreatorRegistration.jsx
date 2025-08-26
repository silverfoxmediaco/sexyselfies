import React, { useState } from 'react';
import BottomNavigation from '../components/BottomNavigation';
import { useIsMobile, getUserRole } from '../utils/mobileDetection';
import './CreatorRegistration.css';

const CreatorRegistration = () => {
  const [step, setStep] = useState(1);
  const isMobile = useIsMobile();
  const userRole = getUserRole();
  const [formData, setFormData] = useState({
    // Account info
    email: '',
    password: '',
    confirmPassword: '',
    
    // Creator profile
    displayName: '',
    bio: '',
    dateOfBirth: '',
    
    // Preferences
    contentTypes: [],
    priceRange: { min: 0.99, max: 9.99 },
    
    // Legal
    agreedToTerms: false,
    confirmedAge: false,
    confirmedRights: false
  });
  
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const validateStep = (stepNumber) => {
    const newErrors = {};
    
    switch(stepNumber) {
      case 1:
        // Email validation
        if (!formData.email) {
          newErrors.email = 'Email is required';
        } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
          newErrors.email = 'Please enter a valid email';
        }
        
        // Password validation
        if (!formData.password) {
          newErrors.password = 'Password is required';
        } else if (formData.password.length < 8) {
          newErrors.password = 'Password must be at least 8 characters';
        }
        
        // Confirm password
        if (formData.password !== formData.confirmPassword) {
          newErrors.confirmPassword = 'Passwords do not match';
        }
        break;
        
      case 2:
        // Display name validation
        if (!formData.displayName) {
          newErrors.displayName = 'Display name is required';
        } else if (formData.displayName.length > 50) {
          newErrors.displayName = 'Display name must be less than 50 characters';
        }
        
        // Bio validation
        if (formData.bio && formData.bio.length > 500) {
          newErrors.bio = 'Bio must be less than 500 characters';
        }
        
        // Age verification
        if (!formData.dateOfBirth) {
          newErrors.dateOfBirth = 'Date of birth is required';
        } else {
          const age = calculateAge(formData.dateOfBirth);
          if (age < 18) {
            newErrors.dateOfBirth = 'You must be 18 or older to join';
          }
        }
        break;
        
      case 3:
        // Content types
        if (formData.contentTypes.length === 0) {
          newErrors.contentTypes = 'Please select at least one content type';
        }
        break;
        
      case 4:
        // Legal agreements
        if (!formData.agreedToTerms) {
          newErrors.agreedToTerms = 'You must agree to the terms of service';
        }
        if (!formData.confirmedAge) {
          newErrors.confirmedAge = 'You must confirm you are 18 or older';
        }
        if (!formData.confirmedRights) {
          newErrors.confirmedRights = 'You must confirm content rights';
        }
        break;
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const calculateAge = (birthDate) => {
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    
    return age;
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

  const handleContentTypeToggle = (type) => {
    setFormData(prev => ({
      ...prev,
      contentTypes: prev.contentTypes.includes(type)
        ? prev.contentTypes.filter(t => t !== type)
        : [...prev.contentTypes, type]
    }));
    setErrors(prev => ({ ...prev, contentTypes: undefined }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateStep(4)) {
      return;
    }
    
    setLoading(true);
    
    try {
      // First, register the user account
      const response = await fetch('http://localhost:5002/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          displayName: formData.displayName,
          role: 'creator'
        })
      });
      
      const data = await response.json();
      
      if (response.ok && data.token) {
        // Store token and user info
        localStorage.setItem('token', data.token);
        localStorage.setItem('userId', data.user.id);
        localStorage.setItem('userEmail', formData.email);
        localStorage.setItem('needsVerification', 'true');
        
        // Redirect to ID verification page instead of dashboard
        window.location.href = '/creator/verify-id';
      } else {
        setErrors({ submit: data.error || 'Registration failed' });
      }
    } catch (error) {
      console.error('Registration error:', error);
      setErrors({ submit: 'Network error. Please check your connection and try again.' });
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
                  placeholder="At least 8 characters"
                  className={errors.password ? 'creator-registration-input-error' : ''}
                />
                <button
                  type="button"
                  className="creator-registration-toggle-password"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? '👁️' : '👁️‍🗨️'}
                </button>
              </div>
              {errors.password && <span className="creator-registration-error-message">{errors.password}</span>}
            </div>
            
            <div className="creator-registration-form-group">
              <label htmlFor="confirmPassword">Confirm Password</label>
              <input
                type={showPassword ? 'text' : 'password'}
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleInputChange}
                placeholder="Re-enter your password"
                className={errors.confirmPassword ? 'creator-registration-input-error' : ''}
              />
              {errors.confirmPassword && <span className="creator-registration-error-message">{errors.confirmPassword}</span>}
            </div>
            
            <div className="creator-registration-password-strength">
              <div className="creator-registration-strength-meter">
                <div className={`creator-registration-strength-fill creator-registration-strength-${
                  formData.password.length >= 12 ? 'strong' :
                  formData.password.length >= 8 ? 'medium' : 'weak'
                }`}></div>
              </div>
              <span className="creator-registration-strength-text">
                {formData.password.length >= 12 ? 'Strong' :
                 formData.password.length >= 8 ? 'Medium' : 
                 formData.password.length > 0 ? 'Weak' : ''}
              </span>
            </div>
          </div>
        );
        
      case 2:
        return (
          <div className="creator-registration-step">
            <h2>Set Up Your Profile</h2>
            <p className="creator-registration-step-subtitle">This is how fans will discover you</p>
            
            <div className="creator-registration-form-group">
              <label htmlFor="displayName">Display Name</label>
              <input
                type="text"
                id="displayName"
                name="displayName"
                value={formData.displayName}
                onChange={handleInputChange}
                placeholder="Choose your creator name"
                className={errors.displayName ? 'creator-registration-input-error' : ''}
                maxLength="50"
              />
              <span className="creator-registration-character-count">{formData.displayName.length}/50</span>
              {errors.displayName && <span className="creator-registration-error-message">{errors.displayName}</span>}
            </div>
            
            <div className="creator-registration-form-group">
              <label htmlFor="bio">Bio (Optional)</label>
              <textarea
                id="bio"
                name="bio"
                value={formData.bio}
                onChange={handleInputChange}
                placeholder="Tell fans what makes you unique..."
                rows="4"
                maxLength="500"
                className={errors.bio ? 'creator-registration-input-error' : ''}
              />
              <span className="creator-registration-character-count">{formData.bio.length}/500</span>
              {errors.bio && <span className="creator-registration-error-message">{errors.bio}</span>}
            </div>
            
            <div className="creator-registration-form-group">
              <label htmlFor="dateOfBirth">Date of Birth</label>
              <input
                type="date"
                id="dateOfBirth"
                name="dateOfBirth"
                value={formData.dateOfBirth}
                onChange={handleInputChange}
                className={errors.dateOfBirth ? 'creator-registration-input-error' : ''}
                max={new Date(new Date().setFullYear(new Date().getFullYear() - 18)).toISOString().split('T')[0]}
              />
              {errors.dateOfBirth && <span className="creator-registration-error-message">{errors.dateOfBirth}</span>}
              <p className="creator-registration-field-hint">You must be 18 or older to create content</p>
            </div>
          </div>
        );
        
      case 3:
        return (
          <div className="creator-registration-step">
            <h2>Content Preferences</h2>
            <p className="creator-registration-step-subtitle">Choose what type of content you'll share</p>
            
            <div className="creator-registration-form-group">
              <label>Content Types</label>
              <div className="creator-registration-content-type-grid">
                {['Photos', 'Videos', 'Live Streams', 'Messages', 'Stories'].map(type => (
                  <button
                    key={type}
                    type="button"
                    className={`creator-registration-content-type-card ${formData.contentTypes.includes(type) ? 'creator-registration-selected' : ''}`}
                    onClick={() => handleContentTypeToggle(type)}
                  >
                    <span className="creator-registration-content-icon">
                      {type === 'Photos' && '📸'}
                      {type === 'Videos' && '🎥'}
                      {type === 'Live Streams' && '🔴'}
                      {type === 'Messages' && '💬'}
                      {type === 'Stories' && '⭐'}
                    </span>
                    <span>{type}</span>
                  </button>
                ))}
              </div>
              {errors.contentTypes && <span className="creator-registration-error-message">{errors.contentTypes}</span>}
            </div>
            
            <div className="creator-registration-form-group">
              <label>Default Content Price Range</label>
              <div className="creator-registration-price-range-inputs">
                <div className="creator-registration-price-input">
                  <span className="creator-registration-currency">$</span>
                  <input
                    type="number"
                    min="0.99"
                    max="99.99"
                    step="0.01"
                    value={formData.priceRange.min}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      priceRange: { ...prev.priceRange, min: parseFloat(e.target.value) }
                    }))}
                  />
                </div>
                <span className="creator-registration-range-separator">to</span>
                <div className="creator-registration-price-input">
                  <span className="creator-registration-currency">$</span>
                  <input
                    type="number"
                    min="0.99"
                    max="99.99"
                    step="0.01"
                    value={formData.priceRange.max}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      priceRange: { ...prev.priceRange, max: parseFloat(e.target.value) }
                    }))}
                  />
                </div>
              </div>
              <p className="creator-registration-field-hint">You can set individual prices for each piece of content</p>
            </div>
            
            <div className="creator-registration-earning-estimate">
              <h3>Potential Earnings</h3>
              <p>With just 100 fans purchasing content at ${formData.priceRange.min.toFixed(2)}, you could earn:</p>
              <div className="creator-registration-earnings-display">
                <span className="creator-registration-earnings-amount">${(100 * formData.priceRange.min * 0.8).toFixed(2)}</span>
                <span className="creator-registration-earnings-period">per day</span>
              </div>
              <p className="creator-registration-earnings-note">You keep 80% of all earnings</p>
            </div>
          </div>
        );
        
      case 4:
        return (
          <div className="creator-registration-step">
            <h2>Verify Your Identity</h2>
            <p className="creator-registration-step-subtitle">For everyone's safety, we need to verify you're a real person</p>
            
            <div className="creator-registration-verification-section">
              <div className="creator-registration-verification-card">
                <div className="creator-registration-verification-icon">🪪</div>
                <h3>Government-Issued ID Required</h3>
                <p>We need a valid photo ID to verify your age and identity. This helps keep our platform safe.</p>
                
                <div className="creator-registration-accepted-ids">
                  <h4>Accepted Documents:</h4>
                  <ul>
                    <li>✔ Driver's License</li>
                    <li>✔ Passport</li>
                    <li>✔ National ID Card</li>
                    <li>✔ State-Issued ID</li>
                  </ul>
                </div>
              </div>
              
              <div className="creator-registration-privacy-notice">
                <div className="creator-registration-notice-icon">🔐</div>
                <h4>Your Privacy Matters</h4>
                <p>Your ID is encrypted and securely stored. We only use it for verification and never share it with anyone.</p>
              </div>
              
              <div className="creator-registration-checkbox-group">
                <label className="creator-registration-checkbox-label">
                  <input
                    type="checkbox"
                    name="confirmedAge"
                    checked={formData.confirmedAge}
                    onChange={handleInputChange}
                  />
                  <span className="creator-registration-checkbox-text">
                    I confirm that I am 18 years of age or older
                  </span>
                </label>
                {errors.confirmedAge && <span className="creator-registration-error-message">{errors.confirmedAge}</span>}
              </div>
              
              <div className="creator-registration-checkbox-group">
                <label className="creator-registration-checkbox-label">
                  <input
                    type="checkbox"
                    name="confirmedRights"
                    checked={formData.confirmedRights}
                    onChange={handleInputChange}
                  />
                  <span className="creator-registration-checkbox-text">
                    I confirm that I own all rights to the content I will upload
                  </span>
                </label>
                {errors.confirmedRights && <span className="creator-registration-error-message">{errors.confirmedRights}</span>}
              </div>
              
              <div className="creator-registration-checkbox-group">
                <label className="creator-registration-checkbox-label">
                  <input
                    type="checkbox"
                    name="agreedToTerms"
                    checked={formData.agreedToTerms}
                    onChange={handleInputChange}
                  />
                  <span className="creator-registration-checkbox-text">
                    I agree to the <a href="/terms" target="_blank">Terms of Service</a> and <a href="/privacy" target="_blank">Privacy Policy</a>
                  </span>
                </label>
                {errors.agreedToTerms && <span className="creator-registration-error-message">{errors.agreedToTerms}</span>}
              </div>
            </div>
            
            <div className="creator-registration-verification-timeline">
              <h4>What Happens Next?</h4>
              <div className="creator-registration-timeline-steps">
                <div className="creator-registration-timeline-step">
                  <span className="creator-registration-step-icon">1</span>
                  <div>
                    <strong>Submit Application</strong>
                    <p>Complete this form to create your account</p>
                  </div>
                </div>
                <div className="creator-registration-timeline-step">
                  <span className="creator-registration-step-icon">2</span>
                  <div>
                    <strong>Verify Your ID</strong>
                    <p>You'll be redirected to securely upload your ID</p>
                  </div>
                </div>
                <div className="creator-registration-timeline-step">
                  <span className="creator-registration-step-icon">3</span>
                  <div>
                    <strong>Quick Review</strong>
                    <p>Usually approved within 5-10 minutes</p>
                  </div>
                </div>
                <div className="creator-registration-timeline-step">
                  <span className="creator-registration-step-icon">4</span>
                  <div>
                    <strong>Start Earning!</strong>
                    <p>Once approved, access your creator dashboard</p>
                  </div>
                </div>
              </div>
            </div>
            
            {errors.submit && (
              <div className="creator-registration-submit-error">
                {errors.submit}
              </div>
            )}
          </div>
        );
        
      default:
        return null;
    }
  };

  return (
    <div className="creator-registration">
      <div className="creator-registration-container">
        <div className="creator-registration-title">
          <h1>Become a Creator</h1>
        </div>
        
        <div className="creator-registration-progress-bar">
          <div className="creator-registration-progress-steps">
            {[1, 2, 3, 4].map(num => (
              <div
                key={num}
                className={`creator-registration-progress-step ${step >= num ? 'creator-registration-active' : ''} ${step > num ? 'creator-registration-completed' : ''}`}
              >
                <div className="creator-registration-step-number">{step > num ? '✔' : num}</div>
                <span className="creator-registration-step-label">
                  {num === 1 && 'Account'}
                  {num === 2 && 'Profile'}
                  {num === 3 && 'Content'}
                  {num === 4 && 'Legal'}
                </span>
              </div>
            ))}
          </div>
          <div className="creator-registration-progress-fill" style={{ width: `${(step / 4) * 100}%` }}></div>
        </div>
        
        <form onSubmit={handleSubmit} className="creator-registration-form">
          {renderStep()}
          
          <div className="creator-registration-form-actions">
            {step > 1 && (
              <button
                type="button"
                onClick={handleBack}
                className="creator-registration-btn-secondary"
              >
                Back
              </button>
            )}
            
            {step < 4 ? (
              <button
                type="button"
                onClick={handleNext}
                className="creator-registration-btn-primary"
              >
                Next Step
              </button>
            ) : (
              <button
                type="submit"
                className="creator-registration-btn-primary creator-registration-btn-submit"
                disabled={loading}
              >
                {loading ? 'Creating Account...' : 'Continue to ID Verification'}
              </button>
            )}
          </div>
        </form>
        
        <div className="creator-registration-footer">
          <p>Already have an account? <a href="/creator/login">Sign In</a></p>
        </div>
      </div>
      
      {/* Bottom Navigation - Mobile Only */}
      {isMobile && <BottomNavigation userRole={userRole} />}
    </div>
  );
};

export default CreatorRegistration;