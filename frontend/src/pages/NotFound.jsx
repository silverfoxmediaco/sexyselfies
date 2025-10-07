import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Home, Search, ArrowLeft, Frown } from 'lucide-react';
import BottomNavigation from '../components/BottomNavigation';
import MainHeader from '../components/MainHeader';
import MainFooter from '../components/MainFooter';
import './NotFound.css';

const NotFound = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);
  const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 1024);

  // Detect viewport changes
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 1024);
      setIsDesktop(window.innerWidth >= 1024);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const suggestedPages = [
    {
      title: 'Browse Creators',
      description: 'Discover amazing content creators',
      path: '/member/browse-creators',
      icon: <Search size={24} />,
    },
    {
      title: 'Creator Registration',
      description: 'Start your creator journey',
      path: '/creator/register',
      icon: <Home size={24} />,
    },
    {
      title: 'Member Registration',
      description: 'Join our community',
      path: '/member/register',
      icon: <Home size={24} />,
    },
    {
      title: 'Contact Us',
      description: 'Get help from our support team',
      path: '/contact',
      icon: <Home size={24} />,
    },
  ];

  return (
    <div className="notfound-page">
      {/* Desktop Header */}
      {isDesktop && <MainHeader />}

      {/* Main Content */}
      <main className="notfound-content">
        {/* 404 Hero */}
        <div className="notfound-hero">
          <div className="notfound-icon">
            <Frown size={80} />
          </div>
          <h1 className="notfound-title">404</h1>
          <h2 className="notfound-subtitle">Page Not Found</h2>
          <p className="notfound-description">
            The page you're looking for doesn't exist or has been moved.
          </p>
          <p className="notfound-path">
            Requested path: <code>{location.pathname}</code>
          </p>
        </div>

        {/* Quick Actions */}
        <div className="notfound-actions">
          <button
            onClick={() => navigate(-1)}
            className="notfound-action-btn notfound-back-btn"
          >
            <ArrowLeft size={20} />
            Go Back
          </button>
          <button
            onClick={() => navigate('/')}
            className="notfound-action-btn notfound-home-btn"
          >
            <Home size={20} />
            Go Home
          </button>
        </div>

        {/* Suggested Pages */}
        <section className="notfound-suggestions">
          <h3>Suggested Pages</h3>
          <div className="notfound-suggestions-grid">
            {suggestedPages.map((page, index) => (
              <button
                key={index}
                onClick={() => navigate(page.path)}
                className="notfound-suggestion-card"
              >
                <div className="notfound-suggestion-icon">{page.icon}</div>
                <div className="notfound-suggestion-content">
                  <h4>{page.title}</h4>
                  <p>{page.description}</p>
                </div>
              </button>
            ))}
          </div>
        </section>

        {/* Help Section */}
        <section className="notfound-help">
          <h3>Need Help?</h3>
          <p>
            If you believe this is an error or need assistance, please contact our
            support team.
          </p>
          <button
            onClick={() => navigate('/contact')}
            className="notfound-contact-btn"
          >
            Contact Support
          </button>
        </section>
      </main>

      {/* Desktop Footer */}
      {isDesktop && <MainFooter />}

      {/* Mobile Bottom Navigation */}
      {isMobile && <BottomNavigation userRole="guest" />}
    </div>
  );
};

export default NotFound;
