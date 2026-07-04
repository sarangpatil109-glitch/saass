import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { Card } from '@/components/Card'
import { Calendar } from 'lucide-react'

export default async function SalesFollowupsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (process.env.DEVELOPMENT_MODE !== 'true' && !user) redirect('/login')

  const { data: exec } = await supabase.from('sales_executives').select('id, status').eq('user_id', (user?.id || '')).single()
  
  if (!exec || exec.status !== 'Active') {
    redirect('/sales/dashboard')
  }

  // Fetch followups for leads assigned to this sales executive
  const { data: followups } = await supabase.from('followups').select(`
    *,
    leads!inner(business_name, mobile, assigned_sales_executive_id)
  `).eq('leads.assigned_sales_executive_id', exec.id).order('followup_date', { ascending: true })

  return (
    <div className="space-y-6 pb-12">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">Follow-ups</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Track your upcoming calls, demos, and meetings.</p>
      </div>

      <Card className="overflow-hidden bg-white dark:bg-gray-900 shadow-sm border border-gray-100 dark:border-gray-800">
         <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-gray-500 dark:text-gray-400 uppercase bg-gray-50 dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800">
              <tr>
                <th className="px-6 py-4">Date & Time</th>
                <th className="px-6 py-4">Type</th>
                <th className="px-6 py-4">Lead</th>
                <th className="px-6 py-4">Notes</th>
                <th className="px-6 py-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {followups && followups.length > 0 ? (
                followups.map((f: any) => {
                  const leadInfo = Array.isArray(f.leads) ? f.leads[0] : f.leads;
                  return (
                    <tr key={f.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                      <td className="px-6 py-4">
                        <div className="font-medium text-gray-900 dark:text-white">{new Date(f.followup_date).toLocaleDateString()}</div>
                        <div className="text-xs text-gray-500 mt-0.5">{f.followup_time || '-'}</div>
                      </td>
                      <td className="px-6 py-4 font-medium">
                        {f.type}
                      </td>
                      <td className="px-6 py-4 text-gray-600 dark:text-gray-300">
                        <div className="font-medium text-gray-900 dark:text-white">{leadInfo?.business_name || '-'}</div>
                        <div className="text-xs mt-0.5">{leadInfo?.mobile || '-'}</div>
                      </td>
                      <td className="px-6 py-4 text-gray-500">
                        <p className="line-clamp-2">{f.notes || '-'}</p>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                          f.status === 'Completed' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' : 
                          f.status === 'Missed' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' : 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400'
                        }`}>
                          {f.status}
                        </span>
                      </td>
                    </tr>
                  )
                })
              ) : (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                    <Calendar className="h-10 w-10 text-gray-300 mx-auto mb-3" />
                    <p>No follow-ups scheduled.</p>
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
