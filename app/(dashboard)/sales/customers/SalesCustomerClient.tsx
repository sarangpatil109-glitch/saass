'use client'

import { useState } from 'react'
import { Card } from '@/components/Card'
import { Search, PlusCircle } from 'lucide-react'
import { Button } from '@/components/Button'
import SalesCustomerForm from '@/components/sales/SalesCustomerForm'

export default function SalesCustomerClient({ initialOrders }: { initialOrders: any[] }) {
  const [showModal, setShowModal] = useState(false)
  const [search, setSearch] = useState('')

  const filteredOrders = initialOrders.filter(o => 
    (o.customer_name || '').toLowerCase().includes(search.toLowerCase()) ||
    (o.order_number || '').toLowerCase().includes(search.toLowerCase())
  )

  return (
    <>
      <Card className="p-4 bg-white dark:bg-gray-900 shadow-sm border border-gray-100 dark:border-gray-800 flex items-center justify-between">
        <div className="relative max-w-sm w-full">
           <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
           <input type="text" placeholder="Search requests..." value={search} onChange={e => setSearch(e.target.value)} className="w-full pl-9 pr-4 py-2 border rounded-lg text-sm bg-gray-50 dark:bg-gray-800 dark:border-gray-700 outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <Button onClick={() => setShowModal(true)} className="inline-flex items-center">
          <PlusCircle className="h-4 w-4 mr-2" /> Add Customer
        </Button>
      </Card>

      <Card className="overflow-hidden bg-white dark:bg-gray-900 shadow-sm border border-gray-100 dark:border-gray-800">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-gray-500 dark:text-gray-400 uppercase bg-gray-50 dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800">
              <tr>
                <th className="px-6 py-4">Order #</th>
                <th className="px-6 py-4">Customer</th>
                <th className="px-6 py-4">Contact</th>
                <th className="px-6 py-4">Product</th>
                <th className="px-6 py-4">Amount</th>
                <th className="px-6 py-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {filteredOrders.length > 0 ? (
                filteredOrders.map((o: any) => (
                  <tr key={o.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                    <td className="px-6 py-4 font-mono text-xs text-gray-400">N/A (Pending)</td>
                    <td className="px-6 py-4">
                      <div className="font-medium">{o.customer_name}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-gray-900 dark:text-white">{o.customer_phone}</div>
                      <div className="text-xs text-gray-500">{o.customer_email}</div>
                    </td>
                    <td className="px-6 py-4">{o.products?.name || 'Unknown'}</td>
                    <td className="px-6 py-4 font-medium">₹{o.product_price}</td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium w-fit ${
                          o.status === 'Approved' ? 'bg-green-100 text-green-800' :
                          o.status === 'Rejected' ? 'bg-red-100 text-red-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {o.status}
                        </span>
                        {o.payment_proof_url && (
                          <span className="inline-flex items-center text-xs font-medium text-green-600 dark:text-green-400 mt-1">
                            Payment Proof Uploaded ✓
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                    No sales requests found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
      
      {showModal && <SalesCustomerForm onClose={() => setShowModal(false)} />}
    </>
  )
}
