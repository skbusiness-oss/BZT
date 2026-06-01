/**
 * Broadcast — coach-only admin page for sending push notifications to
 * groups of members.
 *
 * Form:
 *   - Audience selector (4 options: All / Community only / Coaching only /
 *     Both — "Both" is an alias of All but exposed separately so the UI
 *     reads naturally in the founder's mental model).
 *   - Body textarea (required, 1000 char hard cap matching the rules).
 *   - Send button.
 *
 * Submit writes a single doc to broadcasts/{auto}. The Cloud Function
 * onBroadcastCreated picks it up, resolves the audience to a list of
 * UIDs by role, and fans out FCM pushes to each user's tokens. The
 * pushed payload deep-links to /notifications so a tap from the lock
 * screen lands on the inbox.
 *
 * Recent broadcasts strip below the form shows the last 10 messages so
 * the coach has visual confirmation his send went through.
 */
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    addDoc, updateDoc, deleteDoc, doc, collection, query, orderBy, limit, onSnapshot, serverTimestamp,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { Send, Megaphone, Loader2, CheckCircle2, AlertCircle, Users, Pencil, Trash2, X, Check } from 'lucide-react';
// Alias the type to BroadcastDoc so it doesn't clash with this file's
// own `Broadcast` page-component export.
import type { Broadcast as BroadcastDoc, BroadcastAudience } from '../types';

