import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { Card } from '@/components/Card'
import { UsersRound, Search } from 'lucide-react'
import Link from 'next/link'

export default async function CustomersPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (process.env.DEVELOPMENT_MODE !== 'true' && !user) redirect('/login')

  const { data: customers } = await supabase.from('customers').select('*').order('created_at', { ascending: false })

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">Customers</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Converted leads and active clients.</p>
        </div>
      </div>

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
                        <div>{c.email}</div>
                        <div className="text-xs">{c.phone}</div>
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
