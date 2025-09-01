import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import axios from 'axios';
import { 
  Mail, Lock, Eye, EyeOff, LogIn, 
  ArrowRight, Sparkles, Heart, DollarSign 
} from 'lucide-react';
import MainHeader from '../components/MainHeader';
import MainFooter from '../components/MainFooter';
import BottomNavigation from '../components/BottomNavigation';
import { useIsMobile, useIsDesktop, getUserRole } from '../utils/mobileDetection';
import './CreatorLogin.css';

const CreatorLogin = () => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const isDesktop = useIsDesktop();
  const userRole = getUserRole();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }
    
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsLoading(true);
    
    try {
      const response = await axios.post('/api/v1/auth/creator/login', formData);
      
      if (response.data.success) {
        // Store token and user info
        localStorage.setItem('creatorToken', response.data.token);
        localStorage.setItem('token', response.data.token); // Keep both for compatibility
        localStorage.setItem('userRole', 'creator');
        localStorage.setItem('userId', response.data.user.id);
        localStorage.setItem('userEmail', response.data.user.email);
        localStorage.setItem('creatorId', response.data.creatorId);
        
        // Store creator data for header display
        const creatorData = {
          id: response.data.creatorId,
          email: response.data.user.email,
          role: response.data.user.role,
          isVerified: response.data.isVerified,
          profileComplete: response.data.profileComplete
        };
        localStorage.setItem('creatorData', JSON.stringify(creatorData));
        
        // Try to get displayName from various sources
        const displayName = response.data.user.displayName || 
                          response.data.displayName || 
                          response.data.user.email.split('@')[0];
        localStorage.setItem('creatorName', displayName);
        localStorage.setItem('userDisplayName', displayName);
        
        // Check verification and profile status
        if (!response.data.isVerified) {
          // Creator needs to verify ID or wait for approval
          navigate('/creator/verify-id');
        } else if (response.data.profileComplete === false) {
          // Creator needs to complete profile setup
          navigate('/creator/profile-setup');
        } else {
          // Everything complete, go to dashboard
          navigate('/creator/dashboard');
        }
      }
    } catch (error) {
      console.error('Login error:', error);
      setErrors({
        general: error.response?.data?.message || 'Invalid email or password'
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="creator-login-page">
      {/* Desktop Header */}
      {isDesktop && <MainHeader />}
      {/* Background Animation */}
      <div className="creator-login-bg">
        <div className="creator-login-bg-gradient-1"></div>
        <div className="creator-login-bg-gradient-2"></div>
        <div className="creator-login-bg-gradient-3"></div>
      </div>

      {/* Main Container */}
      <div className="creator-login-container">
        {/* Left Side - Login Form */}
        <motion.div 
          className="creator-login-form-section"
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="creator-login-header">
            <h1 className="creator-login-title">
              Welcome Back Creator! 
              <Sparkles className="creator-login-sparkle-icon" size={24} />
            </h1>
            <p className="creator-login-subtitle">
              Login to access your dashboard and manage your content
            </p>
          </div>

          {errors.general && (
            <motion.div 
              className="creator-login-error-alert"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              {errors.general}
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="creator-login-form">
            <div className="creator-login-form-group">
              <label className="creator-login-form-label">
                <Mail size={16} />
                Email Address
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className={`creator-login-form-input ${errors.email ? 'creator-login-error' : ''}`}
                placeholder="Enter your email"
                autoComplete="email"
              />
              {errors.email && (
                <span className="creator-login-error-message">{errors.email}</span>
              )}
            </div>

            <div className="creator-login-form-group">
              <label className="creator-login-form-label">
                <Lock size={16} />
                Password
              </label>
              <div className="creator-login-password-input-wrapper">
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className={`creator-login-form-input ${errors.password ? 'creator-login-error' : ''}`}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  className="creator-login-password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {errors.password && (
                <span className="creator-login-error-message">{errors.password}</span>
              )}
            </div>

            <div className="creator-login-form-options">
              <label className="creator-login-remember-me">
                <input type="checkbox" />
                <span>Remember me</span>
              </label>
              <Link to="/creator/forgot-password" className="creator-login-forgot-link">
                Forgot password?
              </Link>
            </div>

            <motion.button
              type="submit"
              className="creator-login-btn"
              disabled={isLoading}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {isLoading ? (
                <span className="creator-login-loading-spinner"></span>
              ) : (
                <>
                  <LogIn size={18} />
                  <span>Login to Dashboard</span>
                </>
              )}
            </motion.button>
          </form>

          <div className="creator-login-footer">
            <p>
              Don't have an account?{' '}
              <Link to="/creator/register" className="creator-login-register-link">
                Sign up as Creator
                <ArrowRight size={14} />
              </Link>
            </p>
          </div>
        </motion.div>

        {/* Right Side - Features */}
        <motion.div 
          className="creator-login-features-section"
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <div className="creator-login-features-content">
            <h2>Start Earning Today!</h2>
            <p>Join thousands of creators making money with their content</p>
            
            <div className="feature-list">
              <div className="feature-item">
                <div className="feature-icon green">
                  <DollarSign size={20} />
                </div>
                <div className="feature-text">
                  <h3>80% Revenue Share</h3>
                  <p>Keep more of what you earn</p>
                </div>
              </div>
              
              <div className="feature-item">
                <div className="feature-icon pink">
                  <Heart size={20} />
                </div>
                <div className="feature-text">
                  <h3>Instant Connections</h3>
                  <p>Connect with eager fans instantly</p>
                </div>
              </div>
              
              <div className="feature-item">
                <div className="feature-icon blue">
                  <Sparkles size={20} />
                </div>
                <div className="feature-text">
                  <h3>AI-Powered Insights</h3>
                  <p>Optimize your content with AI</p>
                </div>
              </div>
            </div>

            <div className="stats-preview">
              <div className="stat-card">
                <span className="stat-value">$2.5M+</span>
                <span className="stat-label">Paid to creators</span>
              </div>
              <div className="stat-card">
                <span className="stat-value">50K+</span>
                <span className="stat-label">Active creators</span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Desktop Footer */}
      {isDesktop && <MainFooter />}
      
      {/* Bottom Navigation - Mobile Only */}
      {isMobile && <BottomNavigation userRole={userRole} />}
    </div>
  );
};

export default CreatorLogin;