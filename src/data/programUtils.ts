/**
 * PROGRAM UTILS — Difficulty derivation, split recommendations,
 * goal context, rep scheme parsing, and program assignment.
 *
 * Follows Claude2626 Sections 9, 12, 13.
 */

import { TrainingProgram, WorkoutGoal, Difficulty, ProgramAssignmentResult } from '../types';
import { ALL_PROGRAMS } from './programData';

// ═══════════════════════════════════════════
// DIFFICULTY DERIVATION (Section 9)
// ═══════════════════════════════════════════

export function getDifficulty(program: TrainingProgram): Difficulty {
    // Advanced: percentage-based powerlifting
    if (program.goal === 'strength' && program.split === 'Powerlifting') return 'advanced';
    if (program.goal === 'strength' && program.split === 'Push / Pull / Legs') return 'advanced';
    if (program.goal === 'strength' && program.split === 'Bro Split') return 'advanced';
    if (program.goal === 'strength' && program.split === 'Upper / Lower') return 'intermediate';

    // Beginner: full body, HIIT, cardio, maintenance, endurance
    if (program.split === 'Full Body') return 'beginner';
    if (program.split === 'HIIT / Circuit') return 'beginner';
    if (program.split === 'Cardio-Focused') return 'beginner';
    if (program.goal === 'maintenance') return 'beginner';
    if (program.goal === 'endurance') return 'beginner';

    // Everything else: intermediate
    return 'intermediate';
}

// ═══════════════════════════════════════════
// SPLIT RECOMMENDATIONS (Section 9)
// ═══════════════════════════════════════════

const SPLIT_RECOMMENDATIONS: Record<WorkoutGoal, Record<Difficulty, string[]>> = {
    fat_loss: {
        beginner: ['Full Body', 'HIIT / Circuit', 'Cardio-Focused'],
        intermediate: ['Push / Pull / Legs', 'Upper / Lower', 'Bro Split'],
        advanced: ['Push / Pull / Legs', 'Bro Split', 'Upper / Lower'],
    },
    muscle_gain: {
        beginner: ['Full Body', 'Upper / Lower'],
        intermediate: ['Push / Pull / Legs', 'Bro Split', 'Upper / Lower'],
        advanced: ['Bro Split', 'Push / Pull / Legs', 'Powerlifting'],
    },
    strength: {
        beginner: ['Full Body', 'Upper / Lower'],
        intermediate: ['Upper / Lower', 'Push / Pull / Legs'],
        advanced: ['Powerlifting', 'Push / Pull / Legs'],
    },
    recomp: {
        beginner: ['Full Body', 'Upper / Lower'],
        intermediate: ['Push / Pull / Legs', 'Upper / Lower', 'Bro Split'],
        advanced: ['Push / Pull / Legs', 'Bro Split'],
    },
    maintenance: {
        beginner: ['Full Body', 'Cardio-Focused'],
        intermediate: ['Upper / Lower', 'Push / Pull / Legs'],
        advanced: ['Bro Split', 'Powerlifting'],
    },
    endurance: {
        beginner: ['Cardio-Focused', 'HIIT / Circuit', 'Full Body'],
        intermediate: ['HIIT / Circuit', 'Cardio-Focused', 'Upper / Lower'],
        advanced: ['HIIT / Circuit', 'Powerlifting', 'Push / Pull / Legs'],
    },
};

export function getSplitRecommendations(goal: WorkoutGoal, difficulty: Difficulty): string[] {
    return SPLIT_RECOMMENDATIONS[goal]?.[difficulty] ?? [];
}

// ═══════════════════════════════════════════
// GOAL CONTEXT (Section 13) — EN + AR
// ═══════════════════════════════════════════

export interface GoalContext {
    label: string;
    labelAr: string;
    focus: string;
    focusAr: string;
    restGuidance: string;
    restGuidanceAr: string;
    weightGuidance: string;
    weightGuidanceAr: string;
    color: string;
    emoji: string;
}

