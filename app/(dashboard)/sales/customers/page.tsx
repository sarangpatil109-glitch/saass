import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { Card } from '@/components/Card'
import { UsersRound, Search } from 'lucide-react'
import Link from 'next/link'

export default async function SalesCustomersPage() {
  const supabase = await createClient()

  // Protect route
  const { data: { user } } = await supabase.auth.getUser()
  if (process.env.DEVELOPMENT_MODE !== 'true' && !user) redirect('/login')

  const { data: exec } = await supabase.from('sales_executives').select('id, status').eq('user_id', (user?.id || '')).single()
  
  if (!exec || exec.status !== 'Active') {
    redirect('/sales/dashboard')
  }

  // Fetch only customers belonging to this sales executive
  const { data: customers } = await supabase.from('customers').select('*').eq('sales_executive_id', exec.id).order('created_at', { ascending: false })

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">Customers</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Converted leads and active clients managed by you.</p>
        </div>
      </div>

      <Card className="p-4 bg-white dark:bg-gray-900 shadow-sm border border-gray-100 dark:border-gray-800 flex items-center justify-between">
        <div className="relative max-w-sm w-full">
           <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
           <input type="text" placeholder="Search customers..." className="w-full pl-9 pr-4 py-2 border rounded-lg text-sm bg-gray-50 dark:bg-gray-800 dark:border-gray-700 outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
      </Card>

      <Card className="overflow-hidden bg-white dark:bg-gray-900 shadow-sm border border-gray-100 dark:border-gray-800">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-gray-500 dark:text-gray-400 uppercase bg-gray-50 dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800">
              <tr>
                <th className="px-6 py-4">Customer Code</th>
                <th className="px-6 py-4">Business / Name</th>
                <th className="px-6 py-4">Contact</th>
                <th className="px-6 py-4">Location</th>
                <th className="px-6 py-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {customers && customers.length > 0 ? (
                customers.map((c: any) => {
                  return (
                    <tr key={c.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                      <td className="px-6 py-4">
                        <Link href={`/dashboard/customers/${c.id}`} className="font-mono text-xs text-blue-600 hover:underline">
                          {c.customer_code}
                        </Link>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-medium text-gray-900 dark:text-white">{c.business_name || c.customer_name}</div>
                        <div className="text-xs text-gray-500 mt-0.5">{c.business_name ? c.customer_name : ''}</div>
                      </td>
                      <td className="px-6 py-4 text-gray-600 dark:text-gray-300">
                        <div className="font-medium text-gray-900 dark:text-white">{c.phone}</div>
                        <div className="text-xs">{c.email}</div>
                        <div className="flex items-center gap-2 mt-2">
                          {c.phone && (
                            <>
                              <a href={`tel:${c.phone}`} title="Call" className="p-1.5 bg-blue-50 text-blue-600 rounded-md hover:bg-blue-100 dark:bg-blue-900/30 dark:hover:bg-blue-900/50">
                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                              </a>
                              <a href={`https://wa.me/${c.phone.replace(/\D/g, '')}`} target="_blank" rel="noreferrer" title="WhatsApp" className="p-1.5 bg-green-50 text-green-600 rounded-md hover:bg-green-100 dark:bg-green-900/30 dark:hover:bg-green-900/50">
                                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 21l1.65-3.8a9 9 0 1 1 3.4 2.9L3 21"/><path d="M9 10a.5.5 0 0 0 1 0V9a.5.5 0 0 0-1 0v1a5 5 0 0 0 5 5h1a.5.5 0 0 0 0-1h-1a.5.5 0 0 0 0 1"/></svg>
                              </a>
                            </>
                          )}
                          {c.email && (
                            <a href={`mailto:${c.email}`} title="Email" className="p-1.5 bg-gray-100 text-gray-600 rounded-md hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700">
                              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
                            </a>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium">{c.city || '-'}</div>
                        <div className="text-xs text-gray-500">{c.state || '-'}</div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                          {c.status}
                        </span>
                      </td>
                    </tr>
                  )
                })
              ) : (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                    <UsersRound className="h-10 w-10 text-gray-300 mx-auto mb-3" />
                    <p>No customers found.</p>
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
