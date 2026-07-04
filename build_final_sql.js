const fs = require('fs');

let finalSQL = `-- ==========================================\n`;
finalSQL += `-- COMPLETE INITIALIZATION SCHEMA\n`;
finalSQL += `-- ==========================================\n\n`;

// 1. Base Migrations
finalSQL += `-- 1. BASE MIGRATIONS\n\n`;
finalSQL += fs.readFileSync('all_migrations.sql', 'utf8');
finalSQL += `\n\n`;

// 2. Vendor Schema Fix
finalSQL += `-- 2. VENDOR SCHEMA FIX\n\n`;
const vendorFixPath = 'C:\\Users\\Admin\\.gemini\\antigravity\\brain\\d496a898-d190-4f70-98eb-cdf16699fda3\\vendor_schema_fix.sql';
if (fs.existsSync(vendorFixPath)) {
  finalSQL += fs.readFileSync(vendorFixPath, 'utf8');
} else {
  console.log("WARNING: vendor_schema_fix.sql not found!");
}
finalSQL += `\n\n`;

// 3. Missing Tables
finalSQL += `-- 3. MISSING TABLES\n\n`;
finalSQL += `
CREATE TABLE IF NOT EXISTS public.zip_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vendor_id UUID REFERENCES public.vendors(id) ON DELETE CASCADE,
    product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
    status TEXT DEFAULT 'Pending',
    requested_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);
ALTER TABLE public.zip_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable all access for admin users on zip_requests" ON public.zip_requests FOR ALL TO authenticated USING (true);

CREATE TABLE IF NOT EXISTS public.commission_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vendor_id UUID REFERENCES public.vendors(id) ON DELETE CASCADE,
    sales_executive_id UUID REFERENCES public.sales_executives(id) ON DELETE CASCADE,
    order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
    amount NUMERIC DEFAULT 0,
    status TEXT DEFAULT 'Pending',
    recipient_type TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.commission_transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable all access for admin users on commission_transactions" ON public.commission_transactions FOR ALL TO authenticated USING (true);
`;

fs.writeFileSync('00_init_schema_full.sql', finalSQL);
console.log("Created 00_init_schema_full.sql successfully.");
