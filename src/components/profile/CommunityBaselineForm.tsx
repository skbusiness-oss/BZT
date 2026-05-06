/**
 * CommunityBaselineForm — Week 0 baseline for community members.
 *
 * Captures the seed data the weekly check-in flow needs: age, height, goal,
 * starting weight, target weight. Writes to `users/{uid}` and stamps
 * `communityProfileStartedAt` so we know Week 0 is set.
 *
 * Two entry points:
 *   - Auto-opens when a community user lands without baseline data.
 *   - Manually opens via "Edit profile info" button on the Profile page.
 */
import { useState } from 'react';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { X, Target, Scale, Calendar } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { db } from '../../lib/firebase';

const GOAL_OPTIONS = [
    { value: 'fat_loss',     labelKey: 'goalFatLoss',    desc: 'Lose body fat while keeping muscle.' },
    { value: 'muscle_gain',  labelKey: 'goalMuscleGain', desc: 'Build lean muscle.' },
    { value: 'recomp',       labelKey: 'goalRecomp',     desc: 'Lose fat and gain muscle simultaneously.' },
    { value: 'maintenance',  labelKey: 'goalMaintenance',desc: 'Stay at current weight, improve fitness.' },
    { value: 'endurance',    labelKey: 'goalEndurance',  desc: 'Improve cardiovascular performance.' },
    { value: 'strength',     labelKey: 'goalStrength',   desc: 'Get stronger across the board.' },
] as const;

interface Props {
    onClose: () => void;
    initial?: {
        age?: number;
        heightCm?: number;
        goal?: string;
        currentWeightKg?: number;
        targetWeightKg?: number;
    };
}

