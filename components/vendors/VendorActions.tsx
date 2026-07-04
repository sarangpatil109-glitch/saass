'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/Button'
import { Edit, Archive, Trash2, RotateCcw, Loader2, RefreshCw } from 'lucide-react'
import { regenerateCoupon, updateVendorStatus, hardDeleteVendor } from '@/app/actions/vendor'
import Link from 'next/link'

export function VendorActions({ vendor }: { vendor: any }) {
  const router = useRouter()
  const [loading, setLoading] = useState('')

  const handleAction = async (actionType: string) => {
    setLoading(actionType)
    try {
      if (actionType === 'regenerate') {
        if (confirm('Regenerating the coupon will invalidate the old one. Continue?')) {
          await regenerateCoupon(vendor.id)
        }
      } else if (actionType === 'archive') {
        await updateVendorStatus(vendor.id, 'Archived')
      } else if (actionType === 'restore') {
        await updateVendorStatus(vendor.id, 'Active')
      } else if (actionType === 'delete') {
        if (confirm('Are you sure you want to permanently delete this vendor? This cannot be undone.')) {
          await hardDeleteVendor(vendor.id)
          router.push('/dashboard/vendors')
        }
      }
    } finally {
      setLoading('')
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Link href={`/dashboard/vendors/${vendor.id}/edit`}>
        <Button variant="outline" size="sm">
          <Edit className="h-4 w-4 mr-2" /> Edit
        </Button>
      </Link>
      <Button 
        variant="outline" 
        size="sm" 
        onClick={() => handleAction('regenerate')}
        disabled={loading !== ''}
      >
        {loading === 'regenerate' ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-2" />} 
        New Coupon
      </Button>

      {vendor.status !== 'Archived' ? (
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
