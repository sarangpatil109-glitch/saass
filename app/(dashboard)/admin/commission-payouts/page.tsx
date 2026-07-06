import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { PayoutBoardClient } from '@/components/admin/PayoutBoardClient'
import Link from 'next/link'
import { ArrowLeft, ExternalLink, Receipt } from 'lucide-react'

export default async function AdminCommissionPayoutsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (process.env.DEVELOPMENT_MODE !== 'true' && !user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', (user?.id || '')).single()
  if (process.env.DEVELOPMENT_MODE !== 'true' && profile?.role !== 'admin') redirect('/unauthorized')

  // Fetch all related entities needed for aggregate calculation
  const { data: salesExecs } = await supabase.from('sales_executives').select(`
    *,
    vendors(business_name)
  `)
  const { data: vendors } = await supabase.from('vendors').select('*')
  const { data: commissions } = await supabase.from('commissions').select('*, orders(price)').in('status', ['Pending', 'Partial', 'Paid'])
  const { data: commissionPayments } = await supabase.from('commission_payments').select('*').order('created_at', { ascending: false })

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <Link href="/dashboard" className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 mb-2">
            <ArrowLeft className="h-4 w-4 mr-1" /> Back to Dashboard
          </Link>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">Commission Payout Center</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Manage and track vendor and sales executive commission payouts.</p>
        </div>
        <Link 
          href="/admin/commission-payouts/history"
          className="inline-flex items-center px-4 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 shadow-sm transition-colors"
        >
          <Receipt className="w-4 h-4 mr-2" />
          View Payment History
        </Link>
      </div>

      <PayoutBoardClient 
        salesExecs={salesExecs || []} 
        vendors={vendors || []} 
        commissions={commissions || []}
        commissionPayments={commissionPayments || []}
      />
    </div>
  )
}
