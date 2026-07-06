'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { logActivity } from './activity'

export async function createSalesExec(formData: FormData) {
  const supabase = await createClient()
  
  const full_name = formData.get('full_name') as string
  const email = formData.get('email') as string
  const phone = formData.get('phone') as string
  const status = formData.get('status') as string || 'active'
  const address = formData.get('address') as string
  const city = formData.get('city') as string
  const state = formData.get('state') as string
  const vendor_id = formData.get('vendor_id') as string

  // 1. Create a placeholder profile (simulating Auth user creation)
  const profileId = crypto.randomUUID()
  const { error: profileError } = await supabase.from('profiles').insert({
    id: profileId,
    email: email,
    full_name: full_name,
    role: 'sales_executive'
  })

  if (profileError) {
    return { error: 'Failed to create profile: ' + profileError.message }
  }

  // 2. Create Sales Executive (vendor_code will be auto-synced by the DB trigger)
  const { data: execData, error: execError } = await supabase.from('sales_executives').insert({
    id: profileId,
    full_name,
    email,
    phone,
    address,
    city,
    state,
    status,
    vendor_id
  }).select().single()

  if (execError) {
    return { error: 'Failed to create sales executive: ' + execError.message }
  }

  await logActivity('Sales Executive Created', { exec_id: execData.id, full_name, vendor_id })
  revalidatePath('/admin/sales')
  return { success: true }
}

export async function updateSalesExec(id: string, formData: FormData) {
  const supabase = await createClient()
  
  const full_name = formData.get('full_name') as string
  const phone = formData.get('phone') as string
  const status = formData.get('status') as string
  const address = formData.get('address') as string
  const city = formData.get('city') as string
  const state = formData.get('state') as string
  const vendor_id = formData.get('vendor_id') as string

  // Check if vendor changed
  const { data: currentExec } = await supabase.from('sales_executives').select('vendor_id, full_name, id').eq('id', id).single()

  const { data, error } = await supabase.from('sales_executives').update({
    full_name,
    phone,
    address,
    city,
    state,
    status,
    vendor_id,
    updated_at: new Date().toISOString()
  }).eq('id', id).select().single()

  if (error) {
    return { error: error.message }
  }

  // Sync profile name
  await supabase.from('profiles').update({ full_name }).eq('id', data.id)

  if (currentExec && currentExec.vendor_id !== vendor_id) {
    await logActivity('Vendor Changed', { exec_id: id, old_vendor_id: currentExec.vendor_id, new_vendor_id: vendor_id })
  }

  await logActivity('Sales Executive Updated', { exec_id: id, full_name })
  revalidatePath('/admin/sales')
  return { success: true }
}

export async function deleteSalesExec(id: string) {
  const supabase = await createClient()
  
  const { data: exec } = await supabase.from('sales_executives').select('id, full_name').eq('id', id).single()
  
  if (exec) {
    const { error } = await supabase.from('profiles').delete().eq('id', exec.id)
    if (error) {
      return { error: error.message }
    }
    await logActivity('Sales Executive Deleted', { exec_id: id, full_name: exec.full_name })
  }

  revalidatePath('/admin/sales')
  return { success: true }
}

export async function updateSalesExecStatus(id: string, newStatus: string) {
  const supabase = await createClient()
  
  const { data, error } = await supabase.from('sales_executives').update({
    status: newStatus
  }).eq('id', id).select().single()

  if (error) return { error: error.message }



  let action = 'Sales Executive Updated'
  if (newStatus === 'inactive') action = 'Sales Executive Disabled'
  if (newStatus === 'active') action = 'Sales Executive Enabled'

  await logActivity(action, { exec_id: id, status: newStatus })
  revalidatePath('/admin/sales')
  return { success: true }
}
