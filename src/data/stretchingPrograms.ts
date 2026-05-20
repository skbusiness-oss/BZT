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
    stretch('stretch-dynamic-001', 'Dynamic Stretching - Pre-Workout Warm-Up', 'Move through joint-friendly dynamic stretches before lifting or cardio.', 10, [
        ex('Dynamic Full Body Warm-Up', 1, '5 min follow-along', 20, 'Use before training'),
        ex('Worlds Greatest Stretch', 2, '6 each side', 20, 'Move slowly'),
        ex('Leg Swings', 2, '12 each side', 15, 'Front/back and side/side'),
        ex('Arm Circles', 2, '20 seconds each way', 15),
        ex('Hip Circles', 2, '8 each way', 15),
    ]),
    stretch('stretch-static-001', 'Static Stretching - Post-Workout Cool Down', 'Hold longer positions after training to bring the body down and improve flexibility.', 15, [
        ex('Static Full Body Stretch', 1, '15 min follow-along', 20, 'Use after training'),
        ex('Hamstring Stretch', 2, '45 sec each side', 15),
        ex('Quad Stretch', 2, '45 sec each side', 15),
        ex('Chest Doorway Stretch', 2, '45 sec', 15),
        ex('Childs Pose Lat Stretch', 2, '45 sec', 15),
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
