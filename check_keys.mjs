import pkg from '@next/env';
const { loadEnvConfig } = pkg;
import { createClient } from '@supabase/supabase-js';

const projectDir = process.cwd();
loadEnvConfig(projectDir);

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function check() {
  const { data: v } = await supabase.from('vendors').select('*').limit(1);
  const { data: s } = await supabase.from('sales_executives').select('*').limit(1);
  console.log('Vendors:', Object.keys(v?.[0] || {}));
  console.log('Sales Execs:', Object.keys(s?.[0] || {}));
}

check();
