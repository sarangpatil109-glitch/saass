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

  const { data: exec } = await supabase.from('sales_executives').select('id, full_name, status, vendor_code, target_amount, monthly_target').eq('user_id', (user?.id || '')).single()
  
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

  const execId = exec.id

  const today = new Date().toISOString().split('T')[0]
  const currentMonth = new Date().getMonth()
  const currentYear = new Date().getFullYear()

  const [
    { data: leadsData },
    { count: totalCustomers },
    { data: ordersData },
    { data: commissionData }
  ] = await Promise.all([
    supabase.from('leads').select('id, created_at, lead_status, expected_value').eq('assigned_sales_executive_id', execId),
    supabase.from('customers').select('*', { count: 'exact', head: true }).eq('sales_executive_id', execId),
    supabase.from('orders').select('id, final_amount, payment_status, created_at').eq('sales_executive_id', execId),
    supabase.from('commission_transactions').select('amount, status').eq('sales_executive_id', execId).eq('recipient_type', 'sales_executive')
  ])

  const allLeads = leadsData || []
  const todayLeads = allLeads.filter(l => l.created_at.startsWith(today)).length
  const wonLeads = allLeads.filter(l => l.lead_status === 'Won').length
  const lostLeads = allLeads.filter(l => l.lead_status === 'Lost').length
  const totalLeads = allLeads.length
  const conversionRate = totalLeads > 0 ? ((wonLeads / totalLeads) * 100).toFixed(1) : '0.0'

  const allOrders = ordersData || []
  const todaySales = allOrders.filter(o => o.created_at.startsWith(today) && o.payment_status === 'Success').reduce((acc, curr) => acc + Number(curr.final_amount), 0)
  const monthlySales = allOrders.filter(o => {
    const d = new Date(o.created_at)
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear && o.payment_status === 'Success'
  }).reduce((acc, curr) => acc + Number(curr.final_amount), 0)

  const allCommissions = commissionData || []
  const earnedCommission = allCommissions.filter(c => c.status === 'Paid').reduce((acc, curr) => acc + Number(curr.amount), 0)
  const pendingCommission = allCommissions.filter(c => c.status === 'Pending').reduce((acc, curr) => acc + Number(curr.amount), 0)

  // Calculate Target Progress
  const targetAmount = exec.target_amount || exec.monthly_target || 0
  const progressPercent = targetAmount > 0 ? Math.min((monthlySales / targetAmount) * 100, 100) : 0

  // Fetch KPI data
  const stats = [
    { name: 'Assigned Customers', value: totalCustomers || 0, icon: UsersRound, color: 'bg-blue-50 text-blue-600 dark:bg-blue-900/30' },
    { name: 'Today\'s Leads', value: todayLeads, icon: Target, color: 'bg-indigo-50 text-indigo-600 dark:bg-indigo-900/30' },
    { name: 'Today\'s Sales', value: `₹${todaySales.toFixed(2)}`, icon: Activity, color: 'bg-green-50 text-green-600 dark:bg-green-900/30' },
    { name: 'Monthly Sales', value: `₹${monthlySales.toFixed(2)}`, icon: TrendingUp, color: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30' },
    { name: 'Commission Earned', value: `₹${earnedCommission.toFixed(2)}`, icon: DollarSign, color: 'bg-purple-50 text-purple-600 dark:bg-purple-900/30' },
    { name: 'Pending Commission', value: `₹${pendingCommission.toFixed(2)}`, icon: DollarSign, color: 'bg-orange-50 text-orange-600 dark:bg-orange-900/30' },
    { name: 'Won Deals', value: wonLeads, icon: Trophy, color: 'bg-teal-50 text-teal-600 dark:bg-teal-900/30' },
    { name: 'Lost Deals', value: lostLeads, icon: XCircle, color: 'bg-red-50 text-red-600 dark:bg-red-900/30' },
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
        <Card className="p-6 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-sm flex flex-col justify-center min-h-[300px]">
           <div className="flex items-center gap-3 mb-6">
             <Target className="h-8 w-8 text-blue-500" />
             <div>
               <h3 className="text-lg font-bold text-gray-900 dark:text-white">Monthly Target</h3>
               <p className="text-sm text-gray-500 dark:text-gray-400">Track your sales performance</p>
             </div>
           </div>
           
           {targetAmount > 0 ? (
             <div className="space-y-4">
               <div className="flex justify-between items-end">
                 <div>
                   <p className="text-sm font-medium text-gray-500 mb-1">Achieved</p>
                   <p className="text-3xl font-bold text-gray-900 dark:text-white">₹{monthlySales.toLocaleString(undefined, {minimumFractionDigits: 2})}</p>
                 </div>
                 <div className="text-right">
                   <p className="text-sm font-medium text-gray-500 mb-1">Target</p>
                   <p className="text-xl font-bold text-gray-400">₹{targetAmount.toLocaleString(undefined, {minimumFractionDigits: 2})}</p>
                 </div>
               </div>
               
               <div className="relative pt-1">
                 <div className="flex mb-2 items-center justify-between">
                   <div>
                     <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-blue-600 bg-blue-100">
                       Progress
                     </span>
                   </div>
                   <div className="text-right">
                     <span className="text-xs font-semibold inline-block text-blue-600">
                       {progressPercent.toFixed(1)}%
                     </span>
                   </div>
                 </div>
                 <div className="overflow-hidden h-3 mb-4 text-xs flex rounded-full bg-blue-50 dark:bg-blue-900/30">
                   <div style={{ width: `${progressPercent}%` }} className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-blue-500 transition-all duration-1000"></div>
                 </div>
               </div>
             </div>
           ) : (
             <div className="text-center py-8">
               <p className="text-gray-500 dark:text-gray-400 font-medium">No Target Assigned</p>
               <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">You don't have any active targets assigned.</p>
             </div>
           )}
        </Card>
        
        <Card className="p-6 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-sm flex flex-col justify-center min-h-[300px]">
           <div className="flex items-center gap-3 mb-6">
             <LayoutDashboard className="h-8 w-8 text-purple-500" />
             <div>
               <h3 className="text-lg font-bold text-gray-900 dark:text-white">Performance Metrics</h3>
               <p className="text-sm text-gray-500 dark:text-gray-400">Your deal conversion overview</p>
             </div>
           </div>
           
           <div className="grid grid-cols-2 gap-4">
             <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50 text-center">
               <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Conversion Rate</p>
               <p className="text-3xl font-bold text-gray-900 dark:text-white">{conversionRate}%</p>
             </div>
             <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50 text-center">
               <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Total Leads</p>
               <p className="text-3xl font-bold text-gray-900 dark:text-white">{totalLeads}</p>
             </div>
             <div className="p-4 rounded-xl bg-green-50 dark:bg-green-900/10 text-center">
               <p className="text-sm text-green-600 dark:text-green-400 mb-1">Won</p>
               <p className="text-2xl font-bold text-green-700 dark:text-green-500">{wonLeads}</p>
             </div>
             <div className="p-4 rounded-xl bg-red-50 dark:bg-red-900/10 text-center">
               <p className="text-sm text-red-600 dark:text-red-400 mb-1">Lost</p>
               <p className="text-2xl font-bold text-red-700 dark:text-red-500">{lostLeads}</p>
             </div>
           </div>
        </Card>
      </div>
    </div>
  )
}
