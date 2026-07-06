import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { DateRangeFilter } from '@/components/shared/date-range-filter'
import { applyDateFilter } from '@/lib/date-filter'
import { Card } from '@/components/Card'
import { Wallet, Activity, CheckSquare } from 'lucide-react'

export default async function VendorWalletPage(props: { searchParams: Promise<any> }) {
  const searchParams = await props.searchParams;
  const supabase = await createClient()

  // Protect route
  const { data: { user } } = await supabase.auth.getUser()
  if (process.env.DEVELOPMENT_MODE !== 'true' && !user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', (user?.id || '')).single()
  if (process.env.DEVELOPMENT_MODE !== 'true' && profile?.role !== 'vendor') redirect('/unauthorized')

  const { data: vendorUser } = await applyDateFilter(supabase.from('vendor_users').select('vendor_id, vendors(id, business_name)'), searchParams).eq('user_id', (user?.id || '')).single();
  const vendor = vendorUser?.vendors as any;
  if (!vendor) redirect('/')

  // Fetch Wallet
  const { data: wallet } = await applyDateFilter(supabase.from('commission_wallets').select('*'), searchParams).eq('user_type', 'Vendor').eq('user_id', vendor.id).single()
  
  // Fetch Ledger
  const { data: ledger } = await applyDateFilter(supabase.from('commission_ledger').select('*'), searchParams).eq('wallet_id', wallet?.id).order('created_at', { ascending: false })

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4"><div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">Vendor Earnings Wallet</h1>
      </div>
        <DateRangeFilter />
      </div>

      {wallet ? (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="p-5 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 flex items-center shadow-sm">
            <div className="p-3 rounded-xl bg-green-50 text-green-600 dark:bg-green-900/30 mr-4 flex-shrink-0"><Wallet className="h-6 w-6" /></div>
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Available to Withdraw</p>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mt-1">₹{wallet.available_balance.toLocaleString()}</h3>
            </div>
          </Card>
          <Card className="p-5 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 flex items-center shadow-sm">
            <div className="p-3 rounded-xl bg-orange-50 text-orange-600 dark:bg-orange-900/30 mr-4 flex-shrink-0"><Activity className="h-6 w-6" /></div>
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Pending Approval</p>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mt-1">₹{wallet.pending_balance.toLocaleString()}</h3>
            </div>
          </Card>
          <Card className="p-5 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 flex items-center shadow-sm">
            <div className="p-3 rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-900/30 mr-4 flex-shrink-0"><CheckSquare className="h-6 w-6" /></div>
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Paid Out</p>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mt-1">₹{wallet.paid_balance.toLocaleString()}</h3>
            </div>
          </Card>
          <Card className="p-5 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 flex items-center shadow-sm">
            <div className="p-3 rounded-xl bg-purple-50 text-purple-600 dark:bg-purple-900/30 mr-4 flex-shrink-0"><Activity className="h-6 w-6" /></div>
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Lifetime Earnings</p>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mt-1">₹{wallet.lifetime_earnings.toLocaleString()}</h3>
            </div>
          </Card>
        </div>
      ) : (
        <Card className="p-8 text-center text-gray-500">
           No wallet data generated yet.
        </Card>
      )}

      {wallet && (
        <Card className="overflow-hidden bg-white dark:bg-gray-900 shadow-sm border border-gray-100 dark:border-gray-800 mt-6">
          <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">Immutable Ledger</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-gray-500 dark:text-gray-400 uppercase bg-gray-50 dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800">
                <tr>
                  <th className="px-6 py-4">Date</th>
                  <th className="px-6 py-4">Transaction Type</th>
                  <th className="px-6 py-4">Reference</th>
                  <th className="px-6 py-4 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {ledger && ledger.length > 0 ? (
                  ledger.map((l: any) => (
                    <tr key={l.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                      <td className="px-6 py-4 text-gray-500">{new Date(l.created_at).toLocaleString()}</td>
                      <td className="px-6 py-4 font-medium">
                        <span className={l.transaction_type === 'Credit' ? 'text-green-600' : l.transaction_type === 'Debit' ? 'text-red-600' : 'text-blue-600'}>
                          {l.transaction_type}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-600 dark:text-gray-300">{l.remarks}</td>
                      <td className={`px-6 py-4 text-right font-bold ${l.transaction_type === 'Credit' ? 'text-green-600' : l.transaction_type === 'Debit' ? 'text-red-600' : 'text-blue-600'}`}>
                        {l.amount > 0 ? '+' : ''}{l.amount.toLocaleString()}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center text-gray-500">No transactions recorded.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  )
}
