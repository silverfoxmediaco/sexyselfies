/**
 * Cache Utilities
 * Manages data caching for offline functionality
 */

class CacheManager {
  constructor() {
    this.memoryCache = new Map();
    this.cacheVersion = 'v1';
    this.maxMemoryCacheSize = 50; // MB
    this.currentMemoryUsage = 0;
  }

  // ==========================================
  // MEMORY CACHE
  // ==========================================

  /**
   * Set item in memory cache
   */
  setMemory(key, value, ttl = 300000) { // 5 minutes default
    const size = this.getObjectSize(value);
    
    // Check if we need to clear space
    if (this.currentMemoryUsage + size > this.maxMemoryCacheSize * 1024 * 1024) {
      this.evictLRU();
    }

    this.memoryCache.set(key, {
      value,
      expires: Date.now() + ttl,
      lastAccessed: Date.now(),
      size
    });

    this.currentMemoryUsage += size;
  }

  /**
   * Get item from memory cache
   */
  getMemory(key) {
    const item = this.memoryCache.get(key);
    
    if (!item) return null;
    
    if (Date.now() > item.expires) {
      this.removeMemory(key);
      return null;
    }

    // Update last accessed
    item.lastAccessed = Date.now();
    return item.value;
  }

  /**
   * Remove item from memory cache
   */
  removeMemory(key) {
    const item = this.memoryCache.get(key);
    if (item) {
      this.currentMemoryUsage -= item.size;
      this.memoryCache.delete(key);
    }
  }

  /**
   * Clear memory cache
   */
  clearMemory() {
    this.memoryCache.clear();
    this.currentMemoryUsage = 0;
  }

  /**
   * Evict least recently used items
   */
  evictLRU() {
    const entries = Array.from(this.memoryCache.entries());
    entries.sort((a, b) => a[1].lastAccessed - b[1].lastAccessed);

    // Remove oldest 20% of cache
    const toRemove = Math.floor(entries.length * 0.2);
    for (let i = 0; i < toRemove; i++) {
      this.removeMemory(entries[i][0]);
    }
  }

  // ==========================================
  // API RESPONSE CACHE
  // ==========================================

  /**
   * Cache API response
   */
  async cacheAPIResponse(url, response, options = {}) {
    const cacheKey = this.generateCacheKey(url, options);
    const cacheData = {
      url,
      response: response,
      timestamp: Date.now(),
      expires: Date.now() + (options.ttl || 300000), // 5 minutes default
      etag: response.headers?.etag,
      version: this.cacheVersion
    };

    // Store in memory
    this.setMemory(cacheKey, cacheData, options.ttl);

    // Store in localStorage for offline
    try {
      localStorage.setItem(`api_cache_${cacheKey}`, JSON.stringify(cacheData));
    } catch (error) {
      console.warn('Failed to cache API response in localStorage:', error);
    }

    // Store large responses in IndexedDB
    if (this.getObjectSize(response) > 100000) { // > 100KB
      await this.cacheInIndexedDB('api_responses', cacheKey, cacheData);
    }
  }

  /**
   * Get cached API response
   */
  async getCachedAPIResponse(url, options = {}) {
    const cacheKey = this.generateCacheKey(url, options);

    // Check memory cache first
    const memoryCache = this.getMemory(cacheKey);
    if (memoryCache) {
      return memoryCache.response;
    }

    // Check localStorage
    try {
      const localCache = localStorage.getItem(`api_cache_${cacheKey}`);
      if (localCache) {
        const data = JSON.parse(localCache);
        if (Date.now() < data.expires && data.version === this.cacheVersion) {
          // Restore to memory cache
          this.setMemory(cacheKey, data);
          return data.response;
        }
      }
    } catch (error) {
      console.warn('Failed to get cached API response from localStorage:', error);
    }

    // Check IndexedDB for large responses
    const idbCache = await this.getFromIndexedDB('api_responses', cacheKey);
    if (idbCache && Date.now() < idbCache.expires && idbCache.version === this.cacheVersion) {
      // Restore to memory cache
      this.setMemory(cacheKey, idbCache);
      return idbCache.response;
    }

    return null;
  }

  /**
   * Generate cache key
   */
  generateCacheKey(url, options = {}) {
    const params = options.params ? JSON.stringify(options.params) : '';
    const method = options.method || 'GET';
    return `${method}_${url}_${params}`;
  }

  // ==========================================
  // IMAGE CACHE
  // ==========================================

