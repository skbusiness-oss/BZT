import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { rateLimits } from '../lib/validation';
import { Lock, Mail, ChevronRight, Dumbbell, Users, Globe, Loader2, LogIn, ArrowLeft } from 'lucide-react';

export const Login = () => {
    const { signIn, sendPasswordReset, authError, clearAuthError } = useAuth();
    const { t, lang, setLang, isRTL } = useLanguage();
    const navigate = useNavigate();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [showReset, setShowReset] = useState(false);
    const [resetEmail, setResetEmail] = useState('');
    const [resetSent, setResetSent] = useState(false);
    const [resetLoading, setResetLoading] = useState(false);

    const toggleLang = () => setLang(lang === 'en' ? 'ar' : 'en');

    const handlePasswordReset = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!rateLimits.passwordReset(resetEmail)) {
            setError('Too many reset attempts. Please wait 15 minutes before trying again.');
            return;
        }
        setResetLoading(true);
        const result = await sendPasswordReset(resetEmail);
        setResetLoading(false);
        if (result.error) {
            setError(result.error);
        } else {
            setResetSent(true);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        clearAuthError();
        setIsLoading(true);

        try {
            const result = await signIn(email, password);
            if (result.error) {
                setError(result.error);
            } else {
                navigate('/');
            }
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'An error occurred');
        } finally {
            setIsLoading(false);
        }
    };

    // Show coach-disabled message above any local form error
    const displayError = authError || error;

    return (
        <div className="min-h-screen flex bg-surface text-on-surface" style={{ direction: isRTL ? 'rtl' : 'ltr' }}>
            {/* Left Side - Branding */}
            <div className="w-full md:w-1/2 p-8 md:p-16 flex flex-col justify-center relative overflow-hidden bg-surface-container-lowest">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-primary/5 via-surface to-surface" />
                <div className="absolute -top-32 -left-32 w-96 h-96 bg-primary/10 rounded-full blur-[100px]" />
                <div className="absolute bottom-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-[80px]" />

                {/* Language Toggle */}
                <button
                    onClick={toggleLang}
                    className="absolute top-6 right-6 z-20 flex items-center gap-2 px-4 py-2.5 rounded-xl bg-surface-container-lowest border border-outline-variant/30 text-[10px] font-label font-bold uppercase tracking-widest text-on-surface/60 hover:text-on-surface hover:bg-surface-container transition-all shadow-sm"
                    style={{ [isRTL ? 'left' : 'right']: 24, [isRTL ? 'right' : 'left']: 'auto' }}
                >
                    <Globe size={16} />
                    <span>{lang === 'en' ? 'العربية' : 'English'}</span>
                </button>

                <div className="relative z-10 max-w-lg mx-auto w-full">
                    <div className="mb-16">
                        <p className="text-primary font-label uppercase tracking-[0.3em] text-xs font-bold mb-4">BioZackTeam</p>
                        <h1 className="text-5xl md:text-6xl font-headline font-extrabold text-on-surface tracking-tighter mb-4 leading-tight">
                            {t('loginWelcome')} <br/><span className="text-gradient-gold">{t('appName')}</span>
                        </h1>
                        <p className="text-on-surface/60 text-lg md:text-xl font-body">
                            {t('loginSubtitle')}
                        </p>
                    </div>

                    {/* Features List */}
                    <div className="space-y-8">
                        <div className="flex items-start gap-4">
                            <div className="w-12 h-12 rounded-full border border-primary/20 bg-surface-container-highest/60 flex items-center justify-center text-primary shrink-0">
                                <Dumbbell size={20} />
                            </div>
                            <div>
                                <h3 className="text-on-surface font-headline text-xl font-bold tracking-tight">{t('featureCoaching')}</h3>
                                <p className="text-sm text-on-surface/50 mt-1">{t('featureCoachingDesc')}</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-4">
                            <div className="w-12 h-12 rounded-full border border-white/5 bg-surface-container-low flex items-center justify-center text-on-surface/60 shrink-0">
                                <Users size={20} />
                            </div>
                            <div>
                                <h3 className="text-on-surface font-headline text-xl font-bold tracking-tight">{t('featureCommunity')}</h3>
                                <p className="text-sm text-on-surface/50 mt-1">{t('featureCommunityDesc')}</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-4">
                            <div className="w-12 h-12 rounded-full border border-white/5 bg-surface-container-low flex items-center justify-center text-on-surface/60 shrink-0">
                                <ChevronRight size={20} />
                            </div>
                            <div>
                                <h3 className="text-on-surface font-headline text-xl font-bold tracking-tight">{t('featurePrograms')}</h3>
                                <p className="text-sm text-on-surface/50 mt-1">{t('featureProgramsDesc')}</p>
                            </div>
                        </div>
                    </div>

                    {/* Mobile-only sign in form */}
                    <div className="md:hidden mt-12 bg-surface-container-low rounded-2xl border border-outline-variant/30 ghost-border p-8 shadow-xl">
                        {displayError && (
                            <div className="mb-6 p-4 rounded-xl bg-red-950/30 border border-red-500/20 text-red-400 text-sm font-body">
                                {displayError}
                            </div>
                        )}

                        <form className="space-y-6" onSubmit={handleSubmit}>
                            <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Email address" className="w-full bg-surface-container-lowest border border-outline-variant/30 outline-none focus:border-primary/50 rounded-xl py-4 px-4 text-base font-body text-on-surface placeholder-on-surface/30 transition-colors" required />
                            <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Password" className="w-full bg-surface-container-lowest border border-outline-variant/30 outline-none focus:border-primary/50 rounded-xl py-4 px-4 text-base font-body text-on-surface placeholder-on-surface/30 transition-colors tracking-widest" required minLength={6} />

                            <button type="submit" disabled={isLoading} className="w-full px-6 py-4 rounded-xl font-label text-[12px] font-bold uppercase tracking-widest bg-gradient-to-r from-primary to-primary-container text-on-primary border border-primary/20 shadow-[0_5px_15px_rgba(230,195,100,0.3)] hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 mt-8">
                                {isLoading ? <Loader2 size={20} className="animate-spin" /> : <><LogIn size={20} /> Sign In</>}
                            </button>
                        </form>
                    </div>
                </div>
            </div>

            {/* Right Side - Sign In / Reset Form (Desktop) */}
            <div className="hidden md:flex w-1/2 p-8 items-center justify-center bg-surface border-l border-outline-variant/30">
                <div className="w-full max-w-sm">
                    {showReset ? (
                        /* ── Password Reset Panel ── */
                        <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                            <button onClick={() => { setShowReset(false); setError(''); setResetSent(false); }} className="flex items-center gap-2 text-on-surface/50 hover:text-primary text-[10px] mb-8 transition-colors font-label uppercase tracking-widest font-bold">
                                <ArrowLeft size={16} /> {t('backToSignIn')}
                            </button>
                            <div className="mb-12">
                                <h2 className="text-4xl font-headline font-bold text-on-surface mb-3">{t('resetPassword')}</h2>
                                <p className="text-on-surface/60 font-body leading-relaxed">{t('resetPasswordDesc')}</p>
                            </div>
                            {resetSent ? (
                                <div className="p-5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm text-center font-body shadow-[0_5px_15px_rgba(16,185,129,0.1)]">
                                    {t('resetEmailSent')}
                                </div>
                            ) : (
                                <>
                                    {error && <div className="mb-6 p-4 rounded-xl bg-red-950/30 border border-red-500/20 text-red-400 text-sm font-body">{error}</div>}
                                    <form className="space-y-6" onSubmit={handlePasswordReset}>
                                        <div>
                                            <label className="block text-[10px] uppercase tracking-widest font-bold text-on-surface/60 mb-2">{t('loginEmailLabel')}</label>
                                            <div className="relative">
                                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-primary/50" size={20} />
                                                <input type="email" value={resetEmail} onChange={e => setResetEmail(e.target.value)} placeholder="name@example.com" className="w-full bg-surface-container-lowest border border-outline-variant/30 outline-none focus:border-primary/50 rounded-xl py-4 pl-12 pr-4 text-base font-body text-on-surface placeholder-on-surface/30 transition-colors" required />
                                            </div>
                                        </div>
                                        <button type="submit" disabled={resetLoading} className="w-full px-6 py-4 rounded-xl font-label text-[12px] font-bold uppercase tracking-widest bg-gradient-to-r from-primary to-primary-container text-on-primary border border-primary/20 shadow-[0_5px_15px_rgba(230,195,100,0.3)] hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center mt-8">
                                            {resetLoading ? <Loader2 size={20} className="animate-spin" /> : t('sendResetLink')}
                                        </button>
                                    </form>
                                </>
                            )}
                        </div>
                    ) : (
                        /* ── Sign In Panel ── */
                        <div className="animate-in fade-in slide-in-from-left-4 duration-300">
                            <div className="mb-12">
                                <h2 className="text-4xl font-headline font-bold text-on-surface mb-3">{t('loginSignIn')}</h2>
                                <p className="text-on-surface/60 font-body leading-relaxed">{t('signInCredentials')}</p>
                            </div>

                            {displayError && (
                                <div className="mb-6 p-4 rounded-xl bg-red-950/30 border border-red-500/20 text-red-400 text-sm font-body">
                                    {displayError}
                                </div>
                            )}

                            <form className="space-y-6" onSubmit={handleSubmit}>
                                <div>
                                    <label className="block text-[10px] uppercase tracking-widest font-bold text-on-surface/60 mb-2">{t('loginEmailLabel')}</label>
                                    <div className="relative">
                                        <Mail className={`absolute ${isRTL ? 'right-4' : 'left-4'} top-1/2 -translate-y-1/2 text-primary/50`} size={20} />
                                        <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="name@example.com" className={`w-full bg-surface-container-lowest border border-outline-variant/30 outline-none focus:border-primary/50 rounded-xl py-4 text-base font-body text-on-surface placeholder-on-surface/30 transition-colors ${isRTL ? 'pr-12 pl-4' : 'pl-12 pr-4'}`} required />
                                    </div>
                                </div>

                                <div>
                                    <div className="flex items-center justify-between mb-2">
                                        <label className="block text-[10px] uppercase tracking-widest font-bold text-on-surface/60">{t('loginPasswordLabel')}</label>
                                        <button type="button" onClick={() => { setShowReset(true); setError(''); setResetEmail(email); }} className="text-[10px] font-bold uppercase tracking-widest text-primary hover:text-primary-container transition-colors">
                                            {t('forgotPassword')}
                                        </button>
                                    </div>
                                    <div className="relative">
                                        <Lock className={`absolute ${isRTL ? 'right-4' : 'left-4'} top-1/2 -translate-y-1/2 text-primary/50`} size={20} />
                                        <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" className={`w-full bg-surface-container-lowest border border-outline-variant/30 outline-none focus:border-primary/50 rounded-xl py-4 text-base font-body text-on-surface placeholder-on-surface/30 transition-colors tracking-widest ${isRTL ? 'pr-12 pl-4' : 'pl-12 pr-4'}`} required minLength={6} />
                                    </div>
                                </div>

                                <button type="submit" disabled={isLoading} className="w-full px-6 py-4 rounded-xl font-label text-[12px] font-bold uppercase tracking-widest bg-gradient-to-r from-primary to-primary-container text-on-primary border border-primary/20 shadow-[0_5px_15px_rgba(230,195,100,0.3)] hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 mt-8">
                                    {isLoading ? <Loader2 size={20} className="animate-spin" /> : <><LogIn size={20} /> {t('signInButton')}</>}
                                </button>
                            </form>

                            <div className="mt-10 text-center text-[10px] font-label font-bold uppercase tracking-widest text-on-surface/40">
                                {t('noAccount')}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
