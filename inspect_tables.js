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

const missingTables = ['profiles', 'zip_requests', 'activity_logs', 'commission_transactions', 'generated_zips', 'delivery_history'];

files.forEach(file => {
  const content = fs.readFileSync(file, 'utf8');
  missingTables.forEach(t => {
    if (content.includes(`'${t}'`) || content.includes(`"${t}"`)) {
      console.log(`\n=== Usage of ${t} in ${file.replace(__dirname, '')} ===`);
      
      const lines = content.split('\n');
      lines.forEach((line, i) => {
        if (line.includes(`'${t}'`) || line.includes(`"${t}"`)) {
          // Context: 1 line above and 1 line below
          console.log(`L${i}: ${lines[i-1] ? lines[i-1].trim() : ''}`);
          console.log(`L${i+1}: ${line.trim()}`);
          console.log(`L${i+2}: ${lines[i+1] ? lines[i+1].trim() : ''}\n`);
        }
      });
    }
  });
});
