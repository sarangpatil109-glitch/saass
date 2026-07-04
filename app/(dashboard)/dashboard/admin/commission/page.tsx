import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { CommissionBoardClient } from '@/components/commission/CommissionBoardClient'

export default async function AdminCommissionDashboard() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (process.env.DEVELOPMENT_MODE !== 'true' && !user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', (user?.id || '')).single()
  if (process.env.DEVELOPMENT_MODE !== 'true' && profile?.role !== 'admin') redirect('/unauthorized')

  const { data: commissions } = await supabase.from('commissions').select(`
    *,
    customers (business_name),
    products (name),
    sales_executives (full_name),
    vendors (company_name)
  `).order('created_at', { ascending: false })

  const { data: settings } = await supabase.from('commission_settings').select('*').order('effective_from', { ascending: false }).limit(1).single()

  return (
    <div className="space-y-6 pb-12">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">Commission Engine</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Manage global commissions, approve payouts, and view ledgers.</p>
      </div>

      <CommissionBoardClient 
        initialCommissions={commissions || []} 
        userRole="admin" 
        settings={settings}
      />
    </div>
  )
}
