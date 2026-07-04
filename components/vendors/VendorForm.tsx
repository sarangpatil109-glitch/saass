'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createVendor, updateVendor } from '@/app/actions/vendor'
import { Card } from '@/components/Card'
import { Input } from '@/components/Input'
import { Button } from '@/components/Button'
import { Loader2, Upload } from 'lucide-react'
import Link from 'next/link'

export function VendorForm({ initialData }: { initialData?: any }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const isEdit = !!initialData

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    const formData = new FormData(e.currentTarget)
    
    if (!formData.get('business_name') || !formData.get('email') || !formData.get('phone')) {
      setError('Business Name, Email, and Phone are required')
      setLoading(false)
      return
    }

    const res = isEdit 
      ? await updateVendor(initialData.id, formData)
      : await createVendor(formData)

    if (res.error) {
      setError(res.error)
      setLoading(false)
    } else {
      router.push('/dashboard/vendors')
      router.refresh()
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-5xl">
      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg text-sm font-medium">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6 bg-white dark:bg-gray-900 shadow-sm border border-gray-100 dark:border-gray-800">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Basic Information</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Business Name *</label>
              <Input name="business_name" defaultValue={initialData?.business_name} placeholder="Acme Corp" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Owner Name *</label>
              <Input name="owner_name" defaultValue={initialData?.owner_name} placeholder="John Doe" required />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email *</label>
                <Input type="email" name="email" defaultValue={initialData?.email} placeholder="john@example.com" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Phone *</label>
                <Input type="tel" name="phone" defaultValue={initialData?.phone} placeholder="+91 9876543210" required />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">GST Number</label>
                <Input name="gst_number" defaultValue={initialData?.gst_number} placeholder="22AAAAA0000A1Z5" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Vendor Code</label>
                <Input name="vendor_code" defaultValue={initialData?.vendor_code} placeholder="Leave empty to auto-generate" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Company Logo</label>
              <div className="flex items-center gap-3">
                <input type="file" name="logo" accept="image/*" className="block w-full text-sm text-gray-500 dark:text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 dark:file:bg-blue-900/30 dark:file:text-blue-400" />
              </div>
              {initialData?.logo_url && (
                <div className="mt-2">
                  <img src={initialData.logo_url} alt="Logo" className="h-12 w-12 object-cover rounded" />
                </div>
              )}
            </div>
            {isEdit && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Status</label>
                <select name="status" defaultValue={initialData?.status} className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-gray-900 dark:text-white">
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                  <option value="Suspended">Suspended</option>
                  <option value="Archived">Archived</option>
                </select>
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Notes</label>
              <textarea 
                name="notes" 
                defaultValue={initialData?.notes} 
                rows={3}
                className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all text-gray-900 dark:text-white resize-none"
                placeholder="Additional notes about this vendor..."
              />
            </div>
          </div>
        </Card>

        <div className="space-y-6">
          <Card className="p-6 bg-white dark:bg-gray-900 shadow-sm border border-gray-100 dark:border-gray-800">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Location Details</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Address</label>
                <textarea 
                  name="address" 
                  defaultValue={initialData?.address} 
                  rows={2}
                  className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all text-gray-900 dark:text-white resize-none"
                  placeholder="Street address..."
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">City</label>
                  <Input name="city" defaultValue={initialData?.city} placeholder="Mumbai" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">State</label>
                  <Input name="state" defaultValue={initialData?.state} placeholder="Maharashtra" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Country</label>
                  <Input name="country" defaultValue={initialData?.country || 'India'} />
                </div>
              </div>
            </div>
          </Card>

          <Card className="p-6 bg-white dark:bg-gray-900 shadow-sm border border-gray-100 dark:border-gray-800">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Commission & Coupon</h3>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Commission Type</label>
                  <select name="commission_type" defaultValue={initialData?.commission_type || 'percentage'} className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-gray-900 dark:text-white">
                    <option value="percentage">Percentage</option>
                    <option value="fixed">Fixed Amount</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Commission Value</label>
                  <Input type="number" step="0.01" name="commission_value" defaultValue={initialData?.commission_value || 0} required />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Coupon Code</label>
                <Input name="coupon_code" defaultValue={initialData?.coupon_code} placeholder="Leave empty to auto-generate" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Coupon Discount Type</label>
                  <select name="coupon_discount_type" defaultValue={initialData?.coupon_discount_type || 'percentage'} className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-gray-900 dark:text-white">
                    <option value="percentage">Percentage</option>
                    <option value="fixed">Fixed Amount</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Coupon Discount Value</label>
                  <Input type="number" step="0.01" name="coupon_discount_value" defaultValue={initialData?.coupon_discount_value || 0} required />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Max Coupon Uses (0 for unlimited)</label>
                  <Input type="number" name="coupon_max_uses" defaultValue={initialData?.coupon_max_uses || 0} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Coupon Expiry Date</label>
                  <Input type="date" name="coupon_expiry_date" defaultValue={initialData?.coupon_expiry_date ? new Date(initialData.coupon_expiry_date).toISOString().split('T')[0] : ''} />
                </div>
              </div>

              {isEdit && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Coupon Status</label>
                  <select name="coupon_status" defaultValue={initialData?.coupon_status || 'Active'} className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-gray-900 dark:text-white">
                    <option value="Active">Active</option>
                    <option value="Expired">Expired</option>
                    <option value="Disabled">Disabled</option>
                  </select>
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>

      <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-800">
        <Link href="/dashboard/vendors">
          <Button type="button" variant="outline">Cancel</Button>
        </Link>
        <Button type="submit" disabled={loading} className="min-w-[120px]">
          {loading ? <Loader2 className="animate-spin h-4 w-4 mr-2" /> : null}
          {isEdit ? 'Save Changes' : 'Create Vendor'}
        </Button>
      </div>
    </form>
  )
}
