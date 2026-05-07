const fs = require('fs');
const path = require('path');

const pagesDir = path.join(__dirname, 'client', 'src', 'pages');

const files = fs.readdirSync(pagesDir);
let changedCount = 0;

for (const file of files) {
  if (file.endsWith('.jsx')) {
    const filePath = path.join(pagesDir, file);
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Replace all occurrences of '../../' with '../' in import statements
    if (content.includes("from '../../") || content.includes("from '../../")) {
      content = content.replace(/from '..\/..\//g, "from '../");
      content = content.replace(/from "\.\.\/\.\.\//g, 'from "../');
      fs.writeFileSync(filePath, content, 'utf8');
      changedCount++;
    }
  }
}

console.log(`Successfully fixed import paths in ${changedCount} files.`);
