import { createClient } from '@/utils/supabase/server'
import { LicenseDetailClient } from '@/components/license/LicenseDetailClient'
import { redirect, notFound } from 'next/navigation'

export default async function AdminLicenseDetailPage({ params }: { params: { id: string } }) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') redirect('/unauthorized')

  const { data: license } = await supabase
    .from('licenses')
    .select('*, customer:customers(email, profiles(full_name)), product:products(name), product_version:product_versions(version_string)')
    .eq('id', params.id)
    .single()

  if (!license) notFound()

  const { data: devices } = await supabase
    .from('license_devices')
    .select('*')
    .eq('license_id', license.id)
    .order('last_active', { ascending: false })

  const { data: history } = await supabase
    .from('license_history')
    .select('*')
    .eq('license_id', license.id)
    .order('created_at', { ascending: false })
    .limit(50)

  return (
    <LicenseDetailClient 
      license={license} 
      devices={devices || []} 
      history={history || []} 
    />
  )
}