export const Broadcast = () => {
    const { user } = useAuth();
    const { t, isRTL } = useLanguage();
    const navigate = useNavigate();

    const [body, setBody] = useState('');
    const [audience, setAudience] = useState<BroadcastAudience>('all');
    const [sending, setSending] = useState(false);
    const [feedback, setFeedback] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null);
    const [recent, setRecent] = useState<BroadcastDoc[]>([]);

    // Post-send CRUD state for the recent list: which row is being
    // edited / pending delete, and which row has an in-flight write.
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editBody, setEditBody] = useState('');
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [rowBusy, setRowBusy] = useState<string | null>(null);

    // Coach gate — non-coach hitting /broadcast directly bounces home.
    useEffect(() => {
        if (user && user.role !== 'coach' && user.role !== 'admin') {
            navigate('/');
        }
    }, [user, navigate]);

    // Recent broadcasts feed — most recent 10. Real-time so the
    // confirmation lands the instant the doc is written.
    useEffect(() => {
        const q = query(collection(db, 'broadcasts'), orderBy('createdAt', 'desc'), limit(10));
        const unsub = onSnapshot(q,
            (snap) => {
                const rows: BroadcastDoc[] = snap.docs.map((d) => ({
                    id: d.id,
                    ...(d.data() as Omit<BroadcastDoc, 'id'>),
                }));
                setRecent(rows);
            },
            () => { /* ignore — empty list is fine */ }
        );
        return unsub;
    }, []);

    if (!user || (user.role !== 'coach' && user.role !== 'admin')) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const trimmed = body.trim();
        if (!trimmed) {
            setFeedback({ kind: 'err', text: t('broadcastEmptyError') });
            return;
        }
        setSending(true);
        setFeedback(null);
        try {
            await addDoc(collection(db, 'broadcasts'), {
                body: trimmed,
                audience,
                senderId: user.id,
                senderName: user.name || 'Coach Zaki',
                createdAt: serverTimestamp(),
            });
            setBody('');
            setFeedback({ kind: 'ok', text: t('broadcastSent') });
        } catch (err) {
            // eslint-disable-next-line no-console
            console.error('[broadcast] send failed:', err);
            setFeedback({ kind: 'err', text: t('broadcastFailedError') });
        } finally {
            setSending(false);
        }
    };

    // ── Post-send CRUD ───────────────────────────────────────────
    const startEdit = (b: BroadcastDoc) => {
        setDeletingId(null);
        setEditingId(b.id);
        setEditBody(b.body);
    };
    const cancelEdit = () => { setEditingId(null); setEditBody(''); };

    const saveEdit = async (id: string) => {
        const trimmed = editBody.trim();
        if (!trimmed) return;
        setRowBusy(id);
        setFeedback(null);
        try {
            // Only body + editedAt change — the rules block edits to
            // senderId/senderName/createdAt. onBroadcastCreated triggers
            // on create only, so this won't re-push to phones.
            await updateDoc(doc(db, 'broadcasts', id), {
                body: trimmed,
                editedAt: serverTimestamp(),
            });
            setEditingId(null);
            setEditBody('');
            setFeedback({ kind: 'ok', text: t('broadcastUpdated') });
        } catch (err) {
            // eslint-disable-next-line no-console
            console.error('[broadcast] update failed:', err);
            setFeedback({ kind: 'err', text: t('broadcastUpdateError') });
        } finally {
            setRowBusy(null);
        }
    };

    const confirmDelete = async (id: string) => {
        setRowBusy(id);
        setFeedback(null);
        try {
            await deleteDoc(doc(db, 'broadcasts', id));
            setDeletingId(null);
            setFeedback({ kind: 'ok', text: t('broadcastDeleted') });
        } catch (err) {
            // eslint-disable-next-line no-console
            console.error('[broadcast] delete failed:', err);
            setFeedback({ kind: 'err', text: t('broadcastDeleteError') });
        } finally {
            setRowBusy(null);
        }
    };

    const audienceLabel = (a: BroadcastAudience): string => {
        if (a === 'community') return t('notificationsAudienceCommunity');
        if (a === 'coaching')  return t('notificationsAudienceCoaching');
        return t('notificationsAudienceAll');
    };

    const formatTime = (ts: unknown): string => {
        const d = ts instanceof Date
            ? ts
            : (typeof ts === 'object' && ts !== null && 'toDate' in ts && typeof (ts as { toDate: () => Date }).toDate === 'function')
                ? (ts as { toDate: () => Date }).toDate()
                : (typeof ts === 'string' ? new Date(ts) : null);
        if (!d || isNaN(d.getTime())) return '—';
        const locale = isRTL ? 'ar-EG' : 'en-US';
        return d.toLocaleDateString(locale, { month: 'short', day: 'numeric' }) +
            '، ' + d.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' });
    };

    const audienceOptions: { value: BroadcastAudience; key: string }[] = [
        { value: 'all',       key: 'broadcastAudienceAll' },
        { value: 'community', key: 'broadcastAudienceCommunity' },
        { value: 'coaching',  key: 'broadcastAudienceCoaching' },
    ];

    return (
        <div className="max-w-3xl mx-auto space-y-8 animate-in fade-in duration-500 pt-4 pb-20">
            <header className="mb-2">
                <span className="font-label text-[10px] font-bold uppercase tracking-widest text-primary block mb-2">
                    {t('navBroadcast')}
                </span>
                <h1 className="font-headline font-extrabold text-4xl md:text-5xl text-on-surface tracking-tighter mb-3">
                    {t('broadcastPageTitle')}
                </h1>
                <p className="text-on-surface/60 font-body text-sm md:text-base leading-relaxed max-w-2xl">
                    {t('broadcastPageSub')}
                </p>
            </header>

            {/* Compose form */}
            <form onSubmit={handleSubmit} className="space-y-5">
                <div
                    className="rounded-3xl p-6 md:p-7 relative overflow-hidden"
                    style={{
                        background: 'linear-gradient(160deg, rgb(var(--primary) / 0.10), rgb(var(--surface-container-low)) 55%)',
                        border: '1px solid rgb(var(--primary) / 0.28)',
                        boxShadow: '0 18px 48px -20px rgb(var(--primary) / 0.28)',
                    }}
                >
                    {/* Body textarea */}
                    <label className="block text-[10px] uppercase tracking-[0.18em] font-extrabold text-on-surface/55 mb-2">
                        {t('broadcastBodyLabel')}
                    </label>
                    <textarea
                        value={body}
                        onChange={(e) => setBody(e.target.value.slice(0, 1000))}
                        placeholder={t('broadcastBodyPlaceholder')}
                        rows={4}
                        maxLength={1000}
                        className="w-full bg-surface-container-lowest border border-outline-variant/30 outline-none focus:border-primary focus:bg-surface-container rounded-2xl p-4 text-[15px] font-body text-on-surface placeholder-on-surface/30 transition-all resize-y min-h-[110px]"
                    />
                    <div className="mt-1 text-[11px] font-body text-on-surface/40 text-right" dir="ltr">
                        {body.length} / 1000
                    </div>

                    {/* Audience selector — vertical radio list (3 cards). */}
                    <div className="mt-5">
                        <label className="block text-[10px] uppercase tracking-[0.18em] font-extrabold text-on-surface/55 mb-3">
                            {t('broadcastAudienceLabel')}
                        </label>
                        <div className="space-y-2.5">
                            {audienceOptions.map((opt) => {
                                const active = audience === opt.value;
                                return (
                                    <button
                                        key={opt.value}
                                        type="button"
                                        onClick={() => setAudience(opt.value)}
                                        className="w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl text-left transition-all"
                                        style={{
                                            background: active
                                                ? 'rgb(var(--primary) / 0.14)'
                                                : 'rgb(var(--surface-container-lowest) / 0.55)',
                                            border: active
                                                ? '1.5px solid rgb(var(--primary) / 0.55)'
                                                : '1px solid rgb(var(--outline-variant) / 0.35)',
                                        }}
                                    >
                                        <span
                                            className="w-5 h-5 rounded-full flex items-center justify-center shrink-0"
                                            style={{
                                                background: active ? 'rgb(var(--primary))' : 'transparent',
                                                border: active
                                                    ? '2px solid rgb(var(--primary))'
                                                    : '2px solid rgb(var(--outline-variant) / 0.55)',
                                            }}
                                        >
                                            {active && (
                                                <span
                                                    className="w-2 h-2 rounded-full"
                                                    style={{ background: 'rgb(var(--on-primary))' }}
                                                />
                                            )}
                                        </span>
                                        <span
                                            className="font-body text-[14px]"
                                            style={{ color: active ? 'rgb(var(--on-surface))' : 'rgb(var(--on-surface-variant))', fontWeight: active ? 600 : 500 }}
                                        >
                                            {t(opt.key)}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Feedback chip — success or error. */}
                    {feedback && (
                        <div
                            className="mt-5 rounded-xl px-4 py-3 text-[13px] font-body flex items-center gap-2"
                            style={feedback.kind === 'ok'
                                ? { background: 'rgb(16 185 129 / 0.10)', color: 'rgb(110 231 183)', border: '1px solid rgb(16 185 129 / 0.30)' }
                                : { background: 'rgb(244 63 94 / 0.10)', color: 'rgb(251 113 133)', border: '1px solid rgb(244 63 94 / 0.30)' }}
                        >
                            {feedback.kind === 'ok' ? <CheckCircle2 size={14} /> : <AlertCircle size={14} />}
                            {feedback.text}
                        </div>
                    )}

                    {/* Submit */}
                    <button
                        type="submit"
                        disabled={sending || body.trim().length === 0}
                        className="bzt-press mt-6 w-full px-6 py-4 rounded-2xl font-label text-[12px] font-extrabold uppercase tracking-[0.18em] bg-gradient-to-br from-primary to-primary-container text-on-primary disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 transition-all"
                        style={{ boxShadow: '0 14px 32px rgb(var(--primary) / 0.32)' }}
                    >
                        {sending ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                        {sending ? t('broadcastSending') : t('broadcastSendCta')}
                    </button>
                </div>
            </form>

            {/* Recent broadcasts */}
            <section>
                <div className="flex items-center gap-3 mb-4">
                    <Megaphone size={16} className="text-primary" />
                    <h2 className="font-headline font-extrabold text-xl text-on-surface tracking-tight">
                        {t('broadcastRecentTitle')}
                    </h2>
                </div>
                {recent.length === 0 ? (
                    <p className="text-on-surface/50 font-body text-sm italic">
                        {t('broadcastRecentEmpty')}
                    </p>
                ) : (
                    <ul className="space-y-3">
                        {recent.map((b) => {
                            const isEditing = editingId === b.id;
                            const isDeleting = deletingId === b.id;
                            const busy = rowBusy === b.id;
                            const edited = !!b.editedAt;
                            return (
                            <li
                                key={b.id}
                                className="rounded-2xl p-4 border"
                                style={{
                                    background: 'rgb(var(--surface-container-low) / 0.65)',
                                    borderColor: 'rgb(var(--outline-variant) / 0.30)',
                                }}
                            >
                                <div className="flex items-center justify-between gap-3 mb-2">
                                    <span className="inline-flex items-center gap-1.5 text-[10px] font-label font-bold uppercase tracking-[0.18em] text-primary">
                                        <Users size={11} /> {audienceLabel(b.audience)}
                                        {edited && (
                                            <span className="text-on-surface/40 normal-case tracking-normal font-body">· {t('broadcastEditedTag')}</span>
                                        )}
                                    </span>
                                    <div className="flex items-center gap-1.5">
                                        <span className="text-[11px] font-body text-on-surface/45">
                                            {formatTime(b.createdAt)}
                                        </span>
                                        {!isEditing && !isDeleting && (
                                            <>
                                                <button
                                                    type="button"
                                                    onClick={() => startEdit(b)}
                                                    aria-label={t('broadcastEdit')}
                                                    className="p-1.5 rounded-lg text-on-surface/50 hover:text-primary hover:bg-primary/10 transition-colors"
                                                >
                                                    <Pencil size={14} />
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => { setEditingId(null); setDeletingId(b.id); }}
                                                    aria-label={t('broadcastDelete')}
                                                    className="p-1.5 rounded-lg text-on-surface/50 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </>
                                        )}
                                    </div>
                                </div>

                                {isEditing ? (
                                    <div className="space-y-2">
                                        <textarea
                                            value={editBody}
                                            onChange={(e) => setEditBody(e.target.value.slice(0, 1000))}
                                            rows={3}
                                            maxLength={1000}
                                            dir={isRTL ? 'rtl' : 'ltr'}
                                            className="w-full bg-surface-container-lowest border border-primary/40 outline-none focus:border-primary rounded-xl p-3 text-[14px] font-body text-on-surface resize-y"
                                        />
                                        <p className="text-[11px] font-body text-on-surface/40 leading-snug">
                                            {t('broadcastEditNote')}
                                        </p>
                                        <div className="flex items-center gap-2">
                                            <button
                                                type="button"
                                                disabled={busy || editBody.trim().length === 0}
                                                onClick={() => saveEdit(b.id)}
                                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-bold bg-primary text-on-primary disabled:opacity-50"
                                            >
                                                {busy ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />} {t('broadcastSaveEdit')}
                                            </button>
                                            <button
                                                type="button"
                                                onClick={cancelEdit}
                                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-bold bg-surface-container text-on-surface/70"
                                            >
                                                <X size={13} /> {t('broadcastCancelEdit')}
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <>
                                        <p className="font-body text-[14px] text-on-surface/85 leading-relaxed whitespace-pre-wrap">
                                            {b.body}
                                        </p>
                                        {isDeleting && (
                                            <div
                                                className="mt-3 flex items-center justify-between gap-3 rounded-xl px-3 py-2.5"
                                                style={{ background: 'rgb(244 63 94 / 0.08)', border: '1px solid rgb(244 63 94 / 0.25)' }}
                                            >
                                                <span className="text-[13px] font-body text-on-surface/80">
                                                    {t('broadcastDeleteConfirm')}
                                                </span>
                                                <div className="flex items-center gap-2 shrink-0">
                                                    <button
                                                        type="button"
                                                        disabled={busy}
                                                        onClick={() => confirmDelete(b.id)}
                                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-bold bg-red-500/90 text-white disabled:opacity-50"
                                                    >
                                                        {busy ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />} {t('broadcastDeleteYes')}
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => setDeletingId(null)}
                                                        className="px-3 py-1.5 rounded-lg text-[12px] font-bold bg-surface-container text-on-surface/70"
                                                    >
                                                        {t('broadcastDeleteNo')}
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </>
                                )}
                            </li>
                            );
                        })}
                    </ul>
                )}
            </section>
        </div>
    );
};
