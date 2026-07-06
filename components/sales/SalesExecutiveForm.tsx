'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createSalesExecutive, updateSalesExecutive } from '@/app/actions/sales'
import { Card } from '@/components/Card'
import { Input } from '@/components/Input'
import { Button } from '@/components/Button'
import { Loader2 } from 'lucide-react'
import Link from 'next/link'

export function SalesExecutiveForm({ initialData, vendors = [] }: { initialData?: any, vendors?: any[] }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const isEdit = !!initialData

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    const formData = new FormData(e.currentTarget)
    
    if (!formData.get('first_name') || !formData.get('last_name') || !formData.get('email') || !formData.get('phone') || !formData.get('vendor_name')) {
      setError('Name, Email, Phone, and Vendor Name are required')
      setLoading(false)
      return
    }
    
    const commission = Number(formData.get('commission_percentage') || 0);
    const vendorName = (formData.get('vendor_name') as string) || '';
    if (vendorName.length < 2 || vendorName.length > 100) {
      setError('Vendor Name must be between 2 and 100 characters')
      setLoading(false)
      return
    }
    const target = Number(formData.get('monthly_target') || 0);
    if (commission < 0) {
      setError('Commission must be >= 0')
      setLoading(false)
      return
    }
    if (target < 0) {
      setError('Target must be >= 0')
      setLoading(false)
      return
    }

    const res = isEdit 
      ? await updateSalesExecutive(initialData.id, formData)
      : await createSalesExecutive(formData)

    if (res.error) {
      setError(res.error)
      setLoading(false)
    } else {
      router.push('/dashboard/sales-executives')
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
        <div className="space-y-6">
          <Card className="p-6 bg-white dark:bg-gray-900 shadow-sm border border-gray-100 dark:border-gray-800">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Basic Information</h3>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">First Name *</label>
                  <Input name="first_name" defaultValue={initialData?.first_name} placeholder="John" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Last Name *</label>
                  <Input name="last_name" defaultValue={initialData?.last_name} placeholder="Doe" required />
                </div>
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
              
              {!isEdit && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Password *</label>
                  <Input type="password" name="password" placeholder="Min 6 characters" required minLength={6} />
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Employee ID</label>
                  <Input name="employee_code" defaultValue={initialData?.employee_code} placeholder="Leave blank to auto-generate" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Profile Photo (URL)</label>
                  <Input name="profile_photo" defaultValue={initialData?.profile_photo} placeholder="https://..." />
                </div>
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
            </div>
          </Card>

          <Card className="p-6 bg-white dark:bg-gray-900 shadow-sm border border-gray-100 dark:border-gray-800">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Job Details</h3>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Designation</label>
                  <Input name="designation" defaultValue={initialData?.designation || 'Sales Executive'} placeholder="Sales Executive" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Joining Date</label>
                  <Input type="date" name="joining_date" defaultValue={initialData?.joining_date ? new Date(initialData.joining_date).toISOString().split('T')[0] : ''} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Monthly Target (₹)</label>
                  <Input type="number" name="monthly_target" defaultValue={initialData?.monthly_target || 0} min="0" step="0.01" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Commission %</label>
                  <Input type="number" name="commission_percentage" defaultValue={initialData?.commission_percentage || 10} min="0" max="100" step="0.01" />
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Vendor Name *</label>
                  <Input name="vendor_name" defaultValue={initialData?.vendor_name} placeholder="Enter Vendor Name" required minLength={2} maxLength={100} />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Notes</label>
                <textarea name="notes" defaultValue={initialData?.notes} className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-gray-900 dark:text-white" rows={3}></textarea>
              </div>
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="p-6 bg-white dark:bg-gray-900 shadow-sm border border-gray-100 dark:border-gray-800">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Vendor Assignment</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Select the vendor to assign this Sales Executive to.</p>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Select Vendor</label>
                <select name="vendor_id" defaultValue={initialData?.vendor_id || ''} className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-gray-900 dark:text-white">
                  <option value="">-- Select a Vendor --</option>
                  {vendors.map(v => (
                    <option key={v.id} value={v.id}>{v.business_name} ({v.vendor_code})</option>
                  ))}
                </select>
              </div>

              {isEdit && (
                <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-sm text-blue-700 dark:text-blue-400">
                  Currently mapped to: <span className="font-mono font-bold">{initialData.vendor_code}</span>
                </div>
              )}
            </div>
          </Card>

          <Card className="p-6 bg-white dark:bg-gray-900 shadow-sm border border-gray-100 dark:border-gray-800">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Location Details</h3>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Address</label>
                  <Input name="address" defaultValue={initialData?.address} placeholder="Street address..." />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">City</label>
                  <Input name="city" defaultValue={initialData?.city} placeholder="Mumbai" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">State</label>
                  <Input name="state" defaultValue={initialData?.state} placeholder="Maharashtra" />
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>

      <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-800">
        <Link href="/dashboard/sales-executives">
          <Button type="button" variant="outline">Cancel</Button>
        </Link>
        <Button type="submit" disabled={loading} className="min-w-[120px]">
          {loading ? <Loader2 className="animate-spin h-4 w-4 mr-2" /> : null}
          {isEdit ? 'Save Changes' : 'Create Executive'}
        </Button>
      </div>
    </form>
  )
}
