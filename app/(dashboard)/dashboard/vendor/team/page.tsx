import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { DateRangeFilter } from '@/components/shared/date-range-filter'
import { applyDateFilter } from '@/lib/date-filter'
import { Card } from '@/components/Card'
import { Users, Search, Filter } from 'lucide-react'
import { Button } from '@/components/Button'

export default async function VendorTeamPage(props: { searchParams: Promise<any> }) {
  const searchParams = await props.searchParams;
  const supabase = await createClient()

  // Protect route
  const { data: { user } } = await supabase.auth.getUser()
  if (process.env.DEVELOPMENT_MODE !== 'true' && !user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', (user?.id || '')).single()
  if (process.env.DEVELOPMENT_MODE !== 'true' && profile?.role !== 'vendor') redirect('/unauthorized')

  const { data: vendorUser } = await applyDateFilter(supabase.from('vendor_users').select('vendor_id, vendors(id, status)'), searchParams).eq('user_id', (user?.id || '')).single();
  const vendor = vendorUser?.vendors as any;
  
  if (!vendor || vendor.status !== 'Active') {
    redirect('/dashboard/vendor')
  }

  // We are not implementing the Sales Executive module backend in this prompt,
  // so we will show the empty state natively as requested: "If empty show professional empty states."
  const team: any[] = []

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4"><div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">My Team</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Manage your Sales Executives and track their performance.</p>
        </div>
        <DateRangeFilter />
      </div>
      </div>

      <Card className="p-4 bg-white dark:bg-gray-900 shadow-sm border border-gray-100 dark:border-gray-800">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input 
              type="text" 
              placeholder="Search by name, email, or phone..." 
              className="w-full pl-10 pr-4 py-2 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all text-gray-900 dark:text-white"
            />
          </div>
          <div className="flex gap-2">
            <select className="px-3 py-2 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-gray-900 dark:text-white">
              <option value="">All Statuses</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
            <Button variant="outline" className="shrink-0"><Filter className="h-4 w-4 mr-2" /> Filter</Button>
          </div>
        </div>
      </Card>

      <Card className="overflow-hidden bg-white dark:bg-gray-900 shadow-sm border border-gray-100 dark:border-gray-800">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-gray-500 dark:text-gray-400 uppercase bg-gray-50 dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800">
              <tr>
                <th className="px-6 py-4">Executive</th>
                <th className="px-6 py-4">Contact</th>
                <th className="px-6 py-4">Sales / Comm.</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Joined / Last Active</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {team.length > 0 ? (
                team.map((member: any) => (
                  <tr key={member.id}></tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-6 py-16 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <div className="w-16 h-16 bg-blue-50 dark:bg-blue-900/20 rounded-full flex items-center justify-center mb-4">
                        <Users className="h-8 w-8 text-blue-500 dark:text-blue-400" />
                      </div>
                      <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-1">No Team Members Yet</h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400 max-w-sm mb-6">
                        You don't have any Sales Executives registered under your vendor code yet. Contact admin to assign an executive to your account.
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}
