import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { KanbanBoard } from '@/components/crm/KanbanBoard'
import { LeadBoardClient } from '@/components/crm/LeadBoardClient'
import { Button } from '@/components/Button'
import { PlusCircle } from 'lucide-react'
import Link from 'next/link'

export default async function LeadsPage({ searchParams }: { searchParams: { view?: string } }) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (process.env.DEVELOPMENT_MODE !== 'true' && !user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', (user?.id || '')).single()
  
  let leadsQuery = supabase.from('leads').select(`
    *,
    sales_executives (full_name),
    vendors (company_name)
  `).is('deleted_at', null).order('created_at', { ascending: false })

  if (profile?.role === 'vendor') {
    const { data: vendorRec } = await supabase.from('vendors').select('id').eq('user_id', (user?.id || '')).single()
    if (vendorRec) {
      leadsQuery = leadsQuery.eq('assigned_vendor_id', vendorRec.id)
    }
  } else if (profile?.role === 'sales') {
    const { data: execRec } = await supabase.from('sales_executives').select('id').eq('user_id', (user?.id || '')).single()
    if (execRec) {
      leadsQuery = leadsQuery.eq('assigned_sales_executive_id', execRec.id)
    }
  }

  const { data: leads } = await leadsQuery

  const { data: salesExecs } = await supabase.from('sales_executives').select('id, full_name').eq('status', 'Active')

  const isList = searchParams.view === 'list'

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">Lead Pipeline</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Manage leads, track deals, and optimize conversions.</p>
        </div>
        <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-800 p-1 rounded-lg">
          <Link href="/dashboard/leads?view=board" className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${!isList ? 'bg-white dark:bg-gray-700 shadow-sm text-gray-900 dark:text-white' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}>Board</Link>
          <Link href="/dashboard/leads?view=list" className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${isList ? 'bg-white dark:bg-gray-700 shadow-sm text-gray-900 dark:text-white' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}>List</Link>
        </div>
      </div>

      {isList ? (
        <LeadBoardClient initialLeads={leads || []} salesExecs={salesExecs || []} userRole={profile?.role as any || 'admin'} />
      ) : (
        <KanbanBoard leads={leads || []} />
      )}
    </div>
  )
}
