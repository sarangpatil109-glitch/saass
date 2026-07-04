import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { Card } from '@/components/Card'
import { GeneratorForm } from '@/components/generator/GeneratorForm'
import { GeneratorActions } from '@/components/generator/GeneratorActions'
import { Package, Activity } from 'lucide-react'

export default async function AdminZipsPage() {
  const supabase = await createClient()

  // Protect route
  const { data: { user } } = await supabase.auth.getUser()
  if (process.env.DEVELOPMENT_MODE !== 'true' && !user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', (user?.id || '')).single()
  if (process.env.DEVELOPMENT_MODE !== 'true' && profile?.role !== 'admin') redirect('/unauthorized')

  // Fetch Dependencies
  const { data: customers } = await supabase.from('customers').select('id, business_name, owner_name').is('deleted_at', null)
  const { data: products } = await supabase.from('products').select('id, name').is('deleted_at', null)
  const { data: templates } = await supabase.from('product_templates').select('*')

  // Fetch Jobs
  const { data: jobs } = await supabase.from('zip_generations').select(`
    *,
    product_instances (
      business_name,
      license_placeholder,
      products (name)
    )
  `).order('created_at', { ascending: false })

  return (
    <div className="space-y-6 pb-12">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">Product Instance Generator</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Configure and generate branded ZIP software packages for customers.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <GeneratorForm customers={customers || []} products={products || []} templates={templates || []} />
        </div>

        <div className="lg:col-span-2 space-y-6">
          <Card className="overflow-hidden bg-white dark:bg-gray-900 shadow-sm border border-gray-100 dark:border-gray-800">
            <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">Generation Queue & History</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-gray-500 dark:text-gray-400 uppercase bg-gray-50 dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800">
                  <tr>
                    <th className="px-6 py-4">Instance / Product</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4">Timeline</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {jobs && jobs.length > 0 ? (
                    jobs.map((job: any) => {
                      const instance = Array.isArray(job.product_instances) ? job.product_instances[0] : job.product_instances;
                      const product = instance?.products;
                      const prodInfo = Array.isArray(product) ? product[0] : product;

                      return (
                        <tr key={job.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                          <td className="px-6 py-4">
                            <div className="font-medium text-gray-900 dark:text-white">{instance?.business_name || 'Unknown'}</div>
                            <div className="text-xs text-gray-500 mt-0.5">{prodInfo?.name || 'Unknown Product'}</div>
                            <div className="text-[10px] text-gray-400 font-mono mt-1" title="License Placeholder">{instance?.license_placeholder}</div>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                              job.status === 'Completed' ? 'bg-green-100 text-green-800' :
                              job.status === 'Failed' ? 'bg-red-100 text-red-800' :
                              job.status === 'Generating' ? 'bg-blue-100 text-blue-800 animate-pulse' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {job.status === 'Generating' && <Activity className="w-3 h-3 mr-1" />}
                              {job.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-xs text-gray-500">
                            <div>Q: {new Date(job.created_at).toLocaleTimeString()}</div>
                            {job.completed_at && <div>C: {new Date(job.completed_at).toLocaleTimeString()}</div>}
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex justify-end">
                              <GeneratorActions job={job} />
                            </div>
                          </td>
                        </tr>
                      )
                    })
                  ) : (
                    <tr>
                      <td colSpan={4} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                        <Package className="h-10 w-10 text-gray-300 mx-auto mb-3" />
                        <p>No ZIP generation jobs found.</p>
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
