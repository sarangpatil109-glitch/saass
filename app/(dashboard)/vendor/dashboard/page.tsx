import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { Card } from '@/components/Card'
import { Users, DollarSign, Activity, UsersRound, Building, CheckCircle2, FileArchive, PackageOpen, LayoutDashboard } from 'lucide-react'

export default async function VendorDashboardPage() {
  const supabase = await createClient()

  // Protect route
  const { data: { user } } = await supabase.auth.getUser()
  if (process.env.DEVELOPMENT_MODE !== 'true' && !user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', (user?.id || '')).single()
  if (process.env.DEVELOPMENT_MODE !== 'true' && profile?.role !== 'vendor') redirect('/unauthorized')

  const { data: vendor } = await supabase.from('vendors').select('id, company_name, status').eq('user_id', (user?.id || '')).single()
  
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

  // Fetch KPI data
  const [
    { count: totalSalesExecs },
    { count: activeSalesExecs },
    { count: pendingSalesExecs },
    { count: totalLeads },
    { count: totalCustomers },
    { count: totalOrders },
    { data: commissionData }
  ] = await Promise.all([
    supabase.from('sales_executives').select('*', { count: 'exact', head: true }).eq('vendor_id', vendorId),
    supabase.from('sales_executives').select('*', { count: 'exact', head: true }).eq('vendor_id', vendorId).eq('status', 'Active'),
    supabase.from('sales_executives').select('*', { count: 'exact', head: true }).eq('vendor_id', vendorId).eq('status', 'Pending Approval'),
    supabase.from('leads').select('*', { count: 'exact', head: true }).eq('assigned_vendor_id', vendorId),
    supabase.from('customers').select('*', { count: 'exact', head: true }).eq('vendor_id', vendorId),
    supabase.from('orders').select('*', { count: 'exact', head: true }).eq('vendor_id', vendorId),
    supabase.from('commission_transactions').select('amount, status').eq('vendor_id', vendorId).eq('recipient_type', 'vendor')
  ])

  const totalCommission = commissionData?.reduce((acc, curr) => acc + (curr.amount || 0), 0) || 0
  const pendingCommission = commissionData?.filter(c => c.status === 'Pending').reduce((acc, curr) => acc + (curr.amount || 0), 0) || 0
  const paidCommission = commissionData?.filter(c => c.status === 'Paid').reduce((acc, curr) => acc + (curr.amount || 0), 0) || 0

  const stats = [
    { name: 'Total Sales Executives', value: totalSalesExecs || 0, icon: Users, color: 'bg-blue-50 text-blue-600 dark:bg-blue-900/30' },
    { name: 'Active Sales Executives', value: activeSalesExecs || 0, icon: Users, color: 'bg-green-50 text-green-600 dark:bg-green-900/30' },
    { name: 'Pending Approvals', value: pendingSalesExecs || 0, icon: UsersRound, color: 'bg-orange-50 text-orange-600 dark:bg-orange-900/30' },
    { name: 'Total Leads', value: totalLeads || 0, icon: Activity, color: 'bg-indigo-50 text-indigo-600 dark:bg-indigo-900/30' },
    { name: 'Total Customers', value: totalCustomers || 0, icon: UsersRound, color: 'bg-cyan-50 text-cyan-600 dark:bg-cyan-900/30' },
    { name: 'Total Orders', value: totalOrders || 0, icon: PackageOpen, color: 'bg-purple-50 text-purple-600 dark:bg-purple-900/30' },
    { name: 'Pending Commission', value: `₹${pendingCommission.toFixed(2)}`, icon: DollarSign, color: 'bg-orange-50 text-orange-600 dark:bg-orange-900/30' },
    { name: 'Paid Commission', value: `₹${paidCommission.toFixed(2)}`, icon: CheckCircle2, color: 'bg-teal-50 text-teal-600 dark:bg-teal-900/30' },
  ]

  return (
    <div className="space-y-6 pb-12">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">Welcome, {vendor.company_name}</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Overview of your vendor network performance.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <Card key={stat.name} className="p-5 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 flex items-center shadow-sm">
            <div className={`p-3 rounded-xl ${stat.color} mr-4 flex-shrink-0`}>
              <stat.icon className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{stat.name}</p>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{stat.value}</h3>
            </div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-sm flex flex-col items-center justify-center min-h-[300px] text-center">
           <LayoutDashboard className="h-12 w-12 text-gray-200 dark:text-gray-700 mb-4" />
           <p className="text-gray-500 dark:text-gray-400 font-medium">Monthly Sales Trend</p>
           <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">Not enough data to display chart.</p>
        </Card>
        <Card className="p-6 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-sm flex flex-col items-center justify-center min-h-[300px] text-center">
           <Users className="h-12 w-12 text-gray-200 dark:text-gray-700 mb-4" />
           <p className="text-gray-500 dark:text-gray-400 font-medium">Top Sales Executives</p>
           <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">No active executives found.</p>
        </Card>
      </div>
    </div>
  )
}
