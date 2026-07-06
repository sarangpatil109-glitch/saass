'use client'

import { useState } from 'react'
import { Card } from '@/components/Card'
import { Button } from '@/components/Button'
import { Users, Search, Filter, CheckCircle, XCircle, Ban } from 'lucide-react'
import { approveSalesExecutive, rejectSalesExecutive, suspendSalesExecutive } from '@/app/actions/team'

export function TeamBoardClient({ initialTeam }: { initialTeam: any[] }) {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [loadingId, setLoadingId] = useState<string | null>(null)

  const handleApprove = async (id: string) => {
    if (!confirm('Approve this Sales Executive?')) return
    setLoadingId(id)
    await approveSalesExecutive(id)
    setLoadingId(null)
  }

  const handleReject = async (id: string) => {
    if (!confirm('Reject this Sales Executive?')) return
    setLoadingId(id)
    await rejectSalesExecutive(id)
    setLoadingId(null)
  }

  const handleSuspend = async (id: string) => {
    if (!confirm('Suspend this Sales Executive?')) return
    setLoadingId(id)
    await suspendSalesExecutive(id)
    setLoadingId(null)
  }

  const filteredTeam = initialTeam.filter(member => {
    const matchesSearch = (member.full_name || '').toLowerCase().includes(search.toLowerCase()) || 
                          (member.email || '').toLowerCase().includes(search.toLowerCase()) ||
                          (member.employee_code || '').toLowerCase().includes(search.toLowerCase())
    const matchesStatus = statusFilter === '' || member.status === statusFilter
    return matchesSearch && matchesStatus
  })

  return (
    <div className="space-y-6">
      <Card className="p-4 bg-white dark:bg-gray-900 shadow-sm border border-gray-100 dark:border-gray-800">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input 
              type="text" 
              placeholder="Search by name, email, or ID..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all text-gray-900 dark:text-white"
            />
          </div>
          <div className="flex gap-2">
            <select 
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-gray-900 dark:text-white"
            >
              <option value="">All Statuses</option>
              <option value="Active">Active</option>
              <option value="Pending Approval">Pending Approval</option>
              <option value="Inactive">Inactive</option>
              <option value="Suspended">Suspended</option>
            </select>
          </div>
        </div>
      </Card>

      <Card className="overflow-hidden bg-white dark:bg-gray-900 shadow-sm border border-gray-100 dark:border-gray-800">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-gray-500 dark:text-gray-400 uppercase bg-gray-50 dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800">
              <tr>
                <th className="px-6 py-4">Executive</th>
                <th className="px-6 py-4">Contact</th>
                <th className="px-6 py-4">Comm. %</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {filteredTeam.length > 0 ? (
                filteredTeam.map((member: any) => (
                  <tr key={member.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900 dark:text-white">{member.full_name}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{member.employee_code}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-gray-900 dark:text-white">{member.email}</div>
                      <div className="text-gray-500 dark:text-gray-400 mt-0.5">{member.phone}</div>
                    </td>
                    <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">
                      {member.commission_percentage}%
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${
                        member.status === 'Active' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' :
                        member.status === 'Pending Approval' ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400' :
                        'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                      }`}>
                        {member.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      {member.status === 'Pending Approval' && (
                        <div className="flex items-center justify-end gap-2">
                          <Button size="sm" onClick={() => handleApprove(member.id)} disabled={loadingId === member.id} className="bg-green-600 hover:bg-green-700 text-white">
                            <CheckCircle className="h-4 w-4 mr-1.5" /> Approve
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => handleReject(member.id)} disabled={loadingId === member.id} className="text-red-600 hover:text-red-700 hover:bg-red-50">
                            <XCircle className="h-4 w-4 mr-1.5" /> Reject
                          </Button>
                        </div>
                      )}
                      {member.status === 'Active' && (
                        <Button size="sm" variant="outline" onClick={() => handleSuspend(member.id)} disabled={loadingId === member.id} className="text-orange-600 hover:text-orange-700 hover:bg-orange-50">
                          <Ban className="h-4 w-4 mr-1.5" /> Suspend
                        </Button>
                      )}
                      {(member.status === 'Suspended' || member.status === 'Inactive') && (
                        <Button size="sm" variant="outline" onClick={() => handleApprove(member.id)} disabled={loadingId === member.id} className="text-green-600 hover:text-green-700 hover:bg-green-50">
                          <CheckCircle className="h-4 w-4 mr-1.5" /> Reactivate
                        </Button>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-6 py-16 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <div className="w-16 h-16 bg-blue-50 dark:bg-blue-900/20 rounded-full flex items-center justify-center mb-4">
                        <Users className="h-8 w-8 text-blue-500 dark:text-blue-400" />
                      </div>
                      <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-1">No Team Members Found</h3>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}
