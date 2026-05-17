export type Role = 'community' | 'client' | 'coach' | 'admin';

export interface ActivityStreak {
    current: number;
    best: number;
    lastActiveDate: string; // YYYY-MM-DD
}

export interface User {
    id: string;
    name: string;
    email: string;
    role: Role;
    avatarUrl?: string;
    /** Theme preference, persisted across devices via the user doc. */
    theme?: 'dark' | 'light';
    /** Lifetime activity score. Never decreases. Level = floor(activityScore / 100) + 1. */
    activityScore?: number;
    /** Daily streak — current = consecutive days with activity, best = lifetime best. */
    streak?: ActivityStreak;
    /** Set when coach disables the user. AuthContext kicks them out on next snapshot. */
    disabled?: boolean;
    /** ISO timestamp of when the user accepted the latest ToS version. */
    tosAcceptedAt?: string;
    /** ToS version they accepted (e.g. 'v1'). */
    tosVersion?: string;
    /** Community/client self-profile fields. */
    age?: number;
    heightCm?: number;
    goal?: string;
    /** Fixed at onboarding. Never overwritten by weekly check-ins.
     *  Anchors the chart's "Start" reference line and progress %. */
    startWeightKg?: number;
    /** Overwritten on every weekly check-in — the LATEST weigh-in. */
    currentWeightKg?: number;
    targetWeightKg?: number;
    communityProfileStartedAt?: string;
    /** Snapshot of the user's last diet calculator run.
     * Set by `users/{uid}` writes from the DietWizard. Read-only on the server side
     * for analytics; the user can update freely on their own doc. */
    dietProfile?: DietProfile;
}

// ─── Diets ────────────────────────────────────────────────────────────────
// Mirrors the workouts pattern: static catalog in src/data/diets/*.ts, user
// runs a calculator wizard, gets matched to a plan, assigns it. Active
// assignment lives in `userDiets/{uid}` so it survives even if the catalog
// changes. PDF stays as the canonical source of truth — the in-app data is
// the index + macros.

export type Sex = 'male' | 'female';
export type ActivityLevel = 'sedentary' | 'light' | 'moderate' | 'active' | 'extra';
export type DietGoal = 'aggressive_cut' | 'cut' | 'recomp' | 'maintain' | 'lean_bulk' | 'bulk';
/** Coach's PDFs come in 3-meal and 4-meal variants. */
export type MealsPerDay = 3 | 4;
/** Tier band for browse filters. Derived from kcal — not stored. */
export type DietBand = 'low' | 'mid' | 'high' | 'super';

/** What the calculator outputs and stores on `users/{uid}.dietProfile`.
 * Persisted so the wizard can prefill on subsequent visits and the dashboard
 * can show the user's targets without re-running the math. */
export interface DietProfile {
    // Inputs
    sex: Sex;
    age: number;
    weightKg: number;
    heightCm: number;
    activityLevel: ActivityLevel;
    goal: DietGoal;
    mealsPerDay: MealsPerDay;

    // Computed (Mifflin-St Jeor + activity multiplier + goal adjustment)
    bmr: number;
    tdee: number;
    targetCalories: number;
    targetProtein: number;  // grams
    targetCarbs: number;    // grams
    targetFat: number;      // grams

    /** ID of the matched plan from src/data/diets/*. Optional — null when no
     * catalog plan matches the user's calorie tier yet (PDFs not loaded). */
    matchedDietId?: string;

    /** Server timestamps (ISO when read by the client). */
    calculatedAt?: string;
    updatedAt?: string;
}

/** One meal row inside a training-day or rest-day macro split.
 * Mirrors the PDF table: each meal has carbs / protein / fat in grams,
 * plus an "extras" line for veggies / fruit. */
export interface DietMeal {
    order: number;
    /** "Meal 01", "Meal 02 (pre/post WO)", "Meal 03", "Meal 04". */
    name: string;
    carbs: number;
    protein: number;
    fat: number;
    /** Veggies / fruit / 1 green apple etc. — verbatim from the PDF. */
    extras?: string;
}

