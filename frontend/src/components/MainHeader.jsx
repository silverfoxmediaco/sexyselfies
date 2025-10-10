import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import {
  Menu,
  X,
  ChevronDown,
  LogIn,
  UserPlus,
  Home,
  Search,
  Heart,
  MessageCircle,
  User,
  Camera,
  DollarSign,
  TrendingUp,
  Shield,
  Sparkles,
  Settings,
  LogOut,
  CreditCard,
  Grid3x3,
  Users,
  Bell,
  Gift,
  UserSearch,
  Zap,
  Compass,
} from 'lucide-react';
import authService from '../services/auth.service';
import './MainHeader.css';
import logo from '../assets/sexysselfies_logo.png';

const MainHeader = () => {
  const [scrolled, setScrolled] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [userRole, setUserRole] = useState(localStorage.getItem('userRole'));
  const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem('token'));
  const navigate = useNavigate();
  const location = useLocation();

  // Listen for storage changes (logout from another tab or localStorage updates)
  useEffect(() => {
    const handleStorageChange = () => {
      const token = localStorage.getItem('token');
      const role = localStorage.getItem('userRole');
      setIsLoggedIn(!!token);
      setUserRole(role);
    };

    // Listen for storage events
    window.addEventListener('storage', handleStorageChange);

    // Also check periodically (for same-tab updates)
    const interval = setInterval(handleStorageChange, 1000);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = event => {
      if (showUserMenu && !event.target.closest('.user-menu-wrapper')) {
        setShowUserMenu(false);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [showUserMenu]);

  // Close mobile menu on route change
  useEffect(() => {
    setShowMobileMenu(false);
  }, [location]);

  const handleLogout = async () => {
    try {
      // Clear state immediately
      setIsLoggedIn(false);
      setUserRole(null);
      setShowUserMenu(false);

      // Clear localStorage
      localStorage.clear();

      // Call logout endpoint (don't wait for it)
      authService.logout().catch(err => console.error('Logout API error:', err));

      // Redirect to landing page immediately
      window.location.href = '/';
    } catch (error) {
      console.error('Logout failed:', error);
      // Force logout anyway
      localStorage.clear();
      window.location.href = '/';
    }
  };

  // Get navigation items based on user role
  const getNavItems = () => {
    if (!isLoggedIn) {
      // Public/Guest navigation
      return [
        { icon: Home, label: 'Home', path: '/' },
        { icon: Search, label: 'Explore', path: '/explore' },
        {
          icon: Sparkles,
          label: 'Become Creator',
          path: '/creator/register',
          highlight: true,
        },
      ];
    }

    if (userRole === 'member') {
      return [
        { icon: Compass, label: 'Browse', path: '/member/browse-creators' }, // BrowseCreators.jsx - swipe interface
        { icon: Heart, label: 'Connections', path: '/member/matches' },
        { icon: MessageCircle, label: 'Messages', path: '/member/messages' },
        { icon: Grid3x3, label: 'Purchased', path: '/member/purchased' }, // Changed from Credits to Purchased
      ];
    }

    if (userRole === 'creator') {
      return [
        { icon: Home, label: 'Dashboard', path: '/creator/dashboard' },
        {
          icon: UserSearch,
          label: 'Target Members',
          path: '/creator/browse-members',
        }, // BrowseMembers.jsx - browse/target members
        { icon: Users, label: 'My Members', path: '/creator/members' }, // Manage existing members
        { icon: Camera, label: 'Upload', path: '/creator/upload' },
        { icon: DollarSign, label: 'Earnings', path: '/creator/earnings' },
        { icon: MessageCircle, label: 'Messages', path: '/creator/messages' },
        { icon: TrendingUp, label: 'Analytics', path: '/creator/analytics' },
      ];
    }

    if (userRole === 'admin') {
      return [
        { icon: Home, label: 'Dashboard', path: '/admin/dashboard' },
        { icon: Shield, label: 'Verifications', path: '/admin/verifications' },
        { icon: Bell, label: 'Reports', path: '/admin/reports' }, // Added Reports with Bell icon
        { icon: Users, label: 'Users', path: '/admin/users' },
        { icon: Grid3x3, label: 'Content', path: '/admin/content' },
        // Removed Test Views - using dev toggle instead
      ];
    }

    return [];
  };

  const navItems = getNavItems();

  const isActive = path => {
    return (
      location.pathname === path || location.pathname.startsWith(path + '/')
    );
  };

  return (
    <>
      <header className={`mainheader-navbar ${scrolled ? 'scrolled' : ''}`}>
        <div className='mainheader-container'>
          <div className='mainheader-content'>
            {/* Logo */}
            <Link to='/' className='mainheader-logo'>
              <img
                src={logo}
                alt='SexySelfies'
                className='mainheader-logo-img'
              />
            </Link>

            {/* Desktop Navigation */}
            <nav className='mainheader-nav desktop-only'>
              {navItems.map((item, index) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={index}
                    to={item.path}
                    className={`mainheader-nav-link ${isActive(item.path) ? 'active' : ''} ${item.highlight ? 'highlight' : ''}`}
                  >
                    <Icon size={18} />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>

            {/* Desktop Actions */}
            <div className='mainheader-actions desktop-only'>
              {!isLoggedIn ? (
                <>
                  <Link to='/member/login' className='mainheader-btn-secondary'>
                    <LogIn size={18} />
                    <span>Member Login</span>
                  </Link>
                  <Link
                    to='/member/register'
                    className='mainheader-btn-primary'
                  >
                    <UserPlus size={18} />
                    <span>Join Free</span>
                  </Link>
                </>
              ) : (
                <>
                  {/* Notifications */}
                  <button className='mainheader-icon-btn'>
                    <Bell size={20} />
                    <span className='notification-badge'>3</span>
                  </button>

                  {/* User Menu */}
                  <div className='user-menu-wrapper'>
                    <button
                      className='mainheader-user-btn'
                      onClick={() => setShowUserMenu(!showUserMenu)}
                    >
                      <div className='user-avatar'>
                        <User size={18} />
                      </div>
                      <ChevronDown
                        size={16}
                        className={showUserMenu ? 'rotated' : ''}
                      />
                    </button>

                    {showUserMenu && (
                      <div className='mainheader-dropdown'>
                        <div className='dropdown-header'>
                          <div className='user-info'>
                            <div className='user-avatar-large'>
                              <User size={24} />
                            </div>
                            <div>
                              <div className='user-name'>User Name</div>
                              <div className='user-role'>{userRole}</div>
                            </div>
                          </div>
                        </div>

                        <div className='dropdown-divider' />

                        <Link
                          to={`/${userRole}/profile`}
                          className='dropdown-item'
                        >
                          <User size={18} />
                          <span>My Profile</span>
                        </Link>

                        {userRole === 'member' && (
                          <>
                            <Link
                              to='/member/purchased'
                              className='dropdown-item'
                            >
                              <Grid3x3 size={18} />
                              <span>Purchased Content</span>
                            </Link>
                            <Link
                              to='/member/connections'
                              className='dropdown-item'
                            >
                              <Heart size={18} />
                              <span>My Connections</span>
                            </Link>
                          </>
                        )}

                        {userRole === 'creator' && (
                          <>
                            <Link
                              to='/creator/profile-setup'
                              className='dropdown-item'
                            >
                              <Settings size={18} />
                              <span>Profile Settings</span>
                            </Link>
                            <Link
                              to='/creator/content'
                              className='dropdown-item'
                            >
                              <Grid3x3 size={18} />
                              <span>Manage Content</span>
                            </Link>
                            <Link
                              to='/creator/members'
                              className='dropdown-item'
                            >
                              <Users size={18} />
                              <span>My Members</span>
                            </Link>
                          </>
                        )}

                        {userRole === 'admin' && (
                          <>
                            <Link to='/admin/users' className='dropdown-item'>
                              <Users size={18} />
                              <span>Manage Users</span>
                            </Link>
                            <Link to='/admin/reports' className='dropdown-item'>
                              <Bell size={18} />
                              <span>View Reports</span>
                            </Link>
                          </>
                        )}

                        <Link
                          to={`/${userRole}/settings`}
                          className='dropdown-item'
                        >
                          <Settings size={18} />
                          <span>Settings</span>
                        </Link>

                        <div className='dropdown-divider' />

                        <button
                          onClick={handleLogout}
                          className='dropdown-item logout'
                        >
                          <LogOut size={18} />
                          <span>Logout</span>
                        </button>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>

            {/* Mobile Menu Button */}
            <button
              className='mainheader-mobile-btn mobile-only'
              onClick={() => setShowMobileMenu(!showMobileMenu)}
            >
              {showMobileMenu ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Menu */}
      {showMobileMenu && (
        <div className='mainheader-mobile-menu mobile-only'>
          <div className='mobile-menu-content'>
            {/* User Info (if logged in) */}
            {isLoggedIn && (
              <div className='mobile-user-section'>
                <div className='mobile-user-info'>
                  <div className='user-avatar-large'>
                    <User size={24} />
                  </div>
                  <div>
                    <div className='user-name'>User Name</div>
                    <div className='user-role'>{userRole}</div>
                  </div>
                </div>
              </div>
            )}

            {/* Navigation Links */}
            <nav className='mobile-nav-links'>
              {navItems.map((item, index) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={index}
                    to={item.path}
                    className={`mobile-nav-link ${isActive(item.path) ? 'active' : ''}`}
                  >
                    <Icon size={20} />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>

            {/* Additional Links for logged in users */}
            {isLoggedIn && (
              <>
                <div className='mobile-menu-divider' />
                <nav className='mobile-nav-links'>
                  <Link to={`/${userRole}/profile`} className='mobile-nav-link'>
                    <User size={20} />
                    <span>My Profile</span>
                  </Link>

                  {userRole === 'member' && (
                    <>
                      <Link to='/member/purchased' className='mobile-nav-link'>
                        <Grid3x3 size={20} />
                        <span>Purchased Content</span>
                      </Link>
                      <Link
                        to='/member/connections'
                        className='mobile-nav-link'
                      >
                        <Heart size={20} />
                        <span>My Connections</span>
                      </Link>
                    </>
                  )}

                  {userRole === 'creator' && (
                    <>
                      <Link to='/creator/members' className='mobile-nav-link'>
                        <Users size={20} />
                        <span>My Members</span>
                      </Link>
                      <Link to='/creator/content' className='mobile-nav-link'>
                        <Grid3x3 size={20} />
                        <span>Manage Content</span>
                      </Link>
                    </>
                  )}

                  {userRole === 'admin' && (
                    <>
                      <Link to='/admin/users' className='mobile-nav-link'>
                        <Users size={20} />
                        <span>Manage Users</span>
                      </Link>
                      <Link to='/admin/reports' className='mobile-nav-link'>
                        <Bell size={20} />
                        <span>View Reports</span>
                      </Link>
                    </>
                  )}

                  <Link
                    to={`/${userRole}/settings`}
                    className='mobile-nav-link'
                  >
                    <Settings size={20} />
                    <span>Settings</span>
                  </Link>
                </nav>
              </>
            )}

            {/* Mobile Actions */}
            <div className='mobile-menu-actions'>
              {!isLoggedIn ? (
                <>
                  <Link
                    to='/member/login'
                    className='mobile-action-btn secondary'
                  >
                    <LogIn size={18} />
                    <span>Member Login</span>
                  </Link>
                  <Link
                    to='/member/register'
                    className='mobile-action-btn primary'
                  >
                    <UserPlus size={18} />
                    <span>Join Free</span>
                  </Link>
                  <div className='mobile-menu-divider' />
                  <Link
                    to='/creator/login'
                    className='mobile-action-btn outline'
                  >
                    <Sparkles size={18} />
                    <span>Creator Login</span>
                  </Link>
                </>
              ) : (
                <button
                  onClick={handleLogout}
                  className='mobile-action-btn logout'
                >
                  <LogOut size={18} />
                  <span>Logout</span>
                </button>
              )}
            </div>

            {/* Platform Info */}
            <div className='mobile-platform-info'>
              <div className='platform-stats'>
                <div className='stat'>
                  <span className='stat-value'>10K+</span>
                  <span className='stat-label'>Creators</span>
                </div>
                <div className='stat'>
                  <span className='stat-value'>50K+</span>
                  <span className='stat-label'>Members</span>
                </div>
                <div className='stat'>
                  <span className='stat-value'>80%</span>
                  <span className='stat-label'>Revenue Share</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default MainHeader;
