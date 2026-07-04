'use client'

import { useState } from 'react'
import { Button } from '@/components/Button'
import { Loader2, Trash2, PowerOff } from 'lucide-react'
import { deactivateDevice, removeDevice } from '@/app/actions/license'

export function DeviceActions({ deviceId, licenseId, status }: { deviceId: string, licenseId: string, status: string }) {
  const [loading, setLoading] = useState('')

  const handleDeactivate = async () => {
    if (!confirm('Deactivate this device? It will not be able to activate again without admin approval.')) return
    setLoading('deactivate')
    await deactivateDevice(deviceId, licenseId)
    setLoading('')
  }

  const handleRemove = async () => {
    if (!confirm('Permanently remove this device? This frees up an activation slot.')) return
    setLoading('remove')
    await removeDevice(deviceId, licenseId)
    setLoading('')
  }

  return (
    <div className="flex items-center gap-2">
      {status === 'Active' && (
        <Button 
          variant="outline" 
          size="sm"
          className="text-orange-600 hover:text-orange-700 hover:bg-orange-50 border-orange-200"
          onClick={handleDeactivate}
          disabled={loading !== ''}
        >
          {loading === 'deactivate' ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <PowerOff className="h-4 w-4 mr-1" />} 
          Deactivate
        </Button>
      )}
      <Button 
        variant="outline" 
        size="sm"
        className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
        onClick={handleRemove}
        disabled={loading !== ''}
      >
        {loading === 'remove' ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Trash2 className="h-4 w-4 mr-1" />} 
        Remove
      </Button>
    </div>
  )
}
