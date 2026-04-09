import fs from 'fs';
const content = fs.readFileSync('c:/Users/Hp/Documents/university managemnet sytem/frontend/src/App.jsx', 'utf8');
const lines = content.split('\n');
let bc = 0, pc = 0;
let inString = false, strChar = '', inMLC = false;

const targets = [660, 665, 1114, 1115, 1120, 1130, 1135, 1140, 1160];

for (let lineIdx = 0; lineIdx < lines.length; lineIdx++) {
  const line = lines[lineIdx];
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i+1];
    if (inMLC) {
      if (char === '*' && nextChar === '/') { inMLC = false; i++; }
      continue;
    }
    if (inString) {
      if (char === strChar && line[i-1] !== '\\') inString = false;
      continue;
    }
    if (char === '/' && nextChar === '/') break;
    if (char === '/' && nextChar === '*') { inMLC = true; i++; continue; }
    if (char === "'" || char === '"' || char === '`') { inString = true; strChar = char; continue; }
    
    if (char === '{') bc++;
    if (char === '}') bc--;
    if (char === '(') pc++;
    if (char === ')') pc--;
  }
  if (targets.includes(lineIdx + 1)) {
    console.log(`Line ${lineIdx + 1} - bc: ${bc}, pc: ${pc}`);
  }
}
