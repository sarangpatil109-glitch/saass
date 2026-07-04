const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, 'supabase', 'migrations');
if (!fs.existsSync(dir)) {
  console.log("No migrations folder found.");
  process.exit(0);
}

const files = fs.readdirSync(dir).sort();
let content = '';

files.forEach(file => {
  content += `-- ==========================================\n`;
  content += `-- FILE: ${file}\n`;
  content += `-- ==========================================\n\n`;
  content += fs.readFileSync(path.join(dir, file), 'utf8');
  content += `\n\n`;
});

fs.writeFileSync(path.join(__dirname, 'all_migrations.sql'), content);
console.log(`Concatenated ${files.length} files into all_migrations.sql`);
