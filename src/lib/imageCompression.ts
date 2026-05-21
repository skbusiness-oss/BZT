/**
 * Client-side image compression. Phone-camera originals run 5-10 MB
 * and 4000+ px wide; we display them at ~400 px wide in cards and
 * never zoom past full-screen. Compressing on the device before
 * upload cuts:
 *   - storage cost (Firebase Storage is per-GB-month)
 *   - upload time on the user's connection
 *   - download time for every other viewer of the same image
 * by 90%+ in the typical case.
 *
 * Approach (no dependencies):
 *   1. Read file into an HTMLImageElement via object URL.
 *   2. Draw onto a canvas at the target max dimension preserving
 *      aspect ratio.
 *   3. Canvas → JPEG blob at configurable quality (default 0.82).
 *   4. Return a fresh File for the upload pipeline.
 *
 * Bypass cases (return the original untouched):
 *   - File is already small (< MIN_COMPRESS_BYTES, default 200 KB)
 *   - Source isn't an image MIME the canvas can decode (HEIC on
 *     non-Safari browsers, weird formats, SVG)
 *   - Canvas/encode throws — we log and fall back to the original
 *     so a transient codec issue never blocks an upload.
 *
 * Edge cases worth knowing about:
 *   - EXIF rotation. The canvas honors the auto-rotation behavior
 *     of the source <img>; modern browsers apply EXIF orientation
 *     when decoding so the canvas draws the right way up. Older
 *     browsers may need an exif library — out of scope here.
 *   - HEIC on iOS Safari decodes natively. On Chrome/Android, the
 *     bypass kicks in and we upload the original.
 *   - Animated GIFs: drawing to canvas loses animation. We bypass
 *     gif files entirely.
 */

export interface CompressOptions {
    /** Max dimension on the longest edge (px). Default 1600 — enough
     *  for full-screen lightboxes on most displays without
     *  flooding storage. */
    maxDimension?: number;
    /** JPEG quality 0..1. Default 0.82 — visually indistinguishable
     *  from the original at typical viewing distances. */
    quality?: number;
    /** Files smaller than this skip compression entirely
     *  (default 200 KB). */
    minCompressBytes?: number;
}

const DEFAULTS: Required<CompressOptions> = {
    maxDimension: 1600,
    quality: 0.82,
    minCompressBytes: 200 * 1024,
};

const COMPRESSIBLE_TYPES = new Set([
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
    'image/heic',
    'image/heif',
]);

export async function compressImageIfNeeded(
    file: File,
    opts: CompressOptions = {},
): Promise<File> {
    const o = { ...DEFAULTS, ...opts };

    // Bypass: not a compressible image, or already small enough.
    if (!COMPRESSIBLE_TYPES.has(file.type)) return file;
    if (file.size <= o.minCompressBytes) return file;

    try {
        const dataUrl = await fileToDataURL(file);
        const img = await loadImage(dataUrl);

        // Compute target dimensions preserving aspect ratio.
        const longest = Math.max(img.naturalWidth, img.naturalHeight);
        // No upscale — if the image is already smaller than the
        // target, leave the dimensions alone (re-encode for the
        // size win, but don't enlarge a tiny image).
        const scale = longest > o.maxDimension ? o.maxDimension / longest : 1;
        const targetW = Math.round(img.naturalWidth * scale);
        const targetH = Math.round(img.naturalHeight * scale);

        const canvas = document.createElement('canvas');
        canvas.width = targetW;
        canvas.height = targetH;
        const ctx = canvas.getContext('2d');
        if (!ctx) return file;
        // White background under the draw — JPEG has no alpha; without
        // this a transparent PNG would encode the alpha as black.
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, targetW, targetH);
        ctx.drawImage(img, 0, 0, targetW, targetH);

        const blob = await canvasToBlob(canvas, 'image/jpeg', o.quality);
        if (!blob) return file;

        // If compression somehow ended up LARGER than the original
        // (rare — happens on already-optimised tiny images), keep the
        // original.
        if (blob.size >= file.size) return file;

        // Re-package as a File so consumers that read .name / .type
        // get sensible values. Force the extension to .jpg so the
        // server-side contentType matches the actual blob.
        const newName = stripExtension(file.name) + '.jpg';
        return new File([blob], newName, { type: 'image/jpeg', lastModified: Date.now() });
    } catch (err) {
        // eslint-disable-next-line no-console
        console.warn('[imageCompression] fallback to original:', err);
        return file;
    }
}

function fileToDataURL(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = () => reject(reader.error ?? new Error('FileReader failed'));
        reader.readAsDataURL(file);
    });
}

function loadImage(src: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = () => reject(new Error('Image decode failed'));
        img.src = src;
    });
}

function canvasToBlob(canvas: HTMLCanvasElement, type: string, quality: number): Promise<Blob | null> {
    return new Promise((resolve) => {
        canvas.toBlob((b) => resolve(b), type, quality);
    });
}

function stripExtension(name: string): string {
    const dot = name.lastIndexOf('.');
    return dot > 0 ? name.slice(0, dot) : name;
}
