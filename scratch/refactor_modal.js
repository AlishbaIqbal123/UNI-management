import fs from 'fs';
const path = 'c:/Users/Hp/Documents/university managemnet sytem/frontend/src/App.jsx';
let content = fs.readFileSync(path, 'utf8');

// 1. Identify the block to extract (667 to 1117)
const lines = content.split('\n');
const modalBodyContent = lines.slice(666, 1117).join('\n');

// 2. Define the helper function
const helperFunc = `
  const renderModalBody = () => {
    return (
      <>
${modalBodyContent}
      </>
    );
  };

`;

// 3. Insert helper after renderContent (around line 629)
content = content.replace('  };\n\n  return (', '  };\n' + helperFunc + '\n  return (');

// 4. Replace the old block with the call
// We need to be careful with the exact match
content = content.replace(modalBodyContent, '                {renderModalBody()}');

fs.writeFileSync(path, content);
console.log('Refactored modal into renderModalBody');
