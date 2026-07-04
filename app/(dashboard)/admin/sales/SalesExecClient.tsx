'use client'

import { useState } from 'react'
import { Card } from '@/components/Card'
import { Button } from '@/components/Button'
import { Input } from '@/components/Input'
import { Select } from '@/components/Select'
import { Plus, Edit2, Trash2, Search } from 'lucide-react'
import { createSalesExec, updateSalesExec, deleteSalesExec, updateSalesExecStatus } from '@/app/actions/sales_exec'

type Vendor = {
  id: string
  company_name: string
  vendor_code: string
}

type SalesExec = {
  id: string
  full_name: string
  email: string
  phone: string
  address: string
  city: string
  state: string
  status: string
  vendor_code: string
  vendor_id: string
  created_at: string
  vendor: { company_name: string, vendor_code: string }
}

export function SalesExecClient({ initialExecs, activeVendors }: { initialExecs: SalesExec[], activeVendors: Vendor[] }) {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [vendorFilter, setVendorFilter] = useState('all')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [editingExec, setEditingExec] = useState<SalesExec | null>(null)
  const [execToDelete, setExecToDelete] = useState<string | null>(null)

  const handleOpenCreate = () => {
    setEditingExec(null)
    setIsModalOpen(true)
  }

  const handleOpenEdit = (exec: SalesExec) => {
    setEditingExec(exec)
    setIsModalOpen(true)
  }

  const handleOpenDelete = (id: string) => {
    setExecToDelete(id)
    setIsDeleteOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    const formData = new FormData(e.currentTarget)
    
    if (editingExec) {
      await updateSalesExec(editingExec.id, formData)
    } else {
      await createSalesExec(formData)
    }
    
    setIsModalOpen(false)
    setLoading(false)
    window.location.reload()
  }

  const handleDelete = async () => {
    if (!execToDelete) return
    setLoading(true)
    await deleteSalesExec(execToDelete)
    setIsDeleteOpen(false)
    setLoading(false)
    window.location.reload()
  }

  const handleStatusChange = async (id: string, newStatus: string) => {
    await updateSalesExecStatus(id, newStatus)
    window.location.reload()
  }

  const filteredExecs = initialExecs.filter(v => {
    const matchesSearch = v.full_name?.toLowerCase().includes(search.toLowerCase()) || 
                          v.email?.toLowerCase().includes(search.toLowerCase()) ||
                          v.vendor_code?.toLowerCase().includes(search.toLowerCase())
    const matchesStatus = statusFilter === 'all' || v.status === statusFilter
    const matchesVendor = vendorFilter === 'all' || v.vendor_id === vendorFilter
    return matchesSearch && matchesStatus && matchesVendor
  })

  return (
    <>
      <Card className="overflow-hidden">
        <div className="p-4 sm:p-6 flex flex-col lg:flex-row gap-4 border-b">
          <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="relative w-full">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
              <Input 
                type="search" 
                placeholder="Search name, email, code..." 
                className="w-full pl-9"
                value={search}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
              />
            </div>
            <Select 
              value={vendorFilter} 
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setVendorFilter(e.target.value)}
            >
              <option value="all">All Vendors</option>
              {activeVendors.map(v => (
                <option key={v.id} value={v.id}>{v.company_name} ({v.vendor_code})</option>
              ))}
            </Select>
            <Select 
              value={statusFilter} 
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setStatusFilter(e.target.value)}
            >
              <option value="all">All Statuses</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="suspended">Suspended</option>
            </Select>
          </div>
          <Button onClick={handleOpenCreate} className="flex items-center gap-2 lg:w-auto">
            <Plus className="h-4 w-4" />
            Add Exec
          </Button>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 text-gray-500 font-medium border-b">
              <tr>
                <th className="px-6 py-4">Executive</th>
                <th className="px-6 py-4">Linked Vendor</th>
                <th className="px-6 py-4">Location</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filteredExecs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                    No sales executives found.
                  </td>
                </tr>
              ) : (
                filteredExecs.map((exec) => (
                  <tr key={exec.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900">{exec.full_name}</div>
                      <div className="text-gray-500 text-xs mt-0.5">{exec.email} • {exec.phone}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900">{exec.vendor?.company_name}</div>
                      <div className="font-mono text-gray-600 text-xs mt-0.5">{exec.vendor_code}</div>
                    </td>
                    <td className="px-6 py-4 text-gray-600">
                      {exec.city}, {exec.state}
                    </td>
                    <td className="px-6 py-4">
                      <select 
                        value={exec.status}
                        onChange={(e) => handleStatusChange(exec.id, e.target.value)}
                        className={`text-xs rounded-full px-2 py-1 font-semibold border-0 ${
                          exec.status === 'active' ? 'bg-green-100 text-green-700' : 
                          exec.status === 'suspended' ? 'bg-red-100 text-red-700' : 
                          'bg-gray-100 text-gray-700'
                        }`}
                      >
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                        <option value="suspended">Suspended</option>
                      </select>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={() => handleOpenEdit(exec)}
                          className="p-1 text-blue-500 hover:text-blue-700 transition-colors"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button 
                          onClick={() => handleOpenDelete(exec.id)}
                          className="p-1 text-red-500 hover:text-red-700 transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl my-8">
            <div className="px-6 py-4 border-b">
              <h3 className="text-lg font-semibold text-gray-900">
                {editingExec ? 'Edit Sales Executive' : 'Create Sales Executive'}
              </h3>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                  <Input name="full_name" required defaultValue={editingExec?.full_name || ''} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <Input name="email" type="email" required defaultValue={editingExec?.email || ''} readOnly={!!editingExec} className={editingExec ? "bg-gray-100" : ""} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                  <Input name="phone" required defaultValue={editingExec?.phone || ''} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Assign to Vendor</label>
                  <Select name="vendor_id" required defaultValue={editingExec?.vendor_id || ''}>
                    <option value="" disabled>Select a Vendor...</option>
                    {activeVendors.map(v => (
                      <option key={v.id} value={v.id}>{v.company_name} ({v.vendor_code})</option>
                    ))}
                  </Select>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                  <Input name="address" required defaultValue={editingExec?.address || ''} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                  <Input name="city" required defaultValue={editingExec?.city || ''} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
                  <Input name="state" required defaultValue={editingExec?.state || ''} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <Select name="status" defaultValue={editingExec?.status || 'active'}>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="suspended">Suspended</option>
                  </Select>
                </div>
              </div>
              <div className="pt-4 flex justify-end gap-3 border-t mt-6">
                <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={loading}>
                  {loading ? 'Saving...' : 'Save Executive'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {isDeleteOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6 text-center">
            <Trash2 className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Delete Executive?</h3>
            <p className="text-sm text-gray-500 mb-6">Are you sure? This will permanently delete their account.</p>
            <div className="flex justify-center gap-3">
              <Button type="button" variant="outline" onClick={() => setIsDeleteOpen(false)}>Cancel</Button>
              <Button type="button" variant="destructive" onClick={handleDelete} disabled={loading}>
                {loading ? 'Deleting...' : 'Delete'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
