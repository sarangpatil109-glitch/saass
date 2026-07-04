import { createClient } from '@/utils/supabase/server'
import { ProductListClient } from '@/components/product/ProductListClient'

export default async function AdminProductsPage() {
  const supabase = await createClient()
  
  const { data: products } = await supabase
    .from('products')
    .select('*, category:product_categories(name)')
    .order('created_at', { ascending: false })

  const { data: categories } = await supabase
    .from('product_categories')
    .select('*')
    .order('name')

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Product Management</h1>
        <p className="text-sm text-gray-500 mt-1">Manage all SaaS products, pricing, and versions globally.</p>
      </div>

      <ProductListClient 
        products={products || []} 
        categories={categories || []} 
      />
    </div>
  )
}
