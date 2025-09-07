import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Shield, CheckCircle, XCircle, Clock, Upload, Camera, 
  AlertCircle, FileText, User, Eye, ArrowLeft
} from 'lucide-react';
import CreatorMainHeader from '../components/CreatorMainHeader';
import CreatorMainFooter from '../components/CreatorMainFooter';
import BottomNavigation from '../components/BottomNavigation';
import { useIsMobile, useIsDesktop, getUserRole } from '../utils/mobileDetection';
import api from '../services/api.config';
import './CreatorVerificationStatus.css';

const CreatorVerificationStatus = () => {
  const isMobile = useIsMobile();
  const isDesktop = useIsDesktop();
  const userRole = getUserRole();
  const navigate = useNavigate();
  
  const [verificationStatus, setVerificationStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  
  // Document upload states
  const [idFront, setIdFront] = useState(null);
  const [idBack, setIdBack] = useState(null);
  const [selfie, setSelfie] = useState(null);
  const [idType, setIdType] = useState('drivers_license');
  
  // File input refs
  const idFrontRef = useRef(null);
  const idBackRef = useRef(null);
  const selfieRef = useRef(null);

  useEffect(() => {
    fetchVerificationStatus();
  }, []);

  const fetchVerificationStatus = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get('/verification/status');
      setVerificationStatus(response.data);
    } catch (error) {
      console.error('Error fetching verification status:', error);
      setError('Failed to load verification status');
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (file, type) => {
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        switch(type) {
          case 'idFront':
            setIdFront({ file, preview: e.target.result });
            break;
          case 'idBack':
            setIdBack({ file, preview: e.target.result });
            break;
          case 'selfie':
            setSelfie({ file, preview: e.target.result });
            break;
        }
      };
      reader.readAsDataURL(file);
    } else {
      setError('Please select a valid image file');
    }
  };

  const handleSubmitVerification = async () => {
    if (!idFront || !idBack || !selfie) {
      setError('Please upload all required documents');
      return;
    }

    try {
      setUploading(true);
      setError(null);
      setSuccess(null);

      const formData = new FormData();
      formData.append('idFront', idFront.file);
      formData.append('idBack', idBack.file);
      formData.append('selfie', selfie.file);
      formData.append('idType', idType);

      await api.post('/verification/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      setSuccess('Verification documents uploaded successfully! Your account will be reviewed within 24-48 hours.');
      
      // Refresh status
      await fetchVerificationStatus();
      
      // Clear uploaded files
      setIdFront(null);
      setIdBack(null);
      setSelfie(null);
      
    } catch (error) {
      console.error('Error uploading verification:', error);
      setError(error.response?.data?.error || 'Failed to upload verification documents');
    } finally {
      setUploading(false);
    }
  };

  const getStatusIcon = (status) => {
    switch(status) {
      case 'verified':
        return <CheckCircle size={24} className="status-icon verified" />;
      case 'pending':
        return <Clock size={24} className="status-icon pending" />;
      case 'rejected':
        return <XCircle size={24} className="status-icon rejected" />;
      default:
        return <Shield size={24} className="status-icon unverified" />;
    }
  };

  const getStatusText = (status) => {
    switch(status) {
      case 'verified':
        return 'Verified';
      case 'pending':
        return 'Under Review';
      case 'rejected':
        return 'Rejected';
      default:
        return 'Not Verified';
    }
  };

  const getStatusMessage = (status) => {
    switch(status) {
      case 'verified':
        return 'Your account has been successfully verified. You now have full access to all creator features.';
      case 'pending':
        return 'Your verification documents are currently under review. This process typically takes 24-48 hours.';
      case 'rejected':
        return 'Your verification was rejected. Please review the feedback and submit new documents.';
      default:
        return 'Complete verification to unlock all creator features and build trust with your audience.';
    }
  };

  if (loading) {
    return (
      <div className="CreatorVerificationStatus-container">
        {isDesktop && <CreatorMainHeader />}
        <div className="verification-loading">
          <div className="loading-spinner"></div>
          <p>Loading verification status...</p>
        </div>
        {isDesktop && <CreatorMainFooter />}
        {isMobile && <BottomNavigation userRole={userRole} />}
      </div>
    );
  }

  return (
    <div className="CreatorVerificationStatus-container">
      {isDesktop && <CreatorMainHeader />}
      
      <div className={`verification-content ${isMobile ? 'mobile' : 'desktop'}`}>
        {/* Header */}
        <div className="verification-header">
          <button className="verification-back-btn" onClick={() => navigate(-1)}>
            <ArrowLeft size={20} />
            <span>Back</span>
          </button>
          <div className="verification-title">
            <Shield size={28} />
            <h1>Account Verification</h1>
          </div>
        </div>

        {/* Status Card */}
        <div className="verification-status-card">
          <div className="status-header">
            {getStatusIcon(verificationStatus?.status)}
            <div className="status-info">
              <h2>{getStatusText(verificationStatus?.status)}</h2>
              <p>{getStatusMessage(verificationStatus?.status)}</p>
            </div>
          </div>
          
          {verificationStatus?.rejectionReason && (
            <div className="rejection-reason">
              <AlertCircle size={16} />
              <p><strong>Rejection Reason:</strong> {verificationStatus.rejectionReason}</p>
            </div>
          )}
          
          {verificationStatus?.submittedAt && (
            <div className="submission-date">
              <p>Submitted: {new Date(verificationStatus.submittedAt).toLocaleDateString()}</p>
            </div>
          )}
        </div>

        {/* Upload Section - Only show if not verified or if rejected */}
        {(!verificationStatus?.status || verificationStatus?.status === 'rejected') && (
          <div className="verification-upload-section">
            <h3>Submit Verification Documents</h3>
            <p className="upload-instructions">
              Upload clear, high-quality photos of your government-issued ID and a selfie for verification.
            </p>

            {/* ID Type Selection */}
            <div className="verification-form-group">
              <label className="verification-label">ID Type</label>
              <select 
                value={idType} 
                onChange={(e) => setIdType(e.target.value)}
                className="verification-select"
              >
                <option value="drivers_license">Driver's License</option>
                <option value="passport">Passport</option>
                <option value="national_id">National ID Card</option>
                <option value="state_id">State ID Card</option>
              </select>
            </div>

            {/* Document Upload Boxes */}
            <div className="document-upload-grid">
              {/* ID Front */}
              <div className="document-upload-box">
                <input
                  type="file"
                  ref={idFrontRef}
                  onChange={(e) => handleFileSelect(e.target.files[0], 'idFront')}
                  accept="image/*"
                  style={{ display: 'none' }}
                />
                <button 
                  className="document-upload-btn"
                  onClick={() => idFrontRef.current?.click()}
                >
                  {idFront ? (
                    <img src={idFront.preview} alt="ID Front" className="document-preview" />
                  ) : (
                    <div className="upload-placeholder">
                      <FileText size={32} />
                      <p>ID Front</p>
                      <span>Click to upload</span>
                    </div>
                  )}
                </button>
              </div>

              {/* ID Back */}
              <div className="document-upload-box">
                <input
                  type="file"
                  ref={idBackRef}
                  onChange={(e) => handleFileSelect(e.target.files[0], 'idBack')}
                  accept="image/*"
                  style={{ display: 'none' }}
                />
                <button 
                  className="document-upload-btn"
                  onClick={() => idBackRef.current?.click()}
                >
                  {idBack ? (
                    <img src={idBack.preview} alt="ID Back" className="document-preview" />
                  ) : (
                    <div className="upload-placeholder">
                      <FileText size={32} />
                      <p>ID Back</p>
                      <span>Click to upload</span>
                    </div>
                  )}
                </button>
              </div>

              {/* Selfie */}
              <div className="document-upload-box">
                <input
                  type="file"
                  ref={selfieRef}
                  onChange={(e) => handleFileSelect(e.target.files[0], 'selfie')}
                  accept="image/*"
                  style={{ display: 'none' }}
                />
                <button 
                  className="document-upload-btn"
                  onClick={() => selfieRef.current?.click()}
                >
                  {selfie ? (
                    <img src={selfie.preview} alt="Selfie" className="document-preview" />
                  ) : (
                    <div className="upload-placeholder">
                      <User size={32} />
                      <p>Selfie</p>
                      <span>Click to upload</span>
                    </div>
                  )}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button 
              className="verification-submit-btn"
              onClick={handleSubmitVerification}
              disabled={uploading || !idFront || !idBack || !selfie}
            >
              {uploading ? (
                <>
                  <div className="btn-spinner"></div>
                  <span>Uploading...</span>
                </>
              ) : (
                <>
                  <Upload size={20} />
                  <span>Submit for Verification</span>
                </>
              )}
            </button>
          </div>
        )}

        {/* Requirements Section */}
        <div className="verification-requirements">
          <h3>Verification Requirements</h3>
          <ul className="requirements-list">
            <li>
              <CheckCircle size={16} />
              <span>Government-issued photo ID (Driver's License, Passport, etc.)</span>
            </li>
            <li>
              <CheckCircle size={16} />
              <span>Clear, well-lit photos with all text readable</span>
            </li>
            <li>
              <CheckCircle size={16} />
              <span>Selfie clearly showing your face</span>
            </li>
            <li>
              <CheckCircle size={16} />
              <span>You must be 18+ years old</span>
            </li>
            <li>
              <CheckCircle size={16} />
              <span>Documents must be current and not expired</span>
            </li>
          </ul>
        </div>

        {/* Error/Success Messages */}
        {error && (
          <div className="verification-message error">
            <XCircle size={16} />
            <p>{error}</p>
          </div>
        )}
        
        {success && (
          <div className="verification-message success">
            <CheckCircle size={16} />
            <p>{success}</p>
          </div>
        )}
      </div>

      {isDesktop && <CreatorMainFooter />}
      {isMobile && <BottomNavigation userRole={userRole} />}
    </div>
  );
};

export default CreatorVerificationStatus;