import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Download } from 'lucide-react'
import { Card } from '@/components/Card'
import { DateRangeFilter } from '@/components/shared/date-range-filter'
import { applyDateFilter } from '@/lib/date-filter'

export default async function PayoutHistoryPage(props: { searchParams: Promise<any> }) {
  const searchParams = await props.searchParams;
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (process.env.DEVELOPMENT_MODE !== 'true' && !user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', (user?.id || '')).single()
  if (process.env.DEVELOPMENT_MODE !== 'true' && profile?.role !== 'admin') redirect('/unauthorized')

  const { data: payments } = await applyDateFilter(supabase.from('commission_payments').select(`
    *,
    sales_executives(full_name, employee_code, vendors(business_name)),
    vendors(business_name, vendor_code),
    profiles(email)
  `), searchParams, 'paid_at').order('paid_at', { ascending: false })

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <Link href="/admin/commission-payouts" className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 mb-2">
            <ArrowLeft className="h-4 w-4 mr-1" /> Back to Payouts
          </Link>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">Payout History</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Complete audit log of all commission payments.</p>
        </div>
        <div className="flex items-center gap-3">
          <DateRangeFilter />
          <button className="inline-flex items-center px-4 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 shadow-sm transition-colors">
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </button>
        </div>
      </div>

      <Card className="overflow-hidden bg-white dark:bg-gray-900 shadow-sm border border-gray-100 dark:border-gray-800">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-gray-500 dark:text-gray-400 uppercase bg-gray-50 dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800">
              <tr>
                <th className="px-6 py-4">Transaction Date</th>
                <th className="px-6 py-4">Payee</th>
                <th className="px-6 py-4">Type</th>
                <th className="px-6 py-4">Amount</th>
                <th className="px-6 py-4">Mode & Ref</th>
                <th className="px-6 py-4">Admin</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {payments && payments.length > 0 ? (
                payments.map((p: any) => {
                  const isSE = p.payee_type === 'sales_executive'
                  const name = isSE ? p.sales_executives?.full_name : p.vendors?.business_name
                  const code = isSE ? p.sales_executives?.employee_code : p.vendors?.vendor_code
                  
                  return (
                    <tr key={p.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                      <td className="px-6 py-4 text-gray-600 dark:text-gray-400 whitespace-nowrap">
                        {new Date(p.paid_at).toLocaleString('en-IN', {
                          day: '2-digit', month: 'short', year: 'numeric',
                          hour: '2-digit', minute: '2-digit'
                        })}
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-medium text-gray-900 dark:text-white">{name}</div>
                        <div className="text-xs text-gray-500 font-mono mt-0.5">{code}</div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300">
                          {isSE ? 'Sales Exec' : 'Vendor'}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-bold text-green-600 dark:text-green-400">
                        ₹{Number(p.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-medium text-gray-900 dark:text-white">{p.payment_mode}</div>
                        <div className="text-xs text-gray-500 font-mono mt-0.5">{p.payment_reference}</div>
                      </td>
                      <td className="px-6 py-4 text-xs text-gray-500 max-w-[150px] truncate">
                        {p.profiles?.email || 'System'}
                      </td>
                    </tr>
                  )
                })
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                    No payment history found for the selected date range.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}
