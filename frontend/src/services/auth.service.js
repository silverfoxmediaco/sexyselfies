import api, { apiHelpers } from './api.config';

/**
 * Authentication Service
 * Handles all auth-related API calls for members, creators, and admins
 */
class AuthService {
  // ==========================================
  // MEMBER AUTHENTICATION
  // ==========================================
  
  /**
   * Member Registration
   */
  async memberRegister(data) {
    try {
      const response = await api.post('/api/auth/member/register', {
        email: data.email,
        password: data.password,
        confirmPassword: data.confirmPassword,
        username: data.username,
        birthDate: data.birthDate,
        agreeToTerms: data.agreeToTerms,
        marketingOptIn: data.marketingOptIn || false,
        referralCode: data.referralCode || null,
        deviceInfo: {
          platform: navigator.platform,
          userAgent: navigator.userAgent,
          screenResolution: `${window.screen.width}x${window.screen.height}`,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
        }
      });

      // Store tokens and user info
      if (response.data.token) {
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('memberToken', response.data.token);
        localStorage.setItem('refreshToken', response.data.refreshToken);
        localStorage.setItem('userRole', 'member');
        localStorage.setItem('userId', response.data.user.id);
        apiHelpers.setAuthToken(response.data.token);
      }

      return response;
    } catch (error) {
      throw this.handleAuthError(error);
    }
  }

  /**
   * Member Login
   */
  async memberLogin(email, password, rememberMe = false) {
    try {
      const response = await api.post('/api/auth/member/login', {
        email,
        password,
        rememberMe,
        deviceInfo: {
          platform: navigator.platform,
          userAgent: navigator.userAgent,
          screenResolution: `${window.screen.width}x${window.screen.height}`,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          isPWA: window.matchMedia('(display-mode: standalone)').matches
        }
      });

      // Store tokens
      if (response.data.token) {
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('memberToken', response.data.token);
        localStorage.setItem('refreshToken', response.data.refreshToken);
        localStorage.setItem('userRole', 'member');
        localStorage.setItem('userId', response.data.user.id);
        
        if (rememberMe) {
          localStorage.setItem('rememberMe', 'true');
          localStorage.setItem('savedEmail', email);
        }
        
        apiHelpers.setAuthToken(response.data.token);

        // Register for push notifications if PWA
        if ('serviceWorker' in navigator && 'PushManager' in window) {
          this.registerPushNotifications();
        }
      }

      return response;
    } catch (error) {
      throw this.handleAuthError(error);
    }
  }

  // ==========================================
  // CREATOR AUTHENTICATION
  // ==========================================
  
  /**
   * Creator Registration
   */
  async creatorRegister(data) {
    try {
      const response = await api.post('/api/auth/creator/register', {
        email: data.email,
        password: data.password,
        confirmPassword: data.confirmPassword,
        username: data.username,
        displayName: data.displayName,
        birthDate: data.birthDate,
        country: data.country,
        agreeToTerms: data.agreeToTerms,
        agreeToContentPolicy: data.agreeToContentPolicy,
        over18Confirmation: data.over18Confirmation,
        taxInfoConsent: data.taxInfoConsent,
        deviceInfo: {
          platform: navigator.platform,
          userAgent: navigator.userAgent,
          screenResolution: `${window.screen.width}x${window.screen.height}`,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
        }
      });

      // Store tokens
      if (response.data.token) {
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('creatorToken', response.data.token);
        localStorage.setItem('refreshToken', response.data.refreshToken);
        localStorage.setItem('userRole', 'creator');
        localStorage.setItem('userId', response.data.user.id);
        localStorage.setItem('creatorVerificationStatus', response.data.user.verificationStatus || 'pending');
        apiHelpers.setAuthToken(response.data.token);
      }

      return response;
    } catch (error) {
      throw this.handleAuthError(error);
    }
  }

