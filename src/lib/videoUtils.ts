export function buildEmbedUrl(raw: string): { embedUrl: string; platform: 'youtube' | 'vimeo' } | null {
    const input = raw.trim();
    if (!input) return null;

    let url = input;
    if (input.includes('<iframe') || input.startsWith('<')) {
        const srcMatch = input.match(/\bsrc=["']([^"']+)["']/i);
        if (!srcMatch) return null;
        url = srcMatch[1];
    }

    // YouTube `si=` is share tracking, safe to strip. Vimeo `h=` is the
    // PRIVACY HASH for unlisted videos — stripping it caused the player
    // to show "Sign in to Vimeo to watch this video". Preserve it.
    url = url.replace(/[?&]si=[\w-]+/g, '');
    url = url.replace(/\?&/, '?').replace(/[?&]$/, '');

    if (url.includes('vimeo')) {
        // Capture the unlisted-video hash if present in the source URL.
        // Format varies: /video/12345/abc123, /12345/abc123, ?h=abc123
        const hashFromQuery = url.match(/[?&]h=([\w-]+)/)?.[1];
        const playerMatch = url.match(/player\.vimeo\.com\/video\/(\d+)(?:\/([\w-]+))?/);
        if (playerMatch) {
            const id = playerMatch[1];
            const hash = playerMatch[2] ?? hashFromQuery;
            return { embedUrl: vimeoEmbed(id, hash), platform: 'vimeo' };
        }
        const pageMatch = url.match(/vimeo\.com\/(?:video\/|channels\/[^/]+\/|groups\/[^/]+\/videos\/|[^/]+\/[^/]+\/)?(\d+)(?:\/([\w-]+))?/);
        if (pageMatch) {
            const id = pageMatch[1];
            const hash = pageMatch[2] ?? hashFromQuery;
            return { embedUrl: vimeoEmbed(id, hash), platform: 'vimeo' };
        }
        return null;
    }

    if (url.includes('youtube') || url.includes('youtu.be')) {
        const embedMatch = url.match(/youtube(?:-nocookie)?\.com\/embed\/([\w-]{11})/);
        if (embedMatch) return { embedUrl: `https://www.youtube.com/embed/${embedMatch[1]}`, platform: 'youtube' };
        const shortMatch = url.match(/youtu\.be\/([\w-]{11})/);
        if (shortMatch) return { embedUrl: `https://www.youtube.com/embed/${shortMatch[1]}`, platform: 'youtube' };
        const watchMatch = url.match(/youtube\.com\/watch\?(?:[^#]*&)?v=([\w-]{11})/);
        if (watchMatch) return { embedUrl: `https://www.youtube.com/embed/${watchMatch[1]}`, platform: 'youtube' };
        const shortsMatch = url.match(/youtube\.com\/shorts\/([\w-]{11})/);
        if (shortsMatch) return { embedUrl: `https://www.youtube.com/embed/${shortsMatch[1]}`, platform: 'youtube' };
        const liveMatch = url.match(/youtube\.com\/live\/([\w-]{11})/);
        if (liveMatch) return { embedUrl: `https://www.youtube.com/embed/${liveMatch[1]}`, platform: 'youtube' };
        return null;
    }

    return null;
}

/**
 * youtubeSearchPageUrl — build a YouTube search-results URL for the
 * given exercise name. Used by the "Watch tutorial on YouTube" card
 * in ExerciseModal when no curated video and no GIF exist.
 *
 * We append " exercise tutorial" to bias the search toward
 * instructional uploads. Opening this URL on a phone with the
 * YouTube app installed routes through the app via URL handlers,
 * which feels native; on web it opens the YouTube search page.
 *
 * NOTE: an earlier iteration of this helper exported a companion
 * `youtubeSearchEmbedUrl()` that returned an `<iframe src=…
 * listType=search&list=…>` URL meant to play the top result inline.
 * YouTube has tightened embed restrictions across 2024-25 — most
 * search results now render "Video unavailable" inside that embed,
 * so the inline preview was net-negative UX. We pulled it; the
 * link-to-YouTube approach is reliable 100% of the time and is what
 * ships now.
 */
export function youtubeSearchPageUrl(exerciseName: string): string {
    const q = encodeURIComponent(`${exerciseName.trim()} exercise tutorial`);
    return `https://www.youtube.com/results?search_query=${q}`;
}

// Build a Vimeo embed URL, preserving the unlisted-video privacy hash
// (otherwise the player demands a Vimeo sign-in for unlisted content)
// and adding `dnt=1` so the player doesn't drop tracking cookies which
// modern browsers block in third-party contexts.
function vimeoEmbed(id: string, hash?: string): string {
    const params = new URLSearchParams();
    if (hash) params.set('h', hash);
    params.set('dnt', '1');
    return `https://player.vimeo.com/video/${id}?${params.toString()}`;
}
