import { createClient } from '@/utils/supabase/server'
import { Card } from '@/components/Card'
import { PlusCircle, Search, Filter, Eye, Edit, Tag, ChevronLeft, ChevronRight } from 'lucide-react'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { DateRangeFilter } from '@/components/shared/date-range-filter'
import { applyDateFilter } from '@/lib/date-filter'

import { Button } from '@/components/Button'

export default async function (props: { searchParams: Promise<any> }) {
  const searchParams = await props.searchParams;
  const supabase = await createClient()

  // Protect route
  const { data: { user } } = await supabase.auth.getUser()
  if (process.env.DEVELOPMENT_MODE !== 'true' && !user) redirect('/login')

  const query = searchParams?.q || ''
  const isActiveFilter = searchParams?.active || ''
  const categoryFilter = searchParams?.category || ''
  const sort = searchParams?.sort || 'newest'
  const page = parseInt(searchParams?.page || '1')
  const pageSize = 10
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  // Get distinct categories for the filter
  const { data: catData } = await applyDateFilter(supabase.from('products').select('category'), searchParams)
  const distinctCategories = Array.from(new Set(catData?.map(c => c.category).filter(Boolean)))

  // Build paginated query
  let productsQuery = applyDateFilter(supabase.from('products').select('id, name, description, category, is_active, created_at, updated_at', { count: 'exact' }), searchParams)

  if (query) {
    productsQuery = productsQuery.ilike('name', `%${query}%`)
  }
  if (isActiveFilter === 'active') {
    productsQuery = productsQuery.eq('status', 'Published')
  } else if (isActiveFilter === 'inactive') {
    productsQuery = productsQuery.eq('status', 'Archived')
  }
  if (categoryFilter) {
    productsQuery = productsQuery.eq('category', categoryFilter)
  }

  if (sort === 'oldest') productsQuery = productsQuery.order('created_at', { ascending: true })
  else if (sort === 'name_asc') productsQuery = productsQuery.order('name', { ascending: true })
  else if (sort === 'name_desc') productsQuery = productsQuery.order('name', { ascending: false })
  else productsQuery = productsQuery.order('created_at', { ascending: false })

  productsQuery = productsQuery.range(from, to)

  const { data: products, count: totalCount } = await productsQuery
  
  const totalPages = totalCount ? Math.ceil(totalCount / pageSize) : 1

  // Analytics query (ignores pagination and search, just overall stats)
  const { data: allProducts } = await applyDateFilter(supabase.from('products').select('is_active'), searchParams)
  const totalOverall = allProducts?.length || 0
  const activeProducts = allProducts?.filter((p: any) => p.is_active === true).length || 0
  const inactiveProducts = allProducts?.filter((p: any) => p.is_active === false).length || 0

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4"><div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">Products</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Manage your SaaS products, pricing, and versions.</p>
        </div>
        <DateRangeFilter />
      </div>
        <div className="flex items-center gap-3">
          <Link href="/dashboard/products/new">
            <Button className="inline-flex items-center">
              <PlusCircle className="h-4 w-4 mr-2" /> New Product
            </Button>
          </Link>
        </div>
      </div>

      {/* Analytics */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <Card className="p-4 bg-white dark:bg-gray-900 shadow-sm border border-gray-100 dark:border-gray-800">
          <div className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Total Products</div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white">{totalOverall}</div>
        </Card>
        <Card className="p-4 bg-white dark:bg-gray-900 shadow-sm border border-gray-100 dark:border-gray-800">
          <div className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Active</div>
          <div className="text-2xl font-bold text-green-600 dark:text-green-400">{activeProducts}</div>
        </Card>
        <Card className="p-4 bg-white dark:bg-gray-900 shadow-sm border border-gray-100 dark:border-gray-800">
          <div className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Inactive</div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white">{inactiveProducts}</div>
        </Card>
      </div>

      {/* Filters & Search */}
      <Card className="p-4 bg-white dark:bg-gray-900 shadow-sm border border-gray-100 dark:border-gray-800">
        <form className="flex flex-col md:flex-row gap-4 flex-wrap">
          <div className="flex-1 relative min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input 
              name="q"
              defaultValue={query}
              type="text" 
              placeholder="Search products by name..." 
              className="w-full pl-10 pr-4 py-2 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-gray-900 dark:text-white"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            <select name="active" defaultValue={isActiveFilter} className="px-3 py-2 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-gray-900 dark:text-white">
              <option value="">All Statuses</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
            <select name="category" defaultValue={categoryFilter} className="px-3 py-2 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-gray-900 dark:text-white">
              <option value="">All Categories</option>
              {distinctCategories.map((c: any) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            <select name="sort" defaultValue={sort} className="px-3 py-2 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-gray-900 dark:text-white">
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="name_asc">Name: A to Z</option>
              <option value="name_desc">Name: Z to A</option>
            </select>
            <Button type="submit" variant="outline" className="shrink-0"><Filter className="h-4 w-4 mr-2" /> Filter</Button>
          </div>
        </form>
      </Card>

      {/* Product List */}
      <Card className="overflow-hidden bg-white dark:bg-gray-900 shadow-sm border border-gray-100 dark:border-gray-800">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-gray-500 dark:text-gray-400 uppercase bg-gray-50 dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800">
              <tr>
                <th className="px-6 py-4">Product</th>
                <th className="px-6 py-4">Category</th>
                <th className="px-6 py-4">Active</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {products && products.length > 0 ? (
                products.map((product: any) => (
                  <tr key={product.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-500 overflow-hidden">
                          <Tag className="h-5 w-5" />
                        </div>
                        <div>
                          <div className="font-medium text-gray-900 dark:text-white">{product.name}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-500 dark:text-gray-400">
                      {product.category || 'Uncategorized'}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                        product.is_active ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' :
                        'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400'
                      }`}>
                        {product.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Link href={`/dashboard/products/${product.id}`} className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-md transition-colors" title="View Details">
                          <Eye className="h-4 w-4" />
                        </Link>
                        <Link href={`/dashboard/products/${product.id}/edit`} className="p-1.5 text-gray-500 hover:text-green-600 hover:bg-green-50 dark:hover:bg-green-900/30 rounded-md transition-colors" title="Edit">
                          <Edit className="h-4 w-4" />
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                    <div className="flex flex-col items-center justify-center">
                      <Tag className="h-10 w-10 text-gray-300 dark:text-gray-600 mb-3" />
                      <p className="font-medium text-gray-900 dark:text-white">No products found</p>
                      <p className="text-sm mt-1">Adjust your filters or create a new product.</p>
                      <Link href="/dashboard/products/new" className="mt-4">
                        <Button variant="outline">Create Product</Button>
                      </Link>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between">
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Showing <span className="font-medium text-gray-900 dark:text-white">{from + 1}</span> to <span className="font-medium text-gray-900 dark:text-white">{Math.min(to + 1, totalCount || 0)}</span> of <span className="font-medium text-gray-900 dark:text-white">{totalCount}</span> products
            </div>
            <div className="flex gap-2">
              <Link href={`/dashboard/products?page=${Math.max(1, page - 1)}&q=${query}&active=${isActiveFilter}&category=${categoryFilter}&sort=${sort}`}
                    className={`p-2 rounded border border-gray-200 dark:border-gray-700 flex items-center ${page === 1 ? 'opacity-50 pointer-events-none' : 'hover:bg-gray-50 dark:hover:bg-gray-800'}`}>
                <ChevronLeft className="h-4 w-4" />
              </Link>
              <Link href={`/dashboard/products?page=${Math.min(totalPages, page + 1)}&q=${query}&active=${isActiveFilter}&category=${categoryFilter}&sort=${sort}`}
                    className={`p-2 rounded border border-gray-200 dark:border-gray-700 flex items-center ${page === totalPages ? 'opacity-50 pointer-events-none' : 'hover:bg-gray-50 dark:hover:bg-gray-800'}`}>
                <ChevronRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        )}
      </Card>
    </div>
  )
}
