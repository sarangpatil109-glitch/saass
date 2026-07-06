const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function runTests() {
  console.log('--- STARTING E2E DB TESTS ---');

  // 1. Test Product Creation
  console.log('\n[1] Testing Product Creation...');
  const { data: product, error: productError } = await supabase
    .from('products')
    .insert({
      name: 'Test Product Sync',
      description: 'Testing the sync schema',
      category: 'Testing',
      is_active: true
    })
    .select()
    .single();

  if (productError) {
    console.error('❌ Product Creation Failed:', productError.message);
    return;
  }
  console.log('✅ Product Created:', product.id);

  // 2. Test Sales Request Creation
  console.log('\n[2] Testing Sales Request Creation...');
  const { data: sr, error: srError } = await supabase
    .from('sales_requests')
    .insert({
      customer_name: 'Test Customer',
      customer_phone: '1234567890',
      customer_email: 'test@example.com',
      product_id: product.id,
      product_price: 1500,
      status: 'Pending'
    })
    .select()
    .single();

  if (srError) {
    console.error('❌ Sales Request Creation Failed:', srError.message);
    return;
  }
  console.log('✅ Sales Request Created:', sr.id);

  // 3. Test Order & Commission Creation (Simulating Approval)
  console.log('\n[3] Testing Order Creation (Approval)...');
  const { data: order, error: orderError } = await supabase
    .from('orders')
    .insert({
      order_number: 'ORD-TEST-' + Math.floor(Math.random() * 1000000),
      sales_request_id: sr.id,
      customer_name: 'Test Customer',
      customer_phone: '1234567890',
      customer_email: 'test@example.com',
      product_id: product.id,
      product_name: product.name,
      product_price: 1500,
      status: 'Approved'
    })
    .select()
    .single();

  if (orderError) {
    console.error('❌ Order Creation Failed:', orderError.message);
    return;
  }
  console.log('✅ Order Created:', order.id);

  // 4. Cleanup Test Data
  console.log('\n[4] Cleaning up test data...');
  await supabase.from('orders').delete().eq('id', order.id);
  await supabase.from('sales_requests').delete().eq('id', sr.id);
  await supabase.from('products').delete().eq('id', product.id);
  console.log('✅ Cleanup complete.');
  
  console.log('\n🎉 ALL TESTS PASSED SUCCESSFULLY!');
}

runTests();
