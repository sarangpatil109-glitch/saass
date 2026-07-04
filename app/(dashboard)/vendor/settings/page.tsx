import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { VendorSettingsForm } from '@/components/vendors/VendorSettingsForm'

export default async function VendorSettingsPage() {
  const supabase = await createClient()

  // Protect route
  const { data: { user } } = await supabase.auth.getUser()
  if (process.env.DEVELOPMENT_MODE !== 'true' && !user) redirect('/login')

  const { data: vendorProfile } = await supabase.from('vendors').select('*').eq('user_id', (user?.id || '')).single()
  if (!vendorProfile) {
    return (
      <div className="p-8 text-center text-gray-500">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Profile Not Found</h2>
        <p>Your vendor profile is pending admin approval or configuration.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6 pb-12">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">Settings</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Manage your account settings and bank details.</p>
      </div>

      <VendorSettingsForm profile={vendorProfile} />
    </div>
  )
}
