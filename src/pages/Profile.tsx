import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { UserCircle, Mail, Shield, Calendar } from 'lucide-react';

export const Profile = () => {
    const { user } = useAuth();
    const { t } = useLanguage();

    if (!user) return null;

    return (
        <div className="max-w-2xl mx-auto space-y-8 animate-in fade-in duration-500 pt-8">
            <h1 className="text-3xl font-bold text-white">{t('profileTitle')}</h1>

            <div className="clay-card p-8 flex flex-col items-center text-center">
                <div className="w-24 h-24 rounded-full p-1 mb-4" style={{ background: 'linear-gradient(135deg, #ffd740, #3f51b5)' }}>
                    <div className="w-full h-full rounded-full bg-navy-950 flex items-center justify-center overflow-hidden">
                        {user.avatarUrl ? (
                            <img src={user.avatarUrl} alt={user.name} className="w-full h-full object-cover" />
                        ) : (
                            <span className="text-4xl font-bold text-white">{user.name.charAt(0)}</span>
                        )}
                    </div>
                </div>

                <h2 className="text-2xl font-bold text-white">{user.name}</h2>
                <p className="text-navy-200">{user.email}</p>

                <div className="mt-6 flex gap-3">
                    <span className="px-3 py-1 rounded-full clay-card-sm text-gold-400 text-sm font-medium capitalize flex items-center gap-2">
                        <Shield size={14} /> {t(user.role as any)}
                    </span>
                </div>
            </div>

            <div className="clay-card p-6 space-y-4">
                <h3 className="font-bold text-white border-b border-white/[0.04] pb-2">{t('accountInfo')}</h3>

                <div className="flex items-center justify-between py-2">
                    <div className="flex items-center gap-3 text-navy-200">
                        <Mail size={18} />
                        <span>{t('email')}</span>
                    </div>
                    <span className="text-white">{user.email}</span>
                </div>

                <div className="flex items-center justify-between py-2">
                    <div className="flex items-center gap-3 text-navy-200">
                        <Calendar size={18} />
                        <span>{t('memberSince')}</span>
                    </div>
                    <span className="text-white">Feb 2026</span>
                </div>
            </div>

            <div className="text-center text-navy-400 text-sm">
                BioZackTeam PWA v1.0.0
            </div>
        </div>
    );
};
