import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Heart, Share2, Download, 
  Calendar, DollarSign, User, Eye,
  Video, Image as ImageIcon, AlertCircle, Lock
} from 'lucide-react';
import MainHeader from '../components/MainHeader';
import MainFooter from '../components/MainFooter';
import CreatorMainHeader from '../components/CreatorMainHeader';
import CreatorMainFooter from '../components/CreatorMainFooter';
import BottomNavigation from '../components/BottomNavigation';
import { useIsDesktop, useIsMobile, getUserRole } from '../utils/mobileDetection';
import contentService from '../services/content.service';
import './ContentView.css';

const ContentView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isDesktop = useIsDesktop();
  const isMobile = useIsMobile();
  const userRole = getUserRole();
  
  const [content, setContent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentMediaIndex, setCurrentMediaIndex] = useState(0);
  const [liked, setLiked] = useState(false);
  const [hasAccess, setHasAccess] = useState(false);

  // Determine which header/footer to use based on user role
  const Header = userRole === 'creator' ? CreatorMainHeader : MainHeader;
  const Footer = userRole === 'creator' ? CreatorMainFooter : MainFooter;

  useEffect(() => {
    loadContent();
  }, [id]);

  const loadContent = async () => {
    try {
      setLoading(true);
      const response = await contentService.getContentById(id);

      // Handle different possible response structures
      const contentData = response.data?.content || response.data || response;
      const hasAccessData = response.data?.hasAccess ?? true; // Default to true if not specified

      if (!contentData) {
        throw new Error('No content data received');
      }

      setContent(contentData);
      setHasAccess(hasAccessData);
      setLiked(contentData.isLiked || false);
    } catch (error) {
      console.error('Error loading content:', error);
      setError('Content not found or access denied');
    } finally {
      setLoading(false);
    }
  };

  const handleShare = async () => {
    const shareUrl = window.location.href;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: content?.title || 'Check out this content!',
          text: `Check out "${content?.title}" on SexySelfies`,
          url: shareUrl
        });
      } catch (error) {
        copyToClipboard(shareUrl);
      }
    } else {
      copyToClipboard(shareUrl);
    }
  };

  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      alert('Link copied to clipboard!');
    } catch (error) {
      const textArea = document.createElement('textarea');
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      alert('Link copied to clipboard!');
    }
  };

  const handleLike = async () => {
    try {
      if (liked) {
        await contentService.unlikeContent(id);
        setLiked(false);
      } else {
        await contentService.likeContent(id);
        setLiked(true);
      }
    } catch (error) {
      console.error('Error toggling like:', error);
    }
  };

  const handleUnlock = async () => {
    try {
      await contentService.unlockContent(id);
      setHasAccess(true);
      loadContent(); // Reload to get full content
    } catch (error) {
      console.error('Error unlocking content:', error);
      alert('Failed to unlock content. Please try again.');
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatPrice = (price) => {
    return price === 0 ? 'Free' : `$${price.toFixed(2)}`;
  };

  const nextMedia = () => {
    if (content?.media && currentMediaIndex < content.media.length - 1) {
      setCurrentMediaIndex(currentMediaIndex + 1);
    }
  };

  const previousMedia = () => {
    if (currentMediaIndex > 0) {
      setCurrentMediaIndex(currentMediaIndex - 1);
    }
  };

  if (loading) {
    return (
      <div className="content-view-container">
        <Header />
        <div className="content-view-loading">
          <div className="content-view-spinner"></div>
          <p>Loading content...</p>
        </div>
        {isMobile && userRole === 'creator' ? <BottomNavigation /> : isMobile && <Footer />}
        {isDesktop && <Footer />}
      </div>
    );
  }

  if (error || !content) {
    return (
      <div className="content-view-container">
        <Header />
        <div className="content-view-error">
          <AlertCircle size={48} />
          <h2>Content Not Found</h2>
          <p>{error || 'This content may have been removed or is not available.'}</p>
          <button 
            onClick={() => navigate(-1)}
            className="content-view-back-btn"
          >
            Go Back
          </button>
        </div>
        {isMobile && userRole === 'creator' ? <BottomNavigation /> : isMobile && <Footer />}
        {isDesktop && <Footer />}
      </div>
    );
  }

  const currentMedia = content.media?.[currentMediaIndex];

  return (
    <div className="content-view-container">
      <Header />
      
      <div className={`content-view-main ${isDesktop ? 'content-view-desktop' : ''}`}>
        {/* Header */}
        <div className="content-view-header">
          <button 
            onClick={() => navigate(-1)}
            className="content-view-back-button"
          >
            <ArrowLeft size={20} />
          </button>
          
          <div className="content-view-actions">
            <button 
              onClick={handleLike}
              className={`content-view-action-btn ${liked ? 'content-view-liked' : ''}`}
              title="Like"
            >
              <Heart size={20} fill={liked ? '#EF4444' : 'none'} />
            </button>
            
            <button 
              onClick={handleShare}
              className="content-view-action-btn"
              title="Share"
            >
              <Share2 size={20} />
            </button>
          </div>
        </div>

        {/* Media Section */}
        <div className="content-view-media-section">
          {hasAccess ? (
            <div className="content-view-media-container">
              {currentMedia && (
                <>
                  {currentMedia.type === 'photo' ? (
                    <img 
                      src={currentMedia.url}
                      alt={content.title}
                      className="content-view-media"
                    />
                  ) : (
                    <video 
                      src={currentMedia.url}
                      controls
                      className="content-view-media"
                      poster={currentMedia.thumbnail}
                    />
                  )}
                  
                  {/* Media navigation */}
                  {content.media.length > 1 && (
                    <div className="content-view-media-nav">
                      <button 
                        onClick={previousMedia}
                        disabled={currentMediaIndex === 0}
                        className="content-view-nav-btn content-view-nav-prev"
                      >
                        ‹
                      </button>
                      
                      <div className="content-view-media-counter">
                        {currentMediaIndex + 1} / {content.media.length}
                      </div>
                      
                      <button 
                        onClick={nextMedia}
                        disabled={currentMediaIndex === content.media.length - 1}
                        className="content-view-nav-btn content-view-nav-next"
                      >
                        ›
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          ) : (
            /* Locked content preview */
            <div className="content-view-locked">
              <div className="content-view-preview">
                {currentMedia && (
                  <div className="content-view-preview-container">
                    <img 
                      src={currentMedia.thumbnail || currentMedia.url}
                      alt={content.title}
                      className="content-view-preview-image"
                    />
                    <div className="content-view-blur-overlay">
                      <Lock size={48} />
                      <p>Unlock to view full content</p>
                    </div>
                  </div>
                )}
              </div>
              
              <div className="content-view-unlock-section">
                <h3>Unlock this content</h3>
                <div className="content-view-price">
                  {formatPrice(content.price)}
                </div>
                <button 
                  onClick={handleUnlock}
                  className="content-view-unlock-btn"
                  disabled={content.price === 0}
                >
                  {content.price === 0 ? 'Free Content' : 'Unlock Now'}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Content Info */}
        <div className="content-view-info">
          <div className="content-view-title-section">
            <h1 className="content-view-title">{content.title}</h1>
            
            <div className="content-view-meta">
              <div className="content-view-creator">
                <User size={16} />
                <span>{content.creator?.displayName || 'Creator'}</span>
              </div>
              
              <div className="content-view-date">
                <Calendar size={16} />
                <span>{formatDate(content.createdAt)}</span>
              </div>
              
              <div className="content-view-type">
                {currentMedia?.type === 'photo' ? <ImageIcon size={16} /> : <Video size={16} />}
                <span>{content.media?.length || 1} {content.media?.length === 1 ? 'item' : 'items'}</span>
              </div>
              
              <div className="content-view-views">
                <Eye size={16} />
                <span>{content.views || 0} views</span>
              </div>
            </div>
          </div>

          {content.description && (
            <div className="content-view-description">
              <h3>Description</h3>
              <p>{content.description}</p>
            </div>
          )}

          {content.tags && content.tags.length > 0 && (
            <div className="content-view-tags">
              <h3>Tags</h3>
              <div className="content-view-tag-list">
                {content.tags.map((tag, index) => (
                  <span key={index} className="content-view-tag">
                    #{tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="content-view-pricing">
            <div className="content-view-price-info">
              <DollarSign size={16} />
              <span>Price: {formatPrice(content.price)}</span>
            </div>
          </div>
        </div>
      </div>

      {isMobile && userRole === 'creator' ? <BottomNavigation /> : isMobile && <Footer />}
      {isDesktop && <Footer />}
    </div>
  );
};

export default ContentView;