  /**
   * Creator Login
   */
  async creatorLogin(email, password, rememberMe = false) {
    try {
      const response = await api.post('/api/auth/creator/login', {
        email,
        password,
        rememberMe,
        deviceInfo: {
          platform: navigator.platform,
          userAgent: navigator.userAgent,
          screenResolution: `${window.screen.width}x${window.screen.height}`,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          isPWA: window.matchMedia('(display-mode: standalone)').matches
        }
      });

      // Store tokens
      if (response.data.token) {
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('creatorToken', response.data.token);
        localStorage.setItem('refreshToken', response.data.refreshToken);
        localStorage.setItem('userRole', 'creator');
        localStorage.setItem('userId', response.data.user.id);
        localStorage.setItem('creatorVerificationStatus', response.data.user.verificationStatus || 'pending');
        
        if (rememberMe) {
          localStorage.setItem('rememberMe', 'true');
          localStorage.setItem('savedEmail', email);
        }
        
        apiHelpers.setAuthToken(response.data.token);

        // Register for push notifications
        if ('serviceWorker' in navigator && 'PushManager' in window) {
          this.registerPushNotifications();
        }
      }

      return response;
    } catch (error) {
      throw this.handleAuthError(error);
    }
  }

  // ==========================================
  // ADMIN AUTHENTICATION
  // ==========================================
  
  /**
   * Admin Login
   */
  async adminLogin(email, password, twoFactorCode = null) {
    try {
      const response = await api.post('/api/auth/admin/login', {
        email,
        password,
        twoFactorCode,
        deviceInfo: {
          platform: navigator.platform,
          userAgent: navigator.userAgent,
          screenResolution: `${window.screen.width}x${window.screen.height}`,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          ipAddress: 'server-side-detection' // Will be detected server-side
        }
      });

      // Check if 2FA is required
      if (response.requires2FA) {
        return { requires2FA: true, tempToken: response.tempToken };
      }

      // Store tokens
      if (response.data.token) {
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('adminToken', response.data.token);
        localStorage.setItem('refreshToken', response.data.refreshToken);
        localStorage.setItem('userRole', 'admin');
        localStorage.setItem('adminId', response.data.admin.id);
        localStorage.setItem('adminPermissions', JSON.stringify(response.data.admin.permissions || []));
        apiHelpers.setAuthToken(response.data.token);
      }

      return response;
    } catch (error) {
      throw this.handleAuthError(error);
    }
  }

  // ==========================================
  // COMMON AUTHENTICATION METHODS
  // ==========================================
  
  /**
   * Logout
   */
  async logout() {
    try {
      const token = localStorage.getItem('token');
      const userRole = localStorage.getItem('userRole');
      
      // Call logout endpoint
      if (token) {
        await api.post('/api/auth/logout', {}, {
          queueIfOffline: false // Don't queue logout requests
        });
      }

      // Unregister push notifications
      if ('serviceWorker' in navigator && 'PushManager' in window) {
        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.getSubscription();
        if (subscription) {
          await subscription.unsubscribe();
        }
      }

      // Clear all stored data except remember me
      const rememberMe = localStorage.getItem('rememberMe');
      const savedEmail = localStorage.getItem('savedEmail');
      
      localStorage.clear();
      
      if (rememberMe === 'true') {
        localStorage.setItem('rememberMe', 'true');
        localStorage.setItem('savedEmail', savedEmail);
      }

      // Clear API token
      apiHelpers.setAuthToken(null);

      // Clear cache
      apiHelpers.clearCache();

      // Redirect to appropriate login
      if (userRole === 'admin') {
        window.location.href = '/admin/login';
      } else if (userRole === 'creator') {
        window.location.href = '/creator/login';
      } else {
        window.location.href = '/member/login';
      }
    } catch (error) {
      console.error('Logout error:', error);
      // Force logout even if API call fails
      localStorage.clear();
      window.location.href = '/';
    }
  }

