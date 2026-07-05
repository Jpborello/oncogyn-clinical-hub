const CACHE_NAME = 'oncogyn-cache-v1';
const ASSETS_TO_CACHE = [
  '/',
  '/favicon.ico',
  '/globals.css',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  // Solo cachear peticiones GET del mismo origen
  // IMPORTANTE: Excluimos llamadas a APIs, archivos de Next.js (_next/) y pre-carga de páginas (_rsc) para evitar caché obsoleta en navegación
  if (
    event.request.method !== 'GET' || 
    !event.request.url.startsWith(self.location.origin) ||
    event.request.url.includes('/api/') ||
    event.request.url.includes('/_next/') ||
    event.request.url.includes('_rsc=')
  ) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }
      return fetch(event.request).then((response) => {
        if (!response || response.status !== 200 || response.type !== 'basic') {
          return response;
        }
        const responseToCache = response.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache);
        });
        return response;
      }).catch(() => {
        return caches.match('/');
      });
    })
  );
});

// RECEPTOR DE NOTIFICACIONES PUSH EN SEGUNDO PLANO
self.addEventListener('push', (event) => {
  let data = { titulo: 'Alerta OncoGyn', cuerpo: 'Nueva alerta clínica disponible' };
  try {
    if (event.data) {
      data = event.data.json();
    }
  } catch (e) {
    if (event.data) {
      data.cuerpo = event.data.text();
    }
  }

  const options = {
    body: data.cuerpo,
    icon: '/favicon.ico',
    badge: '/favicon.ico',
    vibrate: [300, 100, 300, 100, 300],
    tag: 'oncogyn-critica',
    renotify: true,
    data: {
      url: '/'
    }
  };

  event.waitUntil(
    self.registration.showNotification(data.titulo, options)
  );
});

// MANEJADOR DE CLIC EN NOTIFICACIÓN PUSH
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      if (clientList.length > 0) {
        return clientList[0].focus();
      }
      return self.clients.openWindow('/');
    })
  );
});
