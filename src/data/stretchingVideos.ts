/**
 * stretchingVideos.ts — single source of truth for the Stretching
 * category's videos (all the coach's OWN Vimeo footage).
 *
 * Why this file exists:
 *   The Stretching programs used to be hardcoded exercise lists that
 *   resolved their video by NAME against the static exercise library.
 *   That broke as soon as we wanted the coach to be able to RENAME a
 *   video — a rename would change the lookup key and orphan the clip.
 *
 *   So the seed below keys every video by a STABLE `id` (exId). The
 *   program builder stamps that id onto each Exercise, and the modal
 *   resolves the video by id → seed, never by the (editable) title.
 *   Coach title edits + soft-deletes live in a tiny Firestore doc
 *   (settings/stretchingOverrides) and are merged in at render time —
 *   see useStretchingOverrides + Workouts.tsx.
 *
 *   Adding NEW clips still happens here in code (the coach's CRUD is
 *   scoped to rename + delete); this keeps the canonical list, cues,
 *   and ordering version-controlled while letting the coach fix the
 *   best-guess titles himself without a redeploy.
 */
import { ExerciseDetail, Workout, Exercise } from '../types';

export type StretchSection = 'dynamic' | 'static' | 'beforeBed';

export interface StretchVideoSeed {
    id: string;            // stable key — also the override doc map key
    section: StretchSection;
    order: number;         // sort within the section
    title: string;         // EN canonical (coach can override)
    titleAr: string;       // AR canonical (coach can override)
    videoUrl: string;      // coach's Vimeo URL
    sets: number;
    reps: string;          // duration / count label, e.g. '30 sec each side'
    repsAr: string;
    primary: string[];     // target muscles (EN)
    primaryAr: string[];
}

/** Coach override entry stored under settings/stretchingOverrides.overrides[id] */
export interface StretchOverride {
    title?: string;
    titleAr?: string;
    deleted?: boolean;
}

// ─── Section metadata (one program card per section) ──────────────
interface SectionMeta {
    id: string;
    order: number;
    name: string;
    description: string;
    minutes: number;
    rest: number; // default restSeconds between moves
}

export const STRETCH_SECTION_META: Record<StretchSection, SectionMeta> = {
    dynamic: {
        id: 'stretch-dynamic-001',
        order: 1,
        name: 'Dynamic Stretching - Pre-Workout Warm-Up',
        description: 'Move through joint-friendly dynamic stretches before lifting or cardio. Follow along with Coach Zack.',
        minutes: 10,
        rest: 10,
    },
    static: {
        id: 'stretch-static-001',
        order: 2,
        name: 'Static Stretching - Post-Workout Cool Down',
        description: 'Hold longer positions after training to improve flexibility and bring the body down. Follow along with Coach Zack.',
        minutes: 12,
        rest: 15,
    },
    beforeBed: {
        id: 'stretch-bed-001',
        order: 3,
        name: 'Stretching Before Bed',
        description: 'A short, calming follow-along to relax the body and unwind before sleep.',
        minutes: 5,
        rest: 10,
    },
};