/** A single training-day or rest-day target with per-meal breakdown. */
export interface DietDayMacros {
    kcal: number;
    protein: number;
    carbs: number;
    fat: number;
    meals: DietMeal[];
}

/** A single diet plan in the catalog. Static, defined in src/data/diets/.
 * Plans are keyed by **calorie tier + meal count**, not by goal. The user's
 * goal is just an input to the calculator that produces a target kcal —
 * plans are agnostic of cut/bulk and are reused across goals. */
export interface Diet {
    id: string;
    /** Display name, e.g. "1,400 kcal · 3 meals". */
    name: string;
    mealsPerDay: MealsPerDay;
    /** Headline calorie target. Equals `trainingDay.kcal`. */
    calories: number;
    /** Headline macros — equal training-day macros. Kept flat for browse cards. */
    macros: { protein: number; carbs: number; fat: number };
    /** Training day: full kcal target + per-meal split. */
    trainingDay: DietDayMacros;
    /** Rest day: lower kcal, lower carbs, slightly higher fat. */
    restDay: DietDayMacros;
    /** Special label, e.g. "Carb cycling" for the flexible 2000 kcal plan. */
    label?: string;
    description?: string;
    /** URL of the original PDF in Firebase Storage. */
    pdfUrl?: string;
    /** Optional cover image — falls back to a primary-tinted gradient. */
    coverImageUrl?: string;
}

/** Per-user active diet assignment. Lives at `userDiets/{uid}`. */
export interface UserDiet {
    id: string;
    userId: string;
    dietId: string;
    /** Snapshot of the matched diet at the time of assignment. Insulates the
     * user from later catalog edits. */
    snapshot: {
        name: string;
        mealsPerDay: MealsPerDay;
        calories: number;
        macros: { protein: number; carbs: number; fat: number };
        pdfUrl?: string;
    };
    assignedAt?: string;
}

export type Category = 'cutting' | 'bulking' | 'pro' | 'health';

export type Gender = 'male' | 'female';
export type FitnessLevel = 'beginner' | 'intermediate' | 'pro_competitions';

export interface MacroTarget {
    carbs: number;
    protein: number;
    fats: number;
    calories: number;
}

// ─── Audience profile (post-deletion ICP analytics) ──────────────────────
//
// Anonymized snapshot written by the deleteUser Cloud Function before any
// PII deletion. Lives at `audienceProfiles/{anonId}` keyed by a random
// id (NOT the original uid) so the record cannot be tied back to the
// deleted person — that's the whole point: GDPR-style "right to be
// forgotten" while preserving cohort-level analytics.
//
// Active accounts can be queried directly from `users/`. This collection
// is the post-deletion archive only.
export type AgeBracket = '13-17' | '18-24' | '25-34' | '35-44' | '45-54' | '55+';

export interface AudienceProfile {
    /** Random id. Self-reference for clarity in queries. NOT the user's uid. */
    anonId: string;
    /** Was this a coaching client or a community user. */
    accountType: 'community' | 'client';
    /** Lifecycle. `'deleted'` for archived records; we may add `'active'`
     *  later if/when we mirror live demographics here. */
    status: 'deleted';
    // Demographics — bracketed where re-identification risk is elevated.
    gender: 'male' | 'female' | null;
    ageBracket: AgeBracket | null;
    country: string | null;
    language: 'en' | 'ar' | null;
    /** Goal taxonomy from the user's onboarding (free-text, non-PII). */
    goal: string | null;
    /** Coarse engagement summary — no week-by-week granularity. */
    engagementSummary: {
        weeksActive: number;
        checkInsSubmitted: number;
        daysFromJoinToLast: number;
    };
    /** Truncated to first-of-month so cohort queries work without
     *  exposing exact join time (which combined with goal+age can leak
     *  identity in a small dataset). */
    joinedAt: string | null;
    deletedAt: string;
}

