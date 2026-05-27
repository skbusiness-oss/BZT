/**
 * CardioTrailerCard — the SMALL summary card on the community
 * dashboard that previews the full cardio planner. Tap routes to
 * /cardio for the full page (calculator + zone education +
 * machine variations + Academy link).
 *
 * Replaced the inline CardioCalculatorCard on the dashboard so
 * the dashboard stays scannable. The full calculator was eating
 * too much vertical real-estate alongside today's workout + diet
 * cards. The trailer is just an eyebrow + headline + one-line
 * preview of the user's MHR, with a clear chevron pointing at
 * the dedicated page.
 */
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { Flame, ChevronRight, Heart } from 'lucide-react';

export function CardioTrailerCard() {
    const { user } = useAuth();
    const { t, isRTL } = useLanguage();
    const navigate = useNavigate();

    const age = user?.age ?? 30;
    const mhr = Math.max(220 - age, 100);

    return (
        <button
            type="button"
            onClick={() => navigate('/cardio')}
            className="w-full text-start group flex items-center gap-4 p-4 rounded-2xl bg-surface-container-low hover:bg-surface-container ghost-border transition-all"
        >
            {/* Icon tile — orange tint to read as "cardio" (the
                rest of the dashboard uses gold for primary actions,
                so this stays distinct). */}
            <span className="w-12 h-12 rounded-2xl bg-orange-500/15 text-orange-400 flex items-center justify-center shrink-0">
                <Flame size={22} strokeWidth={2.2} />
            </span>

            <div className="flex-1 min-w-0">
                <div className="text-[10px] font-label font-bold uppercase tracking-widest text-on-surface/45 mb-0.5">
                    {t('cardioTrailerEyebrow')}
                </div>
                <div className="font-headline font-bold text-on-surface text-[16px] leading-tight">
                    {t('cardioTrailerTitle')}
                </div>
                <div className="text-[12px] text-on-surface/55 font-body mt-1 flex items-center gap-2" dir="ltr">
                    <Heart size={11} className="text-rose-400 shrink-0" />
                    <span>{t('cardioTrailerMhrInline')?.replace('{mhr}', String(mhr))}</span>
                </div>
            </div>

            <ChevronRight
                size={18}
                className="text-on-surface/40 group-hover:text-primary shrink-0 transition-colors"
                style={{ transform: isRTL ? 'rotate(180deg)' : undefined }}
            />
        </button>
    );
}
