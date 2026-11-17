const CACHE_NAME = 'bunda-journal-v24';
// Gunakan URL kanonik. Cloudflare Pages membalikkan /index.html dan
// /offline.html dengan 308, yang bisa membuat cache.addAll gagal dan install
// PWA menggantung lama.
const APP_SHELL = [
  '/',
  '/manifest.json',
  '/offline',
  '/icon-192-v2.png',
  '/icon-512-v2.png',
  '/sounds/bunda-notif.mp3'
];

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
    // Cache satu per satu: satu file gagal tidak boleh menggagalkan install PWA.
    await Promise.all(
      APP_SHELL.map(async (url) => {
        try {
          const res = await fetch(new Request(url, { cache: 'reload' }));
          if (res && res.ok) await cache.put(url, res.clone());
        } catch {}
      })
    );
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const target = (event.notification.data && event.notification.data.url) || '/';
  event.waitUntil((async () => {
    const windows = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    for (const client of windows) {
      if ('focus' in client) {
        if ('navigate' in client) {
          try { await client.navigate(target); } catch {}
        }
        return client.focus();
      }
    }
    if (self.clients.openWindow) return self.clients.openWindow(target);
  })());
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  const url = new URL(req.url);

  // Skip cross-origin or non-GET requests
  if (req.method !== 'GET') return;

  // API: selalu network, jangan pernah di-cache (auth & data user)
  if (url.pathname.startsWith('/api/')) return;

  // Navigation requests: Cache First / Stale-While-Revalidate with offline fallback
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req)
        .then((networkRes) => {
          if (networkRes && networkRes.status === 200) {
            const resClone = networkRes.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(req, resClone));
          }
          return networkRes;
        })
        .catch(async () => {
          const cached = await caches.match(req);
          if (cached) return cached;
          const shell = await caches.match('/') || await caches.match('/index.html');
          if (shell) return shell;
          return (await caches.match('/offline')) || (await caches.match('/offline.html'));
        })
    );
    return;
  }

  // Static assets: NETWORK FIRST supaya bundle baru langsung kepakai di tablet/HP.
  // Cache hanya dipakai kalau jaringan gagal (offline).
  event.respondWith(
    fetch(req)
      .then((networkRes) => {
        if (networkRes && networkRes.status === 200 && url.origin === location.origin) {
          const resClone = networkRes.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(req, resClone));
        }
        return networkRes;
      })
      .catch(async () => {
        const cached = await caches.match(req);
        if (cached) return cached;
        return (await caches.match('/offline')) || (await caches.match('/offline.html'));
      })
  );
});
