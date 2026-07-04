'use client'

import { useState } from 'react'
import { Card } from '@/components/Card'
import { Button } from '@/components/Button'
import { Loader2 } from 'lucide-react'
import { generateLicense } from '@/app/actions/license'

export function GenerateLicenseForm({ orders, policies }: { orders: any[], policies: any[] }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    const formData = new FormData(e.currentTarget)
    const res = await generateLicense(formData)

    if (res.error) {
      setError(res.error)
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

      <Card className="p-6 bg-white dark:bg-gray-900 shadow-sm border border-gray-100 dark:border-gray-800">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Issue New License</h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Select Order *</label>
            <select name="order_id" required className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-gray-900 dark:text-white">
              <option value="">-- Choose Order --</option>
              {orders.map(o => {
                const prodName = Array.isArray(o.products) ? o.products[0]?.name : (o.products as any)?.name;
                const custName = Array.isArray(o.customers) ? o.customers[0]?.business_name : (o.customers as any)?.business_name;
                return (
                  <option key={o.id} value={o.id}>{o.order_number} - {custName} ({prodName})</option>
                )
              })}
            </select>
            <p className="text-xs text-gray-500 mt-1">Generates a license key attached to the order.</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Select License Policy *</label>
            <select name="policy_id" required className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-gray-900 dark:text-white">
              <option value="">-- Choose Policy --</option>
              {policies.map(p => (
                <option key={p.id} value={p.id}>{p.name} ({p.max_devices} Device{p.max_devices > 1 ? 's' : ''})</option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <Button type="submit" disabled={loading} className="min-w-[150px]">
            {loading ? <Loader2 className="animate-spin h-4 w-4 mr-2" /> : null}
            Generate Key
          </Button>
        </div>
      </Card>
    </form>
  )
}
