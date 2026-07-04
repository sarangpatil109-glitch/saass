'use client'

import { useState } from 'react'
import { Card } from '@/components/Card'
import { Input } from '@/components/Input'
import { Button } from '@/components/Button'
import { Loader2 } from 'lucide-react'
import { updateVendorProfile } from '@/app/actions/vendor'
import { updatePassword } from '@/app/actions/auth'

export function VendorSettingsForm({ profile }: { profile: any }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  
  const [pwdLoading, setPwdLoading] = useState(false)
  const [pwdError, setPwdError] = useState('')
  const [pwdSuccess, setPwdSuccess] = useState('')

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
      setSuccess('Settings updated successfully.')
    }
    setLoading(false)
  }

  const handlePasswordSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setPwdError('')
    setPwdSuccess('')
    setPwdLoading(true)

    const formData = new FormData(e.currentTarget)
    const res = await updatePassword(formData)

    if (res.error) {
      setPwdError(res.error)
    } else {
      setPwdSuccess('Password updated successfully.')
      e.currentTarget.reset()
    }
    setPwdLoading(false)
  }

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Account Settings Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
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
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Bank Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Bank Name</label>
              <Input name="bank_name" defaultValue={profile.bank_name || ''} placeholder="e.g. HDFC Bank" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Account Number</label>
              <Input name="account_number" defaultValue={profile.account_number || ''} placeholder="e.g. 50100012345678" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">IFSC Code</label>
              <Input name="ifsc_code" defaultValue={profile.ifsc_code || ''} placeholder="e.g. HDFC0001234" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">UPI ID</label>
              <Input name="upi_id" defaultValue={profile.upi_id || ''} placeholder="e.g. business@upi" />
            </div>
          </div>
        </Card>
        
        <Card className="p-6 bg-white dark:bg-gray-900 shadow-sm border border-gray-100 dark:border-gray-800">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Branding</h3>
          <div>
             <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Company Logo</label>
             {profile.logo_url && (
               <img src={profile.logo_url} alt="Logo" className="w-24 h-24 object-contain bg-gray-50 border rounded-lg mb-3" />
             )}
             <Input type="file" name="logo" accept="image/*" />
             <p className="text-xs text-gray-500 mt-1">Upload a new logo to replace the existing one.</p>
          </div>
        </Card>

        <div className="flex justify-end">
          <Button type="submit" disabled={loading} className="min-w-[150px]">
            {loading ? <Loader2 className="animate-spin h-4 w-4 mr-2" /> : null}
            Save Settings
          </Button>
        </div>
      </form>
      
      {/* Password Reset Form */}
      <form onSubmit={handlePasswordSubmit}>
        <Card className="p-6 bg-white dark:bg-gray-900 shadow-sm border border-gray-100 dark:border-gray-800">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Security Settings</h3>
          
          {pwdError && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg text-sm font-medium">
              {pwdError}
            </div>
          )}
          {pwdSuccess && (
            <div className="mb-4 p-3 bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-lg text-sm font-medium">
              {pwdSuccess}
            </div>
          )}
          
          <div className="max-w-md space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">New Password</label>
              <Input type="password" name="password" required minLength={6} />
            </div>
            <Button type="submit" disabled={pwdLoading}>
               {pwdLoading ? <Loader2 className="animate-spin h-4 w-4 mr-2" /> : null}
               Update Password
            </Button>
          </div>
        </Card>
      </form>
    </div>
  )
}
