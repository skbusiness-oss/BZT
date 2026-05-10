#!/usr/bin/env node
/**
 * One-shot script: pull a real-photo cover for each diet kcal tier from
 * Unsplash and save it under public/diets/covers/. Five tiers cover all
 * 20 plans:
 *
 *   ≤ 1600 kcal  → lean
 *   1700–2000    → balanced
 *   2100–2600    → highProtein
 *   2700–3000    → performance
 *   ≥ 3100       → athlete
 *
 * Run with the access key in env (NOT committed):
 *
 *   UNSPLASH_ACCESS_KEY=... node scripts/generateDietCovers.mjs
 *
 * Or refresh a single tier with a custom query:
 *
 *   UNSPLASH_ACCESS_KEY=... node scripts/generateDietCovers.mjs lean "vegetable salad bowl"
 *
 * The script also writes public/diets/covers/attributions.json so the UI
 * can render the photographer credits required by the Unsplash API
 * guidelines (https://help.unsplash.com/en/articles/2511315).
 */
import { writeFile, mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const COVER_DIR = join(ROOT, 'public', 'diets', 'covers');
const ATTRIBUTIONS_FILE = join(COVER_DIR, 'attributions.json');

const KEY = process.env.UNSPLASH_ACCESS_KEY;
if (!KEY) {
    console.error('UNSPLASH_ACCESS_KEY env var is required.');
    console.error('Register a free demo app at https://unsplash.com/oauth/applications');
    process.exit(1);
}

// Tier → default search query. Tuned for editorial food photography.
// content_filter=high keeps results SFW (Unsplash supports this on /search).
const TIERS = {
    lean:         'healthy lean meal chicken vegetables',
    balanced:     'balanced meal plate rice protein vegetables',
    highProtein:  'high protein meal grilled chicken rice',
    performance:  'athletic meal salmon rice avocado',
    athlete:      'large meal steak rice plate',
};

// Pick the top result; fall back to next results if the top one is portrait
// or absurdly small. Per_page is 5 to give us room.
async function searchTopPhoto(query) {
    const url = new URL('https://api.unsplash.com/search/photos');
    url.searchParams.set('query', query);
    url.searchParams.set('orientation', 'landscape');
    url.searchParams.set('per_page', '5');
    url.searchParams.set('content_filter', 'high');

    const res = await fetch(url, {
        headers: {
            'Authorization': `Client-ID ${KEY}`,
            'Accept-Version': 'v1',
        },
    });
    if (!res.ok) {
        const text = await res.text();
        throw new Error(`Unsplash search HTTP ${res.status}: ${text.slice(0, 300)}`);
    }
    const json = await res.json();
    const candidates = (json.results ?? []).filter(p => p.width > p.height);
    const pick = candidates[0] ?? json.results?.[0];
    if (!pick) throw new Error(`No results for query: ${query}`);
    return pick;
}

// Trigger Unsplash's download tracking endpoint per their API guidelines.
// This is required when a photo is downloaded by the application; failure
// does not block the actual file download.
async function pingDownloadEndpoint(downloadLocation) {
    if (!downloadLocation) return;
    try {
        await fetch(downloadLocation, {
            headers: { 'Authorization': `Client-ID ${KEY}`, 'Accept-Version': 'v1' },
        });
    } catch { /* best-effort */ }
}

async function downloadJpeg(url, outPath) {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Image download HTTP ${res.status}: ${url}`);
    const buf = Buffer.from(await res.arrayBuffer());
    await writeFile(outPath, buf);
    return buf.byteLength;
}

function attributionEntry(tier, photo) {
    const utm = '?utm_source=biozackteam&utm_medium=referral';
    return {
        tier,
        photoId: photo.id,
        photographerName: photo.user?.name ?? 'Unknown',
        photographerUrl: `https://unsplash.com/@${photo.user?.username ?? ''}${utm}`,
        photoUrl: `${photo.links?.html ?? ''}${utm}`,
        unsplashUrl: `https://unsplash.com/${utm}`,
    };
}

async function loadExistingAttributions() {
    try {
        const { readFile } = await import('node:fs/promises');
        const txt = await readFile(ATTRIBUTIONS_FILE, 'utf-8');
        return JSON.parse(txt);
    } catch { return {}; }
}

async function saveAttributions(map) {
    await writeFile(ATTRIBUTIONS_FILE, JSON.stringify(map, null, 2) + '\n');
}

// Parse CLI args: [tier?] [customQuery?]
const [argTier, ...rest] = process.argv.slice(2);
const customQuery = rest.join(' ').trim();
const queue = argTier
    ? (TIERS[argTier]
        ? [[argTier, customQuery || TIERS[argTier]]]
        : (() => { throw new Error(`Unknown tier "${argTier}". Valid: ${Object.keys(TIERS).join(', ')}`); })())
    : Object.entries(TIERS);

await mkdir(COVER_DIR, { recursive: true });
const attributions = await loadExistingAttributions();

console.log(`Generating ${queue.length} cover(s)...`);

let okCount = 0;
const failures = [];

for (const [tier, query] of queue) {
    process.stdout.write(`[${tier}] "${query}" ... `);
    try {
        const photo = await searchTopPhoto(query);
        // urls.regular is 1080w — perfect for our 16:9 thumbnails.
        const imageUrl = photo.urls?.regular;
        if (!imageUrl) throw new Error('No urls.regular on Unsplash response');
        const outPath = join(COVER_DIR, `tier-${tier}.jpg`);
        const bytes = await downloadJpeg(imageUrl, outPath);
        await pingDownloadEndpoint(photo.links?.download_location);
        attributions[tier] = attributionEntry(tier, photo);
        console.log(`ok (${(bytes / 1024).toFixed(0)} KB) — © ${photo.user?.name ?? '?'}`);
        okCount++;
    } catch (err) {
        console.log(`FAIL: ${err.message}`);
        failures.push({ tier, error: err.message });
    }
}

await saveAttributions(attributions);

console.log('---');
console.log(`Generated: ${okCount}, failed: ${failures.length}`);
console.log(`Attributions written to ${ATTRIBUTIONS_FILE}`);
if (failures.length) process.exit(1);
