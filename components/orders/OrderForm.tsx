'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/Card'
import { Button } from '@/components/Button'
import { Loader2 } from 'lucide-react'
import { createOrder } from '@/app/actions/payment'
import { useRouter } from 'next/navigation'

export function OrderForm({ customers, products }: { customers: any[], products: any[] }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    const formData = new FormData(e.currentTarget)
    const res = await createOrder(formData)
    if (res.error) {
      setError(res.error)
    } else if (res.checkoutUrl) {
      // redirect to Cashfree checkout
      window.location.href = res.checkoutUrl
    }
    setLoading(false)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg text-sm font-medium">
          {error}
        </div>
      )}
      <Card className="p-6 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800">
        <h3 className="text-lg font-bold mb-4 text-gray-900 dark:text-white">Create New Order</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Customer *</label>
            <select name="customer_id" required className="w-full p-2 border rounded bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white">
              <option value="">-- Choose Customer --</option>
              {customers.map(c => (
                <option key={c.id} value={c.id}>{c.business_name} ({c.owner_name})</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Product *</label>
            <select name="product_id" required className="w-full p-2 border rounded bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white">
              <option value="">-- Choose Product --</option>
              {products.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Business Name *</label>
            <input name="business_name" required className="w-full p-2 border rounded bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Amount *</label>
            <input type="number" step="0.01" name="amount" required className="w-full p-2 border rounded bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Discount</label>
            <input type="number" step="0.01" name="discount" defaultValue="0" className="w-full p-2 border rounded bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tax</label>
            <input type="number" step="0.01" name="tax" defaultValue="0" className="w-full p-2 border rounded bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Currency</label>
            <input name="currency" defaultValue="INR" className="w-full p-2 border rounded bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Customer Email</label>
            <input type="email" name="email" required className="w-full p-2 border rounded bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Customer Phone</label>
            <input type="tel" name="phone" required className="w-full p-2 border rounded bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white" />
          </div>
        </div>
        <div className="mt-6 flex justify-end">
          <Button type="submit" disabled={loading} className="min-w-[150px]">
            {loading ? <Loader2 className="animate-spin h-4 w-4 mr-2" /> : null}
            Create Order
          </Button>
        </div>
      </Card>
    </form>
  )
}
