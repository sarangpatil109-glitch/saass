'use client'

import { useState } from 'react'
import { Card } from '@/components/Card'
import { Search } from 'lucide-react'
import { Button } from '@/components/Button'
import { approveOrder, rejectOrder, editOrder } from '@/app/actions/sales_orders'
import { useRouter } from 'next/navigation'
import AdminOrderEditModal from '@/components/admin/AdminOrderEditModal'

export default function SalesRequestsClient({ initialOrders }: { initialOrders: any[] }) {
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState<string | null>(null)
  const [editingOrder, setEditingOrder] = useState<any | null>(null)
  const router = useRouter()

  const filteredOrders = initialOrders.filter(o => 
    (o.customer_name || '').toLowerCase().includes(search.toLowerCase()) ||
    (o.order_number || '').toLowerCase().includes(search.toLowerCase()) ||
    (o.sales_executives?.full_name || '').toLowerCase().includes(search.toLowerCase())
  )

  const handleApprove = async (orderId: string) => {
    setLoading(orderId)
    const res = await approveOrder(orderId)
    if (res.error) {
      alert(res.error)
    }
    router.refresh()
    setLoading(null)
  }

  const handleReject = async (orderId: string) => {
    setLoading(orderId)
    const res = await rejectOrder(orderId)
    if (res.error) {
      alert(res.error)
    }
    router.refresh()
    setLoading(null)
  }

  return (
    <>
      <Card className="p-4 bg-white dark:bg-gray-900 shadow-sm border border-gray-100 dark:border-gray-800 flex items-center justify-between">
        <div className="relative max-w-sm w-full">
           <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
           <input type="text" placeholder="Search requests..." value={search} onChange={e => setSearch(e.target.value)} className="w-full pl-9 pr-4 py-2 border rounded-lg text-sm bg-gray-50 dark:bg-gray-800 dark:border-gray-700 outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
      </Card>

      <Card className="overflow-hidden bg-white dark:bg-gray-900 shadow-sm border border-gray-100 dark:border-gray-800">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-gray-500 dark:text-gray-400 uppercase bg-gray-50 dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800">
              <tr>
                <th className="px-6 py-4">Customer</th>
                <th className="px-6 py-4">Sales Executive</th>
                <th className="px-6 py-4">Vendor</th>
                <th className="px-6 py-4">Product</th>
                <th className="px-6 py-4">Price</th>
                <th className="px-6 py-4">Exec Comm (10%)</th>
                <th className="px-6 py-4">Vendor Comm (10% of Exec)</th>
                <th className="px-6 py-4">Payment Proof</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {filteredOrders.length > 0 ? (
                filteredOrders.map((o: any) => {
                  const execComm = o.product_price * 0.10;
                  const vendorComm = execComm * 0.10;
                  return (
                    <tr key={o.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                      <td className="px-6 py-4 font-medium">{o.customer_name}</td>
                      <td className="px-6 py-4">{o.sales_executives?.full_name || 'Unassigned'}</td>
                      <td className="px-6 py-4">{o.sales_executives?.vendors?.business_name || 'Unassigned'}</td>
                      <td className="px-6 py-4">{o.products?.name || 'Unknown'}</td>
                      <td className="px-6 py-4 font-medium">₹{o.product_price}</td>
                      <td className="px-6 py-4 text-blue-600 font-medium">₹{execComm.toFixed(2)}</td>
                      <td className="px-6 py-4 text-green-600 font-medium">₹{vendorComm.toFixed(2)}</td>
                      <td className="px-6 py-4">
                        {o.payment_proof_url ? (
                          <a href={o.payment_proof_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline text-xs font-medium">
                            View Screenshot
                          </a>
                        ) : (
                          <span className="text-gray-400 text-xs italic">Missing</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                          o.status === 'Approved' ? 'bg-green-100 text-green-800' :
                          o.status === 'Rejected' ? 'bg-red-100 text-red-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {o.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          {o.status === 'Pending' && (
                            <>
                              <button onClick={() => handleApprove(o.id)} disabled={loading === o.id || !o.payment_proof_url} className="text-green-600 hover:underline disabled:opacity-50 disabled:cursor-not-allowed">Approve</button>
                              <button onClick={() => handleReject(o.id)} disabled={loading === o.id} className="text-red-600 hover:underline">Reject</button>
                            </>
                          )}
                          <button onClick={() => setEditingOrder(o)} className="text-blue-600 hover:underline">Edit</button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              ) : (
                <tr>
                  <td colSpan={9} className="px-6 py-8 text-center text-gray-500">
                    No sales requests found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
      
      {editingOrder && <AdminOrderEditModal order={editingOrder} onClose={() => setEditingOrder(null)} />}
    </>
  )
}
