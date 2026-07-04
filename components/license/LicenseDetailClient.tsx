'use client'

import { useState } from 'react'
import { Card } from '@/components/Card'
import { Button } from '@/components/Button'
import { updateLicenseStatus, deactivateDevice, removeDevice, regenerateLicenseKey } from '@/app/actions/license'
import { ArrowLeft, MonitorOff, RotateCcw, AlertTriangle, Trash2, Key, CheckCircle, XCircle, MonitorSmartphone } from 'lucide-react'
import Link from 'next/link'

export function LicenseDetailClient({ license, devices, history }: { license: any, devices: any[], history: any[] }) {
  const [loading, setLoading] = useState(false)

  const handleStatusUpdate = async (status: string) => {
    if(confirm(`Are you sure you want to change the status to ${status}?`)) {
      setLoading(true)
      const res = await updateLicenseStatus(license.id, status)
      if (res.error) alert(res.error)
      setLoading(false)
    }
  }

  const handleDeviceAction = async (deviceId: string, action: 'deactivate' | 'remove') => {
    if(confirm(`Are you sure you want to ${action} this device?`)) {
      setLoading(true)
      const res = action === 'deactivate' ? await deactivateDevice(deviceId, license.id) : await removeDevice(deviceId, license.id)
      if (res.error) alert(res.error)
      setLoading(false)
    }
  }

  const handleRegenerate = async () => {
    if(confirm("DANGER: Regenerating the license key will permanently invalidate the current key and remove all registered devices. The customer must use the new key to reactivate. Proceed?")) {
      setLoading(true)
      const res = await regenerateLicenseKey(license.id)
      if (res.error) alert(res.error)
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/admin/licenses" className="p-2 bg-white rounded-lg shadow-sm border text-gray-500 hover:text-gray-900">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 font-mono tracking-wider">{license.license_key}</h1>
            <p className="text-sm text-gray-500 mt-1">Product: {license.product?.name} v{license.product_version?.version_string}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {license.status !== 'Active' && <Button variant="outline" className="text-green-600 border-green-200 hover:bg-green-50" onClick={() => handleStatusUpdate('Active')} disabled={loading}><CheckCircle className="h-4 w-4 mr-2"/> Activate</Button>}
          {license.status !== 'Suspended' && <Button variant="outline" className="text-orange-600 border-orange-200 hover:bg-orange-50" onClick={() => handleStatusUpdate('Suspended')} disabled={loading}><AlertTriangle className="h-4 w-4 mr-2"/> Suspend</Button>}
          {license.status !== 'Revoked' && <Button variant="outline" className="text-red-600 border-red-200 hover:bg-red-50" onClick={() => handleStatusUpdate('Revoked')} disabled={loading}><XCircle className="h-4 w-4 mr-2"/> Revoke</Button>}
          <Button variant="outline" className="text-gray-700 ml-4" onClick={handleRegenerate} disabled={loading}><RotateCcw className="h-4 w-4 mr-2"/> Regenerate Key</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Info Column */}
        <div className="space-y-6">
          <Card className="p-5">
            <h3 className="font-semibold text-gray-900 mb-4 border-b pb-2">License Metadata</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between"><span className="text-gray-500">Status</span><span className="font-medium text-gray-900">{license.status}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Customer</span><span className="font-medium text-gray-900">{license.customer?.profiles?.full_name}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Email</span><span className="font-medium text-gray-900">{license.customer?.email}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Generated</span><span className="font-medium text-gray-900">{new Date(license.created_at).toLocaleDateString()}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Max Activations</span><span className="font-medium text-gray-900">{license.max_activations} Devices</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Linked ZIP ID</span><span className="font-medium text-gray-900 font-mono text-xs">{license.zip_id.split('-')[0]}</span></div>
            </div>
          </Card>
        </div>

        {/* Devices Column */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="overflow-hidden">
            <div className="p-4 border-b bg-gray-50">
              <h3 className="font-semibold text-gray-900 flex items-center gap-2"><MonitorSmartphone className="h-4 w-4 text-gray-500" /> Registered Devices</h3>
            </div>
            <div className="p-0">
              <table className="w-full text-sm text-left">
                <thead className="bg-white text-gray-500 font-medium border-b">
                  <tr>
                    <th className="px-4 py-3">Device / OS</th>
                    <th className="px-4 py-3">Fingerprint</th>
                    <th className="px-4 py-3">Last Active</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {devices.length === 0 ? <tr><td colSpan={5} className="p-6 text-center text-gray-500">No devices registered.</td></tr> : 
                    devices.map((device) => (
                      <tr key={device.id} className="hover:bg-gray-50 bg-white">
                        <td className="px-4 py-3">
                          <div className="font-medium text-gray-900">{device.device_name}</div>
                          <div className="text-gray-500 text-xs mt-0.5">{device.os} • {device.browser}</div>
                        </td>
                        <td className="px-4 py-3 font-mono text-xs text-gray-500 max-w-[150px] truncate" title={device.device_id}>
                          {device.device_id}
                        </td>
                        <td className="px-4 py-3 text-gray-600">
                          {new Date(device.last_active).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3">
                          {device.is_active ? <span className="text-green-600 text-xs font-medium">Active</span> : <span className="text-red-600 text-xs font-medium">Deactivated</span>}
                        </td>
                        <td className="px-4 py-3 text-right space-x-2">
                          {device.is_active && <Button variant="outline" size="sm" onClick={() => handleDeviceAction(device.id, 'deactivate')} title="Deactivate"><MonitorOff className="h-4 w-4" /></Button>}
                          <Button variant="outline" size="sm" onClick={() => handleDeviceAction(device.id, 'remove')} title="Remove Device Permanently"><Trash2 className="h-4 w-4 text-red-500" /></Button>
                        </td>
                      </tr>
                    ))
                  }
                </tbody>
              </table>
            </div>
          </Card>

          <Card className="overflow-hidden">
            <div className="p-4 border-b bg-gray-50">
              <h3 className="font-semibold text-gray-900 flex items-center gap-2"><Key className="h-4 w-4 text-gray-500" /> Activation History</h3>
            </div>
            <div className="max-h-[300px] overflow-y-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-white text-gray-500 font-medium border-b sticky top-0">
                  <tr>
                    <th className="px-4 py-3">Action</th>
                    <th className="px-4 py-3">Timestamp</th>
                    <th className="px-4 py-3">IP Address / Source</th>
                    <th className="px-4 py-3">Device Ref</th>
                  </tr>
                </thead>
                <tbody className="divide-y bg-white">
                  {history.length === 0 ? <tr><td colSpan={4} className="p-6 text-center text-gray-500">No history available.</td></tr> : 
                    history.map((hist) => (
                      <tr key={hist.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 font-medium text-gray-900">{hist.action}</td>
                        <td className="px-4 py-3 text-gray-500">{new Date(hist.created_at).toLocaleString()}</td>
                        <td className="px-4 py-3 text-gray-500 font-mono text-xs">{hist.ip_address}</td>
                        <td className="px-4 py-3 text-gray-500 font-mono text-xs truncate max-w-[100px]">{hist.device_id || '-'}</td>
                      </tr>
                    ))
                  }
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
