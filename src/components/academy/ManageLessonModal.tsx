import { useState, useEffect } from 'react';
import { X, AlertCircle, CheckCircle2, Link2, Plus, FileText, Loader2 } from 'lucide-react';
import clsx from 'clsx';
import { Lesson, LessonResource } from '../../types';
import { buildEmbedUrl } from '../../lib/videoUtils';
import { useAcademy } from '../../context/AcademyContext';

type LessonFormData = Omit<Lesson, 'id' | 'createdAt' | 'updatedAt' | 'createdBy'> & {
    resources?: LessonResource[];
};

interface Props {
    lesson?: Lesson | null;
    courseId: string;
    nextOrder: number;
    onSave: (data: LessonFormData) => Promise<void>;
    onClose: () => void;
}

const BLANK: LessonFormData = {
    title: '',
    description: '',
    videoUrl: '',
    platform: 'youtube',
    thumbnailUrl: '',
    order: 0,
    durationMinutes: undefined,
    isRequired: true,
    isPreview: false,
    resources: [],
    archived: false,
};

export const ManageLessonModal = ({ lesson, courseId, nextOrder, onSave, onClose }: Props) => {
    const { lessonContent, uploadLessonResource } = useAcademy();
    const [form, setForm] = useState({ ...BLANK });
    const [rawInput, setRawInput] = useState('');
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [uploadingPdf, setUploadingPdf] = useState(false);

    const parsed = buildEmbedUrl(rawInput);

    useEffect(() => {
        if (lesson) {
            const content = lessonContent[`${courseId}_${lesson.id}`];
            setForm({
                title: lesson.title,
                description: lesson.description ?? '',
                videoUrl: content?.videoUrl ?? lesson.videoUrl ?? '',
                platform: content?.platform ?? lesson.platform ?? 'youtube',
                thumbnailUrl: lesson.thumbnailUrl ?? '',
                order: lesson.order,
                durationMinutes: lesson.durationMinutes,
                isRequired: lesson.isRequired,
                isPreview: lesson.isPreview,
                prerequisiteLessonId: lesson.prerequisiteLessonId,
                hasContent: lesson.hasContent,
                resources: content?.resources ?? [],
                archived: lesson.archived ?? false,
            });
            setRawInput(content?.videoUrl ?? lesson.videoUrl ?? '');
        } else {
            setForm({ ...BLANK, order: nextOrder });
        }
    }, [lesson, lessonContent, courseId, nextOrder]);

    const set = <K extends keyof typeof form>(field: K, val: typeof form[K]) =>
        setForm(f => ({ ...f, [field]: val }));

    const handleUrlInput = (value: string) => {
        setRawInput(value);
        const result = buildEmbedUrl(value);
        if (result) {
            setForm(f => ({ ...f, videoUrl: result.embedUrl, platform: result.platform }));
        } else {
            setForm(f => ({ ...f, videoUrl: '', platform: 'youtube' }));
        }
    };

    const handlePdfUpload = async (file: File) => {
        setError(null);
        if (!file.name.toLowerCase().endsWith('.pdf')) { setError('Please select a PDF file.'); return; }
        if (!lesson?.id) { setError('Save the lesson first, then edit it to attach PDFs.'); return; }
        if (file.size > 50 * 1024 * 1024) { setError(`File is ${(file.size / 1024 / 1024).toFixed(1)} MB. Max is 50 MB.`); return; }
        setUploadingPdf(true);
        try {
            const result = await uploadLessonResource(courseId, lesson.id, file);
            setForm(f => ({ ...f, resources: [...(f.resources ?? []), result] }));
        } catch (e: unknown) {
            const err = e as { code?: string; message?: string };
            // eslint-disable-next-line no-console
            console.error('PDF upload failed:', err);
            const msg = err?.code === 'storage/unauthorized'
                ? 'Permission denied. Only coaches can upload PDFs.'
                : err?.code === 'storage/canceled'
                    ? 'Upload was canceled.'
                    : err?.code === 'storage/retry-limit-exceeded'
                        ? 'Network too slow — retry on a stronger connection.'
                        : err?.message ?? 'PDF upload failed.';
            setError(msg);
        } finally {
            setUploadingPdf(false);
        }
    };

    const removeResource = (idx: number) =>
        setForm(f => ({ ...f, resources: (f.resources ?? []).filter((_, i) => i !== idx) }));

    const handleSave = async () => {
        if (!form.title.trim()) { setError('Title is required.'); return; }
        setSaving(true);
        setError(null);
        try {
            await onSave(form);
            onClose();
        } catch (e: any) {
            setError(e?.message ?? 'Save failed.');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-surface/90 backdrop-blur-sm flex items-center justify-center z-[60] animate-in fade-in duration-200 p-4">
            <div className="bg-surface-container-low p-8 rounded-2xl max-w-lg w-full mx-4 animate-in zoom-in-95 duration-200 ghost-border shadow-2xl max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between mb-2">
                    <div>
                        <span className="text-[10px] font-headline font-bold uppercase tracking-[0.3em] text-primary block mb-1">Lesson</span>
                        <h2 className="text-2xl font-headline font-bold text-on-surface">{lesson ? 'Edit Lesson' : 'Add Lesson'}</h2>
                    </div>
                    <button onClick={onClose} className="text-on-surface/50 hover:text-on-surface p-2 rounded-full hover:bg-surface-container-highest transition-colors"><X size={20} /></button>
                </div>
                <p className="text-xs text-on-surface-variant font-body mb-8">
                    Paste a YouTube or Vimeo link. Add resources and mark preview lessons that community members can watch for free.
                </p>

                <div className="space-y-5">
                    {/* Video URL */}
                    <div>
                        <label className="flex items-center gap-2 text-[10px] font-label font-bold uppercase tracking-widest text-on-surface/60 mb-2">
                            <Link2 size={13} /> Video URL
                        </label>
                        <textarea
                            value={rawInput}
                            onChange={e => handleUrlInput(e.target.value)}
                            placeholder="Paste YouTube / Vimeo URL or embed code"
                            rows={2}
                            className="w-full bg-surface-container-lowest border border-outline-variant/30 focus:border-primary/50 outline-none rounded-xl p-3.5 resize-none text-sm font-mono text-on-surface transition-colors"
                            autoFocus
                        />
                        {rawInput.trim() !== '' && (
                            <div className={clsx(
                                'mt-2 flex items-center gap-2 text-xs font-body px-3 py-2.5 rounded-lg border',
                                parsed ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'
                            )}>
                                {parsed ? (
                                    <><CheckCircle2 size={14} /> <strong>{parsed.platform === 'youtube' ? 'YouTube' : 'Vimeo'}</strong> detected</>
                                ) : (
                                    <><AlertCircle size={14} /> Unrecognised link</>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Title */}
                    <div>
                        <label className="block text-[10px] font-label font-bold uppercase tracking-widest text-on-surface/60 mb-2">Title *</label>
                        <input
                            value={form.title}
                            onChange={e => set('title', e.target.value)}
                            placeholder="e.g. Understanding Caloric Surplus"
                            className="w-full bg-surface-container-lowest border border-outline-variant/30 focus:border-primary/50 outline-none rounded-xl p-3.5 text-sm font-body text-on-surface transition-colors"
                        />
                    </div>

                    {/* Description */}
                    <div>
                        <label className="block text-[10px] font-label font-bold uppercase tracking-widest text-on-surface/60 mb-2">Description <span className="text-on-surface/30 lowercase normal-case text-xs tracking-normal font-body">(optional)</span></label>
                        <textarea
                            value={form.description}
                            onChange={e => set('description', e.target.value)}
                            rows={2}
                            placeholder="Brief overview of what this lesson covers"
                            className="w-full bg-surface-container-lowest border border-outline-variant/30 focus:border-primary/50 outline-none rounded-xl p-3.5 text-sm font-body text-on-surface resize-none transition-colors"
                        />
                    </div>

                    {/* Thumbnail + Duration */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-[10px] font-label font-bold uppercase tracking-widest text-on-surface/60 mb-2">Thumbnail URL</label>
                            <input
                                value={form.thumbnailUrl}
                                onChange={e => set('thumbnailUrl', e.target.value)}
                                placeholder="https://..."
                                className="w-full bg-surface-container-lowest border border-outline-variant/30 focus:border-primary/50 outline-none rounded-xl p-3.5 text-sm font-body text-on-surface transition-colors"
                            />
                        </div>
                        <div>
                            <label className="block text-[10px] font-label font-bold uppercase tracking-widest text-on-surface/60 mb-2">Duration (min)</label>
                            <input
                                type="number"
                                step="0.1"
                                min={0}
                                value={form.durationMinutes ?? ''}
                                onChange={e => {
                                    const raw = e.target.value;
                                    if (!raw) { set('durationMinutes', undefined); return; }
                                    const n = Number(raw);
                                    // Clamp to 1 decimal at write time so we never persist
                                    // values like 13.33333… in Firestore.
                                    set('durationMinutes', Number.isFinite(n) ? Math.round(n * 10) / 10 : undefined);
                                }}
                                placeholder="e.g. 13.3"
                                className="w-full bg-surface-container-lowest border border-outline-variant/30 focus:border-primary/50 outline-none rounded-xl p-3.5 text-sm font-body text-on-surface transition-colors"
                            />
                        </div>
                    </div>

                    {/* Order */}
                    <div>
                        <label className="block text-[10px] font-label font-bold uppercase tracking-widest text-on-surface/60 mb-2">Order #</label>
                        <input
                            type="number"
                            value={form.order}
                            onChange={e => set('order', Number(e.target.value))}
                            className="w-full bg-surface-container-lowest border border-outline-variant/30 focus:border-primary/50 outline-none rounded-xl p-3.5 text-sm font-body text-on-surface transition-colors"
                        />
                    </div>

                    {/* PDFs */}
                    <div>
                        <label className="flex items-center gap-2 text-[10px] font-label font-bold uppercase tracking-widest text-on-surface/60 mb-3">
                            <FileText size={13} /> Resources / PDFs
                        </label>
                        {(form.resources ?? []).map((r, i) => (
                            <div key={i} className="flex items-center gap-3 mb-2 bg-surface-container-lowest border border-outline-variant/30 px-4 py-3 rounded-xl">
                                <FileText size={16} className="text-primary shrink-0" />
                                <span className="text-sm font-body text-on-surface truncate flex-1">{r.name}</span>
                                <button onClick={() => removeResource(i)} className="text-red-400 hover:text-red-300 transition-colors"><X size={15} /></button>
                            </div>
                        ))}
                        <label className={clsx(
                            'flex items-center justify-center gap-2 px-5 py-4 rounded-xl border border-dashed text-sm font-bold tracking-wide transition-all',
                            uploadingPdf || !lesson?.id ? 'opacity-60 cursor-not-allowed border-outline-variant/30 text-on-surface/50' : 'cursor-pointer border-outline-variant/50 hover:border-primary/50 hover:text-primary text-on-surface/60 hover:bg-primary/5'
                        )}>
                            {uploadingPdf ? <><Loader2 size={16} className="animate-spin" /> Uploading…</> : <><Plus size={16} /> {lesson?.id ? 'Add PDF' : 'Save Lesson First'}</>}
                            <input type="file" accept=".pdf,application/pdf" className="hidden" disabled={uploadingPdf || !lesson?.id}
                                onChange={e => { const f = e.target.files?.[0]; if (f) handlePdfUpload(f); e.target.value = ''; }} />
                        </label>
                    </div>

                    {/* Flags */}
                    <div className="space-y-3">
                        {[
                            { field: 'isRequired' as const, label: 'Required (part of the main lesson sequence)' },
                            { field: 'isPreview' as const, label: 'Preview (community members can watch for free)' },
                        ].map(({ field, label }) => (
                            <label key={field} className="flex items-center gap-3 p-3.5 bg-surface-container-lowest rounded-xl border border-outline-variant/30 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={form[field] as boolean}
                                    onChange={e => setForm(f => ({ ...f, [field]: e.target.checked }))}
                                    className="w-4 h-4 rounded"
                                />
                                <span className="text-sm font-body text-on-surface/80">{label}</span>
                            </label>
                        ))}
                    </div>
                </div>

                {error && (
                    <div className="mt-5 flex items-start gap-3 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-body">
                        <AlertCircle size={16} className="shrink-0 mt-0.5" />
                        {error}
                    </div>
                )}

                <div className="flex gap-3 mt-7">
                    <button onClick={onClose} className="flex-1 px-5 py-3.5 rounded-xl font-label text-[10px] font-bold uppercase tracking-widest text-on-surface bg-surface-container hover:bg-surface-container-high border border-outline-variant/30 transition-all">
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={saving || !form.title.trim()}
                        className="flex-1 px-5 py-3.5 rounded-xl font-label text-[10px] font-bold uppercase tracking-widest gold-gradient text-on-primary-fixed disabled:opacity-40 disabled:pointer-events-none shadow-lg shadow-primary/20 active:scale-95 transition-all"
                    >
                        {saving ? 'Saving…' : lesson ? 'Update Lesson' : 'Add Lesson'}
                    </button>
                </div>
            </div>
        </div>
    );
};
