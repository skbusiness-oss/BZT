/**
 * StretchingVideoEditor — coach-only inline manager for the Stretching
 * videos. Reachable from the Stretching screen ("Edit videos" toggle).
 *
 * Scope (per founder decision): RENAME (EN + AR) + soft DELETE/restore.
 * Adding brand-new clips stays in code. Edits persist to the live
 * settings/stretchingOverrides doc via useStretchingOverrides, so every
 * client sees the corrected titles in real time.
 *
 * Renames commit on blur/Enter (not per-keystroke) so typing stays
 * smooth — the same pattern we use for the cardio stat inputs.
 */
import { useState } from 'react';
import { Check, Trash2, RotateCcw, X } from 'lucide-react';
import {
    STRETCH_VIDEO_SEED, STRETCH_SECTION_META, StretchSection, StretchOverride,
} from '../../data/stretchingVideos';
import { StretchOverridesApi } from '../../hooks/useStretchingOverrides';

interface Props {
    api: StretchOverridesApi;
    onDone: () => void;
    isRTL: boolean;
    isAr: boolean;
}

const SECTION_ORDER: StretchSection[] = ['dynamic', 'static', 'beforeBed'];

const SECTION_LABEL: Record<StretchSection, { en: string; ar: string }> = {
    dynamic: { en: 'Pre-Workout Warm-Up', ar: 'الإحماء قبل التمرين' },
    static: { en: 'Post-Workout Cool Down', ar: 'التهدئة بعد التمرين' },
    beforeBed: { en: 'Before Bed', ar: 'قبل النوم' },
};

function EditorRow({
    seedTitle, seedTitleAr, override, isAr, onRename, onRemove, onRestore,
}: {
    seedTitle: string;
    seedTitleAr: string;
    override?: StretchOverride;
    isAr: boolean;
    onRename: (title: string, titleAr: string) => void;
    onRemove: () => void;
    onRestore: () => void;
}) {
    const [en, setEn] = useState(override?.title?.trim() || seedTitle);
    const [ar, setAr] = useState(override?.titleAr?.trim() || seedTitleAr);
    const deleted = override?.deleted === true;

    const commit = () => {
        const nextEn = en.trim();
        const nextAr = ar.trim();
        // Only write if something actually changed vs the current effective value.
        const curEn = override?.title?.trim() || seedTitle;
        const curAr = override?.titleAr?.trim() || seedTitleAr;
        if (nextEn !== curEn || nextAr !== curAr) onRename(nextEn, nextAr);
    };

    return (
        <div className={`rounded-xl border p-3 transition-opacity ${deleted ? 'border-outline-variant/20 opacity-50' : 'border-outline-variant/40 bg-surface-container-low'}`}>
            <div className="flex items-center gap-2 mb-2">
                <span className="flex-1 text-[10px] font-label font-bold uppercase tracking-widest text-on-surface/40">
                    {isAr ? 'العنوان' : 'Title'}
                </span>
                {deleted ? (
                    <button
                        type="button"
                        onClick={onRestore}
                        className="flex items-center gap-1 text-[11px] font-bold text-primary hover:text-primary/80 transition-colors"
                    >
                        <RotateCcw size={13} /> {isAr ? 'استرجاع' : 'Restore'}
                    </button>
                ) : (
                    <button
                        type="button"
                        onClick={onRemove}
                        className="flex items-center gap-1 text-[11px] font-bold text-red-400 hover:text-red-300 transition-colors"
                    >
                        <Trash2 size={13} /> {isAr ? 'إخفاء' : 'Hide'}
                    </button>
                )}
            </div>

            <div className="flex flex-col sm:flex-row gap-2">
                <input
                    type="text"
                    dir="ltr"
                    value={en}
                    disabled={deleted}
                    onChange={e => setEn(e.target.value)}
                    onBlur={commit}
                    onKeyDown={e => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); }}
                    placeholder="English title"
                    className="flex-1 min-w-0 px-3 py-2 rounded-lg bg-surface-container-highest border border-outline-variant/40 text-on-surface text-sm focus:border-primary/60 outline-none disabled:opacity-60"
                />
                <input
                    type="text"
                    dir="rtl"
                    value={ar}
                    disabled={deleted}
                    onChange={e => setAr(e.target.value)}
                    onBlur={commit}
                    onKeyDown={e => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); }}
                    placeholder="العنوان بالعربية"
                    className="flex-1 min-w-0 px-3 py-2 rounded-lg bg-surface-container-highest border border-outline-variant/40 text-on-surface text-sm focus:border-primary/60 outline-none disabled:opacity-60"
                />
            </div>
        </div>
    );
}

export function StretchingVideoEditor({ api, onDone, isRTL, isAr }: Props) {
    const { overrides, rename, remove, restore } = api;

    return (
        <div dir={isRTL ? 'rtl' : 'ltr'} className="space-y-6 animate-in fade-in duration-300">
            <div className="flex items-center justify-between gap-4">
                <div>
                    <h2 className="text-lg font-headline font-extrabold text-on-surface">
                        {isAr ? 'إدارة فيديوهات الإطالة' : 'Manage stretching videos'}
                    </h2>
                    <p className="text-xs font-body text-on-surface/45 mt-0.5">
                        {isAr
                            ? 'عدّل العناوين (بالإنجليزية والعربية) أو أخفِ أي فيديو. تُحفظ التغييرات فورًا.'
                            : 'Rename (English + Arabic) or hide any video. Changes save instantly.'}
                    </p>
                </div>
                <button
                    type="button"
                    onClick={onDone}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-on-primary text-sm font-bold shrink-0 hover:opacity-90 transition-opacity"
                >
                    <Check size={16} /> {isAr ? 'تم' : 'Done'}
                </button>
            </div>

            {SECTION_ORDER.map(section => {
                const meta = STRETCH_SECTION_META[section];
                const videos = STRETCH_VIDEO_SEED
                    .filter(v => v.section === section)
                    .sort((a, b) => a.order - b.order);
                if (videos.length === 0) return null;
                return (
                    <section key={section} className="space-y-3">
                        <div className="flex items-center gap-2 px-1">
                            <h3 className="text-sm font-headline font-bold text-on-surface">
                                {isAr ? SECTION_LABEL[section].ar : SECTION_LABEL[section].en}
                            </h3>
                            <span className="text-[10px] font-label font-bold uppercase tracking-widest text-on-surface/40">
                                {videos.length}
                            </span>
                        </div>
                        <div className="space-y-2">
                            {videos.map(v => (
                                <EditorRow
                                    key={v.id}
                                    seedTitle={v.title}
                                    seedTitleAr={v.titleAr}
                                    override={overrides[v.id]}
                                    isAr={isAr}
                                    onRename={(title, titleAr) => rename(v.id, title, titleAr)}
                                    onRemove={() => remove(v.id)}
                                    onRestore={() => restore(v.id)}
                                />
                            ))}
                        </div>
                        <p className="text-[11px] text-on-surface/30 px-1">{meta.name}</p>
                    </section>
                );
            })}

            <button
                type="button"
                onClick={onDone}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-surface-container text-on-surface/70 text-sm font-bold hover:bg-surface-container-high transition-colors"
            >
                <X size={16} /> {isAr ? 'إغلاق المحرر' : 'Close editor'}
            </button>
        </div>
    );
}
