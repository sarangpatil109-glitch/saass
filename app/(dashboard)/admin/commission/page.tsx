import { createClient } from '@/utils/supabase/server'
import { CommissionBoardClient } from '@/components/commission/CommissionBoardClient'

export default async function AdminCommissionPage() {
  const supabase = await createClient()
  
  const { data: commissions } = await supabase
    .from('commissions')
    .select('*, sales_executive:sales_executives(full_name), vendor:vendors(company_name)')
    .order('created_at', { ascending: false })

  const { data: settings } = await supabase
    .from('commission_settings')
    .select('*')
    .limit(1)
    .single()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Commission Engine</h1>
        <p className="text-sm text-gray-500 mt-1">Manage global commission settings and view all payouts.</p>
      </div>

      <CommissionBoardClient 
        initialCommissions={commissions || []} 
        userRole="admin" 
        settings={settings || { sales_exec_percentage: 10, vendor_percentage: 10 }}
      />
    </div>
  )
}