const GOAL_CONTEXT: Record<WorkoutGoal, GoalContext> = {
    fat_loss: {
        label: 'Fat Loss Mode',
        labelAr: 'وضع حرق الدهون',
        focus: 'High reps, short rest, elevated heart rate. Burn is the goal.',
        focusAr: 'تكرارات عالية، راحة قصيرة، رفع معدل ضربات القلب. الحرق هو الهدف.',
        restGuidance: 'Keep rest SHORT — 60-90s max. Stay moving.',
        restGuidanceAr: 'أبق فترة الراحة قصيرة — 60-90 ثانية كحد أقصى. لا تتوقف.',
        weightGuidance: 'Moderate weight. If form breaks, it\'s too heavy.',
        weightGuidanceAr: 'وزن متوسط. إذا انكسر الشكل، الوزن ثقيل جداً.',
        color: 'orange',
        emoji: '🔥',
    },
    muscle_gain: {
        label: 'Muscle Building Mode',
        labelAr: 'وضع بناء العضلات',
        focus: 'Progressive overload. Beat last session\'s numbers.',
        focusAr: 'زيادة تدريجية في الحمل. تفوق على أرقام الجلسة الماضية.',
        restGuidance: 'Full rest 90-180s. You need it to lift heavy next set.',
        restGuidanceAr: 'راحة كاملة 90-180 ثانية. تحتاجها للرفع الثقيل في الشوط القادم.',
        weightGuidance: 'Set 1 heavy (80%). Set 2 drop to 50-60% for volume.',
        weightGuidanceAr: 'الشوط الأول ثقيل (80%). الشوط الثاني اخفض إلى 50-60% للحجم.',
        color: 'blue',
        emoji: '💪',
    },
    strength: {
        label: 'Strength Mode',
        labelAr: 'وضع القوة',
        focus: 'Heavy weight, low reps. Every rep is maximum effort.',
        focusAr: 'أوزان ثقيلة، تكرارات قليلة. كل تكرار بأقصى جهد.',
        restGuidance: 'Full rest 3-5 min on main lifts. Do not rush.',
        restGuidanceAr: 'راحة كاملة 3-5 دقائق على التمارين الرئيسية. لا تتسرع.',
        weightGuidance: 'Percentages matter. 85% means 85% of your tested 1RM.',
        weightGuidanceAr: 'النسب مهمة. 85% تعني 85% من أقصى رفعة تستطيعها.',
        color: 'red',
        emoji: '🏋️',
    },
    recomp: {
        label: 'Recomposition Mode',
        labelAr: 'وضع إعادة التركيب',
        focus: 'Build muscle AND burn fat. Dual purpose every set.',
        focusAr: 'بناء العضلات وحرق الدهون في آن واحد. كل شوط له غرضان.',
        restGuidance: 'Rest 90-120s. Not too long, not too short.',
        restGuidanceAr: 'استرح 90-120 ثانية. لا طويل جداً ولا قصير جداً.',
        weightGuidance: 'S1 at ~80%. S2 drop to 60-65% immediately after.',
        weightGuidanceAr: 'الشوط الأول بـ 80%. الشوط الثاني اخفض إلى 60-65% مباشرة.',
        color: 'purple',
        emoji: '⚖️',
    },
    maintenance: {
        label: 'Maintenance Mode',
        labelAr: 'وضع المحافظة',
        focus: 'Preserve what you built. Consistent effort, no need to push limits.',
        focusAr: 'حافظ على ما بنيته. جهد منتظم، لا حاجة لدفع الحدود.',
        restGuidance: 'Normal rest 60-120s. Comfortable pace.',
        restGuidanceAr: 'راحة عادية 60-120 ثانية. وتيرة مريحة.',
        weightGuidance: 'Same weights as usual. Steady quality work.',
        weightGuidanceAr: 'نفس الأوزان المعتادة. عمل منتظم بجودة عالية.',
        color: 'green',
        emoji: '🔄',
    },
    endurance: {
        label: 'Endurance Mode',
        labelAr: 'وضع التحمل',
        focus: 'High reps, minimal rest. Train your body to keep going.',
        focusAr: 'تكرارات عالية، راحة قليلة. درّب جسمك على الاستمرار.',
        restGuidance: 'Rest 30-45s MAXIMUM. Short rest IS the training.',
        restGuidanceAr: 'راحة 30-45 ثانية كحد أقصى. الراحة القصيرة هي التدريب.',
        weightGuidance: 'Very light weight. 20+ reps = much lighter than you think.',
        weightGuidanceAr: 'وزن خفيف جداً. 20+ تكرار = أخف مما تتوقع بكثير.',
        color: 'teal',
        emoji: '🏃',
    },
};

