import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://mpexmihojcysqqvmphth.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1wZXhtaWhvamN5c3Fxdm1waHRoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MzE3MTY5MywiZXhwIjoyMDk4NzQ3NjkzfQ.gzn8aKJng8Kt_ajd7a1_w4N8jXtRTTeATPgcY453RUg'
);

async function runMigration() {
  const queries = [
    `ALTER TABLE public.sales_executives ALTER COLUMN vendor_id DROP NOT NULL;`,
    `ALTER TABLE public.sales_executives DROP COLUMN IF EXISTS vendor_coupon_code;`,
    `ALTER TABLE public.vendors DROP COLUMN IF EXISTS coupon_code CASCADE;`,
    `ALTER TABLE public.vendors DROP COLUMN IF EXISTS coupon_discount_type CASCADE;`,
    `ALTER TABLE public.vendors DROP COLUMN IF EXISTS coupon_discount_value CASCADE;`,
    `ALTER TABLE public.vendors DROP COLUMN IF EXISTS coupon_max_uses CASCADE;`,
    `ALTER TABLE public.vendors DROP COLUMN IF EXISTS coupon_used_count CASCADE;`,
    `ALTER TABLE public.vendors DROP COLUMN IF EXISTS coupon_expiry_date CASCADE;`,
    `ALTER TABLE public.vendors DROP COLUMN IF EXISTS coupon_status CASCADE;`,
    `DROP TABLE IF EXISTS public.vendor_coupon_codes CASCADE;`
  ];

  // We can't run raw SQL directly with supabase-js unless there's an RPC.
  // Let me use pg or write it as a postgres shell command.
}

runMigration();