export const CommunityBaselineForm = ({ onClose, initial }: Props) => {
    const { user } = useAuth();
    const { t } = useLanguage();

    const [age, setAge] = useState<string>(initial?.age?.toString() ?? '');
    const [heightCm, setHeightCm] = useState<string>(initial?.heightCm?.toString() ?? '');
    const [goal, setGoal] = useState<string>(initial?.goal ?? '');
    const [currentWeightKg, setCurrentWeightKg] = useState<string>(initial?.currentWeightKg?.toString() ?? '');
    const [targetWeightKg, setTargetWeightKg] = useState<string>(initial?.targetWeightKg?.toString() ?? '');

    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const valid =
        Number(age) > 0 && Number(age) < 120 &&
        Number(heightCm) > 80 && Number(heightCm) < 250 &&
        goal.length > 0 &&
        Number(currentWeightKg) > 20 && Number(currentWeightKg) < 350 &&
        Number(targetWeightKg) > 20 && Number(targetWeightKg) < 350;

    const handleSubmit = async () => {
        if (!user || !valid) return;
        setSaving(true);
        setError(null);
        try {
            await updateDoc(doc(db, 'users', user.id), {
                age: Number(age),
                heightCm: Number(heightCm),
                goal,
                currentWeightKg: Number(currentWeightKg),
                targetWeightKg: Number(targetWeightKg),
                // Only stamp the started-at on initial save; preserve on edits.
                ...(initial?.age === undefined ? { communityProfileStartedAt: serverTimestamp() } : {}),
            });
            onClose();
        } catch (e: any) {
            console.error('Failed to save baseline:', e);
            setError(e?.message ?? 'Failed to save. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    const isInitial = initial?.age === undefined;

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 animate-in fade-in duration-200 p-4">
            <div className="bg-surface-container-low rounded-2xl max-w-lg w-full p-8 animate-in zoom-in-95 duration-200 ghost-border max-h-[90vh] overflow-y-auto">
                <div className="flex items-start justify-between mb-6">
                    <div>
                        <span className="font-label text-[10px] font-bold uppercase tracking-widest text-primary block mb-2">
                            {isInitial ? 'Week 0' : t('edit')}
                        </span>
                        <h2 className="font-headline font-extrabold text-2xl text-on-surface">
                            {isInitial ? 'Tell us about yourself' : t('personalInfo')}
                        </h2>
                        {isInitial && (
                            <p className="font-body text-sm text-on-surface/60 mt-2">
                                Your baseline. Set it once, track progress weekly.
                            </p>
                        )}
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-xl hover:bg-surface-container text-on-surface/60 transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                <div className="space-y-5">
                    {/* Age + Height row */}
                    <div className="grid grid-cols-2 gap-3">
                        <Field icon={<Calendar size={14} />} label={t('age')} unit={t('yearsOld')}>
                            <input
                                type="number"
                                inputMode="numeric"
                                value={age}
                                onChange={e => setAge(e.target.value)}
                                placeholder="28"
                                className="w-full bg-surface-container-lowest border border-outline-variant/30 rounded-xl px-4 py-3 text-on-surface font-body focus:border-primary/50 outline-none"
                            />
                        </Field>
                        <Field icon={<Scale size={14} />} label={t('height')} unit="cm">
                            <input
                                type="number"
                                inputMode="numeric"
                                value={heightCm}
                                onChange={e => setHeightCm(e.target.value)}
                                placeholder="175"
                                className="w-full bg-surface-container-lowest border border-outline-variant/30 rounded-xl px-4 py-3 text-on-surface font-body focus:border-primary/50 outline-none"
                            />
                        </Field>
                    </div>

                    {/* Goal */}
                    <Field icon={<Target size={14} />} label={t('goal')}>
                        <div className="grid grid-cols-2 gap-2">
                            {GOAL_OPTIONS.map(opt => (
                                <button
                                    key={opt.value}
                                    type="button"
                                    onClick={() => setGoal(opt.value)}
                                    className={`text-left px-3 py-2.5 rounded-xl border text-sm font-body transition-all ${
                                        goal === opt.value
                                            ? 'border-primary bg-primary/10 text-primary'
                                            : 'border-outline-variant/30 bg-surface-container-lowest text-on-surface/70 hover:border-outline-variant/60'
                                    }`}
                                >
                                    {t(opt.labelKey)}
                                </button>
                            ))}
                        </div>
                    </Field>

                    {/* Current + target weight */}
                    <div className="grid grid-cols-2 gap-3">
                        <Field label={`${t('currentWeight')}`} unit="kg">
                            <input
                                type="number"
                                inputMode="decimal"
                                step="0.1"
                                value={currentWeightKg}
                                onChange={e => setCurrentWeightKg(e.target.value)}
                                placeholder="80.0"
                                className="w-full bg-surface-container-lowest border border-outline-variant/30 rounded-xl px-4 py-3 text-on-surface font-body focus:border-primary/50 outline-none"
                            />
                        </Field>
                        <Field label="Target weight" unit="kg">
                            <input
                                type="number"
                                inputMode="decimal"
                                step="0.1"
                                value={targetWeightKg}
                                onChange={e => setTargetWeightKg(e.target.value)}
                                placeholder="75.0"
                                className="w-full bg-surface-container-lowest border border-outline-variant/30 rounded-xl px-4 py-3 text-on-surface font-body focus:border-primary/50 outline-none"
                            />
                        </Field>
                    </div>
                </div>

                {error && (
                    <div className="mt-5 px-4 py-3 rounded-xl bg-red-500/15 border border-red-500/40 text-red-300 text-sm font-body">
                        {error}
                    </div>
                )}

                <div className="flex gap-3 mt-7">
                    <button
                        onClick={onClose}
                        disabled={saving}
                        className="flex-1 px-4 py-3 rounded-xl border border-outline-variant/30 text-on-surface font-label text-[10px] font-bold uppercase tracking-widest hover:bg-surface-container transition-colors"
                    >
                        {t('cancel')}
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={!valid || saving}
                        className="flex-1 px-4 py-3 rounded-xl bg-gradient-to-r from-primary to-primary-container text-on-primary font-label text-[10px] font-bold uppercase tracking-widest disabled:opacity-50 transition-all"
                    >
                        {saving ? t('loadingEllipsis') : (isInitial ? t('done') : t('save'))}
                    </button>
                </div>
            </div>
        </div>
    );
};

function Field({
    icon, label, unit, children,
}: {
    icon?: React.ReactNode;
    label: string;
    unit?: string;
    children: React.ReactNode;
}) {
    return (
        <div>
            <label className="flex items-center gap-2 mb-2 text-[10px] font-label font-bold uppercase tracking-widest text-on-surface/70">
                {icon}
                <span>{label}</span>
                {unit && <span className="text-on-surface/40 normal-case tracking-normal font-body">· {unit}</span>}
            </label>
            {children}
        </div>
    );
}
