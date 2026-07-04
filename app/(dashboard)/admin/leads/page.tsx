import { createClient } from '@/utils/supabase/server'
import { LeadBoardClient } from '@/components/crm/LeadBoardClient'

export default async function AdminLeadsPage() {
  const supabase = await createClient()
  
  // Admin sees all leads
  const { data: leads } = await supabase
    .from('leads')
    .select('*, sales_executive:sales_executives(full_name), vendor:vendors(company_name)')
    .order('created_at', { ascending: false })

  const { data: salesExecs } = await supabase
    .from('sales_executives')
    .select('id, full_name')
    .eq('status', 'active')

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Lead CRM (Admin)</h1>
        <p className="text-sm text-gray-500 mt-1">Manage all leads across the entire platform.</p>
      </div>

      <LeadBoardClient 
        initialLeads={leads || []} 
        salesExecs={salesExecs || []} 
        userRole="admin" 
      />
    </div>
  )
}
