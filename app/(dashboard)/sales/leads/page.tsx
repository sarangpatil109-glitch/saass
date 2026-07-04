import { createClient } from '@/utils/supabase/server'
import { LeadBoardClient } from '@/components/crm/LeadBoardClient'
import { redirect } from 'next/navigation'

export default async function SalesLeadsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Get Sales Exec ID
  const { data: exec } = await supabase.from('sales_executives').select('id, full_name').eq('profile_id', user.id).single()
  if (!exec) redirect('/unauthorized')

  // Exec sees leads where sales_executive_id = exec.id
  const { data: leads } = await supabase
    .from('leads')
    .select('*')
    .eq('sales_executive_id', exec.id)
    .order('created_at', { ascending: false })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">My Leads</h1>
        <p className="text-sm text-gray-500 mt-1">Manage your personal sales pipeline.</p>
      </div>

      <LeadBoardClient 
        initialLeads={leads || []} 
        salesExecs={[{id: exec.id, full_name: exec.full_name}]} 
        userRole="sales_executive" 
      />
    </div>
  )
}
