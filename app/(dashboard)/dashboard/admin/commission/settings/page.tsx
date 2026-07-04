import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { CommissionSettingsForm } from '@/components/commission/CommissionSettingsForm'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default async function CommissionSettingsPage() {
  const supabase = await createClient()

  // Protect route
  const { data: { user } } = await supabase.auth.getUser()
  if (process.env.DEVELOPMENT_MODE !== 'true' && !user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', (user?.id || '')).single()
  if (process.env.DEVELOPMENT_MODE !== 'true' && profile?.role !== 'admin') redirect('/unauthorized')

  const { data: currentSettings } = await supabase.from('commission_settings').select('*').order('created_at', { ascending: false }).limit(1).single()

  return (
    <div className="space-y-6 pb-12">
      <div>
        <Link href="/dashboard/admin/commission" className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 mb-4">
          <ArrowLeft className="h-4 w-4 mr-1" /> Back to Dashboard
        </Link>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">Commission Settings</h1>
      </div>

      <CommissionSettingsForm currentSettings={currentSettings} />
    </div>
  )
}
