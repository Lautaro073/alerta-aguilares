const CACHE_NAME = 'ciudadalerta-v1';
const ASSETS_TO_CACHE = [
  '/',
  '/favicon.ico',
  '/icon-192.png',
  '/icon-512.png',
  '/icon-192-maskable.png',
  '/icon-512-maskable.png',
];

// Install Event: Cache critical shell assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('💚 [PWA SW] Pre-caching static shell assets');
      return cache.addAll(ASSETS_TO_CACHE);
    }).then(() => self.skipWaiting())
  );
});

// Activate Event: Clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            console.log('💚 [PWA SW] Clearing old cache:', cache);
            return caches.delete(cache);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch Event: Stale-While-Revalidate strategy for static resources
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Exclude non-GET requests, API calls, real-time streams, dev assets, and firebase requests
  if (
    request.method !== 'GET' ||
    url.pathname.startsWith('/api') ||
    url.pathname.includes('/_next/webpack-hmr') ||
    !url.protocol.startsWith('http') ||
    url.hostname.includes('firestore.googleapis.com') ||
    url.hostname.includes('identitytoolkit.googleapis.com') ||
    url.hostname.includes('securetoken.googleapis.com')
  ) {
    return; // Let the browser handle these normally
  }

  // Stale-While-Revalidate Strategy
  event.respondWith(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.match(request).then((cachedResponse) => {
        const fetchedResponse = fetch(request)
          .then((networkResponse) => {
            // Check if response is valid before caching (basic type or same origin)
            if (
              networkResponse &&
              networkResponse.status === 200 &&
              (networkResponse.type === 'basic' || networkResponse.type === 'cors')
            ) {
              cache.put(request, networkResponse.clone());
            }
            return networkResponse;
          })
          .catch((err) => {
            console.warn('💚 [PWA SW] Network fetch failed, returning cached version:', err);
            return cachedResponse;
          });

        return cachedResponse || fetchedResponse;
      });
    })
  );
});

// Native Push Notification Receiver Event
self.addEventListener('push', (event) => {
  if (event.data) {
    try {
      const payload = event.data.json();
      const options = {
        body: payload.body || 'Nuevo reporte registrado en Aguilares.',
        icon: payload.icon || '/icon-192.png',
        badge: payload.badge || '/icon-192-maskable.png',
        data: {
          url: payload.data?.url || '/',
        },
        tag: payload.tag || 'nuevo-reporte',
        vibrate: [100, 50, 100],
      };

      event.waitUntil(
        self.registration.showNotification(payload.title || 'CiudadAlerta', options)
      );
    } catch {
      // Fallback in case the notification payload is plain text instead of JSON
      const text = event.data.text();
      event.waitUntil(
        self.registration.showNotification('CiudadAlerta', {
          body: text || 'Nuevo reporte registrado en Aguilares.',
          icon: '/icon-192.png',
          badge: '/icon-192-maskable.png',
          data: {
            url: '/',
          },
        })
      );
    }
  }
});

// Deep-link Redirection Click Event
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const urlToOpen = event.notification.data?.url || '/';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      // Check if there is already a window open with this application scope
      for (let i = 0; i < windowClients.length; i++) {
        const client = windowClients[i];
        if (client.url.includes(urlToOpen) && 'focus' in client) {
          return client.focus();
        }
      }
      
      // If no window is open, open a new one
      if (self.clients.openWindow) {
        return self.clients.openWindow(urlToOpen);
      }
    })
  );
});