export interface DayEntry {
    date: string;
    weight?: number;
    carbs?: number;
    protein?: number;
    fats?: number;
    calories?: number;
    /** Daily cardio in kcal — separate from food calories. */
    cardio?: number;
    photos?: string[];
}

export interface WeekPhotos {
    front?: string; // Firebase Storage download URL
    side?: string;
    back?: string;
    face?: string;
}

export interface Week {
    id: string;
    clientId: string;
    weekNumber: number;
    status: 'pending' | 'submitted' | 'reviewed' | 'locked';
    activeTargets: {
        highCarb: MacroTarget;
        lowCarb: MacroTarget;
        /** Weekly cardio calorie target prescribed by the coach. */
        cardio?: number;
    };
    newTargets?: {
        highCarb: MacroTarget;
        lowCarb: MacroTarget;
        cardio?: number;
    };
    changeTargetsFn?: boolean;
    dailyEntries: DayEntry[];
    weeklySummary?: string;
    hungerScale?: number;
    strengthScale?: number;
    energyScale?: number;
    cardioCalories?: number;
    coachFeedback?: string;
    minWeight?: number;
    photos?: WeekPhotos;
}

export interface Client {
    id: string;
    userId: string;
    coachId?: string;
    name: string;
    email: string;
    category: Category;
    currentWeek: number;
    programLength: number;
    needsReview: boolean;
    isOnboarding?: boolean;
    intakeData?: IntakeData;
    accessLevel?: 'client' | 'community';
    birthdate?: string;
    gender?: Gender;
    fitnessLevel?: FitnessLevel;
}

export interface IntakeData {
    startingWeight: string;
    height: string;
    goal: string;
    activityLevel: string;
    dietHistory: string;
    injuries: string;
    submittedAt: string;
    birthdate?: string;
    gender?: string;
    fitnessLevel?: string;
    /** Onboarding photos written alongside the intake. Mirrored on Week 0 photos. */
    frontPhoto?: string;
    sidePhoto?: string;
    backPhoto?: string;
}

export interface Video {
    id: string;
    title: string;
    thumbnailUrl: string;
    category: string;
    isLocked: boolean;
    videoUrl?: string;
    platform?: 'youtube' | 'vimeo';
    description?: string;
    pdfFiles?: { name: string; url: string }[];
    level?: 'beginner' | 'intermediate' | 'advanced';
}

export interface LibraryTag {
    id: string;
    name: string;
    icon?: string;
    createdBy: string;
    createdAt: string;
}

// ─── Zero to Hero Academy ──────────────────────────────────────────────────────

export interface LibraryCategory {
    id: string;
    name: string;
    icon?: string;
    createdBy: string;
    createdAt: string;
    updatedAt?: string;
    archived?: boolean;
}

export type CourseType = 'academy' | 'recorded_live' | 'bonus';
export type AccessTier = 'community' | 'client' | 'coach';

export interface LessonResource {
    name: string;
    path?: string;
    url?: string;
}

export interface Course {
    id: string;
    title: string;
    description: string;
    level: 'beginner' | 'intermediate' | 'advanced';
    courseType: CourseType;
    categoryIds: string[];
    accessTier: AccessTier;
    order: number;
    isRequired: boolean;
    isPublished: boolean;
    coverImageUrl?: string;
    lessonCount?: number;
    requiredLessonCount?: number;
    totalDurationMinutes?: number;
    /** Coach-only lock. When true, the course card still shows on the
     *  browse grid (cover + title at full quality, as a teaser) but
     *  non-coaches cannot click into it — the detail page is unreachable. */
    isLocked?: boolean;
    createdBy: string;
    createdAt: string;
    updatedAt?: string;
    archived?: boolean;
}

export interface Lesson {
    id: string;
    title: string;
    description?: string;
    videoUrl?: string;
    platform?: 'youtube' | 'vimeo';
    thumbnailUrl?: string;
    order: number;
    durationMinutes?: number;
    isRequired: boolean;
    isPreview: boolean;
    prerequisiteLessonId?: string;
    hasContent?: boolean;
    createdBy: string;
    createdAt: string;
    updatedAt?: string;
    archived?: boolean;
}

