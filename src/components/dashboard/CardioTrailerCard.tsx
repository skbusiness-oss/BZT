/**
 * CardioTrailerCard — the dashboard's entry-point for the full
 * Cardio Plan page (/cardio). Visually MATCHES TodayWorkoutCard +
 * TodayDietCard so the three "Today" cards form a consistent
 * stack instead of a small slim row breaking the rhythm between
 * two full-bleed photo cards.
 *
 * Pattern lifted from biozackteam/shared.tsx hero cards:
 *   - 220px min-height
 *   - Hero photo background
 *   - Multi-layer gradient overlay (multiply + bottom darkening)
 *   - Eyebrow + headline + purpose line + body + CTA pill
 *   - Tap-anywhere → onClick navigates
 *
 * Tap-target is the entire card. Routes to /cardio for the full
 * planner (zones, machine variations, calculator, Academy link).
 */
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { t, goldGradient, pillPad, pillPadSm } from './biozackteam/shared';

// Cardio-themed hero — the endurance cover (a running / cardio shot)
// is the closest match across the existing /workout-covers/* set.
// If you later add a dedicated cardio photo, swap this path.
const HERO_PATH = '/workout-covers/goal-endurance.jpg';

export function CardioTrailerCard() {
    const { user } = useAuth();
    const { t: tx } = useLanguage();
    const navigate = useNavigate();

    const age = user?.age ?? 30;
    const mhr = Math.max(220 - age, 100);

    return (
        <div
            onClick={() => navigate('/cardio')}
            className="bzt-hero-card"
            style={{
                position: 'relative',
                borderRadius: 20,
                overflow: 'hidden',
                cursor: 'pointer',
                minHeight: 220,
                padding: 0,
                border: `1px solid ${t.outline}`,
                boxShadow: '0 8px 40px 0 rgba(0,0,0,0.25)',
            }}
        >
            {/* Layer 1 — Hero photo (endurance / cardio cover). The
                `.bzt-hero-photo` class adds the subtle scale on parent
                hover that the existing Today cards already use. */}
            <div className="bzt-hero-photo" style={{
                position: 'absolute', inset: 0,
                backgroundImage: `url(${HERO_PATH})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
            }} />

            {/* Layer 2 — Orange/amber gradient tint via multiply blend.
                Cardio reads as orange across the app (the dashboard
                pillar, the workout-day reminder, the flame icon
                everywhere) so the tint reinforces that semantic. */}
            <div style={{
                position: 'absolute', inset: 0,
                background: 'linear-gradient(135deg, rgba(255,140,40,0.55) 0%, rgba(255,90,30,0.40) 100%)',
                mixBlendMode: 'multiply',
            }} />

            {/* Layer 3 — Bottom darkening for legible text. */}
            <div style={{
                position: 'absolute', inset: 0,
                background: 'linear-gradient(180deg, rgba(0,0,0,0.10) 0%, rgba(0,0,0,0.50) 55%, rgba(0,0,0,0.85) 100%)',
            }} />

            {/* Content. Top row: eyebrow + MHR pill. Bottom: headline,
                purpose, sub, CTA. */}
            <div style={{
                position: 'relative', zIndex: 1, padding: 24,
                display: 'flex', flexDirection: 'column',
                justifyContent: 'space-between', minHeight: 220,
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16 }}>
                    <div style={{
                        fontFamily: t.body, fontSize: 11, fontWeight: 600,
                        letterSpacing: '0.16em', textTransform: 'uppercase',
                        color: 'rgba(255,255,255,0.82)',
                    }}>
                        {tx('cardioTrailerEyebrow')}
                    </div>
                    <div style={{
                        padding: pillPadSm, borderRadius: 999,
                        background: 'rgba(255,255,255,0.18)', backdropFilter: 'blur(8px)',
                        color: '#fff', fontFamily: t.body, fontSize: 11, fontWeight: 600,
                        textTransform: 'uppercase', letterSpacing: '0.1em', whiteSpace: 'nowrap',
                    }} dir="ltr">
                        {tx('cardioTrailerMhrPill')?.replace('{mhr}', String(mhr))}
                    </div>
                </div>

                <div>
                    <h2 style={{
                        fontFamily: t.display, fontSize: 26, fontWeight: 600,
                        color: '#fff', margin: '0 0 4px', letterSpacing: '-0.02em',
                        textShadow: '0 1px 3px rgba(0,0,0,0.45)',
                    }}>
                        {tx('cardioTrailerTitle')}
                    </h2>
                    {/* Inline purpose line — same visual rhythm as the
                        existing PurposeLine helper in shared.tsx
                        (gold pill prefix + line). Inlined here so we
                        don't have to export the helper. */}
                    <div style={{
                        display: 'inline-flex', alignItems: 'center', gap: 8,
                        marginBottom: 8,
                        fontFamily: t.body, fontSize: 11, fontWeight: 600,
                        letterSpacing: '0.12em', textTransform: 'uppercase',
                        color: '#e6c364',
                    }}>
                        <span style={{ width: 18, height: 1, background: '#e6c364', display: 'inline-block' }} />
                        {tx('cardioTrailerPurpose')}
                    </div>
                    <p style={{
                        fontFamily: t.body, fontSize: 12, color: 'rgba(255,255,255,0.82)',
                        margin: '0 0 14px',
                    }}>
                        {tx('cardioTrailerSub')}
                    </p>
                    <span style={{
                        display: 'inline-block',
                        padding: pillPad, borderRadius: 999,
                        background: goldGradient, color: t.onPrimaryFixed,
                        fontFamily: t.body, fontSize: 12, fontWeight: 600,
                        letterSpacing: '0.04em', textTransform: 'uppercase',
                    }}>
                        {tx('cardioTrailerCta')}
                    </span>
                </div>
            </div>
        </div>
    );
}