// ─── Coaching cues, baked per section (the raw clips have no narration) ──
// EN + AR. Dynamic mobility wants the OPPOSITE cue from static holds, and
// the bedtime routine leans into "slow and calming".
const CUES: Record<StretchSection, {
    instructions: string[]; instructionsAr: string[];
    tips: string[]; tipsAr: string[];
    mistakes: string[]; mistakesAr: string[];
}> = {
    dynamic: {
        instructions: [
            'Move smoothly and with control.',
            'Start with a small range and build it gradually.',
            'Keep moving — do not hold the end position.',
        ],
        instructionsAr: [
            'تحرّك بسلاسة وتحكّم.',
            'ابدأ بمدى حركة صغير وزِده تدريجيًا.',
            'استمر في الحركة — لا تثبت عند النهاية.',
        ],
        tips: [
            'Use this before lifting or cardio.',
            'Keep it controlled, not explosive.',
            'Aim to feel warm, not tired.',
        ],
        tipsAr: [
            'استخدمه قبل رفع الأثقال أو الكارديو.',
            'حافظ على التحكّم دون اندفاع.',
            'الهدف أن تشعر بالدفء لا بالتعب.',
        ],
        mistakes: [
            'Bouncing hard or forcing the range.',
            'Going too fast and losing control.',
        ],
        mistakesAr: [
            'الارتداد بعنف أو فرض المدى.',
            'السرعة الزائدة وفقدان التحكّم.',
        ],
    },
    static: {
        instructions: [
            'Ease into the position until you feel a gentle stretch.',
            'Hold still and breathe slowly through the nose.',
            'Relax a little deeper with each exhale.',
        ],
        instructionsAr: [
            'ادخل في الوضعية بلطف حتى تشعر بإطالة خفيفة.',
            'اثبت دون حركة وتنفّس ببطء من الأنف.',
            'استرخِ أعمق قليلًا مع كل زفير.',
        ],
        tips: [
            'Hold each stretch for 20-30 seconds.',
            'Stretch to mild tension, never to pain.',
            'Keep breathing — do not hold your breath.',
        ],
        tipsAr: [
            'اثبت في كل إطالة من 20 إلى 30 ثانية.',
            'أطِل حتى شدّ خفيف، وليس حتى الألم.',
            'استمر في التنفّس — لا تحبس نفسك.',
        ],
        mistakes: [
            'Bouncing instead of holding still.',
            'Forcing into pain.',
        ],
        mistakesAr: [
            'الارتداد بدل الثبات.',
            'الدفع حتى الألم.',
        ],
    },
    beforeBed: {
        instructions: [
            'Settle into each position slowly.',
            'Breathe long and soft through the nose.',
            'Let the muscle relax a little more with every exhale.',
        ],
        instructionsAr: [
            'استقر في كل وضعية ببطء.',
            'تنفّس بعمق وهدوء من الأنف.',
            'دع العضلة تسترخي أكثر مع كل زفير.',
        ],
        tips: [
            'Best done in dim light just before sleep.',
            'Keep everything gentle and unhurried.',
            'Focus on the breath to wind down.',
        ],
        tipsAr: [
            'يُفضّل القيام به في إضاءة خافتة قبل النوم.',
            'اجعل كل شيء لطيفًا ودون استعجال.',
            'ركّز على التنفّس للاسترخاء.',
        ],
        mistakes: [
            'Rushing or straining the stretch.',
            'Turning a calming routine into a workout.',
        ],
        mistakesAr: [
            'الاستعجال أو إجهاد الإطالة.',
            'تحويل روتين الاسترخاء إلى تمرين.',
        ],
    },
};

