import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { ArrowLeft, Edit, Copy, Tag, Archive, Trash2, Clock, CheckCircle, Download } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/Button'
import { Card } from '@/components/Card'
import { duplicateProduct, archiveProduct, restoreProduct, hardDeleteProduct } from '@/app/actions/product'
import { ProductActions } from '@/components/products/ProductActions'

export default async function ProductDetailsPage({ params }: { params: { id: string } }) {
  const supabase = await createClient()

  // Protect route
  const { data: { user } } = await supabase.auth.getUser()
  if (process.env.DEVELOPMENT_MODE !== 'true' && !user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', (user?.id || '')).single()
  if (process.env.DEVELOPMENT_MODE !== 'true' && profile?.role !== 'admin') redirect('/unauthorized')

  const { data: product } = await supabase.from('products').select('*').eq('id', params.id).single()

  if (!product) redirect('/dashboard/products')

  const { data: versions } = await supabase.from('product_versions').select('*').eq('product_id', params.id).order('release_date', { ascending: false })
  const { data: logs } = await supabase.from('product_activity_logs').select(`
    *,
    profiles (full_name)
  `).eq('product_id', params.id).order('created_at', { ascending: false })

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div>
        <Link href="/dashboard/products" className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 mb-4">
          <ArrowLeft className="h-4 w-4 mr-1" /> Back to Products
        </Link>
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-500 shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
              {product.logo_url ? <img src={product.logo_url} alt="" className="w-full h-full object-cover rounded-xl" /> : <Tag className="h-8 w-8" />}
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">{product.name}</h1>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  product.status === 'Published' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' :
                  product.status === 'Draft' ? 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300' :
                  'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400'
                }`}>
                  {product.status}
                </span>
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{product.category || 'Uncategorized'} • {product.slug}</p>
            </div>
          </div>
          
          <ProductActions product={product} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="p-6 bg-white dark:bg-gray-900 shadow-sm border border-gray-100 dark:border-gray-800">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Pricing Configuration</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Monthly Price</p>
                <p className="text-xl font-bold text-gray-900 dark:text-white">₹{product.price_monthly?.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Yearly Price</p>
                <p className="text-xl font-bold text-gray-900 dark:text-white">₹{product.price_yearly?.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Current Version</p>
                <p className="text-xl font-bold text-gray-900 dark:text-white">{product.version || 'v1.0.0'}</p>
              </div>
            </div>
          </Card>

          <Card className="p-6 bg-white dark:bg-gray-900 shadow-sm border border-gray-100 dark:border-gray-800">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Description</h3>
            <div className="prose dark:prose-invert max-w-none text-sm text-gray-600 dark:text-gray-300">
              {product.description ? (
                <p className="whitespace-pre-wrap">{product.description}</p>
              ) : (
                <p className="italic text-gray-400">No description provided.</p>
              )}
            </div>
          </Card>

          <Card className="overflow-hidden bg-white dark:bg-gray-900 shadow-sm border border-gray-100 dark:border-gray-800">
            <div className="p-4 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center bg-gray-50/50 dark:bg-gray-800/30">
              <h3 className="font-bold text-gray-900 dark:text-white">Version History</h3>
            </div>
            <div className="p-0">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-gray-500 dark:text-gray-400 uppercase bg-gray-50 dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800">
                  <tr>
                    <th className="px-4 py-3">Version</th>
                    <th className="px-4 py-3">Release Date</th>
                    <th className="px-4 py-3">Notes</th>
                    <th className="px-4 py-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {versions && versions.length > 0 ? versions.map((v: any) => (
                    <tr key={v.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                      <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">
                        v{v.major}.{v.minor}.{v.patch}
                      </td>
                      <td className="px-4 py-3 text-gray-500 dark:text-gray-400">
                        {new Date(v.release_date).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 text-gray-500 dark:text-gray-400 max-w-[200px] truncate">
                        {v.release_notes || '-'}
                      </td>
                      <td className="px-4 py-3">
                        {v.is_current ? (
                          <span className="inline-flex items-center text-xs font-medium text-blue-600 dark:text-blue-400"><CheckCircle className="w-3 h-3 mr-1" /> Current</span>
                        ) : null}
                      </td>
                    </tr>
                  )) : (
                    <tr><td colSpan={4} className="px-4 py-6 text-center text-gray-500">No versions tracked yet.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          <Card className="p-6 bg-white dark:bg-gray-900 shadow-sm border border-gray-100 dark:border-gray-800">
            <h3 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider mb-4">Product Info</h3>
            <div className="space-y-4 text-sm">
              <div className="flex justify-between py-2 border-b border-gray-100 dark:border-gray-800">
                <span className="text-gray-500 dark:text-gray-400">Created At</span>
                <span className="text-gray-900 dark:text-white font-medium">{new Date(product.created_at).toLocaleDateString()}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-100 dark:border-gray-800">
                <span className="text-gray-500 dark:text-gray-400">Last Updated</span>
                <span className="text-gray-900 dark:text-white font-medium">{new Date(product.updated_at).toLocaleDateString()}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-100 dark:border-gray-800 items-center">
                <span className="text-gray-500 dark:text-gray-400">ZIP Template</span>
                {product.zip_template ? (
                  <a href={product.zip_template} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline flex items-center">
                    <Download className="w-4 h-4 mr-1" /> Download
                  </a>
                ) : (
                  <span className="text-gray-400">Not uploaded</span>
                )}
              </div>
            </div>
          </Card>

          <Card className="p-6 bg-white dark:bg-gray-900 shadow-sm border border-gray-100 dark:border-gray-800">
            <h3 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider mb-4 flex items-center"><Clock className="w-4 h-4 mr-2" /> Activity Log</h3>
            <div className="space-y-4">
              {logs && logs.length > 0 ? logs.map((log: any) => {
                const profile = Array.isArray(log.profiles) ? log.profiles[0] : log.profiles;
                return (
                  <div key={log.id} className="text-sm pb-4 border-b border-gray-50 dark:border-gray-800 last:border-0 last:pb-0">
                    <p className="font-medium text-gray-900 dark:text-white">{log.action}</p>
                    <p className="text-gray-500 dark:text-gray-400 text-xs mt-0.5">{log.details}</p>
                    <div className="flex justify-between text-xs text-gray-400 mt-2">
                      <span>{(profile as any)?.full_name || 'System'}</span>
                      <span>{new Date(log.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                )
              }) : (
                <p className="text-sm text-gray-500 text-center py-4">No activity recorded.</p>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
