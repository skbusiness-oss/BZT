import { useState } from 'react';
import { X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { useLanguage } from '../../context/LanguageContext';
import { Category } from '../../types';

const CLIENT_CATEGORIES: { value: Category; label: string }[] = [
    { value: 'cutting', label: 'Cutting' },
    { value: 'bulking', label: 'Bulking' },
    { value: 'pro', label: 'Pro' },
    { value: 'health', label: 'Health' },
];

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
                    <h2 className="text-xl font-bold text-white">{t('addNewClient')}</h2>
                    <button onClick={onClose} className="text-navy-300 hover:text-white">
                        <X size={20} />
                    </button>
                </div>
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm text-navy-200 mb-1">{t('clientName')} *</label>
                        <input
                            type="text"
                            placeholder="Enter name"
                            value={newClient.name}
                            onChange={e => setNewClient({ ...newClient, name: e.target.value })}
                            className="w-full clay-input p-3"
                        />
                    </div>
                    <div>
                        <label className="block text-sm text-navy-200 mb-1">{t('email')} *</label>
                        <input
                            type="email"
                            placeholder="client@example.com"
                            value={newClient.email}
                            onChange={e => setNewClient({ ...newClient, email: e.target.value })}
                            className="w-full clay-input p-3"
                        />
                    </div>
                    <div>
                        <label className="block text-sm text-navy-200 mb-1">Password *</label>
                        <input
                            type="password"
                            placeholder="Min 6 characters"
                            value={newClient.password}
                            onChange={e => setNewClient({ ...newClient, password: e.target.value })}
                            className="w-full clay-input p-3"
                        />
                    </div>
                    <div>
                        <label className="block text-sm text-navy-200 mb-1">Access Role *</label>
                        <select
                            value={newClient.role}
                            onChange={e => setNewClient({ ...newClient, role: e.target.value as 'client' | 'community' })}
                            className="w-full clay-input p-3 text-white"
                        >
                            <option value="client">Premium Coaching Client</option>
                            <option value="community">Community Member (Free)</option>
                        </select>
                    </div>

                    {newClient.role === 'client' && (
                        <>
                            <div>
                                <label className="block text-sm text-navy-200 mb-1">{t('programType')} *</label>
                                <select
                                    value={newClient.category}
                                    onChange={e => setNewClient({ ...newClient, category: e.target.value as Category })}
                                    className="w-full clay-input p-3 text-white"
                                >
                                    {CLIENT_CATEGORIES.map(cat => (
                                        <option key={cat.value} value={cat.value}>{cat.label}</option>
                                    ))}
                                </select>
                            </div>
                            {showProgramLength && (
                                <div>
                                    <label className="block text-sm text-navy-200 mb-1">Program Length (weeks)</label>
                                    <select
                                        value={newClient.programLength}
                                        onChange={e => setNewClient({ ...newClient, programLength: parseInt(e.target.value) })}
                                        className="w-full clay-input p-3"
                                    >
                                        <option value={8}>8 Weeks</option>
                                        <option value={12}>12 Weeks</option>
                                        <option value={16}>16 Weeks</option>
                                        <option value={24}>24 Weeks</option>
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
                    <button onClick={onClose} className="flex-1 clay-button bg-navy-800 hover:bg-navy-700 text-white py-3">
                        {t('cancel')}
                    </button>
                    <button
                        onClick={handleCreate}
                        disabled={isCreating || !newClient.name || !newClient.email || !newClient.password}
                        className="flex-1 clay-button bg-gradient-to-r from-gold-400 to-gold-600 disabled:from-navy-700 disabled:to-navy-700 disabled:cursor-not-allowed text-navy-950 py-3"
                    >
                        {isCreating ? 'Creating...' : t('createClient')}
                    </button>
                </div>
            </div>
        </div>
    );
};
