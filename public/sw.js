const CACHE_NAME = 'ciudadalerta-v1';
const NOTIFICATION_DEDUPE_CACHE = 'notification-dedupe-v2';
const NOTIFICATION_DEDUPE_TTL_MS = 24 * 60 * 60 * 1000;
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
          if (cache !== CACHE_NAME && cache !== NOTIFICATION_DEDUPE_CACHE) {
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
  if (!event.data) return;

  event.waitUntil(handlePushNotification(event.data));
});

async function handlePushNotification(eventData) {
  try {
    const payload = eventData.json();
    const data = payload.data || payload;
    const reportId = data.reportId;
    const notificationId = data.notificationId || reportId;

    if (notificationId && await wasNotificationShown(notificationId)) return;

    await self.registration.showNotification(data.title || 'CiudadAlerta', {
      body: data.body || 'Nuevo reporte registrado en Aguilares.',
      icon: '/icon-192.png',
      badge: '/icon-192-maskable.png',
      data: {
        url: data.url || '/',
      },
      tag: data.tag || (reportId ? `report-${reportId}` : 'nuevo-reporte'),
      renotify: false,
      vibrate: [100, 50, 100],
    });

    if (notificationId) await rememberShownNotification(notificationId);
  } catch {
    const text = eventData.text();
    await self.registration.showNotification('CiudadAlerta', {
      body: text || 'Nuevo reporte registrado en Aguilares.',
      icon: '/icon-192.png',
      badge: '/icon-192-maskable.png',
      data: { url: '/' },
      tag: 'nuevo-reporte',
    });
  }
}

function getNotificationDedupeRequest(notificationId) {
  return new Request(`${self.location.origin}/__notification_dedupe__/${encodeURIComponent(notificationId)}`);
}

async function wasNotificationShown(notificationId) {
  const cache = await caches.open(NOTIFICATION_DEDUPE_CACHE);
  const response = await cache.match(getNotificationDedupeRequest(notificationId));
  if (!response) return false;

  const shownAt = Number(await response.text());
  if (Number.isFinite(shownAt) && Date.now() - shownAt <= NOTIFICATION_DEDUPE_TTL_MS) {
    return true;
  }

  await cache.delete(getNotificationDedupeRequest(notificationId));
  return false;
}

async function rememberShownNotification(notificationId) {
  const cache = await caches.open(NOTIFICATION_DEDUPE_CACHE);
  await cache.put(
    getNotificationDedupeRequest(notificationId),
    new Response(String(Date.now()), { headers: { 'Content-Type': 'text/plain' } })
  );
}

// Deep-link Redirection Click Event
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const urlToOpen = event.notification.data?.url || '/';

  event.waitUntil(
    (async () => {
      const targetUrl = new URL(urlToOpen, self.location.origin).href;
      const windowClients = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });

      for (const client of windowClients) {
        if (new URL(client.url).origin !== self.location.origin) continue;

        try {
          const navigatedClient = 'navigate' in client
            ? await client.navigate(targetUrl)
            : client;

          if (navigatedClient && 'focus' in navigatedClient) {
            return navigatedClient.focus();
          }
        } catch {
          // Try another client or open a new window below.
        }
      }

      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
    })()
  );
});
