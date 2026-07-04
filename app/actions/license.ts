'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { logActivity } from './activity'

export async function updateLicenseStatus(licenseId: string, status: string) {
  const supabase = await createClient()
  const { error } = await supabase.from('licenses').update({ status, updated_at: new Date().toISOString() }).eq('id', licenseId)
  if (error) return { error: error.message }
  
  // Log to history
  let action = 'Suspension'
  if (status === 'Revoked') action = 'Revocation'
  if (status === 'Active') action = 'Reactivation'
  
  await supabase.from('license_history').insert({ license_id: licenseId, action, ip_address: 'Admin System' })
  await logActivity(`License ${action}`, { license_id: licenseId })
  
  revalidatePath('/admin/licenses')
  revalidatePath(`/admin/licenses/${licenseId}`)
  return { success: true }
}

export async function deactivateDevice(deviceId: string, licenseId: string) {
  const supabase = await createClient()
  const { error } = await supabase.from('license_devices').update({ is_active: false }).eq('id', deviceId)
  if (error) return { error: error.message }
  
  await supabase.from('license_history').insert({ license_id: licenseId, action: 'Suspension', ip_address: 'Admin System', device_id: deviceId })
  await logActivity('Device Deactivated', { license_id: licenseId, device_table_id: deviceId })
  
  revalidatePath(`/admin/licenses/${licenseId}`)
  return { success: true }
}

export async function removeDevice(deviceId: string, licenseId: string) {
  const supabase = await createClient()
  const { error } = await supabase.from('license_devices').delete().eq('id', deviceId)
  if (error) return { error: error.message }
  
  await supabase.from('license_history').insert({ license_id: licenseId, action: 'Reset', ip_address: 'Admin System', device_id: deviceId })
  await logActivity('Device Removed', { license_id: licenseId, device_table_id: deviceId })
  
  revalidatePath(`/admin/licenses/${licenseId}`)
  return { success: true }
}

export async function regenerateLicenseKey(licenseId: string) {
  const supabase = await createClient()
  
  const new_license_key = Math.random().toString(36).substring(2,6).toUpperCase() + '-' +
                          Math.random().toString(36).substring(2,6).toUpperCase() + '-' +
                          Math.random().toString(36).substring(2,6).toUpperCase() + '-' +
                          Math.random().toString(36).substring(2,6).toUpperCase()
                          
  const { error } = await supabase.from('licenses').update({ 
    license_key: new_license_key, 
    status: 'Pending',
    updated_at: new Date().toISOString() 
  }).eq('id', licenseId)
  
  if (error) return { error: error.message }

  // Wipe devices on regen
  await supabase.from('license_devices').delete().eq('license_id', licenseId)
  
  await supabase.from('license_history').insert({ license_id: licenseId, action: 'Reset', ip_address: 'Admin System' })
  await logActivity('License Regenerated', { license_id: licenseId })
  
  revalidatePath('/admin/licenses')
  revalidatePath(`/admin/licenses/${licenseId}`)
  return { success: true }
}
