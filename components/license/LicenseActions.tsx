'use client'

import { useState } from 'react'
import { Button } from '@/components/Button'
import { Loader2, Ban, Play, RefreshCcw } from 'lucide-react'
import { updateLicenseStatus } from '@/app/actions/license'

export function LicenseActions({ license }: { license: any }) {
  const [loading, setLoading] = useState('')

  const handleStatusChange = async (newStatus: string) => {
    if (!confirm(`Are you sure you want to change status to ${newStatus}?`)) return
    setLoading(newStatus)
    await updateLicenseStatus(license.id, newStatus)
    setLoading('')
  }

  return (
    <div className="flex items-center gap-2">
      {license.status === 'Suspended' ? (
        <Button 
          variant="outline" 
          size="sm"
          className="text-green-600 hover:text-green-700 hover:bg-green-50 border-green-200"
          onClick={() => handleStatusChange('Active')}
          disabled={loading !== ''}
        >
          {loading === 'Active' ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Play className="h-4 w-4 mr-1" />} 
          Reactivate
        </Button>
      ) : (
        <Button 
          variant="outline" 
          size="sm"
          className="text-orange-600 hover:text-orange-700 hover:bg-orange-50 border-orange-200"
          onClick={() => handleStatusChange('Suspended')}
          disabled={loading !== '' || license.status === 'Revoked' || license.status === 'Expired'}
        >
          {loading === 'Suspended' ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Ban className="h-4 w-4 mr-1" />} 
          Suspend
        </Button>
      )}
      
      <Button 
        variant="outline" 
        size="sm"
        className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
        onClick={() => handleStatusChange('Revoked')}
        disabled={loading !== '' || license.status === 'Revoked'}
      >
        {loading === 'Revoked' ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <RefreshCcw className="h-4 w-4 mr-1" />} 
        Revoke
      </Button>
    </div>
  )
}
