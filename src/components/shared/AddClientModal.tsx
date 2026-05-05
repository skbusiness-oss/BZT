import { useState } from 'react';
import { X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { useLanguage } from '../../context/LanguageContext';
import { Category } from '../../types';

const CLIENT_CATEGORY_VALUES: Category[] = ['cutting', 'bulking', 'pro', 'health'];

interface Props {
    onClose: () => void;
    showProgramLength?: boolean;
}

export const AddClientModal = ({ onClose, showProgramLength = false }: Props) => {
    const { createUserAccount } = useAuth();
    const { addClient } = useData();
    const { t } = useLanguage();

    const [newClient, setNewClient] = useState({
        name: '',
        email: '',
        password: '',
        role: 'client' as 'client' | 'community',
        category: 'cutting' as Category,
        programLength: 12,
    });
    const [error, setError] = useState('');
    const [isCreating, setIsCreating] = useState(false);

    const handleCreate = async () => {
        if (!newClient.name || !newClient.email || !newClient.password) return;
        setError('');
        setIsCreating(true);

        try {
            const result = await createUserAccount(
                newClient.email,
                newClient.password,
                newClient.name,
                newClient.role
            );

            if (result.error) {
                setError(result.error);
                setIsCreating(false);
                return;
            }

            const uid = result.uid!;
            if (newClient.role === 'client') {
                await addClient({
                    userId: uid,
                    name: newClient.name,
                    email: newClient.email,
                    category: newClient.category,
                    currentWeek: 0,
                    programLength: newClient.programLength,
                    needsReview: false,
                    isOnboarding: true,
                }, uid);
            }
            onClose();
        } catch (e: unknown) {
            setError(`Error: ${e instanceof Error ? e.message : 'Unknown error'}`);
        } finally {
            setIsCreating(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 animate-in fade-in duration-200">
            <div className="clay-card p-6 max-w-md w-full mx-4 animate-in zoom-in-95 duration-200">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold text-on-surface">{t('addNewClient')}</h2>
                    <button onClick={onClose} className="text-on-surface/70 hover:text-on-surface">
                        <X size={20} />
                    </button>
                </div>
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm text-on-surface mb-1">{t('clientName')} *</label>
                        <input
                            type="text"
                            placeholder={t('enterName')}
                            value={newClient.name}
                            onChange={e => setNewClient({ ...newClient, name: e.target.value })}
                            className="w-full clay-input p-3"
                        />
                    </div>
                    <div>
                        <label className="block text-sm text-on-surface mb-1">{t('email')} *</label>
                        <input
                            type="email"
                            placeholder="client@example.com"
                            value={newClient.email}
                            onChange={e => setNewClient({ ...newClient, email: e.target.value })}
                            className="w-full clay-input p-3"
                        />
                    </div>
                    <div>
                        <label className="block text-sm text-on-surface mb-1">{t('loginPasswordLabel')} *</label>
                        <input
                            type="password"
                            placeholder={t('minSixChars')}
                            value={newClient.password}
                            onChange={e => setNewClient({ ...newClient, password: e.target.value })}
                            className="w-full clay-input p-3"
                        />
                    </div>
                    <div>
                        <label className="block text-sm text-on-surface mb-1">{t('accessRole')} *</label>
                        <select
                            value={newClient.role}
                            onChange={e => setNewClient({ ...newClient, role: e.target.value as 'client' | 'community' })}
                            className="w-full clay-input p-3 text-on-surface"
                        >
                            <option value="client">{t('premiumClient')}</option>
                            <option value="community">{t('communityMemberFree')}</option>
                        </select>
                    </div>

                    {newClient.role === 'client' && (
                        <>
                            <div>
                                <label className="block text-sm text-on-surface mb-1">{t('programType')} *</label>
                                <select
                                    value={newClient.category}
                                    onChange={e => setNewClient({ ...newClient, category: e.target.value as Category })}
                                    className="w-full clay-input p-3 text-on-surface"
                                >
                                    {CLIENT_CATEGORY_VALUES.map(val => (
                                        <option key={val} value={val}>{t(val as any)}</option>
                                    ))}
                                </select>
                            </div>
                            {showProgramLength && (
                                <div>
                                    <label className="block text-sm text-on-surface mb-1">{t('programLengthWeeks')}</label>
                                    <select
                                        value={newClient.programLength}
                                        onChange={e => setNewClient({ ...newClient, programLength: parseInt(e.target.value) })}
                                        className="w-full clay-input p-3"
                                    >
                                        <option value={8}>8 {t('weeks')}</option>
                                        <option value={12}>12 {t('weeks')}</option>
                                        <option value={16}>16 {t('weeks')}</option>
                                        <option value={24}>24 {t('weeks')}</option>
                                    </select>
                                </div>
                            )}
                        </>
                    )}
                    {error && (
                        <div className="text-red-400 text-sm bg-red-500/10 rounded-lg p-3">{error}</div>
                    )}
                </div>
                <div className="flex gap-3 mt-6">
                    <button onClick={onClose} className="flex-1 py-3 rounded-xl font-label text-[10px] font-bold uppercase tracking-widest text-on-surface bg-surface-container hover:bg-surface-container-highest transition-colors">
                        {t('cancel')}
                    </button>
                    <button
                        onClick={handleCreate}
                        disabled={isCreating || !newClient.name || !newClient.email || !newClient.password}
                        className="flex-1 py-3 rounded-xl font-label text-[10px] font-bold uppercase tracking-widest text-on-primary bg-gradient-to-r from-primary to-primary-container disabled:opacity-50 disabled:cursor-not-allowed hover:scale-[1.02] active:scale-[0.98] transition-all"
                    >
                        {isCreating ? t('creating') : t('createClient')}
                    </button>
                </div>
            </div>
        </div>
    );
};
