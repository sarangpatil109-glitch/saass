const fs = require('fs');
const path = require('path');

function replaceUnsafeMethods(fullPath) {
  let content = fs.readFileSync(fullPath, 'utf8');
  let changed = false;

  const lowerIncludesRegex = /([a-zA-Z0-9_.\?]+)\?*\.toLowerCase\(\)\.includes\(/g;
  content = content.replace(lowerIncludesRegex, (match, p1) => {
    if (p1 === 'search' || p1 === 'query') return match;
    changed = true;
    const safeExpr = p1.replace(/\?$/, '');
    return `(${safeExpr} || '').toLowerCase().includes(`;
  });

  const splitRegex = /file\.name\.split\(/g;
  if (content.match(splitRegex)) {
    content = content.replace(splitRegex, "(file.name || '').split(");
    changed = true;
  }
  
  const replaceRegex = /instance\.business_name\.replace\(/g;
  if (content.match(replaceRegex)) {
    content = content.replace(replaceRegex, "(instance.business_name || '').replace(");
    changed = true;
  }

  const zipIdRegex = /zipId\.split\(/g;
  if (content.match(zipIdRegex)) {
    content = content.replace(zipIdRegex, "(zipId || '').split(");
    changed = true;
  }

  const ordIdRegex = /ord\.id\.split\(/g;
  if (content.match(ordIdRegex)) {
    content = content.replace(ordIdRegex, "(ord.id || '').split(");
    changed = true;
  }

  if (changed) {
    fs.writeFileSync(fullPath, content, 'utf8');
    console.log('Fixed unsafe string methods in:', fullPath);
  }
}

function traverse(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      traverse(fullPath);
    } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
      replaceUnsafeMethods(fullPath);
    }
  }
}

traverse(path.join(process.cwd(), 'app'));
traverse(path.join(process.cwd(), 'components'));