export function getGoalContext(goal: WorkoutGoal): GoalContext {
    return GOAL_CONTEXT[goal];
}

// Goal descriptions for wizard step 1
export const GOAL_DESCRIPTIONS: Record<WorkoutGoal, { desc: string; descAr: string }> = {
    fat_loss: {
        desc: 'Burn fat while preserving muscle. High-intensity, calorie-torching workouts.',
        descAr: 'حرق الدهون مع الحفاظ على العضلات. تمارين عالية الكثافة لحرق السعرات.',
    },
    muscle_gain: {
        desc: 'Build lean muscle mass. Progressive overload with hypertrophy focus.',
        descAr: 'بناء كتلة عضلية صافية. زيادة تدريجية مع التركيز على التضخم.',
    },
    strength: {
        desc: 'Get stronger. Heavy compounds, low reps, percentage-based training.',
        descAr: 'كن أقوى. تمارين مركبة ثقيلة، تكرارات قليلة، تدريب بالنسب المئوية.',
    },
    recomp: {
        desc: 'Lose fat and build muscle simultaneously. Dual-set approach.',
        descAr: 'اخسر الدهون وابنِ العضلات في نفس الوقت. نهج مزدوج.',
    },
    maintenance: {
        desc: 'Maintain your current physique. Moderate effort, stay consistent.',
        descAr: 'حافظ على لياقتك الحالية. جهد متوسط، كن منتظماً.',
    },
    endurance: {
        desc: 'Build stamina and endurance. High reps, minimal rest, keep moving.',
        descAr: 'بناء القدرة على التحمل. تكرارات عالية، راحة قليلة، استمر بالحركة.',
    },
};

// Difficulty descriptions for wizard step 2
export const DIFFICULTY_DESCRIPTIONS: Record<Difficulty, { label: string; labelAr: string; desc: string; descAr: string }> = {
    beginner: {
        label: 'Beginner',
        labelAr: 'مبتدئ',
        desc: 'New to training / returning after break / machine-based',
        descAr: 'جديد على التدريب / عودة بعد انقطاع / تمارين على الأجهزة',
    },
    intermediate: {
        label: 'Intermediate',
        labelAr: 'متوسط',
        desc: '1-2 years / comfortable with free weights',
        descAr: '1-2 سنوات / مرتاح مع الأوزان الحرة',
    },
    advanced: {
        label: 'Advanced',
        labelAr: 'متقدم',
        desc: '3+ years / percentage-based lifting / heavy compounds',
        descAr: '3+ سنوات / رفع بالنسب المئوية / تمارين مركبة ثقيلة',
    },
};

// ═══════════════════════════════════════════
// REP SCHEME PARSER (Section 12)
// ═══════════════════════════════════════════

export interface RepSchemeInfo {
    type: 'dual' | 'percentage' | 'recomp' | 'failure' | 'timed' | 'standard';
    explanation: string;
    explanationAr: string;
    details?: Record<string, string>;
}

const GOAL_REP_EXPLANATIONS: Record<WorkoutGoal, { en: string; ar: string }> = {
    fat_loss: {
        en: 'Keep the pace fast. High reps = more calories burned.',
        ar: 'حافظ على السرعة. تكرارات عالية = حرق سعرات أكثر.',
    },
    muscle_gain: {
        en: 'Control the negative. Feel every rep in the target muscle.',
        ar: 'تحكم في النزول. اشعر بكل تكرار في العضلة المستهدفة.',
    },
    strength: {
        en: 'Maximum force on every rep. Rest fully between sets.',
        ar: 'أقصى قوة في كل تكرار. استرح بالكامل بين الأشواط.',
    },
    recomp: {
        en: 'Set 1 for strength. Set 2 for volume. Both matter equally.',
        ar: 'الشوط الأول للقوة. الشوط الثاني للحجم. كلاهما مهم بالتساوي.',
    },
    maintenance: {
        en: 'Steady, controlled reps. No need to push to failure.',
        ar: 'تكرارات ثابتة ومتحكمة. لا حاجة للوصول للفشل.',
    },
    endurance: {
        en: 'Keep going. The burn is the stimulus. Push through.',
        ar: 'استمر. الحرق هو المحفز. اكمل.',
    },
};

