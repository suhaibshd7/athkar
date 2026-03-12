// Service Worker for أذكاري — /athkar/ — v0.1
const CACHE   = 'adhkar-v0.1';
const SHELL   = [
  '/athkar/',
  '/athkar/index.html',
  '/athkar/manifest.json',
  '/athkar/icon-192.png',
  '/athkar/icon-512.png'
];

// Install: cache shell assets
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE)
      .then(c => Promise.all(SHELL.map(url => c.add(url).catch(() => {}))))
      .then(() => self.skipWaiting())
  );
});

// Activate: delete old caches immediately
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// Fetch: network-first for HTML (always get latest), cache-first for assets
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  const isHTML = url.pathname.endsWith('.html') || url.pathname.endsWith('/');

  if (isHTML) {
    // Network-first: always try to get fresh HTML
    e.respondWith(
      fetch(e.request)
        .then(res => {
          if (res.ok) {
            caches.open(CACHE).then(c => c.put(e.request, res.clone()));
          }
          return res;
        })
        .catch(() => caches.match(e.request)) // fallback to cache if offline
    );
  } else {
    // Cache-first for icons, manifest etc
    e.respondWith(
      caches.match(e.request)
        .then(cached => cached || fetch(e.request).then(res => {
          if (res.ok) caches.open(CACHE).then(c => c.put(e.request, res.clone()));
          return res;
        }))
        .catch(() => caches.match('/athkar/index.html'))
    );
  }
});
