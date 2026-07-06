import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import CommissionsClient from './CommissionsClient'
import { DateRangeFilter } from '@/components/shared/date-range-filter'
import { applyDateFilter } from '@/lib/date-filter'
export default async function AdminCommissionsPage(props: { searchParams: Promise<any> }) {
  const searchParams = await props.searchParams;
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (process.env.DEVELOPMENT_MODE !== 'true' && !user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', (user?.id || '')).single()
  if (process.env.DEVELOPMENT_MODE !== 'true' && profile?.role !== 'admin') redirect('/unauthorized')

  const { data: commissions } = await applyDateFilter(
    supabase
      .from('commissions')
      .select(`
        *,
        orders (order_number, product_name),
        sales_executives:sales_exec_id (full_name),
        vendors:vendor_id (business_name)
      `),
    searchParams
  ).order('created_at', { ascending: false })

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">Commission Management</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Manage vendor and sales executive commissions.</p>
        </div>
        <DateRangeFilter />
      </div>

      <CommissionsClient initialCommissions={commissions || []} />
    </div>
  )
}