export function parseRepScheme(reps: string, goal: WorkoutGoal): RepSchemeInfo {
    const repsLower = reps.toLowerCase();

    // DUAL SET: '5-9 + 10-15'
    if (reps.includes('+')) {
        const parts = reps.split('+').map(s => s.trim());
        return {
            type: 'dual',
            explanation: `Set 1: ${parts[0]} reps HEAVY (~80%) | Set 2: ${parts[1]} reps PUMP (~50%)`,
            explanationAr: `الشوط الأول: ${parts[0]} تكرارات ثقيل (~80%) | الشوط الثاني: ${parts[1]} تكرارات ضخ (~50%)`,
            details: { set1: parts[0], set2: parts[1] },
        };
    }

    // PERCENTAGE: '5 @80%' or '3 @85-88%'
    if (reps.includes('@')) {
        const match = reps.match(/(\d+)\s*@\s*(.+)/);
        if (match) {
            return {
                type: 'percentage',
                explanation: `${match[1]} reps at ${match[2]} of your 1 rep max`,
                explanationAr: `${match[1]} تكرارات عند ${match[2]} من أقصى طاقتك`,
                details: { reps: match[1], percentage: match[2] },
            };
        }
    }

    // RECOMP DUAL: 'S1×6, S2×12' or 'S1×6@80%, S2×12@65%'
    if (reps.includes('S1') && reps.includes('S2')) {
        return {
            type: 'recomp',
            explanation: 'Set 1 strength. Set 2 volume.',
            explanationAr: 'الشوط الأول: قوة. الشوط الثاني: حجم.',
        };
    }

    // FAILURE: 'Until Failure' or 'Max'
    if (repsLower.includes('failure') || repsLower === 'max' || repsLower.includes('max reps')) {
        return {
            type: 'failure',
            explanation: 'Go until you cannot complete another clean rep',
            explanationAr: 'استمر حتى لا تستطيع إكمال تكرار نظيف',
        };
    }

    // TIMED: '40s Work / 20s Rest' or 'X Secs' or 'X Min'
    if (repsLower.includes('sec') || repsLower.includes('min') || repsLower.includes('work')) {
        return {
            type: 'timed',
            explanation: 'Work for the full time. Quality over speed.',
            explanationAr: 'اعمل طوال الوقت المحدد. الجودة قبل السرعة.',
        };
    }

    // STANDARD: '10-15', '8-12'
    const goalExp = GOAL_REP_EXPLANATIONS[goal];
    return {
        type: 'standard',
        explanation: goalExp.en,
        explanationAr: goalExp.ar,
    };
}

// ═══════════════════════════════════════════
// PROGRAM ASSIGNMENT (Section 9)
// ═══════════════════════════════════════════

export function assignProgram(goal: WorkoutGoal, difficulty: Difficulty): ProgramAssignmentResult | null {
    const recommendedSplits = getSplitRecommendations(goal, difficulty);
    if (recommendedSplits.length === 0) return null;

    // Find the first matching program for goal + recommended split
    for (const split of recommendedSplits) {
        const match = ALL_PROGRAMS.find(p => p.goal === goal && p.split === split);
        if (match) {
            return {
                program: match,
                recommendedSplits,
                difficulty,
                goal,
            };
        }
    }

    return null;
}

// Find programs matching a goal + split combination
export function findPrograms(goal: WorkoutGoal, split: string): TrainingProgram[] {
    return ALL_PROGRAMS.filter(p => p.goal === goal && p.split === split);
}

// Get all available splits for a goal + difficulty
export function getAvailableSplits(goal: WorkoutGoal, difficulty: Difficulty): {
    split: string;
    program: TrainingProgram;
    isRecommended: boolean;
    recommendedRank: number;
}[] {
    const recommended = getSplitRecommendations(goal, difficulty);

    // Get all unique splits that have a program for this goal
    const allSplits = [...new Set(ALL_PROGRAMS.filter(p => p.goal === goal).map(p => p.split))];

    return allSplits.map(split => {
        const program = ALL_PROGRAMS.find(p => p.goal === goal && p.split === split)!;
        const rankIndex = recommended.indexOf(split);
        return {
            split,
            program,
            isRecommended: rankIndex >= 0,
            recommendedRank: rankIndex >= 0 ? rankIndex : 999,
        };
    }).sort((a, b) => a.recommendedRank - b.recommendedRank);
}
