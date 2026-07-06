'use client'

import { useState, useMemo } from 'react'
import { Card } from '@/components/Card'
import { UsersRound, DollarSign, Activity, Target, XCircle, TrendingUp, Users } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts'
import { format, subDays, startOfWeek, startOfMonth, isAfter, isBefore } from 'date-fns'

export default function VendorDashboardClient({ vendorName, totalSalesExecs, orders, commissions, commissionPayments, salesRequests }: { vendorName: string, totalSalesExecs: number, orders: any[], commissions: any[], commissionPayments: any[], salesRequests: any[] }) {
  const [dateFilter, setDateFilter] = useState('all')

  const filterByDate = (arr: any[], dateField = 'created_at') => {
    return arr.filter(item => {
      if (dateFilter === 'all') return true
      const date = new Date(item[dateField])
      const today = new Date()
      if (dateFilter === 'today') return date.toDateString() === today.toDateString()
      if (dateFilter === 'yesterday') return date.toDateString() === subDays(today, 1).toDateString()
      if (dateFilter === 'week') return isAfter(date, startOfWeek(today))
      if (dateFilter === 'month') return isAfter(date, startOfMonth(today))
      return true
    })
  }

  const filteredOrders = useMemo(() => filterByDate(orders), [orders, dateFilter])
  const filteredRequests = useMemo(() => filterByDate(salesRequests), [salesRequests, dateFilter])
  const filteredCommissions = useMemo(() => filterByDate(commissions), [commissions, dateFilter])

  const totalCustomers = new Set(filteredRequests.map(r => r.customer_phone)).size
  const pendingSales = filteredRequests.filter(r => r.status === 'Pending').length
  const approvedSales = filteredRequests.filter(r => r.status === 'Approved').length
  const rejectedSales = filteredRequests.filter(r => r.status === 'Rejected').length
  
  const filteredCommissionPayments = useMemo(() => filterByDate(commissionPayments), [commissionPayments, dateFilter])

  const totalCommission = filteredCommissions.reduce((sum, c) => {
    const order = Array.isArray(c.orders) ? c.orders[0] : c.orders
    const orderPrice = order?.price || 0
    const vendorAmount = c.vendor_amount ?? (orderPrice * 0.01)
    return sum + Number(vendorAmount)
  }, 0)
  const paidCommission = filteredCommissionPayments.reduce((sum, p) => sum + Number(p.amount || 0), 0)
  const pendingCommission = totalCommission - paidCommission

  // Daily Chart Data
  const chartData = useMemo(() => {
    const dailyMap: Record<string, { date: string, sales: number, earnings: number }> = {}
    filteredOrders.forEach(o => {
      const d = format(new Date(o.created_at), 'MMM dd')
      if (!dailyMap[d]) dailyMap[d] = { date: d, sales: 0, earnings: 0 }
      dailyMap[d].sales += Number(o.price || 0)
    })
    filteredCommissionPayments.forEach(p => {
      const d = format(new Date(p.created_at), 'MMM dd')
      if (!dailyMap[d]) dailyMap[d] = { date: d, sales: 0, earnings: 0 }
      dailyMap[d].earnings += Number(p.amount || 0)
    })
    return Object.values(dailyMap).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
  }, [filteredOrders, filteredCommissionPayments])

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">{vendorName || 'Vendor Dashboard'}</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Overview of your assigned executives and generated commissions.</p>
        </div>
        <select 
          value={dateFilter}
          onChange={(e) => setDateFilter(e.target.value)}
          className="px-4 py-2 border rounded-lg text-sm bg-white dark:bg-gray-800 dark:border-gray-700 focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">All Time</option>
          <option value="today">Today</option>
          <option value="yesterday">Yesterday</option>
          <option value="week">This Week</option>
          <option value="month">This Month</option>
        </select>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-5 bg-white dark:bg-gray-900 shadow-sm border border-gray-100 dark:border-gray-800">
          <div className="flex items-center gap-3 mb-2">
            <UsersRound className="h-5 w-5 text-indigo-500" />
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Sales Executives</h3>
          </div>
          <p className="text-2xl font-bold text-indigo-600">{totalSalesExecs}</p>
        </Card>
        
        <Card className="p-5 bg-white dark:bg-gray-900 shadow-sm border border-gray-100 dark:border-gray-800">
          <div className="flex items-center gap-3 mb-2">
            <Users className="h-5 w-5 text-blue-500" />
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Customers</h3>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{totalCustomers}</p>
        </Card>

        <Card className="p-5 bg-white dark:bg-gray-900 shadow-sm border border-gray-100 dark:border-gray-800">
          <div className="flex items-center gap-3 mb-2">
            <Target className="h-5 w-5 text-green-500" />
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Approved Sales</h3>
          </div>
          <p className="text-2xl font-bold text-green-600">{approvedSales}</p>
        </Card>

        <Card className="p-5 bg-white dark:bg-gray-900 shadow-sm border border-gray-100 dark:border-gray-800">
          <div className="flex items-center gap-3 mb-2">
            <XCircle className="h-5 w-5 text-red-500" />
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Rejected Sales</h3>
          </div>
          <p className="text-2xl font-bold text-red-600">{rejectedSales}</p>
        </Card>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-5 bg-white dark:bg-gray-900 shadow-sm border border-gray-100 dark:border-gray-800">
          <div className="flex items-center gap-3 mb-2">
            <Activity className="h-5 w-5 text-orange-500" />
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Pending Sales</h3>
          </div>
          <p className="text-2xl font-bold text-orange-600">{pendingSales}</p>
        </Card>

        <Card className="p-5 bg-white dark:bg-gray-900 shadow-sm border border-gray-100 dark:border-gray-800">
          <div className="flex items-center gap-3 mb-2">
            <DollarSign className="h-5 w-5 text-yellow-500" />
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Pending Comm.</h3>
          </div>
          <p className="text-2xl font-bold text-yellow-600">₹{pendingCommission.toFixed(2)}</p>
        </Card>

        <Card className="p-5 bg-white dark:bg-gray-900 shadow-sm border border-gray-100 dark:border-gray-800">
          <div className="flex items-center gap-3 mb-2">
            <DollarSign className="h-5 w-5 text-green-500" />
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Paid Comm.</h3>
          </div>
          <p className="text-2xl font-bold text-green-600">₹{paidCommission.toFixed(2)}</p>
        </Card>

        <Card className="p-5 bg-white dark:bg-gray-900 shadow-sm border border-gray-100 dark:border-gray-800">
          <div className="flex items-center gap-3 mb-2">
            <TrendingUp className="h-5 w-5 text-purple-500" />
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Earnings</h3>
          </div>
          <p className="text-2xl font-bold text-purple-600">₹{totalCommission.toFixed(2)}</p>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-5 bg-white dark:bg-gray-900 shadow-sm border border-gray-100 dark:border-gray-800">
          <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-4">Daily Platform Sales</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <XAxis dataKey="date" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `₹${value}`} />
                <Tooltip cursor={{fill: 'transparent'}} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                <Bar dataKey="sales" fill="#6366f1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
        
        <Card className="p-5 bg-white dark:bg-gray-900 shadow-sm border border-gray-100 dark:border-gray-800">
          <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-4">Daily Vendor Earnings</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <XAxis dataKey="date" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `₹${value}`} />
                <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                <Line type="monotone" dataKey="earnings" stroke="#10b981" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      <Card className="overflow-hidden bg-white dark:bg-gray-900 shadow-sm border border-gray-100 dark:border-gray-800">
        <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">Latest Activity (Orders)</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-gray-500 dark:text-gray-400 uppercase bg-gray-50 dark:bg-gray-900">
              <tr>
                <th className="px-6 py-4">Order #</th>
                <th className="px-6 py-4">Customer</th>
                <th className="px-6 py-4">Product</th>
                <th className="px-6 py-4">Price</th>
                <th className="px-6 py-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {filteredOrders.slice(0, 5).map((o: any) => (
                <tr key={o.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                  <td className="px-6 py-4 font-mono text-xs">{o.order_number}</td>
                  <td className="px-6 py-4 font-medium">{o.customer_name}</td>
                  <td className="px-6 py-4">{o.product_name}</td>
                  <td className="px-6 py-4">₹{o.product_price}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                      o.status === 'Approved' ? 'bg-green-100 text-green-800' :
                      o.status === 'Rejected' ? 'bg-red-100 text-red-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {o.status}
                    </span>
                  </td>
                </tr>
              ))}
              {filteredOrders.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-500">No activity yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}
