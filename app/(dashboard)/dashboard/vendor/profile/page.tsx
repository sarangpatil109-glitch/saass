import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { DateRangeFilter } from '@/components/shared/date-range-filter'
import { applyDateFilter } from '@/lib/date-filter'
import { VendorProfileForm } from '@/components/vendors/VendorProfileForm'

export default async function VendorProfilePage(props: { searchParams: Promise<any> }) {
  const searchParams = await props.searchParams;
  const supabase = await createClient()

  // Protect route
  const { data: { user } } = await supabase.auth.getUser()
  if (process.env.DEVELOPMENT_MODE !== 'true' && !user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', (user?.id || '')).single()
  if (process.env.DEVELOPMENT_MODE !== 'true' && profile?.role !== 'vendor') redirect('/unauthorized')

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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4"><div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">My Profile</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Manage your vendor contact details and view active codes.</p>
      </div>
        <DateRangeFilter />
      </div>

      <VendorProfileForm profile={vendorProfile} userEmail={(user?.email || '')!} />
    </div>
  )
}
