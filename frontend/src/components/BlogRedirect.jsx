import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

/**
 * BlogRedirect - Handles 301 redirects for old WordPress blog URLs
 *
 * Old structure: sexyselfies.com/:slug/
 * New structure: sexyselfies.com/blog/:slug
 *
 * This component checks if a slug matches a blog post and redirects to /blog/:slug
 */

const BlogRedirect = () => {
  const { slug } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    const checkAndRedirect = async () => {
      try {
        const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5002';

        // Check if this slug exists as a blog post
        const response = await fetch(`${API_BASE}/blog/${slug}`);
        const data = await response.json();

        if (data.success && data.post) {
          // Blog post exists - redirect to new URL structure
          console.log(`Redirecting /${slug} → /blog/${slug}`);
          navigate(`/blog/${slug}`, { replace: true });
        } else {
          // Not a blog post - show 404
          navigate('/404', { replace: true });
        }
      } catch (error) {
        console.error('Error checking blog post:', error);
        // On error, try redirecting to blog anyway (benefit of the doubt)
        navigate(`/blog/${slug}`, { replace: true });
      }
    };

    checkAndRedirect();
  }, [slug, navigate]);

  // Show loading state while checking
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      background: '#0a0a0a',
      color: '#ffffff',
      fontFamily: 'Poppins, sans-serif'
    }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{
          width: '50px',
          height: '50px',
          border: '4px solid #2a2a2c',
          borderTopColor: '#17d2c2',
          borderRadius: '50%',
          margin: '0 auto 20px',
          animation: 'spin 0.8s linear infinite'
        }}></div>
        <p>Redirecting...</p>
        <style>{`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    </div>
  );
};

export default BlogRedirect;
