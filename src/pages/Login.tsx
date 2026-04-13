import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { Lock, Mail, ChevronRight, Dumbbell, Users, Globe, Loader2, LogIn } from 'lucide-react';

export const Login = () => {
    const { signIn } = useAuth();
    const { t, lang, setLang, isRTL } = useLanguage();
    const navigate = useNavigate();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const toggleLang = () => setLang(lang === 'en' ? 'ar' : 'en');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
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

    return (
        <div className="min-h-screen flex" style={{ background: '#060814', direction: isRTL ? 'rtl' : 'ltr' }}>
            {/* Left Side - Branding */}
            <div className="w-full md:w-1/2 p-8 flex flex-col justify-center relative overflow-hidden">
                <div className="absolute inset-0" style={{ background: 'rgba(10,13,36,0.3)' }} />
                <div className="absolute -top-20 -left-20 w-96 h-96 bg-navy-600/10 rounded-full blur-3xl" />
                <div className="absolute bottom-0 right-0 w-96 h-96 bg-gold-500/5 rounded-full blur-3xl" />

                {/* Language Toggle */}
                <button
                    onClick={toggleLang}
                    className="absolute top-6 right-6 z-20 flex items-center gap-2 px-3 py-2 rounded-lg clay-card-sm text-sm text-navy-200 hover:text-white transition-colors"
                    style={{ [isRTL ? 'left' : 'right']: 24, [isRTL ? 'right' : 'left']: 'auto' }}
                >
                    <Globe size={16} />
                    <span>{lang === 'en' ? 'العربية' : 'English'}</span>
                </button>

                <div className="relative z-10 max-w-md mx-auto w-full">
                    <div className="mb-10">
                        <h1 className="text-4xl font-bold text-white mb-4">
                            {t('loginWelcome')} <span className="text-gradient-gold">{t('appName')}</span>
                        </h1>
                        <p className="text-navy-200 text-lg">
                            {t('loginSubtitle')}
                        </p>
                    </div>

                    {/* Features List */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-3 text-navy-200">
                            <div className="w-10 h-10 rounded-lg bg-gold-500/15 flex items-center justify-center text-gold-400 shrink-0">
                                <Dumbbell size={20} />
                            </div>
                            <div>
                                <h3 className="text-white font-medium">Personalized Coaching</h3>
                                <p className="text-sm text-navy-300">Custom macros, weekly check-ins, direct feedback</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 text-navy-200">
                            <div className="w-10 h-10 rounded-lg bg-navy-400/15 flex items-center justify-center text-navy-300 shrink-0">
                                <Users size={20} />
                            </div>
                            <div>
                                <h3 className="text-white font-medium">Active Community</h3>
                                <p className="text-sm text-navy-300">Share progress, tips, and celebrate wins together</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 text-navy-200">
                            <div className="w-10 h-10 rounded-lg bg-navy-300/10 flex items-center justify-center text-navy-200 shrink-0">
                                <ChevronRight size={20} />
                            </div>
                            <div>
                                <h3 className="text-white font-medium">100+ Training Programs</h3>
                                <p className="text-sm text-navy-300">Complete workout library with video guidance</p>
                            </div>
                        </div>
                    </div>

                    {/* Mobile-only sign in form */}
                    <div className="md:hidden mt-8 clay-card p-6 rounded-xl">
                        {error && (
                            <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                                {error}
                            </div>
                        )}

                        <form className="space-y-3" onSubmit={handleSubmit}>
                            <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Email" className="w-full clay-input py-2.5 px-4 text-sm" required />
                            <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Password" className="w-full clay-input py-2.5 px-4 text-sm" required minLength={6} />

                            <button type="submit" disabled={isLoading} className="w-full clay-button bg-gradient-to-r from-gold-400 to-gold-600 text-navy-950 py-2.5 font-bold flex items-center justify-center gap-2 disabled:opacity-60">
                                {isLoading ? <Loader2 size={16} className="animate-spin" /> : <><LogIn size={16} /> Sign In</>}
                            </button>
                        </form>
                    </div>
                </div>
            </div>

            {/* Right Side - Sign In Form (Desktop) */}
            <div className="hidden md:flex w-1/2 p-8 items-center justify-center" style={{ background: '#060814', borderLeft: '1px solid rgba(255,255,255,0.04)' }}>
                <div className="w-full max-w-sm">
                    <div className="mb-8 text-center">
                        <h2 className="text-2xl font-bold text-white">{t('loginSignIn')}</h2>
                        <p className="text-navy-300 mt-2">Sign in with your account credentials</p>
                    </div>

                    {/* Error Message */}
                    {error && (
                        <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                            {error}
                        </div>
                    )}

                    <form className="space-y-4" onSubmit={handleSubmit}>
                        {/* Email */}
                        <div>
                            <label className="block text-sm font-medium text-navy-200 mb-1">{t('loginEmailLabel')}</label>
                            <div className="relative">
                                <Mail className={`absolute ${isRTL ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 text-navy-400`} size={18} />
                                <input
                                    type="email"
                                    value={email}
                                    onChange={e => setEmail(e.target.value)}
                                    placeholder="name@example.com"
                                    className={`w-full clay-input py-2.5 ${isRTL ? 'pr-10 pl-4' : 'pl-10 pr-4'}`}
                                    required
                                />
                            </div>
                        </div>

                        {/* Password */}
                        <div>
                            <label className="block text-sm font-medium text-navy-200 mb-1">{t('loginPasswordLabel')}</label>
                            <div className="relative">
                                <Lock className={`absolute ${isRTL ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 text-navy-400`} size={18} />
                                <input
                                    type="password"
                                    value={password}
                                    onChange={e => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    className={`w-full clay-input py-2.5 ${isRTL ? 'pr-10 pl-4' : 'pl-10 pr-4'}`}
                                    required
                                    minLength={6}
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full clay-button bg-gradient-to-r from-gold-400 to-gold-600 text-navy-950 py-2.5 font-bold flex items-center justify-center gap-2 disabled:opacity-60"
                        >
                            {isLoading ? (
                                <Loader2 size={18} className="animate-spin" />
                            ) : (
                                <><LogIn size={18} /> {t('loginSignIn')}</>
                            )}
                        </button>
                    </form>

                    <div className="mt-6 text-center text-sm text-navy-400">
                        Don't have an account? Contact your coach to get access.
                    </div>
                </div>
            </div>
        </div>
    );
};
