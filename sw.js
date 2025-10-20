// Bump cache version to invalidate old entries when SW updates
const CACHE_NAME = 'taskboard-v3';

// 仅预缓存静态资源，不预缓存 index.html，避免 HTML 被长期缓存
const PRECACHE_ASSETS = [
  './styles.css',
  './script.js',
  './manifest.json'
];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_ASSETS))
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))
      )
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  const accept = req.headers.get('accept') || '';
  const isHTML = req.mode === 'navigate' || accept.includes('text/html');
  const dest = req.destination;

  // 对 HTML 使用网络优先，保证获取最新 index.html
  if (isHTML) {
    event.respondWith(
      fetch(new Request(req, { cache: 'no-store' }))
        .then((networkRes) => networkRes)
        .catch(() => caches.match(req))
    );
    return;
  }

  // 对脚本/样式/manifest 使用网络优先，离线回退缓存
  if (dest === 'script' || dest === 'style' || dest === 'manifest') {
    event.respondWith(
      fetch(new Request(req, { cache: 'no-cache' }))
        .then((networkRes) => {
          const clone = networkRes.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(req, clone)).catch(() => {});
          return networkRes;
        })
        .catch(() => caches.match(req))
    );
    return;
  }

  // 其他资源：cache-first + 回源更新
  event.respondWith(
    caches.match(req).then((cacheRes) => {
      const fetchPromise = fetch(req)
        .then((networkRes) => {
          const clone = networkRes.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(req, clone)).catch(() => {});
          return networkRes;
        })
        .catch(() => cacheRes);
      return cacheRes || fetchPromise;
    })
  );
});
