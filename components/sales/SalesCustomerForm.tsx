'use client'

import { useState, useEffect } from 'react'
import { submitCustomerOrder } from '@/app/actions/sales_orders'
import { Button } from '@/components/Button'
import { Input } from '@/components/Input'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'

export default function SalesCustomerForm({ onClose }: { onClose: () => void }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [products, setProducts] = useState<any[]>([])
  const [selectedProduct, setSelectedProduct] = useState<any>(null)
  const [price, setPrice] = useState('')
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [isPdf, setIsPdf] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    supabase.from('products')
      .select('id, name')
      .eq('is_active', true)
      .order('name', { ascending: true })
      .then(({ data }) => {
        if (data) setProducts(data)
      })
  }, [])

  const handleProductChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const p = products.find(p => p.id === e.target.value)
    setSelectedProduct(p)
    
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const url = URL.createObjectURL(file)
      setPreviewUrl(url)
      setIsPdf(file.type === 'application/pdf')
    } else {
      setPreviewUrl(null)
      setIsPdf(false)
    }
  }

  async function handleSubmit(formData: FormData) {
    setLoading(true)
    setError(null)
    const result = await submitCustomerOrder(formData)
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
      <div className="bg-white dark:bg-gray-900 rounded-xl max-w-md w-full shadow-xl">
        <div className="p-6 border-b dark:border-gray-800 flex justify-between items-center">
          <h2 className="text-xl font-bold">Add Customer (Pending Approval)</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-800">&times;</button>
        </div>
        <form action={handleSubmit} className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
          {error && <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm">{error}</div>}
          
          <div>
            <label className="block text-sm font-medium mb-1">Customer Name *</label>
            <Input name="customer_name" required />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Phone Number *</label>
            <Input name="phone" required />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Email Address</label>
            <Input type="email" name="email" />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Product</label>
            <select 
              name="product_id" 
              className="w-full px-3 py-2 border rounded-lg bg-gray-50 dark:bg-gray-800 dark:border-gray-700 outline-none focus:ring-2 focus:ring-blue-500"
              onChange={handleProductChange}
              required
            >
              {products.length === 0 ? (
                <option value="">No active products found.</option>
              ) : (
                <>
                  <option value="">Select a product...</option>
                  {products.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </>
              )}
            </select>
          </div>
          
          {selectedProduct && (
            <input type="hidden" name="product_name" value={selectedProduct.name} />
          )}

          <div>
            <label className="block text-sm font-medium mb-1">Product Price *</label>
            <Input name="product_price" type="number" step="0.01" value={price} onChange={e => setPrice(e.target.value)} required />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Payment Proof *</label>
            <input 
              type="file" 
              name="payment_proof" 
              accept=".jpg,.jpeg,.png,.webp,.pdf" 
              onChange={handleFileChange}
              required 
              className="block w-full text-sm text-gray-500 dark:text-gray-400
                file:mr-4 file:py-2 file:px-4
                file:rounded-md file:border-0
                file:text-sm file:font-semibold
                file:bg-blue-50 file:text-blue-700
                hover:file:bg-blue-100
                dark:file:bg-blue-900/30 dark:file:text-blue-400"
            />
            {previewUrl && (
              <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 flex flex-col items-center gap-2">
                <div className="text-sm font-medium text-green-600 dark:text-green-400 flex items-center">
                  ✓ Screenshot uploaded successfully
                </div>
                <a href={previewUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 text-sm hover:underline">
                  Preview {isPdf ? 'PDF' : 'Image'}
                </a>
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Notes</label>
            <textarea name="notes" className="w-full px-3 py-2 border rounded-lg bg-gray-50 dark:bg-gray-800 dark:border-gray-700 min-h-[100px]"></textarea>
          </div>

          <div className="pt-4 flex justify-end gap-3">
            <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={loading}>{loading ? 'Submitting...' : 'Submit Request'}</Button>
          </div>
        </form>
      </div>
    </div>
  )
}
