/**
 * Cookie Management Utility for GDPR/CCPA Compliance
 * Handles cookie consent preferences and enforcement
 */

// Cookie consent storage key and version
const CONSENT_KEY = 'sexyselfies_cookie_consent';
const CONSENT_VERSION = '1.0.0';
const CONSENT_EXPIRY_DAYS = 365;

// Cookie categories and their details
export const cookieCategories = {
  essential: {
    name: "Essential Cookies",
    description: "Required for basic platform functionality and security. These cannot be disabled.",
    required: true,
    cookies: ["session_id", "auth_token", "csrf_token", "sexyselfies_tos_acceptance"]
  },
  functional: {
    name: "Functional Cookies",
    description: "Remember your preferences and settings to provide a more personalized experience.",
    required: false,
    cookies: ["theme", "language", "preferences", "sidebar_state", "layout_preference"]
  },
  analytics: {
    name: "Analytics Cookies",
    description: "Help us understand how you use our platform to improve our services.",
    required: false,
    cookies: ["_ga", "_gid", "analytics_id", "user_session_analytics", "page_view_tracking"]
  },
  marketing: {
    name: "Marketing Cookies",
    description: "Used to show relevant content and measure advertising effectiveness.",
    required: false,
    cookies: ["marketing_id", "campaign_source", "ad_tracking", "conversion_pixel"]
  }
};

/**
 * Get current cookie consent preferences from localStorage
 * @returns {Object|null} Consent object or null if no consent given
 */
export const getCookieConsent = () => {
  try {
    const stored = localStorage.getItem(CONSENT_KEY);
    if (!stored) return null;

    const consent = JSON.parse(stored);

    // Check if consent has expired
    const consentDate = new Date(consent.timestamp);
    const expiryDate = new Date(consentDate.getTime() + (CONSENT_EXPIRY_DAYS * 24 * 60 * 60 * 1000));

    if (new Date() > expiryDate) {
      // Consent has expired, remove it
      localStorage.removeItem(CONSENT_KEY);
      return null;
    }

    // Check if consent version matches current version
    if (consent.version !== CONSENT_VERSION) {
      // Version mismatch, treat as no consent
      localStorage.removeItem(CONSENT_KEY);
      return null;
    }

    return consent;
  } catch (error) {
    console.warn('Error reading cookie consent:', error);
    // Clear corrupted data
    localStorage.removeItem(CONSENT_KEY);
    return null;
  }
};

/**
 * Set cookie consent preferences
 * @param {Object} preferences - Object with cookie category preferences
 * @param {boolean} preferences.essential - Always true (required)
 * @param {boolean} preferences.functional - Functional cookies consent
 * @param {boolean} preferences.analytics - Analytics cookies consent
 * @param {boolean} preferences.marketing - Marketing cookies consent
 */
export const setCookieConsent = (preferences) => {
  try {
    const consent = {
      version: CONSENT_VERSION,
      timestamp: new Date().toISOString(),
      preferences: {
        essential: true, // Always true
        functional: Boolean(preferences.functional),
        analytics: Boolean(preferences.analytics),
        marketing: Boolean(preferences.marketing)
      },
      userAgent: navigator.userAgent,
      url: window.location.href
    };

    localStorage.setItem(CONSENT_KEY, JSON.stringify(consent));

    // Apply the cookie preferences immediately
    applyCookiePreferences(consent.preferences);

    // Dispatch custom event for other parts of the app to listen to
    const event = new CustomEvent('cookieConsentUpdated', {
      detail: consent.preferences
    });
    window.dispatchEvent(event);

    return consent;
  } catch (error) {
    console.error('Error saving cookie consent:', error);
    throw error;
  }
};

/**
 * Check if cookie consent has been given
 * @returns {boolean} True if consent exists and is valid
 */
export const hasConsentBeenGiven = () => {
  return getCookieConsent() !== null;
};

/**
 * Get a list of all cookies matching a pattern
 * @param {string} pattern - Cookie name pattern
 * @returns {Array} Array of matching cookie names
 */
const getCookiesByPattern = (pattern) => {
  const cookies = document.cookie.split(';');
  const matching = [];

  cookies.forEach(cookie => {
    const name = cookie.split('=')[0].trim();
    if (name.includes(pattern) || pattern.includes(name)) {
      matching.push(name);
    }
  });

  return matching;
};

/**
 * Delete a cookie by name
 * @param {string} name - Cookie name
 * @param {string} domain - Cookie domain (optional)
 * @param {string} path - Cookie path (optional)
 */
const deleteCookie = (name, domain = '', path = '/') => {
  // Delete for current domain and path
  document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=${path}`;

  // Try to delete for current domain with different paths
  document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
  document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=`;

  // If domain specified, try to delete for that domain
  if (domain) {
    document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; domain=${domain}; path=${path}`;
    document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; domain=${domain}; path=/`;
  }

  // Try to delete for parent domain
  const currentDomain = window.location.hostname;
  const parentDomain = '.' + currentDomain.split('.').slice(-2).join('.');
  if (parentDomain !== '.' + currentDomain) {
    document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; domain=${parentDomain}; path=${path}`;
    document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; domain=${parentDomain}; path=/`;
  }
};

