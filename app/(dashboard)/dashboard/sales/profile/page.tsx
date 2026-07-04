import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { SalesProfileForm } from '@/components/sales/SalesProfileForm'

export default async function SalesProfilePage() {
  const supabase = await createClient()

  // Protect route
  const { data: { user } } = await supabase.auth.getUser()
  if (process.env.DEVELOPMENT_MODE !== 'true' && !user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', (user?.id || '')).single()
  if (process.env.DEVELOPMENT_MODE !== 'true' && profile?.role !== 'sales') redirect('/unauthorized')

  const { data: execProfile } = await supabase.from('sales_executives').select('*').eq('user_id', (user?.id || '')).single()
  
  if (!execProfile) {
    return (
      <div className="p-8 text-center text-gray-500">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Profile Not Found</h2>
        <p>Your sales executive profile is pending admin approval or configuration.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6 pb-12">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">My Profile</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Manage your contact details and view system mappings.</p>
      </div>

      <SalesProfileForm profile={execProfile} userEmail={(user?.email || '')!} />
    </div>
  )
}
