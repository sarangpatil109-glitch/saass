import { createClient } from '@/utils/supabase/server'
import { ZipBoardClient } from '@/components/zip/ZipBoardClient'
import { redirect } from 'next/navigation'

export default async function AdminZipsPage() {
  const supabase = await createClient()
  
  // Ensure admin
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') redirect('/unauthorized')

  const { data: zips } = await supabase
    .from('generated_zips')
    .select('*, customer:customers(email), product:products(name), product_version:product_versions(version_string)')
    .order('created_at', { ascending: false })

  const { data: deliveries } = await supabase
    .from('delivery_history')
    .select('*, customer:customers(email), generated_zips(business_name)')
    .order('created_at', { ascending: false })

  const { data: customers } = await supabase
    .from('customers')
    .select('id, email, profiles(full_name)')
    
  const { data: products } = await supabase
    .from('products')
    .select('id, name')

  const { data: versions } = await supabase
    .from('product_versions')
    .select('id, product_id, version_string, is_current_stable')

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">ZIP Generator & Delivery</h1>
        <p className="text-sm text-gray-500 mt-1">Generate white-labeled product builds and track deliveries to customers.</p>
      </div>

      <ZipBoardClient 
        zips={zips || []} 
        deliveries={deliveries || []}
        customers={customers || []}
        products={products || []}
        versions={versions || []}
      />
    </div>
  )
}
