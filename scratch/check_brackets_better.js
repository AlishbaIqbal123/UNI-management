import fs from 'fs';
const content = fs.readFileSync('c:/Users/Hp/Documents/university managemnet sytem/frontend/src/App.jsx', 'utf8');
let braceCount = 0;
let parenCount = 0;
let inString = false;
let stringChar = '';
let inComment = false;
let commentType = '';

for (let i = 0; i < content.length; i++) {
  const char = content[i];
  const nextChar = content[i+1];
  
  if (inComment) {
    if (commentType === '//' && char === '\n') inComment = false;
    if (commentType === '/*' && char === '*' && nextChar === '/') { inComment = false; i++; }
    continue;
  }
  
  if (inString) {
    if (char === stringChar && content[i-1] !== '\\') inString = false;
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
console.log(`Braces: ${braceCount}`);
console.log(`Parens: ${parenCount}`);
