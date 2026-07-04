'use client'

import { useState } from 'react'
import { Card } from '@/components/Card'
import { Button } from '@/components/Button'
import { Input } from '@/components/Input'
import { Select } from '@/components/Select'
import { Plus, Search, MoreVertical, Calendar } from 'lucide-react'
import { updateLeadStage } from '@/app/actions/crm'
import Link from 'next/link'

type Lead = {
  id: string
  lead_number: string
  business_name: string
  customer_name: string
  phone: string
  email: string
  lead_source: string
  priority: string
  pipeline_stage: string
  assigned_vendor_id?: string
  assigned_sales_executive_id?: string
  sales_executives?: { full_name: string }
  vendors?: { company_name: string }
}

const STAGES = [
  'New Lead', 'Contacted', 'Demo Scheduled', 'Demo Completed', 
  'Negotiation', 'Payment Pending', 'Won', 'Lost'
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

  const handleStageChange = async (leadId: string, newStage: string) => {
    if (newStage === 'Won') {
      if(!confirm("Marking as Won will automatically record the win date. Proceed?")) return;
    }
    await updateLeadStage(leadId, newStage)
    window.location.reload()
  }

  const filteredLeads = initialLeads.filter(l => {
    const matchesSearch = l.business_name?.toLowerCase().includes(search.toLowerCase()) || 
                          l.customer_name?.toLowerCase().includes(search.toLowerCase()) ||
                          l.lead_number?.toLowerCase().includes(search.toLowerCase()) ||
                          l.phone?.includes(search) ||
                          l.email?.toLowerCase().includes(search.toLowerCase())
    const matchesStage = stageFilter === 'all' || l.pipeline_stage === stageFilter
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
                placeholder="Search business, customer, phone, email, lead #..." 
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
          <Link href="/dashboard/leads/new">
            <Button className="flex items-center gap-2 w-full lg:w-auto">
              <Plus className="h-4 w-4" />
              New Lead
            </Button>
          </Link>
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
                      <div className="text-gray-500 text-xs mt-0.5">{lead.customer_name} • {lead.lead_number}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-gray-900 font-medium">{lead.phone}</div>
                      <div className="text-gray-500 text-xs mt-0.5">{lead.email}</div>
                      <div className="flex items-center gap-2 mt-2">
                        {lead.phone && (
                          <>
                            <a href={`tel:${lead.phone}`} title="Call" className="p-1.5 bg-blue-50 text-blue-600 rounded-md hover:bg-blue-100">
                              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                            </a>
                            <a href={`https://wa.me/${lead.phone.replace(/\D/g, '')}`} target="_blank" rel="noreferrer" title="WhatsApp" className="p-1.5 bg-green-50 text-green-600 rounded-md hover:bg-green-100">
                              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 21l1.65-3.8a9 9 0 1 1 3.4 2.9L3 21"/><path d="M9 10a.5.5 0 0 0 1 0V9a.5.5 0 0 0-1 0v1a5 5 0 0 0 5 5h1a.5.5 0 0 0 0-1h-1a.5.5 0 0 0 0 1"/></svg>
                            </a>
                          </>
                        )}
                        {lead.email && (
                          <a href={`mailto:${lead.email}`} title="Email" className="p-1.5 bg-gray-100 text-gray-600 rounded-md hover:bg-gray-200">
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
                          </a>
                        )}
                      </div>
                    </td>
                    {(userRole === 'admin' || userRole === 'vendor') && (
                      <td className="px-6 py-4 text-gray-600">
                        {lead.sales_executives?.full_name || 'Unassigned'}
                        {lead.vendors?.company_name && (
                          <div className="text-xs text-gray-400 mt-0.5">{lead.vendors.company_name}</div>
                        )}
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
                      <div className="text-gray-500 text-xs mt-1">{lead.lead_source}</div>
                    </td>
                    <td className="px-6 py-4">
                      <select 
                        value={lead.pipeline_stage}
                        onChange={(e) => handleStageChange(lead.id, e.target.value)}
                        className={`text-xs rounded-full px-2 py-1 font-semibold border border-gray-200 bg-white ${
                          lead.pipeline_stage === 'Won' ? 'bg-green-50 text-green-700 border-green-200' : 
                          lead.pipeline_stage === 'Lost' ? 'bg-red-50 text-red-700 border-red-200' : 
                          'text-gray-700'
                        }`}
                      >
                        {STAGES.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link href={`/dashboard/leads/${lead.id}`}>
                        <Button variant="outline" size="sm">Details</Button>
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}
