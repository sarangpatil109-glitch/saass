import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { ProductForm } from '@/components/products/ProductForm'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default async function NewProductPage() {
  const supabase = await createClient()

  // Protect route
  const { data: { user } } = await supabase.auth.getUser()
  if (process.env.DEVELOPMENT_MODE !== 'true' && !user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', (user?.id || '')).single()
  if (process.env.DEVELOPMENT_MODE !== 'true' && profile?.role !== 'admin') redirect('/unauthorized')

  return (
    <div className="space-y-6 pb-12">
      <div>
        <Link href="/dashboard/products" className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 mb-4">
          <ArrowLeft className="h-4 w-4 mr-1" /> Back to Products
        </Link>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">Create New Product</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Add a new SaaS product to your catalog.</p>
      </div>

      <ProductForm />
    </div>
  )
}
