import React, { useState, useRef } from 'react';
import MainHeader from '../components/MainHeader';
import MainFooter from '../components/MainFooter';
import BottomNavigation from '../components/BottomNavigation';
import { useIsMobile, useIsDesktop, getUserRole } from '../utils/mobileDetection';
import './CreatorVerifyID.css';

const CreatorVerifyID = () => {
  const isMobile = useIsMobile();
  const isDesktop = useIsDesktop();
  const userRole = getUserRole();
  const [idFront, setIdFront] = useState(null);
  const [idBack, setIdBack] = useState(null);
  const [selfie, setSelfie] = useState(null);
  const [idType, setIdType] = useState('drivers_license');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errors, setErrors] = useState({});
  
  const frontInputRef = useRef(null);
  const backInputRef = useRef(null);
  const selfieInputRef = useRef(null);

  const handleFileChange = (e, type) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        setErrors(prev => ({ ...prev, [type]: 'File size must be less than 10MB' }));
        return;
      }
      
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setErrors(prev => ({ ...prev, [type]: 'Please upload an image file' }));
        return;
      }
      
      // Clear any previous errors
      setErrors(prev => ({ ...prev, [type]: null }));
      
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        switch(type) {
          case 'front':
            setIdFront({ file, preview: reader.result });
            break;
          case 'back':
            setIdBack({ file, preview: reader.result });
            break;
          case 'selfie':
            setSelfie({ file, preview: reader.result });
            break;
          default:
            break;
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const removeFile = (type) => {
    switch(type) {
      case 'front':
        setIdFront(null);
        if (frontInputRef.current) frontInputRef.current.value = '';
        break;
      case 'back':
        setIdBack(null);
        if (backInputRef.current) backInputRef.current.value = '';
        break;
      case 'selfie':
        setSelfie(null);
        if (selfieInputRef.current) selfieInputRef.current.value = '';
        break;
      default:
        break;
    }
    setErrors(prev => ({ ...prev, [type]: null }));
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!idFront) {
      newErrors.front = 'Please upload the front of your ID';
    }
    
    // Driver's license and state ID need back photo
    if ((idType === 'drivers_license' || idType === 'state_id') && !idBack) {
      newErrors.back = 'Please upload the back of your ID';
    }
    
    if (!selfie) {
      newErrors.selfie = 'Please upload a selfie holding your ID';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setLoading(true);
    setErrors({});
    
    try {
      const formData = new FormData();
      const token = localStorage.getItem('token');
      const userId = localStorage.getItem('userId');
      const userEmail = localStorage.getItem('userEmail') || 'unknown@user.com';
      
      // Add files
      formData.append('idFront', idFront.file);
      if (idBack) {
        formData.append('idBack', idBack.file);
      }
      formData.append('selfie', selfie.file);
      
      // Add metadata
      formData.append('idType', idType);
      formData.append('userId', userId);
      formData.append('userEmail', userEmail);
      formData.append('adminEmail', 'admin@sexyselfies.com');
      formData.append('timestamp', new Date().toISOString());
      
      // Upload verification documents
      const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://sexyselfies-api.onrender.com/api/v1';
      
      const response = await fetch(`${API_BASE_URL}/upload/verification`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });
      
      if (response.ok) {
        // Send email notification to admin
        await fetch(`${API_BASE_URL}/notifications/admin-verification`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            userId,
            userEmail,
            idType,
            adminEmail: 'admin@sexyselfies.com',
            message: 'New creator verification request pending review'
          })
        });
        
        setSubmitted(true);
        localStorage.setItem('verificationSubmitted', 'true');
      } else {
        const data = await response.json();
        setErrors({ submit: data.error || 'Failed to upload verification documents' });
      }
    } catch (error) {
      console.error('Verification submission error:', error);
      setErrors({ submit: 'Network error. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="verify-id-page">
        {/* Desktop Header */}
        {isDesktop && <MainHeader />}
        <div className="verify-container success-container">
          <div className="success-icon">✅</div>
          <h1>Verification Submitted!</h1>
          <p className="success-message">
            Thank you for submitting your verification documents. Our team will review them shortly.
          </p>
          
          <div className="timeline-card">
            <h3>What happens next?</h3>
            <div className="timeline">
              <div className="timeline-item active">
                <span className="timeline-dot"></span>
                <div className="timeline-content">
                  <strong>Documents Received</strong>
                  <p>Your verification documents have been securely uploaded</p>
                </div>
              </div>
              <div className="timeline-item">
                <span className="timeline-dot"></span>
                <div className="timeline-content">
                  <strong>Under Review</strong>
                  <p>Our team will verify your identity (usually within 5-10 minutes)</p>
                </div>
              </div>
              <div className="timeline-item">
                <span className="timeline-dot"></span>
                <div className="timeline-content">
                  <strong>Email Notification</strong>
                  <p>You'll receive an email once your account is approved</p>
                </div>
              </div>
              <div className="timeline-item">
                <span className="timeline-dot"></span>
                <div className="timeline-content">
                  <strong>Start Earning!</strong>
                  <p>Access your creator dashboard and start uploading content</p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="info-box">
            <p>📧 We'll send updates to the email address you registered with</p>
            <p>⏱️ Most verifications are completed within 10 minutes during business hours</p>
            <p>🔒 Your documents are encrypted and stored securely</p>
          </div>
          
          <button 
            className="btn-primary"
            onClick={() => window.location.href = '/'}
          >
            Return to Home
          </button>
        </div>
      {/* Desktop Footer */}
      {isDesktop && <MainFooter />}
      {/* Bottom Navigation - Mobile Only */}
      {isMobile && <BottomNavigation userRole={userRole} />}
      </div>
    );
  }

  return (
    <div className="verify-id-page">
      {/* Desktop Header */}
      {isDesktop && <MainHeader />}
      <div className="verify-container">
        <div className="verify-header">
          <h1>Verify Your Identity</h1>
          <p className="subtitle">
            For everyone's safety, we need to verify you're a real person over 18
          </p>
        </div>
        
        <div className="verify-form">
          <div className="form-section">
            <label htmlFor="idType">Document Type</label>
            <select 
              id="idType"
              value={idType} 
              onChange={(e) => setIdType(e.target.value)}
              className="select-input"
            >
              <option value="drivers_license">Driver's License</option>
              <option value="passport">Passport</option>
              <option value="state_id">State ID</option>
              <option value="national_id">National ID Card</option>
            </select>
          </div>
          
          <div className="upload-grid">
            {/* Front of ID */}
            <div className="upload-card">
              <h3>Front of ID</h3>
              <p>Upload a clear photo of the front of your {idType.replace(/_/g, ' ')}</p>
              
              {!idFront ? (
                <div 
                  className="upload-area"
                  onClick={() => frontInputRef.current?.click()}
                >
                  <input
                    ref={frontInputRef}
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileChange(e, 'front')}
                    className="file-input"
                  />
                  <div className="upload-icon">📷</div>
                  <div className="upload-text">Click to upload</div>
                  <div className="upload-hint">or drag and drop</div>
                </div>
              ) : (
                <div className="preview-area">
                  <img src={idFront.preview} alt="ID Front" className="preview-image" />
                  <button
                    type="button"
                    className="remove-btn"
                    onClick={() => removeFile('front')}
                  >
                    ×
                  </button>
                </div>
              )}
              {errors.front && <span className="error-text">{errors.front}</span>}
            </div>
            
            {/* Back of ID (conditional) */}
            {(idType === 'drivers_license' || idType === 'state_id') && (
              <div className="upload-card">
                <h3>Back of ID</h3>
                <p>Upload a clear photo of the back of your {idType.replace(/_/g, ' ')}</p>
                
                {!idBack ? (
                  <div 
                    className="upload-area"
                    onClick={() => backInputRef.current?.click()}
                  >
                    <input
                      ref={backInputRef}
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleFileChange(e, 'back')}
                      className="file-input"
                    />
                    <div className="upload-icon">📷</div>
                    <div className="upload-text">Click to upload</div>
                    <div className="upload-hint">or drag and drop</div>
                  </div>
                ) : (
                  <div className="preview-area">
                    <img src={idBack.preview} alt="ID Back" className="preview-image" />
                    <button
                      type="button"
                      className="remove-btn"
                      onClick={() => removeFile('back')}
                    >
                      ×
                    </button>
                  </div>
                )}
                {errors.back && <span className="error-text">{errors.back}</span>}
              </div>
            )}
            
            {/* Selfie with ID */}
            <div className="upload-card">
              <h3>Selfie with ID</h3>
              <p>Take a selfie holding your ID next to your face</p>
              
              {!selfie ? (
                <div 
                  className="upload-area"
                  onClick={() => selfieInputRef.current?.click()}
                >
                  <input
                    ref={selfieInputRef}
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileChange(e, 'selfie')}
                    className="file-input"
                  />
                  <div className="upload-icon">🤳</div>
                  <div className="upload-text">Click to upload</div>
                  <div className="upload-hint">or drag and drop</div>
                </div>
              ) : (
                <div className="preview-area">
                  <img src={selfie.preview} alt="Selfie" className="preview-image" />
                  <button
                    type="button"
                    className="remove-btn"
                    onClick={() => removeFile('selfie')}
                  >
                    ×
                  </button>
                </div>
              )}
              {errors.selfie && <span className="error-text">{errors.selfie}</span>}
            </div>
          </div>
          
          <div className="requirements-box">
            <h3>📋 Photo Requirements</h3>
            <div className="requirements-list">
              <div className="requirement-item">
                <span className="requirement-icon">✓</span>
                <span>Clear, unblurred photos</span>
              </div>
              <div className="requirement-item">
                <span className="requirement-icon">✓</span>
                <span>All text must be readable</span>
              </div>
              <div className="requirement-item">
                <span className="requirement-icon">✓</span>
                <span>No glare or shadows</span>
              </div>
              <div className="requirement-item">
                <span className="requirement-icon">✓</span>
                <span>Full ID visible in frame</span>
              </div>
              <div className="requirement-item">
                <span className="requirement-icon">✓</span>
                <span>Face clearly visible in selfie</span>
              </div>
              <div className="requirement-item">
                <span className="requirement-icon">✓</span>
                <span>ID held next to face in selfie</span>
              </div>
            </div>
          </div>
          
          <div className="warning-box">
            <span className="warning-icon">⚠️</span>
            <span className="warning-text">
              Your ID information is encrypted and securely stored. We only use it to verify your age and identity, and never share it with third parties.
            </span>
          </div>
          
          <div className="submit-section">
            {errors.submit && (
              <div className="submit-error">
                {errors.submit}
              </div>
            )}
            
            <button 
              className="btn-primary"
              onClick={handleSubmit}
              disabled={loading}
            >
              {loading ? 'Submitting...' : 'Submit for Verification'}
            </button>
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

export default CreatorVerifyID;