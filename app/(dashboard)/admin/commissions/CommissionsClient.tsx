'use client'

import { useState } from 'react'
import { Card } from '@/components/Card'
import { Search } from 'lucide-react'
import { markCommissionPaid } from '@/app/actions/commission_workflow'
import { useRouter } from 'next/navigation'

export default function CommissionsClient({ initialCommissions }: { initialCommissions: any[] }) {
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState<string | null>(null)
  const router = useRouter()

  const filtered = initialCommissions.filter(c => 
    (c.orders?.order_number || '').toLowerCase().includes(search.toLowerCase()) ||
    (c.sales_executives?.full_name || '').toLowerCase().includes(search.toLowerCase()) ||
    (c.vendors?.business_name || '').toLowerCase().includes(search.toLowerCase())
  )

  const handleMarkPaid = async (id: string) => {
    if (!confirm('Are you sure you want to mark this commission as Paid?')) return
    setLoading(id)
    await markCommissionPaid(id)
    router.refresh()
    setLoading(null)
  }

  return (
    <>
      <Card className="p-4 bg-white dark:bg-gray-900 shadow-sm border border-gray-100 dark:border-gray-800 flex items-center justify-between">
        <div className="relative max-w-sm w-full">
           <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
           <input type="text" placeholder="Search commissions..." value={search} onChange={e => setSearch(e.target.value)} className="w-full pl-9 pr-4 py-2 border rounded-lg text-sm bg-gray-50 dark:bg-gray-800 dark:border-gray-700 outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
      </Card>

      <Card className="overflow-hidden bg-white dark:bg-gray-900 shadow-sm border border-gray-100 dark:border-gray-800">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-gray-500 dark:text-gray-400 uppercase bg-gray-50 dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800">
              <tr>
                <th className="px-6 py-4">Order #</th>
                <th className="px-6 py-4">Sales Executive</th>
                <th className="px-6 py-4">Vendor</th>
                <th className="px-6 py-4">Exec Comm</th>
                <th className="px-6 py-4">Vendor Comm</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {filtered.length > 0 ? (
                filtered.map((c: any) => (
                  <tr key={c.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                    <td className="px-6 py-4 font-mono text-xs">{c.orders?.order_number}</td>
                    <td className="px-6 py-4">{c.sales_executives?.full_name}</td>
                    <td className="px-6 py-4">{c.vendors?.business_name}</td>
                    <td className="px-6 py-4 text-blue-600 font-medium">₹{c.sales_exec_commission}</td>
                    <td className="px-6 py-4 text-green-600 font-medium">₹{c.vendor_commission}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                        c.status === 'Paid' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {c.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {c.status === 'Pending' ? (
                        <button 
                          onClick={() => handleMarkPaid(c.id)} 
                          disabled={loading === c.id} 
                          className="text-blue-600 hover:underline"
                        >
                          Mark Paid
                        </button>
                      ) : (
                        <span className="text-gray-400">Paid on {new Date(c.updated_at).toLocaleDateString()}</span>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                    No commissions found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </>
  )
}
