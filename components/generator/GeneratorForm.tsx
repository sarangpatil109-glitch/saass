'use client'

import { useState } from 'react'
import { Card } from '@/components/Card'
import { Input } from '@/components/Input'
import { Button } from '@/components/Button'
import { Loader2 } from 'lucide-react'
import { createGenerationJob } from '@/app/actions/generator'

export function GeneratorForm({ customers, products, templates, orderId, defaultProductId, defaultCustomerId }: { customers: any[], products: any[], templates: any[], orderId?: string, defaultProductId?: string, defaultCustomerId?: string }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [selectedProduct, setSelectedProduct] = useState(defaultProductId || '')

  const filteredTemplates = templates.filter(t => t.product_id === selectedProduct && t.status === 'Published')

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    const formData = new FormData(e.currentTarget)
    const res = await createGenerationJob(formData)

    if (res.error) {
      setError(res.error)
      setLoading(false)
    } else {
      // Reload is handled by revalidatePath in action, just clear loading
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg text-sm font-medium">
          {error}
        </div>
      )}

      <Card className="p-6 bg-white dark:bg-gray-900 shadow-sm border border-gray-100 dark:border-gray-800">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Instance Configuration</h3>
        
        {orderId && <input type="hidden" name="order_id" value={orderId} />}
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Select Target Customer *</label>
            <select name="customer_id" required defaultValue={defaultCustomerId} disabled={!!orderId} className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-gray-900 dark:text-white disabled:opacity-50">
              <option value="">-- Choose Customer --</option>
              {customers.map(c => (
                <option key={c.id} value={c.id}>{c.business_name} ({c.owner_name})</option>
              ))}
            </select>
            {orderId && <input type="hidden" name="customer_id" value={defaultCustomerId} />}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Select Product Base *</label>
            <select name="product_id" required value={selectedProduct} disabled={!!orderId} onChange={(e) => setSelectedProduct(e.target.value)} className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-gray-900 dark:text-white disabled:opacity-50">
              <option value="">-- Choose Product --</option>
              {products.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
            {orderId && <input type="hidden" name="product_id" value={defaultProductId} />}
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Select Template Version *</label>
            <select name="template_id" required disabled={!selectedProduct} className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-gray-900 dark:text-white disabled:opacity-50">
              <option value="">{selectedProduct ? '-- Choose Template --' : 'Select Product First'}</option>
              {filteredTemplates.map(t => (
                <option key={t.id} value={t.id}>Version {t.template_version}</option>
              ))}
            </select>
          </div>
        </div>

        <hr className="border-gray-100 dark:border-gray-800 my-6" />

        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Branding Data</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">App Business Name *</label>
            <Input name="business_name" required placeholder="Display Name in App" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Owner Name *</label>
            <Input name="owner_name" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Support Email *</label>
            <Input type="email" name="email" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Support Phone *</label>
            <Input type="tel" name="phone" required />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Address Line</label>
            <Input name="address" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">City</label>
            <Input name="city" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">State</label>
            <Input name="state" />
          </div>
        </div>
      </Card>

      <div className="flex justify-end">
        <Button type="submit" disabled={loading} className="min-w-[180px]">
          {loading ? <Loader2 className="animate-spin h-4 w-4 mr-2" /> : null}
          Queue Generation
        </Button>
      </div>
    </form>
  )
}
