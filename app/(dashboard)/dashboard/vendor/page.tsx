import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { DateRangeFilter } from '@/components/shared/date-range-filter'
import { applyDateFilter } from '@/lib/date-filter'
import { Card } from '@/components/Card'
import { Users, DollarSign, Activity, UsersRound, Building, CheckCircle2, FileArchive, PackageOpen, LayoutDashboard } from 'lucide-react'

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

  // Fetch KPI data (using raw data or mocking aggregates if empty)
  // For Team Management, they will have their own route, but we show summaries here.
  const stats = [
    { name: 'Total Sales Executives', value: '0', icon: Users, color: 'bg-blue-50 text-blue-600 dark:bg-blue-900/30' },
    { name: 'Total Customers', value: '0', icon: UsersRound, color: 'bg-indigo-50 text-indigo-600 dark:bg-indigo-900/30' },
    { name: 'Total Sales', value: '$0.00', icon: DollarSign, color: 'bg-green-50 text-green-600 dark:bg-green-900/30' },
    { name: 'Today\'s Sales', value: '$0.00', icon: Activity, color: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30' },
    { name: 'Pending Commission', value: '$0.00', icon: DollarSign, color: 'bg-orange-50 text-orange-600 dark:bg-orange-900/30' },
    { name: 'Paid Commission', value: '$0.00', icon: CheckCircle2, color: 'bg-teal-50 text-teal-600 dark:bg-teal-900/30' },
    { name: 'Generated ZIPs', value: '0', icon: FileArchive, color: 'bg-purple-50 text-purple-600 dark:bg-purple-900/30' },
    { name: 'Active Licenses', value: '0', icon: PackageOpen, color: 'bg-cyan-50 text-cyan-600 dark:bg-cyan-900/30' },
  ]

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4"><div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">Welcome, {vendor.business_name}</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Overview of your vendor network performance.</p>
      </div>
        <DateRangeFilter />
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
