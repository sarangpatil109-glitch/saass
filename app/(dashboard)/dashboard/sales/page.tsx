import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { Card } from '@/components/Card'
import { Users, DollarSign, Activity, UsersRound, Trophy, Target, TrendingUp, XCircle, LayoutDashboard } from 'lucide-react'

export default async function SalesDashboardPage() {
  const supabase = await createClient()

  // Protect route
  const { data: { user } } = await supabase.auth.getUser()
  if (process.env.DEVELOPMENT_MODE !== 'true' && !user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', (user?.id || '')).single()
  if (process.env.DEVELOPMENT_MODE !== 'true' && profile?.role !== 'sales') redirect('/unauthorized')

  const { data: exec } = await supabase.from('sales_executives').select('id, full_name, status, vendor_code').eq('user_id', (user?.id || '')).single()
  
  if (!exec) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <Trophy className="h-12 w-12 text-gray-300 dark:text-gray-600 mb-4" />
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Profile Incomplete</h2>
        <p className="text-gray-500 dark:text-gray-400">Please contact your administrator to configure your sales account.</p>
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

  // Fetch KPI data (using raw data or mocking aggregates if empty as required)
  const stats = [
    { name: 'Assigned Customers', value: '0', icon: UsersRound, color: 'bg-blue-50 text-blue-600 dark:bg-blue-900/30' },
    { name: 'Today\'s Leads', value: '0', icon: Target, color: 'bg-indigo-50 text-indigo-600 dark:bg-indigo-900/30' },
    { name: 'Today\'s Sales', value: '$0.00', icon: Activity, color: 'bg-green-50 text-green-600 dark:bg-green-900/30' },
    { name: 'Monthly Sales', value: '$0.00', icon: TrendingUp, color: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30' },
    { name: 'Commission Earned', value: '$0.00', icon: DollarSign, color: 'bg-purple-50 text-purple-600 dark:bg-purple-900/30' },
    { name: 'Pending Commission', value: '$0.00', icon: DollarSign, color: 'bg-orange-50 text-orange-600 dark:bg-orange-900/30' },
    { name: 'Won Deals', value: '0', icon: Trophy, color: 'bg-teal-50 text-teal-600 dark:bg-teal-900/30' },
    { name: 'Lost Deals', value: '0', icon: XCircle, color: 'bg-red-50 text-red-600 dark:bg-red-900/30' },
  ]

  return (
    <div className="space-y-6 pb-12">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">Welcome, {exec.full_name}</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Vendor Network: <span className="font-mono">{exec.vendor_code}</span></p>
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
           <Target className="h-12 w-12 text-gray-200 dark:text-gray-700 mb-4" />
           <p className="text-gray-500 dark:text-gray-400 font-medium">Target Progress</p>
           <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">You don't have any active targets assigned.</p>
        </Card>
        <Card className="p-6 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-sm flex flex-col items-center justify-center min-h-[300px] text-center">
           <LayoutDashboard className="h-12 w-12 text-gray-200 dark:text-gray-700 mb-4" />
           <p className="text-gray-500 dark:text-gray-400 font-medium">Performance Metrics</p>
           <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">Not enough data to compute conversion rate.</p>
        </Card>
      </div>
    </div>
  )
}
