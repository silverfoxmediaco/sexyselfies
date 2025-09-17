/**
 * Notification Utilities
 * Handles push notifications, in-app notifications, and notification management
 */

import api from '../services/api.config';

class NotificationManager {
  constructor() {
    this.permission = Notification.permission || 'default';
    this.subscription = null;
    this.vapidPublicKey = import.meta.env.VITE_VAPID_PUBLIC_KEY || '';
    this.notificationQueue = [];
    this.isAppActive = true;
    this.soundEnabled = true;
    this.vibrationEnabled = true;
    this.init();
  }

  // ==========================================
  // INITIALIZATION
  // ==========================================

  async init() {
    // Check if notifications are supported
    if (!('Notification' in window)) {
      console.warn('Notifications not supported');
      return;
    }

    // Check if service worker is supported
    if (!('serviceWorker' in navigator)) {
      console.warn('Service Worker not supported');
      return;
    }

    // Listen for visibility changes
    document.addEventListener('visibilitychange', () => {
      this.isAppActive = !document.hidden;
    });

    // Initialize push notifications if permission granted
    if (this.permission === 'granted') {
      await this.initializePushNotifications();
    }
  }

  // ==========================================
  // PERMISSION MANAGEMENT
  // ==========================================

  /**
   * Request notification permission
   */
  async requestPermission() {
    if (this.permission === 'granted') {
      return true;
    }

    if (this.permission === 'denied') {
      console.warn('Notification permission denied');
      return false;
    }

    try {
      const permission = await Notification.requestPermission();
      this.permission = permission;

      if (permission === 'granted') {
        await this.initializePushNotifications();
        return true;
      }

      return false;
    } catch (error) {
      console.error('Permission request error:', error);
      return false;
    }
  }

  /**
   * Check permission status
   */
  checkPermission() {
    this.permission = Notification.permission;
    return this.permission;
  }

  // ==========================================
  // PUSH NOTIFICATIONS
  // ==========================================

  /**
   * Initialize push notifications
   */
  async initializePushNotifications() {
    try {
      const registration = await navigator.serviceWorker.ready;

      // Check for existing subscription
      let subscription = await registration.pushManager.getSubscription();

      if (!subscription) {
        // Subscribe to push notifications
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: this.urlBase64ToUint8Array(this.vapidPublicKey),
        });
      }

      this.subscription = subscription;

      // Send subscription to server
      await this.sendSubscriptionToServer(subscription);

      // Listen for push events in service worker
      this.setupServiceWorkerListeners();

