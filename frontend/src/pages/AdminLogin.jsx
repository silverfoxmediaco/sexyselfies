import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api.config';
import MainFooter from '../components/MainFooter';
import BottomNavigation from '../components/BottomNavigation';
import {
  useIsMobile,
  useIsDesktop,
  getUserRole,
} from '../utils/mobileDetection';
import './AdminLogin.css';

const AdminLogin = () => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const isDesktop = useIsDesktop();
  const userRole = getUserRole();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = e => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    setError(''); // Clear error when user types
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await api.post('/admin/auth/login', formData);

      if (response.success) {
        // Store admin token and data
        localStorage.setItem('adminToken', response.token);
        localStorage.setItem('adminData', JSON.stringify(response.admin));
        localStorage.setItem('token', response.token); // For API requests
        localStorage.setItem('userRole', 'admin');

        // Redirect to admin dashboard
        navigate('/admin');
      }
    } catch (err) {
      console.error('Admin login error:', err);
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className='admin-login-container'>
      <div className='admin-login-wrapper'>
        <div className='admin-login-card'>
          {/* Logo and Title */}
          <div className='admin-login-header'>
            <div className='admin-logo'>
              <span className='logo-text'>SexySelfies</span>
              <span className='admin-badge'>ADMIN</span>
            </div>
            <h1>Admin Portal</h1>
            <p>Authorized personnel only</p>
          </div>

          {/* Login Form */}
          <form onSubmit={handleSubmit} className='admin-login-form'>
            <div className='form-group'>
              <label htmlFor='email'>Email Address</label>
              <input
                type='email'
                id='email'
                name='email'
                value={formData.email}
                onChange={handleChange}
                placeholder='admin@sexyselfies.com'
                required
                autoComplete='username'
                className='admin-input'
              />
            </div>

            <div className='form-group'>
              <label htmlFor='password'>Password</label>
              <input
                type='password'
                id='password'
                name='password'
                value={formData.password}
                onChange={handleChange}
                placeholder='Enter your password'
                required
                autoComplete='current-password'
                className='admin-input'
              />
            </div>

            {/* Error Message */}
            {error && (
              <div className='error-message'>
                <svg
                  width='16'
                  height='16'
                  viewBox='0 0 16 16'
                  fill='currentColor'
                >
                  <path d='M8 0a8 8 0 100 16A8 8 0 008 0zm1 12H7v-2h2v2zm0-3H7V4h2v5z' />
                </svg>
                {error}
              </div>
            )}

            {/* Submit Button */}
            <button
              type='submit'
              className='admin-login-btn'
              disabled={loading}
            >
              {loading ? (
                <span className='loading-spinner'>
                  <svg className='spinner' viewBox='0 0 24 24'>
                    <circle className='spinner-circle' cx='12' cy='12' r='10' />
                  </svg>
                  Authenticating...
                </span>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          {/* Security Notice */}
          <div className='security-notice'>
            <svg width='14' height='14' viewBox='0 0 14 14' fill='currentColor'>
              <path d='M7 0L0 3v5c0 3.5 2.5 6.5 7 8 4.5-1.5 7-4.5 7-8V3L7 0zm0 7L4 4h6L7 7z' />
            </svg>
            <span>This is a secure area. All activities are logged.</span>
          </div>

          {/* Back to Main Site */}
          <div className='back-link'>
            <a href='/' className='back-to-site'>
              ← Back to main site
            </a>
          </div>
        </div>

        {/* Background decoration */}
        <div className='admin-login-bg'>
          <div className='bg-gradient-1'></div>
          <div className='bg-gradient-2'></div>
        </div>
      </div>

      {/* Desktop Footer */}
      {isDesktop && <MainFooter />}

      {/* Bottom Navigation - Mobile Only */}
      {isMobile && <BottomNavigation userRole={userRole} />}
    </div>
  );
};

export default AdminLogin;
