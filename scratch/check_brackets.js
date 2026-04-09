import fs from 'fs';
const content = fs.readFileSync('c:/Users/Hp/Documents/university managemnet sytem/frontend/src/App.jsx', 'utf8');
let braceCount = 0;
let parenCount = 0;
for (let i = 0; i < content.length; i++) {
  if (content[i] === '{') braceCount++;
  if (content[i] === '}') braceCount--;
  if (content[i] === '(') parenCount++;
  if (content[i] === ')') parenCount--;
}
console.log(`Braces: ${braceCount}`);
console.log(`Parens: ${parenCount}`);
