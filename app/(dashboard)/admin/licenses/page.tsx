import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { Card } from '@/components/Card'
import { GenerateLicenseForm } from '@/components/license/GenerateLicenseForm'
import { Shield, ShieldAlert, Key, Zap } from 'lucide-react'
import Link from 'next/link'

export default async function AdminLicensesPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (process.env.DEVELOPMENT_MODE !== 'true' && !user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', (user?.id || '')).single()
  if (process.env.DEVELOPMENT_MODE !== 'true' && profile?.role !== 'admin') redirect('/unauthorized')

  const { data: orders } = await supabase.from('orders').select(`
    id, order_number, products (name), customers (business_name)
  `).order('created_at', { ascending: false })
  const { data: policies } = await supabase.from('license_policies').select('*')

  // Fetch Licenses
  const { data: licenses } = await supabase.from('licenses').select(`
    *,
    customers (business_name),
    products (name),
    license_policies (name)
  `).order('created_at', { ascending: false })

  let totalActive = 0, totalExpired = 0, totalSuspended = 0;
  if (licenses) {
    licenses.forEach((l: any) => {
      if (l.status === 'Active') totalActive++;
      if (l.status === 'Expired') totalExpired++;
      if (l.status === 'Suspended') totalSuspended++;
    })
  }

  return (
    <div className="space-y-6 pb-12">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">License Management</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Generate, track, and manage software activation licenses.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-5 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 flex items-center shadow-sm">
          <div className="p-3 rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-900/30 mr-4 flex-shrink-0"><Key className="h-6 w-6" /></div>
          <div>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Licenses</p>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{licenses?.length || 0}</h3>
          </div>
        </Card>
        <Card className="p-5 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 flex items-center shadow-sm">
          <div className="p-3 rounded-xl bg-green-50 text-green-600 dark:bg-green-900/30 mr-4 flex-shrink-0"><Shield className="h-6 w-6" /></div>
          <div>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Active</p>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{totalActive}</h3>
          </div>
        </Card>
        <Card className="p-5 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 flex items-center shadow-sm">
          <div className="p-3 rounded-xl bg-red-50 text-red-600 dark:bg-red-900/30 mr-4 flex-shrink-0"><ShieldAlert className="h-6 w-6" /></div>
          <div>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Expired / Revoked</p>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{totalExpired}</h3>
          </div>
        </Card>
        <Card className="p-5 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 flex items-center shadow-sm">
          <div className="p-3 rounded-xl bg-orange-50 text-orange-600 dark:bg-orange-900/30 mr-4 flex-shrink-0"><Zap className="h-6 w-6" /></div>
          <div>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Suspended</p>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{totalSuspended}</h3>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <GenerateLicenseForm orders={orders || []} policies={policies || []} />
        </div>

        <div className="lg:col-span-2">
          <Card className="overflow-hidden bg-white dark:bg-gray-900 shadow-sm border border-gray-100 dark:border-gray-800">
            <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">Recent Licenses</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-gray-500 dark:text-gray-400 uppercase bg-gray-50 dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800">
                  <tr>
                    <th className="px-6 py-4">Key / Customer</th>
                    <th className="px-6 py-4">Plan / Expiry</th>
                    <th className="px-6 py-4">Activations</th>
                    <th className="px-6 py-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {licenses && licenses.length > 0 ? (
                    licenses.map((l: any) => {
                      const customerInfo = Array.isArray(l.customers) ? l.customers[0] : l.customers;
                      const prodInfo = Array.isArray(l.products) ? l.products[0] : l.products;
                      const policyInfo = Array.isArray(l.license_policies) ? l.license_policies[0] : l.license_policies;

                      return (
                        <tr key={l.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                          <td className="px-6 py-4">
                            <Link href={`/dashboard/admin/licenses/${l.id}`} className="font-mono text-xs text-blue-600 hover:underline font-bold block mb-1">
                              {l.license_key}
                            </Link>
                            <div className="font-medium text-gray-900 dark:text-white">{customerInfo?.business_name || 'Unknown'}</div>
                            <div className="text-xs text-gray-500">{prodInfo?.name}</div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="font-medium">{policyInfo?.name}</div>
                            <div className="text-xs text-gray-500">{l.expiry_date ? new Date(l.expiry_date).toLocaleDateString() : 'Lifetime'}</div>
                          </td>
                          <td className="px-6 py-4">
                            {l.current_activations} / {l.activation_limit}
                          </td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                              l.status === 'Active' ? 'bg-green-100 text-green-800' :
                              l.status === 'Expired' || l.status === 'Revoked' ? 'bg-red-100 text-red-800' :
                              'bg-orange-100 text-orange-800'
                            }`}>
                              {l.status}
                            </span>
                          </td>
                        </tr>
                      )
                    })
                  ) : (
                    <tr>
                      <td colSpan={4} className="px-6 py-12 text-center text-gray-500">
                        No licenses generated yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
