import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { DateRangeFilter } from '@/components/shared/date-range-filter'
import { applyDateFilter } from '@/lib/date-filter'
import { Card } from '@/components/Card'
import { Users, DollarSign, Activity, UsersRound, Trophy, Target, TrendingUp, XCircle, LayoutDashboard } from 'lucide-react'
import SalesDashboardClient from './SalesDashboardClient'

export default async function SalesDashboardPage(props: { searchParams: Promise<any> }) {
  const searchParams = await props.searchParams;
  const supabase = await createClient()

  // Protect route
  const { data: { user } } = await supabase.auth.getUser()
  if (process.env.DEVELOPMENT_MODE !== 'true' && !user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', (user?.id || '')).single()
  if (process.env.DEVELOPMENT_MODE !== 'true' && profile?.role !== 'sales_executive') redirect('/unauthorized')

  const { data: exec } = await applyDateFilter(supabase.from('sales_executives').select('id, full_name, status, vendor_code, vendor_name, vendor_id, target_amount, monthly_target'), searchParams).eq('id', (user?.id || '')).single()

  if (!exec) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <Trophy className="h-12 w-12 text-gray-300 dark:text-gray-600 mb-4" />
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Profile Incomplete</h2>
        <p className="text-gray-500 dark:text-gray-400">Please contact your administrator to configure your sales account.</p>
      </div>
    )
  }

  if (!exec.vendor_id) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <Users className="h-12 w-12 text-blue-300 dark:text-blue-600 mb-4" />
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Awaiting Vendor Assignment</h2>
        <p className="text-gray-500 dark:text-gray-400">Waiting for admin to assign you to a vendor.</p>
      </div>
    )
  }

  if (exec.status !== 'Active') {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <Activity className="h-12 w-12 text-orange-300 dark:text-orange-600 mb-4" />
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Account is {exec.status}</h2>
        <p className="text-gray-500 dark:text-gray-400">Your sales account is currently inactive. Please contact support.</p>
      </div>
    )
  }

  const execId = exec.id

  const [
    { data: ordersData },
    { data: commissionData },
    { data: salesRequestsData },
    { data: commissionPaymentsData }
  ] = await Promise.all([
    applyDateFilter(supabase.from('orders').select('*'), searchParams).eq('sales_exec_id', execId).order('created_at', { ascending: false }),
    applyDateFilter(supabase.from('commissions').select('*'), searchParams).eq('sales_exec_id', execId).order('created_at', { ascending: false }),
    applyDateFilter(supabase.from('sales_requests').select('*'), searchParams).eq('sales_executive_id', execId).order('created_at', { ascending: false }),
    applyDateFilter(supabase.from('commission_payments').select('*'), searchParams).eq('sales_exec_id', execId).eq('payee_type', 'sales_executive').order('created_at', { ascending: false })
  ])

  return (
    <SalesDashboardClient 
      execName={(exec.full_name || '').split(' ')[0] || 'Executive'} 
      vendorName={exec.vendor_name}
      orders={ordersData || []} 
      commissions={commissionData || []}
      commissionPayments={commissionPaymentsData || []}
      salesRequests={salesRequestsData || []}
    />
  )
}
