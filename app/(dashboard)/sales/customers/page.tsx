import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { DateRangeFilter } from '@/components/shared/date-range-filter'
import { applyDateFilter } from '@/lib/date-filter'
import SalesCustomerClient from './SalesCustomerClient'

export default async function SalesCustomersPage(props: { searchParams: Promise<any> }) {
  const searchParams = await props.searchParams;
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (process.env.DEVELOPMENT_MODE !== 'true' && !user) redirect('/login')

  const { data: exec } = await applyDateFilter(supabase.from('sales_executives').select('id, status'), searchParams).eq('id', (user?.id || '')).single()
  
  if (!exec || exec.status !== 'Active') {
    redirect('/sales/dashboard')
  }

  const { data: orders } = await supabase
    .from('sales_requests')
    .select('*, products(name)')
    .eq('sales_executive_id', exec.id)
    .order('created_at', { ascending: false })

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4"><div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">Sales Requests</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Manage your customer submissions and track approval status.</p>
        </div>
        <DateRangeFilter />
      </div>
      </div>
      
      <SalesCustomerClient initialOrders={orders || []} />
    </div>
  )
}
