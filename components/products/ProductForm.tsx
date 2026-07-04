'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createProduct, updateProduct } from '@/app/actions/product'
import { Card } from '@/components/Card'
import { Input } from '@/components/Input'
import { Button } from '@/components/Button'
import { Loader2 } from 'lucide-react'
import Link from 'next/link'

export function ProductForm({ initialData }: { initialData?: any }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const isEdit = !!initialData

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    const formData = new FormData(e.currentTarget)
    
    // Quick validation
    if (!formData.get('name')) {
      setError('Product name is required')
      setLoading(false)
      return
    }

    const priceMonthly = Number(formData.get('price_monthly'))
    const priceYearly = Number(formData.get('price_yearly'))

    if (priceMonthly < 0 || priceYearly < 0) {
      setError('Prices cannot be negative')
      setLoading(false)
      return
    }

    const version = formData.get('version') as string
    if (version && !/^v\d+\.\d+\.\d+$/.test(version)) {
      setError('Version format must be like v1.0.0')
      setLoading(false)
      return
    }

    const res = isEdit 
      ? await updateProduct(initialData.id, formData)
      : await createProduct(formData)

    if (res.error) {
      setError(res.error)
      setLoading(false)
    } else {
      router.push('/dashboard/products')
      router.refresh()
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-4xl">
      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg text-sm font-medium">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <Card className="p-6 bg-white dark:bg-gray-900 shadow-sm border border-gray-100 dark:border-gray-800">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Basic Details</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Product Name *</label>
                <Input name="name" defaultValue={initialData?.name} placeholder="e.g. Premium Gym Management" required />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
                <textarea 
                  name="description" 
                  defaultValue={initialData?.description} 
                  rows={5}
                  className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all text-gray-900 dark:text-white resize-none"
                  placeholder="Detailed feature list and description..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Category</label>
                <Input name="category" defaultValue={initialData?.category} placeholder="e.g. Gym, Salon, Clinic" />
              </div>
            </div>
          </Card>

          <Card className="p-6 bg-white dark:bg-gray-900 shadow-sm border border-gray-100 dark:border-gray-800">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Pricing</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Monthly Price *</label>
                <Input type="number" step="0.01" min="0" name="price_monthly" defaultValue={initialData?.price_monthly || 0} required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Yearly Price *</label>
                <Input type="number" step="0.01" min="0" name="price_yearly" defaultValue={initialData?.price_yearly || 0} required />
              </div>
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="p-6 bg-white dark:bg-gray-900 shadow-sm border border-gray-100 dark:border-gray-800">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Organization</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Status</label>
                <select name="status" defaultValue={initialData?.status || 'Draft'} className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-gray-900 dark:text-white">
                  <option value="Draft">Draft</option>
                  <option value="Published">Published</option>
                  <option value="Archived">Archived</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Version</label>
                <Input name="version" defaultValue={initialData?.version || 'v1.0.0'} placeholder="v1.0.0" />
              </div>
            </div>
          </Card>

          <Card className="p-6 bg-white dark:bg-gray-900 shadow-sm border border-gray-100 dark:border-gray-800">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Media & Files</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Logo Upload</label>
                <input type="file" name="logo" accept="image/*" className="w-full text-sm text-gray-500 dark:text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 dark:file:bg-gray-800 dark:file:text-gray-300" />
                {initialData?.logo_url && (
                  <a href={initialData.logo_url} target="_blank" rel="noreferrer" className="text-xs text-blue-500 hover:underline mt-1 block">View current logo</a>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">ZIP Template Upload</label>
                <input type="file" name="zip_template" accept=".zip" className="w-full text-sm text-gray-500 dark:text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 dark:file:bg-gray-800 dark:file:text-gray-300" />
                {initialData?.zip_template && (
                  <a href={initialData.zip_template} target="_blank" rel="noreferrer" className="text-xs text-blue-500 hover:underline mt-1 block">Download current ZIP</a>
                )}
              </div>
            </div>
          </Card>
        </div>
      </div>

      <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-800">
        <Link href="/dashboard/products">
          <Button type="button" variant="outline">Cancel</Button>
        </Link>
        <Button type="submit" disabled={loading} className="min-w-[120px]">
          {loading ? <Loader2 className="animate-spin h-4 w-4 mr-2" /> : null}
          {isEdit ? 'Save Changes' : 'Create Product'}
        </Button>
      </div>
    </form>
  )
}
