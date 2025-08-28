import axios from 'axios';

// Base API URL from environment or fallback to production
const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://sexyselfies-api.onrender.com/api';
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'ws://localhost:5002';

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // For cookie-based auth if needed
});

// Queue for offline requests
let offlineQueue = [];
let isRefreshing = false;
let failedQueue = [];

// Process queued requests after token refresh
const processQueue = (error, token = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// Request interceptor
api.interceptors.request.use(
  async (config) => {
    // Add auth token based on user role
    const token = localStorage.getItem('token') || 
                  localStorage.getItem('adminToken') || 
                  localStorage.getItem('creatorToken') ||
                  localStorage.getItem('memberToken');
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Add user role header for backend routing
    const userRole = localStorage.getItem('userRole');
    if (userRole) {
      config.headers['X-User-Role'] = userRole;
    }

    // Add device information for mobile optimization
    const isMobile = /Mobile|Android|iPhone|iPad/i.test(navigator.userAgent);
    config.headers['X-Device-Type'] = isMobile ? 'mobile' : 'desktop';
    config.headers['X-Screen-Width'] = window.innerWidth;
    config.headers['X-Screen-Height'] = window.innerHeight;
    config.headers['X-Device-Pixel-Ratio'] = window.devicePixelRatio || 1;
    
    // Add PWA mode header
    const isPWA = window.matchMedia('(display-mode: standalone)').matches ||
                  window.navigator.standalone ||
                  document.referrer.includes('android-app://');
    config.headers['X-App-Mode'] = isPWA ? 'pwa' : 'browser';

    // Add timezone for proper date handling
    config.headers['X-Timezone'] = Intl.DateTimeFormat().resolvedOptions().timeZone;

    // Handle offline mode - queue requests
    if (!navigator.onLine && config.queueIfOffline !== false) {
      return new Promise((resolve, reject) => {
        offlineQueue.push({ config, resolve, reject });
        
        // Register for background sync if available
        if ('serviceWorker' in navigator && 'SyncManager' in window) {
          navigator.serviceWorker.ready.then(sw => {
            return sw.sync.register('sync-api-calls');
          });
        }
      });
    }

    // Add request timestamp for performance monitoring
    config.metadata = { startTime: new Date() };

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => {
    // Calculate request duration for performance monitoring
    if (response.config.metadata) {
      const duration = new Date() - response.config.metadata.startTime;
      console.log(`[API] ${response.config.method?.toUpperCase()} ${response.config.url} - ${duration}ms`);
    }

    // Store successful responses in cache for offline access
    if (response.config.method === 'get' && response.config.cache !== false) {
      const cacheKey = `api_cache_${response.config.url}`;
      const cacheData = {
        data: response.data,
        timestamp: Date.now(),
        expires: Date.now() + (5 * 60 * 1000) // 5 minutes default
      };
      
      try {
        localStorage.setItem(cacheKey, JSON.stringify(cacheData));
      } catch (e) {
        // Handle localStorage quota exceeded
        console.warn('[API] Cache storage failed:', e);
        clearExpiredCache();
      }
    }

    return response.data;
  },
  async (error) => {
    const originalRequest = error.config;

    // Handle network errors / offline
    if (!error.response) {
      // Check if we have cached data for GET requests
      if (originalRequest.method === 'get') {
        const cacheKey = `api_cache_${originalRequest.url}`;
        const cachedData = localStorage.getItem(cacheKey);
        
        if (cachedData) {
          const cache = JSON.parse(cachedData);
          if (cache.expires > Date.now()) {
            console.log('[API] Serving from cache:', originalRequest.url);
            return cache.data;
          }
        }
      }

      // Queue for later if offline
      if (!navigator.onLine) {
        return new Promise((resolve, reject) => {
          offlineQueue.push({ 
            config: originalRequest, 
            resolve, 
            reject 
          });
        });
      }

      return Promise.reject({
        message: 'Network error. Please check your connection.',
        code: 'NETWORK_ERROR'
      });
    }

    // Handle 401 Unauthorized - Token expired
    if (error.response.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then(token => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return api(originalRequest);
        }).catch(err => {
          return Promise.reject(err);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const refreshToken = localStorage.getItem('refreshToken');
      
      if (!refreshToken) {
        // No refresh token - redirect to login
        handleLogout();
        return Promise.reject(error);
      }

      try {
        const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
          refreshToken
        });

        const { token, refreshToken: newRefreshToken } = response.data.data;
        
        // Store new tokens
        localStorage.setItem('token', token);
        if (newRefreshToken) {
          localStorage.setItem('refreshToken', newRefreshToken);
        }

        // Update authorization header
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        
        // Process queued requests
        processQueue(null, token);
        
        // Retry original request
        originalRequest.headers.Authorization = `Bearer ${token}`;
        return api(originalRequest);
        
      } catch (refreshError) {
        processQueue(refreshError, null);
        handleLogout();
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    // Handle 403 Forbidden
    if (error.response.status === 403) {
      return Promise.reject({
        message: 'You do not have permission to perform this action.',
        code: 'FORBIDDEN'
      });
    }

    // Handle 404 Not Found
    if (error.response.status === 404) {
      return Promise.reject({
        message: 'The requested resource was not found.',
        code: 'NOT_FOUND'
      });
    }

    // Handle 429 Too Many Requests
    if (error.response.status === 429) {
      const retryAfter = error.response.headers['retry-after'];
      return Promise.reject({
        message: `Too many requests. Please try again in ${retryAfter || 60} seconds.`,
        code: 'RATE_LIMITED',
        retryAfter
      });
    }

    // Handle 500+ Server Errors
    if (error.response.status >= 500) {
      return Promise.reject({
        message: 'Server error. Please try again later.',
        code: 'SERVER_ERROR'
      });
    }

    // Handle validation errors (422)
    if (error.response.status === 422) {
      return Promise.reject({
        message: 'Validation failed',
        code: 'VALIDATION_ERROR',
        errors: error.response.data.errors || {}
      });
    }

    // Default error
    return Promise.reject(error.response.data || error);
  }
);

// Helper function to handle logout
const handleLogout = () => {
  // Clear all auth tokens
  localStorage.removeItem('token');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('adminToken');
  localStorage.removeItem('creatorToken');
  localStorage.removeItem('memberToken');
  localStorage.removeItem('userRole');
  
  // Redirect to appropriate login based on current path
  const currentPath = window.location.pathname;
  if (currentPath.startsWith('/admin')) {
    window.location.href = '/admin/login';
  } else if (currentPath.startsWith('/creator')) {
    window.location.href = '/creator/login';
  } else {
    window.location.href = '/member/login';
  }
};

// Clear expired cache entries
const clearExpiredCache = () => {
  const keys = Object.keys(localStorage);
  const now = Date.now();
  
  keys.forEach(key => {
    if (key.startsWith('api_cache_')) {
      try {
        const cache = JSON.parse(localStorage.getItem(key));
        if (cache.expires < now) {
          localStorage.removeItem(key);
        }
      } catch (e) {
        // Invalid cache entry, remove it
        localStorage.removeItem(key);
      }
    }
  });
};

// Process offline queue when coming back online
window.addEventListener('online', async () => {
  console.log('[API] Back online, processing queued requests...');
  
  const queue = [...offlineQueue];
  offlineQueue = [];
  
  for (const { config, resolve, reject } of queue) {
    try {
      const response = await api(config);
      resolve(response);
    } catch (error) {
      reject(error);
    }
  }
});

// File upload configuration
export const uploadApi = axios.create({
  baseURL: API_BASE_URL,
  timeout: 300000, // 5 minutes for uploads
  headers: {
    'Content-Type': 'multipart/form-data',
  },
});

// Apply same interceptors to upload API
uploadApi.interceptors.request.use(api.interceptors.request.handlers[0].fulfilled);
uploadApi.interceptors.response.use(
  api.interceptors.response.handlers[0].fulfilled,
  api.interceptors.response.handlers[0].rejected
);

// WebSocket configuration for real-time features
export const initializeSocket = () => {
  if (typeof window === 'undefined') return null;
  
  const token = localStorage.getItem('token');
  const io = window.io || window.socketIO;
  
  if (!io) {
    console.warn('[Socket] Socket.io not loaded');
    return null;
  }
  
  const socket = io(SOCKET_URL, {
    auth: { token },
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
  });
  
  socket.on('connect', () => {
    console.log('[Socket] Connected');
  });
  
  socket.on('disconnect', (reason) => {
    console.log('[Socket] Disconnected:', reason);
  });
  
  socket.on('error', (error) => {
    console.error('[Socket] Error:', error);
  });
  
  return socket;
};

// API helper methods
export const apiHelpers = {
  // Set auth token
  setAuthToken: (token) => {
    if (token) {
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      localStorage.setItem('token', token);
    } else {
      delete api.defaults.headers.common['Authorization'];
      localStorage.removeItem('token');
    }
  },

  // Clear all cache
  clearCache: () => {
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
      if (key.startsWith('api_cache_')) {
        localStorage.removeItem(key);
      }
    });
  },

  // Get cache stats
  getCacheStats: () => {
    const keys = Object.keys(localStorage);
    const cacheKeys = keys.filter(key => key.startsWith('api_cache_'));
    let totalSize = 0;
    
    cacheKeys.forEach(key => {
      totalSize += localStorage.getItem(key).length;
    });
    
    return {
      entries: cacheKeys.length,
      sizeKB: (totalSize / 1024).toFixed(2)
    };
  },

  // Check if online
  isOnline: () => navigator.onLine,

  // Get queued requests count
  getQueuedRequestsCount: () => offlineQueue.length,
};

export default api;