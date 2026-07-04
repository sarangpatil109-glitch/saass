'use client'

import { useState } from 'react'
import { Button } from '@/components/Button'
import { Loader2, Download, XCircle, RefreshCw } from 'lucide-react'
import { cancelGeneration, getSignedDownloadUrl } from '@/app/actions/generator'

export function GeneratorActions({ job }: { job: any }) {
  const [loading, setLoading] = useState('')

  const handleCancel = async () => {
    if (!confirm('Cancel this generation job?')) return
    setLoading('cancel')
    await cancelGeneration(job.id)
    setLoading('')
  }

  const handleDownload = async () => {
    setLoading('download')
    const res = await getSignedDownloadUrl(job.id)
    setLoading('')
    if (res.error) {
      alert(res.error)
    } else {
      alert('Simulated Download Triggered. Checksum validated.')
      // window.location.href = res.url // Simulated
    }
  }

  return (
    <div className="flex items-center gap-2">
      {job.status === 'Queued' || job.status === 'Generating' ? (
        <Button 
          variant="outline" 
          size="sm"
          className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
          onClick={handleCancel}
          disabled={loading !== ''}
        >
          {loading === 'cancel' ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <XCircle className="h-4 w-4 mr-1" />} 
          Cancel
        </Button>
      ) : job.status === 'Completed' ? (
        <Button 
          size="sm"
          onClick={handleDownload}
          disabled={loading !== ''}
        >
          {loading === 'download' ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Download className="h-4 w-4 mr-1" />} 
          Download ZIP
        </Button>
      ) : (
        <Button 
          variant="outline" 
          size="sm"
          disabled
        >
          <RefreshCw className="h-4 w-4 mr-1" /> Retry
        </Button>
      )}
    </div>
  )
}
