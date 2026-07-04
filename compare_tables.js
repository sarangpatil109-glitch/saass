const fs = require('fs');

const sql = fs.readFileSync('all_migrations.sql', 'utf8');
const tablesFound = new Set();
const regex = /CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?(?:public\.)?([a-zA-Z0-9_]+)/g;
let match;
while ((match = regex.exec(sql)) !== null) {
  tablesFound.add(match[1].toLowerCase());
}

const requiredTables = [
'profiles', 'orders', 'license_policies', 'licenses', 'license_devices', 
'license_activity_logs', 'product_templates', 'products', 'customers', 
'leads', 'zip_requests', 'activity_logs', 'commissions', 'commission_settings', 
'zip_generations', 'commission_payouts', 'followups', 'vendors', 'sales_executives', 
'lead_timeline', 'lead_followups', 'lead_notes', 'commission_wallets', 
'commission_ledger', 'sales_activity_logs', 'sales_targets', 'tasks', 
'vendor_users', 'vendor_activity_logs', 'vendor_coupon_codes', 'vendor_products', 
'product_versions', 'product_activity_logs', 'commission_transactions', 
'commission_activity_logs', 'crm_activity_logs', 'zip_activity_logs', 
'product_instances', 'zip_downloads', 'invoices', 'payments', 'refund_history', 
'generated_zips', 'delivery_history', 'license_activations', 'payment_webhooks', 
'payment_timeline', 'payment_logs'
];

const missing = requiredTables.filter(t => !tablesFound.has(t));
const extra = Array.from(tablesFound).filter(t => !requiredTables.includes(t));

console.log(`Tables in SQL: ${tablesFound.size}`);
console.log(`Missing Tables (in React but not in SQL):`);
console.log(missing);

console.log(`Extra Tables (in SQL but not explicitly found in .from()):`);
console.log(extra);
