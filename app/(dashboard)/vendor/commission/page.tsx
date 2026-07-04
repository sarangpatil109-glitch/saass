import { createClient } from '@/utils/supabase/server'
import { CommissionBoardClient } from '@/components/commission/CommissionBoardClient'
import { redirect } from 'next/navigation'

export default async function VendorCommissionPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: vendor } = await supabase.from('vendors').select('id').eq('profile_id', user.id).single()
  if (!vendor) redirect('/unauthorized')

  const { data: commissions } = await supabase
    .from('commissions')
    .select('*, sales_executive:sales_executives(full_name), vendor:vendors(company_name)')
    .eq('vendor_id', vendor.id)
    .order('created_at', { ascending: false })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Vendor Earnings</h1>
        <p className="text-sm text-gray-500 mt-1">Track your commissions from your linked Sales Executives.</p>
      </div>

      <CommissionBoardClient 
        initialCommissions={commissions || []} 
        userRole="vendor" 
      />
    </div>
  )
}
