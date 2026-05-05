const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, 'src', 'data', 'exerciseLibrary.ts');
let content = fs.readFileSync(file, 'utf-8');

// Find the injected block
const startInject = content.indexOf('// ── INJECTED PENDING REVIEW ──');
const endInject = content.indexOf('// ── Aliases:');

if (startInject > -1 && endInject > startInject) {
    // Extract the injected content
    let injectedContent = content.substring(startInject, endInject);
    
    // Remove it from the original spot
    content = content.replace(injectedContent, '');
    
    // Find the end of LIBRARY
    const libEnd = content.indexOf('};\n\n// ── Aliases:') > -1 ? '};\n\n// ── Aliases:' : '};\n// ── Aliases:';
    // wait, earlier I replaced the target string `// ── Aliases: ...` with the block.
    // Let's just find the closing bracket of LIBRARY
    // We know LIBRARY starts at `const LIBRARY: Record<string, ExerciseDetail> = {`
    // and ends at `};` before the aliases.
    
    // Let's do it safer: The last item before `};` of LIBRARY.
    // The previous target was: `};\n\n// ── Aliases:` or similar.
    content = content.replace('};\n// ── Aliases:', injectedContent + '\n};\n\n// ── Aliases:');
    content = content.replace('};\n\n// ── Aliases:', injectedContent + '\n};\n\n// ── Aliases:');
    // If it was already replaced poorly:
    content = content.replace('};\n\n    // ── INJECTED PENDING REVIEW ──', '    // ── INJECTED PENDING REVIEW ──');
    // Let's just re-patch cleanly.

    fs.writeFileSync(file, content, 'utf-8');
} else {
    console.log('Could not find injected block');
}

// A more robust repair since we know exactly where it messed up:
content = fs.readFileSync(file, 'utf-8');
// Fix the literal structure. We want injectedContent INSIDE the `};` of LIBRARY.
// The file currently has:
// 560: };
// 561: 
// 562:     // ── INJECTED PENDING REVIEW ──
// ...
// 901:     // ── Aliases: 
// We want to remove `};` from line 560, and put it right before `// ── Aliases:`.

if (content.match(/};\s*\n\s*\/\/\s*── INJECTED PENDING REVIEW ──/)) {
    content = content.replace(/};\s*\n\s*\/\/\s*── INJECTED PENDING REVIEW ──/, '    // ── INJECTED PENDING REVIEW ──');
    content = content.replace(/\n\s*\/\/\s*── Aliases:/, '\n};\n\n// ── Aliases:');
    fs.writeFileSync(file, content, 'utf-8');
    console.log('Fixed syntax error!');
}
