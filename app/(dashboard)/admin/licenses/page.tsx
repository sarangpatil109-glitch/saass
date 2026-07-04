import { createClient } from '@/utils/supabase/server'
import { LicenseBoardClient } from '@/components/license/LicenseBoardClient'
import { redirect } from 'next/navigation'

export default async function AdminLicensesPage() {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') redirect('/unauthorized')

  const { data: licenses } = await supabase
    .from('licenses')
    .select('*, customer:customers(email, profiles(full_name)), product:products(name), product_version:product_versions(version_string)')
    .order('created_at', { ascending: false })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">License Management</h1>
        <p className="text-sm text-gray-500 mt-1">Manage global software licensing, device activations, and security rules.</p>
      </div>

      <LicenseBoardClient licenses={licenses || []} />
    </div>
  )
}
