import { createClient } from '@/utils/supabase/server'
import { PaymentBoardClient } from '@/components/payment/PaymentBoardClient'
import { redirect } from 'next/navigation'

export default async function AdminPaymentsPage() {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (process.env.DEVELOPMENT_MODE !== 'true' && !user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', (user?.id || '')).single()
  if (process.env.DEVELOPMENT_MODE !== 'true' && profile?.role !== 'admin') redirect('/unauthorized')

  const { data: orders } = await supabase
    .from('orders')
    .select('*, customer:customers(email, profiles(full_name)), product:products(name)')
    .order('created_at', { ascending: false })

  const { data: invoices } = await supabase
    .from('invoices')
    .select('*')
    .order('created_at', { ascending: false })

  const { data: refunds } = await supabase
    .from('refund_history')
    .select('*')
    .order('created_at', { ascending: false })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Payments & Orders</h1>
        <p className="text-sm text-gray-500 mt-1">Monitor revenue, simulate sandbox payments, view auto-generated invoices, and track manual refunds.</p>
      </div>

      <PaymentBoardClient 
        orders={orders || []} 
        invoices={invoices || []} 
        refunds={refunds || []} 
      />
    </div>
  )
}
