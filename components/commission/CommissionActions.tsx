'use client'

import { useState } from 'react'
import { Button } from '@/components/Button'
import { Loader2, CheckCircle, XCircle } from 'lucide-react'
import { updateCommissionStatus } from '@/app/actions/commission'

export function CommissionActions({ commission }: { commission: any }) {
  const [loading, setLoading] = useState('')

  const handleAction = async (status: string) => {
    if (status === 'Rejected' && !confirm('Are you sure you want to reject this commission?')) return
    
    setLoading(status)
    try {
      await updateCommissionStatus(commission.id, status)
    } finally {
      setLoading('')
    }
  }

  if (commission.status !== 'Pending') {
    return (
      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
        commission.status === 'Approved' ? 'bg-green-100 text-green-800' : 
        commission.status === 'Paid' ? 'bg-blue-100 text-blue-800' :
        'bg-red-100 text-red-800'
      }`}>
        {commission.status}
      </span>
    )
  }

  return (
    <div className="flex items-center gap-2">
      <Button 
        variant="outline" 
        size="sm"
        className="text-green-600 hover:text-green-700 hover:bg-green-50 border-green-200"
        onClick={() => handleAction('Approved')}
        disabled={loading !== ''}
      >
        {loading === 'Approved' ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <CheckCircle className="h-4 w-4 mr-1" />} 
        Approve
      </Button>
      <Button 
        variant="outline" 
        size="sm"
        className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
        onClick={() => handleAction('Rejected')}
        disabled={loading !== ''}
      >
        {loading === 'Rejected' ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <XCircle className="h-4 w-4 mr-1" />} 
        Reject
      </Button>
    </div>
  )
}
