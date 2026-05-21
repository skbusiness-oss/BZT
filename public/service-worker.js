// Bump VERSION whenever the cache strategy changes so old installs purge.
const VERSION = 'v42';
const STATIC_CACHE = `bzt-static-${VERSION}`;

/**
 * Strategy:
 * - HTML / navigation: network-first. The app shell must always be fresh so
 *   users get the latest deployed bundle. Falls back to cached HTML offline.
 * - Hashed static assets (JS/CSS/images from /assets/): cache-first. Vite
 *   includes a content hash in the filename so a new build produces new URLs;
 *   stale cache entries become unreachable, not stale-served.
 * - Cross-origin (Firestore, Storage, fonts, YouTube, etc.): bypass entirely.
 */

self.addEventListener('install', (event) => {
    self.skipWaiting();
    event.waitUntil(
        caches.open(STATIC_CACHE).then((cache) => cache.addAll(['/']))
    );
});

// Allow the page to ask a waiting worker to activate immediately.
self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        Promise.all([
            // Drop every cache whose name doesn't match this version.
            caches.keys().then((names) =>
                Promise.all(names.filter((n) => n !== STATIC_CACHE).map((n) => caches.delete(n)))
            ),
            // Take control of any open tabs immediately so the new SW serves them.
            self.clients.claim(),
        ])
    );
});

self.addEventListener('fetch', (event) => {
    const req = event.request;
    if (req.method !== 'GET') return;

    const url = new URL(req.url);
    if (url.origin !== self.location.origin) return; // Cross-origin: don't intercept.

    const isHTML =
        req.mode === 'navigate' ||
        (req.headers.get('accept') || '').includes('text/html');

    if (isHTML) {
        // Network-first for the app shell.
        event.respondWith(
            fetch(req)
                .then((res) => {
                    const copy = res.clone();
                    caches.open(STATIC_CACHE).then((cache) => cache.put(req, copy));
                    return res;
                })
                .catch(() => caches.match(req).then((m) => m || caches.match('/')))
        );
        return;
    }

    // Cache-first for hashed assets.
    event.respondWith(
        caches.match(req).then((cached) => {
            if (cached) return cached;
            return fetch(req).then((res) => {
                if (!res || res.status !== 200 || res.type !== 'basic') return res;
                const copy = res.clone();
                caches.open(STATIC_CACHE).then((cache) => cache.put(req, copy));
                return res;
            });
        })
    );
});
