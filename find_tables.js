const fs = require('fs');
const path = require('path');

const walkSync = (dir, filelist = []) => {
  if (fs.existsSync(dir)) {
    fs.readdirSync(dir).forEach(file => {
      const dirFile = path.join(dir, file);
      if (fs.statSync(dirFile).isDirectory()) {
        if (!dirFile.includes('node_modules') && !dirFile.includes('.next')) {
          filelist = walkSync(dirFile, filelist);
        }
      } else {
        if (dirFile.endsWith('.ts') || dirFile.endsWith('.tsx')) {
          filelist.push(dirFile);
        }
      }
    });
  }
  return filelist;
};

const files = walkSync(path.join(__dirname, 'app')).concat(walkSync(path.join(__dirname, 'components'))).concat(walkSync(path.join(__dirname, 'utils')));

const tables = new Set();
const tableUsage = {};

files.forEach(file => {
  const content = fs.readFileSync(file, 'utf8');
  const regex = /supabase\.from\(['"]([^'"]+)['"]\)/g;
  let match;
  while ((match = regex.exec(content)) !== null) {
    const table = match[1];
    tables.add(table);
    if (!tableUsage[table]) tableUsage[table] = [];
    tableUsage[table].push(file.replace(__dirname, ''));
  }
});

console.log("=== SUPABASE TABLES USED ===");
tables.forEach(t => console.log(t));

console.log("\n=== TABLE USAGE FILES ===");
Object.keys(tableUsage).forEach(t => {
  console.log(`${t}: ${tableUsage[t].length} files`);
});
