import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { useLanguage } from '../../context/LanguageContext';
import { ProgressCharts } from './ProgressCharts';
import {
    Calendar,
    Scale,
    Activity,
    TrendingUp,
    MessageSquare,
    PlaySquare,
    Camera,
    CheckCircle2
} from 'lucide-react';

export const ClientDashboard = () => {
    const { user } = useAuth();
    const { clients, getClientWeeks, completeOnboarding, createProgram } = useData();
    const { t } = useLanguage();
    const navigate = useNavigate();

    const client = clients.find(c => c.userId === user?.id);

    // Onboarding form state
    const [formData, setFormData] = useState({
        startingWeight: '',
        height: '',
        goal: 'fat_loss',
        activityLevel: 'sedentary',
        dietHistory: '',
        injuries: ''
    });

    const goals = [
        { id: 'fat_loss', label: t('objFatLoss'), desc: t('objFatLossDesc') },
        { id: 'muscle_gain', label: t('objMuscleGain'), desc: t('objMuscleGainDesc') },
        { id: 'recomp', label: t('objRecomp'), desc: t('objRecompDesc') },
        { id: 'performance', label: t('objPerformance'), desc: t('objPerformanceDesc') }
    ];

    const photoAngles = [
        { key: 'front', label: t('front') },
        { key: 'side', label: t('side') },
        { key: 'back', label: t('back') },
    ];

    const defaultTargets = {
        highCarb: { carbs: 280, protein: 180, fats: 60, calories: 2380 },
        lowCarb: { carbs: 140, protein: 180, fats: 75, calories: 1955 }
    };

    const handleIntakeSubmit = () => {
        if (client && formData.startingWeight && formData.height) {
            completeOnboarding(client.id, formData);
            createProgram(client.id, defaultTargets);
        } else {
            alert(t('fillRequired'));
        }
    };

    if (!client) {
        return <div className="text-white">{t('clientRecord')}</div>;
    }

    // ========================================================
    // STATE 1: ONBOARDING (isOnboarding === true)
    // ========================================================
    if (client.isOnboarding) {
        return (
            <div className="max-w-3xl mx-auto py-4 animate-in fade-in duration-500">
                <div className="text-center mb-6">
                    <h1 className="text-3xl font-bold text-white mb-2">{t('welcomeClient')} {client.name}! 👋</h1>
                    <p className="text-navy-200">{t('completeIntake')}</p>
                </div>

                <div className="clay-card p-8 space-y-8">

                    {/* Weight & Height */}
                    <section className="space-y-4">
                        <h2 className="text-lg font-bold text-white border-b border-white/[0.04] pb-2">{t('baseMeasurements')} <span className="text-red-400">*</span></h2>
                        <div className="grid grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm text-navy-200 mb-2">{t('weightKg')}</label>
                                <input
                                    type="number"
                                    value={formData.startingWeight}
                                    onChange={e => setFormData({ ...formData, startingWeight: e.target.value })}
                                    className="w-full clay-input p-4 text-lg"
                                    placeholder="75"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm text-navy-200 mb-2">{t('heightCm')}</label>
                                <input
                                    type="number"
                                    value={formData.height}
                                    onChange={e => setFormData({ ...formData, height: e.target.value })}
                                    className="w-full clay-input p-4 text-lg"
                                    placeholder="175"
                                    required
                                />
                            </div>
                        </div>
                    </section>

                    {/* Physique Documentation */}
                    <section className="space-y-4">
                        <h2 className="text-lg font-bold text-white border-b border-white/[0.04] pb-2">{t('physiqueDocumentation')}</h2>
                        <p className="text-navy-300 text-sm">{t('uploadPhotos')}</p>
                        <div className="grid grid-cols-3 gap-4">
                            {photoAngles.map(angle => (
                                <label
                                    key={angle.key}
                                    className="aspect-[3/4] rounded-xl border-2 border-dashed border-navy-600 flex flex-col items-center justify-center gap-3 text-navy-400 hover:border-gold-500/40 hover:bg-navy-800/30 transition-all cursor-pointer group"
                                >
                                    <Camera size={28} className="group-hover:text-gold-400 transition-colors" />
                                    <span className="text-sm font-medium">{angle.label}</span>
                                    <span className="text-xs text-navy-500">{t('noFileChosen')}</span>
                                    <input type="file" className="hidden" accept="image/*" />
                                </label>
                            ))}
                        </div>
                    </section>

                    {/* Current Nutrition */}
                    <section className="space-y-4">
                        <h2 className="text-lg font-bold text-white border-b border-white/[0.04] pb-2">{t('currentNutrition')}</h2>
                        <textarea
                            value={formData.dietHistory}
                            onChange={e => setFormData({ ...formData, dietHistory: e.target.value })}
                            placeholder={t('nutritionPlaceholder')}
                            className="w-full h-28 clay-input p-4 placeholder-navy-500 resize-none"
                        />
                    </section>

                    {/* Primary Objectives */}
                    <section className="space-y-4">
                        <h2 className="text-lg font-bold text-white border-b border-white/[0.04] pb-2">{t('primaryObjectives')}</h2>
                        <div className="grid grid-cols-2 gap-3">
                            {goals.map(goal => (
                                <button
                                    key={goal.id}
                                    onClick={() => setFormData({ ...formData, goal: goal.id })}
                                    className={`flex items-center justify-between p-4 rounded-xl border text-left transition-all ${formData.goal === goal.id
                                        ? "bg-gold-500/10 border-gold-500/50"
                                        : "clay-inset border-white/[0.04] hover:border-navy-500"
                                        }`}
                                >
                                    <div>
                                        <div className={`font-bold ${formData.goal === goal.id ? "text-gold-400" : "text-white"}`}>{goal.label}</div>
                                        <div className="text-xs text-navy-300">{goal.desc}</div>
                                    </div>
                                    {formData.goal === goal.id && <CheckCircle2 className="text-gold-400 shrink-0" size={20} />}
                                </button>
                            ))}
                        </div>
                    </section>

                    {/* Submit */}
                    <div className="pt-6 border-t border-white/[0.04]">
                        <button
                            onClick={handleIntakeSubmit}
                            disabled={!formData.startingWeight || !formData.height}
                            className="w-full clay-button bg-gradient-to-r from-gold-400 to-gold-600 disabled:from-navy-700 disabled:to-navy-700 disabled:cursor-not-allowed text-navy-950 py-4 text-lg flex items-center justify-center gap-2 gold-glow"
                        >
                            <CheckCircle2 size={22} /> {t('submitIntake')}
                        </button>
                        <p className="text-center text-sm text-navy-300 mt-4">
                            {t('coachWillReview')}
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    // ========================================================
    // STATE 2: PENDING COACH (currentWeek === 0, isOnboarding === false)
    // ========================================================
    if (client.currentWeek === 0) {
        return (
            <div className="max-w-2xl mx-auto py-12 px-4 text-center animate-in fade-in duration-500">
                <div className="clay-card p-10">
                    <div className="w-20 h-20 bg-gold-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Activity size={40} className="text-gold-400" />
                    </div>
                    <h1 className="text-3xl font-bold text-white mb-4">{t('allSetTitle')} 🎉</h1>
                    <p className="text-navy-200 text-lg mb-8 leading-relaxed">
                        {t('intakeReceived')} <br />
                        {t('coachBuilding')}
                    </p>
                    <div className="inline-flex items-center gap-2 clay-card-sm px-5 py-2 text-navy-200 text-sm">
                        <span className="w-2 h-2 rounded-full bg-gold-400 animate-pulse" />
                        {t('statusPendingReview')}
                    </div>
                </div>
            </div>
        );
    }

    // ========================================================
    // STATE 3: ACTIVE CLIENT (currentWeek >= 1)
    // ========================================================
    const weeks = getClientWeeks(client.id);
    const currentWeekIndex = client.currentWeek - 1;
    const currentWeekData = weeks[currentWeekIndex];

    if (!currentWeekData) {
        return <div className="text-white">{t('weekData')}</div>;
    }

    // Find any recently reviewed weeks with feedback that the client hasn't "seen"
    const reviewedWeeksWithFeedback = weeks.filter(w =>
        (w.status === 'reviewed' || w.status === 'locked') && w.coachFeedback
    );
    const latestReviewedWeek = reviewedWeeksWithFeedback.length > 0
        ? reviewedWeeksWithFeedback[reviewedWeeksWithFeedback.length - 1]
        : null;

    return (
        <div className="space-y-8 animate-in fade-in duration-500 pb-20 md:pb-0">

            {/* NEW FEEDBACK BANNER */}
            {latestReviewedWeek && (
                <button
                    onClick={() => navigate('/checkin')}
                    className="w-full clay-card p-5 flex items-center gap-4 border border-gold-500/20 hover:border-gold-500/40 transition-all group animate-in slide-in-from-top duration-500"
                    style={{ background: 'linear-gradient(135deg, rgba(212,160,23,0.08), rgba(14,19,56,0.6))' }}
                >
                    <div className="w-12 h-12 rounded-full bg-gold-500/15 flex items-center justify-center shrink-0">
                        <MessageSquare size={22} className="text-gold-400" />
                    </div>
                    <div className="text-left flex-1 min-w-0">
                        <h3 className="text-white font-bold group-hover:text-gold-400 transition-colors">
                            🎉 Coach Zack reviewed your Week {latestReviewedWeek.weekNumber}!
                        </h3>
                        <p className="text-navy-200 text-sm truncate">
                            "{latestReviewedWeek.coachFeedback}"
                        </p>
                    </div>
                    <div className="text-gold-400 text-sm font-medium shrink-0 hidden md:block">
                        Read feedback →
                    </div>
                </button>
            )}

            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-white">{t('welcomeBack')} {client.name.split(' ')[0]} 👋</h1>
                    <p className="text-navy-200">{t('weekOverview')}</p>
                </div>
                <div className="flex gap-2">
                    <span className="px-3 py-1 rounded-full clay-card-sm text-navy-100 text-sm font-medium capitalize">
                        {t(client.category as any)} {t('phase')}
                    </span>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="clay-card-sm p-4 flex flex-col justify-between">
                    <div className="flex items-center gap-2 text-navy-200 mb-2">
                        <Calendar size={18} />
                        <span className="text-sm">{t('week')}</span>
                    </div>
                    <div className="text-2xl font-bold text-white">
                        {client.currentWeek} <span className="text-navy-400 text-lg font-normal">/ {client.programLength}</span>
                    </div>
                </div>

                <div className="clay-card-sm p-4 flex flex-col justify-between">
                    <div className="flex items-center gap-2 text-navy-200 mb-2">
                        <Scale size={18} />
                        <span className="text-sm">{t('latestWeight')}</span>
                    </div>
                    <div className="text-2xl font-bold text-white">
                        {weeks[currentWeekIndex - 1]?.minWeight ?? weeks[0]?.minWeight ?? '--'} <span className="text-sm font-normal text-navy-400">kg</span>
                    </div>
                </div>

                <div className="clay-card-sm p-4 flex flex-col justify-between">
                    <div className="flex items-center gap-2 text-navy-200 mb-2">
                        <TrendingUp size={18} />
                        <span className="text-sm">{t('status')}</span>
                    </div>
                    <div className="text-2xl font-bold text-gold-400">
                        {t('active')}
                    </div>
                </div>

                <div className="clay-card-sm p-4 flex flex-col justify-between">
                    <div className="flex items-center gap-2 text-navy-200 mb-2">
                        <Activity size={18} />
                        <span className="text-sm">{t('checkIn')}</span>
                    </div>
                    <div className="text-lg font-bold text-gold-300">
                        {currentWeekData.status === 'pending' ? t('dueSunday') : t('submitted')}
                    </div>
                </div>
            </div>

            {/* Targets */}
            <section>
                <h3 className="text-xl font-bold text-white mb-4">{t('yourTargets')}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* High Carb Card */}
                    <div className="clay-card p-6 relative overflow-hidden" style={{ background: 'linear-gradient(145deg, rgba(14,19,56,0.4), rgba(6,8,20,0.9))' }}>
                        <h4 className="text-navy-300 font-bold tracking-wider text-sm mb-4">{t('highCarbDay')}</h4>
                        <div className="flex items-end gap-2 mb-6">
                            <span className="text-4xl font-bold text-white">{currentWeekData.activeTargets.highCarb.calories}</span>
                            <span className="text-navy-400 mb-1">kcal</span>
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                            <div className="clay-inset p-3 text-center">
                                <div className="text-xs text-navy-400 mb-1">{t('carbs')}</div>
                                <div className="text-lg font-bold text-white">{currentWeekData.activeTargets.highCarb.carbs}g</div>
                            </div>
                            <div className="clay-inset p-3 text-center">
                                <div className="text-xs text-navy-400 mb-1">{t('protein')}</div>
                                <div className="text-lg font-bold text-white">{currentWeekData.activeTargets.highCarb.protein}g</div>
                            </div>
                            <div className="clay-inset p-3 text-center">
                                <div className="text-xs text-navy-400 mb-1">{t('fats')}</div>
                                <div className="text-lg font-bold text-white">{currentWeekData.activeTargets.highCarb.fats}g</div>
                            </div>
                        </div>
                    </div>

                    {/* Low Carb Card */}
                    <div className="clay-card p-6 relative overflow-hidden" style={{ background: 'linear-gradient(145deg, rgba(212,160,23,0.05), rgba(6,8,20,0.9))' }}>
                        <h4 className="text-gold-500 font-bold tracking-wider text-sm mb-4">{t('lowCarbDay')}</h4>
                        <div className="flex items-end gap-2 mb-6">
                            <span className="text-4xl font-bold text-white">{currentWeekData.activeTargets.lowCarb.calories}</span>
                            <span className="text-navy-400 mb-1">kcal</span>
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                            <div className="clay-inset p-3 text-center">
                                <div className="text-xs text-navy-400 mb-1">{t('carbs')}</div>
                                <div className="text-lg font-bold text-white">{currentWeekData.activeTargets.lowCarb.carbs}g</div>
                            </div>
                            <div className="clay-inset p-3 text-center">
                                <div className="text-xs text-navy-400 mb-1">{t('protein')}</div>
                                <div className="text-lg font-bold text-white">{currentWeekData.activeTargets.lowCarb.protein}g</div>
                            </div>
                            <div className="clay-inset p-3 text-center">
                                <div className="text-xs text-navy-400 mb-1">{t('fats')}</div>
                                <div className="text-lg font-bold text-white">{currentWeekData.activeTargets.lowCarb.fats}g</div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Latest Feedback */}
            {weeks[currentWeekIndex - 1]?.coachFeedback && (
                <section className="clay-card p-6">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-full bg-navy-800 flex items-center justify-center text-gold-400">
                            <MessageSquare size={20} />
                        </div>
                        <div>
                            <h4 className="text-white font-bold">{t('latestCoachFeedback')}</h4>
                            <p className="text-xs text-navy-400">{t('fromWeek')} {currentWeekIndex}</p>
                        </div>
                    </div>
                    <p className="text-navy-100 leading-relaxed italic border-l-2 border-gold-500 pl-4 py-1">
                        "{weeks[currentWeekIndex - 1].coachFeedback}"
                    </p>
                </section>
            )}

            {/* Progress Charts */}
            <ProgressCharts weeks={weeks} />

            {/* Quick Actions */}
            <div className="flex flex-col md:flex-row gap-4">
                <button
                    onClick={() => navigate('/checkin')}
                    className="flex-1 clay-button bg-gradient-to-r from-gold-400 to-gold-600 text-navy-950 p-4 flex items-center justify-center gap-2 gold-glow"
                >
                    <Calendar size={20} />
                    {currentWeekData.status === 'pending' ? t('updateDailyTracking') : t('viewCheckIn')}
                </button>
                <button
                    onClick={() => navigate('/library')}
                    className="flex-1 clay-button bg-navy-800 hover:bg-navy-700 text-white p-4 flex items-center justify-center gap-2"
                >
                    <PlaySquare size={20} />
                    {t('watchCourses')}
                </button>
            </div>
        </div>
    );
};
