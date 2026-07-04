import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { Card } from '@/components/Card'
import { TrendingUp, IndianRupee, ShoppingCart, Users } from 'lucide-react'

export default async function VendorReportsPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (process.env.DEVELOPMENT_MODE !== 'true' && !user) redirect('/login')

  const { data: vendorUser } = await supabase.from('vendor_users').select('vendor_id, vendors(id, status)').eq('user_id', (user?.id || '')).single();
  const vendor = vendorUser?.vendors as any;
  
  if (!vendor || vendor.status !== 'Active') {
    redirect('/vendor/dashboard')
  }

  // Revenue by product
  const { data: orders } = await supabase
    .from('orders')
    .select('final_amount, payment_status, created_at, products (name), customers (business_name)')
    .eq('vendor_id', vendor.id)
    .eq('payment_status', 'Success')
    .order('created_at', { ascending: false })

  const allOrders = orders || []
  const totalRevenue  = allOrders.reduce((s, o) => s + Number(o.final_amount), 0)

  const now   = new Date()
  const month = now.getMonth()
  const year  = now.getFullYear()

  const monthlyRevenue = allOrders
    .filter(o => {
      const d = new Date(o.created_at)
      return d.getMonth() === month && d.getFullYear() === year
    })
    .reduce((s, o) => s + Number(o.final_amount), 0)

  // Product revenue breakdown
  const productRevMap: Record<string, number> = {}
  allOrders.forEach(o => {
    const prod = Array.isArray(o.products) ? o.products[0] : (o.products as any)
    const name = prod?.name || 'Unknown'
    productRevMap[name] = (productRevMap[name] || 0) + Number(o.final_amount)
  })

  // Commission summary
  const { data: commissions } = await supabase
    .from('commission_transactions')
    .select('amount, status')
    .eq('vendor_id', vendor.id)
    .eq('recipient_type', 'vendor')
    
  const totalCommission = (commissions || []).reduce((s, c) => s + Number(c.amount), 0)
  const pendingCommission = (commissions || [])
    .filter(c => c.status === 'Pending')
    .reduce((s, c) => s + Number(c.amount), 0)

  return (
    <div className="space-y-6 pb-12">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">Reports</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Revenue, commission, and activity reports for your network.</p>
      </div>

      {/* KPI Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-5 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <IndianRupee className="h-5 w-5 text-green-500" />
            <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Network Revenue</span>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">₹{totalRevenue.toFixed(2)}</p>
        </Card>
        <Card className="p-5 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <TrendingUp className="h-5 w-5 text-blue-500" />
            <span className="text-sm font-medium text-gray-500 dark:text-gray-400">This Month</span>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">₹{monthlyRevenue.toFixed(2)}</p>
        </Card>
        <Card className="p-5 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <ShoppingCart className="h-5 w-5 text-purple-500" />
            <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Commission Earned</span>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">₹{totalCommission.toFixed(2)}</p>
        </Card>
        <Card className="p-5 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <Users className="h-5 w-5 text-orange-500" />
            <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Commission Pending</span>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">₹{pendingCommission.toFixed(2)}</p>
        </Card>
      </div>

      {/* Product Revenue Table */}
      <Card className="overflow-hidden bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-sm">
        <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">Revenue by Product</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-gray-500 dark:text-gray-400 uppercase bg-gray-50 dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800">
              <tr>
                <th className="px-6 py-4">Product</th>
                <th className="px-6 py-4 text-right">Revenue</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {Object.entries(productRevMap).length > 0
                ? Object.entries(productRevMap).sort((a, b) => b[1] - a[1]).map(([name, rev]) => (
                  <tr key={name} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                    <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">{name}</td>
                    <td className="px-6 py-4 text-right font-semibold text-green-600">₹{rev.toFixed(2)}</td>
                  </tr>
                ))
                : (
                  <tr>
                    <td colSpan={2} className="px-6 py-10 text-center text-gray-500">
                      No paid orders yet in your network.
                    </td>
                  </tr>
                )
              }
            </tbody>
          </table>
        </div>
      </Card>

      {/* Recent Paid Orders */}
      <Card className="overflow-hidden bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-sm">
        <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">Recent Successful Orders</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-gray-500 dark:text-gray-400 uppercase bg-gray-50 dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800">
              <tr>
                <th className="px-6 py-4">Business</th>
                <th className="px-6 py-4">Product</th>
                <th className="px-6 py-4 text-right">Amount</th>
                <th className="px-6 py-4">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {allOrders.slice(0, 20).map((o: any) => {
                const prod = Array.isArray(o.products) ? o.products[0] : o.products
                const cust = Array.isArray(o.customers) ? o.customers[0] : o.customers
                return (
                  <tr key={(o as any).id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                    <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">{cust?.business_name || '—'}</td>
                    <td className="px-6 py-4 text-gray-600 dark:text-gray-400">{prod?.name || '—'}</td>
                    <td className="px-6 py-4 text-right font-semibold text-green-600">₹{Number(o.final_amount).toFixed(2)}</td>
                    <td className="px-6 py-4 text-xs text-gray-500">{new Date(o.created_at).toLocaleDateString()}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}
