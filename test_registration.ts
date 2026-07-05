import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://mpexmihojcysqqvmphth.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1wZXhtaWhvamN5c3Fxdm1waHRoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MzE3MTY5MywiZXhwIjoyMDk4NzQ3NjkzfQ.gzn8aKJng8Kt_ajd7a1_w4N8jXtRTTeATPgcY453RUg'
);

async function testCouponLogic() {
  console.log('Fetching an active vendor to test coupon validation...');
  const { data: vendor, error } = await supabase
    .from('vendors')
    .select('coupon_code, status')
    .eq('status', 'Active')
    .not('coupon_code', 'is', null)
    .limit(1)
    .single();

  if (error || !vendor) {
    console.error('No active vendor found in DB to test with.', error);
    return;
  }

  console.log('Found vendor coupon code:', vendor.coupon_code);

  const rawCoupon = vendor.coupon_code;
  
  // Mix case and spaces to test robustness
  const testCoupon = `   ${rawCoupon.toUpperCase()}   `;
  
  console.log(`Simulating submission with coupon: "${testCoupon}"`);
  
  const normalizedCouponCode = testCoupon.trim();
  console.log(`[Registration] Attempting to verify coupon code: "${normalizedCouponCode}"`);

  const { data: matchedVendor, error: vendorError } = await supabase
    .from('vendors')
    .select('id, status')
    .ilike('coupon_code', normalizedCouponCode)
    .maybeSingle();

  console.log(`[Registration] Database result for coupon "${normalizedCouponCode}":`, { matchedVendor, vendorError });

  if (vendorError || !matchedVendor) {
    console.error('FAILED: Invalid coupon code.');
    return;
  }

  if (matchedVendor.status !== 'Active') {
    console.error('FAILED: This vendor account is not active.');
    return;
  }
  
  console.log('SUCCESS: Valid coupon code successfully validated!');
}

testCouponLogic();
