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
    currentWeightKg?: number;
    targetWeightKg?: number;
    communityProfileStartedAt?: string;
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

export interface WorkoutSession {
    label: string;
    workoutId: string;
    primaryMuscles: MuscleGroup[];
    secondaryMuscles: MuscleGroup[];
    cnsLoad: 1 | 2 | 3 | 4 | 5;
    isFullBody: boolean;
    hasHeavyCompounds: boolean;
    isSquatDay: boolean;
    isDeadliftDay: boolean;
}

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

export interface ProgramAssignmentResult {
    program: TrainingProgram;
    recommendedSplits: string[];
    difficulty: Difficulty;
    goal: WorkoutGoal;
}
