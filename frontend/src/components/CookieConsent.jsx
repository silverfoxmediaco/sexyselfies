import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  Cookie,
  Settings,
  Shield,
  BarChart3,
  Target,
  Check,
  X,
  ChevronDown,
  ChevronUp,
  Info
} from 'lucide-react';
import {
  hasConsentBeenGiven,
  setCookieConsent,
  getCookieConsent,
  cookieCategories,
  resetCookieConsent
} from '../utils/cookieManager';
import './CookieConsent.css';

// Legal text for GDPR/CCPA compliance
const legalText = {
  title: "Cookie Preferences",
  description: "We use cookies to enhance your experience, analyze site usage, and assist in our marketing efforts. By clicking 'Accept All', you consent to our use of cookies.",
  privacyLinkText: "Learn more in our Privacy Policy",
  acceptAll: "Accept All",
  rejectAll: "Reject All",
  customize: "Customize",
  savePreferences: "Save Preferences",
  requiredBadge: "Required",
  showDetails: "Show Details",
  hideDetails: "Hide Details",
  manageCookies: "Manage Cookie Preferences"
};

// Icons for cookie categories
const categoryIcons = {
  essential: Shield,
  functional: Settings,
  analytics: BarChart3,
  marketing: Target
};

const CookieConsent = () => {
  // Component state
  const [showBanner, setShowBanner] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [preferences, setPreferences] = useState({
    essential: true, // Always true and disabled
    functional: false,
    analytics: false,
    marketing: false
  });

  // Refs for accessibility
  const bannerRef = useRef(null);
  const previousFocusRef = useRef(null);

  // Check for existing consent on mount
  useEffect(() => {
    const checkExistingConsent = () => {
      if (!hasConsentBeenGiven()) {
        // Small delay to ensure page has loaded
        setTimeout(() => {
          setShowBanner(true);
          setIsAnimating(true);
        }, 1000);
      }
    };

    checkExistingConsent();
  }, []);

  // Focus management for accessibility
  useEffect(() => {
    if (showBanner && bannerRef.current) {
      // Store the previously focused element
      previousFocusRef.current = document.activeElement;

      // Focus the banner for screen readers
      bannerRef.current.focus();
    }

    return () => {
      // Restore focus when banner is hidden
      if (previousFocusRef.current && !showBanner) {
        previousFocusRef.current.focus();
      }
    };
  }, [showBanner]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!showBanner) return;

      // Escape key closes customization
      if (e.key === 'Escape' && showDetails) {
        setShowDetails(false);
      }

      // Tab trapping (basic implementation)
      if (e.key === 'Tab' && bannerRef.current) {
        const focusableElements = bannerRef.current.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        if (e.shiftKey && document.activeElement === firstElement) {
          e.preventDefault();
          lastElement.focus();
        } else if (!e.shiftKey && document.activeElement === lastElement) {
          e.preventDefault();
          firstElement.focus();
        }
      }
    };

    if (showBanner) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [showBanner, showDetails]);

  // Handle preference toggle
  const handlePreferenceToggle = (category) => {
    if (category === 'essential') return; // Cannot toggle essential cookies

    setPreferences(prev => ({
      ...prev,
      [category]: !prev[category]
    }));
  };

  // Handle Accept All
  const handleAcceptAll = () => {
    const allAccepted = {
      essential: true,
      functional: true,
      analytics: true,
      marketing: true
    };

    try {
      setCookieConsent(allAccepted);
      hideBanner();
    } catch (error) {
      console.error('Error saving cookie consent:', error);
      // Could show error message to user here
    }
  };

  // Handle Reject All
  const handleRejectAll = () => {
    const onlyEssential = {
      essential: true,
      functional: false,
      analytics: false,
      marketing: false
    };

    try {
      setCookieConsent(onlyEssential);
      hideBanner();
    } catch (error) {
      console.error('Error saving cookie consent:', error);
    }
  };

  // Handle Save Custom Preferences
  const handleSavePreferences = () => {
    try {
      setCookieConsent(preferences);
      hideBanner();
    } catch (error) {
      console.error('Error saving cookie consent:', error);
    }
  };

  // Toggle customization view
  const toggleCustomize = () => {
    setShowDetails(!showDetails);
  };

  // Hide banner with animation
  const hideBanner = () => {
    setIsAnimating(false);
    setTimeout(() => {
      setShowBanner(false);
      setShowDetails(false);
    }, 300);
  };

  // Reset consent (for testing - remove in production)
  const handleResetConsent = () => {
    if (process.env.NODE_ENV === 'development') {
      resetCookieConsent();
      setShowBanner(true);
      setIsAnimating(true);
      setShowDetails(false);
      setPreferences({
        essential: true,
        functional: false,
        analytics: false,
        marketing: false
      });
    }
  };

  // Don't render if banner shouldn't be shown
  if (!showBanner) {
    return (
      <>
        {/* Development reset button */}
        {process.env.NODE_ENV === 'development' && (
          <button
            onClick={handleResetConsent}
            className="cookie-dev-reset"
            title="Reset Cookie Consent (Dev Only)"
          >
            Reset Cookies
          </button>
        )}
      </>
    );
  }

  return (
    <>
      {/* Banner overlay for mobile accessibility */}
      <div
        className={`cookie-consent-overlay ${isAnimating ? 'show' : ''}`}
        onClick={() => setShowDetails(false)}
      />

      {/* Main cookie consent banner */}
      <div
        ref={bannerRef}
        className={`cookie-consent-banner ${isAnimating ? 'show' : ''}`}
        role="dialog"
        aria-labelledby="cookie-consent-title"
        aria-describedby="cookie-consent-description"
        tabIndex="-1"
      >
        <div className="cookie-consent-container">
          {/* Main content */}
          <div className="cookie-content">
            <div className="cookie-text">
              <div className="cookie-icon">
                <Cookie size={24} />
              </div>

              <div className="cookie-info">
                <h3 id="cookie-consent-title">{legalText.title}</h3>
                <p id="cookie-consent-description">
                  {legalText.description}
                  {' '}
                  <Link
                    to="/privacy"
                    className="cookie-privacy-link"
                    onClick={() => hideBanner()}
                  >
                    {legalText.privacyLinkText}
                  </Link>
                </p>
              </div>
            </div>

            {/* Action buttons - Equal prominence for GDPR compliance */}
            <div className="cookie-actions">
              <button
                type="button"
                className="cookie-btn cookie-btn-reject"
                onClick={handleRejectAll}
                aria-label="Reject all non-essential cookies"
              >
                {legalText.rejectAll}
              </button>

              <button
                type="button"
                className="cookie-btn cookie-btn-customize"
                onClick={toggleCustomize}
                aria-label={showDetails ? legalText.hideDetails : legalText.showDetails}
                aria-expanded={showDetails}
              >
                <Settings size={16} />
                {legalText.customize}
                {showDetails ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </button>

              <button
                type="button"
                className="cookie-btn cookie-btn-accept"
                onClick={handleAcceptAll}
                aria-label="Accept all cookies"
              >
                {legalText.acceptAll}
              </button>
            </div>
          </div>

          {/* Detailed preferences panel */}
          {showDetails && (
            <div className="cookie-preferences" role="region" aria-label="Cookie preferences">
              <div className="cookie-preferences-header">
                <h4>Cookie Categories</h4>
                <p>Choose which types of cookies you want to allow. You can change these settings at any time.</p>
              </div>

              <div className="cookie-categories">
                {Object.entries(cookieCategories).map(([categoryKey, category]) => {
                  const IconComponent = categoryIcons[categoryKey];
                  const isEnabled = preferences[categoryKey];
                  const isRequired = category.required;

                  return (
                    <div key={categoryKey} className="cookie-category">
                      <div className="cookie-category-header">
                        <div className="cookie-category-info">
                          <div className="cookie-category-title">
                            <IconComponent size={18} />
                            <span>{category.name}</span>
                            {isRequired && (
                              <span className="cookie-required-badge" aria-label="Required">
                                {legalText.requiredBadge}
                              </span>
                            )}
                          </div>
                          <p className="cookie-category-description">
                            {category.description}
                          </p>
                        </div>

                        <div className="cookie-toggle-container">
                          <label className="cookie-toggle" aria-label={`Toggle ${category.name}`}>
                            <input
                              type="checkbox"
                              checked={isEnabled}
                              disabled={isRequired}
                              onChange={() => handlePreferenceToggle(categoryKey)}
                              aria-describedby={`cookie-desc-${categoryKey}`}
                            />
                            <span className="cookie-toggle-slider">
                              <span className="cookie-toggle-button">
                                {isEnabled ? <Check size={12} /> : <X size={12} />}
                              </span>
                            </span>
                          </label>
                        </div>
                      </div>

                      {/* Cookie details */}
                      <div className="cookie-category-details" id={`cookie-desc-${categoryKey}`}>
                        <div className="cookie-list">
                          <strong>Cookies used:</strong>
                          <span>{category.cookies.join(', ')}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Save preferences button */}
              <div className="cookie-preferences-actions">
                <button
                  type="button"
                  className="cookie-btn cookie-btn-save"
                  onClick={handleSavePreferences}
                  aria-label="Save current cookie preferences"
                >
                  <Check size={16} />
                  {legalText.savePreferences}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* CCPA Notice */}
        <div className="cookie-ccpa-notice">
          <Info size={14} />
          <span>
            California residents: See our{' '}
            <Link to="/privacy" onClick={() => hideBanner()}>
              Privacy Policy
            </Link>
            {' '}for information about your privacy rights.
          </span>
        </div>
      </div>

      {/* Development reset button */}
      {process.env.NODE_ENV === 'development' && (
        <button
          onClick={handleResetConsent}
          className="cookie-dev-reset"
          title="Reset Cookie Consent (Dev Only)"
        >
          Reset Cookies
        </button>
      )}
    </>
  );
};

export default CookieConsent;