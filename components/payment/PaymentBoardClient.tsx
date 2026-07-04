'use client'

import { useState } from 'react'
import { Card } from '@/components/Card'
import { Input } from '@/components/Input'
import { Select } from '@/components/Select'
import { Button } from '@/components/Button'
import { Search, IndianRupee, CheckCircle2, Clock, XCircle, RotateCcw, Play } from 'lucide-react'
import { simulateWebhook, markRefund } from '@/app/actions/payment'

export function PaymentBoardClient({ orders, invoices, refunds }: { orders: any[], invoices: any[], refunds: any[] }) {
  const [activeTab, setActiveTab] = useState('orders')
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [loading, setLoading] = useState(false)

  // Simulation controls
  const handleSimulatePayment = async (cashfree_order_id: string) => {
    setLoading(true)
    const transaction_id = `CF_TXN_${Date.now()}`
    const result = await simulateWebhook(cashfree_order_id, transaction_id)
    if (result.error) alert(result.error)
    else {
      alert('Mock payment webhook processed successfully!')
      window.location.reload()
    }
    setLoading(false)
  }

  const handleRefund = async (orderId: string, amount: number) => {
    const reason = prompt("Enter reason for manual refund tracking:")
    if (reason) {
      setLoading(true)
      const result = await markRefund(orderId, amount, reason)
      if (result.error) alert(result.error)
      else window.location.reload()
      setLoading(false)
    }
  }

  const filteredOrders = orders.filter(o => {
    const matchesSearch = 
      o.cashfree_order_id?.toLowerCase().includes(search.toLowerCase()) || 
      o.business_name.toLowerCase().includes(search.toLowerCase()) ||
      o.customer?.profiles?.full_name?.toLowerCase().includes(search.toLowerCase())
    const matchesStatus = statusFilter === 'all' || o.status === statusFilter
    return matchesSearch && matchesStatus
  })

  // Analytics Math
  const totalRev = orders.filter(o => o.status === 'Success').reduce((acc, curr) => acc + curr.amount, 0)
  const todayRev = orders.filter(o => o.status === 'Success' && new Date(o.created_at).toDateString() === new Date().toDateString()).reduce((acc, curr) => acc + curr.amount, 0)

  return (
    <div className="space-y-6">
      
      {/* Analytics Dashboard */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <Card className="p-4 bg-white border-green-100 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-500">Total Revenue</span>
            <IndianRupee className="h-5 w-5 text-green-500" />
          </div>
          <span className="text-2xl font-bold text-gray-900 mt-2">₹{totalRev.toFixed(2)}</span>
        </Card>
        <Card className="p-4 bg-white border-blue-100 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-500">Today's Revenue</span>
            <IndianRupee className="h-5 w-5 text-blue-500" />
          </div>
          <span className="text-2xl font-bold text-gray-900 mt-2">₹{todayRev.toFixed(2)}</span>
        </Card>
        <Card className="p-4 bg-white border-indigo-100 shadow-sm flex flex-col justify-between">
          <div className="text-sm font-medium text-gray-500">Successful</div>
          <span className="text-2xl font-bold text-gray-900 mt-2">{orders.filter(o => o.status === 'Success').length}</span>
        </Card>
        <Card className="p-4 bg-white border-yellow-100 shadow-sm flex flex-col justify-between">
          <div className="text-sm font-medium text-gray-500">Pending</div>
          <span className="text-2xl font-bold text-gray-900 mt-2">{orders.filter(o => o.status === 'Pending').length}</span>
        </Card>
        <Card className="p-4 bg-white border-red-100 shadow-sm flex flex-col justify-between">
          <div className="text-sm font-medium text-gray-500">Refunded / Failed</div>
          <span className="text-2xl font-bold text-gray-900 mt-2">{orders.filter(o => ['Refunded', 'Failed'].includes(o.status)).length}</span>
        </Card>
      </div>

      <div className="flex gap-4 border-b">
        <button onClick={() => setActiveTab('orders')} className={`pb-3 px-1 text-sm font-medium border-b-2 ${activeTab === 'orders' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>Order & Payment History</button>
        <button onClick={() => setActiveTab('invoices')} className={`pb-3 px-1 text-sm font-medium border-b-2 ${activeTab === 'invoices' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>Invoices</button>
      </div>

      <Card className="overflow-hidden">
        {activeTab === 'orders' && (
          <>
            <div className="p-4 sm:p-6 flex flex-col lg:flex-row gap-4 border-b items-center justify-between">
              <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-xl">
                <div className="relative w-full">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                  <Input type="search" placeholder="Search orders or business..." className="w-full pl-9" value={search} onChange={(e: any) => setSearch(e.target.value)} />
                </div>
                <Select value={statusFilter} onChange={(e: any) => setStatusFilter(e.target.value)}>
                  <option value="all">All Statuses</option>
                  <option value="Success">Success</option>
                  <option value="Pending">Pending</option>
                  <option value="Refunded">Refunded</option>
                  <option value="Failed">Failed</option>
                </Select>
              </div>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-gray-50 text-gray-500 font-medium border-b">
                  <tr>
                    <th className="px-6 py-4">Order ID & Date</th>
                    <th className="px-6 py-4">Customer</th>
                    <th className="px-6 py-4">Product & Amount</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filteredOrders.length === 0 ? <tr><td colSpan={5} className="p-6 text-center text-gray-500">No orders found.</td></tr> : 
                    filteredOrders.map((ord) => (
                      <tr key={ord.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <div className="font-mono text-xs text-gray-900 truncate max-w-[150px]">{ord.cashfree_order_id || ord.id.split('-')[0]}</div>
                          <div className="text-gray-500 text-xs mt-1">{new Date(ord.created_at).toLocaleString()}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="font-medium text-gray-900">{ord.business_name}</div>
                          <div className="text-gray-500 text-xs mt-0.5">{ord.customer?.email}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-gray-900">{ord.product?.name}</div>
                          <div className="font-medium text-gray-900 mt-0.5">₹{ord.amount}</div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center gap-1.5 text-xs px-2 py-1 rounded-full font-medium ${
                            ord.status === 'Success' ? 'bg-green-100 text-green-700' :
                            ord.status === 'Pending' ? 'bg-yellow-100 text-yellow-700' :
                            'bg-red-100 text-red-700'
                          }`}>
                            {ord.status === 'Success' && <CheckCircle2 className="h-3 w-3" />}
                            {ord.status === 'Pending' && <Clock className="h-3 w-3" />}
                            {ord.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right space-x-2">
                          {ord.status === 'Pending' && (
                            <Button variant="outline" size="sm" onClick={() => handleSimulatePayment(ord.cashfree_order_id)} disabled={loading} title="Simulate Webhook Payment">
                              <Play className="h-4 w-4 text-green-600 mr-1" /> Mock Pay
                            </Button>
                          )}
                          {ord.status === 'Success' && (
                            <Button variant="outline" size="sm" onClick={() => handleRefund(ord.id, ord.amount)} disabled={loading} title="Record Manual Refund">
                              <RotateCcw className="h-4 w-4 text-red-600 mr-1" /> Refund
                            </Button>
                          )}
                        </td>
                      </tr>
                    ))
                  }
                </tbody>
              </table>
            </div>
          </>
        )}

        {activeTab === 'invoices' && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50 text-gray-500 font-medium border-b">
                <tr>
                  <th className="px-6 py-4">Invoice No</th>
                  <th className="px-6 py-4">Date</th>
                  <th className="px-6 py-4">Business</th>
                  <th className="px-6 py-4">Tax</th>
                  <th className="px-6 py-4">Total</th>
                  <th className="px-6 py-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {invoices.length === 0 ? <tr><td colSpan={6} className="p-6 text-center text-gray-500">No invoices generated yet.</td></tr> : 
                  invoices.map((inv) => (
                    <tr key={inv.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 font-mono text-gray-900 font-medium">{inv.invoice_number}</td>
                      <td className="px-6 py-4 text-gray-600">{new Date(inv.invoice_date).toLocaleDateString()}</td>
                      <td className="px-6 py-4">
                        <div className="font-medium text-gray-900">{inv.business_name}</div>
                      </td>
                      <td className="px-6 py-4 text-gray-600">₹{inv.tax}</td>
                      <td className="px-6 py-4 font-bold text-gray-900">₹{inv.grand_total}</td>
                      <td className="px-6 py-4"><span className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded-full font-medium">{inv.status}</span></td>
                    </tr>
                  ))
                }
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  )
}
