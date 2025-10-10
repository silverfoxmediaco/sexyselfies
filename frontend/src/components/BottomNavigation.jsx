import React, { useState } from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import {
  Flame,
  Heart,
  MessageCircle,
  User,
  Home,
  Upload,
  DollarSign,
  TrendingUp,
  Settings,
  Search,
  Grid3x3,
  Camera,
  Sparkles,
  Menu,
  X,
  Bell,
  Shield,
  Users,
  LogOut,
  BookOpen,
  BarChart3,
  Compass,
  FileText,
  HelpCircle,
  UserCheck,
  RefreshCw,
  Plus,
  Link2,
  Sliders,
  Mail,
  Cookie,
  Copyright,
} from 'lucide-react';
import authService from '../services/auth.service';
import logo from '../assets/sexysselfies_logo.png';
import './BottomNavigation.css';

const BottomNavigation = ({ userRole, onRefresh, notificationCount = 0 }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { creatorId } = useParams();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Determine role from URL if not provided
  const effectiveUserRole = userRole ||
    (location.pathname.startsWith('/admin') ? 'admin' :
     location.pathname.startsWith('/creator') ? 'creator' :
     location.pathname.startsWith('/member') ? 'member' : null);

  // Handle refresh action
  const handleRefresh = async () => {
    setRefreshing(true);
    // Call the parent's refresh function if provided
    if (onRefresh) {
      await onRefresh();
    }
    setTimeout(() => setRefreshing(false), 1000);
  };

  // Main bottom nav items - Updated with Connections for members
  const getNavItems = () => {
    if (effectiveUserRole === 'creator' && creatorId) {
      return [
        {
          icon: Home,
          label: 'Home',
          path: `/creator/${creatorId}/dashboard`,
          color: '#17D2C2',
        },
        {
          icon: Compass,
          label: 'Browse',
          path: `/creator/${creatorId}/browse-members`,
          color: '#EF4444',
        },
        { icon: Menu, label: 'Menu', action: 'menu', color: '#6B7280' },
        {
          icon: Link2,
          label: 'Connections',
          path: `/creator/${creatorId}/connections`,
          color: '#8B5CF6',
        },
        {
          icon: User,
          label: 'Profile',
          path: `/creator/${creatorId}/profile`,
          color: '#3B82F6',
        },
      ];
    } else if (effectiveUserRole === 'creator') {
      // Fallback for when creatorId is not available
      return [
        {
          icon: Home,
          label: 'Home',
          path: '/creator/dashboard',
          color: '#17D2C2',
        },
        {
          icon: Compass,
          label: 'Browse',
          path: '/creator/browse-members',
          color: '#EF4444',
        },
        { icon: Menu, label: 'Menu', action: 'menu', color: '#6B7280' },
        {
          icon: Link2,
          label: 'Connections',
          path: '/creator/connections',
          color: '#8B5CF6',
        },
        {
          icon: User,
          label: 'Profile',
          path: '/creator/profile',
          color: '#3B82F6',
        },
      ];
    } else if (effectiveUserRole === 'member') {
      return [
        {
          icon: Flame,
          label: 'Browse',
          path: '/member/browse-creators',
          color: '#EF4444',
        },
        {
          icon: Link2,
          label: 'Connections',
          path: '/member/connections',
          color: '#17D2C2',
        },
        { icon: Menu, label: 'Menu', action: 'menu', color: '#6B7280' },
        {
          icon: MessageCircle,
          label: 'Chat',
          path: '/member/messages',
          color: '#8B5CF6',
        },
        {
          icon: User,
          label: 'Profile',
          path: '/member/profile',
          color: '#3B82F6',
        },
      ];
    } else if (effectiveUserRole === 'admin') {
      return [
        {
          icon: Home,
          label: 'Dashboard',
          path: '/admin/dashboard',
          color: '#17D2C2',
        },
        {
          icon: Shield,
          label: 'Verify',
          path: '/admin/verifications',
          color: '#22C55E',
        },
        { icon: Menu, label: 'Menu', action: 'menu', color: '#6B7280' },
        { icon: Users, label: 'Users', path: '/admin/users', color: '#3B82F6' },
        {
          icon: Grid3x3,
          label: 'Content',
          path: '/admin/content',
          color: '#8B5CF6',
        },
      ];
    } else {
      // Guest navigation - no Explore for non-logged-in users
      return [
        { icon: Home, label: 'Home', path: '/', color: '#17D2C2' },
        { icon: Menu, label: 'Menu', action: 'menu', color: '#6B7280' },
        { icon: User, label: 'Login', path: '/member/login', color: '#8B5CF6' },
        {
          icon: Sparkles,
          label: 'Join',
          path: '/member/register',
          color: '#EC4899',
        },
      ];
    }
  };

  // Menu items in slideout - Updated with Connections in menu
  const getMenuItems = () => {
    if (effectiveUserRole === 'creator' && creatorId) {
      return [
        // Quick Actions Section
        { section: 'Quick Actions' },
        {
          icon: RefreshCw,
          label: 'Refresh Dashboard',
          action: 'refresh',
          highlight: refreshing,
        },
        {
          icon: Bell,
          label: 'Notifications',
          path: `/creator/${creatorId}/notifications`,
          badge: notificationCount,
        },
        {
          icon: Plus,
          label: 'Upload Content',
          path: `/creator/${creatorId}/upload`,
          primary: true,
        },

        { section: 'divider' },

        // Analytics & Earnings
        { section: 'Analytics' },
        {
          icon: TrendingUp,
          label: 'Analytics',
          path: `/creator/${creatorId}/analytics`,
        },
        {
          icon: DollarSign,
          label: 'Earnings',
          path: `/creator/${creatorId}/earnings`,
        },

        { section: 'divider' },

        // Content & Members
        { section: 'Content & Members' },
        {
          icon: Grid3x3,
          label: 'My Content',
          path: `/creator/${creatorId}/content`,
        },
        {
          icon: Users,
          label: 'My Members',
          path: `/creator/${creatorId}/members`,
        },
        {
          icon: Link2,
          label: 'Member Connections',
          path: `/creator/${creatorId}/connections`,
        },

        { section: 'divider' },

        // Settings & Support
        { section: 'Account' },
        {
          icon: Settings,
          label: 'Settings',
          path: `/creator/${creatorId}/settings`,
        },

        { section: 'divider' },

        { section: 'Support & Info' },
        { icon: Shield, label: 'Safety Center', path: '/safety' },
        { icon: Users, label: 'Community Guidelines', path: '/community-guidelines' },
        { icon: HelpCircle, label: 'FAQ', path: '/faq' },
        { icon: Mail, label: 'Contact Us', path: '/contact' },

        { section: 'divider' },

        { section: 'Legal & Policies' },
        { icon: FileText, label: 'Terms of Service', path: '/terms' },
        { icon: FileText, label: 'Privacy Policy', path: '/privacy' },
        { icon: BookOpen, label: 'Creator Guidelines', path: '/creator-guidelines' },
        { icon: Cookie, label: 'Cookie Policy', path: '#cookies' },
        { icon: Copyright, label: 'DMCA', path: '/dmca' },

        { section: 'divider' },

        { icon: LogOut, label: 'Logout', action: 'logout' },
      ];
    } else if (effectiveUserRole === 'creator') {
      // Fallback for when creatorId is not available
      return [
        // Quick Actions Section
        { section: 'Quick Actions' },
        {
          icon: RefreshCw,
          label: 'Refresh Dashboard',
          action: 'refresh',
          highlight: refreshing,
        },
        {
          icon: Bell,
          label: 'Notifications',
          path: '/creator/notifications',
          badge: notificationCount,
        },
        {
          icon: Plus,
          label: 'Upload Content',
          path: '/creator/upload',
          primary: true,
        },

        { section: 'divider' },

        // Analytics & Earnings
        { section: 'Analytics' },
        { icon: TrendingUp, label: 'Analytics', path: '/creator/analytics' },
        { icon: DollarSign, label: 'Earnings', path: '/creator/earnings' },

        { section: 'divider' },

        // Content & Members
        { section: 'Content & Members' },
        { icon: Grid3x3, label: 'My Content', path: '/creator/content' },
        { icon: Users, label: 'My Members', path: '/creator/members' },
        {
          icon: Link2,
          label: 'Member Connections',
          path: '/creator/connections',
        },

        { section: 'divider' },

        // Settings & Support
        { section: 'Account' },
        { icon: Settings, label: 'Settings', path: '/creator/settings' },

        { section: 'divider' },

        { section: 'Support & Info' },
        { icon: Shield, label: 'Safety Center', path: '/safety' },
        { icon: Users, label: 'Community Guidelines', path: '/community-guidelines' },
        { icon: HelpCircle, label: 'FAQ', path: '/faq' },
        { icon: Mail, label: 'Contact Us', path: '/contact' },

        { section: 'divider' },

        { section: 'Legal & Policies' },
        { icon: FileText, label: 'Terms of Service', path: '/terms' },
        { icon: FileText, label: 'Privacy Policy', path: '/privacy' },
        { icon: BookOpen, label: 'Creator Guidelines', path: '/creator-guidelines' },
        { icon: Cookie, label: 'Cookie Policy', path: '#cookies' },
        { icon: Copyright, label: 'DMCA', path: '/dmca' },

        { section: 'divider' },

        { icon: LogOut, label: 'Logout', action: 'logout' },
      ];
    } else if (effectiveUserRole === 'member') {
      return [
        { section: 'Browse & Connect' },
        { icon: Sliders, label: 'Browse Preferences', path: '/member/filters' },
        { icon: Search, label: 'Search Creators', path: '/member/search' },
        { icon: Flame, label: 'Trending Creators', path: '/member/trending' },
        { icon: Link2, label: 'My Connections', path: '/member/connections' },
        { icon: Heart, label: 'Favorites', path: '/member/favorites' },

        { section: 'divider' },

        { section: 'Content' },
        {
          icon: Grid3x3,
          label: 'Purchased Content',
          path: '/member/purchased',
        },
        { icon: Camera, label: 'My Library', path: '/member/library' },

        { section: 'divider' },

        { section: 'Account' },
        { icon: DollarSign, label: 'Billing', path: '/member/billing' },
        { icon: Settings, label: 'Settings', path: '/member/settings' },

        { section: 'divider' },

        { section: 'Support & Info' },
        { icon: Shield, label: 'Safety Center', path: '/safety' },
        { icon: Users, label: 'Community Guidelines', path: '/community-guidelines' },
        { icon: HelpCircle, label: 'FAQ', path: '/faq' },
        { icon: Mail, label: 'Contact Us', path: '/contact' },

        { section: 'divider' },

        { section: 'Legal & Policies' },
        { icon: FileText, label: 'Terms of Service', path: '/terms' },
        { icon: FileText, label: 'Privacy Policy', path: '/privacy' },
        { icon: BookOpen, label: 'Creator Guidelines', path: '/creator-guidelines' },
        { icon: Cookie, label: 'Cookie Policy', path: '#cookies' },
        { icon: Copyright, label: 'DMCA', path: '/dmca' },

        { section: 'divider' },

        { icon: LogOut, label: 'Logout', action: 'logout' },
      ];
    } else if (effectiveUserRole === 'admin') {
      return [
        { section: 'Management' },
        { icon: Bell, label: 'Reports', path: '/admin/reports' },
        { icon: UserCheck, label: 'Manage Admins', path: '/admin/management' },
        { icon: BookOpen, label: 'Activity Logs', path: '/admin/logs' },

        { section: 'divider' },

        { section: 'System' },
        { icon: Settings, label: 'Settings', path: '/admin/settings' },

        { section: 'divider' },

        { section: 'Support & Info' },
        { icon: Shield, label: 'Safety Center', path: '/safety' },
        { icon: Users, label: 'Community Guidelines', path: '/community-guidelines' },
        { icon: HelpCircle, label: 'FAQ', path: '/faq' },
        { icon: Mail, label: 'Contact Us', path: '/contact' },

        { section: 'divider' },

        { section: 'Legal & Policies' },
        { icon: FileText, label: 'Terms of Service', path: '/terms' },
        { icon: FileText, label: 'Privacy Policy', path: '/privacy' },
        { icon: BookOpen, label: 'Creator Guidelines', path: '/creator-guidelines' },
        { icon: Cookie, label: 'Cookie Policy', path: '#cookies' },
        { icon: Copyright, label: 'DMCA', path: '/dmca' },

        { section: 'divider' },

        { icon: LogOut, label: 'Logout', action: 'logout' },
      ];
    } else {
      // Guest menu items
      return [
        { section: 'Get Started' },
        { icon: Sparkles, label: 'Become Creator', path: '/creator/register' },
        { icon: User, label: 'Member Login', path: '/member/login' },
        { icon: Shield, label: 'Admin Login', path: '/admin/login' },

        { section: 'divider' },

        { section: 'Support & Info' },
        { icon: Shield, label: 'Safety Center', path: '/safety' },
        { icon: Users, label: 'Community Guidelines', path: '/community-guidelines' },
        { icon: HelpCircle, label: 'FAQ', path: '/faq' },
        { icon: Mail, label: 'Contact Us', path: '/contact' },

        { section: 'divider' },

        { section: 'Legal & Policies' },
        { icon: FileText, label: 'Terms of Service', path: '/terms' },
        { icon: FileText, label: 'Privacy Policy', path: '/privacy' },
        { icon: BookOpen, label: 'Creator Guidelines', path: '/creator-guidelines' },
        { icon: Cookie, label: 'Cookie Policy', path: '#cookies' },
        { icon: Copyright, label: 'DMCA', path: '/dmca' },
      ];
    }
  };

  const navItems = getNavItems();
  const menuItems = getMenuItems();

  const isActive = path => {
    if (!path) return false;
    return (
      location.pathname === path || location.pathname.startsWith(path + '/')
    );
  };

  const handleNavClick = item => {
    if (item.action === 'menu') {
      setIsMenuOpen(true);
    } else if (item.path) {
      navigate(item.path);
    }
  };

  const handleMenuItemClick = async item => {
    if (item.action === 'logout') {
      try {
        // Call logout endpoint (don't wait for it)
        authService.logout().catch(err => console.error('Logout API error:', err));

        // Clear localStorage completely
        localStorage.clear();

        // Force page reload to landing page (this clears all React state)
        window.location.replace('/');
      } catch (error) {
        console.error('Logout failed:', error);
        // Force logout anyway
        localStorage.clear();
        window.location.replace('/');
      }
    } else if (item.action === 'refresh') {
      handleRefresh();
      setIsMenuOpen(false);
    } else if (item.path) {
      navigate(item.path);
      setIsMenuOpen(false);
    }
  };

  return (
    <>
      {/* Slide-out Menu Overlay */}
      {isMenuOpen && (
        <div className='menu-overlay' onClick={() => setIsMenuOpen(false)} />
      )}

      {/* Slide-out Menu */}
      <div className={`slide-menu ${isMenuOpen ? 'open' : ''}`}>
        <div className='menu-header'>
          <img src={logo} alt='SexySelfies' className='menu-logo' />
          <button className='close-menu' onClick={() => setIsMenuOpen(false)}>
            <X size={24} />
          </button>
        </div>

        <div className='menu-user-info'>
          <div className='menu-user-avatar'>
            <User size={32} />
          </div>
          <div className='menu-user-details'>
            <div className='menu-user-name'>
              {effectiveUserRole === 'admin'
                ? 'Administrator'
                : effectiveUserRole === 'creator'
                  ? 'Creator Account'
                  : effectiveUserRole === 'member'
                    ? 'Member Account'
                    : 'Guest'}
            </div>
            <div className='menu-user-role'>
              {effectiveUserRole
                ? effectiveUserRole.charAt(0).toUpperCase() + effectiveUserRole.slice(1)
                : 'Not logged in'}
            </div>
          </div>
        </div>

        <div className='menu-items'>
          {menuItems.map((item, index) => {
            if (item.section === 'divider') {
              return <div key={index} className='menu-divider' />;
            }

            if (item.section) {
              return (
                <div key={index} className='menu-section-title'>
                  {item.section}
                </div>
              );
            }

            const Icon = item.icon;
            const isLogout = item.action === 'logout';
            const isPrimary = item.primary;
            const isRefresh = item.action === 'refresh';

            return (
              <button
                key={index}
                className={`menu-item ${item.path && isActive(item.path) ? 'active' : ''} ${isLogout ? 'logout-item' : ''} ${isPrimary ? 'primary-item' : ''} ${isRefresh && refreshing ? 'refreshing' : ''}`}
                onClick={() => handleMenuItemClick(item)}
              >
                <Icon
                  size={20}
                  className={isRefresh && refreshing ? 'rotating' : ''}
                />
                <span>{item.label}</span>
                {item.badge > 0 && (
                  <span className='menu-badge'>{item.badge}</span>
                )}
              </button>
            );
          })}
        </div>

        <div className='menu-footer'>
          <div className='menu-version'>Version 1.0.0</div>
        </div>
      </div>

      {/* Bottom Navigation Bar */}
      <nav className='bottom-navigation'>
        <div className='nav-container'>
          {navItems.map((item, index) => {
            const Icon = item.icon;
            const isMenuButton = item.action === 'menu';

            return (
              <button
                key={index}
                className={`nav-item ${item.path && isActive(item.path) ? 'active' : ''} ${isMenuButton ? 'menu-button' : ''} ${isMenuButton && isMenuOpen ? 'menu-active' : ''}`}
                onClick={() => handleNavClick(item)}
                style={{ '--item-color': item.color }}
              >
                <div className='nav-icon'>
                  <Icon size={24} strokeWidth={2} />
                  {item.path && isActive(item.path) && (
                    <div className='active-indicator' />
                  )}
                </div>
                <span className='nav-label'>{item.label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </>
  );
};

export default BottomNavigation;
