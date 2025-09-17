import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import {
  Menu,
  X,
  LogOut,
  Home,
  Camera,
  DollarSign,
  TrendingUp,
  Settings,
  User,
  Bell,
  MessageCircle,
  Users,
  Grid3x3,
  CreditCard,
  BarChart3,
  Zap,
  Shield,
  Heart,
} from 'lucide-react';
import authService from '../services/auth.service';
import './CreatorMainHeader.css';
import logo from '../assets/sexysselfies_logo.png';

const CreatorMainHeader = () => {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // Get user info from localStorage
  const userRole = localStorage.getItem('userRole');
  const token = localStorage.getItem('token');
  const isLoggedIn = !!token;
  const creatorName = localStorage.getItem('displayName') || 'Creator';

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    // Close menu on route change
    setMenuOpen(false);
  }, [location]);

  const handleLogout = async () => {
    try {
      await authService.logout();
      navigate('/creator/login');
    } catch (error) {
      console.error('Logout error:', error);
      // Force logout even if API call fails
      localStorage.clear();
      navigate('/creator/login');
    }
  };

  const creatorNavItems = [
    { label: 'Dashboard', path: '/creator/dashboard', icon: Home },
    { label: 'Upload Content', path: '/creator/upload', icon: Camera },
    { label: 'My Content', path: '/creator/content', icon: Grid3x3 },
    { label: 'Analytics', path: '/creator/analytics', icon: BarChart3 },
    { label: 'Earnings', path: '/creator/earnings', icon: DollarSign },
    { label: 'Messages', path: '/creator/messages', icon: MessageCircle },
    { label: 'Connections', path: '/creator/connections', icon: Users },
    { label: 'Browse Members', path: '/creator/browse-members', icon: Heart },
  ];

  const profileNavItems = [
    { label: 'My Profile', path: '/creator/profile', icon: User },
    { label: 'Settings', path: '/creator/settings', icon: Settings },
    { label: 'Verification', path: '/creator/verification', icon: Shield },
    { label: 'Payments', path: '/creator/payments', icon: CreditCard },
  ];

  const isActivePath = path => {
    return (
      location.pathname === path || location.pathname.startsWith(path + '/')
    );
  };

  return (
    <>
      {/* Top Navigation Bar */}
      <header className={`creator-main-header ${scrolled ? 'scrolled' : ''}`}>
        <div className='creator-header-container'>
          {/* Logo */}
          <div className='creator-header-logo'>
            <Link to='/creator/dashboard'>
              <img src={logo} alt='SexySelfies' />
            </Link>
          </div>

          {/* Right Side Actions */}
          <div className='creator-header-actions'>
            {/* Notifications */}
            <button className='creator-notification-btn'>
              <Bell size={20} />
              <span className='creator-notification-badge'>3</span>
            </button>

            {/* Hamburger Menu Button */}
            <button
              className='creator-hamburger-menu'
              onClick={() => setMenuOpen(!menuOpen)}
              aria-label='Toggle menu'
            >
              {menuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </header>

      {/* Right Slide-Out Menu Overlay */}
      {menuOpen && (
        <div
          className='creator-menu-overlay'
          onClick={() => setMenuOpen(false)}
        >
          <div
            className='creator-slide-menu'
            onClick={e => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              className='creator-close-btn'
              onClick={() => setMenuOpen(false)}
              aria-label='Close menu'
            >
              <X size={24} />
            </button>

            {/* User Info Section */}
            <div className='creator-user-info-section'>
              <div className='creator-user-avatar'>
                <User size={24} />
              </div>
              <div className='creator-user-details'>
                <span className='creator-user-name'>{creatorName}</span>
                <span className='creator-user-role'>Creator</span>
              </div>
            </div>

            {/* Main Navigation Links */}
            <div className='creator-nav-section'>
              <h3 className='creator-nav-section-title'>Navigation</h3>
              <div className='creator-nav-links'>
                {creatorNavItems.map(item => {
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      className={`creator-nav-link ${isActivePath(item.path) ? 'active' : ''}`}
                    >
                      <Icon className='creator-nav-icon' size={20} />
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            </div>

            {/* Profile & Settings Section */}
            <div className='creator-nav-section'>
              <h3 className='creator-nav-section-title'>Account</h3>
              <div className='creator-nav-links'>
                {profileNavItems.map(item => {
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      className={`creator-nav-link ${isActivePath(item.path) ? 'active' : ''}`}
                    >
                      <Icon className='creator-nav-icon' size={20} />
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            </div>

            {/* Logout Section */}
            <div className='creator-logout-section'>
              <button onClick={handleLogout} className='creator-logout-btn'>
                <LogOut size={20} />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default CreatorMainHeader;
