import api, { uploadApi } from './api.config';

/**
 * Content Service
 * Handles all content-related API calls including uploads, management, and interactions
 */
class ContentService {
  // ==========================================
  // CONTENT UPLOAD
  // ==========================================
  
  /**
   * Upload content (photos/videos)
   */
  async uploadContent(data) {
    try {
      const formData = new FormData();
      
      // Add files
      if (data.files && data.files.length > 0) {
        data.files.forEach((file) => {
          formData.append('content', file);
        });
      }
      
      // Add metadata
      formData.append('title', data.title);
      formData.append('description', data.description || '');
      formData.append('content_type', data.content_type); // 'photo', 'video', 'audio'
      formData.append('visibility', data.visibility); // 'public', 'subscribers', 'premium', 'private'
      formData.append('price', data.price || 0);
      formData.append('tags', JSON.stringify(data.tags || []));
      formData.append('categories', JSON.stringify(data.categories || []));
      formData.append('allow_comments', data.allow_comments !== false);
      formData.append('allow_downloads', data.allow_downloads || false);
      formData.append('watermark', data.watermark !== false);
      formData.append('blur_preview', data.blur_preview !== false);
      formData.append('schedule_date', data.schedule_date || '');
      formData.append('expires_at', data.expires_at || '');
      
      // Thumbnail for videos
      if (data.thumbnail) {
        formData.append('thumbnail', data.thumbnail);
      }
      
      // Location data if allowed
      if (data.include_location && navigator.geolocation) {
        const position = await this.getCurrentPosition();
        formData.append('location', JSON.stringify({
          lat: position.coords.latitude,
          lng: position.coords.longitude
        }));
      }
      
      const response = await uploadApi.post('/api/content/upload', formData, {
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          if (data.onProgress) {
            data.onProgress(percentCompleted);
          }
        },
        timeout: 600000 // 10 minutes for large videos
      });
      
      // Cache new content locally
      this.cacheContent(response.data);
      
      return response;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Upload batch content
   */
  async uploadBatchContent(files, commonData = {}) {
    try {
      const uploads = [];
      let completed = 0;
      
      for (const file of files) {
        const formData = new FormData();
        formData.append('content', file);
        
        // Apply common metadata
        Object.keys(commonData).forEach(key => {
          if (typeof commonData[key] === 'object') {
            formData.append(key, JSON.stringify(commonData[key]));
          } else {
            formData.append(key, commonData[key]);
          }
        });
        
        const upload = uploadApi.post('/api/content/upload', formData, {
          onUploadProgress: (progressEvent) => {
            const fileProgress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            const totalProgress = Math.round(((completed + (fileProgress / 100)) / files.length) * 100);
            
            if (commonData.onBatchProgress) {
              commonData.onBatchProgress(totalProgress, completed + 1, files.length);
            }
          }
        });
        
        uploads.push(upload);
        
        // Wait for each upload to complete before starting next (to avoid overwhelming server)
        await upload;
        completed++;
      }
      
      const results = await Promise.allSettled(uploads);
      
      return {
        successful: results.filter(r => r.status === 'fulfilled').map(r => r.value),
        failed: results.filter(r => r.status === 'rejected').map(r => r.reason)
      };
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Resume interrupted upload
   */
  async resumeUpload(uploadId, file, startByte = 0) {
    try {
      const chunk_size = 1024 * 1024; // 1MB chunks
      const total_size = file.size;
      let current_byte = startByte;
      
      while (current_byte < total_size) {
        const chunk = file.slice(current_byte, Math.min(current_byte + chunk_size, total_size));
        
        const formData = new FormData();
        formData.append('chunk', chunk);
        formData.append('upload_id', uploadId);
        formData.append('current_byte', current_byte);
        formData.append('total_size', total_size);
        
        await uploadApi.post('/api/content/upload/chunk', formData);
        
        current_byte += chunk_size;
        
        if (this.onChunkProgress) {
          this.onChunkProgress(Math.round((current_byte / total_size) * 100));
        }
      }
      
      // Finalize upload
      const response = await api.post('/api/content/upload/finalize', {
        upload_id: uploadId
      });
      
      return response;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // ==========================================
  // CONTENT MANAGEMENT
  // ==========================================
  
  /**
   * Get content list
   */
  async getContent(params = {}) {
    try {
      const response = await api.get('/api/content', {
        params: {
          type: params.type, // 'photo', 'video', 'audio', 'all'
          visibility: params.visibility, // 'public', 'subscribers', 'premium', 'private'
          creator_id: params.creator_id,
          category: params.category,
          tags: params.tags,
          min_price: params.min_price,
          max_price: params.max_price,
          sort: params.sort || 'newest', // 'newest', 'oldest', 'popular', 'trending', 'price_low', 'price_high'
          filter: params.filter, // 'free', 'paid', 'scheduled', 'expired'
          search: params.search,
          page: params.page || 1,
          limit: params.limit || 20
        }
      });
      
      // Cache for offline viewing
      if (params.cache !== false) {
        this.cacheContentList(response.data);
      }
      
      return response;
    } catch (error) {
      // Try to return cached data if offline
      if (error.code === 'OFFLINE') {
        const cached = this.getCachedContentList(params);
        if (cached) {
          return { data: cached, cached: true };
        }
      }
      throw this.handleError(error);
    }
  }

  /**
   * Get single content details
   */
  async getContentById(contentId) {
    try {
      const response = await api.get(`/api/content/${contentId}`);
      
      // Cache for offline viewing
      this.cacheContent(response.data);
      
      return response;
    } catch (error) {
      // Try cached version if offline
      if (error.code === 'OFFLINE') {
        const cached = this.getCachedContent(contentId);
        if (cached) {
          return { data: cached, cached: true };
        }
      }
      throw this.handleError(error);
    }
  }

  /**
   * Update content
   */
  async updateContent(contentId, data) {
    try {
      const response = await api.put(`/api/content/${contentId}`, {
        title: data.title,
        description: data.description,
        visibility: data.visibility,
        price: data.price,
        tags: data.tags,
        categories: data.categories,
        allow_comments: data.allow_comments,
        allow_downloads: data.allow_downloads,
        schedule_date: data.schedule_date,
        expires_at: data.expires_at
      });
      
      // Update cache
      this.cacheContent(response.data);
      
      return response;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Delete content
   */
  async deleteContent(contentId) {
    try {
      const response = await api.delete(`/api/content/${contentId}`);
      
      // Remove from cache
      this.removeCachedContent(contentId);
      
      return response;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Archive content
   */
  async archiveContent(contentId) {
    try {
      const response = await api.put(`/api/content/${contentId}/archive`);
      return response;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Restore archived content
   */
  async restoreContent(contentId) {
    try {
      const response = await api.put(`/api/content/${contentId}/restore`);
      return response;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // ==========================================
  // CONTENT INTERACTIONS
  // ==========================================
  
  /**
   * Like content
   */
  async likeContent(contentId) {
    try {
      const response = await api.post(`/api/content/${contentId}/like`);
      
      // Update local like state
      this.updateCachedContentLike(contentId, true);
      
      return response;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Unlike content
   */
  async unlikeContent(contentId) {
    try {
      const response = await api.delete(`/api/content/${contentId}/like`);
      
      // Update local like state
      this.updateCachedContentLike(contentId, false);
      
      return response;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * View content (track view)
   */
  async viewContent(contentId) {
    try {
      const response = await api.post(`/api/content/${contentId}/view`, {
        duration: 0, // Will be updated as user watches
        device_type: this.getDeviceType(),
        referrer: document.referrer
      });
      return response;
    } catch (error) {
      // Don't throw for view tracking errors
      console.error('View tracking error:', error);
      return { success: false };
    }
  }

  /**
   * Update view duration
   */
  async updateViewDuration(contentId, duration) {
    try {
      const response = await api.put(`/api/content/${contentId}/view`, {
        duration
      });
      return response;
    } catch (error) {
      // Don't throw for duration update errors
      console.error('Duration update error:', error);
      return { success: false };
    }
  }

  /**
   * Share content
   */
  async shareContent(contentId, platform) {
    try {
      const response = await api.post(`/api/content/${contentId}/share`, {
        platform // 'link', 'twitter', 'reddit', 'telegram', 'whatsapp'
      });
      
      if (response.data?.share_url) {
        // Handle native share API if available
        if (navigator.share && platform === 'native') {
          await navigator.share({
            title: response.data.title,
            text: response.data.description,
            url: response.data.share_url
          });
        } else {
          // Copy to clipboard
          await navigator.clipboard.writeText(response.data.share_url);
        }
      }
      
      return response;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Report content
   */
  async reportContent(contentId, reason, details) {
    try {
      const response = await api.post(`/api/content/${contentId}/report`, {
        reason, // 'inappropriate', 'copyright', 'spam', 'misleading', 'underage', 'other'
        details,
        timestamp: new Date().toISOString()
      });
      return response;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // ==========================================
  // COMMENTS
  // ==========================================
  
  /**
   * Get comments
   */
  async getComments(contentId, params = {}) {
    try {
      const response = await api.get(`/api/content/${contentId}/comments`, {
        params: {
          sort: params.sort || 'newest', // 'newest', 'oldest', 'popular'
          page: params.page || 1,
          limit: params.limit || 20
        }
      });
      return response;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Add comment
   */
  async addComment(contentId, text, replyTo = null) {
    try {
      const response = await api.post(`/api/content/${contentId}/comments`, {
        text,
        reply_to: replyTo
      });
      return response;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Delete comment
   */
  async deleteComment(commentId) {
    try {
      const response = await api.delete(`/api/comments/${commentId}`);
      return response;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Like comment
   */
  async likeComment(commentId) {
    try {
      const response = await api.post(`/api/comments/${commentId}/like`);
      return response;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Report comment
   */
  async reportComment(commentId, reason) {
    try {
      const response = await api.post(`/api/comments/${commentId}/report`, {
        reason
      });
      return response;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // ==========================================
  // ANALYTICS
  // ==========================================
  
  /**
   * Get content analytics (for creators)
   */
  async getContentAnalytics(contentId) {
    try {
      const response = await api.get(`/api/content/${contentId}/analytics`);
      return response;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Get trending content
   */
  async getTrendingContent(params = {}) {
    try {
      const response = await api.get('/api/content/trending', {
        params: {
          period: params.period || '24h', // '1h', '24h', '7d', '30d'
          category: params.category,
          type: params.type,
          limit: params.limit || 20
        }
      });
      return response;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Get recommended content
   */
  async getRecommendedContent(params = {}) {
    try {
      const response = await api.get('/api/content/recommended', {
        params: {
          based_on: params.based_on, // 'history', 'likes', 'subscriptions'
          limit: params.limit || 20
        }
      });
      return response;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // ==========================================
  // DOWNLOAD & OFFLINE
  // ==========================================
  
  /**
   * Download content
   */
  async downloadContent(contentId) {
    try {
      const response = await api.get(`/api/content/${contentId}/download`, {
        responseType: 'blob'
      });
      
      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `content_${contentId}.${this.getFileExtension(response.headers['content-type'])}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      return { success: true };
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Save content for offline viewing
   */
  async saveForOffline(contentId) {
    try {
      const response = await api.get(`/api/content/${contentId}/offline`);
      
      // Store in IndexedDB for offline access
      await this.storeOfflineContent(contentId, response.data);
      
      return response;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Get offline content
   */
  async getOfflineContent() {
    try {
      const content = await this.retrieveOfflineContent();
      return { data: content };
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Remove offline content
   */
  async removeOfflineContent(contentId) {
    try {
      await this.deleteOfflineContent(contentId);
      return { success: true };
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // ==========================================
  // HELPER METHODS
  // ==========================================
  
  /**
   * Get current position
   */
  getCurrentPosition() {
    return new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(resolve, reject, {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 0
      });
    });
  }

  /**
   * Get device type
   */
  getDeviceType() {
    const userAgent = navigator.userAgent;
    if (/tablet|ipad|playbook|silk/i.test(userAgent)) {
      return 'tablet';
    }
    if (/mobile|iphone|ipod|android|blackberry|opera|mini|windows\sce|palm|smartphone|iemobile/i.test(userAgent)) {
      return 'mobile';
    }
    return 'desktop';
  }

  /**
   * Get file extension from MIME type
   */
  getFileExtension(mimeType) {
    const types = {
      'image/jpeg': 'jpg',
      'image/png': 'png',
      'image/gif': 'gif',
      'image/webp': 'webp',
      'video/mp4': 'mp4',
      'video/webm': 'webm',
      'audio/mpeg': 'mp3',
      'audio/wav': 'wav'
    };
    return types[mimeType] || 'file';
  }

  /**
   * Cache content
   */
  cacheContent(content) {
    try {
      const key = `content_${content.id}`;
      localStorage.setItem(key, JSON.stringify({
        data: content,
        cached_at: Date.now()
      }));
    } catch (e) {
      console.error('Cache error:', e);
    }
  }

  /**
   * Get cached content
   */
  getCachedContent(contentId) {
    try {
      const key = `content_${contentId}`;
      const cached = localStorage.getItem(key);
      if (cached) {
        const { data, cached_at } = JSON.parse(cached);
        // Cache valid for 1 hour
        if (Date.now() - cached_at < 3600000) {
          return data;
        }
      }
    } catch (e) {
      console.error('Cache retrieval error:', e);
    }
    return null;
  }

  /**
   * Remove cached content
   */
  removeCachedContent(contentId) {
    try {
      const key = `content_${contentId}`;
      localStorage.removeItem(key);
    } catch (e) {
      console.error('Cache removal error:', e);
    }
  }

  /**
   * Cache content list
   */
  cacheContentList(contents) {
    try {
      contents.forEach(content => this.cacheContent(content));
    } catch (e) {
      console.error('Cache list error:', e);
    }
  }

  /**
   * Get cached content list
   */
  getCachedContentList(params) {
    try {
      const keys = Object.keys(localStorage);
      const contentKeys = keys.filter(key => key.startsWith('content_'));
      const contents = [];
      
      contentKeys.forEach(key => {
        const cached = localStorage.getItem(key);
        if (cached) {
          const { data, cached_at } = JSON.parse(cached);
          // Cache valid for 1 hour
          if (Date.now() - cached_at < 3600000) {
            contents.push(data);
          }
        }
      });
      
      return contents;
    } catch (e) {
      console.error('Cache list retrieval error:', e);
    }
    return null;
  }

  /**
   * Update cached content like state
   */
  updateCachedContentLike(contentId, liked) {
    try {
      const cached = this.getCachedContent(contentId);
      if (cached) {
        cached.is_liked = liked;
        cached.likes_count = liked 
          ? (cached.likes_count || 0) + 1 
          : Math.max((cached.likes_count || 0) - 1, 0);
        this.cacheContent(cached);
      }
    } catch (e) {
      console.error('Cache update error:', e);
    }
  }

  /**
   * Store offline content in IndexedDB
   */
  async storeOfflineContent(contentId, data) {
    // Implementation would use IndexedDB API
    // Simplified for brevity
    return new Promise((resolve) => {
      // Store in IndexedDB
      resolve();
    });
  }

  /**
   * Retrieve offline content from IndexedDB
   */
  async retrieveOfflineContent() {
    // Implementation would use IndexedDB API
    // Simplified for brevity
    return new Promise((resolve) => {
      // Retrieve from IndexedDB
      resolve([]);
    });
  }

  /**
   * Delete offline content from IndexedDB
   */
  async deleteOfflineContent(contentId) {
    // Implementation would use IndexedDB API
    // Simplified for brevity
    return new Promise((resolve) => {
      // Delete from IndexedDB
      resolve();
    });
  }

  /**
   * Handle service errors
   */
  handleError(error) {
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
            message: 'Please login to continue',
            code: 'UNAUTHORIZED'
          };
        case 403:
          return { 
            error: true, 
            message: 'Access denied',
            code: 'FORBIDDEN'
          };
        case 404:
          return { 
            error: true, 
            message: 'Content not found',
            code: 'NOT_FOUND'
          };
        case 413:
          return { 
            error: true, 
            message: 'File too large. Maximum size is 100MB for photos, 500MB for videos.',
            code: 'FILE_TOO_LARGE'
          };
        case 422:
          return { 
            error: true, 
            message: 'Invalid content data',
            errors: data.errors || {}
          };
        case 429:
          return { 
            error: true, 
            message: 'Too many uploads. Please wait a moment.',
            code: 'RATE_LIMITED'
          };
        default:
          return { 
            error: true, 
            message: data.message || 'Content operation failed'
          };
      }
    }
    
    if (!navigator.onLine) {
      return { 
        error: true, 
        message: 'No internet connection',
        code: 'OFFLINE'
      };
    }
    
    return { 
      error: true, 
      message: error.message || 'Content operation failed'
    };
  }
}

// Create and export singleton instance
const contentService = new ContentService();
export default contentService;