      console.log('Push notifications initialized');
      return subscription;
    } catch (error) {
      console.error('Push initialization error:', error);
      return null;
    }
  }

  /**
   * Send subscription to server
   */
  async sendSubscriptionToServer(subscription) {
    try {
      return await api.post('/notifications/subscribe', {
        subscription: subscription.toJSON(),
        device: {
          type: this.getDeviceType(),
          platform:
            navigator.userAgentData?.platform ||
            navigator.platform ||
            'unknown',
          userAgent: navigator.userAgent,
        },
      });
    } catch (error) {
      console.error('Subscription save error:', error);
      throw error;
    }
  }

  /**
   * Unsubscribe from push notifications
   */
  async unsubscribe() {
    try {
      if (this.subscription) {
        await this.subscription.unsubscribe();

        // Notify server
        await api.post('/notifications/unsubscribe');

        this.subscription = null;
        console.log('Unsubscribed from push notifications');
      }
    } catch (error) {
      console.error('Unsubscribe error:', error);
    }
  }

  /**
   * Setup service worker listeners
   */
  setupServiceWorkerListeners() {
    if (!navigator.serviceWorker.controller) return;

    // Listen for messages from service worker
    navigator.serviceWorker.addEventListener('message', event => {
      if (event.data.type === 'notification-click') {
        this.handleNotificationClick(event.data);
      } else if (event.data.type === 'notification-close') {
        this.handleNotificationClose(event.data);
      }
    });
  }

  // ==========================================
  // NOTIFICATION DISPLAY
  // ==========================================

  /**
   * Show notification
   */
  async showNotification(title, options = {}) {
    // Check permission
    if (this.permission !== 'granted') {
      console.warn('Notification permission not granted');
      return null;
    }

    // Default options
    const defaultOptions = {
      icon: '/icons/icon-192x192.png',
      badge: '/icons/badge-72x72.png',
      vibrate: this.vibrationEnabled ? [200, 100, 200] : undefined,
      sound: this.soundEnabled ? '/sounds/notification.mp3' : undefined,
      tag: `notification-${Date.now()}`,
      timestamp: Date.now(),
      requireInteraction: false,
      silent: false,
      data: {},
    };

    const notificationOptions = { ...defaultOptions, ...options };

    // If app is active and not specified to show anyway
    if (this.isAppActive && !options.showWhenActive) {
      // Show in-app notification instead
      return this.showInAppNotification(title, notificationOptions);
    }

    try {
      // Use service worker for notifications when available
      if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
        const registration = await navigator.serviceWorker.ready;
        return await registration.showNotification(title, notificationOptions);
      } else {
        // Fallback to Notification API
        return new Notification(title, notificationOptions);
      }
    } catch (error) {
      console.error('Show notification error:', error);
      // Fallback to in-app notification
      return this.showInAppNotification(title, notificationOptions);
    }
  }

  /**
   * Show in-app notification
   */
  showInAppNotification(title, options = {}) {
    const notification = {
      id: `in-app-${Date.now()}`,
      title,
      body: options.body || '',
      icon: options.icon,
      type: options.type || 'info',
      timestamp: Date.now(),
      data: options.data || {},
      actions: options.actions || [],
    };

    // Add to queue
    this.notificationQueue.push(notification);

    // Trigger UI update
    this.dispatchNotificationEvent('in-app-notification', notification);

    // Play sound if enabled
    if (this.soundEnabled && options.sound) {
      this.playNotificationSound(options.sound);
    }

    // Trigger vibration if enabled
    if (this.vibrationEnabled && options.vibrate) {
      this.triggerVibration(options.vibrate);
    }

    // Auto-dismiss after timeout
    if (options.timeout !== 0) {
      setTimeout(() => {
        this.dismissInAppNotification(notification.id);
      }, options.timeout || 5000);
    }

    return notification;
  }

  /**
   * Dismiss in-app notification
   */
  dismissInAppNotification(notificationId) {
    const index = this.notificationQueue.findIndex(
      n => n.id === notificationId
    );
    if (index > -1) {
      const notification = this.notificationQueue.splice(index, 1)[0];
      this.dispatchNotificationEvent(
        'in-app-notification-dismissed',
        notification
      );
    }
  }

  // ==========================================
  // NOTIFICATION TYPES
  // ==========================================

  /**
   * Show message notification
   */
  showMessageNotification(message) {
    return this.showNotification(`New message from ${message.senderName}`, {
      body: message.text,
      icon: message.senderAvatar || '/icons/icon-192x192.png',
      tag: `message-${message.conversationId}`,
      data: {
        type: 'message',
        conversationId: message.conversationId,
        messageId: message.id,
        senderId: message.senderId,
      },
      actions: [
        {
          action: 'reply',
          title: 'Reply',
          icon: '/icons/reply.png',
        },
        {
          action: 'view',
          title: 'View',
          icon: '/icons/view.png',
        },
      ],
    });
  }

  /**
   * Show connection notification
   */
  showConnectionNotification(connection) {
    return this.showNotification("It's a Connection! 🎉", {
      body: `You connected with ${connection.creatorName}!`,
      icon: connection.creatorAvatar || '/icons/icon-192x192.png',
      image: connection.creatorImage,
      tag: `connection-${connection.id}`,
      vibrate: [200, 100, 200, 100, 200],
      data: {
        type: 'connection',
        connectionId: connection.id,
        creatorId: connection.creatorId,
      },
      actions: [
        {
          action: 'message',
          title: 'Send Message',
          icon: '/icons/message.png',
        },
        {
          action: 'view',
          title: 'View Profile',
          icon: '/icons/profile.png',
        },
      ],
    });
  }

  /**
   * Show like notification
   */
  showLikeNotification(like) {
    return this.showNotification(`${like.userName} liked your content`, {
      body: like.contentTitle || 'Your content received a new like!',
      icon: like.userAvatar || '/icons/icon-192x192.png',
      tag: `like-${like.id}`,
      data: {
        type: 'like',
        likeId: like.id,
        contentId: like.contentId,
        userId: like.userId,
      },
    });
  }

  /**
   * Show subscription notification
   */
  showSubscriptionNotification(subscription) {
    return this.showNotification('New Subscriber! 🎊', {
      body: `${subscription.userName} subscribed to your content`,
      icon: subscription.userAvatar || '/icons/icon-192x192.png',
      tag: `subscription-${subscription.id}`,
      vibrate: [200, 100, 200],
      data: {
        type: 'subscription',
        subscriptionId: subscription.id,
        userId: subscription.userId,
      },
    });
  }

  /**
   * Show tip notification
   */
  showTipNotification(tip) {
    return this.showNotification(`💰 You received a $${tip.amount} tip!`, {
      body: `From ${tip.userName}: ${tip.message || 'Keep up the great work!'}`,
      icon: tip.userAvatar || '/icons/icon-192x192.png',
      tag: `tip-${tip.id}`,
      vibrate: [200, 100, 200, 100, 200],
      requireInteraction: true,
      data: {
        type: 'tip',
        tipId: tip.id,
        amount: tip.amount,
        userId: tip.userId,
      },
    });
  }

  /**
   * Show live stream notification
   */
  showLiveStreamNotification(stream) {
    return this.showNotification(`${stream.creatorName} is live now!`, {
      body: stream.title || 'Join the live stream',
      icon: stream.creatorAvatar || '/icons/icon-192x192.png',
      image: stream.thumbnail,
      tag: `live-${stream.id}`,
      data: {
        type: 'live',
        streamId: stream.id,
        creatorId: stream.creatorId,
      },
      actions: [
        {
          action: 'watch',
          title: 'Watch Now',
          icon: '/icons/play.png',
        },
      ],
    });
  }

  /**
   * Show promotional notification
   */
  showPromoNotification(promo) {
    return this.showNotification(promo.title, {
      body: promo.body,
      icon: promo.icon || '/icons/icon-192x192.png',
      image: promo.image,
      tag: `promo-${promo.id}`,
      data: {
        type: 'promo',
        promoId: promo.id,
        link: promo.link,
      },
      actions: promo.actions || [
        {
          action: 'view',
          title: 'View Offer',
          icon: '/icons/offer.png',
        },
      ],
    });
  }

  // ==========================================
  // NOTIFICATION HANDLERS
  // ==========================================

  /**
   * Handle notification click
   */
  handleNotificationClick(event) {
    const { notification, action } = event;
    const data = notification.data || {};

    // Route based on notification type
    switch (data.type) {
      case 'message':
        if (action === 'reply') {
          this.openQuickReply(data);
        } else {
          this.navigateToChat(data.conversationId);
        }
        break;

      case 'match':
        if (action === 'message') {
          this.navigateToChat(data.creatorId);
        } else {
          this.navigateToProfile(data.creatorId);
        }
        break;

      case 'live':
        this.navigateToLiveStream(data.streamId);
        break;

      case 'like':
      case 'subscription':
        this.navigateToContent(data.contentId);
        break;

      case 'tip':
        this.navigateToEarnings();
        break;

      case 'promo':
        if (data.link) {
          window.location.href = data.link;
        }
        break;

      default:
        // Open app
        this.openApp();
    }

    // Track notification interaction
    this.trackNotificationInteraction('click', data);
  }

  /**
   * Handle notification close
   */
  handleNotificationClose(event) {
    const data = event.notification.data || {};
    this.trackNotificationInteraction('close', data);
  }

  // ==========================================
  // NAVIGATION HELPERS
  // ==========================================

  navigateToChat(conversationId) {
    window.location.href = `/messages/${conversationId}`;
  }

  navigateToProfile(userId) {
    window.location.href = `/profile/${userId}`;
  }

  navigateToContent(contentId) {
    window.location.href = `/content/${contentId}`;
  }

  navigateToLiveStream(streamId) {
    window.location.href = `/live/${streamId}`;
  }

  navigateToEarnings() {
    window.location.href = '/creator/earnings';
  }

  openApp() {
    window.focus();
    window.location.href = '/';
  }

  openQuickReply(data) {
    // Dispatch event for quick reply modal
    this.dispatchNotificationEvent('open-quick-reply', data);
  }

  // ==========================================
  // UTILITY METHODS
  // ==========================================

  /**
   * Convert VAPID key
   */
  urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
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

  /**
   * Get device type
   */
  getDeviceType() {
    const userAgent = navigator.userAgent;
    if (/tablet|ipad/i.test(userAgent)) return 'tablet';
    if (/mobile|android|iphone/i.test(userAgent)) return 'mobile';
    return 'desktop';
  }

  /**
   * Play notification sound
   */
  playNotificationSound(soundUrl = '/sounds/notification.mp3') {
    if (!this.soundEnabled) return;

    try {
      const audio = new Audio(soundUrl);
      audio.volume = 0.5;
      audio.play().catch(e => console.warn('Sound play failed:', e));
    } catch (error) {
      console.error('Sound error:', error);
    }
  }

  /**
   * Trigger vibration
   */
  triggerVibration(pattern = [200]) {
    if (!this.vibrationEnabled) return;

    if ('vibrate' in navigator) {
      navigator.vibrate(pattern);
    }
  }

  /**
   * Dispatch notification event
   */
  dispatchNotificationEvent(type, data) {
    window.dispatchEvent(new CustomEvent(type, { detail: data }));
  }

  /**
   * Track notification interaction
   */
  async trackNotificationInteraction(action, data) {
    try {
      await api.post('/notifications/track', {
        action,
        notificationType: data.type,
        notificationData: data,
        timestamp: Date.now(),
      });
    } catch (error) {
      console.error('Track notification error:', error);
    }
  }

  // ==========================================
  // SETTINGS
  // ==========================================

  /**
   * Update notification settings
   */
  updateSettings(settings) {
    if (settings.sound !== undefined) {
      this.soundEnabled = settings.sound;
    }
    if (settings.vibration !== undefined) {
      this.vibrationEnabled = settings.vibration;
    }

    // Save to storage
    localStorage.setItem(
      'notification_settings',
      JSON.stringify({
        sound: this.soundEnabled,
        vibration: this.vibrationEnabled,
      })
    );
  }

  /**
   * Load settings
   */
  loadSettings() {
    try {
      const saved = localStorage.getItem('notification_settings');
      if (saved) {
        const settings = JSON.parse(saved);
        this.soundEnabled = settings.sound !== false;
        this.vibrationEnabled = settings.vibration !== false;
      }
    } catch (error) {
      console.error('Load settings error:', error);
    }
  }

  /**
   * Get notification statistics
   */
  getStatistics() {
    return {
      permission: this.permission,
      subscribed: !!this.subscription,
      soundEnabled: this.soundEnabled,
      vibrationEnabled: this.vibrationEnabled,
      queuedNotifications: this.notificationQueue.length,
      isAppActive: this.isAppActive,
    };
  }

  /**
   * Clear notification queue
   */
  clearQueue() {
    this.notificationQueue = [];
    this.dispatchNotificationEvent('queue-cleared', {});
  }
}

// Create and export singleton instance
const notifications = new NotificationManager();
export default notifications;
