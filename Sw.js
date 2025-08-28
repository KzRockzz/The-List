const VERSION = 'v1.0.0';
const CACHE_NAME = `the-list-${VERSION}`;
const CORE_ASSETS_REL = [
  'index.html',
  'manifest.webmanifest',
  'sw.js',
  'icons/icon-192.png',
  'icons/icon-512.png',
  'icons/maskable-192.png',
  'icons/maskable-512.png'
];
const toAbs = p => new URL(p, self.registration.scope).toString();
const CORE = CORE_ASSETS_REL.map(toAbs);

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(CORE)).then(()=>self.skipWaiting()));
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k.startsWith('the-list-') && k !== CACHE_NAME).map(k => caches.delete(k))))
    .then(()=>self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const req = event.request;
  // Navigate requests: serve index for offline navigation
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req).then(r => {
        const copy = r.clone();
        caches.open(CACHE_NAME).then(c => c.put(req, copy)).catch(()=>{});
        return r;
      }).catch(() => caches.match(req).then(r => r || caches.match(toAbs('index.html'))))
    );
    return;
  }
  // Static assets: cache-first
  event.respondWith(
    caches.match(req).then(hit => hit || fetch(req).then(r => {
      const copy = r.clone();
      caches.open(CACHE_NAME).then(c => c.put(req, copy)).catch(()=>{});
      return r;
    }).catch(() => caches.match(toAbs('index.html'))))
  );
});
