import { Workout, Exercise } from '../types';

function ex(name: string, sets: number, reps: string, rest = 20, notes?: string): Exercise {
    return { name, sets, reps, restSeconds: rest, notes };
}

function stretch(id: string, name: string, desc: string, mins: number, exercises: Exercise[]): Workout {
    return {
        id,
        name,
        description: desc,
        category: 'Stretching',
        goal: 'maintenance',
        estimatedMinutes: mins,
        exercises,
        createdAt: '2026-05-20',
    };
}

export const STRETCHING_PROGRAMS: Workout[] = [
    stretch('stretch-dynamic-001', 'Dynamic Stretching - Pre-Workout Warm-Up', 'Move through joint-friendly dynamic stretches before lifting or cardio. Follow along with Coach Zack.', 10, [
        ex('Jog in Place', 1, '45 sec', 10, 'Light and easy to start'),
        ex('Jumping Jacks', 1, '40 sec', 10),
        ex('Bodyweight Squats', 1, '40 sec', 10),
        ex('Arm Circles', 1, '30 sec each way', 10),
        ex('Arm Swings', 1, '30 sec', 10),
        ex('Overhead Side Bend', 1, '30 sec each side', 10),
        ex('Arm Crossovers', 1, '30 sec', 10),
        ex('Standing Torso Twists', 1, '30 sec each side', 10),
    ]),
    stretch('stretch-static-001', 'Static Stretching - Post-Workout Cool Down', 'Hold longer positions after training to bring the body down and improve flexibility. Follow along with Coach Zack.', 12, [
        ex('Standing Forward Fold', 2, '30 sec hold', 15, 'Soften deeper on each exhale'),
        ex('Standing Hamstring Stretch', 2, '30 sec each side', 15),
        ex('Standing Toe Touch', 2, '30 sec hold', 15),
        ex('Kneeling Hip Flexor Stretch', 2, '30 sec each side', 15),
        ex('Seated Figure-Four Stretch', 2, '30 sec each side', 15),
        ex('Lying Glute Stretch', 2, '30 sec each side', 15),
    ]),
    stretch('stretch-back-001', 'Back Stretching - Back, Hips & Hamstrings', 'A simple recovery flow for tight lower back, hips, and posterior chain.', 8, [
        ex('Back Pain Relief Stretch Routine', 1, '5 min follow-along', 20, 'Stop if pain increases'),
        ex('Cat Cow Stretch', 2, '8 slow reps', 15),
        ex('Knee To Chest Stretch', 2, '40 sec each side', 15),
        ex('Figure Four Stretch', 2, '40 sec each side', 15),
        ex('Thread The Needle Stretch', 2, '8 each side', 15),
    ]),
    stretch('stretch-full-body-001', 'Full Body Stretching - Daily Mobility', 'A full-body follow-along routine for off days, mornings, or recovery evenings.', 15, [
        ex('Full Body Stretching Routine', 1, '15 min follow-along', 20, 'Daily mobility option'),
        ex('Hip Flexor Stretch', 2, '45 sec each side', 15),
        ex('Pancake Stretch', 2, '45 sec', 15),
        ex('Lat Stretch', 2, '45 sec each side', 15),
        ex('Seated Spinal Twist', 2, '45 sec each side', 15),
    ]),
];