export interface LessonContent {
    id: string;
    lessonId: string;
    courseId: string;
    videoUrl?: string;
    platform?: 'youtube' | 'vimeo';
    resources?: LessonResource[];
    transcript?: string;
    notes?: string;
    createdAt: string;
    updatedAt?: string;
}

export interface UserLessonProgress {
    id: string;
    userId: string;
    courseId: string;
    lessonId: string;
    status: 'started' | 'completed';
    startedAt: string;
    completedAt?: string;
    updatedAt?: string;
}

export interface UserCourseProgress {
    id: string;
    userId: string;
    courseId: string;
    completedLessonIds: string[];
    /** Most recent lesson the user opened — used for "Continue watching" cards. */
    lastLessonId?: string;
    startedAt: string;
    completedAt?: string;
    updatedAt?: string;
}

export interface Exercise {
    name: string;
    sets: number;
    reps: string;
    restSeconds: number;
    notes?: string;
}

export type WorkoutGoal = 'fat_loss' | 'muscle_gain' | 'strength' | 'recomp' | 'maintenance' | 'endurance';

export interface WorkoutDay {
    dayIndex: number;
    label: string;
    type: 'training' | 'rest';
    exercises: Exercise[];
}

export interface Workout {
    id: string;
    name: string;
    description: string;
    category: string;
    goal: WorkoutGoal;
    exercises: Exercise[];
    estimatedMinutes: number;
    createdAt: string;
    days?: WorkoutDay[];
}

// --- Training Programs ---
export type MuscleGroup = 'chest' | 'back' | 'quads' | 'hamstrings' | 'shoulders' | 'arms' | 'glutes' | 'calves' | 'core' | 'full_body';

export interface ProgramDay {
    dayNumber: number;
    type: 'workout' | 'rest';
    label: string;
    workoutId?: string;
    restDayType?: 'full_rest' | 'active_recovery';
    cnsLoad?: number;
}

export interface TrainingProgram {
    id: string;
    name: string;
    split: string;
    goal: WorkoutGoal;
    description: string;
    rotation: ProgramDay[];
    rules: string[];
}

// --- Messaging ---
export interface Message {
    id: string;
    senderId: string;
    receiverId: string;
    senderName: string;
    text: string;
    timestamp: string;
    read: boolean;
}

// --- Community ---
export interface Comment {
    id: string;
    authorId: string;
    authorName: string;
    content: string;
    timestamp: string;
}

export interface Post {
    id: string;
    authorId: string;
    authorName: string;
    authorRole: Role;
    content: string;
    timestamp: string;
    likes: string[];
    comments: Comment[];
    commentCount?: number;
}

// --- Workout Wizard & Program Tracking ---
export type Difficulty = 'beginner' | 'intermediate' | 'advanced';

export interface UserActiveProgram {
    userId: string;
    programId: string;
    programName: string;
    goal: WorkoutGoal;
    split: string;
    difficulty: Difficulty;
    startDate: string;
    currentCycle: number;
    completedDays: number[];
    rotation: ProgramDay[];
    assignedByCoach: boolean;
}

export type GifSource = 'free-exercise-db' | 'workout-cool' | 'youtube';
export type ExerciseType = 'lift' | 'cardio_protocol';

export interface ExerciseDetail {
    canonicalName: string;
    canonicalNameAr: string;
    gifUrl: string;
    gifId?: string;
    videoUrl?: string;
    videoId?: string;
    videoSource?: string;
    gifSource?: GifSource;
    type?: ExerciseType;
    muscles: {
        primary: string[];
        primaryAr: string[];
        secondary: string[];
        secondaryAr: string[];
    };
    instructions: string[];
    instructionsAr: string[];
    tips: string[];
    tipsAr: string[];
    commonMistakes: string[];
    commonMistakesAr: string[];
    equipment: string;
    equipmentAr: string;
}