  /**
   * Get current user
   */
  async getCurrentUser() {
    try {
      const userRole = localStorage.getItem('userRole');
      
      if (!userRole) {
        throw new Error('No user role found');
      }

      const endpoint = userRole === 'admin' 
        ? '/api/auth/admin/me'
        : `/api/auth/${userRole}/me`;

      const response = await api.get(endpoint);
      
      // Update stored user info
      if (response.data) {
        localStorage.setItem('userId', response.data.id);
        if (userRole === 'creator') {
          localStorage.setItem('creatorVerificationStatus', response.data.verificationStatus || 'pending');
        }
      }

      return response;
    } catch (error) {
      throw this.handleAuthError(error);
    }
  }

  /**
   * Refresh token
   */
  async refreshToken() {
    try {
      const refreshToken = localStorage.getItem('refreshToken');
      
      if (!refreshToken) {
        throw new Error('No refresh token available');
      }

      const response = await api.post('/api/auth/refresh', {
        refreshToken
      });

      // Update tokens
      if (response.data.token) {
        localStorage.setItem('token', response.data.token);
        
        const userRole = localStorage.getItem('userRole');
        if (userRole === 'admin') {
          localStorage.setItem('adminToken', response.data.token);
        } else if (userRole === 'creator') {
          localStorage.setItem('creatorToken', response.data.token);
        } else {
          localStorage.setItem('memberToken', response.data.token);
        }
        
        if (response.data.refreshToken) {
          localStorage.setItem('refreshToken', response.data.refreshToken);
        }
        
        apiHelpers.setAuthToken(response.data.token);
      }

      return response;
    } catch (error) {
      throw this.handleAuthError(error);
    }
  }

  /**
   * Request password reset
   */
  async requestPasswordReset(email, userType = 'member') {
    try {
      const response = await api.post('/api/auth/password/reset-request', {
        email,
        userType
      });
      return response;
    } catch (error) {
      throw this.handleAuthError(error);
    }
  }

  /**
   * Reset password with token
   */
  async resetPassword(token, newPassword, confirmPassword) {
    try {
      const response = await api.post('/api/auth/password/reset', {
        token,
        newPassword,
        confirmPassword
      });
      return response;
    } catch (error) {
      throw this.handleAuthError(error);
    }
  }

  /**
   * Change password (logged in)
   */
  async changePassword(currentPassword, newPassword, confirmPassword) {
    try {
      const response = await api.post('/api/auth/password/change', {
        currentPassword,
        newPassword,
        confirmPassword
      });
      return response;
    } catch (error) {
      throw this.handleAuthError(error);
    }
  }

  /**
   * Verify email with token
   */
  async verifyEmail(token) {
    try {
      const response = await api.post('/api/auth/email/verify', {
        token
      });
      return response;
    } catch (error) {
      throw this.handleAuthError(error);
    }
  }

  /**
   * Resend verification email
   */
  async resendVerificationEmail() {
    try {
      const response = await api.post('/api/auth/email/resend-verification');
      return response;
    } catch (error) {
      throw this.handleAuthError(error);
    }
  }

  // ==========================================
  // SOCIAL AUTH
  // ==========================================
  
  /**
   * Social login/register
   */
  async socialAuth(provider, userType = 'member') {
    try {
      // Redirect to social auth endpoint
      const redirectUrl = `${import.meta.env.VITE_API_URL || 'http://localhost:5002'}/api/auth/${userType}/social/${provider}`;
      window.location.href = redirectUrl;
    } catch (error) {
      throw this.handleAuthError(error);
    }
  }

  /**
   * Handle social auth callback
   */
  async handleSocialCallback(provider, code, userType = 'member') {
    try {
      const response = await api.post(`/api/auth/${userType}/social/${provider}/callback`, {
        code
      });

      // Store tokens
      if (response.data.token) {
        localStorage.setItem('token', response.data.token);
        localStorage.setItem(`${userType}Token`, response.data.token);
        localStorage.setItem('refreshToken', response.data.refreshToken);
        localStorage.setItem('userRole', userType);
        localStorage.setItem('userId', response.data.user.id);
        apiHelpers.setAuthToken(response.data.token);
      }

      return response;
    } catch (error) {
      throw this.handleAuthError(error);
    }
  }

