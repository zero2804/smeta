// Работа без интернета: всё приложение кэшируется в телефоне.
// При обновлении файлов поменяйте номер версии.
const CACHE = 'smeta-v4';
const APP = [
  './', 'index.html', 'styles.css', 'data.js', 'i18n.js', 'app.js', 'pdf.js', 'manifest.webmanifest',
  'icons/icon-192.png', 'icons/icon-512.png',
  'vendor/jspdf.umd.min.js', 'vendor/jspdf.plugin.autotable.min.js',
  'vendor/DejaVuSansCondensed.ttf', 'vendor/DejaVuSansCondensed-Bold.ttf',
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(APP)));
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))));
  self.clients.claim();
});

// Сначала сеть (чтобы получать обновления), без сети — из кэша
self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== location.origin) return;
  e.respondWith(
    // no-cache: всегда сверяться с сервером, чтобы обновления приходили сразу, а не через 10 минут
    fetch(req, { cache: 'no-cache' }).then((res) => {
      if (res.ok) { const copy = res.clone(); caches.open(CACHE).then((c) => c.put(req, copy)); }
      return res;
    }).catch(() => caches.match(req, { ignoreSearch: true }).then((r) => r || caches.match('index.html')))
  );
});