// ─── The coach's videos ───────────────────────────────────────────
// Dynamic clips 1-8 (filename suffix order), static clips, before-bed.
// Titles are best-guess from the thumbnails pending the coach's review
// — which is exactly what the in-app rename CRUD is for.
export const STRETCH_VIDEO_SEED: StretchVideoSeed[] = [
    // ── Dynamic — Pre-Workout Warm-Up ──
    { id: 'dyn-jog',       section: 'dynamic', order: 1, title: 'Jog in Place',          titleAr: 'الجري في المكان',                videoUrl: 'https://vimeo.com/1196340476', sets: 1, reps: '45 sec',           repsAr: '45 ثانية',            primary: ['Full body'],          primaryAr: ['كامل الجسم'] },
    { id: 'dyn-jacks',     section: 'dynamic', order: 2, title: 'Jumping Jacks',         titleAr: 'تمرين القفز المتباعد',           videoUrl: 'https://vimeo.com/1196340475', sets: 1, reps: '40 sec',           repsAr: '40 ثانية',            primary: ['Full body'],          primaryAr: ['كامل الجسم'] },
    { id: 'dyn-squat',     section: 'dynamic', order: 3, title: 'Bodyweight Squats',     titleAr: 'القرفصاء بوزن الجسم',            videoUrl: 'https://vimeo.com/1196340477', sets: 1, reps: '40 sec',           repsAr: '40 ثانية',            primary: ['Quads', 'Glutes'],    primaryAr: ['العضلة الرباعية', 'عضلات الألوية'] },
    { id: 'dyn-armcircle', section: 'dynamic', order: 4, title: 'Arm Circles',           titleAr: 'تدوير الذراعين',                 videoUrl: 'https://vimeo.com/1196340473', sets: 1, reps: '30 sec each way',   repsAr: '30 ثانية لكل اتجاه',  primary: ['Shoulders'],          primaryAr: ['الكتفان'] },
    { id: 'dyn-armswing',  section: 'dynamic', order: 5, title: 'Arm Swings',            titleAr: 'تأرجح الذراعين',                 videoUrl: 'https://vimeo.com/1196340782', sets: 1, reps: '30 sec',           repsAr: '30 ثانية',            primary: ['Shoulders', 'Chest'], primaryAr: ['الكتفان', 'الصدر'] },
    { id: 'dyn-sidebend',  section: 'dynamic', order: 6, title: 'Overhead Side Bend',    titleAr: 'الميل الجانبي مع رفع الذراعين',  videoUrl: 'https://vimeo.com/1196340798', sets: 1, reps: '30 sec each side',  repsAr: '30 ثانية لكل جانب',   primary: ['Obliques', 'Lats'],   primaryAr: ['العضلات المائلة', 'العضلات الجناحية'] },
    { id: 'dyn-crossover', section: 'dynamic', order: 7, title: 'Arm Crossovers',        titleAr: 'تقاطع الذراعين',                 videoUrl: 'https://vimeo.com/1196341028', sets: 1, reps: '30 sec',           repsAr: '30 ثانية',            primary: ['Chest', 'Shoulders'], primaryAr: ['الصدر', 'الكتفان'] },
    { id: 'dyn-torsotwist',section: 'dynamic', order: 8, title: 'Standing Torso Twists', titleAr: 'لف الجذع وقوفًا',                videoUrl: 'https://vimeo.com/1196341328', sets: 1, reps: '30 sec each side',  repsAr: '30 ثانية لكل جانب',   primary: ['Obliques', 'Spine'],  primaryAr: ['العضلات المائلة', 'العمود الفقري'] },

    // ── Static — Post-Workout Cool Down ──
    { id: 'st-forwardfold',section: 'static', order: 1, title: 'Standing Forward Fold',       titleAr: 'الانحناء الأمامي وقوفًا',       videoUrl: 'https://vimeo.com/1196321388', sets: 2, reps: '30 sec',           repsAr: '30 ثانية',           primary: ['Hamstrings', 'Lower back'], primaryAr: ['أوتار الركبة', 'أسفل الظهر'] },
    { id: 'st-hamstring',  section: 'static', order: 2, title: 'Standing Hamstring Stretch',  titleAr: 'إطالة أوتار الركبة وقوفًا',     videoUrl: 'https://vimeo.com/1196321429', sets: 2, reps: '30 sec each side',  repsAr: '30 ثانية لكل جانب',  primary: ['Hamstrings'],               primaryAr: ['أوتار الركبة'] },
    { id: 'st-toetouch',   section: 'static', order: 3, title: 'Standing Toe Touch',          titleAr: 'لمس أصابع القدم وقوفًا',        videoUrl: 'https://vimeo.com/1196321472', sets: 2, reps: '30 sec',           repsAr: '30 ثانية',           primary: ['Hamstrings', 'Lower back'], primaryAr: ['أوتار الركبة', 'أسفل الظهر'] },
    { id: 'st-hipflexor',  section: 'static', order: 4, title: 'Kneeling Hip Flexor Stretch', titleAr: 'إطالة ثنية الورك بالركوع',      videoUrl: 'https://vimeo.com/1196321430', sets: 2, reps: '30 sec each side',  repsAr: '30 ثانية لكل جانب',  primary: ['Hip flexors', 'Quads'],     primaryAr: ['ثنيات الورك', 'العضلة الرباعية'] },
    { id: 'st-figurefour', section: 'static', order: 5, title: 'Seated Figure-Four Stretch',  titleAr: 'إطالة الرقم أربعة جلوسًا',       videoUrl: 'https://vimeo.com/1196321390', sets: 2, reps: '30 sec each side',  repsAr: '30 ثانية لكل جانب',  primary: ['Glutes', 'Hips'],           primaryAr: ['عضلات الألوية', 'الوركان'] },
    { id: 'st-glute',      section: 'static', order: 6, title: 'Lying Glute Stretch',         titleAr: 'إطالة عضلة الألوية مستلقيًا',    videoUrl: 'https://vimeo.com/1196321389', sets: 2, reps: '30 sec each side',  repsAr: '30 ثانية لكل جانب',  primary: ['Glutes', 'Hips'],           primaryAr: ['عضلات الألوية', 'الوركان'] },

    // ── Before Bed ──
    { id: 'bed-fullbody',  section: 'beforeBed', order: 1, title: 'Bedtime Full-Body Stretch', titleAr: 'تمدد كامل الجسم قبل النوم',   videoUrl: 'https://vimeo.com/1196351597', sets: 1, reps: '1 min follow-along', repsAr: 'دقيقة واحدة بالمتابعة', primary: ['Full body'],          primaryAr: ['كامل الجسم'] },
];

