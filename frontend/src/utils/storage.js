/**
 * Storage Utilities
 * Manages localStorage, sessionStorage, and IndexedDB with offline support
 */

class StorageManager {
  constructor() {
    this.prefix = 'sexyselfies_';
    this.dbName = 'SexySelfiesDB';
    this.dbVersion = 1;
    this.db = null;
    this.initIndexedDB();
  }

  // ==========================================
  // LOCALSTORAGE MANAGEMENT
  // ==========================================

  /**
   * Set item in localStorage with optional expiry
   */
  setLocal(key, value, expiryMinutes = null) {
    try {
      const item = {
        value: value,
        timestamp: Date.now(),
        expiry: expiryMinutes ? Date.now() + expiryMinutes * 60 * 1000 : null,
      };
      localStorage.setItem(this.prefix + key, JSON.stringify(item));
      return true;
    } catch (error) {
      console.error('localStorage set error:', error);
      // Handle quota exceeded
      if (error.name === 'QuotaExceededError') {
        this.clearExpiredLocal();
        try {
          localStorage.setItem(this.prefix + key, JSON.stringify(item));
          return true;
        } catch (retryError) {
          console.error('localStorage retry failed:', retryError);
          return false;
        }
      }
      return false;
    }
  }

  /**
   * Get item from localStorage
   */
  getLocal(key, defaultValue = null) {
    try {
      const item = localStorage.getItem(this.prefix + key);
      if (!item) return defaultValue;

      const parsed = JSON.parse(item);

      // Check expiry
      if (parsed.expiry && Date.now() > parsed.expiry) {
        this.removeLocal(key);
        return defaultValue;
      }

      return parsed.value;
    } catch (error) {
      console.error('localStorage get error:', error);
      return defaultValue;
    }
  }

  /**
   * Remove item from localStorage
   */
  removeLocal(key) {
    try {
      localStorage.removeItem(this.prefix + key);
      return true;
    } catch (error) {
      console.error('localStorage remove error:', error);
      return false;
    }
  }

  /**
   * Clear expired items from localStorage
   */
  clearExpiredLocal() {
    const keys = Object.keys(localStorage);
    const now = Date.now();
    let cleared = 0;

    keys.forEach(key => {
      if (key.startsWith(this.prefix)) {
        try {
          const item = JSON.parse(localStorage.getItem(key));
          if (item.expiry && now > item.expiry) {
            localStorage.removeItem(key);
            cleared++;
          }
        } catch (error) {
          // Remove corrupted items
          localStorage.removeItem(key);
          cleared++;
        }
      }
    });

    console.log(`Cleared ${cleared} expired items from localStorage`);
    return cleared;
  }

  /**
   * Get localStorage usage
   */
  getLocalStorageUsage() {
    let total = 0;
    const items = {};

    Object.keys(localStorage).forEach(key => {
      if (key.startsWith(this.prefix)) {
        const size = localStorage.getItem(key).length;
        total += size;
        items[key.replace(this.prefix, '')] = size;
      }
    });

    return {
      totalBytes: total,
      totalKB: (total / 1024).toFixed(2),
      items: items,
      itemCount: Object.keys(items).length,
    };
  }

  // ==========================================
  // SESSIONSTORAGE MANAGEMENT
  // ==========================================

  /**
   * Set item in sessionStorage
   */
  setSession(key, value) {
    try {
      sessionStorage.setItem(this.prefix + key, JSON.stringify(value));
      return true;
    } catch (error) {
      console.error('sessionStorage set error:', error);
      return false;
    }
  }

  /**
   * Get item from sessionStorage
   */
  getSession(key, defaultValue = null) {
    try {
      const item = sessionStorage.getItem(this.prefix + key);
      return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
      console.error('sessionStorage get error:', error);
      return defaultValue;
    }
  }

  /**
   * Remove item from sessionStorage
   */
  removeSession(key) {
    try {
      sessionStorage.removeItem(this.prefix + key);
      return true;
    } catch (error) {
      console.error('sessionStorage remove error:', error);
      return false;
    }
  }

  /**
   * Clear all session storage
   */
  clearSession() {
    try {
      const keys = Object.keys(sessionStorage);
      keys.forEach(key => {
        if (key.startsWith(this.prefix)) {
          sessionStorage.removeItem(key);
        }
      });
      return true;
    } catch (error) {
      console.error('sessionStorage clear error:', error);
      return false;
    }
  }

  // ==========================================
  // INDEXEDDB MANAGEMENT
  // ==========================================

