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
  const [confirmAccount, setConfirmAccount] = useState(profile.account_number || '')
  const [qrPreview, setQrPreview] = useState<string | null>(profile.upi_qr_url || null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError('File size must be less than 5MB')
        e.target.value = ''
        return
      }
      const reader = new FileReader()
      reader.onloadend = () => {
        setQrPreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setLoading(true)

    const formData = new FormData(e.currentTarget)
    
    const accountNum = formData.get('account_number') as string
    if (accountNum !== confirmAccount) {
      setError('Account numbers do not match')
      setLoading(false)
      return
    }
    const ifsc = formData.get('ifsc_code') as string
    if (ifsc && !/^[A-Z]{4}0[A-Z0-9]{6}$/.test(ifsc)) {
      setError('Invalid IFSC Code format')
      setLoading(false)
      return
    }
    const upi = formData.get('upi_id') as string
    if (upi && !/^[\w.-]+@[\w.-]+$/.test(upi)) {
      setError('Invalid UPI ID format')
      setLoading(false)
      return
    }
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
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Payment Details</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Account Holder Name *</label>
            <Input name="account_holder_name" defaultValue={profile.account_holder_name} required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Bank Name *</label>
            <Input name="bank_name" defaultValue={profile.bank_name} placeholder="e.g. HDFC Bank" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Account Number *</label>
            <Input name="account_number" defaultValue={profile.account_number} required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Confirm Account Number *</label>
            <Input value={confirmAccount} onChange={(e) => setConfirmAccount(e.target.value)} required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">IFSC Code *</label>
            <Input name="ifsc_code" defaultValue={profile.ifsc_code} placeholder="e.g. HDFC0001234" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">UPI ID</label>
            <Input name="upi_id" defaultValue={profile.upi_id} placeholder="e.g. name@okhdfcbank" />
          </div>
        </div>
        
        <div className="mt-6">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Upload UPI QR Code</label>
          {qrPreview && (
            <div className="mb-4">
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">QR Code Preview:</p>
              <img src={qrPreview} alt="UPI QR Code" className="max-w-[200px] border rounded-lg shadow-sm" />
              <Button type="button" variant="outline" size="sm" className="mt-2 text-red-600" onClick={() => {
                setQrPreview(null)
                const fileInput = document.querySelector('input[name="upi_qr"]') as HTMLInputElement
                if (fileInput) fileInput.value = ''
              }}>
                Remove QR Code
              </Button>
            </div>
          )}
          <input type="file" name="upi_qr" accept="image/png, image/jpeg, image/jpg" onChange={handleFileChange} className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" />
          <p className="text-xs text-gray-500 mt-2">Accepted formats: JPG, PNG. Max size: 5MB.</p>
        </div>
      </Card>
      
      <Card className="p-6 bg-white dark:bg-gray-900 shadow-sm border border-gray-100 dark:border-gray-800">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">System Details</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Vendor Code</label>
            <div className="px-3 py-2 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-600 font-mono">
              {profile.vendor_code}
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
