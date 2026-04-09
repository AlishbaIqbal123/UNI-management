import fs from 'fs';
const content = fs.readFileSync('c:/Users/Hp/Documents/university managemnet sytem/frontend/src/App.jsx', 'utf8');
const lines = content.split('\n');
let braceCount = 0;
let parenCount = 0;

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  for (let char of line) {
    if (char === '{') braceCount++;
    if (char === '}') braceCount--;
    if (char === '(') parenCount++;
    if (char === ')') parenCount--;
  }
  if (braceCount < 0 || parenCount < 0) {
    console.log(`ERROR at line ${i + 1}: Negative balance (Braces: ${braceCount}, Parens: ${parenCount})`);
    break;
  }
}
console.log(`Final Balance - Braces: ${braceCount}, Parens: ${parenCount}`);