  /**
   * Initialize IndexedDB
   */
  async initIndexedDB() {
    if (!('indexedDB' in window)) {
      console.warn('IndexedDB not supported');
      return;
    }

    try {
      const request = indexedDB.open(this.dbName, this.dbVersion);

      request.onerror = () => {
        console.error('IndexedDB error:', request.error);
      };

      request.onsuccess = () => {
        this.db = request.result;
        console.log('IndexedDB initialized');
      };

      request.onupgradeneeded = event => {
        const db = event.target.result;

        // Create object stores
        if (!db.objectStoreNames.contains('content')) {
          const contentStore = db.createObjectStore('content', {
            keyPath: 'id',
          });
          contentStore.createIndex('creatorId', 'creatorId', { unique: false });
          contentStore.createIndex('timestamp', 'timestamp', { unique: false });
        }

        if (!db.objectStoreNames.contains('messages')) {
          const messageStore = db.createObjectStore('messages', {
            keyPath: 'id',
          });
          messageStore.createIndex('conversationId', 'conversationId', {
            unique: false,
          });
          messageStore.createIndex('timestamp', 'timestamp', { unique: false });
        }

        if (!db.objectStoreNames.contains('profiles')) {
          const profileStore = db.createObjectStore('profiles', {
            keyPath: 'id',
          });
          profileStore.createIndex('type', 'type', { unique: false });
        }

        if (!db.objectStoreNames.contains('media')) {
          const mediaStore = db.createObjectStore('media', { keyPath: 'url' });
          mediaStore.createIndex('contentId', 'contentId', { unique: false });
        }

        if (!db.objectStoreNames.contains('queue')) {
          const queueStore = db.createObjectStore('queue', {
            keyPath: 'id',
            autoIncrement: true,
          });
          queueStore.createIndex('type', 'type', { unique: false });
          queueStore.createIndex('timestamp', 'timestamp', { unique: false });
        }
      };
    } catch (error) {
      console.error('IndexedDB init error:', error);
    }
  }

