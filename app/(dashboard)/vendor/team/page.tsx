import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { TeamBoardClient } from '@/components/vendor/TeamBoardClient'

export default async function VendorTeamPage() {
  const supabase = await createClient()

  // Protect route
  const { data: { user } } = await supabase.auth.getUser()
  if (process.env.DEVELOPMENT_MODE !== 'true' && !user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', (user?.id || '')).single()
  if (process.env.DEVELOPMENT_MODE !== 'true' && profile?.role !== 'vendor') redirect('/unauthorized')

  const { data: vendor } = await supabase.from('vendors').select('id, status').eq('user_id', (user?.id || '')).single()
  
  if (!vendor || vendor.status !== 'Active') {
    redirect('/vendor/dashboard')
  }

  const { data: team, error } = await supabase
    .from('sales_executives')
    .select('*')
    .eq('vendor_id', vendor.id)
    .order('created_at', { ascending: false })

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">My Team</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Manage your Sales Executives and track their performance.</p>
        </div>
      </div>
      <TeamBoardClient initialTeam={team || []} />
    </div>
  )
}
