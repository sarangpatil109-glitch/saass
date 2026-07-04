'use client'

import { useState } from 'react'
import { Card } from '@/components/Card'
import { Button } from '@/components/Button'
import { Input } from '@/components/Input'
import { Select } from '@/components/Select'
import { Search, Plus, BarChart3, Package, PlayCircle, Settings, Archive, Link as LinkIcon } from 'lucide-react'
import Link from 'next/link'
import { createProduct, updateProductStatus } from '@/app/actions/product'

export function ProductListClient({ products, categories }: { products: any[], categories: any[] }) {
  const [search, setSearch] = useState('')
  const [catFilter, setCatFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    const formData = new FormData(e.currentTarget)
    const result = await createProduct(formData)
    setLoading(false)
    if (result.error) alert(result.error)
    else {
      setIsModalOpen(false)
      window.location.href = `/admin/products/${result.id}`
    }
  }

  const handleStatus = async (id: string, status: string) => {
    await updateProductStatus(id, status)
    window.location.reload()
  }

  const filtered = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase())
    const matchesCat = catFilter === 'all' || p.category_id === catFilter
    const matchesStatus = statusFilter === 'all' || p.status === statusFilter
    return matchesSearch && matchesCat && matchesStatus
  })

  // Mock analytics
  const activeLicenses = 1240
  const generatedZips = 8400
  const totalSalesRevenue = products.reduce((acc, p) => acc + (p.price * Math.floor(Math.random() * 50)), 0)

  return (
    <div className="space-y-6">
      
      {/* Product Analytics Dashboard */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
        <Card className="p-5 flex flex-col gap-2 bg-white border-blue-100 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-500">Total Products</span>
            <Package className="h-5 w-5 text-blue-500" />
          </div>
          <span className="text-2xl font-bold text-gray-900">{products.length}</span>
        </Card>
        <Card className="p-5 flex flex-col gap-2 bg-white border-green-100 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-500">Revenue (Est)</span>
            <BarChart3 className="h-5 w-5 text-green-500" />
          </div>
          <span className="text-2xl font-bold text-gray-900">${totalSalesRevenue.toFixed(2)}</span>
        </Card>
        <Card className="p-5 flex flex-col gap-2 bg-white border-purple-100 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-500">Active Licenses</span>
            <Settings className="h-5 w-5 text-purple-500" />
          </div>
          <span className="text-2xl font-bold text-gray-900">{activeLicenses}</span>
        </Card>
        <Card className="p-5 flex flex-col gap-2 bg-white border-orange-100 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-500">Generated ZIPs</span>
            <Archive className="h-5 w-5 text-orange-500" />
          </div>
          <span className="text-2xl font-bold text-gray-900">{generatedZips}</span>
        </Card>
      </div>

      <Card className="overflow-hidden">
        <div className="p-4 sm:p-6 flex flex-col lg:flex-row gap-4 border-b">
          <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="relative w-full">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
              <Input 
                type="search" 
                placeholder="Search products..." 
                className="w-full pl-9"
                value={search}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
              />
            </div>
            <Select value={catFilter} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setCatFilter(e.target.value)}>
              <option value="all">All Categories</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </Select>
            <Select value={statusFilter} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setStatusFilter(e.target.value)}>
              <option value="all">All Statuses</option>
              <option value="Published">Published</option>
              <option value="Draft">Draft</option>
              <option value="Hidden">Hidden</option>
              <option value="Disabled">Disabled</option>
              <option value="Archived">Archived</option>
            </Select>
          </div>
          <Button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2">
            <Plus className="h-4 w-4" /> Create Product
          </Button>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 text-gray-500 font-medium border-b">
              <tr>
                <th className="px-6 py-4">Product Name</th>
                <th className="px-6 py-4">Category</th>
                <th className="px-6 py-4">Price</th>
                <th className="px-6 py-4">Status & Demo</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filtered.map((prod) => (
                <tr key={prod.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="font-medium text-gray-900">{prod.name}</div>
                    <div className="text-gray-500 text-xs mt-0.5 truncate max-w-[200px]">{prod.short_description || 'No description'}</div>
                  </td>
                  <td className="px-6 py-4 text-gray-600">
                    {prod.category?.name || '-'}
                  </td>
                  <td className="px-6 py-4 font-medium text-gray-900">
                    {prod.price} {prod.currency}
                    {prod.is_one_time_payment && <span className="block text-xs text-gray-500 font-normal mt-0.5">One-time</span>}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1.5 text-xs px-2 py-1 rounded-full font-medium ${
                      prod.status === 'Published' ? 'bg-green-100 text-green-700' :
                      prod.status === 'Draft' ? 'bg-gray-100 text-gray-700' :
                      prod.status === 'Archived' ? 'bg-orange-100 text-orange-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {prod.status}
                    </span>
                    {prod.demo_status === 'Enabled' && (
                      <a href={prod.demo_url} target="_blank" rel="noreferrer" className="mt-2 flex items-center gap-1 text-xs text-blue-600 hover:underline">
                        <PlayCircle className="h-3 w-3" /> Preview Demo
                      </a>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right space-x-2">
                    <Link href={`/admin/products/${prod.id}`}>
                      <Button variant="outline" size="sm">Manage</Button>
                    </Link>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={5} className="p-8 text-center text-gray-500">No products found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
            <div className="px-6 py-4 border-b"><h3 className="font-semibold text-gray-900">Create New Product</h3></div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Product Name *</label>
                <Input name="name" required />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Short Description</label>
                <Input name="short_description" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Category *</label>
                <Select name="category_id" required>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Base Price (INR) *</label>
                <Input name="price" type="number" step="0.01" min="0" required defaultValue="0" />
              </div>
              <div className="pt-4 border-t flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={loading}>{loading ? 'Creating...' : 'Create'}</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
