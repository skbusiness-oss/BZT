import { useNavigate } from 'react-router-dom';
import { PlaySquare, Lock, ArrowUpRight, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';

export const CommunityDashboard = () => {
    const { user } = useAuth();
    const { t } = useLanguage();
    const navigate = useNavigate();

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Welcome Section */}
            <div>
                <h1 className="text-3xl font-bold text-white">{t('communityDashTitle')} 👋</h1>
                <p className="text-navy-200 mt-2">{t('communitySubtitle')}</p>
            </div>

            {/* Membership Card */}
            <div className="clay-card p-6 relative overflow-hidden" style={{ background: 'linear-gradient(145deg, rgba(14,19,56,0.4), rgba(6,8,20,0.9))' }}>
                <div className="absolute top-0 right-0 w-64 h-64 bg-gold-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />

                <div className="relative z-10">
                    <div className="flex justify-between items-start mb-6">
                        <div>
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gold-500/10 text-gold-400 text-sm font-medium mb-3">
                                <div className="w-2 h-2 rounded-full bg-gold-400 animate-pulse" />
                                Community Membership Active
                            </div>
                            <h2 className="text-xl font-bold text-white">Ready to level up?</h2>
                            <p className="text-navy-200 max-w-lg mt-2">
                                Unlock personalized coaching, weekly check-ins, and custom macro targets designed for your goals.
                            </p>
                        </div>
                        <button className="hidden md:flex items-center gap-2 clay-button bg-gradient-to-r from-gold-400 to-gold-600 text-navy-950 px-6 py-2.5">
                            Upgrade Now <ArrowUpRight size={18} />
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="flex items-center gap-3 text-navy-100 clay-card-sm p-3">
                            <CheckCircle2 className="text-gold-400" size={20} />
                            <span>Full Video Library</span>
                        </div>
                        <div className="flex items-center gap-3 text-navy-100 clay-card-sm p-3">
                            <CheckCircle2 className="text-gold-400" size={20} />
                            <span>Community Forums</span>
                        </div>
                        <div className="flex items-center gap-3 text-navy-400 clay-card-sm p-3 opacity-60">
                            <Lock className="text-navy-500" size={20} />
                            <span>1-on-1 Coaching</span>
                        </div>
                    </div>

                    <button className="w-full md:hidden mt-6 flex items-center justify-center gap-2 clay-button bg-gradient-to-r from-gold-400 to-gold-600 text-navy-950 px-6 py-2.5">
                        Upgrade Now <ArrowUpRight size={18} />
                    </button>
                </div>
            </div>

            {/* Quick Actions */}
            <section>
                <h3 className="text-lg font-bold text-white mb-4">Quick Actions</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <button
                        onClick={() => navigate('/library')}
                        className="group flex items-center gap-4 clay-card p-6 hover:border-gold-500/20 transition-all"
                    >
                        <div className="w-12 h-12 rounded-xl bg-navy-400/15 text-navy-300 flex items-center justify-center group-hover:scale-110 transition-transform">
                            <PlaySquare size={24} />
                        </div>
                        <div className="text-left">
                            <h4 className="text-white font-bold text-lg group-hover:text-gold-400 transition-colors">{t('browseVideos')}</h4>
                            <p className="text-navy-300 text-sm">{t('accessFreeContent')}</p>
                        </div>
                    </button>

                    <div className="flex items-center gap-4 clay-card p-6 opacity-60 cursor-not-allowed relative overflow-hidden">
                        <div className="absolute inset-0 bg-navy-950/60 flex items-center justify-center z-10 backdrop-blur-[1px]">
                            <div className="flex items-center gap-2 px-4 py-2 clay-card-sm text-navy-200 text-sm font-medium">
                                <Lock size={14} /> {t('upgradeToUnlock')}
                            </div>
                        </div>
                        <div className="w-12 h-12 rounded-xl bg-navy-400/15 text-navy-300 flex items-center justify-center">
                            <CheckCircle2 size={24} />
                        </div>
                        <div className="text-left">
                            <h4 className="text-white font-bold text-lg">Weekly Check-Ins</h4>
                            <p className="text-navy-300 text-sm">Track progress with a coach</p>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
};
