'use client'

import { useState } from 'react'
import { Card } from '@/components/Card'
import { Input } from '@/components/Input'
import { Button } from '@/components/Button'
import { Loader2 } from 'lucide-react'
import { updateVendorProfile } from '@/app/actions/vendor'

export function VendorProfileForm({ profile, userEmail }: { profile: any, userEmail: string }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setLoading(true)

    const formData = new FormData(e.currentTarget)
    const res = await updateVendorProfile(formData)

    if (res.error) {
      setError(res.error)
    } else {
      setSuccess('Profile updated successfully.')
    }
    setLoading(false)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-4xl">
      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg text-sm font-medium">
          {error}
        </div>
      )}
      {success && (
        <div className="p-4 bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-lg text-sm font-medium">
          {success}
        </div>
      )}

      <Card className="p-6 bg-white dark:bg-gray-900 shadow-sm border border-gray-100 dark:border-gray-800">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Contact Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Company Name</label>
            <Input defaultValue={profile.business_name} disabled className="bg-gray-100 dark:bg-gray-800 text-gray-500" />
            <p className="text-xs text-gray-400 mt-1">Contact admin to change company name.</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email</label>
            <Input defaultValue={userEmail} disabled className="bg-gray-100 dark:bg-gray-800 text-gray-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Phone Number</label>
            <Input type="tel" name="phone" defaultValue={profile.phone} required />
          </div>
        </div>
      </Card>

      <Card className="p-6 bg-white dark:bg-gray-900 shadow-sm border border-gray-100 dark:border-gray-800">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Location Details</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Address</label>
            <Input name="address" defaultValue={profile.address} />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">City</label>
              <Input name="city" defaultValue={profile.city} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">State</label>
              <Input name="state" defaultValue={profile.state} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">PIN Code</label>
              <Input name="pin_code" defaultValue={profile.pin_code} />
            </div>
          </div>
        </div>
      </Card>

      <Card className="p-6 bg-white dark:bg-gray-900 shadow-sm border border-gray-100 dark:border-gray-800">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">System Details</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Vendor Code</label>
            <div className="px-3 py-2 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-600 font-mono">
              {profile.vendor_code}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Coupon Code</label>
            <div className="px-3 py-2 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-600 font-mono">
              {profile.coupon_code}
            </div>
          </div>
        </div>
      </Card>

      <div className="flex justify-end">
        <Button type="submit" disabled={loading} className="min-w-[150px]">
          {loading ? <Loader2 className="animate-spin h-4 w-4 mr-2" /> : null}
          Update Profile
        </Button>
      </div>
    </form>
  )
}