/**
 * Delete all non-essential cookies based on preferences
 * @param {Object} preferences - Cookie preferences object
 */
export const deleteNonEssentialCookies = (preferences = {}) => {
  const consent = preferences || getCookieConsent()?.preferences || {};

  // Get all cookies that should be deleted based on preferences
  const categoriesToDelete = [];

  if (!consent.functional) categoriesToDelete.push('functional');
  if (!consent.analytics) categoriesToDelete.push('analytics');
  if (!consent.marketing) categoriesToDelete.push('marketing');

  categoriesToDelete.forEach(category => {
    const categoryInfo = cookieCategories[category];
    if (categoryInfo) {
      categoryInfo.cookies.forEach(cookieName => {
        // Delete exact matches
        deleteCookie(cookieName);

        // Delete pattern matches (for cookies like _ga, _gid)
        const patternMatches = getCookiesByPattern(cookieName);
        patternMatches.forEach(matchedCookie => {
          deleteCookie(matchedCookie);
        });
      });
    }
  });

  // Also clear localStorage items that might be tracking related
  if (!consent.analytics) {
    try {
      // Clear Google Analytics localStorage
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith('_ga') || key.includes('analytics')) {
          localStorage.removeItem(key);
        }
      });
    } catch (error) {
      console.warn('Error clearing analytics localStorage:', error);
    }
  }

  if (!consent.marketing) {
    try {
      // Clear marketing related localStorage
      Object.keys(localStorage).forEach(key => {
        if (key.includes('marketing') || key.includes('campaign') || key.includes('ad_')) {
          localStorage.removeItem(key);
        }
      });
    } catch (error) {
      console.warn('Error clearing marketing localStorage:', error);
    }
  }
};

/**
 * Apply cookie preferences (enable/disable functionality)
 * @param {Object} preferences - Cookie preferences object
 */
export const applyCookiePreferences = (preferences) => {
  // Disable Google Analytics if analytics not consented
  if (!preferences.analytics) {
    // Set gtag disable flag
    window[`ga-disable-${window.GA_MEASUREMENT_ID || 'GA_MEASUREMENT_ID'}`] = true;

    // Clear existing GA data
    if (window.gtag) {
      window.gtag('config', window.GA_MEASUREMENT_ID || 'GA_MEASUREMENT_ID', {
        'storage': 'none',
        'client_storage': 'none'
      });
    }
  } else {
    // Re-enable analytics if consented
    window[`ga-disable-${window.GA_MEASUREMENT_ID || 'GA_MEASUREMENT_ID'}`] = false;
  }

  // Handle marketing cookies
  if (!preferences.marketing) {
    // Disable marketing tracking
    window.disableMarketingTracking = true;
  } else {
    window.disableMarketingTracking = false;
  }

  // Clean up non-consented cookies
  deleteNonEssentialCookies(preferences);
};

/**
 * Reset all cookie consent (useful for testing)
 */
export const resetCookieConsent = () => {
  try {
    localStorage.removeItem(CONSENT_KEY);

    // Delete all non-essential cookies
    deleteNonEssentialCookies({
      functional: false,
      analytics: false,
      marketing: false
    });

    // Dispatch reset event
    const event = new CustomEvent('cookieConsentReset');
    window.dispatchEvent(event);
  } catch (error) {
    console.error('Error resetting cookie consent:', error);
  }
};

/**
 * Export consent proof for legal compliance
 * @returns {Object} Consent proof object
 */
export const exportConsentProof = () => {
  const consent = getCookieConsent();
  if (!consent) return null;

  return {
    timestamp: consent.timestamp,
    preferences: consent.preferences,
    version: consent.version,
    userAgent: consent.userAgent,
    url: consent.url,
    categories: cookieCategories,
    exportedAt: new Date().toISOString()
  };
};

/**
 * Check if a specific cookie category is consented
 * @param {string} category - Cookie category name
 * @returns {boolean} True if category is consented
 */
export const isCategoryConsented = (category) => {
  const consent = getCookieConsent();
  if (!consent) return false;

  // Essential cookies are always consented
  if (category === 'essential') return true;

  return Boolean(consent.preferences[category]);
};

/**
 * Get user-friendly consent summary
 * @returns {Object} Human-readable consent summary
 */
export const getConsentSummary = () => {
  const consent = getCookieConsent();
  if (!consent) {
    return {
      hasConsent: false,
      message: "No cookie consent has been given"
    };
  }

  const consentedCategories = Object.entries(consent.preferences)
    .filter(([category, consented]) => consented)
    .map(([category]) => cookieCategories[category]?.name)
    .filter(Boolean);

  return {
    hasConsent: true,
    consentDate: consent.timestamp,
    consentedCategories,
    preferences: consent.preferences,
    version: consent.version
  };
};

// Initialize cookie management when module is loaded
if (typeof window !== 'undefined') {
  // Apply existing consent preferences on page load
  const existingConsent = getCookieConsent();
  if (existingConsent) {
    applyCookiePreferences(existingConsent.preferences);
  }
}