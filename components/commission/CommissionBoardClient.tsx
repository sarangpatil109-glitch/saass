'use client'

import { useState } from 'react'
import { Card } from '@/components/Card'
import { Button } from '@/components/Button'
import { Input } from '@/components/Input'
import { Select } from '@/components/Select'
import { Search, Download, Settings, DollarSign, Activity } from 'lucide-react'
import { updateCommissionStatus, updateCommissionSettings } from '@/app/actions/commission'

type Commission = {
  id: string
  sale_id: string
  sales_exec_amount: number
  vendor_amount: number
  product_price: number
  sales_exec_percentage: number
  vendor_percentage: number
  status: string
  created_at: string
  sales_executive: { full_name: string }
  vendor: { company_name: string }
}

export function CommissionBoardClient({ 
  initialCommissions, 
  userRole,
  settings
}: { 
  initialCommissions: Commission[], 
  userRole: 'admin' | 'vendor' | 'sales_executive',
  settings?: { sales_exec_percentage: number, vendor_percentage: number }
}) {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleStatusChange = async (id: string, newStatus: string) => {
    if (confirm(`Are you sure you want to change status to ${newStatus}?`)) {
      await updateCommissionStatus(id, newStatus)
      window.location.reload()
    }
  }

  const handleSettingsSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    const formData = new FormData(e.currentTarget)
    await updateCommissionSettings(formData)
    setIsSettingsOpen(false)
    setLoading(false)
    window.location.reload()
  }

  const exportCSV = () => {
    const headers = ["Commission ID", "Sale Amount", "Sales Exec", "SE Commission", "Vendor", "Vendor Commission", "Status", "Date"]
    const rows = initialCommissions.map(c => [
      c.id,
      c.product_price,
      c.sales_executive?.full_name,
      c.sales_exec_amount,
      c.vendor?.company_name,
      c.vendor_amount,
      c.status,
      new Date(c.created_at).toLocaleDateString()
    ])
    
    let csvContent = "data:text/csv;charset=utf-8," + headers.join(",") + "\n" + rows.map(e => e.join(",")).join("\n")
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement("a")
    link.setAttribute("href", encodedUri)
    link.setAttribute("download", `commission_report_${new Date().toISOString().split('T')[0]}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const filteredCommissions = initialCommissions.filter(c => {
    const matchesSearch = c.id.toLowerCase().includes(search.toLowerCase()) || 
                          c.sales_executive?.full_name.toLowerCase().includes(search.toLowerCase()) ||
                          c.vendor?.company_name.toLowerCase().includes(search.toLowerCase())
    const matchesStatus = statusFilter === 'all' || c.status === statusFilter
    return matchesSearch && matchesStatus
  })

  // Basic KPI calc for dashboard
  const totalEarnings = initialCommissions.reduce((acc, curr) => acc + (userRole === 'vendor' ? curr.vendor_amount : userRole === 'sales_executive' ? curr.sales_exec_amount : (curr.sales_exec_amount + curr.vendor_amount)), 0)
  const pendingEarnings = initialCommissions.filter(c => c.status === 'Pending').reduce((acc, curr) => acc + (userRole === 'vendor' ? curr.vendor_amount : userRole === 'sales_executive' ? curr.sales_exec_amount : (curr.sales_exec_amount + curr.vendor_amount)), 0)
  const paidEarnings = initialCommissions.filter(c => c.status === 'Paid').reduce((acc, curr) => acc + (userRole === 'vendor' ? curr.vendor_amount : userRole === 'sales_executive' ? curr.sales_exec_amount : (curr.sales_exec_amount + curr.vendor_amount)), 0)

  return (
    <div className="space-y-6">
      
      {/* Dynamic Dashboards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card className="p-5 flex items-center gap-4 bg-white">
          <div className="h-12 w-12 rounded-xl bg-blue-100 flex items-center justify-center">
            <DollarSign className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Total {userRole === 'admin' ? 'Commissions' : 'Earnings'}</p>
            <p className="text-2xl font-bold text-gray-900">${totalEarnings.toFixed(2)}</p>
          </div>
        </Card>
        <Card className="p-5 flex items-center gap-4 bg-white">
          <div className="h-12 w-12 rounded-xl bg-orange-100 flex items-center justify-center">
            <Activity className="h-6 w-6 text-orange-600" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Pending</p>
            <p className="text-2xl font-bold text-gray-900">${pendingEarnings.toFixed(2)}</p>
          </div>
        </Card>
        <Card className="p-5 flex items-center gap-4 bg-white">
          <div className="h-12 w-12 rounded-xl bg-green-100 flex items-center justify-center">
            <DollarSign className="h-6 w-6 text-green-600" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Paid Out</p>
            <p className="text-2xl font-bold text-gray-900">${paidEarnings.toFixed(2)}</p>
          </div>
        </Card>
      </div>

      <Card className="overflow-hidden">
        <div className="p-4 sm:p-6 flex flex-col lg:flex-row gap-4 border-b">
          <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="relative w-full">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
              <Input 
                type="search" 
                placeholder="Search ID, Exec, Vendor..." 
                className="w-full pl-9"
                value={search}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
              />
            </div>
            <Select 
              value={statusFilter} 
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setStatusFilter(e.target.value)}
            >
              <option value="all">All Statuses</option>
              <option value="Pending">Pending</option>
              <option value="Approved">Approved</option>
              <option value="Paid">Paid</option>
              <option value="Cancelled">Cancelled</option>
              <option value="Reversed">Reversed</option>
            </Select>
          </div>
          <div className="flex gap-2">
            <Button onClick={exportCSV} variant="outline" className="flex items-center gap-2">
              <Download className="h-4 w-4" />
              Export CSV
            </Button>
            {userRole === 'admin' && (
              <Button onClick={() => setIsSettingsOpen(true)} className="flex items-center gap-2 bg-slate-900 text-white">
                <Settings className="h-4 w-4" />
                Settings
              </Button>
            )}
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 text-gray-500 font-medium border-b">
              <tr>
                <th className="px-6 py-4">Transaction Info</th>
                {(userRole === 'admin' || userRole === 'vendor') && <th className="px-6 py-4">Sales Exec Earnings</th>}
                {(userRole === 'admin' || userRole === 'sales_executive') && <th className="px-6 py-4">Vendor Earnings</th>}
                <th className="px-6 py-4">Status</th>
                {userRole === 'admin' && <th className="px-6 py-4 text-right">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y">
              {filteredCommissions.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                    No commission records found.
                  </td>
                </tr>
              ) : (
                filteredCommissions.map((comm) => (
                  <tr key={comm.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-mono text-gray-900 text-xs truncate max-w-[150px]">{comm.id}</div>
                      <div className="text-gray-500 text-xs mt-0.5">Sale: ${comm.product_price}</div>
                    </td>
                    
                    {(userRole === 'admin' || userRole === 'vendor') && (
                      <td className="px-6 py-4">
                        <div className="font-semibold text-green-700">${comm.sales_exec_amount}</div>
                        <div className="text-gray-500 text-xs mt-0.5">{comm.sales_executive?.full_name} ({comm.sales_exec_percentage}%)</div>
                      </td>
                    )}
                    
                    {(userRole === 'admin' || userRole === 'sales_executive') && (
                      <td className="px-6 py-4">
                        <div className="font-semibold text-blue-700">${comm.vendor_amount}</div>
                        <div className="text-gray-500 text-xs mt-0.5">{comm.vendor?.company_name} ({comm.vendor_percentage}% of Exec)</div>
                      </td>
                    )}

                    <td className="px-6 py-4">
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                        comm.status === 'Paid' ? 'bg-green-100 text-green-800' :
                        comm.status === 'Approved' ? 'bg-blue-100 text-blue-800' :
                        comm.status === 'Pending' ? 'bg-orange-100 text-orange-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {comm.status}
                      </span>
                    </td>
                    
                    {userRole === 'admin' && (
                      <td className="px-6 py-4 text-right">
                        <select 
                          value={comm.status}
                          onChange={(e) => handleStatusChange(comm.id, e.target.value)}
                          className="text-xs rounded border-gray-300 ml-auto"
                        >
                          <option value="Pending">Pending</option>
                          <option value="Approved">Approve</option>
                          <option value="Paid">Mark Paid</option>
                          <option value="Cancelled">Cancel</option>
                          <option value="Reversed">Reverse</option>
                        </select>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Settings Modal (Admin Only) */}
      {isSettingsOpen && userRole === 'admin' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm overflow-hidden">
            <div className="px-6 py-4 border-b">
              <h3 className="text-lg font-semibold text-gray-900">Commission Settings</h3>
              <p className="text-xs text-gray-500 mt-1">Changes apply to future sales only.</p>
            </div>
            <form onSubmit={handleSettingsSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Sales Executive % (of Sale)</label>
                <Input name="sales_exec_percentage" type="number" step="0.01" min="0" max="100" required defaultValue={settings?.sales_exec_percentage || 10} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Vendor % (of Sales Exec Comm)</label>
                <Input name="vendor_percentage" type="number" step="0.01" min="0" max="100" required defaultValue={settings?.vendor_percentage || 10} />
              </div>
              <div className="pt-4 flex justify-end gap-3 border-t">
                <Button type="button" variant="outline" onClick={() => setIsSettingsOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={loading}>
                  {loading ? 'Saving...' : 'Update Settings'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
