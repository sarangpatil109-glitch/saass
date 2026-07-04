import { createClient } from '@/utils/supabase/server'
import { LeadBoardClient } from '@/components/crm/LeadBoardClient'
import { redirect } from 'next/navigation'

export default async function VendorLeadsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Get Vendor ID
  const { data: vendor } = await supabase.from('vendors').select('id').eq('profile_id', user.id).single()
  if (!vendor) redirect('/unauthorized')

  // Vendor sees leads where vendor_id = vendor.id
  const { data: leads } = await supabase
    .from('leads')
    .select('*, sales_executive:sales_executives(full_name)')
    .eq('vendor_id', vendor.id)
    .order('created_at', { ascending: false })

  const { data: salesExecs } = await supabase
    .from('sales_executives')
    .select('id, full_name')
    .eq('vendor_id', vendor.id)
    .eq('status', 'active')

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Lead CRM</h1>
        <p className="text-sm text-gray-500 mt-1">Manage leads across your sales team.</p>
      </div>

      <LeadBoardClient 
        initialLeads={leads || []} 
        salesExecs={salesExecs || []} 
        userRole="vendor" 
      />
    </div>
  )
}
