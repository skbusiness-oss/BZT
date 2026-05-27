/**
 * CompletionCelebration — the shared "you finished something" screen.
 *
 * Lifted from WorkoutDayView, generalised to cover three surfaces:
 *   1. Workout day complete       (WorkoutDayView)
 *   2. Weekly metrics logged      (ProgressPanel, community users)
 *   3. Weekly check-in submitted  (CheckIn, coaching clients)
 *
 * Founder direction: the "Day 3 Complete!" pattern is the right
 * celebration tone for ALL three of these moments — not just the
 * workout. A small banner doesn't hit the same dopamine note.
 *
 * Visual: centered Trophy + Sparkles pop, large 🎉 headline,
 * one-line subtitle (next step, e.g. "Tomorrow: Rest Day" or
 * "Coach will reply within a few days"), gold pill CTA.
 *
 * Layout: takes over the surface it's mounted on — the parent is
 * expected to render this in place of its normal content while
 * the celebration is showing, then swap back when the user taps
 * the CTA or the optional dismiss.
 */
import { Trophy, Sparkles, ArrowLeft, ArrowRight } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

interface Props {
    /** Big headline, e.g. "Day 3 Complete!" or "Week 4 Submitted!".
     *  Caller renders any emoji in the string directly. */
    title: string;
    /** One-line context underneath the title. e.g.
     *  "Tomorrow: Rest Day" / "Coach will reply within a few days". */
    subtitle?: string;
    /** Gold CTA label, e.g. "Back to Dashboard". */
    ctaLabel: string;
    /** Fires when the user taps the gold CTA pill. */
    onCta: () => void;
    /** Optional secondary "stay on this page" affordance. Renders a
     *  small muted text link under the gold pill. Skip for surfaces
     *  where staying makes no sense (workout day complete). */
    onDismiss?: () => void;
    /** Label for the dismiss link; defaults to a generic "Stay here". */
    dismissLabel?: string;
}

export function CompletionCelebration({ title, subtitle, ctaLabel, onCta, onDismiss, dismissLabel }: Props) {
    const { t, isRTL } = useLanguage();
    return (
        <div
            dir={isRTL ? 'rtl' : 'ltr'}
            className="min-h-[60vh] flex flex-col items-center justify-center text-center space-y-6 animate-in fade-in zoom-in-95 duration-500 pb-20 px-6"
        >
            <div className="relative">
                <Trophy className="text-primary animate-bounce" size={64} />
                <Sparkles
                    className="text-primary-fixed absolute -top-2 -right-2 animate-pulse"
                    size={24}
                    style={isRTL ? { right: 'auto', left: -8 } : undefined}
                />
            </div>

            <h1 className="text-3xl font-extrabold text-on-surface max-w-md leading-tight">
                {title}
            </h1>

            {subtitle && (
                <p className="text-on-surface/70 text-lg max-w-sm">
                    {subtitle}
                </p>
            )}

            <button
                type="button"
                onClick={onCta}
                className="py-4 px-8 rounded-full font-label text-[12px] font-bold uppercase tracking-widest text-on-primary bg-gradient-to-r from-primary to-primary-container shadow-[0_5px_15px_rgba(230,195,100,0.3)] hover:scale-[1.02] active:scale-[0.98] transition-all inline-flex items-center gap-2"
            >
                {isRTL ? <ArrowRight size={14} /> : <ArrowLeft size={14} />}
                {ctaLabel}
            </button>

            {onDismiss && (
                <button
                    type="button"
                    onClick={onDismiss}
                    className="text-on-surface/45 hover:text-on-surface/75 text-[11px] font-label font-bold uppercase tracking-widest transition-colors"
                >
                    {dismissLabel ?? t('celebrationStayHere') ?? 'Stay on this page'}
                </button>
            )}
        </div>
    );
}
