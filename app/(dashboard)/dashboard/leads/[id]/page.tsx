import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { ArrowLeft, Phone, Mail, MapPin, Building2, Calendar, Target, PlusCircle, MessageCircle, FileText, CheckCircle, AlertCircle } from 'lucide-react'
import Link from 'next/link'
import { Card } from '@/components/Card'
import { Button } from '@/components/Button'

export default async function (props: { params: Promise<any> }) {
  const params = await props.params;
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (process.env.DEVELOPMENT_MODE !== 'true' && !user) redirect('/login')

  const { data: lead } = await supabase.from('leads').select(`
    *,
    products(name),
    vendors(business_name),
    sales_executives(full_name)
  `).eq('id', params.id).single()
  
  if (!lead) redirect('/dashboard/leads')

  const { data: timeline } = await supabase.from('lead_timeline').select('*, profiles(full_name)').eq('lead_id', params.id).order('created_at', { ascending: false })
  const { data: followups } = await supabase.from('lead_followups').select('*, profiles(full_name)').eq('lead_id', params.id).order('followup_date', { ascending: false })
  const { data: notes } = await supabase.from('lead_notes').select('*, profiles(full_name)').eq('lead_id', params.id).order('created_at', { ascending: false })

  const whatsappMessage = encodeURIComponent(`Hello ${lead.customer_name},\n\nThank you for your interest in our software.\n\nWould you like a live demo today?`)

  return (
    <div className="space-y-6 pb-12">
      <div>
        <Link href="/dashboard/leads" className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-gray-700 mb-4">
          <ArrowLeft className="h-4 w-4 mr-1" /> Back to Pipeline
        </Link>
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4"><div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">{lead.business_name}</h1>
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
                {lead.pipeline_stage}
              </span>
            </div>
        
      </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Lead Owner: {lead.customer_name} • #{lead.lead_number}</p>
          </div>
          <div className="flex gap-2">
            <Link href={`/dashboard/leads/${lead.id}/edit`}>
              <Button variant="outline">Edit Lead</Button>
            </Link>
            <a href={`tel:${lead.phone}`} title="Call Lead">
              <Button className="bg-green-600 hover:bg-green-700 text-white"><Phone className="h-4 w-4" /></Button>
            </a>
            {lead.whatsapp_number && (
              <a href={`https://wa.me/${lead.whatsapp_number}?text=${whatsappMessage}`} target="_blank" rel="noopener noreferrer" title="WhatsApp Lead">
                <Button className="bg-emerald-500 hover:bg-emerald-600 text-white"><MessageCircle className="h-4 w-4" /></Button>
              </a>
            )}
            {lead.email && (
              <a href={`mailto:${lead.email}`} title="Email Lead">
                <Button className="bg-blue-600 hover:bg-blue-700 text-white"><Mail className="h-4 w-4" /></Button>
              </a>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card className="p-6 bg-white dark:bg-gray-900 shadow-sm border border-gray-100 dark:border-gray-800">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Contact & Deal Info</h3>
            <div className="grid grid-cols-2 gap-y-4 gap-x-6 text-sm">
              <div className="flex items-start gap-3">
                <Phone className="h-4 w-4 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-gray-500 mb-1">Mobile</p>
                  <p className="font-medium text-gray-900 dark:text-white">{lead.phone}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Mail className="h-4 w-4 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-gray-500 mb-1">Email</p>
                  <p className="font-medium text-gray-900 dark:text-white">{lead.email || '-'}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Building2 className="h-4 w-4 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-gray-500 mb-1">Location</p>
                  <p className="font-medium text-gray-900 dark:text-white">{lead.city ? `${lead.city}, ${lead.state}` : '-'}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Target className="h-4 w-4 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-gray-500 mb-1">Expected Value</p>
                  <p className="font-medium text-gray-900 dark:text-white">₹{Number(lead.expected_value || 0).toLocaleString()}</p>
                </div>
              </div>
              
              <div className="col-span-2 border-t border-gray-100 dark:border-gray-800 mt-2 pt-4 grid grid-cols-2 gap-4">
                <div>
                  <p className="text-gray-500 mb-1">Assigned Vendor</p>
                  <p className="font-medium text-gray-900 dark:text-white">{lead.vendors?.business_name || 'None'}</p>
                </div>
                <div>
                  <p className="text-gray-500 mb-1">Assigned Sales Executive</p>
                  <p className="font-medium text-gray-900 dark:text-white">{lead.sales_executives?.full_name || 'None'}</p>
                </div>
              </div>
            </div>
          </Card>

          <Card className="p-6 bg-white dark:bg-gray-900 shadow-sm border border-gray-100 dark:border-gray-800">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Operations Status</h3>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-center">
               <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
                 <p className="text-xs text-gray-500 mb-1">Payment</p>
                 <span className="font-medium text-gray-900 dark:text-white">-</span>
               </div>
               <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
                 <p className="text-xs text-gray-500 mb-1">Order</p>
                 <span className="font-medium text-gray-900 dark:text-white">-</span>
               </div>
               <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
                 <p className="text-xs text-gray-500 mb-1">Commission</p>
                 <span className="font-medium text-gray-900 dark:text-white">-</span>
               </div>
               <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
                 <p className="text-xs text-gray-500 mb-1">ZIP</p>
                 <span className="font-medium text-gray-900 dark:text-white">-</span>
               </div>
               <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
                 <p className="text-xs text-gray-500 mb-1">License</p>
                 <span className="font-medium text-gray-900 dark:text-white">-</span>
               </div>
            </div>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="p-6 bg-white dark:bg-gray-900 shadow-sm border border-gray-100 dark:border-gray-800">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">Follow-ups</h3>
                <Button size="sm" variant="outline"><PlusCircle className="h-4 w-4 mr-2" /> Add</Button>
              </div>
              <div className="space-y-3">
                {followups && followups.length > 0 ? followups.map((f: any) => (
                  <div key={f.id} className="p-3 border border-gray-100 dark:border-gray-800 rounded-lg bg-gray-50 dark:bg-gray-800/50 flex justify-between items-center">
                    <div>
                      <p className="font-medium text-sm text-gray-900 dark:text-white">{f.followup_type} - {new Date(f.followup_date).toLocaleDateString()}</p>
                      <p className="text-xs text-gray-500 mt-1">{f.remarks || 'No remarks'}</p>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded font-medium ${
                      f.status === 'Completed' ? 'bg-green-100 text-green-700' :
                      f.status === 'Pending' ? 'bg-orange-100 text-orange-700' : 'bg-red-100 text-red-700'
                    }`}>
                      {f.status}
                    </span>
                  </div>
                )) : (
                  <p className="text-sm text-gray-500">No follow-ups scheduled.</p>
                )}
              </div>
            </Card>

            <Card className="p-6 bg-white dark:bg-gray-900 shadow-sm border border-gray-100 dark:border-gray-800">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">Notes</h3>
                <Button size="sm" variant="outline"><PlusCircle className="h-4 w-4 mr-2" /> Add</Button>
              </div>
              <div className="space-y-3">
                {notes && notes.length > 0 ? notes.map((n: any) => {
                  const profile = Array.isArray(n.profiles) ? n.profiles[0] : n.profiles;
                  return (
                  <div key={n.id} className="p-3 border border-gray-100 dark:border-gray-800 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                    <p className="text-sm text-gray-700 dark:text-gray-300">{n.note}</p>
                    <div className="flex justify-between items-center mt-2 text-xs text-gray-400">
                      <span>{(profile as any)?.full_name || 'User'}</span>
                      <span>{new Date(n.created_at).toLocaleString()}</span>
                    </div>
                  </div>
                  )
                }) : (
                  <p className="text-sm text-gray-500">No notes yet.</p>
                )}
              </div>
            </Card>
          </div>

        </div>

        <div className="space-y-6">
          <Card className="p-6 bg-white dark:bg-gray-900 shadow-sm border border-gray-100 dark:border-gray-800">
            <h3 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider mb-4 flex items-center"><Calendar className="w-4 h-4 mr-2" /> Timeline</h3>
            <div className="space-y-4">
              {timeline && timeline.length > 0 ? timeline.map((log: any) => {
                const profile = Array.isArray(log.profiles) ? log.profiles[0] : log.profiles;
                return (
                  <div key={log.id} className="text-sm pb-4 border-b border-gray-50 dark:border-gray-800 last:border-0 last:pb-0">
                    <p className="font-medium text-gray-900 dark:text-white">{log.action}</p>
                    <p className="text-gray-500 dark:text-gray-400 text-xs mt-0.5">{log.details}</p>
                    <div className="flex justify-between text-xs text-gray-400 mt-2">
                      <span>{(profile as any)?.full_name || 'System'}</span>
                      <span>{new Date(log.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                )
              }) : (
                <p className="text-sm text-gray-500">No timeline events yet.</p>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
