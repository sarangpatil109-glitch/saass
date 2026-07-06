const fs = require('fs');
const path = require('path');
function processFile(fullPath) {
  let content = fs.readFileSync(fullPath, 'utf8');
  let changed = false;
  content = content.replace(/catch\s*\(([^)]+)\)\s*\{\s*return\s*\{(?:\s*data:\s*null\s*,)?\s*error:\s*([^.}]+)\.message\s*\}\s*\}/g, (match, p1, p2) => {
    changed = true;
    return `catch (${p1}) {\n    console.error('Action Error:', ${p2});\n    return { ${match.includes('data: null') ? 'data: null, ' : ''}error: \`Database Error: \${${p2}.message || JSON.stringify(${p2})}\` }\n  }`;
  });
  
  if (changed) {
    fs.writeFileSync(fullPath, content, 'utf8');
    console.log('Added console.error to:', fullPath);
  }
}

const dir = path.join(process.cwd(), 'app', 'actions');
const files = fs.readdirSync(dir);
for (const file of files) {
  if (file.endsWith('.ts')) {
    processFile(path.join(dir, file));
  }
}