export const SEED_BY_ID: Record<string, StretchVideoSeed> =
    Object.fromEntries(STRETCH_VIDEO_SEED.map(v => [v.id, v]));

/**
 * Build the full ExerciseDetail (bilingual) for a stretching video,
 * applying any coach title override. videoUrl drives the player; cues
 * come from the section. Used by the ExerciseModal via Workouts.tsx.
 */
export function buildStretchDetail(seed: StretchVideoSeed, override?: StretchOverride): ExerciseDetail {
    const cues = CUES[seed.section];
    return {
        canonicalName: override?.title?.trim() || seed.title,
        canonicalNameAr: override?.titleAr?.trim() || seed.titleAr,
        gifUrl: '',
        videoUrl: seed.videoUrl,
        videoSource: 'vimeo',
        gifSource: 'youtube',
        muscles: {
            primary: seed.primary,
            primaryAr: seed.primaryAr,
            secondary: [],
            secondaryAr: [],
        },
        instructions: cues.instructions,
        instructionsAr: cues.instructionsAr,
        tips: cues.tips,
        tipsAr: cues.tipsAr,
        commonMistakes: cues.mistakes,
        commonMistakesAr: cues.mistakesAr,
        equipment: 'Bodyweight',
        equipmentAr: 'وزن الجسم',
    };
}

/**
 * Build the static Stretching programs (one Workout per section) from
 * the seed. Each Exercise carries its stable `exId` + `videoUrl` so the
 * modal resolves the clip by id, not by the editable title. These feed
 * ALL_TRAINING_PROGRAMS as the canonical/offline base; Workouts.tsx
 * overlays the coach's Firestore title/delete overrides at render time.
 */
export function buildStretchingPrograms(): Workout[] {
    const sections: StretchSection[] = ['dynamic', 'static', 'beforeBed'];
    return sections
        .map(section => STRETCH_SECTION_META[section])
        .sort((a, b) => a.order - b.order)
        .map<Workout>(meta => {
            const section = (Object.keys(STRETCH_SECTION_META) as StretchSection[])
                .find(s => STRETCH_SECTION_META[s].id === meta.id)!;
            const exercises: Exercise[] = STRETCH_VIDEO_SEED
                .filter(v => v.section === section)
                .sort((a, b) => a.order - b.order)
                .map(v => ({
                    name: v.title,
                    sets: v.sets,
                    reps: v.reps,
                    restSeconds: meta.rest,
                    exId: v.id,
                    videoUrl: v.videoUrl,
                }));
            return {
                id: meta.id,
                name: meta.name,
                description: meta.description,
                category: 'Stretching',
                goal: 'maintenance',
                estimatedMinutes: meta.minutes,
                exercises,
                createdAt: '2026-05-28',
            };
        });
}
