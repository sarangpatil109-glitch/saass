'use client'

import { useState } from 'react'
import { Card } from '@/components/Card'
import { Button } from '@/components/Button'
import { Input } from '@/components/Input'
import { Select } from '@/components/Select'
import { updateProductDetails, updateProductPricing, updateProductDemo, createProductVersion, markVersionStable, updateProductStatus } from '@/app/actions/product'
import { ArrowLeft, Save, Star } from 'lucide-react'
import Link from 'next/link'

export function ProductDetailClient({ product, versions, categories }: { product: any, versions: any[], categories: any[] }) {
  const [activeTab, setActiveTab] = useState('general')
  const [loading, setLoading] = useState(false)
  const [isVersionModalOpen, setIsVersionModalOpen] = useState(false)

  const handleGeneralSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    const formData = new FormData(e.currentTarget)
    const res = await updateProductDetails(product.id, formData)
    if (res.error) alert(res.error)
    setLoading(false)
  }

  const handlePricingSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    const price = parseFloat((e.currentTarget.elements.namedItem('price') as HTMLInputElement).value)
    const currency = (e.currentTarget.elements.namedItem('currency') as HTMLSelectElement).value
    const is_one_time = (e.currentTarget.elements.namedItem('is_one_time') as HTMLSelectElement).value === 'true'
    const res = await updateProductPricing(product.id, price, currency, is_one_time)
    if (res.error) alert(res.error)
    else alert('Pricing updated. Only future sales will be affected.')
    setLoading(false)
  }

  const handleDemoSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    const url = (e.currentTarget.elements.namedItem('demo_url') as HTMLInputElement).value
    const status = (e.currentTarget.elements.namedItem('demo_status') as HTMLSelectElement).value
    const res = await updateProductDemo(product.id, url, status)
    if (res.error) alert(res.error)
    setLoading(false)
  }

  const handleVersionSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    const formData = new FormData(e.currentTarget)
    formData.append('product_id', product.id)
    const res = await createProductVersion(formData)
    if (res.error) alert(res.error)
    else {
      setIsVersionModalOpen(false)
      window.location.reload()
    }
    setLoading(false)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin/products" className="p-2 bg-white rounded-lg shadow-sm border text-gray-500 hover:text-gray-900">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{product.name}</h1>
          <p className="text-sm text-gray-500">{product.status} • {product.category?.name}</p>
        </div>
      </div>

      <div className="flex gap-4 border-b">
        {['general', 'versions', 'pricing', 'demo'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`pb-3 px-1 text-sm font-medium capitalize border-b-2 ${activeTab === tab ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
          >
            {tab}
          </button>
        ))}
      </div>

      <Card className="p-6">
        {activeTab === 'general' && (
          <form onSubmit={handleGeneralSubmit} className="space-y-6 max-w-2xl">
            <div><label className="block text-sm font-medium mb-1">Product Name</label><Input name="name" defaultValue={product.name} required /></div>
            <div><label className="block text-sm font-medium mb-1">Category</label>
              <Select name="category_id" defaultValue={product.category_id}>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </Select>
            </div>
            <div><label className="block text-sm font-medium mb-1">Short Description</label><Input name="short_description" defaultValue={product.short_description} /></div>
            <div><label className="block text-sm font-medium mb-1">Full Description</label><textarea name="full_description" defaultValue={product.full_description} rows={4} className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border" /></div>
            <div className="pt-4 border-t"><Button type="submit" disabled={loading} className="flex gap-2 items-center"><Save className="h-4 w-4"/> {loading ? 'Saving...' : 'Save Changes'}</Button></div>
          </form>
        )}

        {activeTab === 'pricing' && (
          <form onSubmit={handlePricingSubmit} className="space-y-6 max-w-2xl">
            <div className="bg-blue-50 p-4 rounded-lg text-sm text-blue-800 border border-blue-100 mb-6">
              <strong>Note:</strong> Pricing updates only affect future transactions. Historical commission records remain permanently unchanged.
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><label className="block text-sm font-medium mb-1">Base Price</label><Input name="price" type="number" step="0.01" min="0" defaultValue={product.price} required /></div>
              <div><label className="block text-sm font-medium mb-1">Currency</label>
                <Select name="currency" defaultValue={product.currency || 'INR'}>
                  <option value="INR">INR (₹)</option>
                  <option value="USD">USD ($)</option>
                  <option value="EUR">EUR (€)</option>
                </Select>
              </div>
            </div>
            <div><label className="block text-sm font-medium mb-1">Payment Type</label>
              <Select name="is_one_time" defaultValue={product.is_one_time_payment?.toString() || "true"}>
                <option value="true">One-Time Payment</option>
                <option value="false">Recurring Subscription</option>
              </Select>
            </div>
            <div className="pt-4 border-t"><Button type="submit" disabled={loading} className="flex gap-2 items-center"><Save className="h-4 w-4"/> {loading ? 'Saving...' : 'Save Pricing'}</Button></div>
          </form>
        )}

        {activeTab === 'demo' && (
          <form onSubmit={handleDemoSubmit} className="space-y-6 max-w-2xl">
            <div><label className="block text-sm font-medium mb-1">Demo Website URL</label><Input name="demo_url" type="url" placeholder="https://" defaultValue={product.demo_url} /></div>
            <div><label className="block text-sm font-medium mb-1">Demo Status</label>
              <Select name="demo_status" defaultValue={product.demo_status || 'Disabled'}>
                <option value="Enabled">Enabled</option>
                <option value="Disabled">Disabled</option>
              </Select>
            </div>
            <div className="pt-4 border-t"><Button type="submit" disabled={loading} className="flex gap-2 items-center"><Save className="h-4 w-4"/> {loading ? 'Saving...' : 'Save Demo Settings'}</Button></div>
          </form>
        )}

        {activeTab === 'versions' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium text-gray-900">Version History</h3>
              <Button onClick={() => setIsVersionModalOpen(true)}>Create New Version</Button>
            </div>
            
            <div className="border rounded-lg overflow-hidden">
              <table className="w-full text-sm text-left">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-4 py-3">Version</th>
                    <th className="px-4 py-3">Release Date</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Notes</th>
                    <th className="px-4 py-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {versions.length === 0 ? (
                    <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-500">No versions defined.</td></tr>
                  ) : versions.map(v => (
                    <tr key={v.id} className={v.is_current_stable ? 'bg-blue-50/50' : ''}>
                      <td className="px-4 py-3 font-medium">v{v.version_string}</td>
                      <td className="px-4 py-3">{new Date(v.release_date).toLocaleDateString()}</td>
                      <td className="px-4 py-3">
                        {v.is_current_stable ? <span className="inline-flex items-center gap-1 text-xs text-blue-700 bg-blue-100 px-2 py-1 rounded-full"><Star className="h-3 w-3" /> Stable</span> : <span className="text-gray-500">Archived</span>}
                      </td>
                      <td className="px-4 py-3 max-w-[200px] truncate text-gray-500" title={v.release_notes}>{v.release_notes || '-'}</td>
                      <td className="px-4 py-3 text-right">
                        {!v.is_current_stable && (
                          <Button variant="outline" size="sm" onClick={() => markVersionStable(v.id, product.id)}>Set as Stable</Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </Card>

      {/* Version Modal */}
      {isVersionModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
            <div className="px-6 py-4 border-b"><h3 className="font-semibold text-gray-900">Create New Version</h3></div>
            <form onSubmit={handleVersionSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-3 gap-2">
                <div><label className="block text-xs font-medium mb-1">Major</label><Input name="major" type="number" min="0" required defaultValue="1" /></div>
                <div><label className="block text-xs font-medium mb-1">Minor</label><Input name="minor" type="number" min="0" required defaultValue="0" /></div>
                <div><label className="block text-xs font-medium mb-1">Patch</label><Input name="patch" type="number" min="0" required defaultValue="0" /></div>
              </div>
              <div><label className="block text-sm font-medium mb-1">Release Notes</label><textarea name="release_notes" rows={3} className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border" /></div>
              <div className="flex items-center gap-2">
                <input type="checkbox" name="is_stable" id="is_stable" className="rounded border-gray-300" defaultChecked />
                <label htmlFor="is_stable" className="text-sm font-medium text-gray-700">Set as Current Stable Version</label>
              </div>
              <div className="pt-4 border-t flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setIsVersionModalOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={loading}>{loading ? 'Creating...' : 'Create Version'}</Button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  )
}