  /**
   * Save to IndexedDB
   */
  async saveToIndexedDB(storeName, data) {
    if (!this.db) await this.waitForDB();

    return new Promise((resolve, reject) => {
      try {
        const transaction = this.db.transaction([storeName], 'readwrite');
        const store = transaction.objectStore(storeName);
        const request = store.put(data);

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Get from IndexedDB
   */
  async getFromIndexedDB(storeName, key) {
    if (!this.db) await this.waitForDB();

    return new Promise((resolve, reject) => {
      try {
        const transaction = this.db.transaction([storeName], 'readonly');
        const store = transaction.objectStore(storeName);
        const request = store.get(key);

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Get all from IndexedDB store
   */
  async getAllFromIndexedDB(storeName, indexName = null, query = null) {
    if (!this.db) await this.waitForDB();

    return new Promise((resolve, reject) => {
      try {
        const transaction = this.db.transaction([storeName], 'readonly');
        const store = transaction.objectStore(storeName);

        let request;
        if (indexName && query) {
          const index = store.index(indexName);
          request = index.getAll(query);
        } else {
          request = store.getAll();
        }

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Delete from IndexedDB
   */
  async deleteFromIndexedDB(storeName, key) {
    if (!this.db) await this.waitForDB();

    return new Promise((resolve, reject) => {
      try {
        const transaction = this.db.transaction([storeName], 'readwrite');
        const store = transaction.objectStore(storeName);
        const request = store.delete(key);

        request.onsuccess = () => resolve(true);
        request.onerror = () => reject(request.error);
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Clear IndexedDB store
   */
  async clearIndexedDBStore(storeName) {
    if (!this.db) await this.waitForDB();

    return new Promise((resolve, reject) => {
      try {
        const transaction = this.db.transaction([storeName], 'readwrite');
        const store = transaction.objectStore(storeName);
        const request = store.clear();

        request.onsuccess = () => resolve(true);
        request.onerror = () => reject(request.error);
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Wait for database to be ready
   */
  waitForDB() {
    return new Promise(resolve => {
      if (this.db) {
        resolve();
      } else {
        const checkInterval = setInterval(() => {
          if (this.db) {
            clearInterval(checkInterval);
            resolve();
          }
        }, 100);

        // Timeout after 5 seconds
        setTimeout(() => {
          clearInterval(checkInterval);
          resolve();
        }, 5000);
      }
    });
  }

  // ==========================================
  // OFFLINE QUEUE MANAGEMENT
  // ==========================================

  /**
   * Add action to offline queue
   */
  async queueOfflineAction(action) {
    const queueItem = {
      ...action,
      timestamp: Date.now(),
      retries: 0,
    };

    // Store in IndexedDB
    try {
      await this.saveToIndexedDB('queue', queueItem);
    } catch (error) {
      // Fallback to localStorage
      const queue = this.getLocal('offline_queue', []);
      queue.push(queueItem);
      this.setLocal('offline_queue', queue);
    }
  }

  /**
   * Process offline queue
   */
  async processOfflineQueue() {
    try {
      // Get from IndexedDB
      const queue = await this.getAllFromIndexedDB('queue');

      for (const item of queue) {
        try {
          // Process item (this would be implemented based on action type)
          await this.processQueueItem(item);

          // Remove from queue if successful
          await this.deleteFromIndexedDB('queue', item.id);
        } catch (error) {
          // Increment retry count
          item.retries++;

          if (item.retries >= 3) {
            // Move to failed queue
            await this.deleteFromIndexedDB('queue', item.id);
            console.error('Queue item failed after 3 retries:', item);
          } else {
            // Update retry count
            await this.saveToIndexedDB('queue', item);
          }
        }
      }
    } catch (error) {
      console.error('Process queue error:', error);

      // Fallback to localStorage queue
      const queue = this.getLocal('offline_queue', []);
      // Process localStorage queue...
    }
  }

  /**
   * Process individual queue item
   */
  async processQueueItem(item) {
    // This would be implemented based on your specific needs
    // Example:
    switch (item.type) {
      case 'message':
        // Send message
        break;
      case 'like':
        // Process like
        break;
      case 'swipe':
        // Process swipe
        break;
      default:
        console.warn('Unknown queue item type:', item.type);
    }
  }

  // ==========================================
  // USER PREFERENCES
  // ==========================================

  /**
   * Save user preferences
   */
  savePreferences(preferences) {
    return this.setLocal('user_preferences', preferences);
  }

  /**
   * Get user preferences
   */
  getPreferences() {
    return this.getLocal('user_preferences', {
      theme: 'dark',
      notifications: true,
      autoplay: true,
      dataUsage: 'auto',
      language: 'en',
      soundEffects: true,
      hapticFeedback: true,
    });
  }

  /**
   * Update specific preference
   */
  updatePreference(key, value) {
    const preferences = this.getPreferences();
    preferences[key] = value;
    return this.savePreferences(preferences);
  }

  // ==========================================
  // CACHE MANAGEMENT
  // ==========================================

  /**
   * Save to cache
   */
  saveToCache(key, data, expiryMinutes = 60) {
    return this.setLocal(`cache_${key}`, data, expiryMinutes);
  }

  /**
   * Get from cache
   */
  getFromCache(key) {
    return this.getLocal(`cache_${key}`);
  }

  /**
   * Clear all cache
   */
  clearCache() {
    const keys = Object.keys(localStorage);
    let cleared = 0;

    keys.forEach(key => {
      if (key.startsWith(this.prefix + 'cache_')) {
        localStorage.removeItem(key);
        cleared++;
      }
    });

    return cleared;
  }

  /**
   * Get cache size
   */
  getCacheSize() {
    let total = 0;
    const keys = Object.keys(localStorage);

    keys.forEach(key => {
      if (key.startsWith(this.prefix + 'cache_')) {
        total += localStorage.getItem(key).length;
      }
    });

    return {
      bytes: total,
      kb: (total / 1024).toFixed(2),
      mb: (total / 1024 / 1024).toFixed(2),
    };
  }

  // ==========================================
  // UTILITY METHODS
  // ==========================================

  /**
   * Check if storage is available
   */
  isStorageAvailable(type = 'localStorage') {
    try {
      const storage = window[type];
      const test = '__storage_test__';
      storage.setItem(test, test);
      storage.removeItem(test);
      return true;
    } catch (e) {
      return false;
    }
  }

  /**
   * Get total storage usage
   */
  async getStorageUsage() {
    const usage = {
      localStorage: this.getLocalStorageUsage(),
      sessionStorage: this.getSessionStorageUsage(),
      indexedDB: await this.getIndexedDBUsage(),
    };

    usage.total = {
      bytes:
        usage.localStorage.totalBytes +
        usage.sessionStorage.totalBytes +
        usage.indexedDB.bytes,
      mb: (
        (usage.localStorage.totalBytes +
          usage.sessionStorage.totalBytes +
          usage.indexedDB.bytes) /
        1024 /
        1024
      ).toFixed(2),
    };

    return usage;
  }

  /**
   * Get sessionStorage usage
   */
  getSessionStorageUsage() {
    let total = 0;
    const items = {};

    Object.keys(sessionStorage).forEach(key => {
      if (key.startsWith(this.prefix)) {
        const size = sessionStorage.getItem(key).length;
        total += size;
        items[key.replace(this.prefix, '')] = size;
      }
    });

    return {
      totalBytes: total,
      totalKB: (total / 1024).toFixed(2),
      items: items,
      itemCount: Object.keys(items).length,
    };
  }

  /**
   * Get IndexedDB usage
   */
  async getIndexedDBUsage() {
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      const estimate = await navigator.storage.estimate();
      return {
        bytes: estimate.usage || 0,
        quota: estimate.quota || 0,
        percentage: ((estimate.usage / estimate.quota) * 100).toFixed(2),
      };
    }
    return { bytes: 0, quota: 0, percentage: 0 };
  }

  /**
   * Clear all storage
   */
  async clearAll() {
    // Clear localStorage
    const localKeys = Object.keys(localStorage);
    localKeys.forEach(key => {
      if (key.startsWith(this.prefix)) {
        localStorage.removeItem(key);
      }
    });

    // Clear sessionStorage
    this.clearSession();

    // Clear IndexedDB
    if (this.db) {
      const stores = ['content', 'messages', 'profiles', 'media', 'queue'];
      for (const store of stores) {
        await this.clearIndexedDBStore(store);
      }
    }

    console.log('All storage cleared');
  }
}

// Create and export singleton instance
const storage = new StorageManager();
export default storage;
