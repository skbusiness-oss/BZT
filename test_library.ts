import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { getExerciseDetail } from './src/data/exerciseLibrary.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dir = path.join(__dirname, 'src', 'data');
const files = fs.readdirSync(dir).filter(f => f.includes('Programs.ts') || f === 'trainingPrograms.ts');

const allExercises = new Set<string>();
files.forEach(f => {
  const content = fs.readFileSync(path.join(dir, f), 'utf-8');
  const matches = [...content.matchAll(/ex\s*\(\s*(['`"])(.*?)\1/g)];
  matches.forEach(m => allExercises.add(m[2]));
});

let missing = 0;
Array.from(allExercises).forEach(ex => {
  const detail = getExerciseDetail(ex);
  if (!detail) {
     console.log('STILL MISSING: ', ex);
     missing++;
  }
});

if (missing === 0) {
    console.log('SUCCESS! All ' + allExercises.size + ' exercises are correctly mapped and resolve to a valid ExerciseDetail!');
} else {
    console.log('Total missed: ' + missing);
}
