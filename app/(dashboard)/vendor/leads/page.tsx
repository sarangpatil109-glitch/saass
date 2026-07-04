import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { KanbanBoard } from '@/components/crm/KanbanBoard'
import { LeadBoardClient } from '@/components/crm/LeadBoardClient'
import Link from 'next/link'

export default async function VendorLeadsPage({ searchParams }: { searchParams: { view?: string } }) {
  const supabase = await createClient()

  // Protect route
  const { data: { user } } = await supabase.auth.getUser()
  if (process.env.DEVELOPMENT_MODE !== 'true' && !user) redirect('/login')

  const { data: vendorUser } = await supabase.from('vendor_users').select('vendor_id, vendors(id, status)').eq('user_id', (user?.id || '')).single();
  const vendor = vendorUser?.vendors as any;
  
  if (!vendor || vendor.status !== 'Active') {
    redirect('/vendor/dashboard')
  }

  // Fetch leads belonging to this vendor
  let leadsQuery = supabase.from('leads').select(`
    *,
    sales_executives (full_name),
    vendors (company_name)
  `).is('deleted_at', null).eq('assigned_vendor_id', vendor.id).order('created_at', { ascending: false })

  const { data: leads } = await leadsQuery

  // Fetch active sales executives for this vendor for filtering
  const { data: salesExecs } = await supabase.from('sales_executives')
    .select('id, full_name')
    .eq('vendor_id', vendor.id)
    .eq('status', 'Active')

  const isList = searchParams.view === 'list'

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">Lead Pipeline</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Manage leads, track deals, and optimize conversions for your network.</p>
        </div>
        <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-800 p-1 rounded-lg">
          <Link href="/vendor/leads?view=board" className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${!isList ? 'bg-white dark:bg-gray-700 shadow-sm text-gray-900 dark:text-white' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}>Board</Link>
          <Link href="/vendor/leads?view=list" className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${isList ? 'bg-white dark:bg-gray-700 shadow-sm text-gray-900 dark:text-white' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}>List</Link>
        </div>
      </div>

      {isList ? (
        <LeadBoardClient initialLeads={leads || []} salesExecs={salesExecs || []} userRole="vendor" />
      ) : (
        <KanbanBoard leads={leads || []} />
      )}
    </div>
  )
}
