import fs from 'fs';
const content = fs.readFileSync('c:/Users/Hp/Documents/university managemnet sytem/frontend/src/App.jsx', 'utf8');
let bc = 0, pc = 0;
let inString = false, strChar = '', inMLC = false;

for (let i = 0; i < content.length; i++) {
  const c = content[i], next = content[i+1];
  if (inMLC) {
    if (c === '*' && next === '/') { inMLC = false; i++; }
    continue;
  }
  if (inString) {
    if (c === strChar && content[i-1] !== '\\') inString = false;
    continue;
  }
  if (c === '/' && next === '/') { i = content.indexOf('\n', i); if (i === -1) break; continue; }
  if (c === '/' && next === '*') { inMLC = true; i++; continue; }
  if (c === "'" || c === '"' || c === '`') { inString = true; strChar = c; continue; }
  
  if (c === '{') bc++;
  if (c === '}') bc--;
  if (c === '(') pc++;
  if (c === ')') pc--;

  if (bc < 0 || pc < 0) {
    const line = content.substring(0, i).split('\n').length;
    console.log(`ERROR: Balance broke at line ${line} (c='${c}') (bc=${bc}, pc=${pc})`);
    // Find snippet
    const start = Math.max(0, i - 20);
    const end = Math.min(content.length, i + 20);
    console.log(`Snippet: "${content.substring(start, end).replace(/\n/g, '\\n')}"`);
    process.exit(1);
  }
}
console.log(`OK: Final bc=${bc}, pc=${pc}`);
