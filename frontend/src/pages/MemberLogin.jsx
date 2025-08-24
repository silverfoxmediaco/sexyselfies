import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Mail, Lock, Eye, EyeOff, LogIn, AlertCircle,
  Heart, Shield, Star, Users, Sparkles, 
  Facebook, Twitter, Instagram, ChevronRight,
  Check, Gift, ArrowLeft
} from 'lucide-react';
import './MemberLogin.css';

const MemberLogin = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false
  });
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetSent, setResetSent] = useState(false);

  // Get redirect path from state or default to discover
  const from = location.state?.from?.pathname || '/member/discover';

  useEffect(() => {
    // Check if user is already logged in
    const token = localStorage.getItem('token');
    const userRole = localStorage.getItem('userRole');
    if (token && userRole === 'member') {
      navigate(from, { replace: true });
    }

    // Load remembered email
    const rememberedEmail = localStorage.getItem('rememberedEmail');
    if (rememberedEmail) {
      setFormData(prev => ({ ...prev, email: rememberedEmail, rememberMe: true }));
    }
  }, [navigate, from]);

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email';
    }
    
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
    setLoginError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsLoading(true);
    setLoginError('');
    
    try {
      // Use the correct backend URL (no v1 in path)
      const API_URL = 'http://localhost:5002'; // Your backend port
      const response = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          role: 'member'
        }),
      });
      
      const data = await response.json();
      
      if (response.ok) {
        // Store auth data
        localStorage.setItem('token', data.token);
        localStorage.setItem('userRole', 'member');
        localStorage.setItem('userId', data.user.id);
        
        // Handle remember me
        if (formData.rememberMe) {
          localStorage.setItem('rememberedEmail', formData.email);
        } else {
          localStorage.removeItem('rememberedEmail');
        }
        
        // Navigate to intended page or discover
        navigate(from, { replace: true });
      } else {
        // Handle specific error cases
        if (response.status === 401) {
          setLoginError('Invalid email or password');
        } else if (response.status === 423) {
          setLoginError('Account locked. Please contact support.');
        } else {
          setLoginError(data.message || 'Login failed. Please try again.');
        }
      }
    } catch (error) {
      console.error('Login error:', error);
      setLoginError('Network error. Please check your connection.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    
    if (!resetEmail || !/\S+@\S+\.\S+/.test(resetEmail)) {
      setErrors({ resetEmail: 'Please enter a valid email' });
      return;
    }
    
    setIsLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      setResetSent(true);
      setIsLoading(false);
    }, 1500);
  };

  const handleDemoLogin = () => {
    setFormData({
      email: 'demo@sexyselfies.com',
      password: 'demo123',
      rememberMe: false
    });
    setTimeout(() => {
      handleSubmit({ preventDefault: () => {} });
    }, 100);
  };

  const features = [
    { icon: Heart, text: 'Unlimited Matches', subtext: 'Connect with creators you love' },
    { icon: Shield, text: 'Verified Profiles', subtext: 'All creators are ID verified' },
    { icon: Lock, text: 'Exclusive Content', subtext: 'Access members-only content' },
    { icon: Sparkles, text: 'Direct Messaging', subtext: 'Chat directly with creators' }
  ];

  const stats = [
    { label: 'Active Creators', value: '10K+' },
    { label: 'Daily Matches', value: '50K+' },
    { label: 'Content Created', value: '1M+' },
    { label: 'Member Rating', value: '4.9★' }
  ];

  return (
    <div className="memberlogin-container">
      <div className="memberlogin-content">
        {/* Login Form Section - Full width on mobile */}
        <div className="memberlogin-form-section">
          <div className="memberlogin-form-wrapper">
            {/* Welcome Header */}
            <div className="memberlogin-header">
              <div className="memberlogin-logo">
                <Sparkles />
                <h1>Welcome Back</h1>
              </div>
              <p className="memberlogin-subtitle">Sign in to discover amazing creators</p>
            </div>

            {/* Main Form or Forgot Password */}
            <AnimatePresence mode="wait">
              {!showForgotPassword ? (
                <motion.div
                  key="login"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.3 }}
                >
                  {/* Login Form */}
                  <form onSubmit={handleSubmit} className="memberlogin-form">
                    {loginError && (
                      <div className="memberlogin-error-box">
                        <AlertCircle size={18} />
                        <span>{loginError}</span>
                      </div>
                    )}
                    
                    <div className="memberlogin-form-group">
                      <label className="memberlogin-label">
                        <Mail size={18} />
                        <span>Email Address</span>
                      </label>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        placeholder="Enter your email"
                        className={`memberlogin-input ${errors.email ? 'error' : ''}`}
                        disabled={isLoading}
                      />
                      {errors.email && (
                        <span className="memberlogin-error-text">{errors.email}</span>
                      )}
                    </div>
                    
                    <div className="memberlogin-form-group">
                      <label className="memberlogin-label">
                        <Lock size={18} />
                        <span>Password</span>
                      </label>
                      <div className="memberlogin-input-wrapper">
                        <input
                          type={showPassword ? 'text' : 'password'}
                          name="password"
                          value={formData.password}
                          onChange={handleChange}
                          placeholder="Enter your password"
                          className={`memberlogin-input ${errors.password ? 'error' : ''}`}
                          disabled={isLoading}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="memberlogin-input-toggle"
                          tabIndex={-1}
                        >
                          {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                      </div>
                      {errors.password && (
                        <span className="memberlogin-error-text">{errors.password}</span>
                      )}
                    </div>
                    
                    <div className="memberlogin-form-options">
                      <label className="memberlogin-checkbox">
                        <input
                          type="checkbox"
                          name="rememberMe"
                          checked={formData.rememberMe}
                          onChange={handleChange}
                        />
                        <div className="checkbox-custom"></div>
                        <span>Remember me</span>
                      </label>
                      
                      <button
                        type="button"
                        onClick={() => setShowForgotPassword(true)}
                        className="memberlogin-forgot-link"
                      >
                        Forgot password?
                      </button>
                    </div>
                    
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="memberlogin-btn-primary"
                    >
                      {isLoading ? (
                        <div className="memberlogin-spinner"></div>
                      ) : (
                        <>
                          <LogIn size={18} />
                          <span>Sign In</span>
                        </>
                      )}
                    </button>
                    
                    <button
                      type="button"
                      onClick={handleDemoLogin}
                      className="memberlogin-demo-btn"
                    >
                      <Sparkles size={18} />
                      <span>Use Demo Account</span>
                    </button>
                  </form>
                  
                  {/* Social Login */}
                  <div className="memberlogin-divider">
                    <span>OR CONTINUE WITH</span>
                  </div>
                  
                  <div className="memberlogin-social-options">
                    <button className="memberlogin-social-btn facebook">
                      <Facebook size={20} />
                      <span>Facebook</span>
                    </button>
                    <button className="memberlogin-social-btn twitter">
                      <Twitter size={20} />
                      <span>Twitter</span>
                    </button>
                    <button className="memberlogin-social-btn instagram">
                      <Instagram size={20} />
                      <span>Instagram</span>
                    </button>
                  </div>
                  
                  {/* Sign Up Link */}
                  <div className="memberlogin-signup-link">
                    <p>
                      Don't have an account?{' '}
                      <Link to="/member/register" className="memberlogin-link">
                        Join Free <ChevronRight size={16} />
                      </Link>
                    </p>
                  </div>
                </motion.div>
              ) : (
                /* Forgot Password Form */
                <motion.div
                  key="forgot"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  {!resetSent ? (
                    <form onSubmit={handleForgotPassword} className="memberlogin-form">
                      <button
                        type="button"
                        onClick={() => setShowForgotPassword(false)}
                        className="memberlogin-btn-secondary"
                      >
                        <ArrowLeft size={18} />
                        <span>Back to login</span>
                      </button>
                      
                      <div>
                        <h2 className="memberlogin-reset-title">Reset Password</h2>
                        <p className="memberlogin-reset-text">Enter your email and we'll send you a reset link</p>
                      </div>
                      
                      <div className="memberlogin-form-group">
                        <label className="memberlogin-label">
                          <Mail size={18} />
                          <span>Email Address</span>
                        </label>
                        <input
                          type="email"
                          value={resetEmail}
                          onChange={(e) => setResetEmail(e.target.value)}
                          placeholder="Enter your email"
                          className={`memberlogin-input ${errors.resetEmail ? 'error' : ''}`}
                          disabled={isLoading}
                        />
                        {errors.resetEmail && (
                          <span className="memberlogin-error-text">{errors.resetEmail}</span>
                        )}
                      </div>
                      
                      <button
                        type="submit"
                        disabled={isLoading}
                        className="memberlogin-btn-primary"
                      >
                        {isLoading ? (
                          <div className="memberlogin-spinner"></div>
                        ) : (
                          <>
                            <Mail size={18} />
                            <span>Send Reset Link</span>
                          </>
                        )}
                      </button>
                    </form>
                  ) : (
                    <div className="memberlogin-reset-success">
                      <Check size={32} />
                      <h3>Check Your Email</h3>
                      <p>We've sent a password reset link to:</p>
                      <p>{resetEmail}</p>
                      <button
                        onClick={() => {
                          setShowForgotPassword(false);
                          setResetSent(false);
                          setResetEmail('');
                        }}
                        className="memberlogin-btn-primary"
                      >
                        Back to Login
                      </button>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Features Section - Hidden on mobile, visible on tablet/desktop */}
        <div className="memberlogin-features-section">
          <div className="memberlogin-features-container">
            <h2 className="memberlogin-features-title">Discover Your Perfect Match</h2>
            <p className="memberlogin-features-subtitle">
              Join thousands of members connecting with amazing creators every day
            </p>
            
            {/* Stats Grid */}
            <div className="memberlogin-stats-grid">
              {stats.map((stat, index) => (
                <div key={index} className="memberlogin-stat-card">
                  <div className="memberlogin-stat-value">{stat.value}</div>
                  <div className="memberlogin-stat-label">{stat.label}</div>
                </div>
              ))}
            </div>
            
            {/* Features List */}
            <div className="memberlogin-features-list">
              {features.map((feature, index) => {
                const Icon = feature.icon;
                return (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="memberlogin-feature-item"
                  >
                    <div className="memberlogin-feature-icon">
                      <Icon size={24} />
                    </div>
                    <div className="memberlogin-feature-content">
                      <h3>{feature.text}</h3>
                      <p>{feature.subtext}</p>
                    </div>
                  </motion.div>
                );
              })}
            </div>
            
            {/* Trust Badges */}
            <div className="memberlogin-trust-badges">
              <div className="memberlogin-badge">
                <Shield size={16} />
                <span>SSL Secured</span>
              </div>
              <div className="memberlogin-badge">
                <Lock size={16} />
                <span>Privacy Protected</span>
              </div>
              <div className="memberlogin-badge">
                <Star size={16} />
                <span>Trusted Platform</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MemberLogin;