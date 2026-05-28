/**
 * useStretchingOverrides — live coach edits for the Stretching videos.
 *
 * The canonical video list lives in code (STRETCH_VIDEO_SEED). This
 * hook layers the coach's in-app edits on top, stored in a SINGLE
 * Firestore doc:
 *
 *   settings/stretchingOverrides  →  { overrides: { [exId]: {title?, titleAr?, deleted?} } }
 *
 * We deliberately reuse the existing `settings/{docId}` security rule
 * (read: any signed-in user, write: coach/admin) so no rules change /
 * deploy is needed. One doc + one listener keeps it atomic and cheap.
 *
 * Scope is rename + (soft) delete — adding brand-new clips still
 * happens in code. Soft-delete (deleted:true) keeps removals reversible
 * via restore().
 */
import { useEffect, useState, useCallback } from 'react';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { StretchOverride } from '../data/stretchingVideos';

const OVERRIDES_DOC = doc(db, 'settings', 'stretchingOverrides');

export interface StretchOverridesApi {
    overrides: Record<string, StretchOverride>;
    loading: boolean;
    /** Set EN/AR titles. Empty string falls back to the seed title. */
    rename: (exId: string, title: string, titleAr: string) => Promise<void>;
    /** Soft-delete: hide the video from clients (reversible). */
    remove: (exId: string) => Promise<void>;
    /** Un-hide a soft-deleted video. */
    restore: (exId: string) => Promise<void>;
}

export function useStretchingOverrides(): StretchOverridesApi {
    const [overrides, setOverrides] = useState<Record<string, StretchOverride>>({});
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsub = onSnapshot(
            OVERRIDES_DOC,
            snap => {
                const data = snap.data() as { overrides?: Record<string, StretchOverride> } | undefined;
                setOverrides(data?.overrides ?? {});
                setLoading(false);
            },
            err => {
                // Non-fatal: fall back to the in-code seed (no overrides).
                // eslint-disable-next-line no-console
                console.error('[useStretchingOverrides] snapshot error:', err);
                setLoading(false);
            },
        );
        return unsub;
    }, []);

    const write = useCallback((exId: string, patch: StretchOverride) =>
        // merge:true deep-merges the `overrides` map, so this touches
        // only overrides[exId] and leaves every other video's edits intact.
        setDoc(OVERRIDES_DOC, { overrides: { [exId]: patch } }, { merge: true }), []);

    const rename = useCallback((exId: string, title: string, titleAr: string) =>
        write(exId, { title: title.trim(), titleAr: titleAr.trim() }), [write]);

    const remove = useCallback((exId: string) => write(exId, { deleted: true }), [write]);
    const restore = useCallback((exId: string) => write(exId, { deleted: false }), [write]);

    return { overrides, loading, rename, remove, restore };
}
