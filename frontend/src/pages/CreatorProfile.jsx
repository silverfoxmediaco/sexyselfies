import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  Heart,
  MessageCircle,
  Share2,
  MoreVertical,
  Camera,
  Video,
  Lock,
  Unlock,
  Star,
  MapPin,
  Shield,
  Users,
  Clock,
  TrendingUp,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Eye,
  EyeOff,
  DollarSign,
  ShoppingBag,
  Gift,
  Sparkles,
  Instagram,
  Twitter,
  Link,
  Flag,
  UserX,
  Bell,
  BellOff,
  Grid3x3,
  Play,
  Image,
  Film,
  Music,
  FileText,
  Download,
  User,
  CheckCircle,
  XCircle,
  AlertCircle,
  Zap,
  Crown,
  Diamond,
  X,
} from 'lucide-react';
import memberService from '../services/member.service.js';
import MainHeader from '../components/MainHeader';
import MainFooter from '../components/MainFooter';
import BottomNavigation from '../components/BottomNavigation';
import {
  useIsDesktop,
  useIsMobile,
  getUserRole,
} from '../utils/mobileDetection';

import './CreatorProfile.css';

// Import new components
import ProfileCoverPhoto from '../components/CreatorProfile/ProfileCoverPhoto';
import ContentGrid from '../components/CreatorProfile/ContentGrid';
import CreatorProfileInformation from '../components/CreatorProfileInformation';

