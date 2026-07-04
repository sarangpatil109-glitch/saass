'use client'

import { useState } from 'react'
import { Card } from '@/components/Card'
import { Input } from '@/components/Input'
import { Button } from '@/components/Button'
import { Loader2 } from 'lucide-react'
import { updateCommissionSettings } from '@/app/actions/commission'

export function CommissionSettingsForm({ currentSettings }: { currentSettings: any }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setLoading(true)

    const formData = new FormData(e.currentTarget)
    const res = await updateCommissionSettings(formData)

    if (res.error) {
      setError(res.error)
    } else {
      setSuccess('Settings updated successfully. They will apply to all FUTURE verified orders from the effective date.')
    }
    setLoading(false)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
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
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Update Default Rates</h3>
        <p className="text-sm text-gray-500 mb-6">These rates will only apply to new commissions created after the effective date. Historical commissions are strictly immutable.</p>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Sales Executive Commission (%)</label>
            <p className="text-xs text-gray-500 mb-2">Calculated as a percentage of the total Product Price.</p>
            <Input type="number" name="sales_commission_percentage" defaultValue={currentSettings?.sales_commission_percentage || 10} min="0" max="100" step="0.01" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Vendor Commission (%)</label>
            <p className="text-xs text-orange-600 dark:text-orange-400 mb-2 font-medium">IMPORTANT: Calculated as a percentage of the SALES EXECUTIVE'S Commission amount, NOT the Product Price.</p>
            <Input type="number" name="vendor_commission_percentage" defaultValue={currentSettings?.vendor_commission_percentage || 10} min="0" max="100" step="0.01" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Effective From Date</label>
            <Input type="date" name="effective_from" defaultValue={currentSettings?.effective_from || new Date().toISOString().split('T')[0]} required />
          </div>
        </div>
      </Card>

      <div className="flex justify-end">
        <Button type="submit" disabled={loading} className="min-w-[150px]">
          {loading ? <Loader2 className="animate-spin h-4 w-4 mr-2" /> : null}
          Save Settings
        </Button>
      </div>
    </form>
  )
}
