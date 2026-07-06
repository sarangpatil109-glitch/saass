import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { ArrowLeft, Edit, Copy, Tag, Archive, Trash2, Clock, CheckCircle } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/Button'
import { Card } from '@/components/Card'
import { ProductActions } from '@/components/products/ProductActions'

export default async function (props: { params: Promise<any> }) {
  const params = await props.params;
  const supabase = await createClient()

  // Protect route
  const { data: { user } } = await supabase.auth.getUser()
  if (process.env.DEVELOPMENT_MODE !== 'true' && !user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', (user?.id || '')).single()
  if (process.env.DEVELOPMENT_MODE !== 'true' && profile?.role !== 'admin') redirect('/unauthorized')

  const { data: product } = await supabase.from('products').select('id, name, description, category, is_active, created_at, updated_at').eq('id', params.id).single()

  if (!product) redirect('/dashboard/products')

  const { data: logs } = await supabase.from('product_activity_logs').select(`
    *,
    profiles (full_name)
  `).eq('product_id', params.id).order('created_at', { ascending: false })

  return (
    <div className="space-y-6 pb-12 max-w-5xl mx-auto">
      {/* Header */}
      <div>
        <Link href="/dashboard/products" className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 mb-4">
          <ArrowLeft className="h-4 w-4 mr-1" /> Back to Products
        </Link>
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-500 shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
              <Tag className="h-8 w-8" />
            </div>
            <div>
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4"><div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">{product.name}</h1>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  product.is_active ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' :
                  'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400'
                }`}>
                  {product.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>
        
      </div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{product.category || 'Uncategorized'}</p>
            </div>
          </div>
          
          <ProductActions product={product} />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="md:col-span-2 space-y-6">
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
