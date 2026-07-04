'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import crypto from 'crypto'

async function checkAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')
  
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') throw new Error('Forbidden')
  
  return { supabase, user }
}

async function logActivity(supabase: any, action: string, remarks: string, licenseId: string, deviceId: string | null, userId: string | null) {
  await supabase.from('license_activity_logs').insert({
    action,
    remarks,
    license_id: licenseId,
    device_id: deviceId,
    performed_by: userId
  })
}

// ---------------------------------
// LICENSES
// ---------------------------------
export async function generateLicense(formData: FormData) {
  try {
    const { supabase, user } = await checkAdmin()
    
    const orderId = formData.get('order_id') as string
    const policyId = formData.get('policy_id') as string
    const productVersion = formData.get('product_version') as string || '1.0'
    
    // Fetch Order
    const { data: order } = await supabase.from('orders').select('customer_id, product_id, order_number').eq('id', orderId).single()
    if (!order) throw new Error('Order not found')

    // Fetch Policy
    const { data: policy } = await supabase.from('license_policies').select('max_devices, default_expiry_days').eq('id', policyId).single()
    if (!policy) throw new Error('Policy not found')

    // Generate Key
    const licenseKey = `${order.order_number}-${crypto.randomBytes(4).toString('hex').toUpperCase()}`
    
    let expiryDate = null
    if (policy.default_expiry_days) {
      const d = new Date()
      d.setDate(d.getDate() + policy.default_expiry_days)
      expiryDate = d.toISOString()
    }

    const { data: license, error } = await supabase.from('licenses').insert({
      license_key: licenseKey,
      customer_id: order.customer_id,
      product_id: order.product_id,
      order_id: orderId,
      product_version: productVersion,
      policy_id: policyId,
      license_type: policy.default_expiry_days ? 'Annual' : 'Lifetime',
      status: 'Active',
      activation_limit: policy.max_devices,
      expiry_date: expiryDate,
      generated_by: user.id
    }).select().single()

    if (error) throw error

    await logActivity(supabase, 'License Created', `License Key ${licenseKey} generated.`, license.id, null, user.id)

    revalidatePath('/dashboard/admin/licenses')
    return { error: null }
  } catch (error: any) {
    return { error: error.message }
  }
}

export async function updateLicenseStatus(licenseId: string, status: string) {
  try {
    const { supabase, user } = await checkAdmin()
    
    const { error } = await supabase.from('licenses').update({ status }).eq('id', licenseId)
    if (error) throw error

    await logActivity(supabase, `License ${status}`, `Admin marked license as ${status}`, licenseId, null, user.id)

    revalidatePath(`/dashboard/admin/licenses/${licenseId}`)
    revalidatePath('/dashboard/admin/licenses')
    return { error: null }
  } catch (error: any) {
    return { error: error.message }
  }
}

// ---------------------------------
// DEVICES
// ---------------------------------
export async function deactivateDevice(deviceId: string, licenseId: string) {
  try {
    const { supabase, user } = await checkAdmin()
    
    const { error } = await supabase.from('license_devices').update({ status: 'Deactivated' }).eq('id', deviceId)
    if (error) throw error
    
    // Decrement activation count
    const { data: license } = await supabase.from('licenses').select('current_activations').eq('id', licenseId).single()
    if (license && license.current_activations > 0) {
      await supabase.from('licenses').update({ current_activations: license.current_activations - 1 }).eq('id', licenseId)
    }

    await logActivity(supabase, 'Device Deactivated', `Admin deactivated device`, licenseId, deviceId, user.id)

    revalidatePath(`/dashboard/admin/licenses/${licenseId}`)
    return { error: null }
  } catch (error: any) {
    return { error: error.message }
  }
}

export async function removeDevice(deviceId: string, licenseId: string) {
  try {
    const { supabase, user } = await checkAdmin()
    
    const { data: device } = await supabase.from('license_devices').select('status').eq('id', deviceId).single()
    
    const { error } = await supabase.from('license_devices').delete().eq('id', deviceId)
    if (error) throw error
    
    if (device?.status === 'Active') {
      const { data: license } = await supabase.from('licenses').select('current_activations').eq('id', licenseId).single()
      if (license && license.current_activations > 0) {
        await supabase.from('licenses').update({ current_activations: license.current_activations - 1 }).eq('id', licenseId)
      }
    }

    await logActivity(supabase, 'Device Removed', `Admin removed device from license`, licenseId, null, user.id)

    revalidatePath(`/dashboard/admin/licenses/${licenseId}`)
    return { error: null }
  } catch (error: any) {
    return { error: error.message }
  }
}
