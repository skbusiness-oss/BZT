// ============================================================
// exerciseService.ts — ExerciseDB V1 free API client
// ============================================================
// Base URL: https://oss.exercisedb.dev/api/v1
// No API key required for the free tier.
// Session-level Map cache prevents duplicate fetches.
// ============================================================

const BASE_URL = 'https://oss.exercisedb.dev/api/v1';

// ─── Types ────────────────────────────────────────────────

export interface ExerciseResult {
    exerciseId: string;
    name: string;
    gifUrl: string;
    instructions: string[];
    targetMuscles: string[];
    secondaryMuscles: string[];
    bodyParts: string[];
    equipments: string[];
}

/** Simplified shape returned by getExerciseByName */
export interface ExerciseDetail {
    gifUrl: string;
    instructions: string[];
    targetMuscle: string;
    equipment: string;
}

// ─── Persistent cache (localStorage-backed) ───────────────

const LS_KEY = 'bz_exerciseDetail_v1';

function loadNameCache(): Map<string, ExerciseDetail | null> {
    try {
        const raw = typeof localStorage !== 'undefined' ? localStorage.getItem(LS_KEY) : null;
        if (!raw) return new Map();
        const obj = JSON.parse(raw) as Record<string, ExerciseDetail | null>;
        return new Map(Object.entries(obj));
    } catch {
        return new Map();
    }
}

let savePending = false;
function persistNameCache() {
    if (savePending || typeof localStorage === 'undefined') return;
    savePending = true;
    setTimeout(() => {
        try {
            const obj: Record<string, ExerciseDetail | null> = {};
            nameCache.forEach((v, k) => { obj[k] = v; });
            localStorage.setItem(LS_KEY, JSON.stringify(obj));
        } catch { /* quota/serialize errors are non-fatal */ }
        savePending = false;
    }, 500);
}

const nameCache = loadNameCache();
const searchCache = new Map<string, ExerciseResult[]>();
const muscleCache = new Map<string, ExerciseResult[]>();
const inflight = new Map<string, Promise<ExerciseDetail | null>>();

// ─── Internal fetch helper ────────────────────────────────

async function apiFetch<T>(path: string, params: Record<string, string> = {}): Promise<T> {
    const url = new URL(`${BASE_URL}${path}`);
    Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));

    const res = await fetch(url.toString());
    if (!res.ok) {
        throw new Error(`ExerciseDB API error ${res.status}: ${res.statusText}`);
    }
    return res.json();
}

// ─── Public API ───────────────────────────────────────────

/**
 * Look up a single exercise by its exact name (fuzzy match).
 * Returns the first match's GIF, instructions, primary target muscle,
 * and equipment — or null if nothing is found.
 *
 * Results are cached by normalised name for the lifetime of the session.
 */
export async function getExerciseByName(name: string): Promise<ExerciseDetail | null> {
    const key = name.trim().toLowerCase();
    if (nameCache.has(key)) return nameCache.get(key)!;
    if (inflight.has(key)) return inflight.get(key)!;

    const p = (async (): Promise<ExerciseDetail | null> => {
        try {
            // 1) Try strict name filter first (fast, cheap).
            let ex: ExerciseResult | undefined;
            try {
                const res = await apiFetch<{ success: boolean; data: ExerciseResult[] }>(
                    '/exercises', { name: key, limit: '1' }
                );
                if (res.success && res.data?.length) ex = res.data[0];
            } catch { /* fall through to search */ }

            // 2) Fallback: fuzzy search endpoint catches names that don't
            //    match ExerciseDB's canonical naming (plurals, synonyms, etc.).
            if (!ex) {
                const res = await apiFetch<{
                    success: boolean;
                    data: { exerciseId: string; name: string; gifUrl: string }[];
                }>('/exercises/search', { search: key, threshold: '0.4' });
                if (res.success && res.data?.length) {
                    const hit = res.data[0];
                    ex = {
                        exerciseId: hit.exerciseId,
                        name: hit.name,
                        gifUrl: hit.gifUrl,
                        instructions: [],
                        targetMuscles: [],
                        secondaryMuscles: [],
                        bodyParts: [],
                        equipments: [],
                    };
                }
            }

            if (!ex) {
                nameCache.set(key, null);
                persistNameCache();
                return null;
            }

            const detail: ExerciseDetail = {
                gifUrl: ex.gifUrl,
                instructions: ex.instructions ?? [],
                targetMuscle: ex.targetMuscles?.[0] ?? '',
                equipment: ex.equipments?.[0] ?? '',
            };
            nameCache.set(key, detail);
            persistNameCache();
            return detail;
        } catch (err) {
            console.error('[exerciseService] getExerciseByName failed:', err);
            return null;
        } finally {
            inflight.delete(key);
        }
    })();

    inflight.set(key, p);
    return p;
}

/**
 * Free-text fuzzy search. Returns up to 25 exercises matching the query.
 * Results are cached per query string for the session.
 */
export async function searchExercises(query: string): Promise<ExerciseResult[]> {
    const key = query.trim().toLowerCase();
    if (!key) return [];
    if (searchCache.has(key)) return searchCache.get(key)!;

    try {
        const res = await apiFetch<{
            success: boolean;
            data: { exerciseId: string; name: string; gifUrl: string }[];
        }>('/exercises/search', { search: key, threshold: '0.5' });

        if (!res.success || !res.data) {
            searchCache.set(key, []);
            return [];
        }

        // The search endpoint returns a lightweight shape (id, name, gifUrl).
        // We map it into ExerciseResult with empty arrays for the missing fields
        // so the caller has a consistent type.
        const results: ExerciseResult[] = res.data.map(d => ({
            exerciseId: d.exerciseId,
            name: d.name,
            gifUrl: d.gifUrl,
            instructions: [],
            targetMuscles: [],
            secondaryMuscles: [],
            bodyParts: [],
            equipments: [],
        }));

        searchCache.set(key, results);
        return results;
    } catch (err) {
        console.error('[exerciseService] searchExercises failed:', err);
        return [];
    }
}

/**
 * Get exercises that target a specific muscle group.
 * Returns up to 25 results. Cached per muscle name for the session.
 */
export async function getExercisesByMuscle(muscle: string): Promise<ExerciseResult[]> {
    const key = muscle.trim().toLowerCase();
    if (!key) return [];
    if (muscleCache.has(key)) return muscleCache.get(key)!;

    try {
        const res = await apiFetch<{
            success: boolean;
            data: ExerciseResult[];
        }>('/exercises/muscles', { targetMuscles: key, limit: '25' });

        if (!res.success || !res.data) {
            muscleCache.set(key, []);
            return [];
        }

        muscleCache.set(key, res.data);
        return res.data;
    } catch (err) {
        console.error('[exerciseService] getExercisesByMuscle failed:', err);
        return [];
    }
}
