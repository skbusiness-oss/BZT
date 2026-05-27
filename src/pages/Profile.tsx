import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { ClipboardList, TrendingUp } from 'lucide-react';
import { ProgressPanel } from '../components/profile/ProgressPanel';
import { CoachingJourneyPanel } from '../components/profile/CoachingJourneyPanel';

// Profile / Update page — purely about the user updating their own
// metrics (weight, energy, hunger, photos, etc.) and reviewing past
// progress.
//
// The cardio calculator card used to live here for a moment, then
// moved to CommunityBioZackTeam (the dashboard) because that's where
// "what am I doing today" lives — the calculator sits naturally next
// to the today's-workout + today's-diet cards. The post-log
// celebration banner that used to fire here also moved to its proper
// home: ProgressPanel, where the actual weekly metric submit happens.
// This page is now back to its original role: a thin shell around
// ProgressPanel for community / CoachingJourneyPanel for clients.

export const Profile = () => {
    const { user } = useAuth();
    const { t } = useLanguage();

    if (!user) return null;

    const isCoachingClient = user.role === 'client';
    const isCommunity = user.role === 'community';
    const showProgress = isCoachingClient || isCommunity;

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
