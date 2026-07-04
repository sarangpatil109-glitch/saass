import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { KanbanBoard } from '@/components/crm/KanbanBoard'
import { LeadBoardClient } from '@/components/crm/LeadBoardClient'
import Link from 'next/link'

export default async function SalesLeadsPage({ searchParams }: { searchParams: { view?: string } }) {
  const supabase = await createClient()

  // Protect route
  const { data: { user } } = await supabase.auth.getUser()
  if (process.env.DEVELOPMENT_MODE !== 'true' && !user) redirect('/login')

  const { data: exec } = await supabase.from('sales_executives').select('id, status').eq('user_id', (user?.id || '')).single()
  
  if (!exec || exec.status !== 'Active') {
    redirect('/sales/dashboard')
  }

  // Fetch leads belonging to this sales executive
  let leadsQuery = supabase.from('leads').select(`
    *,
    vendors (business_name)
  `).is('deleted_at', null).eq('assigned_sales_executive_id', exec.id).order('created_at', { ascending: false })

  const { data: leads } = await leadsQuery

  const isList = searchParams.view === 'list'

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">My Leads</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Manage your assigned leads and track your pipeline.</p>
        </div>
        <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-800 p-1 rounded-lg">
          <Link href="/sales/leads?view=board" className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${!isList ? 'bg-white dark:bg-gray-700 shadow-sm text-gray-900 dark:text-white' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}>Board</Link>
          <Link href="/sales/leads?view=list" className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${isList ? 'bg-white dark:bg-gray-700 shadow-sm text-gray-900 dark:text-white' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}>List</Link>
        </div>
      </div>

      {isList ? (
        <LeadBoardClient initialLeads={leads || []} salesExecs={[]} userRole="sales_executive" />
      ) : (
        <KanbanBoard leads={leads || []} />
      )}
    </div>
  )
}
