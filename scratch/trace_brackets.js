import fs from 'fs';
const content = fs.readFileSync('c:/Users/Hp/Documents/university managemnet sytem/frontend/src/App.jsx', 'utf8');
const lines = content.split('\n');
let braceCount = 0;
let parenCount = 0;
let inString = false;
let stringChar = '';
let inComment = false;
let commentType = '';

const targets = [660, 665, 1100, 1130, 1140, 1160];

for (let lineIdx = 0; lineIdx < lines.length; lineIdx++) {
  const line = lines[lineIdx];
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i+1];
    if (inComment) {
      if (commentType === '//' && i === line.length - 1) inComment = false;
      if (commentType === '/*' && char === '*' && nextChar === '/') { inComment = false; i++; }
      continue;
    }
    if (inString) {
      if (char === stringChar && line[i-1] !== '\\') inString = false;
      continue;
    }
    if (char === '/' && nextChar === '/') { inComment = true; commentType = '//'; i++; continue; }
    if (char === '/' && nextChar === '*') { inComment = true; commentType = '/*'; i++; continue; }
    if (char === "'" || char === '"' || char === '`') { inString = true; stringChar = char; continue; }
    if (char === '{') braceCount++;
    if (char === '}') braceCount--;
    if (char === '(') parenCount++;
    if (char === ')') parenCount--;
  }
  if (targets.includes(lineIdx + 1)) {
    console.log(`Line ${lineIdx + 1} - Braces: ${braceCount}, Parens: ${parenCount}`);
  }
}
