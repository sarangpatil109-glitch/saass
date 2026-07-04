import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { Card } from '@/components/Card'
import { ArrowLeft, Monitor, Activity } from 'lucide-react'
import Link from 'next/link'
import { DeviceActions } from '@/components/license/DeviceActions'
import { LicenseActions } from '@/components/license/LicenseActions'

export default async function LicenseDetailsPage({ params }: { params: { id: string } }) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (process.env.DEVELOPMENT_MODE !== 'true' && !user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', (user?.id || '')).single()
  if (process.env.DEVELOPMENT_MODE !== 'true' && profile?.role !== 'admin') redirect('/unauthorized')

  const { data: license } = await supabase.from('licenses').select(`
    *,
    customers (business_name, email, phone),
    products (name),
    license_policies (name, max_devices, offline_grace_period_days),
    orders (order_number)
  `).eq('id', params.id).single()

  if (!license) redirect('/dashboard/admin/licenses')

  const { data: devices } = await supabase.from('license_devices').select('*').eq('license_id', license.id).order('activated_at', { ascending: false })
  const { data: logs } = await supabase.from('license_activity_logs').select('*, auth.users (email)').eq('license_id', license.id).order('created_at', { ascending: false }).limit(10)

  const customerInfo = Array.isArray(license.customers) ? license.customers[0] : license.customers;
  const prodInfo = Array.isArray(license.products) ? license.products[0] : license.products;
  const policyInfo = Array.isArray(license.license_policies) ? license.license_policies[0] : license.license_policies;

  return (
    <div className="space-y-6 pb-12">
      <div>
        <Link href="/dashboard/admin/licenses" className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 mb-4">
          <ArrowLeft className="h-4 w-4 mr-1" /> Back to Licenses
        </Link>
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight font-mono">{license.license_key}</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Customer: {customerInfo?.business_name}</p>
          </div>
          <div className="flex items-center gap-3">
             <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                license.status === 'Active' ? 'bg-green-100 text-green-800' :
                license.status === 'Expired' || license.status === 'Revoked' ? 'bg-red-100 text-red-800' :
                'bg-orange-100 text-orange-800'
              }`}>
                {license.status}
              </span>
             <LicenseActions license={license} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card className="p-6 bg-white dark:bg-gray-900 shadow-sm border border-gray-100 dark:border-gray-800">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Registered Devices ({license.current_activations}/{license.activation_limit})</h3>
            <div className="space-y-4">
              {devices && devices.length > 0 ? devices.map((d: any) => (
                <div key={d.id} className="flex flex-col md:flex-row justify-between items-start md:items-center p-4 border border-gray-100 dark:border-gray-800 rounded-lg bg-gray-50 dark:bg-gray-800/50 gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <Monitor className="h-4 w-4 text-gray-400" />
                      <h4 className="font-semibold text-gray-900 dark:text-white">{d.device_name || 'Unknown Device'}</h4>
                      <span className={`text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded ${
                        d.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                      }`}>
                        {d.status}
                      </span>
                    </div>
                    <div className="text-xs text-gray-500 mt-1 font-mono">ID: {d.device_id}</div>
                    <div className="text-xs text-gray-500 mt-1">OS: {d.os_name || 'Unknown'} | App: {d.app_version || 'Unknown'}</div>
                    <div className="text-xs text-gray-400 mt-2">Registered: {new Date(d.activated_at).toLocaleString()} | Last Seen: {new Date(d.last_seen).toLocaleString()}</div>
                  </div>
                  <div>
                    <DeviceActions deviceId={d.id} licenseId={license.id} status={d.status} />
                  </div>
                </div>
              )) : (
                <p className="text-sm text-gray-500">No devices registered to this license yet.</p>
              )}
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="p-6 bg-white dark:bg-gray-900 shadow-sm border border-gray-100 dark:border-gray-800">
             <h3 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider mb-4 flex items-center"><Activity className="w-4 h-4 mr-2" /> Activity Log</h3>
             <div className="space-y-4">
              {logs && logs.length > 0 ? logs.map((log: any) => (
                <div key={log.id} className="text-sm pb-4 border-b border-gray-50 dark:border-gray-800 last:border-0 last:pb-0">
                  <p className="font-medium text-gray-900 dark:text-white">{log.action}</p>
                  <p className="text-gray-500 dark:text-gray-400 text-xs mt-0.5">{log.remarks}</p>
                  <div className="flex justify-between text-xs text-gray-400 mt-2">
                    <span>{new Date(log.created_at).toLocaleString()}</span>
                  </div>
                </div>
              )) : (
                <p className="text-sm text-gray-500">No activity logs.</p>
              )}
             </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
