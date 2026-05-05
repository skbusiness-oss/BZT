const fs = require('fs');
const path = require('path');
const dir = path.join(__dirname, 'src', 'data');
const files = fs.readdirSync(dir).filter(f => f.includes('Programs.ts') || f === 'trainingPrograms.ts' || f === 'broSplitPrograms.ts' || f === 'pplPrograms.ts' || f === 'upperLowerPrograms.ts' || f === 'hiitCardioPrograms.ts' || f === 'strengthPrograms.ts');

const allExercises = new Set();
files.forEach(f => {
  const content = fs.readFileSync(path.join(dir, f), 'utf-8');
  const matches = [...content.matchAll(/ex\s*\(\s*(['`"])(.*?)\1/g)];
  matches.forEach(m => allExercises.add(m[2]));
});

const libraryContent = fs.readFileSync(path.join(dir, 'exerciseLibrary.ts'), 'utf-8');

const missing = [];
Array.from(allExercises).forEach(ex => {
  const regexLiteral = new RegExp(`'${ex}'`, 'i');
  if (!libraryContent.match(regexLiteral)) {
     missing.push(ex);
  }
});

console.log('Total unique exercises found in programs:', allExercises.size);
console.log('Missing heavily or needing aliases:', missing.length);
console.log(missing.join('\n'));
