import { createClient } from '@/utils/supabase/server'
import { VendorsClient } from './VendorsClient'

export default async function VendorsPage() {
  const supabase = await createClient()
  
  // Fetch initial data
  const { data: vendors, error } = await supabase
    .from('vendors')
    .select('*')
    .order('created_at', { ascending: false })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Vendors</h1>
        <p className="text-sm text-gray-500 mt-1">Manage vendor accounts, statuses, and access codes.</p>
      </div>

      <VendorsClient initialVendors={vendors || []} />
    </div>
  )
}
