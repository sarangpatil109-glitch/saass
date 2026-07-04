'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { logActivity } from './activity'

export async function createVendor(formData: FormData) {
  const supabase = await createClient()
  
  // In a real app we'd create the auth user first, here we simulate by inserting into profiles then vendors
  // We'll skip the auth.users step for this demo and assume profile_id is provided or generated
  // For the sake of the demo UI we might just insert directly into vendors if we make profile_id nullable temporarily
  // But wait, our schema says profile_id is NOT NULL.
  // We must generate a fake UUID for demo if we can't create auth users easily without email confirmation.
  
  const email = formData.get('email') as string
  const company_name = formData.get('company_name') as string
  const owner_name = formData.get('owner_name') as string
  const phone = formData.get('phone') as string
  const status = formData.get('status') as string || 'active'
  const address = formData.get('address') as string
  const city = formData.get('city') as string
  const state = formData.get('state') as string
  
  // 1. Create a placeholder profile (simulating Auth user creation)
  const profileId = crypto.randomUUID()
  const { error: profileError } = await supabase.from('profiles').insert({
    id: profileId,
    email: email,
    full_name: owner_name,
    role: 'vendor',
    status: status
  })

  if (profileError) {
    return { error: 'Failed to create profile: ' + profileError.message }
  }

  // 2. Create Vendor
  const { data: vendorData, error: vendorError } = await supabase.from('vendors').insert({
    profile_id: profileId,
    company_name,
    owner_name,
    contact_email: email,
    contact_phone: phone,
    address,
    city,
    state,
    status
  }).select().single()

  if (vendorError) {
    return { error: 'Failed to create vendor: ' + vendorError.message }
  }

  await logActivity('Vendor Created', { vendor_id: vendorData.id, company_name })
  revalidatePath('/admin/vendors')
  return { success: true }
}

export async function updateVendor(id: string, formData: FormData) {
  const supabase = await createClient()
  
  const company_name = formData.get('company_name') as string
  const owner_name = formData.get('owner_name') as string
  const phone = formData.get('phone') as string
  const status = formData.get('status') as string
  const address = formData.get('address') as string
  const city = formData.get('city') as string
  const state = formData.get('state') as string

  const { data, error } = await supabase.from('vendors').update({
    company_name,
    owner_name,
    contact_phone: phone,
    address,
    city,
    state,
    status,
    updated_at: new Date().toISOString()
  }).eq('id', id).select().single()

  if (error) {
    return { error: error.message }
  }

  // Also update profile status if it changed
  await supabase.from('profiles').update({ status }).eq('id', data.profile_id)

  await logActivity('Vendor Updated', { vendor_id: id, company_name })
  revalidatePath('/admin/vendors')
  return { success: true }
}

export async function deleteVendor(id: string) {
  const supabase = await createClient()
  
  // We need to fetch the profile_id first to delete it (cascade will handle vendors)
  const { data: vendor } = await supabase.from('vendors').select('profile_id, company_name').eq('id', id).single()
  
  if (vendor) {
    const { error } = await supabase.from('profiles').delete().eq('id', vendor.profile_id)
    if (error) {
      return { error: error.message }
    }
    await logActivity('Vendor Deleted', { vendor_id: id, company_name: vendor.company_name })
  }

  revalidatePath('/admin/vendors')
  return { success: true }
}

export async function updateVendorStatus(id: string, newStatus: string) {
  const supabase = await createClient()
  
  const { data, error } = await supabase.from('vendors').update({
    status: newStatus
  }).eq('id', id).select().single()

  if (error) return { error: error.message }

  // Sync with profile
  await supabase.from('profiles').update({ status: newStatus }).eq('id', data.profile_id)

  let action = 'Vendor Updated'
  if (newStatus === 'inactive') action = 'Vendor Disabled'
  if (newStatus === 'active') action = 'Vendor Enabled'

  await logActivity(action, { vendor_id: id, status: newStatus })
  revalidatePath('/admin/vendors')
  return { success: true }
}

export async function regenerateVendorCode(id: string) {
  const supabase = await createClient()
  
  // We can just set it to NULL and let the trigger handle it, or explicitly call a function.
  // Wait, the trigger only fires ON INSERT. 
  // Let's generate a random string manually here.
  const newCode = 'VND-' + Math.random().toString(36).substring(2, 7).toUpperCase()

  const { error } = await supabase.from('vendors').update({
    vendor_code: newCode
  }).eq('id', id)

  if (error) return { error: error.message }

  await logActivity('Vendor Code Regenerated', { vendor_id: id })
  revalidatePath('/admin/vendors')
  return { success: true }
}
