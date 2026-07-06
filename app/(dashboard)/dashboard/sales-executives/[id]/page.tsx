import { createClient } from '@/utils/supabase/server'
import { ArrowLeft, Clock, MapPin, Briefcase, Store, Mail, Phone, Target } from 'lucide-react'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { Card } from '@/components/Card'
import { SalesExecutiveActions } from '@/components/sales/SalesExecutiveActions'
import { TargetManagement } from '@/components/sales/TargetManagement'

export default async function (props: { params: Promise<any> }) {
  const params = await props.params;
  const supabase = await createClient()

  // Protect route
  const { data: { user } } = await supabase.auth.getUser()
  if (process.env.DEVELOPMENT_MODE !== 'true' && !user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', (user?.id || '')).single()
  if (process.env.DEVELOPMENT_MODE !== 'true' && profile?.role !== 'admin') redirect('/unauthorized')

  const { data: exec } = await supabase.from('sales_executives').select(`
    *,
    vendors (business_name)
  `).eq('id', params.id).single()
  
  if (!exec) redirect('/dashboard/sales-executives')

  const { data: logs } = await supabase.from('sales_activity_logs').select(`
    *,
    profiles (full_name)
  `).eq('sales_exec_id', params.id).order('created_at', { ascending: false })

  const { data: targets } = await supabase.from('sales_targets').select('*').eq('sales_exec_id', params.id).order('end_date', { ascending: false })

  const vendorInfo = Array.isArray(exec.vendors) ? exec.vendors[0] : exec.vendors;

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div>
        <Link href="/dashboard/sales-executives" className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 mb-4">
          <ArrowLeft className="h-4 w-4 mr-1" /> Back to Executives
        </Link>
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold text-2xl shadow-sm border border-blue-200 dark:border-blue-800">
              {exec.profile_photo ? <img src={exec.profile_photo} alt="" className="w-full h-full object-cover rounded-full" /> : (exec.full_name || [exec.first_name, exec.last_name].filter(Boolean).join(' ') || 'U').charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4"><div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">{exec.full_name || [exec.first_name, exec.last_name].filter(Boolean).join(' ') || 'Unknown'}</h1>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  exec.status === 'Active' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' :
                  exec.status === 'Suspended' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' :
                  'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300'
                }`}>
                  {exec.status}
                </span>
              </div>
        
      </div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Employee ID: <span className="font-mono text-gray-900 dark:text-gray-300">{exec.employee_code}</span></p>
            </div>
          </div>
          
          <SalesExecutiveActions exec={exec} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="p-6 bg-white dark:bg-gray-900 shadow-sm border border-gray-100 dark:border-gray-800">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center"><Briefcase className="w-5 h-5 mr-2" /> Basic Details</h3>
            <div className="grid grid-cols-2 gap-y-4 gap-x-6 text-sm">
              <div>
                <p className="text-gray-500 dark:text-gray-400 mb-1">Email Address</p>
                <p className="font-medium text-gray-900 dark:text-white">{exec.email}</p>
              </div>
              <div>
                <p className="text-gray-500 dark:text-gray-400 mb-1">Phone Number</p>
                <p className="font-medium text-gray-900 dark:text-white">{exec.phone}</p>
              </div>
              <div>
                <p className="text-gray-500 dark:text-gray-400 mb-1">WhatsApp</p>
                <p className="font-medium text-gray-900 dark:text-white">{exec.whatsapp_number || '-'}</p>
              </div>
              <div>
                <p className="text-gray-500 dark:text-gray-400 mb-1">Designation</p>
                <p className="font-medium text-gray-900 dark:text-white">{exec.designation || 'Sales Executive'}</p>
              </div>
              <div>
                <p className="text-gray-500 dark:text-gray-400 mb-1">Joining Date</p>
                <p className="font-medium text-gray-900 dark:text-white">{new Date(exec.joining_date).toLocaleDateString()}</p>
              </div>
            </div>
          </Card>

          <Card className="p-6 bg-white dark:bg-gray-900 shadow-sm border border-gray-100 dark:border-gray-800">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center"><MapPin className="w-5 h-5 mr-2" /> Location Details</h3>
            <div className="grid grid-cols-2 gap-y-4 gap-x-6 text-sm">
              <div className="col-span-2">
                <p className="text-gray-500 dark:text-gray-400 mb-1">Address</p>
                <p className="font-medium text-gray-900 dark:text-white">{exec.address || '-'}</p>
              </div>
              <div>
                <p className="text-gray-500 dark:text-gray-400 mb-1">City</p>
                <p className="font-medium text-gray-900 dark:text-white">{exec.city || '-'}</p>
              </div>
              <div>
                <p className="text-gray-500 dark:text-gray-400 mb-1">State</p>
                <p className="font-medium text-gray-900 dark:text-white">{exec.state || '-'}</p>
              </div>
            </div>
          </Card>

          <TargetManagement execId={exec.id} targets={targets || []} />
        </div>


        <div className="space-y-6">
          <Card className="p-6 bg-white dark:bg-gray-900 shadow-sm border border-gray-100 dark:border-gray-800">
            <h3 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider mb-4 flex items-center"><Store className="w-4 h-4 mr-2" /> Vendor Mapping</h3>
            {vendorInfo ? (
              <div className="bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800 rounded-lg p-4">
                <p className="text-sm font-medium text-gray-900 dark:text-white">{exec.vendor_name || vendorInfo.business_name || 'Unknown Vendor'}</p>
                <div className="mt-3 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Vendor Code</span>
                    <span className="font-mono text-gray-900 dark:text-white">{exec.vendor_code}</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800 rounded-lg p-4">
                <p className="text-sm font-medium text-gray-900 dark:text-white">{exec.vendor_name || 'Unknown Vendor'}</p>
              </div>
            )}
          </Card>
          <Card className="p-6 bg-white dark:bg-gray-900 shadow-sm border border-gray-100 dark:border-gray-800">
            <h3 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider mb-4 flex items-center"><Target className="w-4 h-4 mr-2" /> Performance & Commission</h3>
            <div className="space-y-4 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Monthly Target</span>
                <span className="font-medium text-gray-900 dark:text-white">₹{exec.monthly_target || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Commission</span>
                <span className="font-medium text-gray-900 dark:text-white">{exec.commission_percentage || 10}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Orders Closed</span>
                <span className="font-medium text-gray-900 dark:text-white">0</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Commission Earned</span>
                <span className="font-medium text-green-600 dark:text-green-400">₹0</span>
              </div>
            </div>
          </Card>

          <Card className="p-6 bg-white dark:bg-gray-900 shadow-sm border border-gray-100 dark:border-gray-800">
            <h3 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider mb-4 flex items-center"><Clock className="w-4 h-4 mr-2" /> Activity Log</h3>
            <div className="space-y-4">
              {logs && logs.length > 0 ? logs.map((log: any) => {
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
                <p className="text-sm text-gray-500 text-center py-4">No activity recorded.</p>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
