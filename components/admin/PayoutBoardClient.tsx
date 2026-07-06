'use client'

import { useState } from 'react'
import { Card } from '@/components/Card'
import { Button } from '@/components/Button'
import { Search, Filter, IndianRupee, Clock, CheckCircle2, ChevronRight, X, Download, Maximize2 } from 'lucide-react'
import { PayoutDrawer } from './PayoutDrawer'

export function PayoutBoardClient({ 
  salesExecs, 
  vendors,
  commissions,
  commissionPayments
}: { 
  salesExecs: any[], 
  vendors: any[],
  commissions: any[],
  commissionPayments: any[]
}) {
  const [query, setQuery] = useState('')
  const [selectedPayee, setSelectedPayee] = useState<any | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)

  // Aggregate Data
  const payees: any[] = []

  salesExecs.forEach(se => {
    const seComms = commissions.filter(c => c.sales_exec_id === se.id)
    const sePayments = commissionPayments.filter(p => p.sales_exec_id === se.id && p.payee_type === 'sales_executive')
    
    const totalEarned = seComms.reduce((acc, curr) => acc + Number(curr.amount || 0), 0)
    const totalPaid = sePayments.reduce((acc, curr) => acc + Number(curr.amount || 0), 0)
    const totalPending = totalEarned - totalPaid

    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    const yesterdayComms = seComms.filter(c => new Date(c.created_at).toDateString() === yesterday.toDateString())
    const yesterdayEarned = yesterdayComms.reduce((acc, curr) => acc + Number(curr.amount || 0), 0)

    if (totalEarned > 0) {
      payees.push({
        type: 'sales_executive',
        id: se.id,
        name: se.full_name,
        code: se.employee_code,
        vendor: se.vendors ? se.vendors.business_name : 'N/A',
        phone: se.phone,
        email: se.email,
        paymentDetails: {
          account_holder_name: se.account_holder_name,
          bank_name: se.bank_name,
          account_number: se.account_number,
          ifsc_code: se.ifsc_code,
          upi_id: se.upi_id,
          upi_qr_url: se.upi_qr_url
        },
        yesterdayCommission: yesterdayEarned,
        totalPending,
        totalPaid,
        totalEarned,
        payments: sePayments
      })
    }
  })

  vendors.forEach(v => {
    const vComms = commissions.filter(c => c.vendor_id === v.id)
    const vPayments = commissionPayments.filter(p => p.vendor_id === v.id && p.payee_type === 'vendor')
    
    const totalEarned = vComms.reduce((acc, curr) => {
      const order = Array.isArray(curr.orders) ? curr.orders[0] : curr.orders
      const orderPrice = order?.price || 0
      const vendorAmount = curr.vendor_amount ?? (orderPrice * 0.01)
      return acc + Number(vendorAmount)
    }, 0)
    const totalPaid = vPayments.reduce((acc, curr) => acc + Number(curr.amount || 0), 0)
    const totalPending = totalEarned - totalPaid

    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    const yesterdayComms = vComms.filter(c => new Date(c.created_at).toDateString() === yesterday.toDateString())
    const yesterdayEarned = yesterdayComms.reduce((acc, curr) => {
      const order = Array.isArray(curr.orders) ? curr.orders[0] : curr.orders
      const orderPrice = order?.price || 0
      const vendorAmount = curr.vendor_amount ?? (orderPrice * 0.01)
      return acc + Number(vendorAmount)
    }, 0)

    if (totalEarned > 0) {
      payees.push({
        type: 'vendor',
        id: v.id,
        name: v.business_name,
        code: v.vendor_code,
        vendor: 'N/A',
        phone: v.phone,
        email: v.email, // assuming joined from profiles or just use contact info if available
        paymentDetails: {
          account_holder_name: v.account_holder_name,
          bank_name: v.bank_name,
          account_number: v.account_number,
          ifsc_code: v.ifsc_code,
          upi_id: v.upi_id,
          upi_qr_url: v.upi_qr_url
        },
        yesterdayCommission: yesterdayEarned,
        totalPending,
        totalPaid,
        totalEarned,
        payments: vPayments
      })
    }
  })

  const filteredPayees = payees.filter(p => 
    p.name?.toLowerCase().includes(query.toLowerCase()) || 
    p.code?.toLowerCase().includes(query.toLowerCase())
  )

  const handlePayClick = (payee: any) => {
    setSelectedPayee(payee)
    setDrawerOpen(true)
  }

  // Dashboard Stats
  const globalTotalPending = payees.reduce((acc, curr) => acc + curr.totalPending, 0)
  const globalTotalPaid = payees.reduce((acc, curr) => acc + curr.totalPaid, 0)
  const today = new Date().toDateString()
  const todayPayments = commissionPayments.filter(p => new Date(p.created_at).toDateString() === today)
  const todayPaid = todayPayments.reduce((acc, curr) => acc + Number(curr.amount || 0), 0)
  
  const yesterdayDate = new Date()
  yesterdayDate.setDate(yesterdayDate.getDate() - 1)
  const yesterdayString = yesterdayDate.toDateString()
  const yesterdayPayments = commissionPayments.filter(p => new Date(p.created_at).toDateString() === yesterdayString)
  const yesterdayPaid = yesterdayPayments.reduce((acc, curr) => acc + Number(curr.amount || 0), 0)

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-orange-50 dark:bg-orange-900/30 text-orange-600 rounded-lg">
              <Clock className="w-4 h-4" />
            </div>
            <p className="text-sm font-medium text-gray-500">Total Pending</p>
          </div>
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white">₹{globalTotalPending.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</h3>
        </Card>
        
        <Card className="p-4 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-green-50 dark:bg-green-900/30 text-green-600 rounded-lg">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <p className="text-sm font-medium text-gray-500">Total Paid</p>
          </div>
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white">₹{globalTotalPaid.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</h3>
        </Card>

        <Card className="p-4 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-blue-50 dark:bg-blue-900/30 text-blue-600 rounded-lg">
              <IndianRupee className="w-4 h-4" />
            </div>
            <p className="text-sm font-medium text-gray-500">Today's Paid</p>
          </div>
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white">₹{todayPaid.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</h3>
        </Card>
        
        <Card className="p-4 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded-lg">
              <Clock className="w-4 h-4" />
            </div>
            <p className="text-sm font-medium text-gray-500">Yesterday Paid</p>
          </div>
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white">₹{yesterdayPaid.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</h3>
        </Card>
      </div>

      <Card className="p-4 bg-white dark:bg-gray-900 shadow-sm border border-gray-100 dark:border-gray-800">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input 
              type="text" 
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by Sales Exec, Vendor, or ID..." 
              className="w-full pl-10 pr-4 py-2 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-gray-900 dark:text-white"
            />
          </div>
        </div>
      </Card>

      <Card className="overflow-hidden bg-white dark:bg-gray-900 shadow-sm border border-gray-100 dark:border-gray-800">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-gray-500 dark:text-gray-400 uppercase bg-gray-50 dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800">
              <tr>
                <th className="px-6 py-4">Payee</th>
                <th className="px-6 py-4">Type</th>
                <th className="px-6 py-4 text-right">Yesterday</th>
                <th className="px-6 py-4 text-right">Total Pending</th>
                <th className="px-6 py-4 text-right">Already Paid</th>
                <th className="px-6 py-4 text-center">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {filteredPayees.map((p, i) => (
                <tr key={i} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-medium text-gray-900 dark:text-white">{p.name}</div>
                    <div className="text-xs text-gray-500 font-mono mt-0.5">{p.code}</div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300">
                      {p.type === 'sales_executive' ? 'Sales Exec' : 'Vendor'}
                    </span>
                    {p.type === 'sales_executive' && <div className="text-xs text-gray-500 mt-1 truncate max-w-[120px]">{p.vendor}</div>}
                  </td>
                  <td className="px-6 py-4 text-right text-gray-600 dark:text-gray-400">
                    ₹{p.yesterdayCommission.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="px-6 py-4 text-right font-bold text-orange-600 dark:text-orange-400">
                    ₹{p.totalPending.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="px-6 py-4 text-right text-gray-600 dark:text-gray-400">
                    ₹{p.totalPaid.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="px-6 py-4 text-center">
                    {p.totalPending > 0 ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400">Pending</span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">Clear</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Button onClick={() => handlePayClick(p)} size="sm" className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm border-0">
                      Pay Now <ChevronRight className="w-4 h-4 ml-1" />
                    </Button>
                  </td>
                </tr>
              ))}
              {filteredPayees.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-500">No payees found matching your criteria.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {drawerOpen && selectedPayee && (
        <PayoutDrawer 
          payee={selectedPayee} 
          onClose={() => {
            setDrawerOpen(false)
            setSelectedPayee(null)
          }} 
        />
      )}
    </div>
  )
}
