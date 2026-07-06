import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { DateRangeFilter } from '@/components/shared/date-range-filter'
import { applyDateFilter } from '@/lib/date-filter'
import { Card } from '@/components/Card'
import { Users, DollarSign, Activity, UsersRound, Building, CheckCircle2, FileArchive, PackageOpen, LayoutDashboard } from 'lucide-react'
import VendorDashboardClient from './VendorDashboardClient'

export default async function VendorDashboardPage(props: { searchParams: Promise<any> }) {
  const searchParams = await props.searchParams;
  const supabase = await createClient()

  // Protect route
  const { data: { user } } = await supabase.auth.getUser()
  if (process.env.DEVELOPMENT_MODE !== 'true' && !user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', (user?.id || '')).single()
  if (process.env.DEVELOPMENT_MODE !== 'true' && profile?.role !== 'vendor') redirect('/unauthorized')

  const { data: vendorUser } = await applyDateFilter(supabase.from('vendor_users').select('vendor_id, vendors(id, business_name, status)'), searchParams).eq('user_id', (user?.id || '')).single();
  const vendor = vendorUser?.vendors as any;
  
  if (!vendor) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <Building className="h-12 w-12 text-gray-300 dark:text-gray-600 mb-4" />
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Vendor Profile Incomplete</h2>
        <p className="text-gray-500 dark:text-gray-400">Please contact your administrator to configure your vendor account.</p>
      </div>
    )
  }

  if (vendor.status !== 'Active') {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <Activity className="h-12 w-12 text-orange-300 dark:text-orange-600 mb-4" />
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Account is {vendor.status}</h2>
        <p className="text-gray-500 dark:text-gray-400">Your vendor account is currently inactive. Please contact support.</p>
      </div>
    )
  }

  const vendorId = vendor.id

  const [
    { count: totalSalesExecs },
    { data: ordersData },
    { data: commissionData },
    { data: salesRequestsData },
    { data: commissionPaymentsData }
  ] = await Promise.all([
    applyDateFilter(supabase.from('sales_executives').select('*', { count: 'exact', head: true }), searchParams).eq('vendor_id', vendorId),
    applyDateFilter(supabase.from('orders').select('*, sales_executives!inner(vendor_id)'), searchParams).eq('sales_executives.vendor_id', vendorId).order('created_at', { ascending: false }),
    applyDateFilter(supabase.from('commissions').select('*, orders(price)'), searchParams).eq('vendor_id', vendorId).order('created_at', { ascending: false }),
    applyDateFilter(supabase.from('sales_requests').select('*, sales_executives!inner(vendor_id)'), searchParams).eq('sales_executives.vendor_id', vendorId).order('created_at', { ascending: false }),
    applyDateFilter(supabase.from('commission_payments').select('*'), searchParams).eq('vendor_id', vendorId).eq('payee_type', 'vendor').order('created_at', { ascending: false })
  ])

  return (
    <VendorDashboardClient 
      vendorName={vendor.business_name} 
      totalSalesExecs={totalSalesExecs || 0}
      orders={ordersData || []} 
      commissions={commissionData || []}
      commissionPayments={commissionPaymentsData || []}
      salesRequests={salesRequestsData || []}
    />
  )
}
