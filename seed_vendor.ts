import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://mpexmihojcysqqvmphth.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1wZXhtaWhvamN5c3Fxdm1waHRoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MzE3MTY5MywiZXhwIjoyMDk4NzQ3NjkzfQ.gzn8aKJng8Kt_ajd7a1_w4N8jXtRTTeATPgcY453RUg'
);

async function createVendor() {
  const mockUserId = '11111111-1111-1111-1111-111111111111'; // UUID format
  
  // Create profile first since vendor table might reference it
  await supabase.from('profiles').upsert({
    id: mockUserId,
    full_name: 'Mock Vendor',
    role: 'vendor',
    status: 'active'
  });

  const { data, error } = await supabase.from('vendors').upsert({
    id: mockUserId,
    business_name: 'Mock Company',
    owner_name: 'Mock Owner',
    email: 'mockvendor@example.com',
    phone: '1234567890',
    vendor_code: 'MOCK001',
    coupon_code: 'TEST-COUPON-2026',
    status: 'Active',
  }).select();

  console.log('Inserted Vendor:', data, error);
}

createVendor();
