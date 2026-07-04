import { createClient } from '@/utils/supabase/server'
import { ProductDetailClient } from '@/components/product/ProductDetailClient'
import { notFound } from 'next/navigation'

export default async function AdminProductDetailPage({ params }: { params: { id: string } }) {
  const supabase = await createClient()
  
  const { data: product } = await supabase
    .from('products')
    .select('*, category:product_categories(name)')
    .eq('id', params.id)
    .single()

  if (!product) {
    notFound()
  }

  const { data: versions } = await supabase
    .from('product_versions')
    .select('*')
    .eq('product_id', params.id)
    .order('release_date', { ascending: false })
    .order('major', { ascending: false })
    .order('minor', { ascending: false })

  const { data: categories } = await supabase
    .from('product_categories')
    .select('*')
    .order('name')

  return (
    <div>
      <ProductDetailClient 
        product={product} 
        versions={versions || []} 
        categories={categories || []} 
      />
    </div>
  )
}
