import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import SalesRequestsClient from './SalesRequestsClient'
import { DateRangeFilter } from '@/components/shared/date-range-filter'
import { applyDateFilter } from '@/lib/date-filter'
export default async function AdminSalesRequestsPage(props: { searchParams: Promise<any> }) {
  const searchParams = await props.searchParams;
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (process.env.DEVELOPMENT_MODE !== 'true' && !user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', (user?.id || '')).single()
  if (process.env.DEVELOPMENT_MODE !== 'true' && profile?.role !== 'admin') redirect('/unauthorized')

  const { data: orders } = await applyDateFilter(
    supabase
      .from('sales_requests')
      .select(`
        *,
        sales_executives:sales_executive_id (full_name, employee_code, vendor_id, vendors:vendor_id (business_name)),
        products:product_id (name)
      `)
      .eq('status', 'Pending'),
    searchParams
  ).order('created_at', { ascending: false })

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">Sales Requests</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Review, approve, and manage customer orders submitted by Sales Executives.</p>
        </div>
        <DateRangeFilter />
      </div>

      <SalesRequestsClient initialOrders={orders || []} />
    </div>
  )
}
