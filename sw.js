const CACHE = 'revos-v1';
const ASSETS = [
  '/revos/',
  '/revos/index.html',
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(ASSETS)).catch(() => {})
  );
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  // Sadece GET istekleri, API çağrıları cache'leme
  if (e.request.method !== 'GET') return;
  if (e.request.url.includes('supabase') || e.request.url.includes('hoteladvisor') || e.request.url.includes('workers.dev') || e.request.url.includes('groq')) return;

  e.respondWith(
    fetch(e.request)
      .then(res => {
        // Başarılı yanıtı cache'e al
        if (res.ok) {
          const clone = res.clone();
          caches.open(CACHE).then(c => c.put(e.request, clone));
        }
        return res;
      })
      .catch(() => caches.match(e.request)) // Offline: cache'den sun
  );
});