const CreatorProfile = () => {
  const { username } = useParams();
  const navigate = useNavigate();
  const isDesktop = useIsDesktop();
  const isMobile = useIsMobile();
  const userRole = getUserRole();

  // Profile states
  const [creator, setCreator] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [hasMatched, setHasMatched] = useState(false);

  // Content states
  const [content, setContent] = useState([]);
  const [contentFilter, setContentFilter] = useState('all'); // all, photos, videos, locked
  const [selectedContent, setSelectedContent] = useState(null);
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const [purchasedContent, setPurchasedContent] = useState([]);

  // UI states
  const [activeTab, setActiveTab] = useState('content'); // content, about, reviews
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [imageGalleryIndex, setImageGalleryIndex] = useState(0);
  const [showImageGallery, setShowImageGallery] = useState(false);

  // User data
  const [userCredits, setUserCredits] = useState(100);
  const [viewHistory, setViewHistory] = useState([]);

  // Fetch creator profile
  useEffect(() => {
    const fetchCreatorProfile = async () => {
      setLoading(true);
      setError(null);
      try {
        console.log('🔍 Fetching creator profile for username:', username);
        const response = await memberService.getCreatorProfile(username);
        console.log('📸 Creator cover image data:', response.creator?.coverImage);
        console.log('👤 Full creator object:', response.creator);

        if (response.success && response.data?.creator) {
          const creatorData = response.data.creator;
          console.log(
            '✅ Creator profile loaded:',
            creatorData.username || creatorData.displayName
          );
          console.log('🖼️ Cover image data:', {
            coverImage: creatorData.coverImage,
            coverImagePreview: creatorData.coverImagePreview,
            profileImage: creatorData.profileImage,
            profilePhotoPreview: creatorData.profilePhotoPreview,
            lastActive: creatorData.lastActive,
            isOnline: creatorData.isOnline
          });
          setCreator(creatorData);

          // Set content if available
          if (response.data.content) {
            setContent(response.data.content);
          }
        } else {
          throw new Error('Creator not found');
        }
      } catch (err) {
        console.error('Failed to load creator profile:', err);
        if (err.response?.status === 401) {
          setError('Please login to view creator profiles');
        } else if (err.response?.status === 404) {
          setError('Creator not found');
        } else {
          setError('Failed to load creator profile');
        }
      } finally {
        setLoading(false);
      }
    };

    if (username) {
      fetchCreatorProfile();
    }
  }, [username]);

  // Handle content purchase
  const handlePurchaseContent = async contentItem => {
    if (userCredits < contentItem.price) {
      // Show insufficient credits modal
      alert('Insufficient credits. Please add more credits.');
      return;
    }

    try {
      // Simulate purchase
      setUserCredits(prev => prev - contentItem.price);
      setPurchasedContent(prev => [...prev, contentItem.id]);

      // Update content item
      setContent(prev =>
        prev.map(item =>
          item.id === contentItem.id
            ? { ...item, isPurchased: true, isLocked: false }
            : item
        )
      );

      setShowPurchaseModal(false);
      setSelectedContent(null);

      // Show success message
      alert(`Content unlocked for $${contentItem.price}!`);

      // Actual API call would be:
      // const response = await axios.post(
      //   `/api/v1/purchases/content/${contentItem.id}`,
      //   { creatorUsername: username },
      //   { headers: { Authorization: `Bearer ${token}` } }
      // );
    } catch (err) {
      alert('Purchase failed. Please try again.');
    }
  };

  // Handle follow/unfollow
  const handleFollow = async () => {
    try {
      console.log('🔗 Creating connection with creator:', creator.id);

      // Call the swipe/like API to create connection
      const response = await memberService.swipeAction(creator.id, 'like');

      if (response.success) {
        setIsFollowing(true);
        console.log('✅ Connection created successfully');
      } else {
        console.error('❌ Failed to create connection:', response.message);
      }
    } catch (err) {
      console.error('❌ Failed to follow/create connection:', err);
      // Don't change the UI state if API call failed
    }
  };

  // Handle like/match
  const handleLike = async () => {
    try {
      setHasMatched(true);
      // API call to like/match
    } catch (err) {
      console.error('Failed to like:', err);
    }
  };

  // Handle message
  const handleMessage = () => {
    if (hasMatched) {
      navigate(`/member/messages/${username}`);
    } else {
      alert('You need to connect with this creator first!');
    }
  };

  // Filter content
  const getFilteredContent = () => {
    const safeContent = content || [];
    switch (contentFilter) {
      case 'photos':
        return safeContent.filter(item => item.type === 'photo');
      case 'videos':
        return safeContent.filter(item => item.type === 'video');
      case 'locked':
        return safeContent.filter(item => item.isLocked && !item.isPurchased);
      default:
        return safeContent;
    }
  };

  // Calculate time ago
  const getTimeAgo = timestamp => {
    if (!timestamp || timestamp === 'Invalid Date' || isNaN(new Date(timestamp))) {
      return 'recently';
    }
    const minutes = Math.floor((Date.now() - new Date(timestamp)) / 60000);
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  if (loading) {
    return (
      <>
        {isDesktop && <MainHeader />}
        <div className='creator-profile-page'>
          <div className='profile-loading'>
            <div className='loading-spinner'></div>
            <p>Loading creator profile...</p>
          </div>
        </div>
        {isDesktop && <MainFooter />}
        {isMobile && <BottomNavigation userRole={userRole} />}
      </>
    );
  }

  if (error || !creator) {
    return (
      <>
        {isDesktop && <MainHeader />}
        <div className='creator-profile-page'>
          <div className='profile-error'>
            <AlertCircle size={48} />
            <h3>Unable to load profile</h3>
            <p>{error || 'Creator not found'}</p>
            <button onClick={() => navigate(-1)} className='back-btn'>
              Go Back
            </button>
          </div>
        </div>
        {isDesktop && <MainFooter />}
        {isMobile && <BottomNavigation userRole={userRole} />}
      </>
    );
  }

  return (
    <>
      {isDesktop && <MainHeader />}
      <div className='creator-profile-page'>
        <div className='profile-container'>
          {/* NEW COMPONENT STRUCTURE */}
          {/* Cover Photo with Overlay */}
          <ProfileCoverPhoto
            creator={creator}
            coverImage={creator.coverImage || creator.coverImagePreview}
            isMobile={isMobile}
            isFollowing={isFollowing}
            hasMatched={hasMatched}
            onBack={() => navigate(-1)}
            onFollow={handleFollow}
            onLike={handleLike}
            onMessage={handleMessage}
            onShare={() => setShowShareMenu(!showShareMenu)}
            onMore={() => setShowMoreMenu(!showMoreMenu)}
            showShareMenu={showShareMenu}
            showMoreMenu={showMoreMenu}
          />

          {/* More Menu */}
          {showMoreMenu && (
            <div className='more-menu-overlay' onClick={() => setShowMoreMenu(false)}>
              <div className='more-menu' onClick={e => e.stopPropagation()}>
                <button className='more-menu-item' onClick={() => {
                  navigator.share ? navigator.share({
                    title: `${creator.displayName}'s Profile`,
                    url: window.location.href
                  }) : navigator.clipboard.writeText(window.location.href);
                  setShowMoreMenu(false);
                }}>
                  <Share2 size={18} />
                  <span>Share Profile</span>
                </button>
                <button className='more-menu-item' onClick={() => {
                  // Add to favorites logic here
                  setShowMoreMenu(false);
                }}>
                  <Heart size={18} />
                  <span>Add to Favorites</span>
                </button>
                <button className='more-menu-item' onClick={() => {
                  // Report user logic here
                  setShowMoreMenu(false);
                }}>
                  <Flag size={18} />
                  <span>Report User</span>
                </button>
                <button className='more-menu-item' onClick={() => {
                  // Block user logic here
                  setShowMoreMenu(false);
                }}>
                  <UserX size={18} />
                  <span>Block User</span>
                </button>
              </div>
            </div>
          )}

          {/* Content Tabs */}
          <div className='profile-tabs'>
            <button
              className={`tab-btn ${activeTab === 'content' ? 'active' : ''}`}
              onClick={() => setActiveTab('content')}
            >
              <Grid3x3 size={18} />
              <span>Content</span>
            </button>
            <button
              className={`tab-btn ${activeTab === 'about' ? 'active' : ''}`}
              onClick={() => setActiveTab('about')}
            >
              <User size={18} />
              <span>About</span>
            </button>
            <button
              className={`tab-btn ${activeTab === 'reviews' ? 'active' : ''}`}
              onClick={() => setActiveTab('reviews')}
            >
              <Star size={18} />
              <span>Reviews</span>
            </button>
          </div>

          {/* Tab Content */}
          <div className='tab-content'>
            {activeTab === 'content' && (
              <>
                {/* Content Filter */}
                <div className='content-filter'>
                  <button
                    className={`filter-option ${contentFilter === 'all' ? 'active' : ''}`}
                    onClick={() => setContentFilter('all')}
                  >
                    All ({content.length})
                  </button>
                  <button
                    className={`filter-option ${contentFilter === 'photos' ? 'active' : ''}`}
                    onClick={() => setContentFilter('photos')}
                  >
                    <Camera size={16} />
                    Photos ({content.filter(c => c.type === 'photo').length})
                  </button>
                  <button
                    className={`filter-option ${contentFilter === 'videos' ? 'active' : ''}`}
                    onClick={() => setContentFilter('videos')}
                  >
                    <Video size={16} />
                    Videos ({content.filter(c => c.type === 'video').length})
                  </button>
                  <button
                    className={`filter-option ${contentFilter === 'locked' ? 'active' : ''}`}
                    onClick={() => setContentFilter('locked')}
                  >
                    <Lock size={16} />
                    Locked ({content.filter(c => c.isLocked && !c.isPurchased).length})
                  </button>
                </div>

                {/* NEW CONTENT GRID COMPONENT */}
                <ContentGrid
                  content={getFilteredContent()}
                  onContentClick={(contentItem, index) => {
                    setSelectedContent(contentItem);
                    setImageGalleryIndex(index);
                    setShowImageGallery(true);
                  }}
                  purchasedContent={purchasedContent}
                />
              </>
            )}

            {activeTab === 'about' && (
              <CreatorProfileInformation
                creatorData={creator}
                isOwnProfile={false}
                showTitle={false}
              />
            )}

            {activeTab === 'reviews' && (
              <div className='reviews-section'>
                <div className='reviews-header'>
                  <div className='overall-rating'>
                    <span className='rating-value'>
                      {creator.stats?.rating?.toFixed(1) || '0.0'}
                    </span>
                    <div className='rating-stars'>
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          size={20}
                          fill={
                            i < Math.floor(creator.stats?.rating || 0)
                              ? 'currentColor'
                              : 'none'
                          }
                        />
                      ))}
                    </div>
                    <span className='review-count'>
                      {creator.stats?.reviewCount || 0} reviews
                    </span>
                  </div>
                </div>
                <div className='reviews-list'>
                  <p className='reviews-placeholder'>Reviews coming soon...</p>
                </div>
              </div>
            )}
          </div>

          {/* Content Gallery Modal - Keep from original */}
          <AnimatePresence>
            {showImageGallery && selectedContent && (
              <motion.div
                className='content-gallery-overlay'
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowImageGallery(false)}
              >
                <motion.div
                  className='content-gallery-modal'
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.9, opacity: 0 }}
                  onClick={e => e.stopPropagation()}
                >
                  <button
                    className='modal-close'
                    onClick={() => setShowImageGallery(false)}
                  >
                    <X size={24} />
                  </button>

                  <div className='content-gallery-header'>
                    <div className='content-meta'>
                      <h3 className='content-title'>{selectedContent.title}</h3>
                      <span className='content-date'>
                        {selectedContent.date && !isNaN(new Date(selectedContent.date))
                          ? new Date(selectedContent.date).toLocaleDateString()
                          : 'Recently uploaded'
                        }
                      </span>
                    </div>
                    <div className='content-actions'>
                      <button
                        className='action-btn like-btn'
                        onClick={() => {
                          setContent(prev => prev.map(item =>
                            item.id === selectedContent.id
                              ? { ...item, isLiked: !item.isLiked, likes: item.isLiked ? (item.likes || 1) - 1 : (item.likes || 0) + 1 }
                              : item
                          ));
                          setSelectedContent(prev => ({
                            ...prev,
                            isLiked: !prev.isLiked,
                            likes: prev.isLiked ? (prev.likes || 1) - 1 : (prev.likes || 0) + 1
                          }));
                        }}
                      >
                        <Heart size={20} fill={selectedContent.isLiked ? 'currentColor' : 'none'} />
                        <span>{selectedContent.likes || 0}</span>
                      </button>
                      <button
                        className='action-btn download-btn'
                        onClick={() => {
                          const link = document.createElement('a');
                          link.href = selectedContent.thumbnail;
                          link.download = selectedContent.title || 'content';
                          document.body.appendChild(link);
                          link.click();
                          document.body.removeChild(link);
                        }}
                      >
                        <Download size={20} />
                        <span>Download</span>
                      </button>
                    </div>
                  </div>

                  <div className='content-gallery-body'>
                    {selectedContent.type === 'video' ? (
                      <video
                        src={selectedContent.thumbnail}
                        controls
                        className='content-media'
                        autoPlay
                      />
                    ) : (
                      <img
                        src={selectedContent.thumbnail}
                        alt={selectedContent.title}
                        className='content-media'
                      />
                    )}
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

        </div>
      </div>

      {isDesktop && <MainFooter />}
      {isMobile && <BottomNavigation userRole={userRole} />}
    </>
  );
};

export default CreatorProfile;