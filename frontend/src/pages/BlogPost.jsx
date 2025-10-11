import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import BottomNavigation from '../components/BottomNavigation';
import MainHeader from '../components/MainHeader';
import MainFooter from '../components/MainFooter';
import './BlogPost.css';

/**
 * BlogPost.jsx - Individual Blog Post Page
 *
 * Displays a single blog post with full content, likes, and related posts.
 * Includes comprehensive SEO meta tags for search engines and social media.
 */

const BlogPost = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [post, setPost] = useState(null);
  const [relatedPosts, setRelatedPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [liked, setLiked] = useState(false);

  const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5002';

  useEffect(() => {
    fetchPost();
    window.scrollTo(0, 0);
  }, [slug]);

  useEffect(() => {
    if (post) {
      fetchRelatedPosts();
    }
  }, [post]);

  const fetchPost = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE}/blog/${slug}`);
      const data = await response.json();

      if (data.success) {
        setPost(data.post);
        // Check if user has already liked this post
        const likedPosts = JSON.parse(localStorage.getItem('likedPosts') || '[]');
        setLiked(likedPosts.includes(data.post._id));
      } else {
        setError('Blog post not found');
      }
    } catch (err) {
      console.error('Error fetching post:', err);
      setError('Failed to load blog post. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const fetchRelatedPosts = async () => {
    try {
      const response = await fetch(
        `${API_BASE}/blog/category/${post.category}?limit=3`
      );
      const data = await response.json();

      if (data.success) {
        // Filter out current post
        const filtered = data.posts.filter(p => p.slug !== slug);
        setRelatedPosts(filtered);
      }
    } catch (err) {
      console.error('Error fetching related posts:', err);
    }
  };

  const handleLike = async () => {
    if (liked) return; // Already liked

    try {
      const response = await fetch(`${API_BASE}/blog/${slug}/like`, {
        method: 'POST',
      });
      const data = await response.json();

      if (data.success) {
        // Update local state
        setPost({ ...post, likes: data.likes });
        setLiked(true);

        // Save to localStorage to prevent multiple likes
        const likedPosts = JSON.parse(localStorage.getItem('likedPosts') || '[]');
        likedPosts.push(post._id);
        localStorage.setItem('likedPosts', JSON.stringify(likedPosts));
      }
    } catch (err) {
      console.error('Error liking post:', err);
    }
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator
        .share({
          title: post.title,
          text: post.excerpt,
          url: window.location.href,
        })
        .catch(err => console.log('Error sharing:', err));
    } else {
      // Fallback: Copy to clipboard
      navigator.clipboard.writeText(window.location.href);
      alert('Link copied to clipboard!');
    }
  };

  const shareToSocial = (platform) => {
    const url = encodeURIComponent(window.location.href);
    const title = encodeURIComponent(post.title);
    const text = encodeURIComponent(post.excerpt || post.title);

    const shareUrls = {
      twitter: `https://twitter.com/intent/tweet?url=${url}&text=${title}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${url}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${url}`,
      reddit: `https://reddit.com/submit?url=${url}&title=${title}`,
      email: `mailto:?subject=${title}&body=${text}%20${url}`,
    };

    if (shareUrls[platform]) {
      window.open(shareUrls[platform], '_blank', 'width=600,height=400');
    }
  };

  const copyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    alert('Link copied to clipboard!');
  };

  const formatDate = dateString => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="BlogPost-container">
        <div className="BlogPost-loading">
          <div className="BlogPost-spinner"></div>
          <p>Loading post...</p>
        </div>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="BlogPost-container">
        <div className="BlogPost-error">
          <h2>Post Not Found</h2>
          <p>{error || 'The blog post you are looking for does not exist.'}</p>
          <button onClick={() => navigate('/blog')} className="BlogPost-backBtn">
            Back to Blog
          </button>
        </div>
      </div>
    );
  }

  // Generate structured data for rich snippets
  const generateStructuredData = () => {
    return {
      '@context': 'https://schema.org',
      '@type': 'BlogPosting',
      headline: post.title,
      description: post.excerpt || post.title,
      image: post.featuredImage || 'https://sexyselfies.com/og-image.jpg',
      datePublished: post.publishDate,
      dateModified: post.modifiedDate || post.publishDate,
      author: {
        '@type': 'Person',
        name: post.author.name,
      },
      publisher: {
        '@type': 'Organization',
        name: 'SexySelfies',
        logo: {
          '@type': 'ImageObject',
          url: 'https://sexyselfies.com/logo.png',
        },
      },
      mainEntityOfPage: {
        '@type': 'WebPage',
        '@id': `https://sexyselfies.com/blog/${post.slug}`,
      },
    };
  };

  // Generate breadcrumb structured data (invisible, SEO only)
  const generateBreadcrumbData = () => {
    return {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        {
          '@type': 'ListItem',
          position: 1,
          name: 'Home',
          item: 'https://sexyselfies.com',
        },
        {
          '@type': 'ListItem',
          position: 2,
          name: 'Blog',
          item: 'https://sexyselfies.com/blog',
        },
        {
          '@type': 'ListItem',
          position: 3,
          name: post.category,
          item: `https://sexyselfies.com/blog/category/${post.category.toLowerCase().replace(/\s+/g, '-')}`,
        },
        {
          '@type': 'ListItem',
          position: 4,
          name: post.title,
          item: `https://sexyselfies.com/blog/${post.slug}`,
        },
      ],
    };
  };

  return (
    <>
      {/* Desktop Header */}
      <MainHeader />

      <div className="BlogPost-container">
        {/* SEO Meta Tags */}
        <Helmet>
        {/* Primary Meta Tags */}
        <title>{post.title} | SexySelfies Blog</title>
        <meta name="title" content={`${post.title} | SexySelfies Blog`} />
        <meta name="description" content={post.excerpt || post.title} />
        <meta name="keywords" content={post.tags.join(', ')} />
        <meta name="author" content={post.author.name} />

        {/* Canonical URL */}
        <link rel="canonical" href={`https://sexyselfies.com/blog/${post.slug}`} />

        {/* Open Graph / Facebook */}
        <meta property="og:type" content="article" />
        <meta property="og:url" content={`https://sexyselfies.com/blog/${post.slug}`} />
        <meta property="og:title" content={post.title} />
        <meta property="og:description" content={post.excerpt || post.title} />
        <meta property="og:image" content={post.featuredImage || 'https://sexyselfies.com/og-image.jpg'} />
        <meta property="og:site_name" content="SexySelfies" />
        <meta property="article:published_time" content={post.publishDate} />
        <meta property="article:modified_time" content={post.modifiedDate || post.publishDate} />
        <meta property="article:author" content={post.author.name} />
        <meta property="article:section" content={post.category} />
        {post.tags.map(tag => (
          <meta key={tag} property="article:tag" content={tag} />
        ))}

        {/* Twitter */}
        <meta property="twitter:card" content="summary_large_image" />
        <meta property="twitter:url" content={`https://sexyselfies.com/blog/${post.slug}`} />
        <meta property="twitter:title" content={post.title} />
        <meta property="twitter:description" content={post.excerpt || post.title} />
        <meta property="twitter:image" content={post.featuredImage || 'https://sexyselfies.com/og-image.jpg'} />

        {/* Structured Data (JSON-LD) */}
        <script type="application/ld+json">
          {JSON.stringify(generateStructuredData())}
        </script>

        {/* Breadcrumb Structured Data (invisible, SEO only) */}
        <script type="application/ld+json">
          {JSON.stringify(generateBreadcrumbData())}
        </script>
      </Helmet>

      {/* Hero Section with Featured Image Background */}
      <div
        className="BlogPost-hero"
        style={{
          backgroundImage: post.featuredImage
            ? `linear-gradient(rgba(10, 10, 10, 0.6), rgba(10, 10, 10, 0.8)), url(${post.featuredImage})`
            : 'linear-gradient(135deg, #12b7ab 0%, #17d2c2 50%, #47e0d2 100%)'
        }}
      >
        {/* Back Button */}
        <div className="BlogPost-heroNav">
          <button onClick={() => navigate('/blog')} className="BlogPost-navBtn">
            <svg
              width="20"
              height="20"
              viewBox="0 0 20 20"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M12 5L7 10L12 15"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            Back to Blog
          </button>
        </div>

        {/* Hero Content */}
        <div className="BlogPost-heroContent">
          <div className="BlogPost-categoryBadge">{post.category}</div>
          <h1 className="BlogPost-heroTitle">{post.title}</h1>

          <div className="BlogPost-heroMeta">
            <div className="BlogPost-metaItem">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M8 8a3 3 0 100-6 3 3 0 000 6zM14 13c0-2.21-2.69-4-6-4s-6 1.79-6 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
              <span>{post.author.name}</span>
            </div>
            <div className="BlogPost-metaItem">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <rect x="2" y="3" width="12" height="11" rx="2" stroke="currentColor" strokeWidth="1.5"/>
                <path d="M2 6h12M5 1v2M11 1v2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
              <span>{formatDate(post.publishDate)}</span>
            </div>
            <div className="BlogPost-metaItem">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M8 3c2.76 0 5 1.79 5 4s-2.24 4-5 4a5.72 5.72 0 01-2.24-.45L3 11l.45-2.76A3.92 3.92 0 013 7c0-2.21 2.24-4 5-4z" stroke="currentColor" strokeWidth="1.5"/>
              </svg>
              <span>{post.views} views</span>
            </div>
            <div className="BlogPost-metaItem">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M8 14s-5-3.5-5-7a4.5 4.5 0 019 0c0 3.5-5 7-5 7z" stroke="currentColor" strokeWidth="1.5"/>
              </svg>
              <span>{post.likes} likes</span>
            </div>
          </div>
        </div>
      </div>

      {/* Article */}
      <article className="BlogPost-article">

        {/* Content */}
        <div className="BlogPost-content">
          <div dangerouslySetInnerHTML={{ __html: post.content }} />
        </div>

        {/* Tags */}
        {post.tags && post.tags.length > 0 && (
          <div className="BlogPost-tags">
            {post.tags.map((tag, index) => (
              <span key={index} className="BlogPost-tag">
                #{tag}
              </span>
            ))}
          </div>
        )}

        {/* End of Article CTA */}
        <div className="BlogPost-ctaEnd">
          <div className="BlogPost-ctaEndCard">
            <div className="BlogPost-ctaEndContent">
              <h2 className="BlogPost-ctaEndTitle">Love What You Read?</h2>
              <p className="BlogPost-ctaEndText">
                Join SexySelfies today and discover exclusive content from amazing creators.
                Whether you're here to create or connect, your journey starts now.
              </p>
              <div className="BlogPost-ctaEndButtons">
                <button
                  onClick={() => navigate('/')}
                  className="BlogPost-ctaEndButton primary"
                >
                  Become a Member
                </button>
                <button
                  onClick={() => navigate('/blog')}
                  className="BlogPost-ctaEndButton secondary"
                >
                  Read More Articles
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Like & Share Section */}
        <div className="BlogPost-engagement">
          {/* Like Button */}
          <button
            onClick={handleLike}
            className={`BlogPost-likeBtn ${liked ? 'liked' : ''}`}
            disabled={liked}
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill={liked ? 'currentColor' : 'none'}
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
                stroke="currentColor"
                strokeWidth="2"
              />
            </svg>
            {liked ? 'Liked' : 'Like'}
          </button>

          {/* Share This Article */}
          <div className="BlogPost-shareSection">
            <span className="BlogPost-shareLabel">Share:</span>
            <div className="BlogPost-socialIcons">
              <button
                onClick={() => shareToSocial('twitter')}
                className="BlogPost-socialBtn BlogPost-twitter"
                aria-label="Share on Twitter"
              >
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z" />
                </svg>
              </button>

              <button
                onClick={() => shareToSocial('facebook')}
                className="BlogPost-socialBtn BlogPost-facebook"
                aria-label="Share on Facebook"
              >
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                </svg>
              </button>

              <button
                onClick={() => shareToSocial('linkedin')}
                className="BlogPost-socialBtn BlogPost-linkedin"
                aria-label="Share on LinkedIn"
              >
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                </svg>
              </button>

              <button
                onClick={() => shareToSocial('reddit')}
                className="BlogPost-socialBtn BlogPost-reddit"
                aria-label="Share on Reddit"
              >
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 0 1 .042.52c0 2.694-3.13 4.87-7.004 4.87-3.874 0-7.004-2.176-7.004-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 0 1 4.028 12c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.49 1.207-.883 2.878-1.43 4.744-1.487l.885-4.182a.342.342 0 0 1 .14-.197.35.35 0 0 1 .238-.042l2.906.617a1.214 1.214 0 0 1 1.108-.701zM9.25 12C8.561 12 8 12.562 8 13.25c0 .687.561 1.248 1.25 1.248.687 0 1.248-.561 1.248-1.249 0-.688-.561-1.249-1.249-1.249zm5.5 0c-.687 0-1.248.561-1.248 1.25 0 .687.561 1.248 1.249 1.248.688 0 1.249-.561 1.249-1.249 0-.687-.562-1.249-1.25-1.249zm-5.466 3.99a.327.327 0 0 0-.231.094.33.33 0 0 0 0 .463c.842.842 2.484.913 2.961.913.477 0 2.105-.056 2.961-.913a.361.361 0 0 0 .029-.463.33.33 0 0 0-.464 0c-.547.533-1.684.73-2.512.73-.828 0-1.979-.196-2.512-.73a.326.326 0 0 0-.232-.095z" />
                </svg>
              </button>

              <button
                onClick={() => shareToSocial('email')}
                className="BlogPost-socialBtn BlogPost-email"
                aria-label="Share via Email"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </button>

              <button
                onClick={copyLink}
                className="BlogPost-socialBtn BlogPost-copy"
                aria-label="Copy Link"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </article>

      {/* Related Posts */}
      {relatedPosts.length > 0 && (
        <section className="BlogPost-relatedSection">
          <h3 className="BlogPost-relatedTitle">Related Articles</h3>
          <div className="BlogPost-relatedGrid">
            {relatedPosts.map(relatedPost => (
              <Link
                key={relatedPost._id}
                to={`/blog/${relatedPost.slug}`}
                className="BlogPost-relatedCard"
              >
                {relatedPost.featuredImage && (
                  <div className="BlogPost-relatedImage">
                    <img src={relatedPost.featuredImage} alt={relatedPost.title} />
                  </div>
                )}
                <div className="BlogPost-relatedContent">
                  <span className="BlogPost-relatedCategory">
                    {relatedPost.category}
                  </span>
                  <h4 className="BlogPost-relatedCardTitle">{relatedPost.title}</h4>
                  <p className="BlogPost-relatedDate">
                    {formatDate(relatedPost.publishDate)}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

        {/* Bottom Navigation for Mobile */}
        <BottomNavigation />
      </div>

      {/* Desktop Footer */}
      <MainFooter />
    </>
  );
};

export default BlogPost;
