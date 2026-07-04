import { createClient } from '@/utils/supabase/server'
import { CommissionBoardClient } from '@/components/commission/CommissionBoardClient'
import { redirect } from 'next/navigation'

export default async function SalesExecCommissionPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: exec } = await supabase.from('sales_executives').select('id').eq('profile_id', user.id).single()
  if (!exec) redirect('/unauthorized')

  const { data: commissions } = await supabase
    .from('commissions')
    .select('*, sales_executive:sales_executives(full_name), vendor:vendors(company_name)')
    .eq('sales_executive_id', exec.id)
    .order('created_at', { ascending: false })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">My Commissions</h1>
        <p className="text-sm text-gray-500 mt-1">Track your personal earnings from completed sales.</p>
      </div>

      <CommissionBoardClient 
        initialCommissions={commissions || []} 
        userRole="sales_executive" 
      />
    </div>
  )
}
