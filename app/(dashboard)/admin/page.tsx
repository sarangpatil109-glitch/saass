import { createClient } from '@/utils/supabase/server'
import { Card } from '@/components/Card'
import { RevenueChart, CustomerGrowthChart } from '@/components/dashboard/DashboardCharts'
import { 
  PackageSearch, 
  Users, 
  Store, 
  Briefcase,
  IndianRupee,
  FileArchive,
  KeyRound,
  Activity,
  PlusCircle,
  Database,
  Lock,
  CreditCard,
  Settings,
  Link as LinkIcon
} from 'lucide-react'
import Link from 'next/link'
import { redirect } from 'next/navigation'

import { DateRangeFilter } from '@/components/shared/date-range-filter'
import { applyDateFilter } from '@/lib/date-filter'

export default async function DashboardPage({ searchParams }: { searchParams: { from?: string, to?: string } }) {
  const supabase = await createClient()

  // Protect route
  const { data: { user } } = await supabase.auth.getUser()
  if (process.env.DEVELOPMENT_MODE !== 'true' && !user) redirect('/login')
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', (user?.id || '')).single()
  if (process.env.DEVELOPMENT_MODE !== 'true' && profile?.role !== 'admin') redirect('/unauthorized')

  // Parallel Data Fetching
  const [
    { count: productsCount },
    { count: vendorsCount },
    { count: salesExecsCount },
    { count: customersCount },
    { count: leadsCount },
    { count: pendingZipsCount },
    { count: activeLicensesCount },
    { data: recentActivity },
    { data: rawOrders },
    { data: rawCustomers },
    { data: rawCommissions }
  ] = await Promise.all([
    applyDateFilter(supabase.from('products').select('*', { count: 'exact', head: true }), searchParams),
    applyDateFilter(supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'vendor'), searchParams),
    applyDateFilter(supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'sales_executive'), searchParams),
    applyDateFilter(supabase.from('customers').select('*', { count: 'exact', head: true }), searchParams),
    applyDateFilter(supabase.from('leads').select('*', { count: 'exact', head: true }), searchParams),
    applyDateFilter(supabase.from('zip_requests').select('*', { count: 'exact', head: true }).eq('status', 'Pending'), searchParams),
    applyDateFilter(supabase.from('licenses').select('*', { count: 'exact', head: true }).eq('status', 'Active'), searchParams),
    applyDateFilter(supabase.from('activity_logs').select('*'), searchParams).order('created_at', { ascending: false }).limit(6),
    applyDateFilter(supabase.from('orders').select('price, created_at, payment_status').eq('payment_status', 'Paid'), searchParams).order('created_at', { ascending: true }),
    applyDateFilter(supabase.from('customers').select('id, created_at, customer_name, business_name'), searchParams).order('created_at', { ascending: true }),
    applyDateFilter(supabase.from('commissions').select('amount, vendor_amount, status, sales_executives(full_name), vendors(business_name), orders(price)'), searchParams)
  ])

  // Process Revenue Logic
  const today = new Date()
  const todayRev = rawOrders?.filter(o => new Date(o.created_at).toDateString() === today.toDateString()).reduce((acc, curr) => acc + Number(curr.price), 0) || 0
  const thisMonthRev = rawOrders?.filter(o => new Date(o.created_at).getMonth() === today.getMonth() && new Date(o.created_at).getFullYear() === today.getFullYear()).reduce((acc, curr) => acc + Number(curr.price), 0) || 0

  // Monthly Revenue Chart Data
  const monthlyRevenueMap: Record<string, number> = {}
  rawOrders?.forEach(order => {
    const d = new Date(order.created_at)
    const month = d.toLocaleString('default', { month: 'short' }) + ' ' + d.getFullYear().toString().substr(-2)
    monthlyRevenueMap[month] = (monthlyRevenueMap[month] || 0) + Number(order.price)
  })
  const revenueChartData = Object.entries(monthlyRevenueMap).map(([month, revenue]) => ({ month, revenue }))

  // Monthly Customer Growth Data
  const monthlyCustomerMap: Record<string, number> = {}
  rawCustomers?.forEach(customer => {
    const d = new Date(customer.created_at)
    const month = d.toLocaleString('default', { month: 'short' }) + ' ' + d.getFullYear().toString().substr(-2)
    monthlyCustomerMap[month] = (monthlyCustomerMap[month] || 0) + 1
  })
  const customerChartData = Object.entries(monthlyCustomerMap).map(([month, customers]) => ({ month, customers }))

  // Latest Customers (Top 5)
  const latestCustomers = rawCustomers ? [...rawCustomers].reverse().slice(0, 5) : []

  // Top Vendors Processing
  const vendorPerformance: Record<string, { name: string, total_sales: number, commission: number }> = {}
  const salesPerformance: Record<string, { name: string, total_sales: number, commission: number }> = {}
  
  rawCommissions?.forEach(comm => {
    // Sales Executive
    const exec = Array.isArray(comm.sales_executives) ? comm.sales_executives[0] : comm.sales_executives;
    const execName = exec?.full_name || 'Unknown Executive';
    if (!salesPerformance[execName]) salesPerformance[execName] = { name: execName, total_sales: 0, commission: 0 };
    salesPerformance[execName].commission += Number(comm.amount);
    salesPerformance[execName].total_sales += 1;

    // Vendor
    const vendor = Array.isArray(comm.vendors) ? comm.vendors[0] : comm.vendors;
    const vendorName = vendor?.business_name || 'Unknown Vendor';
    if (!vendorPerformance[vendorName]) vendorPerformance[vendorName] = { name: vendorName, total_sales: 0, commission: 0 };
    
    const order = Array.isArray(comm.orders) ? comm.orders[0] : comm.orders;
    const orderPrice = order?.price || 0;
    const vendorAmount = comm.vendor_amount ?? (orderPrice * 0.01);
    
    vendorPerformance[vendorName].commission += Number(vendorAmount);
    vendorPerformance[vendorName].total_sales += 1;
  })

  const topVendors = Object.values(vendorPerformance).sort((a, b) => b.commission - a.commission).slice(0, 5)
  const topSales = Object.values(salesPerformance).sort((a, b) => b.commission - a.commission).slice(0, 5)

  // Determine System Health
  const dbHealth = rawOrders !== null
  const authHealth = process.env.NEXT_PUBLIC_SUPABASE_URL !== undefined
  const cashfreeConfigured = process.env.CASHFREE_CLIENT_SECRET !== undefined
  
  const getIconForAction = (action: string) => {
    if (action.includes('Product')) return <PackageSearch className="h-4 w-4 text-purple-500" />
    if (action.includes('Vendor') || action.includes('Sales')) return <Users className="h-4 w-4 text-blue-500" />
    if (action.includes('License')) return <KeyRound className="h-4 w-4 text-green-500" />
    if (action.includes('ZIP')) return <FileArchive className="h-4 w-4 text-orange-500" />
    if (action.includes('Payment') || action.includes('Webhook')) return <IndianRupee className="h-4 w-4 text-emerald-500" />
    return <Activity className="h-4 w-4 text-gray-500" />
  }

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">Admin Dashboard</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Platform overview and key metrics.</p>
        </div>
        <DateRangeFilter />
      </div>
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-end gap-4">
        <div className="flex items-center gap-3">
          <Link href="/dashboard/products" className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors shadow-sm">
            <PlusCircle className="h-4 w-4 mr-2" /> Add Product
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
        <Card className="p-4 bg-white dark:bg-gray-900 shadow-sm border border-gray-100 dark:border-gray-800 transition-all hover:shadow-md">
          <div className="flex items-center justify-between mb-2"><span className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Revenue</span><IndianRupee className="h-4 w-4 text-green-500" /></div>
          <span className="text-2xl font-bold text-gray-900 dark:text-white">₹{thisMonthRev.toLocaleString()}</span>
          <div className="text-xs text-green-600 mt-1 bg-green-50 dark:bg-green-900/20 inline-block px-1.5 py-0.5 rounded font-medium">This Month</div>
        </Card>
        <Card className="p-4 bg-white dark:bg-gray-900 shadow-sm border border-gray-100 dark:border-gray-800 transition-all hover:shadow-md">
          <div className="flex items-center justify-between mb-2"><span className="text-sm font-medium text-gray-500 dark:text-gray-400">Today's Sales</span><IndianRupee className="h-4 w-4 text-blue-500" /></div>
          <span className="text-2xl font-bold text-gray-900 dark:text-white">₹{todayRev.toLocaleString()}</span>
        </Card>
        <Card className="p-4 bg-white dark:bg-gray-900 shadow-sm border border-gray-100 dark:border-gray-800 transition-all hover:shadow-md">
          <div className="flex items-center justify-between mb-2"><span className="text-sm font-medium text-gray-500 dark:text-gray-400">Customers</span><Users className="h-4 w-4 text-indigo-500" /></div>
          <span className="text-2xl font-bold text-gray-900 dark:text-white">{customersCount || 0}</span>
        </Card>
        <Card className="p-4 bg-white dark:bg-gray-900 shadow-sm border border-gray-100 dark:border-gray-800 transition-all hover:shadow-md">
          <div className="flex items-center justify-between mb-2"><span className="text-sm font-medium text-gray-500 dark:text-gray-400">Vendors & Execs</span><Store className="h-4 w-4 text-purple-500" /></div>
          <span className="text-2xl font-bold text-gray-900 dark:text-white">{(vendorsCount || 0) + (salesExecsCount || 0)}</span>
        </Card>
        <Card className="p-4 bg-white dark:bg-gray-900 shadow-sm border border-gray-100 dark:border-gray-800 transition-all hover:shadow-md col-span-2 md:col-span-1">
          <div className="flex items-center justify-between mb-2"><span className="text-sm font-medium text-gray-500 dark:text-gray-400">Active Licenses</span><KeyRound className="h-4 w-4 text-orange-500" /></div>
          <span className="text-2xl font-bold text-gray-900 dark:text-white">{activeLicensesCount || 0}</span>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RevenueChart data={revenueChartData} />
        <CustomerGrowthChart data={customerChartData} />
      </div>

      {/* Mid Section: Activity & Top Performers */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Recent Activity */}
        <Card className="p-6 bg-white dark:bg-gray-900 shadow-sm border border-gray-100 dark:border-gray-800 lg:col-span-1">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Recent Activity</h3>
          <div className="space-y-4">
            {recentActivity && recentActivity.length > 0 ? (
              recentActivity.map((log: any) => (
                <div key={log.id} className="flex gap-3 items-start">
                  <div className="mt-0.5 p-2 bg-gray-50 dark:bg-gray-800 rounded-full flex-shrink-0">
                    {getIconForAction(log.action)}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{log.action}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-[220px]">{log.details}</p>
                    <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-1">{new Date(log.created_at).toLocaleString()}</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-6 text-sm text-gray-500">No recent activity.</div>
            )}
          </div>
        </Card>

        {/* Top Performers */}
        <div className="space-y-6 lg:col-span-2">
          
          <Card className="overflow-hidden bg-white dark:bg-gray-900 shadow-sm border border-gray-100 dark:border-gray-800">
            <div className="p-4 border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/30">
              <h3 className="font-bold text-gray-900 dark:text-white">Top Vendors</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-gray-500 dark:text-gray-400 uppercase bg-gray-50 dark:bg-gray-900">
                  <tr><th className="px-4 py-3">Rank</th><th className="px-4 py-3">Vendor</th><th className="px-4 py-3">Sales Count</th><th className="px-4 py-3 text-right">Commission Earned</th></tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {topVendors.length > 0 ? topVendors.map((v, i) => (
                    <tr key={v.name} className="bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                      <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">#{i + 1}</td>
                      <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">{v.name}</td>
                      <td className="px-4 py-3 text-gray-500 dark:text-gray-400">{v.total_sales}</td>
                      <td className="px-4 py-3 text-right font-medium text-green-600 dark:text-green-400">₹{v.commission.toLocaleString()}</td>
                    </tr>
                  )) : <tr><td colSpan={4} className="px-4 py-8 text-center text-gray-500">No vendor data yet.</td></tr>}
                </tbody>
              </table>
            </div>
          </Card>

          <Card className="overflow-hidden bg-white dark:bg-gray-900 shadow-sm border border-gray-100 dark:border-gray-800">
            <div className="p-4 border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/30">
              <h3 className="font-bold text-gray-900 dark:text-white">Top Sales Executives</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-gray-500 dark:text-gray-400 uppercase bg-gray-50 dark:bg-gray-900">
                  <tr><th className="px-4 py-3">Rank</th><th className="px-4 py-3">Sales Executive</th><th className="px-4 py-3">Sales Count</th><th className="px-4 py-3 text-right">Commission Earned</th></tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {topSales.length > 0 ? topSales.map((v, i) => (
                    <tr key={v.name} className="bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                      <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">#{i + 1}</td>
                      <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">{v.name}</td>
                      <td className="px-4 py-3 text-gray-500 dark:text-gray-400">{v.total_sales}</td>
                      <td className="px-4 py-3 text-right font-medium text-green-600 dark:text-green-400">₹{v.commission.toLocaleString()}</td>
                    </tr>
                  )) : <tr><td colSpan={4} className="px-4 py-8 text-center text-gray-500">No sales executive data yet.</td></tr>}
                </tbody>
              </table>
            </div>
          </Card>

          <Card className="overflow-hidden bg-white dark:bg-gray-900 shadow-sm border border-gray-100 dark:border-gray-800">
            <div className="p-4 border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/30">
              <h3 className="font-bold text-gray-900 dark:text-white">Latest Customers</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-gray-500 dark:text-gray-400 uppercase bg-gray-50 dark:bg-gray-900">
                  <tr><th className="px-4 py-3">Business Name</th><th className="px-4 py-3">Owner</th><th className="px-4 py-3 text-right">Joined</th></tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {latestCustomers.length > 0 ? latestCustomers.map((c: any) => {
                    return (
                      <tr key={c.id} className="bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                        <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">{c.business_name}</td>
                        <td className="px-4 py-3 text-gray-500 dark:text-gray-400">{c.customer_name || 'System'}</td>
                        <td className="px-4 py-3 text-right text-gray-500 dark:text-gray-400">{new Date(c.created_at).toLocaleDateString()}</td>
                      </tr>
                    )
                  }) : <tr><td colSpan={3} className="px-4 py-8 text-center text-gray-500">No customers acquired yet.</td></tr>}
                </tbody>
              </table>
            </div>
          </Card>

        </div>
      </div>

      {/* Quick Actions & System Health */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-6 bg-white dark:bg-gray-900 shadow-sm border border-gray-100 dark:border-gray-800">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Quick Actions</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <Link href="/dashboard/products" className="flex flex-col items-center justify-center p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors group">
              <PackageSearch className="h-5 w-5 text-gray-500 dark:text-gray-400 mb-2 group-hover:text-blue-500" />
              <span className="text-xs font-medium text-gray-700 dark:text-gray-300">Add Product</span>
            </Link>
            <Link href="/dashboard/vendors" className="flex flex-col items-center justify-center p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors group">
              <Store className="h-5 w-5 text-gray-500 dark:text-gray-400 mb-2 group-hover:text-blue-500" />
              <span className="text-xs font-medium text-gray-700 dark:text-gray-300">Add Vendor</span>
            </Link>
            <Link href="/dashboard/sales-executives" className="flex flex-col items-center justify-center p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors group">
              <Briefcase className="h-5 w-5 text-gray-500 dark:text-gray-400 mb-2 group-hover:text-blue-500" />
              <span className="text-xs font-medium text-gray-700 dark:text-gray-300">Add Sales Exec</span>
            </Link>
            <Link href="/dashboard/customers" className="flex flex-col items-center justify-center p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors group">
              <Users className="h-5 w-5 text-gray-500 dark:text-gray-400 mb-2 group-hover:text-blue-500" />
              <span className="text-xs font-medium text-gray-700 dark:text-gray-300">Create Lead</span>
            </Link>
            <Link href="/admin/zips" className="flex flex-col items-center justify-center p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors group">
              <FileArchive className="h-5 w-5 text-gray-500 dark:text-gray-400 mb-2 group-hover:text-blue-500" />
              <span className="text-xs font-medium text-gray-700 dark:text-gray-300">ZIP Engine</span>
            </Link>
            <Link href="/admin/licenses" className="flex flex-col items-center justify-center p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors group">
              <KeyRound className="h-5 w-5 text-gray-500 dark:text-gray-400 mb-2 group-hover:text-blue-500" />
              <span className="text-xs font-medium text-gray-700 dark:text-gray-300">Licenses</span>
            </Link>
          </div>
        </Card>

        <Card className="p-6 bg-white dark:bg-gray-900 shadow-sm border border-gray-100 dark:border-gray-800">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">System Health</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div className="flex items-center"><Database className="h-4 w-4 text-blue-500 mr-2" /><span className="text-sm font-medium text-gray-700 dark:text-gray-300">Supabase</span></div>
              {dbHealth ? <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">Connected</span> : <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400">Error</span>}
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div className="flex items-center"><Lock className="h-4 w-4 text-purple-500 mr-2" /><span className="text-sm font-medium text-gray-700 dark:text-gray-300">Authentication</span></div>
              {authHealth ? <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">Healthy</span> : <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400">Missing Key</span>}
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div className="flex items-center"><CreditCard className="h-4 w-4 text-emerald-500 mr-2" /><span className="text-sm font-medium text-gray-700 dark:text-gray-300">Cashfree Sandbox</span></div>
              {cashfreeConfigured ? <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">Configured</span> : <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400">Missing Key</span>}
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div className="flex items-center"><LinkIcon className="h-4 w-4 text-orange-500 mr-2" /><span className="text-sm font-medium text-gray-700 dark:text-gray-300">Background Engines</span></div>
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">Ready</span>
            </div>
          </div>
        </Card>
      </div>

    </div>
  )
}
