import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { Card } from '@/components/Card'
import { Banknote, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default async function AdminPayoutsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (process.env.DEVELOPMENT_MODE !== 'true' && !user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', (user?.id || '')).single()
  if (process.env.DEVELOPMENT_MODE !== 'true' && profile?.role !== 'admin') redirect('/unauthorized')

  const { data: payouts } = await supabase.from('commission_payouts').select(`
    *,
    commission_wallets (
      user_type,
      user_id
    )
  `).order('requested_at', { ascending: false })

  // We should ideally fetch the full names of the entities, but for this simplified view we'll just show the IDs and Types
  
  return (
    <div className="space-y-6 pb-12">
      <div>
        <Link href="/dashboard/admin/commission" className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 mb-4">
          <ArrowLeft className="h-4 w-4 mr-1" /> Back to Dashboard
        </Link>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">Payout History</h1>
      </div>

      <Card className="overflow-hidden bg-white dark:bg-gray-900 shadow-sm border border-gray-100 dark:border-gray-800">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-gray-500 dark:text-gray-400 uppercase bg-gray-50 dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800">
              <tr>
                <th className="px-6 py-4">Recipient</th>
                <th className="px-6 py-4">Amount</th>
                <th className="px-6 py-4">Method & Ref</th>
                <th className="px-6 py-4">Status & Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {payouts && payouts.length > 0 ? (
                payouts.map((p: any) => {
                  const wallet = Array.isArray(p.commission_wallets) ? p.commission_wallets[0] : p.commission_wallets;
                  return (
                    <tr key={p.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                      <td className="px-6 py-4">
                        <div className="font-medium text-gray-900 dark:text-white">{wallet?.user_type}</div>
                        <div className="text-xs text-gray-500 font-mono mt-0.5">{wallet?.user_id}</div>
                      </td>
                      <td className="px-6 py-4 font-bold text-gray-900 dark:text-white">
                        ₹{p.amount.toLocaleString()}
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-medium text-gray-900 dark:text-white">{p.method}</div>
                        <div className="text-xs text-gray-500 mt-0.5">{p.reference_number || '-'}</div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 mb-1 block w-max">
                          {p.status}
                        </span>
                        <div className="text-xs text-gray-500">{new Date(p.paid_at || p.requested_at).toLocaleDateString()}</div>
                      </td>
                    </tr>
                  )
                })
              ) : (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                    <Banknote className="h-10 w-10 text-gray-300 mx-auto mb-3" />
                    <p>No payouts recorded yet.</p>
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
