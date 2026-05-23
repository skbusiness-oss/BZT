/**
 * BrandLogo — the BioZackTeam wordmark.
 *
 * Single source of truth for the brand image so we can swap the asset
 * once and have every surface (Login, Welcome, splash, future header)
 * pick it up.
 *
 * The source file lives at `/brand-logo.png` in the public folder. It's
 * the full square brand mark (BZT monogram + "Solo Squad" eyebrow +
 * "BIOZACKTEAM" wordmark + tagline) on the dark background. The image
 * itself ships its own dark backdrop, so on light theme the logo reads
 * as a contained card — intentional, keeps the brand identity crisp
 * regardless of the surrounding surface.
 *
 * Size variants:
 *   - sm  (64px) — sidebar headers, footer chips
 *   - md (120px) — Login hero, Welcome step icon slot
 *   - lg (200px) — splash screens, first-paint hero
 *
 * Pass `glow` to wrap the logo in a faint gold halo — used on the
 * Login/Welcome pages so the mark feels lit from behind.
 */
import { useLanguage } from '../../context/LanguageContext';

type LogoSize = 'sm' | 'md' | 'lg';

const PX: Record<LogoSize, number> = {
    sm: 64,
    md: 120,
    lg: 200,
};

interface Props {
    size?: LogoSize;
    glow?: boolean;
    className?: string;
}

export function BrandLogo({ size = 'md', glow = false, className = '' }: Props) {
    const { t } = useLanguage();
    const px = PX[size];

    return (
        <div className={`relative inline-block ${className}`} style={{ width: px, height: px }}>
            {glow && (
                <div
                    aria-hidden
                    className="absolute inset-0 rounded-full pointer-events-none bzt-halo-drift"
                    style={{
                        background: 'radial-gradient(circle, rgb(var(--primary) / 0.30) 0%, transparent 65%)',
                        filter: 'blur(24px)',
                        transform: 'scale(1.25)',
                    }}
                />
            )}
            <img
                src="/brand-logo.png"
                alt={t('brandLogoAlt') || 'BioZackTeam'}
                width={px}
                height={px}
                draggable={false}
                className="relative w-full h-full object-contain rounded-2xl select-none"
                // Eager-load on the few surfaces that use this — the
                // brand is a primary visual anchor, and the file is
                // pre-warmed by the service worker so the network cost
                // is paid once on install.
                loading="eager"
                decoding="async"
            />
        </div>
    );
}
