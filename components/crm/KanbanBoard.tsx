'use client'

import { useState } from 'react'
import { Card } from '@/components/Card'
import { updateLeadStage } from '@/app/actions/crm'
import Link from 'next/link'

const STAGES = [
  'New Lead', 'Contacted', 'Demo Scheduled', 'Demo Completed', 
  'Negotiation', 'Payment Pending', 'Won', 'Lost'
]

export function KanbanBoard({ leads }: { leads: any[] }) {
  const [movingId, setMovingId] = useState<string | null>(null)

  const handleDragStart = (e: React.DragEvent, leadId: string) => {
    e.dataTransfer.setData('leadId', leadId)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const handleDrop = async (e: React.DragEvent, stage: string) => {
    e.preventDefault()
    const leadId = e.dataTransfer.getData('leadId')
    if (leadId) {
      setMovingId(leadId)
      await updateLeadStage(leadId, stage)
      setMovingId(null)
    }
  }

  return (
    <div className="flex gap-4 overflow-x-auto pb-6 pt-2 h-[calc(100vh-200px)]">
      {STAGES.map(stage => {
        const stageLeads = leads.filter(l => l.pipeline_stage === stage)
        return (
          <div 
            key={stage} 
            className="flex-shrink-0 w-80 flex flex-col bg-gray-50 dark:bg-gray-900/50 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden"
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, stage)}
          >
            <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 flex justify-between items-center sticky top-0">
              <h3 className="font-semibold text-gray-800 dark:text-gray-200 text-sm">{stage}</h3>
              <span className="bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 text-xs px-2 py-0.5 rounded-full font-medium">
                {stageLeads.length}
              </span>
            </div>
            
            <div className="flex-1 overflow-y-auto p-3 space-y-3">
              {stageLeads.map(lead => (
                <div 
                  key={lead.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, lead.id)}
                  className={`bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 cursor-grab active:cursor-grabbing hover:border-blue-300 dark:hover:border-blue-700 transition-colors ${movingId === lead.id ? 'opacity-50' : ''}`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-bold text-gray-900 dark:text-white text-sm line-clamp-1">
                      <Link href={`/dashboard/leads/${lead.id}`} className="hover:text-blue-600">{lead.business_name}</Link>
                    </h4>
                    <span className={`text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded ${
                      lead.priority === 'High' ? 'bg-red-100 text-red-700' : 
                      lead.priority === 'Low' ? 'bg-gray-100 text-gray-600' : 
                      'bg-orange-100 text-orange-700'
                    }`}>
                      {lead.priority}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">{lead.customer_name} • {lead.lead_number}</p>
                  <div className="flex justify-between items-center text-xs text-gray-400">
                    <span>₹{Number(lead.expected_value || 0).toLocaleString()}</span>
                    <span>{new Date(lead.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
              ))}
              {stageLeads.length === 0 && (
                <div className="text-center py-8 text-xs text-gray-400 dark:text-gray-600 border-2 border-dashed border-gray-200 dark:border-gray-800 rounded-lg">
                  Drop leads here
                </div>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
