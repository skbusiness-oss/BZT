// VideoWatermark.tsx
// Per-user watermark for any video frame. Designed to overlay an iframe (which
// can't be DOM-modified cross-origin), so it must be rendered as a sibling
// inside a relatively-positioned wrapper, not inside the iframe.
//
// Properties:
//   - position: absolute; inset: 0 — fills the wrapper
//   - pointer-events: none — never blocks clicks
//   - faint white text with subtle shadow (~8% opacity) so it's visible on any
//     background but not too distracting
//   - tiles user.email diagonally
//   - slowly translates (~30s) so it can't be cleanly cropped out

import { useAuth } from '../../context/AuthContext';

interface VideoWatermarkProps {
    /** Optionally override the watermark text (defaults to user.email). */
    text?: string;
    /** Override opacity (0-1). Defaults to 0.08 (8%). */
    opacity?: number;
}

export const VideoWatermark = ({ text, opacity = 0.08 }: VideoWatermarkProps) => {
    const { user } = useAuth();
    const label = text ?? user?.email ?? '';

    if (!label) return null;

    // Build a tiled string: repeat the email enough times to fill a row, with
    // separators between repetitions so individual emails are still readable.
    const tile = `${label}    `; // four spaces between repeats
    const row = tile.repeat(8);

    return (
        <>
            <style>{`
                @keyframes bzt-watermark-drift {
                    0%   { transform: translate(0, 0) rotate(-22deg); }
                    50%  { transform: translate(-6%, -3%) rotate(-22deg); }
                    100% { transform: translate(0, 0) rotate(-22deg); }
                }
            `}</style>
            <div
                aria-hidden="true"
                style={{
                    position: 'absolute',
                    inset: 0,
                    overflow: 'hidden',
                    pointerEvents: 'none',
                    userSelect: 'none',
                    zIndex: 5,
                }}
            >
                <div
                    style={{
                        position: 'absolute',
                        // Make the inner area larger than the wrapper so rotation
                        // + translation never reveal an empty edge.
                        top: '-50%',
                        left: '-50%',
                        right: '-50%',
                        bottom: '-50%',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '2.5rem',
                        opacity,
                        color: '#ffffff',
                        textShadow: '0 1px 2px rgba(0,0,0,0.6)',
                        fontSize: '0.85rem',
                        fontWeight: 600,
                        letterSpacing: '0.05em',
                        whiteSpace: 'nowrap',
                        animation: 'bzt-watermark-drift 30s ease-in-out infinite',
                        willChange: 'transform',
                    }}
                >
                    {Array.from({ length: 18 }).map((_, i) => (
                        <div key={i} style={{ paddingLeft: `${(i % 3) * 6}rem` }}>
                            {row}
                        </div>
                    ))}
                </div>
            </div>
        </>
    );
};

export default VideoWatermark;
