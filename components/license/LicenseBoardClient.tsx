'use client'

import { useState } from 'react'
import { Card } from '@/components/Card'
import { Input } from '@/components/Input'
import { Select } from '@/components/Select'
import { Search, ShieldCheck, ShieldAlert, KeyRound, MonitorSmartphone, Settings2 } from 'lucide-react'
import Link from 'next/link'

export function LicenseBoardClient({ licenses }: { licenses: any[] }) {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  const filtered = licenses.filter(l => {
    const matchesSearch = 
      l.license_key.toLowerCase().includes(search.toLowerCase()) || 
      l.customer?.profiles?.full_name?.toLowerCase().includes(search.toLowerCase()) ||
      l.product?.name?.toLowerCase().includes(search.toLowerCase())
    const matchesStatus = statusFilter === 'all' || l.status === statusFilter
    return matchesSearch && matchesStatus
  })

  return (
    <div className="space-y-6">
      
      {/* Analytics Dashboard */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-5 flex flex-col justify-between bg-white border-blue-100 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-500">Total Licenses</span>
            <KeyRound className="h-5 w-5 text-blue-500" />
          </div>
          <span className="text-2xl font-bold text-gray-900 mt-2">{licenses.length}</span>
        </Card>
        <Card className="p-5 flex flex-col justify-between bg-white border-green-100 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-500">Active</span>
            <ShieldCheck className="h-5 w-5 text-green-500" />
          </div>
          <span className="text-2xl font-bold text-gray-900 mt-2">{licenses.filter(l => l.status === 'Active').length}</span>
        </Card>
        <Card className="p-5 flex flex-col justify-between bg-white border-yellow-100 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-500">Pending</span>
            <MonitorSmartphone className="h-5 w-5 text-yellow-500" />
          </div>
          <span className="text-2xl font-bold text-gray-900 mt-2">{licenses.filter(l => l.status === 'Pending').length}</span>
        </Card>
        <Card className="p-5 flex flex-col justify-between bg-white border-red-100 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-500">Suspended / Revoked</span>
            <ShieldAlert className="h-5 w-5 text-red-500" />
          </div>
          <span className="text-2xl font-bold text-gray-900 mt-2">{licenses.filter(l => ['Suspended', 'Revoked'].includes(l.status)).length}</span>
        </Card>
      </div>

      <Card className="overflow-hidden">
        <div className="p-4 sm:p-6 flex flex-col lg:flex-row gap-4 border-b items-center justify-between">
          <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-xl">
            <div className="relative w-full">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
              <Input type="search" placeholder="Search key, customer, or product..." className="w-full pl-9" value={search} onChange={(e: any) => setSearch(e.target.value)} />
            </div>
            <Select value={statusFilter} onChange={(e: any) => setStatusFilter(e.target.value)}>
              <option value="all">All Statuses</option>
              <option value="Pending">Pending Activation</option>
              <option value="Active">Active</option>
              <option value="Suspended">Suspended</option>
              <option value="Revoked">Revoked</option>
              <option value="Expired">Expired</option>
            </Select>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 text-gray-500 font-medium border-b">
              <tr>
                <th className="px-6 py-4">License Key</th>
                <th className="px-6 py-4">Customer</th>
                <th className="px-6 py-4">Product & Build</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Manage</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filtered.length === 0 ? <tr><td colSpan={5} className="p-6 text-center text-gray-500">No licenses found.</td></tr> : 
                filtered.map((lic) => (
                  <tr key={lic.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="font-mono font-medium text-gray-900">{lic.license_key}</div>
                      <div className="text-gray-500 text-xs mt-1">Generated: {new Date(lic.created_at).toLocaleDateString()}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900">{lic.customer?.profiles?.full_name || 'Unknown'}</div>
                      <div className="text-gray-500 text-xs mt-0.5">{lic.customer?.email}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-gray-900">{lic.product?.name}</div>
                      <div className="text-gray-500 text-xs mt-0.5">v{lic.product_version?.version_string} • ZIP: {lic.zip_id.split('-')[0]}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 text-xs px-2 py-1 rounded-full font-medium ${
                        lic.status === 'Active' ? 'bg-green-100 text-green-700' :
                        lic.status === 'Pending' ? 'bg-yellow-100 text-yellow-700' :
                        lic.status === 'Suspended' ? 'bg-orange-100 text-orange-700' :
                        'bg-red-100 text-red-700'
                      }`}>
                        {lic.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link href={`/admin/licenses/${lic.id}`} className="inline-flex items-center justify-center p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                        <Settings2 className="h-5 w-5" />
                      </Link>
                    </td>
                  </tr>
                ))
              }
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}
