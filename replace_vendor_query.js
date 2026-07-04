const fs = require('fs');
const path = require('path');

const walkSync = (dir, filelist = []) => {
  fs.readdirSync(dir).forEach(file => {
    const dirFile = path.join(dir, file);
    if (fs.statSync(dirFile).isDirectory()) {
      filelist = walkSync(dirFile, filelist);
    } else {
      filelist.push(dirFile);
    }
  });
  return filelist;
};

const dirs = [
  path.join(__dirname, 'app', '(dashboard)', 'vendor'),
  path.join(__dirname, 'app', '(dashboard)', 'dashboard', 'vendor')
];

let files = [];
dirs.forEach(d => {
  if (fs.existsSync(d)) {
    files = files.concat(walkSync(d));
  }
});

const tsxFiles = files.filter(f => f.endsWith('.tsx') || f.endsWith('.ts'));

let count = 0;
tsxFiles.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let originalContent = content;

  // Regex to match: const { data: vendor } = await supabase.from('vendors').select('SOMETHING').eq('user_id', (user?.id || '')).single()
  // Or similar variations
  const regex = /const\s+\{\s*data\s*:\s*vendor\s*\}\s*=\s*await\s+supabase\.from\('vendors'\)\.select\('([^']+)'\)\.eq\('user_id',\s*\(\s*user\?\.id\s*\|\|\s*''\s*\)\)\.single\(\)/g;

  content = content.replace(regex, (match, selectFields) => {
    let replacedFields = selectFields.includes('company_name') ? selectFields.replace('company_name', 'business_name') : selectFields;
    return `const { data: vendorUser } = await supabase.from('vendor_users').select('vendor_id, vendors(${replacedFields})').eq('user_id', (user?.id || '')).single();\n  const vendor = vendorUser?.vendors as any;`;
  });

  // Also replace vendor.company_name with vendor.business_name if it exists in the file
  if (content !== originalContent) {
    content = content.replace(/vendor\.company_name/g, 'vendor.business_name');
    fs.writeFileSync(file, content);
    console.log(`Updated ${file}`);
    count++;
  }
});

console.log(`Updated ${count} files.`);
