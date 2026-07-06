import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { DateRangeFilter } from '@/components/shared/date-range-filter'
import { applyDateFilter } from '@/lib/date-filter'
import { Card } from '@/components/Card'
import { Wallet, Activity, CheckSquare } from 'lucide-react'

export default async function SalesExecWalletPage(props: { searchParams: Promise<any> }) {
  const searchParams = await props.searchParams;
  const supabase = await createClient()

  // Protect route
  const { data: { user } } = await supabase.auth.getUser()
  if (process.env.DEVELOPMENT_MODE !== 'true' && !user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', (user?.id || '')).single()
  if (process.env.DEVELOPMENT_MODE !== 'true' && profile?.role !== 'sales_executive') redirect('/unauthorized')

  const { data: exec } = await applyDateFilter(supabase.from('sales_executives').select('id, full_name, status'), searchParams).eq('id', (user?.id || '')).single()
  
  if (!exec || exec.status !== 'Active') {
    redirect('/sales/dashboard')
  }

  // Fetch Commission
  const { data: commissions } = await supabase
    .from('commissions')
    .select('*, orders(order_id, customer_name, product_name, price)')
    .eq('sales_exec_id', exec.id)
    .order('created_at', { ascending: false })
  
  const { data: commissionPayments } = await applyDateFilter(supabase.from('commission_payments').select('*'), searchParams)
    .eq('sales_exec_id', exec.id)
    .eq('payee_type', 'sales_executive')
  
  const allCommissions = commissions || []
  const allPayments = commissionPayments || []
  
  const lifetimeEarnings = allCommissions.reduce((acc, curr) => acc + Number(curr.amount), 0)
  const totalPaid = allPayments.reduce((acc, curr) => acc + Number(curr.amount), 0)
  const pendingBalance = lifetimeEarnings - totalPaid

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4"><div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">My Earnings Wallet</h1>
        <p className="text-sm text-gray-500 mt-1">Manage and track your commission payouts.</p>
      </div>
        <DateRangeFilter />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-5 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 flex items-center shadow-sm">
          <div className="p-3 rounded-xl bg-orange-50 text-orange-600 dark:bg-orange-900/30 mr-4 flex-shrink-0"><Activity className="h-6 w-6" /></div>
          <div>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Pending Approval</p>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mt-1">₹{pendingBalance.toLocaleString()}</h3>
          </div>
        </Card>
        <Card className="p-5 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 flex items-center shadow-sm">
          <div className="p-3 rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-900/30 mr-4 flex-shrink-0"><CheckSquare className="h-6 w-6" /></div>
          <div>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Paid Out</p>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mt-1">₹{totalPaid.toLocaleString()}</h3>
          </div>
        </Card>
        <Card className="p-5 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 flex items-center shadow-sm">
          <div className="p-3 rounded-xl bg-purple-50 text-purple-600 dark:bg-purple-900/30 mr-4 flex-shrink-0"><Activity className="h-6 w-6" /></div>
          <div>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Lifetime Earnings</p>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mt-1">₹{lifetimeEarnings.toLocaleString()}</h3>
          </div>
        </Card>
      </div>

      <Card className="overflow-hidden bg-white dark:bg-gray-900 shadow-sm border border-gray-100 dark:border-gray-800 mt-6">
        <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">Transaction History</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-gray-500 dark:text-gray-400 uppercase bg-gray-50 dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800">
              <tr>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4">Order ID</th>
                <th className="px-6 py-4">Customer</th>
                <th className="px-6 py-4">Product</th>
                <th className="px-6 py-4">Sale Amount</th>
                <th className="px-6 py-4">Commission</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Payment Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {allCommissions.length > 0 ? (
                allCommissions.map((c: any) => {
                  const order = Array.isArray(c.orders) ? c.orders[0] : c.orders
                  return (
                  <tr key={c.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                    <td className="px-6 py-4 text-gray-500">{new Date(c.created_at).toLocaleDateString()}</td>
                    <td className="px-6 py-4 font-mono text-xs">{order?.order_id || 'N/A'}</td>
                    <td className="px-6 py-4 font-medium">{order?.customer_name || 'N/A'}</td>
                    <td className="px-6 py-4 text-gray-500">{order?.product_name || 'N/A'}</td>
                    <td className="px-6 py-4">₹{Number(order?.price || 0).toLocaleString()}</td>
                    <td className="px-6 py-4 font-bold text-gray-900 dark:text-white">
                      ₹{Number(c.amount).toLocaleString()}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                        c.status === 'Paid' ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800'
                      }`}>
                        {c.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-500">{c.paid_at ? new Date(c.paid_at).toLocaleDateString() : '—'}</td>
                  </tr>
                )})
              ) : (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-gray-500">No transactions recorded.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}
