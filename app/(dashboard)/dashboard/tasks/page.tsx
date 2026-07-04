import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { Card } from '@/components/Card'
import { CheckSquare } from 'lucide-react'

export default async function TasksPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (process.env.DEVELOPMENT_MODE !== 'true' && !user) redirect('/login')

  const { data: tasks } = await supabase.from('tasks').select(`
    *,
    leads (business_name),
    sales_executives (full_name)
  `).order('due_date', { ascending: true })

  return (
    <div className="space-y-6 pb-12">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">Tasks</h1>
      </div>

      <Card className="overflow-hidden bg-white dark:bg-gray-900 shadow-sm border border-gray-100 dark:border-gray-800">
         <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-gray-500 dark:text-gray-400 uppercase bg-gray-50 dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800">
              <tr>
                <th className="px-6 py-4">Task</th>
                <th className="px-6 py-4">Lead</th>
                <th className="px-6 py-4">Due Date</th>
                <th className="px-6 py-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {tasks && tasks.length > 0 ? (
                tasks.map((t: any) => {
                  const leadInfo = Array.isArray(t.leads) ? t.leads[0] : t.leads;
                  return (
                    <tr key={t.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                      <td className="px-6 py-4">
                        <div className="font-medium text-gray-900 dark:text-white">{t.title}</div>
                        <div className="text-xs text-gray-500 mt-0.5">{t.priority} Priority</div>
                      </td>
                      <td className="px-6 py-4 text-gray-600 dark:text-gray-300">
                        {leadInfo?.business_name || '-'}
                      </td>
                      <td className="px-6 py-4">
                        {new Date(t.due_date).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                          t.status === 'Completed' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' : 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400'
                        }`}>
                          {t.status}
                        </span>
                      </td>
                    </tr>
                  )
                })
              ) : (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                    <CheckSquare className="h-10 w-10 text-gray-300 mx-auto mb-3" />
                    <p>No tasks found.</p>
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
