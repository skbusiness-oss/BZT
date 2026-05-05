import { useState, useEffect } from 'react';
import { X, AlertCircle } from 'lucide-react';
import clsx from 'clsx';
import { Course, LibraryCategory, AccessTier, CourseType } from '../../types';

interface Props {
    course?: Course | null;
    categories: LibraryCategory[];
    maxOrder: number;
    onSave: (data: Omit<Course, 'id' | 'createdAt' | 'updatedAt' | 'createdBy'>) => Promise<void>;
    onClose: () => void;
}

const BLANK: Omit<Course, 'id' | 'createdAt' | 'updatedAt' | 'createdBy'> = {
    title: '',
    description: '',
    level: 'beginner',
    courseType: 'academy',
    categoryIds: [],
    accessTier: 'client',
    order: 0,
    isRequired: true,
    isPublished: false,
    coverImageUrl: '',
    archived: false,
};

export const ManageCourseModal = ({ course, categories, maxOrder, onSave, onClose }: Props) => {
    const [form, setForm] = useState(BLANK);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (course) {
            setForm({
                title: course.title,
                description: course.description,
                level: course.level,
                courseType: course.courseType,
                categoryIds: course.categoryIds,
                accessTier: course.accessTier,
                order: course.order,
                isRequired: course.isRequired,
                isPublished: course.isPublished,
                coverImageUrl: course.coverImageUrl ?? '',
                archived: course.archived ?? false,
            });
        } else {
            setForm({ ...BLANK, order: maxOrder + 1 });
        }
    }, [course, maxOrder]);

    const toggle = (field: keyof typeof form, val: boolean) => setForm(f => ({ ...f, [field]: val }));
    const set = <K extends keyof typeof form>(field: K, val: typeof form[K]) => setForm(f => ({ ...f, [field]: val }));

    const toggleCategory = (id: string) =>
        setForm(f => ({
            ...f,
            categoryIds: f.categoryIds.includes(id)
                ? f.categoryIds.filter(c => c !== id)
                : [...f.categoryIds, id],
        }));

    const handleSave = async () => {
        if (!form.title.trim()) { setError('Title is required.'); return; }
        setSaving(true);
        setError(null);
        try {
            await onSave(form);
            onClose();
        } catch (e: any) {
            setError(e?.message ?? 'Failed to save. Check console.');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-surface/90 backdrop-blur-sm flex items-center justify-center z-50 animate-in fade-in duration-200 p-4">
            <div className="bg-surface-container-low p-8 rounded-2xl max-w-lg w-full mx-4 animate-in zoom-in-95 duration-200 ghost-border shadow-2xl max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between mb-2">
                    <div>
                        <span className="text-[10px] font-headline font-bold uppercase tracking-[0.3em] text-primary block mb-1">Academy</span>
                        <h2 className="text-2xl font-headline font-bold text-on-surface">{course ? 'Edit Course' : 'Create Course'}</h2>
                    </div>
                    <button onClick={onClose} className="text-on-surface/50 hover:text-on-surface p-2 rounded-full hover:bg-surface-container-highest transition-colors"><X size={20} /></button>
                </div>
                <p className="text-xs text-on-surface-variant font-body mb-8">
                    Courses are the building blocks of the Zero to Hero path. Set a clear title and level before publishing.
                </p>

                <div className="space-y-5">
                    {/* Title */}
                    <div>
                        <label className="block text-[10px] font-label font-bold uppercase tracking-widest text-on-surface/60 mb-2">Title *</label>
                        <input
                            value={form.title}
                            onChange={e => set('title', e.target.value)}
                            placeholder="e.g. Foundations of Nutrition"
                            className="w-full bg-surface-container-lowest border border-outline-variant/30 focus:border-primary/50 outline-none rounded-xl p-3.5 text-sm font-body text-on-surface transition-colors"
                            autoFocus
                        />
                    </div>

                    {/* Description */}
                    <div>
                        <label className="block text-[10px] font-label font-bold uppercase tracking-widest text-on-surface/60 mb-2">Description</label>
                        <textarea
                            value={form.description}
                            onChange={e => set('description', e.target.value)}
                            rows={3}
                            placeholder="What will clients learn in this course?"
                            className="w-full bg-surface-container-lowest border border-outline-variant/30 focus:border-primary/50 outline-none rounded-xl p-3.5 text-sm font-body text-on-surface resize-none transition-colors"
                        />
                    </div>

                    {/* Cover image */}
                    <div>
                        <label className="block text-[10px] font-label font-bold uppercase tracking-widest text-on-surface/60 mb-2">Cover Image URL <span className="text-on-surface/30 lowercase normal-case text-xs tracking-normal font-body">(optional)</span></label>
                        <input
                            value={form.coverImageUrl}
                            onChange={e => set('coverImageUrl', e.target.value)}
                            placeholder="https://..."
                            className="w-full bg-surface-container-lowest border border-outline-variant/30 focus:border-primary/50 outline-none rounded-xl p-3.5 text-sm font-body text-on-surface transition-colors"
                        />
                    </div>

                    {/* Level + Type */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-[10px] font-label font-bold uppercase tracking-widest text-on-surface/60 mb-2">Level</label>
                            <select
                                value={form.level}
                                onChange={e => set('level', e.target.value as Course['level'])}
                                className="w-full bg-surface-container-lowest border border-outline-variant/30 focus:border-primary/50 outline-none rounded-xl p-3.5 text-sm font-body text-on-surface transition-colors appearance-none"
                            >
                                <option value="beginner">Beginner</option>
                                <option value="intermediate">Intermediate</option>
                                <option value="advanced">Advanced</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-[10px] font-label font-bold uppercase tracking-widest text-on-surface/60 mb-2">Type</label>
                            <select
                                value={form.courseType}
                                onChange={e => set('courseType', e.target.value as CourseType)}
                                className="w-full bg-surface-container-lowest border border-outline-variant/30 focus:border-primary/50 outline-none rounded-xl p-3.5 text-sm font-body text-on-surface transition-colors appearance-none"
                            >
                                <option value="academy">Academy (Core)</option>
                                <option value="recorded_live">Recorded Live</option>
                                <option value="bonus">Bonus</option>
                            </select>
                        </div>
                    </div>

                    {/* Access tier + Order */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-[10px] font-label font-bold uppercase tracking-widest text-on-surface/60 mb-2">Access Tier</label>
                            <select
                                value={form.accessTier}
                                onChange={e => set('accessTier', e.target.value as AccessTier)}
                                className="w-full bg-surface-container-lowest border border-outline-variant/30 focus:border-primary/50 outline-none rounded-xl p-3.5 text-sm font-body text-on-surface transition-colors appearance-none"
                            >
                                <option value="community">Community (Free)</option>
                                <option value="client">Coaching Clients</option>
                                <option value="coach">Coach Only</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-[10px] font-label font-bold uppercase tracking-widest text-on-surface/60 mb-2">Order #</label>
                            <input
                                type="number"
                                value={form.order}
                                onChange={e => set('order', Number(e.target.value))}
                                className="w-full bg-surface-container-lowest border border-outline-variant/30 focus:border-primary/50 outline-none rounded-xl p-3.5 text-sm font-body text-on-surface transition-colors"
                            />
                        </div>
                    </div>

                    {/* Categories */}
                    {categories.length > 0 && (
                        <div>
                            <label className="block text-[10px] font-label font-bold uppercase tracking-widest text-on-surface/60 mb-3">Topics / Categories</label>
                            <div className="flex flex-wrap gap-2">
                                {categories.map(cat => (
                                    <button
                                        key={cat.id}
                                        type="button"
                                        onClick={() => toggleCategory(cat.id)}
                                        className={clsx(
                                            'px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest transition-all',
                                            form.categoryIds.includes(cat.id)
                                                ? 'gold-gradient text-on-primary-fixed'
                                                : 'bg-surface-container text-on-surface-variant hover:text-primary border border-outline-variant/30'
                                        )}
                                    >
                                        {cat.icon && <span className="mr-1">{cat.icon}</span>}{cat.name}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Flags */}
                    <div className="space-y-3">
                        {[
                            { field: 'isRequired' as const, label: 'Required (part of the main Zero to Hero path)' },
                            { field: 'isPublished' as const, label: 'Published (visible to students)' },
                        ].map(({ field, label }) => (
                            <label key={field} className="flex items-center gap-3 p-3.5 bg-surface-container-lowest rounded-xl border border-outline-variant/30 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={form[field] as boolean}
                                    onChange={e => toggle(field, e.target.checked)}
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
                        {saving ? 'Saving…' : course ? 'Update Course' : 'Create Course'}
                    </button>
                </div>
            </div>
        </div>
    );
};
