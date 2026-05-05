export function buildEmbedUrl(raw: string): { embedUrl: string; platform: 'youtube' | 'vimeo' } | null {
    const input = raw.trim();
    if (!input) return null;

    let url = input;
    if (input.includes('<iframe') || input.startsWith('<')) {
        const srcMatch = input.match(/\bsrc=["']([^"']+)["']/i);
        if (!srcMatch) return null;
        url = srcMatch[1];
    }

    url = url.replace(/[?&]si=[\w-]+/g, '').replace(/[?&]h=[\w-]+/g, '');
    url = url.replace(/\?&/, '?').replace(/[?&]$/, '');

    if (url.includes('vimeo')) {
        const playerMatch = url.match(/player\.vimeo\.com\/video\/(\d+)/);
        if (playerMatch) return { embedUrl: `https://player.vimeo.com/video/${playerMatch[1]}`, platform: 'vimeo' };
        const pageMatch = url.match(/vimeo\.com\/(?:video\/|channels\/[^/]+\/|groups\/[^/]+\/videos\/|[^/]+\/[^/]+\/)?(\d+)/);
        if (pageMatch) return { embedUrl: `https://player.vimeo.com/video/${pageMatch[1]}`, platform: 'vimeo' };
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
