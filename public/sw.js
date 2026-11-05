// Funcionamiento sin cobertura: guarda la pantalla de la app y sus archivos para abrirla sin red.
const CACHE = 'gestion-v1';
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()),
  );
});
self.addEventListener('fetch', (e) => {
  const req = e.request;
  const url = new URL(req.url);
  if (req.method !== 'GET' || url.origin !== location.origin || url.pathname.startsWith('/api/')) return;
  if (req.mode === 'navigate') {
    if (url.pathname !== '/app') return;
    e.respondWith(
      fetch(req)
        .then((r) => {
          if (r.ok && !r.redirected) caches.open(CACHE).then((c) => c.put('/app', r.clone()));
          return r;
        })
        .catch(() => caches.match('/app').then((r) => r || Response.error())),
    );
    return;
  }
  if (url.pathname.startsWith('/_next/static/') || /\.(png|svg|ico|woff2?)$/.test(url.pathname)) {
    e.respondWith(
      caches.match(req).then(
        (hit) =>
          hit ||
          fetch(req).then((r) => {
            if (r.ok) caches.open(CACHE).then((c) => c.put(req, r.clone()));
            return r;
          }),
      ),
    );
  }
});