  /**
   * Cache image
   */
  async cacheImage(url) {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      
      // Convert to base64 for storage
      const reader = new FileReader();
      return new Promise((resolve, reject) => {
        reader.onloadend = () => {
          const base64 = reader.result;
          
          // Store in IndexedDB
          this.cacheInIndexedDB('images', url, {
            url,
            data: base64,
            type: blob.type,
            size: blob.size,
            cached: Date.now()
          });
          
          resolve(base64);
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    } catch (error) {
      console.error('Failed to cache image:', error);
      return null;
    }
  }

  /**
   * Get cached image
   */
  async getCachedImage(url) {
    const cached = await this.getFromIndexedDB('images', url);
    return cached?.data || null;
  }

  /**
   * Preload images
   */
  async preloadImages(urls) {
    const promises = urls.map(url => this.cacheImage(url));
    return Promise.allSettled(promises);
  }

  // ==========================================
  // CONTENT CACHE
  // ==========================================

  /**
   * Cache content for offline viewing
   */
  async cacheContent(content) {
    const cacheData = {
      ...content,
      cachedAt: Date.now(),
      version: this.cacheVersion
    };

    // Cache in IndexedDB
    await this.cacheInIndexedDB('content', content.id, cacheData);

    // Cache associated images
    if (content.images && content.images.length > 0) {
      await this.preloadImages(content.images);
    }

    // Cache video thumbnail
    if (content.type === 'video' && content.thumbnail) {
      await this.cacheImage(content.thumbnail);
    }

    return true;
  }

  /**
   * Get cached content
   */
  async getCachedContent(contentId) {
    return await this.getFromIndexedDB('content', contentId);
  }

  /**
   * Get all cached content
   */
  async getAllCachedContent() {
    return await this.getAllFromIndexedDB('content');
  }

  /**
   * Remove cached content
   */
  async removeCachedContent(contentId) {
    return await this.deleteFromIndexedDB('content', contentId);
  }

  // ==========================================
  // USER DATA CACHE
  // ==========================================

  /**
   * Cache user profile
   */
  async cacheUserProfile(userId, profile) {
    const cacheData = {
      ...profile,
      userId,
      cachedAt: Date.now(),
      version: this.cacheVersion
    };

    // Store in memory
    this.setMemory(`user_${userId}`, cacheData);

    // Store in IndexedDB
    await this.cacheInIndexedDB('profiles', userId, cacheData);

    // Cache profile image
    if (profile.avatar) {
      await this.cacheImage(profile.avatar);
    }

    return true;
  }

  /**
   * Get cached user profile
   */
  async getCachedUserProfile(userId) {
    // Check memory first
    const memoryCache = this.getMemory(`user_${userId}`);
    if (memoryCache) return memoryCache;

    // Check IndexedDB
    return await this.getFromIndexedDB('profiles', userId);
  }

  // ==========================================
  // MESSAGE CACHE
  // ==========================================

  /**
   * Cache messages
   */
  async cacheMessages(conversationId, messages) {
    const cacheData = {
      conversationId,
      messages,
      cachedAt: Date.now(),
      version: this.cacheVersion
    };

    // Store recent messages in memory
    this.setMemory(`messages_${conversationId}`, messages.slice(-50));

    // Store all in IndexedDB
    await this.cacheInIndexedDB('messages', conversationId, cacheData);

    return true;
  }

  /**
   * Get cached messages
   */
  async getCachedMessages(conversationId) {
    // Check memory first
    const memoryCache = this.getMemory(`messages_${conversationId}`);
    if (memoryCache) return memoryCache;

    // Check IndexedDB
    const cached = await this.getFromIndexedDB('messages', conversationId);
    return cached?.messages || [];
  }

  /**
   * Add message to cache
   */
  async addMessageToCache(conversationId, message) {
    const messages = await this.getCachedMessages(conversationId);
    messages.push(message);
    
    // Keep only last 1000 messages
    if (messages.length > 1000) {
      messages.splice(0, messages.length - 1000);
    }

    await this.cacheMessages(conversationId, messages);
  }

  // ==========================================
  // INDEXEDDB HELPERS
  // ==========================================

  /**
   * Open IndexedDB
   */
  async openDB() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('SexySelfiesCache', 1);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);

      request.onupgradeneeded = (event) => {
        const db = event.target.result;

        // Create stores if they don't exist
        if (!db.objectStoreNames.contains('api_responses')) {
          db.createObjectStore('api_responses', { keyPath: 'key' });
        }
        if (!db.objectStoreNames.contains('images')) {
          db.createObjectStore('images', { keyPath: 'url' });
        }
        if (!db.objectStoreNames.contains('content')) {
          db.createObjectStore('content', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('profiles')) {
          db.createObjectStore('profiles', { keyPath: 'userId' });
        }
        if (!db.objectStoreNames.contains('messages')) {
          db.createObjectStore('messages', { keyPath: 'conversationId' });
        }
      };
    });
  }

  /**
   * Cache in IndexedDB
   */
  async cacheInIndexedDB(storeName, key, data) {
    try {
      const db = await this.openDB();
      const transaction = db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      
      const record = { ...data };
      if (storeName === 'api_responses') {
        record.key = key;
      }
      
      await store.put(record);
      db.close();
      return true;
    } catch (error) {
      console.error('IndexedDB cache error:', error);
      return false;
    }
  }

  /**
   * Get from IndexedDB
   */
  async getFromIndexedDB(storeName, key) {
    try {
      const db = await this.openDB();
      const transaction = db.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      
      return new Promise((resolve) => {
        const request = storeName === 'api_responses' 
          ? store.get(key)
          : store.get(key);
          
        request.onsuccess = () => {
          db.close();
          resolve(request.result);
        };
        request.onerror = () => {
          db.close();
          resolve(null);
        };
      });
    } catch (error) {
      console.error('IndexedDB get error:', error);
      return null;
    }
  }

  /**
   * Get all from IndexedDB
   */
  async getAllFromIndexedDB(storeName) {
    try {
      const db = await this.openDB();
      const transaction = db.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      
      return new Promise((resolve) => {
        const request = store.getAll();
        request.onsuccess = () => {
          db.close();
          resolve(request.result);
        };
        request.onerror = () => {
          db.close();
          resolve([]);
        };
      });
    } catch (error) {
      console.error('IndexedDB getAll error:', error);
      return [];
    }
  }

  /**
   * Delete from IndexedDB
   */
  async deleteFromIndexedDB(storeName, key) {
    try {
      const db = await this.openDB();
      const transaction = db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      
      await store.delete(key);
      db.close();
      return true;
    } catch (error) {
      console.error('IndexedDB delete error:', error);
      return false;
    }
  }

  // ==========================================
  // UTILITY METHODS
  // ==========================================

  /**
   * Get object size in bytes
   */
  getObjectSize(obj) {
    const str = JSON.stringify(obj);
    return new Blob([str]).size;
  }

  /**
   * Clear all caches
   */
  async clearAll() {
    // Clear memory cache
    this.clearMemory();

    // Clear localStorage API cache
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
      if (key.startsWith('api_cache_')) {
        localStorage.removeItem(key);
      }
    });

    // Clear IndexedDB
    try {
      const db = await this.openDB();
      const stores = ['api_responses', 'images', 'content', 'profiles', 'messages'];
      
      for (const storeName of stores) {
        const transaction = db.transaction([storeName], 'readwrite');
        const store = transaction.objectStore(storeName);
        await store.clear();
      }
      
      db.close();
    } catch (error) {
      console.error('Failed to clear IndexedDB:', error);
    }

    console.log('All caches cleared');
  }

  /**
   * Get cache statistics
   */
  async getCacheStats() {
    const stats = {
      memory: {
        items: this.memoryCache.size,
        sizeBytes: this.currentMemoryUsage,
        sizeMB: (this.currentMemoryUsage / 1024 / 1024).toFixed(2)
      },
      localStorage: {
        items: 0,
        sizeBytes: 0
      },
      indexedDB: {
        items: 0
      }
    };

    // Count localStorage items
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith('api_cache_')) {
        stats.localStorage.items++;
        stats.localStorage.sizeBytes += localStorage.getItem(key).length;
      }
    });

    stats.localStorage.sizeMB = (stats.localStorage.sizeBytes / 1024 / 1024).toFixed(2);

    // Count IndexedDB items
    try {
      const db = await this.openDB();
      const stores = ['api_responses', 'images', 'content', 'profiles', 'messages'];
      
      for (const storeName of stores) {
        const transaction = db.transaction([storeName], 'readonly');
        const store = transaction.objectStore(storeName);
        const count = await store.count();
        stats.indexedDB.items += count;
      }
      
      db.close();
    } catch (error) {
      console.error('Failed to get IndexedDB stats:', error);
    }

    return stats;
  }
}

// Create and export singleton instance
const cache = new CacheManager();
export default cache;