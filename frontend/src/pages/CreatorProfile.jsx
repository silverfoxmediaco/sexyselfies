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
          {/* Profile Header - FIXED: No duplicate header actions */}
          <div className='profile-header'>
            {/* Cover Photo */}
            <div className='cover-photo-container'>
              {(creator.coverImage &&
                creator.coverImage !== 'default-cover.jpg' &&
                creator.coverImage !== '' &&
                (creator.coverImage.startsWith('http') || creator.coverImage.startsWith('data:'))) ||
              (creator.coverImagePreview &&
                creator.coverImagePreview.startsWith('data:')) ? (
                <img
                  src={creator.coverImage || creator.coverImagePreview}
                  alt='Cover'
                  className='cover-photo'
                />
              ) : (
                <div className='cover-photo placeholder-cover'></div>
              )}
              <div className='cover-overlay'></div>

              {/* Floating Action Buttons - Mobile Only */}
              {isMobile && (
                <div className='floating-header-actions'>
                  <button
                    className='floating-action-btn back-btn'
                    onClick={() => navigate(-1)}
                  >
                    <ArrowLeft size={20} />
                  </button>
                  <div className='floating-actions-right'>
                    <button
                      className='floating-action-btn'
                      onClick={() => setShowShareMenu(!showShareMenu)}
                    >
                      <Share2 size={20} />
                    </button>
                    <button
                      className='floating-action-btn'
                      onClick={() => setShowMoreMenu(!showMoreMenu)}
                    >
                      <MoreVertical size={20} />
                    </button>
                  </div>
                </div>
              )}

              {/* Profile Info Overlay - Moved to bottom of cover to save space */}
              <div className='profile-info-overlay'>
                <div className='profile-avatar-section'>
                  <div className='profile-avatar'>
                    {(creator.profileImage &&
                      creator.profileImage !== 'default-avatar.jpg' &&
                      creator.profileImage !== '' &&
                      (creator.profileImage.startsWith('http') || creator.profileImage.startsWith('data:'))) ||
                    (creator.profilePhotoPreview &&
                      creator.profilePhotoPreview.startsWith('data:')) ? (
                      <img
                        src={creator.profileImage || creator.profilePhotoPreview}
                        alt={creator.displayName}
                      />
                    ) : (
                      <div className='avatar-placeholder'>
                        <Camera size={32} />
                      </div>
                    )}
                    {creator.isOnline && (
                      <span className='online-indicator'></span>
                    )}
                  </div>
                </div>

                <div className='profile-details'>
                  <div className='profile-name-section'>
                    <h1 className='profile-name'>
                      {creator.displayName}
                      {creator.verified && (
                        <Shield className='verified-icon' size={20} />
                      )}
                    </h1>
                    <span className='profile-username'>
                      @{creator.username}
                    </span>
                  </div>

                  <p className='profile-bio'>{creator.bio}</p>

                  <div className='profile-meta'>
                    <span className='meta-item'>
                      <MapPin size={14} />
                      {creator.location?.country || 'Location not specified'}
                    </span>
                    <span className='meta-item'>
                      <Clock size={14} />
                      {creator.isOnline
                        ? 'Online now'
                        : `Active ${getTimeAgo(creator.lastActive)}`}
                    </span>
                    {creator.createdAt && (
                      <span className='meta-item'>
                        <Calendar size={14} />
                        Joined{' '}
                        {new Date(creator.createdAt).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>

                <div className='profile-actions'>
                  <button
                    className={`follow-btn ${isFollowing ? 'following' : ''}`}
                    onClick={handleFollow}
                  >
                    {isFollowing ? (
                      <>
                        <CheckCircle size={18} />
                        <span>Connected</span>
                      </>
                    ) : (
                      <>
                        <Bell size={18} />
                        <span>Connect</span>
                      </>
                    )}
                  </button>

                  <button
                    className={`like-btn ${hasMatched ? 'matched' : ''}`}
                    onClick={handleLike}
                  >
                    <Heart
                      size={18}
                      fill={hasMatched ? 'currentColor' : 'none'}
                    />
                  </button>

                  <button
                    className='message-btn'
                    onClick={handleMessage}
                    disabled={!hasMatched}
                  >
                    <MessageCircle size={18} />
                  </button>
                </div>
              </div>
            </div>
          </div>

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
                    Locked (
                    {content.filter(c => c.isLocked && !c.isPurchased).length})
                  </button>
                </div>

                {/* Content Grid */}
                <div className='content-grid'>
                  {getFilteredContent().map(item => (
                    <motion.div
                      key={item.id}
                      className={`content-item ${item.isLocked && !item.isPurchased ? 'locked' : ''}`}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => {
                        if (item.isLocked && !item.isPurchased) {
                          setSelectedContent(item);
                          setShowPurchaseModal(true);
                        } else {
                          // Free content or purchased content - show full view
                          setSelectedContent(item);
                          setShowImageGallery(true);
                        }
                      }}
                    >
                      <div className='content-thumbnail'>
                        {item.thumbnail &&
                        (item.thumbnail.startsWith('http') || item.thumbnail.startsWith('data:')) ? (
                          <img
                            src={item.thumbnail}
                            alt={item.title}
                            className={
                              item.isLocked && !item.isPurchased ? 'blurred' : ''
                            }
                          />
                        ) : (
                          <div className='content-placeholder'>
                            {item.type === 'photo' ? (
                              <Camera size={24} />
                            ) : (
                              <Video size={24} />
                            )}
                          </div>
                        )}

                        {/* Content Type Indicator */}
                        {item.type === 'video' && (
                          <div className='content-type-indicator'>
                            <Play size={20} />
                            <span>{item.duration}</span>
                          </div>
                        )}

                        {/* Lock Overlay */}
                        {item.isLocked && !item.isPurchased && (
                          <div className='lock-overlay'>
                            <Lock size={24} />
                            <span className='content-price'>${item.price}</span>
                          </div>
                        )}

                        {/* Purchased Badge */}
                        {item.isPurchased && (
                          <div className='purchased-badge'>
                            <CheckCircle size={16} />
                          </div>
                        )}

                        {/* Free Badge */}
                        {!item.isLocked && !item.isPurchased && (
                          <div className='free-badge'>FREE</div>
                        )}
                      </div>

                      <div className='content-info'>
                        <span className='content-likes'>
                          <Heart size={12} />
                          {item.likes}
                        </span>
                        <span className='content-date'>
                          {new Date(item.date).toLocaleDateString()}
                        </span>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </>
            )}

            {activeTab === 'about' && (
              <div className='about-section'>
                <div className='about-group'>
                  <h3>Details</h3>
                  <div className='about-items'>
                    <div className='about-item'>
                      <span className='about-label'>Age</span>
                      <span className='about-value'>{creator.age}</span>
                    </div>
                    <div className='about-item'>
                      <span className='about-label'>Orientation</span>
                      <span className='about-value'>{creator.orientation}</span>
                    </div>
                    <div className='about-item'>
                      <span className='about-label'>Gender</span>
                      <span className='about-value'>{creator.gender}</span>
                    </div>
                    <div className='about-item'>
                      <span className='about-label'>Body Type</span>
                      <span className='about-value'>{creator.bodyType}</span>
                    </div>
                    <div className='about-item'>
                      <span className='about-label'>Ethnicity</span>
                      <span className='about-value'>{creator.ethnicity}</span>
                    </div>
                    <div className='about-item'>
                      <span className='about-label'>Height</span>
                      <span className='about-value'>{creator.height}</span>
                    </div>
                  </div>
                </div>

                <div className='about-group'>
                  <h3>Activity</h3>
                  <div className='activity-info'>
                    <span className='online-status'>
                      {creator.isOnline ? (
                        <>🟢 Online now</>
                      ) : (
                        <>
                          ⚫ Last online:{' '}
                          {creator.lastActive
                            ? getTimeAgo(new Date(creator.lastActive))
                            : 'Unknown'}
                        </>
                      )}
                    </span>
                  </div>
                </div>
              </div>
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
                      {creator.stats.reviewCount} reviews
                    </span>
                  </div>
                </div>

                <div className='reviews-list'>
                  <p className='reviews-placeholder'>Reviews coming soon...</p>
                </div>
              </div>
            )}
          </div>

          {/* Content Gallery Modal */}
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
                          // Toggle like
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
                          // Download content
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
                        controls
                        className='content-media'
                        poster={selectedContent.thumbnail}
                      >
                        <source src={selectedContent.url || selectedContent.thumbnail} type="video/mp4" />
                        Your browser does not support the video tag.
                      </video>
                    ) : (
                      <img
                        src={selectedContent.url || selectedContent.thumbnail}
                        alt={selectedContent.title}
                        className='content-media'
                      />
                    )}
                  </div>

                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Purchase Modal */}
          <AnimatePresence>
            {showPurchaseModal && selectedContent && (
              <motion.div
                className='purchase-modal-overlay'
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowPurchaseModal(false)}
              >
                <motion.div
                  className='purchase-modal'
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.9, opacity: 0 }}
                  onClick={e => e.stopPropagation()}
                >
                  <button
                    className='modal-close'
                    onClick={() => setShowPurchaseModal(false)}
                  >
                    <X size={24} />
                  </button>

                  <div className='purchase-content'>
                    <div className='purchase-preview'>
                      {selectedContent.thumbnail &&
                      (selectedContent.thumbnail.startsWith('http') || selectedContent.thumbnail.startsWith('data:')) ? (
                        <img
                          src={selectedContent.thumbnail}
                          alt={selectedContent.title}
                          className='blurred'
                        />
                      ) : (
                        <div className='content-placeholder blurred'>
                          {selectedContent.type === 'photo' ? (
                            <Camera size={48} />
                          ) : (
                            <Video size={48} />
                          )}
                        </div>
                      )}
                      <div className='unlock-icon'>
                        <Unlock size={32} />
                      </div>
                    </div>

                    <h3 className='purchase-title'>Unlock This Content</h3>
                    <p className='purchase-description'>
                      {selectedContent.title}
                    </p>

                    <div className='purchase-details'>
                      <div className='detail-item'>
                        <span className='detail-label'>Type</span>
                        <span className='detail-value'>
                          {selectedContent.type === 'photo' ? (
                            <>
                              <Camera size={14} /> Photo
                            </>
                          ) : (
                            <>
                              <Video size={14} /> Video
                            </>
                          )}
                        </span>
                      </div>
                      {selectedContent.duration && (
                        <div className='detail-item'>
                          <span className='detail-label'>Duration</span>
                          <span className='detail-value'>
                            {selectedContent.duration}
                          </span>
                        </div>
                      )}
                      <div className='detail-item'>
                        <span className='detail-label'>Quality</span>
                        <span className='detail-value'>
                          {selectedContent.resolution}
                        </span>
                      </div>
                    </div>

                    <div className='purchase-price'>
                      <span className='price-label'>Price</span>
                      <span className='price-value'>
                        ${selectedContent.price}
                      </span>
                    </div>

                    <div className='purchase-balance'>
                      <span className='balance-label'>Your balance</span>
                      <span
                        className={`balance-value ${userCredits < selectedContent.price ? 'insufficient' : ''}`}
                      >
                        {userCredits} credits
                      </span>
                    </div>

                    <div className='purchase-actions'>
                      <button
                        className='cancel-btn'
                        onClick={() => setShowPurchaseModal(false)}
                      >
                        Cancel
                      </button>
                      <button
                        className='unlock-btn'
                        onClick={() => handlePurchaseContent(selectedContent)}
                        disabled={userCredits < selectedContent.price}
                      >
                        <Unlock size={18} />
                        Unlock for ${selectedContent.price}
                      </button>
                    </div>

                    {userCredits < selectedContent.price && (
                      <button className='add-credits-btn'>
                        <DollarSign size={16} />
                        Add Credits
                      </button>
                    )}
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Share Menu */}
          <AnimatePresence>
            {showShareMenu && (
              <motion.div
                className='share-menu'
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                <button className='share-option'>
                  <Link size={18} />
                  Copy Link
                </button>
                <button className='share-option'>
                  <Instagram size={18} />
                  Share to Instagram
                </button>
                <button className='share-option'>
                  <Twitter size={18} />
                  Share to Twitter
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* More Menu */}
          <AnimatePresence>
            {showMoreMenu && (
              <motion.div
                className='more-menu'
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                <button className='more-option'>
                  <Flag size={18} />
                  Report Profile
                </button>
                <button className='more-option'>
                  <UserX size={18} />
                  Block User
                </button>
                <button className='more-option'>
                  <BellOff size={18} />
                  Mute Notifications
                </button>
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
