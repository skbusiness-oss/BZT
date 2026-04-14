export type Role = 'community' | 'client' | 'coach' | 'admin';

export interface User {
    id: string;
    name: string;
    email: string;
    role: Role;
    avatarUrl?: string;
}

export type Category = 'cutting' | 'bulking' | 'pro' | 'health';

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
    };
    newTargets?: {
        highCarb: MacroTarget;
        lowCarb: MacroTarget;
    };
    changeTargetsFn?: boolean;
    dailyEntries: DayEntry[];
    weeklySummary?: string;
    hungerScale?: number;
    coachFeedback?: string;
    minWeight?: number;
    assignedWorkoutIds?: string[];
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
}

export interface IntakeData {
    startingWeight: string;
    height: string;
    goal: string;
    activityLevel: string;
    dietHistory: string;
    injuries: string;
    submittedAt: string;
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
    dayIndex: number; // 0 = Monday … 6 = Sunday
    label: string;   // "Monday", "Tuesday", …
    type: 'training' | 'rest';
    exercises: Exercise[];
}

export interface Workout {
    id: string;
    name: string;
    description: string;
    category: string;
    goal: WorkoutGoal;
    exercises: Exercise[];    // flat list for single-session; all-day exercises flattened for weekly
    estimatedMinutes: number;
    createdAt: string;
    days?: WorkoutDay[];      // present only for weekly-plan workouts
}

// --- Training Programs ---
export type MuscleGroup = 'chest' | 'back' | 'quads' | 'hamstrings' | 'shoulders' | 'arms' | 'glutes' | 'calves' | 'core' | 'full_body';

export interface WorkoutSession {
    label: string;
    workoutId: string;
    primaryMuscles: MuscleGroup[];
    secondaryMuscles: MuscleGroup[];
    cnsLoad: 1 | 2 | 3 | 4 | 5; // 1=light, 5=max effort
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
    likes: string[]; // user IDs who liked
    comments: Comment[];
    commentCount?: number;
}
