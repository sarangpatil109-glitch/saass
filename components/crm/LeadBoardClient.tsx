'use client'

import { useState } from 'react'
import { Card } from '@/components/Card'
import { Button } from '@/components/Button'
import { Input } from '@/components/Input'
import { Select } from '@/components/Select'
import { Plus, Search, MoreVertical, Calendar } from 'lucide-react'
import { createLead, updateLeadStage } from '@/app/actions/lead'

type Lead = {
  id: string
  business_name: string
  owner_name: string
  mobile: string
  email: string
  source: string
  priority: string
  stage: string
  vendor_id?: string
  sales_executive_id?: string
  sales_executive?: { full_name: string }
  vendor?: { company_name: string }
}

const STAGES = [
  'New Lead', 'Contacted', 'Demo Scheduled', 'Demo Completed', 
  'Follow-up', 'Payment Pending', 'Won', 'Lost', 'Archived'
]

export function LeadBoardClient({ 
  initialLeads, 
  salesExecs,
  userRole
}: { 
  initialLeads: Lead[], 
  salesExecs: {id: string, full_name: string}[],
  userRole: 'admin' | 'vendor' | 'sales_executive' 
}) {
  const [search, setSearch] = useState('')
  const [stageFilter, setStageFilter] = useState('all')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    const formData = new FormData(e.currentTarget)
    await createLead(formData)
    setIsModalOpen(false)
    setLoading(false)
    window.location.reload()
  }

  const handleStageChange = async (leadId: string, newStage: string) => {
    if (newStage === 'Won') {
      if(!confirm("Marking as Won will automatically convert this lead into a Customer. Proceed?")) return;
    }
    await updateLeadStage(leadId, newStage)
    window.location.reload()
  }

  const filteredLeads = initialLeads.filter(l => {
    const matchesSearch = l.business_name.toLowerCase().includes(search.toLowerCase()) || 
                          l.owner_name.toLowerCase().includes(search.toLowerCase()) ||
                          l.mobile.includes(search)
    const matchesStage = stageFilter === 'all' || l.stage === stageFilter
    return matchesSearch && matchesStage
  })

  return (
    <div className="space-y-6">
      <Card className="overflow-hidden">
        <div className="p-4 sm:p-6 flex flex-col lg:flex-row gap-4 border-b">
          <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="relative w-full">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
              <Input 
                type="search" 
                placeholder="Search business, owner, mobile..." 
                className="w-full pl-9"
                value={search}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
              />
            </div>
            <Select 
              value={stageFilter} 
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setStageFilter(e.target.value)}
            >
              <option value="all">All Stages</option>
              {STAGES.map(s => <option key={s} value={s}>{s}</option>)}
            </Select>
          </div>
          <Button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2 lg:w-auto">
            <Plus className="h-4 w-4" />
            New Lead
          </Button>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 text-gray-500 font-medium border-b">
              <tr>
                <th className="px-6 py-4">Lead Info</th>
                <th className="px-6 py-4">Contact</th>
                {(userRole === 'admin' || userRole === 'vendor') && <th className="px-6 py-4">Assigned To</th>}
                <th className="px-6 py-4">Priority & Source</th>
                <th className="px-6 py-4">Pipeline Stage</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filteredLeads.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                    No leads found matching your criteria.
                  </td>
                </tr>
              ) : (
                filteredLeads.map((lead) => (
                  <tr key={lead.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900">{lead.business_name}</div>
                      <div className="text-gray-500 text-xs mt-0.5">{lead.owner_name}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-gray-900">{lead.mobile}</div>
                      <div className="text-gray-500 text-xs mt-0.5">{lead.email}</div>
                    </td>
                    {(userRole === 'admin' || userRole === 'vendor') && (
                      <td className="px-6 py-4 text-gray-600">
                        {lead.sales_executive?.full_name || 'Unassigned'}
                      </td>
                    )}
                    <td className="px-6 py-4">
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                        lead.priority === 'Urgent' ? 'bg-red-100 text-red-700' :
                        lead.priority === 'High' ? 'bg-orange-100 text-orange-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {lead.priority}
                      </span>
                      <div className="text-gray-500 text-xs mt-1">{lead.source}</div>
                    </td>
                    <td className="px-6 py-4">
                      <select 
                        value={lead.stage}
                        onChange={(e) => handleStageChange(lead.id, e.target.value)}
                        className={`text-xs rounded-full px-2 py-1 font-semibold border border-gray-200 bg-white ${
                          lead.stage === 'Won' ? 'bg-green-50 text-green-700 border-green-200' : 
                          lead.stage === 'Lost' ? 'bg-red-50 text-red-700 border-red-200' : 
                          'text-gray-700'
                        }`}
                      >
                        {STAGES.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Button variant="outline" size="sm">Details</Button>
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
              <h3 className="text-lg font-semibold text-gray-900">Create New Lead</h3>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Business Name *</label>
                  <Input name="business_name" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Owner Name *</label>
                  <Input name="owner_name" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Mobile Number *</label>
                  <Input name="mobile" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                  <Input name="email" type="email" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Lead Source</label>
                  <Select name="source">
                    <option value="Website">Website</option>
                    <option value="Phone Call">Phone Call</option>
                    <option value="Referral">Referral</option>
                    <option value="WhatsApp">WhatsApp</option>
                    <option value="Other">Other</option>
                  </Select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                  <Select name="priority">
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Urgent">Urgent</option>
                    <option value="Low">Low</option>
                  </Select>
                </div>
                
                {(userRole === 'admin' || userRole === 'vendor') && (
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Assign Sales Executive *</label>
                    <Select name="sales_executive_id" required>
                      <option value="" disabled selected>Select an Executive...</option>
                      {salesExecs.map(exec => (
                        <option key={exec.id} value={exec.id}>{exec.full_name}</option>
                      ))}
                    </Select>
                  </div>
                )}
                
                {userRole === 'sales_executive' && salesExecs.length > 0 && (
                  <input type="hidden" name="sales_executive_id" value={salesExecs[0].id} />
                )}

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                  <Input name="city" />
                </div>
              </div>
              <div className="pt-4 flex justify-end gap-3 border-t mt-6">
                <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={loading}>
                  {loading ? 'Saving...' : 'Create Lead'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
