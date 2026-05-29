// Bump VERSION whenever the cache strategy changes so old installs purge.
const VERSION = 'v114';
const STATIC_CACHE = `bzt-static-${VERSION}`;

/**
 * Strategy:
 * - HTML / navigation: network-first. The app shell must always be fresh so
 *   users get the latest deployed bundle. Falls back to cached HTML offline.
 * - Static thumbnails (covers, heros, level art): stale-while-revalidate. The
 *   user always sees a thumbnail instantly (from cache) on second+ paint
 *   while we silently refresh in the background. Combined with a long HTTP
 *   max-age in firebase.json, second-load thumbnails never touch the network.
 * - Hashed static assets (JS/CSS from /assets/): cache-first. Vite includes
 *   a content hash in the filename so a new build produces new URLs; stale
 *   cache entries become unreachable, not stale-served.
 * - Cross-origin (Firestore, Storage, fonts, YouTube, etc.): bypass entirely.
 *
 * Install pre-warm:
 *   We proactively pull the most-shown thumbnails (dashboard tiles, hero,
 *   University level art) on install. That way the first paint after a
 *   fresh install or a version bump doesn't fan out 15+ parallel image
 *   requests — they're already in cache when the dashboard mounts.
 */

// Thumbnails worth pre-warming on install. Keep this list tight — every
// entry adds bytes to the install fetch. These are the covers that paint
// on the dashboard / workouts / diets / university landings, the four
// surfaces the user opens most often. Optimized via scripts/optimize-images.mjs
// so total install warm-up is ~1.5 MB across all entries.
const PREWARM_URLS = [
    '/',
    // Brand mark — first thing on Login and Welcome, prewarm so the
    // first paint feels designed-for-you, not "blank box → image".
    '/brand-logo.png',
    '/icon-192.png',
    '/icon-512.png',
    '/apple-touch-icon.png',
    '/dashboard-covers/coaching-journey.jpg',
    '/dashboard-covers/continue-learning.jpg',
    '/dashboard-covers/empty-diet.jpg',
    '/dashboard-covers/empty-workout.jpg',
    '/dashboard-covers/tile-progress.jpg',
    '/dashboard-covers/tile-week-status.jpg',
    '/dashboard-covers/tile-your-standing.jpg',
    '/university/level-beginner.jpg',
    '/university/level-intermediate.jpg',
    '/university/level-advanced.jpg',
    // Workout category-bubble backgrounds. 8 images, ≈40-60 KB each
    // after the optimize-images.mjs pass. Without these prewarmed,
    // the bubble carousel on /workouts fires 8 parallel image
    // requests on first visit, which is the most visible new surface
    // for any returning user.
    '/workout-hero.jpg',
    '/workout-covers/goal-strength.jpg',
    '/workout-covers/goal-muscle-gain.jpg',
    '/workout-covers/goal-recomp.jpg',
    '/workout-covers/goal-fat-loss.jpg',
    '/workout-covers/goal-endurance.jpg',
    '/workout-covers/goal-rest.jpg',
];

// Predicate for routes that should use stale-while-revalidate (covers,
// heros, level art). Anything image-like under /public.
function isStaticThumbnail(url) {
    if (url.pathname.startsWith('/dashboard-covers/')) return true;
    if (url.pathname.startsWith('/workout-covers/')) return true;
    if (url.pathname.startsWith('/diets/covers/')) return true;
    if (url.pathname.startsWith('/university/')) return true;
    if (url.pathname === '/checkin-hero.jpg' || url.pathname === '/workout-hero.jpg') return true;
    return false;
}

self.addEventListener('install', (event) => {
    self.skipWaiting();
    event.waitUntil(
        caches.open(STATIC_CACHE).then((cache) =>
            // addAll is atomic — if ANY pre-warm fetch fails (e.g. offline
            // install path), the cache is left untouched and we'll lazily
            // populate it on the first real fetch. We use Promise.allSettled
            // pattern via individual put() calls instead so a single 404
            // doesn't tank the whole warm-up.
            Promise.all(
                PREWARM_URLS.map((url) =>
                    fetch(url, { cache: 'reload' })
                        .then((res) => {
                            if (res && res.ok) return cache.put(url, res.clone());
                        })
                        .catch(() => {/* network unavailable, skip warmup */})
                )
            )
        )
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

    // Stale-while-revalidate for static thumbnails: paint instantly from
    // cache, refresh quietly in the background. This is the lever that
    // makes dashboards feel snappy on the second+ visit.
    if (isStaticThumbnail(url)) {
        event.respondWith(
            caches.open(STATIC_CACHE).then(async (cache) => {
                const cached = await cache.match(req);
                const networkFetch = fetch(req)
                    .then((res) => {
                        if (res && res.status === 200 && res.type === 'basic') {
                            cache.put(req, res.clone());
                        }
                        return res;
                    })
                    .catch(() => cached); // offline: keep whatever we had
                return cached || networkFetch;
            })
        );
        return;
    }

    // Cache-first for hashed assets (JS/CSS bundles in /assets/).
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
