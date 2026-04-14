import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { Settings as SettingsIcon, Globe, Bell, Shield, LogOut, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const Settings = () => {
    const { user, signOut } = useAuth();
    const { t, lang, setLang } = useLanguage();
    const navigate = useNavigate();
    const [notificationsEnabled, setNotificationsEnabled] = useState(true);

    const handleLogout = async () => {
        await signOut();
        navigate('/login');
    };

    if (!user) return null;

    return (
        <div className="max-w-2xl mx-auto space-y-6 animate-in fade-in duration-500 pb-20">
            <div>
                <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                    <SettingsIcon className="text-gold-400" size={28} />
                    Settings
                </h1>
                <p className="text-navy-200 mt-1">Manage your account preferences.</p>
            </div>

            {/* Language */}
            <div className="clay-card divide-y divide-white/[0.04]">
                <div className="p-4">
                    <h3 className="text-xs font-semibold uppercase tracking-widest text-navy-400 mb-1">Preferences</h3>
                </div>
                <div className="flex items-center justify-between p-4">
                    <div className="flex items-center gap-3 text-white">
                        <Globe size={18} className="text-navy-300" />
                        <span>Language</span>
                    </div>
                    <button
                        onClick={() => setLang(lang === 'en' ? 'ar' : 'en')}
                        className="clay-button bg-navy-800 hover:bg-navy-700 text-white px-4 py-1.5 text-sm"
                    >
                        {lang === 'en' ? 'العربية' : 'English'}
                    </button>
                </div>
                <div className="flex items-center justify-between p-4">
                    <div className="flex items-center gap-3 text-white">
                        <Bell size={18} className="text-navy-300" />
                        <span>Notifications</span>
                    </div>
                    <button
                        onClick={() => setNotificationsEnabled(v => !v)}
                        className={`relative w-11 h-6 rounded-full transition-colors ${notificationsEnabled ? 'bg-gold-500' : 'bg-navy-700'}`}
                    >
                        <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform ${notificationsEnabled ? 'translate-x-5' : 'translate-x-0'}`} />
                    </button>
                </div>
            </div>

            {/* Account */}
            <div className="clay-card divide-y divide-white/[0.04]">
                <div className="p-4">
                    <h3 className="text-xs font-semibold uppercase tracking-widest text-navy-400 mb-1">Account</h3>
                </div>
                <button
                    onClick={() => navigate('/profile')}
                    className="w-full flex items-center justify-between p-4 hover:bg-white/[0.02] transition-colors"
                >
                    <div className="flex items-center gap-3 text-white">
                        <Shield size={18} className="text-navy-300" />
                        <span>View Profile</span>
                    </div>
                    <ChevronRight size={16} className="text-navy-400" />
                </button>
                <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 p-4 text-rose-400 hover:bg-rose-500/5 transition-colors"
                >
                    <LogOut size={18} />
                    <span>{t('signOut')}</span>
                </button>
            </div>

            <div className="text-center text-navy-500 text-xs">
                BioZackTeam v1.0.0
            </div>
        </div>
    );
};
