// scripts/optimize-images.mjs
// ─────────────────────────────────────────────────────────────────────
// One-shot optimizer for the static thumbnails shipped from /public.
//
// Why this exists:
//   The original cover photos (checkin-hero.jpg @ 6.95 MB,
//   continue-learning.png @ 1.83 MB, etc.) were the actual reason every
//   card on the app felt slow. The browser was downloading multi-MB
//   JPEGs and a PNG before any thumbnail could paint. Lazy-loading and
//   client-side compression on uploads don't help for these — they're
//   static assets bundled by Vite into dist/ and served from Hosting.
//
// What it does:
//   - Walks the IMAGE_DIRS list under public/ and re-encodes every
//     .jpg/.jpeg/.png it finds.
//   - Resizes to MAX_WIDTH (1600px) using `inside` fit so portrait
//     covers don't get stretched.
//   - Output is JPEG quality 78 with mozjpeg, progressive, and the
//     4:2:0 chroma subsampling browsers like.
//   - Strips EXIF/metadata.
//   - Writes IN-PLACE — the giant originals are overwritten. Originals
//     are still recoverable from git history, so we don't burn disk
//     space on a backup folder.
//
// Run with:  node scripts/optimize-images.mjs
// Idempotent — re-running on an already-optimized file is a near-noop
// (sharp will re-encode but the byte savings level off).
// ─────────────────────────────────────────────────────────────────────
import { readdir, stat, readFile, writeFile, rename, unlink } from 'node:fs/promises';
import { join, extname, dirname, basename } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PUBLIC_DIR = join(__dirname, '..', 'public');

// Folders that hold cover/thumb images we want to crush. Hero photos
// at the root of /public are listed explicitly below.
const IMAGE_DIRS = [
    'dashboard-covers',
    'workout-covers',
    'diets/covers',
    'university',
];

// Loose files at /public root that are also covers/heros.
const ROOT_FILES = [
    'checkin-hero.jpg',
    'workout-hero.jpg',
];

// Encode target. 1600px wide is plenty for retina display of a card
// that maxes out around 500-700 CSS px. Quality 78 with mozjpeg gives
// us roughly 70-85% savings on photographic content with no visible
// degradation at card size.
const MAX_WIDTH = 1600;
const JPEG_QUALITY = 78;

const isPhoto = (file) => /\.(jpe?g|png)$/i.test(file);

async function collectFiles() {
    const out = [];
    for (const sub of IMAGE_DIRS) {
        const dir = join(PUBLIC_DIR, sub);
        try {
            const entries = await readdir(dir);
            for (const name of entries) {
                if (isPhoto(name)) out.push(join(dir, name));
            }
        } catch (e) {
            if (e.code !== 'ENOENT') throw e;
            // Missing dir is fine — university/ is empty by design today.
        }
    }
    for (const name of ROOT_FILES) {
        const p = join(PUBLIC_DIR, name);
        try {
            await stat(p);
            out.push(p);
        } catch (e) {
            if (e.code !== 'ENOENT') throw e;
        }
    }
    return out;
}

function fmtBytes(n) {
    if (n > 1024 * 1024) return `${(n / 1024 / 1024).toFixed(2)} MB`;
    if (n > 1024) return `${(n / 1024).toFixed(0)} KB`;
    return `${n} B`;
}

async function optimizeOne(filePath) {
    const before = (await stat(filePath)).size;
    const ext = extname(filePath).toLowerCase();
    const isPng = ext === '.png';

    // Read the input fully first so we can safely write back to the
    // same path without sharp tripping over its own file handle.
    const input = await readFile(filePath);
    const pipeline = sharp(input, { failOn: 'none' })
        .rotate() // honour EXIF orientation before stripping metadata
        .resize({
            width: MAX_WIDTH,
            withoutEnlargement: true,
            fit: 'inside',
        })
        .jpeg({
            quality: JPEG_QUALITY,
            mozjpeg: true,
            progressive: true,
            chromaSubsampling: '4:2:0',
        });

    const buf = await pipeline.toBuffer();

    // If the source was a PNG, rename to .jpg since output is JPEG.
    // We delete the .png after the .jpg is on disk so a crash in the
    // middle leaves us with the original, not a half-written file.
    if (isPng) {
        const jpgPath = filePath.replace(/\.png$/i, '.jpg');
        await writeFile(jpgPath, buf);
        if (jpgPath.toLowerCase() !== filePath.toLowerCase()) {
            await unlink(filePath);
        }
        const after = (await stat(jpgPath)).size;
        return { filePath: jpgPath, before, after, renamedFrom: filePath };
    }

    // JPEG path: write in place.
    await writeFile(filePath, buf);
    const after = (await stat(filePath)).size;
    return { filePath, before, after };
}

async function main() {
    const files = await collectFiles();
    if (files.length === 0) {
        console.log('No images found to optimize.');
        return;
    }

    console.log(`Optimizing ${files.length} files (max ${MAX_WIDTH}px wide, JPEG q${JPEG_QUALITY})\n`);

    let totalBefore = 0;
    let totalAfter = 0;
    const results = [];
    for (const f of files) {
        try {
            const r = await optimizeOne(f);
            totalBefore += r.before;
            totalAfter += r.after;
            results.push(r);
            const saved = r.before - r.after;
            const pct = ((saved / r.before) * 100).toFixed(0);
            const renamedNote = r.renamedFrom ? `  (renamed from ${basename(r.renamedFrom)})` : '';
            console.log(
                `  ${basename(r.filePath).padEnd(40)} ${fmtBytes(r.before).padStart(10)} → ${fmtBytes(r.after).padStart(10)}  (-${pct}%)${renamedNote}`
            );
        } catch (e) {
            console.error(`  FAILED on ${f}: ${e.message}`);
        }
    }

    const savedTotal = totalBefore - totalAfter;
    const pctTotal = ((savedTotal / totalBefore) * 100).toFixed(0);
    console.log(`\nTotal: ${fmtBytes(totalBefore)} → ${fmtBytes(totalAfter)}  saved ${fmtBytes(savedTotal)}  (-${pctTotal}%)`);
}

main().catch((e) => {
    console.error(e);
    process.exit(1);
});
