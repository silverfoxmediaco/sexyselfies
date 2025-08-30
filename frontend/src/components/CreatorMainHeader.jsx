import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { 
  Menu, X, ChevronDown, LogOut,
  Home, Camera, DollarSign, TrendingUp, 
  Settings, User, Bell, MessageCircle,
  Users, Grid3x3, CreditCard, BarChart3,
  Zap, Shield, Heart
} from 'lucide-react';
import authService from '../services/auth.service';
import './CreatorMainHeader.css';
import logo from '../assets/sexysselfies_logo.png';

const CreatorMainHeader = () => {
  const [scrolled, setScrolled] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
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
    { label: 'Content', path: '/creator/content', icon: Camera },
    { label: 'Analytics', path: '/creator/analytics', icon: BarChart3 },
    { label: 'Earnings', path: '/creator/earnings', icon: DollarSign },
    { label: 'Messages', path: '/creator/messages', icon: MessageCircle },
    { label: 'Connections', path: '/creator/connections', icon: Users },
  ];

  const isActivePath = (path) => {
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  return (
    <header className={`creator-main-header ${scrolled ? 'scrolled' : ''}`}>
      <div className="header-container">
        {/* Logo */}
        <div className="header-logo">
          <Link to="/creator/dashboard">
            <img src={logo} alt="SexySelfies" />
          </Link>
        </div>

        {/* Desktop Navigation */}
        <nav className="desktop-nav">
          <ul className="nav-links">
            {creatorNavItems.map((item) => {
              const Icon = item.icon;
              return (
                <li key={item.path} className={isActivePath(item.path) ? 'active' : ''}>
                  <Link to={item.path}>
                    <Icon size={18} />
                    <span>{item.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Right Side Actions */}
        <div className="header-actions">
          {/* Notifications */}
          <button className="notification-btn">
            <Bell size={20} />
            <span className="notification-badge">3</span>
          </button>

          {/* Creator Profile Dropdown */}
          <div className="user-menu-container">
            <button 
              className="user-menu-trigger"
              onClick={() => setShowUserMenu(!showUserMenu)}
            >
              <div className="user-avatar">
                <User size={20} />
              </div>
              <span className="user-name">{creatorName}</span>
              <ChevronDown size={16} />
            </button>

            {showUserMenu && (
              <div className="user-menu-dropdown">
                <div className="user-menu-header">
                  <div className="user-info">
                    <div className="user-avatar">
                      <User size={24} />
                    </div>
                    <div>
                      <div className="user-name">{creatorName}</div>
                      <div className="user-role">Creator</div>
                    </div>
                  </div>
                </div>
                
                <div className="user-menu-links">
                  <Link to="/creator/profile" onClick={() => setShowUserMenu(false)}>
                    <User size={16} />
                    My Profile
                  </Link>
                  <Link to="/creator/settings" onClick={() => setShowUserMenu(false)}>
                    <Settings size={16} />
                    Settings
                  </Link>
                  <Link to="/creator/verification" onClick={() => setShowUserMenu(false)}>
                    <Shield size={16} />
                    Verification
                  </Link>
                  <Link to="/creator/subscription" onClick={() => setShowUserMenu(false)}>
                    <Zap size={16} />
                    Subscription
                  </Link>
                  <Link to="/creator/payments" onClick={() => setShowUserMenu(false)}>
                    <CreditCard size={16} />
                    Payments
                  </Link>
                </div>

                <div className="user-menu-footer">
                  <button onClick={handleLogout} className="logout-btn">
                    <LogOut size={16} />
                    Sign Out
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Mobile Menu Toggle */}
          <button 
            className="mobile-menu-toggle"
            onClick={() => setShowMobileMenu(!showMobileMenu)}
          >
            {showMobileMenu ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation */}
      {showMobileMenu && (
        <div className="mobile-nav">
          <div className="mobile-nav-links">
            {creatorNavItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link 
                  key={item.path}
                  to={item.path}
                  className={isActivePath(item.path) ? 'active' : ''}
                  onClick={() => setShowMobileMenu(false)}
                >
                  <Icon size={20} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
            <div className="mobile-nav-divider"></div>
            <Link to="/creator/profile" onClick={() => setShowMobileMenu(false)}>
              <User size={20} />
              <span>My Profile</span>
            </Link>
            <Link to="/creator/settings" onClick={() => setShowMobileMenu(false)}>
              <Settings size={20} />
              <span>Settings</span>
            </Link>
            <button onClick={handleLogout} className="mobile-logout">
              <LogOut size={20} />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      )}
    </header>
  );
};

export default CreatorMainHeader;