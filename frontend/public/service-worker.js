// service-worker.js - Place in frontend/public/service-worker.js

const CACHE_NAME = 'sexyselfies-v1.0.0';
const STATIC_CACHE_NAME = 'sexyselfies-static-v1.0.0';
const DYNAMIC_CACHE_NAME = 'sexyselfies-dynamic-v1.0.0';
const IMAGE_CACHE_NAME = 'sexyselfies-images-v1.0.0';

// Core files to cache for offline support
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
  '/offline.html',
];

// Install Service Worker
self.addEventListener('install', event => {
  console.log('[SW] Installing Service Worker...');
  event.waitUntil(
    caches
      .open(STATIC_CACHE_NAME)
      .then(cache => {
        console.log('[SW] Precaching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .catch(err => console.error('[SW] Error precaching:', err))
  );
  self.skipWaiting();
});

// Activate Service Worker
self.addEventListener('activate', event => {
  console.log('[SW] Activating Service Worker...');
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames
          .filter(cacheName => {
            return (
              cacheName.startsWith('sexyselfies-') &&
              cacheName !== STATIC_CACHE_NAME &&
              cacheName !== DYNAMIC_CACHE_NAME &&
              cacheName !== IMAGE_CACHE_NAME
            );
          })
          .map(cacheName => {
            console.log('[SW] Removing old cache:', cacheName);
            return caches.delete(cacheName);
          })
      );
    })
  );
  self.clients.claim();
});

// Fetch Strategy: Network First with Cache Fallback
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') return;

  // API calls - Network first, cache fallback
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(request)
        .then(response => {
          // Clone response before caching
          const responseToCache = response.clone();
          caches
            .open(DYNAMIC_CACHE_NAME)
            .then(cache => cache.put(request, responseToCache));
          return response;
        })
        .catch(() => {
          return caches.match(request);
        })
    );
    return;
  }

  // Images - Cache first, network fallback
  if (
    request.destination === 'image' ||
    url.pathname.match(/\.(jpg|jpeg|png|gif|webp|svg)$/)
  ) {
    event.respondWith(
      caches
        .match(request)
        .then(cachedResponse => {
          if (cachedResponse) return cachedResponse;

          return fetch(request).then(response => {
            // Don't cache non-successful responses
            if (!response || response.status !== 200) {
              return response;
            }

            const responseToCache = response.clone();
            caches
              .open(IMAGE_CACHE_NAME)
              .then(cache => cache.put(request, responseToCache));
            return response;
          });
        })
        .catch(() => {
          // Return placeholder image for failed image requests
          return caches.match('/icons/placeholder.png');
        })
    );
    return;
  }

  // Static assets - Cache first
  if (url.pathname.match(/\.(js|css|woff2?)$/)) {
    event.respondWith(
      caches
        .match(request)
        .then(cachedResponse => cachedResponse || fetch(request))
    );
    return;
  }

  // HTML pages - Network first with offline fallback
  event.respondWith(
    fetch(request)
      .then(response => {
        const responseToCache = response.clone();
        caches
          .open(DYNAMIC_CACHE_NAME)
          .then(cache => cache.put(request, responseToCache));
        return response;
      })
      .catch(() => {
        return caches.match(request).then(cachedResponse => {
          if (cachedResponse) return cachedResponse;
          // Return offline page for navigation requests
          if (request.mode === 'navigate') {
            return caches.match('/offline.html');
          }
        });
      })
  );
});

// Background Sync for offline actions
self.addEventListener('sync', event => {
  console.log('[SW] Background sync:', event.tag);

  if (event.tag === 'sync-messages') {
    event.waitUntil(syncMessages());
  }

  if (event.tag === 'sync-likes') {
    event.waitUntil(syncLikes());
  }

  if (event.tag === 'sync-uploads') {
    event.waitUntil(syncUploads());
  }
});

// Push Notifications
self.addEventListener('push', event => {
  const options = {
    body: event.data ? event.data.text() : 'New notification from SexySelfies',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/badge-72x72.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1,
    },
    actions: [
      {
        action: 'view',
        title: 'View',
        icon: '/icons/view-icon.png',
      },
      {
        action: 'close',
        title: 'Close',
        icon: '/icons/close-icon.png',
      },
    ],
  };

  event.waitUntil(self.registration.showNotification('SexySelfies', options));
});

// Notification click handler
self.addEventListener('notificationclick', event => {
  event.notification.close();

  if (event.action === 'view') {
    event.waitUntil(clients.openWindow('/'));
  }
});

// Helper functions for background sync
async function syncMessages() {
  // Implement message sync logic
  console.log('[SW] Syncing messages...');
}

async function syncLikes() {
  // Implement likes sync logic
  console.log('[SW] Syncing likes...');
}

async function syncUploads() {
  // Implement upload sync logic
  console.log('[SW] Syncing uploads...');
}

// Cache size management
async function trimCache(cacheName, maxItems) {
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();
  if (keys.length > maxItems) {
    await cache.delete(keys[0]);
    await trimCache(cacheName, maxItems);
  }
}

// Periodic cache cleanup
setInterval(
  () => {
    trimCache(IMAGE_CACHE_NAME, 50); // Keep only 50 images
    trimCache(DYNAMIC_CACHE_NAME, 30); // Keep only 30 dynamic items
  },
  1000 * 60 * 60
); // Run every hour
