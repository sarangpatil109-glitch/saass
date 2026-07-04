import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { Card } from '@/components/Card'
import { Shield, Bell, Database, Key } from 'lucide-react'

export default async function SettingsPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (process.env.DEVELOPMENT_MODE !== 'true' && !user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('role, full_name, email').eq('id', (user?.id || '')).single()
  if (process.env.DEVELOPMENT_MODE !== 'true' && profile?.role !== 'admin') redirect('/unauthorized')

  const { data: policies } = await supabase.from('license_policies').select('*')
  const { data: commSettings } = await supabase.from('commission_settings').select('*').maybeSingle()

  return (
    <div className="space-y-6 pb-12">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">Settings</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Platform configuration and policy management.</p>
      </div>

      {/* Admin Profile */}
      <Card className="p-6 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-sm">
        <div className="flex items-center gap-3 mb-4">
          <Shield className="h-5 w-5 text-blue-500" />
          <h3 className="font-bold text-gray-900 dark:text-white">Admin Profile</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-500 dark:text-gray-400">Name</span>
            <p className="font-medium text-gray-900 dark:text-white mt-0.5">{profile?.full_name || '—'}</p>
          </div>
          <div>
            <span className="text-gray-500 dark:text-gray-400">Email</span>
            <p className="font-medium text-gray-900 dark:text-white mt-0.5">{profile?.email || (user?.email || '')}</p>
          </div>
          <div>
            <span className="text-gray-500 dark:text-gray-400">Role</span>
            <p className="font-medium text-gray-900 dark:text-white mt-0.5 capitalize">{profile?.role}</p>
          </div>
          <div>
            <span className="text-gray-500 dark:text-gray-400">User ID</span>
            <p className="font-mono text-xs text-gray-500 dark:text-gray-400 mt-0.5">{(user?.id || '')}</p>
          </div>
        </div>
      </Card>

      {/* License Policies */}
      <Card className="p-6 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-sm">
        <div className="flex items-center gap-3 mb-4">
          <Key className="h-5 w-5 text-purple-500" />
          <h3 className="font-bold text-gray-900 dark:text-white">License Policies</h3>
        </div>
        <div className="space-y-3">
          {policies && policies.length > 0 ? policies.map((p: any) => (
            <div key={p.id} className="flex items-center justify-between p-4 rounded-lg bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800">
              <div>
                <p className="font-medium text-gray-900 dark:text-white">{p.name}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  Max Devices: {p.max_devices} &bull; Offline Grace: {p.offline_grace_period_days} days
                  {p.default_expiry_days ? ` • Expires in ${p.default_expiry_days} days` : ' • Lifetime'}
                </p>
              </div>
            </div>
          )) : (
            <p className="text-sm text-gray-500">No policies configured.</p>
          )}
        </div>
      </Card>

      {/* Commission Settings */}
      {commSettings && (
        <Card className="p-6 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <Database className="h-5 w-5 text-green-500" />
            <h3 className="font-bold text-gray-900 dark:text-white">Commission Configuration</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <span className="text-gray-500">Sales Executive Rate</span>
              <p className="font-medium text-gray-900 dark:text-white mt-0.5">{commSettings.sales_executive_percentage}%</p>
            </div>
            <div>
              <span className="text-gray-500">Vendor Rate</span>
              <p className="font-medium text-gray-900 dark:text-white mt-0.5">{commSettings.vendor_percentage}%</p>
            </div>
          </div>
        </Card>
      )}

      {/* Environment */}
      <Card className="p-6 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-sm">
        <div className="flex items-center gap-3 mb-4">
          <Bell className="h-5 w-5 text-orange-500" />
          <h3 className="font-bold text-gray-900 dark:text-white">Payment Environment</h3>
        </div>
        <div className="flex items-center gap-3">
          <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${
            process.env.CASHFREE_ENV === 'production'
              ? 'bg-green-100 text-green-700'
              : 'bg-yellow-100 text-yellow-700'
          }`}>
            {process.env.CASHFREE_ENV === 'production' ? 'Production' : 'Sandbox'}
          </span>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Configured via <code className="font-mono bg-gray-100 dark:bg-gray-800 px-1 rounded">CASHFREE_ENV</code> environment variable.
          </p>
        </div>
      </Card>
    </div>
  )
}
