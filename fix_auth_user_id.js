const fs = require('fs');
const path = require('path');

const files = [
  'app/(dashboard)/dashboard/leads/page.tsx',
  'app/(dashboard)/dashboard/sales/commission/page.tsx',
  'app/(dashboard)/dashboard/sales/page.tsx',
  'app/(dashboard)/dashboard/sales/profile/page.tsx',
  'app/(dashboard)/sales/commission/page.tsx',
  'app/(dashboard)/sales/customers/page.tsx',
  'app/(dashboard)/sales/dashboard/page.tsx',
  'app/(dashboard)/sales/followups/page.tsx',
  'app/(dashboard)/sales/leads/page.tsx',
  'app/(dashboard)/sales/orders/page.tsx',
  'app/(dashboard)/sales/profile/page.tsx',
  'app/(dashboard)/sales/settings/page.tsx',
  'app/actions/sales.ts',
  'app/actions/register.ts'
];

for (const file of files) {
  const filePath = path.join(__dirname, file);
  if (fs.existsSync(filePath)) {
    let content = fs.readFileSync(filePath, 'utf8');
    content = content.replace(/\.eq\('auth_user_id'/g, ".eq('id'");
    content = content.replace(/auth_user_id: userId/g, "id: userId");
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('Updated', file);
  } else {
    console.log('Not found', file);
  }
}
