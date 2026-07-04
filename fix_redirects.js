const fs = require('fs');
const path = require('path');

const walkSync = (dir, filelist = []) => {
  fs.readdirSync(dir).forEach(file => {
    const dirFile = path.join(dir, file);
    try {
      filelist = walkSync(dirFile, filelist);
    } catch (err) {
      if (err.code === 'ENOTDIR' || err.code === 'EBUSY') filelist = [...filelist, dirFile];
    }
  });
  return filelist;
};

const files = walkSync(path.join(__dirname, 'app', '(dashboard)'));
const tsxFiles = files.filter(f => f.endsWith('.tsx') || f.endsWith('.ts'));

let count = 0;
tsxFiles.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let originalContent = content;
  
  // Replace the specific redirect lines
  content = content.replace(/if\s*\(\s*profile\?\.role\s*!==\s*'admin'\s*\)\s*redirect\('\/unauthorized'\)/g, "if (process.env.DEVELOPMENT_MODE !== 'true' && profile?.role !== 'admin') redirect('/unauthorized')");
  content = content.replace(/if\s*\(\s*profile\?\.role\s*!==\s*'sales'\s*\)\s*redirect\('\/unauthorized'\)/g, "if (process.env.DEVELOPMENT_MODE !== 'true' && profile?.role !== 'sales') redirect('/unauthorized')");
  content = content.replace(/if\s*\(\s*profile\?\.role\s*!==\s*'vendor'\s*\)\s*redirect\('\/unauthorized'\)/g, "if (process.env.DEVELOPMENT_MODE !== 'true' && profile?.role !== 'vendor') redirect('/unauthorized')");

  if (content !== originalContent) {
    fs.writeFileSync(file, content);
    console.log(`Updated ${file}`);
    count++;
  }
});

console.log(`Updated ${count} files.`);
