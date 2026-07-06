import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { CommissionSettingsClient } from '@/components/settings/CommissionSettingsClient'

export default async function CommissionSettingsPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') redirect('/unauthorized')

  const { data: commSettings } = await supabase.from('commission_settings').select('*').maybeSingle()

  return (
    <div className="space-y-6 pb-12 max-w-2xl mx-auto">
      <div>
        <Link href="/admin/settings" className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 mb-4">
          <ArrowLeft className="h-4 w-4 mr-1" /> Back to Settings
        </Link>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">Commission Settings</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Configure global commission percentages for Sales Executives and Vendors.</p>
      </div>

      <CommissionSettingsClient initialSettings={commSettings || { sales_exec_percentage: 10, vendor_percentage: 1 }} />
    </div>
  )
}
