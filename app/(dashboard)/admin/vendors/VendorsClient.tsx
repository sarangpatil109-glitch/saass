'use client'

import { useState } from 'react'
import { Card } from '@/components/Card'
import { Button } from '@/components/Button'
import { Input } from '@/components/Input'
import { Select } from '@/components/Select'
import { Badge } from '@/components/Badge'
import { Plus, Edit2, Trash2, MoreVertical, Key, Search } from 'lucide-react'
import { createVendor, updateVendor, deleteVendor, updateVendorStatus, regenerateVendorCode } from '@/app/actions/vendor'

type Vendor = {
  id: string
  vendor_code: string
  company_name: string
  owner_name: string
  contact_email: string
  contact_phone: string
  address: string
  city: string
  state: string
  status: string
  created_at: string
}

export function VendorsClient({ initialVendors }: { initialVendors: Vendor[] }) {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [editingVendor, setEditingVendor] = useState<Vendor | null>(null)
  const [vendorToDelete, setVendorToDelete] = useState<string | null>(null)

  const handleOpenCreate = () => {
    setEditingVendor(null)
    setIsModalOpen(true)
  }

  const handleOpenEdit = (vendor: Vendor) => {
    setEditingVendor(vendor)
    setIsModalOpen(true)
  }

  const handleOpenDelete = (id: string) => {
    setVendorToDelete(id)
    setIsDeleteOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    const formData = new FormData(e.currentTarget)
    
    if (editingVendor) {
      await updateVendor(editingVendor.id, formData)
    } else {
      await createVendor(formData)
    }
    
    setIsModalOpen(false)
    setLoading(false)
    window.location.reload()
  }

  const handleDelete = async () => {
    if (!vendorToDelete) return
    setLoading(true)
    await deleteVendor(vendorToDelete)
    setIsDeleteOpen(false)
    setLoading(false)
    window.location.reload()
  }

  const handleStatusChange = async (id: string, newStatus: string) => {
    await updateVendorStatus(id, newStatus)
    window.location.reload()
  }

  const handleRegenerateCode = async (id: string) => {
    if (confirm("Are you sure you want to regenerate the vendor code? The vendor will need the new code to access their services.")) {
      await regenerateVendorCode(id)
      window.location.reload()
    }
  }

  // Filter logic
  const filteredVendors = initialVendors.filter(v => {
    const matchesSearch = v.company_name.toLowerCase().includes(search.toLowerCase()) || 
                          (v.vendor_code && v.vendor_code.toLowerCase().includes(search.toLowerCase())) ||
                          v.contact_email.toLowerCase().includes(search.toLowerCase())
    const matchesStatus = statusFilter === 'all' || v.status === statusFilter
    return matchesSearch && matchesStatus
  })

  return (
    <>
      <Card className="overflow-hidden">
        <div className="p-4 sm:p-6 flex flex-col sm:flex-row gap-4 border-b">
          <div className="flex-1 flex flex-col sm:flex-row gap-4">
            <div className="relative max-w-sm w-full">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
              <Input 
                type="search" 
                placeholder="Search vendor name, code, email..." 
                className="w-full pl-9"
                value={search}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
              />
            </div>
            <Select 
              className="max-w-[200px]" 
              value={statusFilter} 
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setStatusFilter(e.target.value)}
            >
              <option value="all">All Statuses</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="suspended">Suspended</option>
            </Select>
          </div>
          <Button onClick={handleOpenCreate} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Add Vendor
          </Button>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 text-gray-500 font-medium border-b">
              <tr>
                <th className="px-6 py-4">Vendor Info</th>
                <th className="px-6 py-4">Vendor Code</th>
                <th className="px-6 py-4">Contact</th>
                <th className="px-6 py-4">Location</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filteredVendors.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                    No vendors found matching your filters.
                  </td>
                </tr>
              ) : (
                filteredVendors.map((vendor) => (
                  <tr key={vendor.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900">{vendor.company_name}</div>
                      <div className="text-gray-500 text-xs mt-0.5">{vendor.owner_name}</div>
                    </td>
                    <td className="px-6 py-4 font-mono text-gray-600">{vendor.vendor_code || 'Pending...'}</td>
                    <td className="px-6 py-4">
                      <div className="text-gray-900">{vendor.contact_email}</div>
                      <div className="text-gray-500 text-xs mt-0.5">{vendor.contact_phone}</div>
                    </td>
                    <td className="px-6 py-4 text-gray-600">
                      {vendor.city}, {vendor.state}
                    </td>
                    <td className="px-6 py-4">
                      <select 
                        value={vendor.status}
                        onChange={(e) => handleStatusChange(vendor.id, e.target.value)}
                        className={`text-xs rounded-full px-2 py-1 font-semibold border-0 ${
                          vendor.status === 'active' ? 'bg-green-100 text-green-700' : 
                          vendor.status === 'suspended' ? 'bg-red-100 text-red-700' : 
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
                          onClick={() => handleRegenerateCode(vendor.id)}
                          className="p-1 text-orange-500 hover:text-orange-700 transition-colors"
                          title="Regenerate Vendor Code"
                        >
                          <Key className="h-4 w-4" />
                        </button>
                        <button 
                          onClick={() => handleOpenEdit(vendor)}
                          className="p-1 text-blue-500 hover:text-blue-700 transition-colors"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button 
                          onClick={() => handleOpenDelete(vendor.id)}
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

      {/* Vendor Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl my-8">
            <div className="px-6 py-4 border-b">
              <h3 className="text-lg font-semibold text-gray-900">
                {editingVendor ? 'Edit Vendor' : 'Create Vendor'}
              </h3>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Company Name</label>
                  <Input name="company_name" required defaultValue={editingVendor?.company_name || ''} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Owner Name</label>
                  <Input name="owner_name" required defaultValue={editingVendor?.owner_name || ''} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <Input name="email" type="email" required defaultValue={editingVendor?.contact_email || ''} readOnly={!!editingVendor} className={editingVendor ? "bg-gray-100" : ""} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                  <Input name="phone" required defaultValue={editingVendor?.contact_phone || ''} />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                  <Input name="address" required defaultValue={editingVendor?.address || ''} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                  <Input name="city" required defaultValue={editingVendor?.city || ''} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
                  <Input name="state" required defaultValue={editingVendor?.state || ''} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <Select name="status" defaultValue={editingVendor?.status || 'active'}>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="suspended">Suspended</option>
                  </Select>
                </div>
              </div>
              <div className="pt-4 flex justify-end gap-3 border-t mt-6">
                <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={loading}>
                  {loading ? 'Saving...' : 'Save Vendor'}
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
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Delete Vendor?</h3>
            <p className="text-sm text-gray-500 mb-6">Are you sure? This will delete the vendor profile and revoke all access.</p>
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
