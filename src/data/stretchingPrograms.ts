/**
 * STRETCHING_PROGRAMS — now derived entirely from STRETCH_VIDEO_SEED
 * (the coach's own Vimeo footage) via buildStretchingPrograms().
 *
 * The previous hand-written lists mixed in third-party YouTube clips
 * (Back Stretching, Full-Body Daily Mobility). Those are gone: the
 * Stretching category is 100% BioZackTeam original now — Dynamic
 * (pre-workout), Static (post-workout), and Before Bed.
 *
 * Each exercise carries a stable `exId`, so the coach can rename/delete
 * videos in-app (settings/stretchingOverrides) without breaking video
 * playback. See stretchingVideos.ts for the seed + builder.
 */
import { Workout } from '../types';
import { buildStretchingPrograms } from './stretchingVideos';

export const STRETCHING_PROGRAMS: Workout[] = buildStretchingPrograms();
