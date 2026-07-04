'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/Button'
import { Edit, Archive, Trash2, RotateCcw, Loader2 } from 'lucide-react'
import { updateSalesStatus, hardDeleteSalesExecutive } from '@/app/actions/sales'
import Link from 'next/link'

export function SalesExecutiveActions({ exec }: { exec: any }) {
  const router = useRouter()
  const [loading, setLoading] = useState('')

  const handleAction = async (actionType: string) => {
    setLoading(actionType)
    try {
      if (actionType === 'archive') {
        await updateSalesStatus(exec.id, 'Archived')
      } else if (actionType === 'restore') {
        await updateSalesStatus(exec.id, 'Active')
      } else if (actionType === 'delete') {
        if (confirm('Are you sure you want to permanently delete this sales executive? This cannot be undone.')) {
          await hardDeleteSalesExecutive(exec.id)
          router.push('/dashboard/sales-executives')
        }
      }
    } finally {
      setLoading('')
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Link href={`/dashboard/sales-executives/${exec.id}/edit`}>
        <Button variant="outline" size="sm">
          <Edit className="h-4 w-4 mr-2" /> Edit
        </Button>
      </Link>

      {exec.status !== 'Archived' ? (
        <Button 
          variant="outline" 
          size="sm"
          className="text-orange-600 hover:text-orange-700 hover:bg-orange-50 border-orange-200"
          onClick={() => handleAction('archive')}
          disabled={loading !== ''}
        >
          {loading === 'archive' ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Archive className="h-4 w-4 mr-2" />} 
          Archive
        </Button>
      ) : (
        <Button 
          variant="outline" 
          size="sm"
          className="text-green-600 hover:text-green-700 hover:bg-green-50 border-green-200"
          onClick={() => handleAction('restore')}
          disabled={loading !== ''}
        >
          {loading === 'restore' ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <RotateCcw className="h-4 w-4 mr-2" />} 
          Restore
        </Button>
      )}

      <Button 
        variant="outline" 
        size="sm"
        className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
        onClick={() => handleAction('delete')}
        disabled={loading !== ''}
      >
        {loading === 'delete' ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Trash2 className="h-4 w-4 mr-2" />} 
        Delete
      </Button>
    </div>
  )
}