  // ==========================================
  // BIOMETRIC AUTH (Mobile)
  // ==========================================
  
  /**
   * Check biometric availability
   */
  async checkBiometricAvailability() {
    if ('credentials' in navigator && window.PublicKeyCredential) {
      try {
        const available = await window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
        return available;
      } catch (error) {
        console.error('Biometric check error:', error);
        return false;
      }
    }
    return false;
  }

  /**
   * Enable biometric login
   */
  async enableBiometric() {
    try {
      const response = await api.post('/api/auth/biometric/enable');
      
      if (response.data.challenge) {
        // Create credentials for biometric
        const credential = await navigator.credentials.create({
          publicKey: response.data.challenge
        });
        
        // Send credential to server
        const verifyResponse = await api.post('/api/auth/biometric/verify', {
          credentialId: credential.id,
          clientData: credential.response.clientDataJSON,
          attestation: credential.response.attestationObject
        });
        
        if (verifyResponse.success) {
          localStorage.setItem('biometricEnabled', 'true');
        }
        
        return verifyResponse;
      }
    } catch (error) {
      throw this.handleAuthError(error);
    }
  }

  // ==========================================
  // PUSH NOTIFICATIONS
  // ==========================================
  
  /**
   * Register for push notifications
   */
  async registerPushNotifications() {
    try {
      const registration = await navigator.serviceWorker.ready;
      
      // Check if already subscribed
      let subscription = await registration.pushManager.getSubscription();
      
      if (!subscription) {
        // Get public key from server
        const response = await api.get('/api/auth/push/public-key');
        const publicKey = response.data.publicKey;
        
        // Subscribe to push notifications
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: this.urlBase64ToUint8Array(publicKey)
        });
      }

      // Send subscription to server
      await api.post('/api/auth/push/subscribe', {
        subscription: subscription.toJSON(),
        deviceInfo: {
          platform: navigator.platform,
          userAgent: navigator.userAgent
        }
      });

      return true;
    } catch (error) {
      console.error('Push notification registration error:', error);
      return false;
    }
  }

  // ==========================================
  // HELPER METHODS
  // ==========================================
  
  /**
   * Check if user is authenticated
   */
  isAuthenticated() {
    const token = localStorage.getItem('token');
    return !!token;
  }

  /**
   * Get user role
   */
  getUserRole() {
    return localStorage.getItem('userRole');
  }

  /**
   * Get user ID
   */
  getUserId() {
    return localStorage.getItem('userId');
  }

  /**
   * Handle auth errors
   */
  handleAuthError(error) {
    if (error.response) {
      const { status, data } = error.response;
      
      switch (status) {
        case 400:
          return { 
            error: true, 
            message: data.message || 'Invalid request',
            errors: data.errors || {}
          };
        case 401:
          return { 
            error: true, 
            message: 'Invalid credentials',
            code: 'INVALID_CREDENTIALS'
          };
        case 403:
          return { 
            error: true, 
            message: 'Access forbidden',
            code: 'FORBIDDEN'
          };
        case 422:
          return { 
            error: true, 
            message: 'Validation failed',
            errors: data.errors || {}
          };
        case 429:
          return { 
            error: true, 
            message: 'Too many attempts. Please try again later.',
            code: 'RATE_LIMITED'
          };
        default:
          return { 
            error: true, 
            message: data.message || 'An error occurred'
          };
      }
    }
    
    return { 
      error: true, 
      message: error.message || 'Network error. Please check your connection.'
    };
  }

  /**
   * Convert base64 to Uint8Array for push notifications
   */
  urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/\-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }
}

// Create and export singleton instance
const authService = new AuthService();
export default authService;