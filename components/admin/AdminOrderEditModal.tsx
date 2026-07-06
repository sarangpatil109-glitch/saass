'use client'

import { useState, useEffect } from 'react'
import { editOrder } from '@/app/actions/sales_orders'
import { Button } from '@/components/Button'
import { Input } from '@/components/Input'
import { useRouter } from 'next/navigation'

export default function AdminOrderEditModal({ order, onClose }: { order: any, onClose: () => void }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [execComm, setExecComm] = useState(0)
  const [vendorComm, setVendorComm] = useState(0)
  const [price, setPrice] = useState(order.product_price || 0)
  const [commissionPct, setCommissionPct] = useState(10)
  const router = useRouter()

  useEffect(() => {
    // When price or commission % changes, auto-recalculate projections
    const execC = price * (commissionPct / 100)
    const venC = execC * 0.10
    setExecComm(execC)
    setVendorComm(venC)
  }, [price, commissionPct])

  async function handleSubmit(formData: FormData) {
    setLoading(true)
    setError(null)
    const result = await editOrder(order.id, formData)
    setLoading(false)
    if (result.error) {
      setError(result.error)
    } else {
      router.refresh()
      onClose()
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white dark:bg-gray-900 rounded-xl max-w-2xl w-full shadow-xl max-h-[90vh] flex flex-col">
        <div className="p-6 border-b dark:border-gray-800 flex justify-between items-center">
          <h2 className="text-xl font-bold">Edit Order {order.order_number}</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-800">&times;</button>
        </div>
        <form action={handleSubmit} className="p-6 overflow-y-auto flex-1 space-y-4">
          {error && <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm">{error}</div>}
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Customer Name</label>
              <Input name="customer_name" defaultValue={order.customer_name} required />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Business Name</label>
              <Input name="business_name" defaultValue={order.business_name} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Phone</label>
              <Input name="phone" defaultValue={order.phone} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Email</label>
              <Input type="email" name="email" defaultValue={order.email} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mt-4">
             <div>
              <label className="block text-sm font-medium mb-1">Product Price</label>
              <Input name="product_price" type="number" step="0.01" value={price} onChange={e => setPrice(Number(e.target.value))} required />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Status</label>
              <select name="status" defaultValue={order.status} className="w-full px-3 py-2 border rounded-lg bg-gray-50 dark:bg-gray-800 dark:border-gray-700">
                <option value="Pending">Pending</option>
                <option value="Approved">Approved</option>
                <option value="Rejected">Rejected</option>
              </select>
            </div>
          </div>

          <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg mt-4">
            <h3 className="font-bold mb-3">Commission Settings</h3>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm text-gray-500 mb-1">Exec Commission %</label>
                <Input name="percentage" type="number" step="0.01" value={commissionPct} onChange={e => setCommissionPct(Number(e.target.value))} />
              </div>
              <div>
                <label className="block text-sm text-gray-500 mb-1">Exec Commission</label>
                <div className="py-2 font-medium text-blue-600">₹{execComm.toFixed(2)}</div>
              </div>
              <div>
                <label className="block text-sm text-gray-500 mb-1">Vendor Commission (10%)</label>
                <div className="py-2 font-medium text-green-600">₹{vendorComm.toFixed(2)}</div>
              </div>
            </div>
            <p className="text-xs text-gray-400 mt-2">If this order is already Approved, saving these changes will immediately recalculate and update existing commissions.</p>
          </div>

          <div className="pt-4 flex justify-end gap-3 border-t dark:border-gray-800 mt-4">
            <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={loading}>{loading ? 'Saving...' : 'Save Changes'}</Button>
          </div>
        </form>
      </div>
    </div>
  )
}
