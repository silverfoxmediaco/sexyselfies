import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Camera, Upload, Edit, Trash2, Save, AlertCircle } from 'lucide-react';
import './EditProfileImagesModal.css';

const EditProfileImagesModal = ({
  isOpen,
  onClose,
  currentProfileImage,
  currentCoverImage,
  creatorId,
  onImagesUpdated
}) => {
  const [profilePhoto, setProfilePhoto] = useState(null);
  const [profilePhotoPreview, setProfilePhotoPreview] = useState(currentProfileImage);
  const [coverImage, setCoverImage] = useState(null);
  const [coverImagePreview, setCoverImagePreview] = useState(currentCoverImage);
  const [isUploading, setIsUploading] = useState(false);
  const [errors, setErrors] = useState({});

  const profileInputRef = useRef(null);
  const coverInputRef = useRef(null);

  const handlePhotoChange = (e, type) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setErrors(prev => ({
        ...prev,
        [type]: 'Please select an image file'
      }));
      return;
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      setErrors(prev => ({
        ...prev,
        [type]: 'File size must be less than 5MB'
      }));
      return;
    }

    // Clear any previous errors
    setErrors(prev => ({
      ...prev,
      [type]: null
    }));

    const reader = new FileReader();
    reader.onloadend = () => {
      if (type === 'profile') {
        setProfilePhoto(file);
        setProfilePhotoPreview(reader.result);
      } else {
        setCoverImage(file);
        setCoverImagePreview(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handlePhotoDelete = (type) => {
    if (type === 'profile') {
      setProfilePhoto(null);
      setProfilePhotoPreview(null);
    } else {
      setCoverImage(null);
      setCoverImagePreview(null);
    }
  };

  const handleSave = async () => {
    setIsUploading(true);
    setErrors({});

    try {
      const formData = new FormData();

      if (profilePhoto) {
        formData.append('profilePhoto', profilePhoto);
      }

      if (coverImage) {
        formData.append('coverImage', coverImage);
      }

      // If no images selected, just close
      if (!profilePhoto && !coverImage) {
        onClose();
        return;
      }

      const response = await fetch('/api/v1/creator/profile/images', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formData
      });

      if (response.ok) {
        let data = {};

        // Check if response has content before parsing JSON
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const text = await response.text();
          if (text) {
            data = JSON.parse(text);
          }
        }

        // Call the callback to refresh parent component
        if (onImagesUpdated) {
          onImagesUpdated({
            profileImage: data.data?.profileImage || profilePhotoPreview,
            coverImage: data.data?.coverImage || coverImagePreview
          });
        }

        onClose();
      } else {
        let errorMessage = 'Failed to update images';

        try {
          const contentType = response.headers.get('content-type');
          if (contentType && contentType.includes('application/json')) {
            const errorData = await response.json();
            errorMessage = errorData.message || errorMessage;
          }
        } catch (jsonError) {
          console.error('Error parsing error response:', jsonError);
        }

        setErrors({ general: errorMessage });
      }
    } catch (error) {
      console.error('Error uploading images:', error);
      setErrors({ general: 'Failed to upload images. Please try again.' });
    } finally {
      setIsUploading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="EditProfileImagesModal-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div
          className="EditProfileImagesModal-container"
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="EditProfileImagesModal-header">
            <h2>Edit Profile Images</h2>
            <button
              className="EditProfileImagesModal-close"
              onClick={onClose}
              disabled={isUploading}
            >
              <X size={24} />
            </button>
          </div>

          <div className="EditProfileImagesModal-content">
            {errors.general && (
              <div className="EditProfileImagesModal-error">
                <AlertCircle size={16} />
                <span>{errors.general}</span>
              </div>
            )}

            <div className="EditProfileImagesModal-photos">
              {/* Profile Photo */}
              <div className="EditProfileImagesModal-photo-section">
                <h3>Profile Photo</h3>
                <div className="EditProfileImagesModal-photo-container">
                  <input
                    ref={profileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={(e) => handlePhotoChange(e, 'profile')}
                    style={{ display: 'none' }}
                  />

                  <div
                    className={`EditProfileImagesModal-photo-box ${profilePhotoPreview ? 'has-image' : ''}`}
                    onClick={() => profileInputRef.current?.click()}
                  >
                    {profilePhotoPreview ? (
                      <div className="EditProfileImagesModal-photo-preview">
                        <img src={profilePhotoPreview} alt="Profile" />
                        <div className="EditProfileImagesModal-photo-overlay">
                          <div className="EditProfileImagesModal-photo-actions">
                            <button
                              type="button"
                              className="EditProfileImagesModal-action-btn change"
                              onClick={(e) => {
                                e.stopPropagation();
                                profileInputRef.current?.click();
                              }}
                            >
                              <Edit size={16} />
                              <span>Change</span>
                            </button>
                            <button
                              type="button"
                              className="EditProfileImagesModal-action-btn delete"
                              onClick={(e) => {
                                e.stopPropagation();
                                handlePhotoDelete('profile');
                              }}
                            >
                              <Trash2 size={16} />
                              <span>Delete</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="EditProfileImagesModal-upload-prompt">
                        <Camera size={32} />
                        <span className="EditProfileImagesModal-upload-title">Profile Photo</span>
                        <span className="EditProfileImagesModal-upload-hint">Click to upload</span>
                      </div>
                    )}
                  </div>

                  {errors.profile && (
                    <span className="EditProfileImagesModal-field-error">{errors.profile}</span>
                  )}

                  <div className="EditProfileImagesModal-tips">
                    <span>✔ Clear face photo</span>
                    <span>✔ Good lighting</span>
                    <span>✔ Min 400x400px</span>
                  </div>
                </div>
              </div>

              {/* Cover Image */}
              <div className="EditProfileImagesModal-photo-section">
                <h3>Cover Image (Optional)</h3>
                <div className="EditProfileImagesModal-photo-container">
                  <input
                    ref={coverInputRef}
                    type="file"
                    accept="image/*"
                    onChange={(e) => handlePhotoChange(e, 'cover')}
                    style={{ display: 'none' }}
                  />

                  <div
                    className={`EditProfileImagesModal-photo-box cover ${coverImagePreview ? 'has-image' : ''}`}
                    onClick={() => coverInputRef.current?.click()}
                  >
                    {coverImagePreview ? (
                      <div className="EditProfileImagesModal-photo-preview">
                        <img src={coverImagePreview} alt="Cover" />
                        <div className="EditProfileImagesModal-photo-overlay">
                          <div className="EditProfileImagesModal-photo-actions">
                            <button
                              type="button"
                              className="EditProfileImagesModal-action-btn change"
                              onClick={(e) => {
                                e.stopPropagation();
                                coverInputRef.current?.click();
                              }}
                            >
                              <Edit size={16} />
                              <span>Change</span>
                            </button>
                            <button
                              type="button"
                              className="EditProfileImagesModal-action-btn delete"
                              onClick={(e) => {
                                e.stopPropagation();
                                handlePhotoDelete('cover');
                              }}
                            >
                              <Trash2 size={16} />
                              <span>Delete</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="EditProfileImagesModal-upload-prompt">
                        <Upload size={32} />
                        <span className="EditProfileImagesModal-upload-title">Cover Image</span>
                        <span className="EditProfileImagesModal-upload-hint">Showcase your style</span>
                      </div>
                    )}
                  </div>

                  {errors.cover && (
                    <span className="EditProfileImagesModal-field-error">{errors.cover}</span>
                  )}

                  <div className="EditProfileImagesModal-tips">
                    <span>✔ 1920x480px ideal</span>
                    <span>✔ Represents your brand</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="EditProfileImagesModal-footer">
            <button
              className="EditProfileImagesModal-btn cancel"
              onClick={onClose}
              disabled={isUploading}
            >
              Cancel
            </button>
            <button
              className="EditProfileImagesModal-btn save"
              onClick={handleSave}
              disabled={isUploading}
            >
              {isUploading ? (
                <>
                  <div className="EditProfileImagesModal-spinner"></div>
                  <span>Uploading...</span>
                </>
              ) : (
                <>
                  <Save size={16} />
                  <span>Save Changes</span>
                </>
              )}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default EditProfileImagesModal;