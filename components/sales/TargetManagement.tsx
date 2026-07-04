'use client'

import { useState } from 'react'
import { Card } from '@/components/Card'
import { Input } from '@/components/Input'
import { Button } from '@/components/Button'
import { Loader2 } from 'lucide-react'
import { assignTarget } from '@/app/actions/sales'

export function TargetManagement({ execId, targets }: { execId: string, targets: any[] }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleAssign = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    const formData = new FormData(e.currentTarget)
    formData.append('sales_exec_id', execId)
    const res = await assignTarget(formData)

    if (res.error) {
      setError(res.error)
    } else {
      (e.target as HTMLFormElement).reset()
    }
    setLoading(false)
  }

  return (
    <Card className="p-6 bg-white dark:bg-gray-900 shadow-sm border border-gray-100 dark:border-gray-800">
      <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Target Management</h3>
      
      {error && (
        <div className="p-3 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg text-sm font-medium mb-4">
          {error}
        </div>
      )}

      <form onSubmit={handleAssign} className="mb-6 grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Period</label>
          <select name="period" required className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-gray-900 dark:text-white">
            <option value="Monthly">Monthly</option>
            <option value="Quarterly">Quarterly</option>
            <option value="Yearly">Yearly</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Start Date</label>
          <Input type="date" name="start_date" required />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">End Date</label>
          <Input type="date" name="end_date" required />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Target Amount (₹)</label>
          <div className="flex gap-2">
            <Input type="number" name="target_amount" min="0" step="1000" required />
            <Button type="submit" disabled={loading} className="shrink-0">
              {loading ? <Loader2 className="animate-spin h-4 w-4" /> : 'Assign'}
            </Button>
          </div>
        </div>
      </form>

      <div className="space-y-3">
        <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Current Targets</h4>
        {targets && targets.length > 0 ? targets.map((t: any) => {
          const progress = t.target_amount > 0 ? (t.completed_amount / t.target_amount) * 100 : 0
          return (
            <div key={t.id} className="p-4 border border-gray-100 dark:border-gray-800 rounded-lg bg-gray-50 dark:bg-gray-800/50">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-gray-900 dark:text-white">{t.period} Target</span>
                <span className="text-xs text-gray-500">{new Date(t.start_date).toLocaleDateString()} - {new Date(t.end_date).toLocaleDateString()}</span>
              </div>
              <div className="flex justify-between text-sm mb-1 text-gray-600 dark:text-gray-300">
                <span>₹{t.completed_amount.toLocaleString()} / ₹{t.target_amount.toLocaleString()}</span>
                <span>{progress.toFixed(1)}%</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                <div 
                  className={`h-1.5 rounded-full ${progress >= 100 ? 'bg-green-500' : 'bg-blue-600'}`} 
                  style={{ width: `${Math.min(progress, 100)}%` }}
                />
              </div>
            </div>
          )
        }) : (
          <p className="text-sm text-gray-500 text-center py-4">No targets assigned yet.</p>
        )}
      </div>
    </Card>
  )
}
