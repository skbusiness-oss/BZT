import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useSelfLogs } from '../hooks/useSelfLogs';
import { ClipboardList, TrendingUp, PartyPopper, CheckCircle } from 'lucide-react';
import { ProgressPanel } from '../components/profile/ProgressPanel';
import { CoachingJourneyPanel } from '../components/profile/CoachingJourneyPanel';
import { CardioCalculatorCard } from '../components/dashboard/CardioCalculatorCard';

// Profile / Update page — purely about the user updating their own
// metrics (weight, energy, hunger, photos, etc.) and reviewing past
// progress. The community-to-coaching upgrade pitch lives on its own
// dedicated /upgrade route now — don't mount UpgradeOffer here.

const todayISO = () => new Date().toISOString().slice(0, 10);

export const Profile = () => {
    const { user } = useAuth();
    const { t } = useLanguage();
    // Use the same self-logs hook the ProgressPanel uses so the
    // cardio log written from the calculator card lands in the same
    // collection the chart reads from. Defaults to the signed-in
    // user — exactly what we want here.
    const { addLog } = useSelfLogs();
    const [congrats, setCongrats] = useState(false);

    if (!user) return null;

    const isCoachingClient = user.role === 'client';
    const isCommunity = user.role === 'community';
    const showProgress = isCoachingClient || isCommunity;

    /** Cardio-calculator hand-off. Composes the picked zone +
     *  duration + target HR band into a notes string, then writes
     *  the kcal estimate to today's self-log so it shows up on the
     *  user's ProgressPanel chart alongside their weight + scales. */
    const handleSaveCardio = async (entry: {
        zone: 'fat' | 'heart';
        durationMin: number;
        targetKcal: number;
        targetHrLow: number;
        targetHrHigh: number;
        notes: string;
    }) => {
        const zoneLabel = entry.zone === 'fat'
            ? (t('cardioCalcZoneFatTitle') || 'Fat burn')
            : (t('cardioCalcZoneHeartTitle') || 'Train heart');
        const composedNotes = [
            `${zoneLabel} · ${entry.durationMin} min · ${entry.targetHrLow}-${entry.targetHrHigh} bpm`,
            entry.notes.trim(),
        ].filter(Boolean).join(' — ');
        await addLog({
            date: todayISO(),
            metrics: { cardioCalories: entry.targetKcal },
            notes: composedNotes,
        });
        // Trigger the celebratory banner — same pattern as the
        // CheckIn page's post-submit celebration. 8s auto-dismiss.
        setCongrats(true);
        window.setTimeout(() => setCongrats(false), 8000);
    };

    return (
        <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-500 pt-4 pb-20">
            <header className="mb-2">
                <span className="font-label text-[10px] font-bold uppercase tracking-widest text-primary block mb-2">
                    {t('memberIdentityEyebrow')}
                </span>
                <h1 className="font-headline font-extrabold text-5xl md:text-6xl text-on-surface tracking-tighter">
                    {t('profileTitle')}<span className="text-primary-container">.</span>
                </h1>
            </header>

            {/* Celebration banner — fires after the cardio calculator
                saves to today's log. Sits above everything so it's
                impossible to miss. Auto-dismisses after 8s. */}
            {congrats && (
                <div className="bg-gradient-to-br from-emerald-500/15 via-emerald-500/10 to-emerald-500/8 border border-emerald-500/30 rounded-2xl p-5 flex items-start gap-4 bzt-rise-in">
                    <span className="w-12 h-12 rounded-full bg-emerald-500/25 text-emerald-400 flex items-center justify-center shrink-0">
                        <PartyPopper size={22} strokeWidth={2.2} />
                    </span>
                    <div className="flex-1 min-w-0">
                        <h3 className="font-headline font-bold text-emerald-300 text-lg leading-tight mb-1 flex items-center gap-2">
                            <CheckCircle size={14} className="shrink-0" />
                            {t('selfLogCongratsTitle')}
                        </h3>
                        <p className="text-on-surface/80 font-body text-[13.5px] leading-relaxed">
                            {t('selfLogCongratsBody')}
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={() => setCongrats(false)}
                        className="text-on-surface/40 hover:text-on-surface/80 text-[12px] font-label font-bold uppercase tracking-widest shrink-0 self-start"
                    >
                        ✕
                    </button>
                </div>
            )}

            {/* Cardio calculator — community users only. Coaching
                clients already get a cardio target prescribed by
                Coach Med (visible in their CheckIn wizard's coach
                pill), so the calculator would compete with that
                guidance for them. */}
            {isCommunity && (
                <CardioCalculatorCard onSaveCardio={handleSaveCardio} />
            )}

            {showProgress && (
                <section>
                    <div className="flex items-center gap-3 mb-6 px-2">
                        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20">
                            <TrendingUp size={20} className="text-primary" />
                        </div>
                        <h3 className="font-headline font-bold text-2xl text-on-surface tracking-tight">
                            {isCoachingClient ? t('myJourneyTitle') : t('profileProgress')}
                        </h3>
                    </div>
                    {isCoachingClient ? <CoachingJourneyPanel /> : <ProgressPanel />}
                </section>
            )}

            {!showProgress && (
                <section className="bg-surface-container-low rounded-2xl p-8 ghost-border">
                    <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20 shrink-0">
                            <ClipboardList size={22} className="text-primary" />
                        </div>
                        <div>
                            <h2 className="font-headline font-extrabold text-2xl text-on-surface tracking-tight">
                                Update center
                            </h2>
                            <p className="text-sm font-body text-on-surface/60 mt-2 max-w-2xl">
                                Client and community weekly updates live on their own accounts. Use the dashboard, Clients, and review pages to track submissions from the coach side.
                            </p>
                        </div>
                    </div>
                </section>
            )}
        </div>
    );
};
