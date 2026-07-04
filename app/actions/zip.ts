'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { logActivity } from './activity'

export async function requestZipGeneration(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const customer_id = formData.get('customer_id') as string
  const product_id = formData.get('product_id') as string
  const product_version_id = formData.get('product_version_id') as string
  
  const business_name = formData.get('business_name') as string
  const owner_name = formData.get('owner_name') as string
  const email = formData.get('email') as string
  const phone = formData.get('phone') as string
  const address = formData.get('address') as string
  const city = formData.get('city') as string
  const state = formData.get('state') as string
  const country = formData.get('country') as string
  
  const primary_color = formData.get('primary_color') as string
  const secondary_color = formData.get('secondary_color') as string
  const logo_url = formData.get('logo_url') as string

  // Prevent duplicate generation check
  const { data: existing } = await supabase
    .from('generated_zips')
    .select('id')
    .eq('customer_id', customer_id)
    .eq('status', 'Generating')
    .single()

  if (existing) {
    return { error: 'A ZIP is already being generated for this customer.' }
  }

  // Insert Generating Record
  const { data: zipRecord, error } = await supabase.from('generated_zips').insert({
    customer_id,
    product_id,
    product_version_id,
    business_name,
    owner_name,
    email,
    phone,
    address,
    city,
    state,
    country,
    primary_color,
    secondary_color,
    logo_url,
    status: 'Generating',
    generated_by: user?.id
  }).select().single()

  if (error) return { error: error.message }

  await logActivity('ZIP Generated (Initiated)', { zip_id: zipRecord.id, business_name })
  revalidatePath('/admin/zips')
  
  // Return the ID so the client can trigger the "mock" delay and then call completeZipGeneration
  return { success: true, zipId: zipRecord.id }
}

export async function completeZipGeneration(zipId: string, customerId: string) {
  const supabase = await createClient()
  
  // Update status to Completed and assign a mock file URL
  const mockFileUrl = `https://download.saass.local/builds/product_${zipId.split('-')[0]}.zip`
  
  const { error } = await supabase.from('generated_zips').update({
    status: 'Completed',
    file_url: mockFileUrl,
    updated_at: new Date().toISOString()
  }).eq('id', zipId)

  if (error) return { error: error.message }

  // Get customer info for delivery history
  const { data: customer } = await supabase.from('customers').select('sales_executive_id, vendor_id').eq('id', customerId).single()

  // Create Delivery History Pending record
  await supabase.from('delivery_history').insert({
    zip_id: zipId,
    customer_id: customerId,
    sales_executive_id: customer?.sales_executive_id,
    vendor_id: customer?.vendor_id,
    status: 'Pending'
  })

  await logActivity('ZIP Generated (Completed)', { zip_id: zipId })
  revalidatePath('/admin/zips')
  
  return { success: true }
}

export async function logZipDownload(zipId: string) {
  const supabase = await createClient()
  
  // Increment download count and update status
  await supabase.rpc('increment_zip_download', { row_id: zipId }) // Would need an RPC, but let's just do a direct update for simplicity
  
  const { data: current } = await supabase.from('generated_zips').select('download_count, status').eq('id', zipId).single()
  if (current) {
    const newStatus = current.status === 'Completed' ? 'Downloaded' : current.status
    await supabase.from('generated_zips').update({
      download_count: current.download_count + 1,
      status: newStatus
    }).eq('id', zipId)
  }

  await logActivity('ZIP Downloaded', { zip_id: zipId })
  revalidatePath('/admin/zips')
  return { success: true }
}

export async function updateDeliveryStatus(deliveryId: string, zipId: string, status: string, notes?: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const payload: any = { status, updated_at: new Date().toISOString(), notes }
  if (status === 'Delivered') {
    payload.delivery_date = new Date().toISOString()
    payload.delivered_by = user?.id
    
    // Update master zip status
    await supabase.from('generated_zips').update({ status: 'Delivered' }).eq('id', zipId)
  }

  const { error } = await supabase.from('delivery_history').update(payload).eq('id', deliveryId)
  if (error) return { error: error.message }

  await logActivity(status === 'Delivered' ? 'Delivery Completed' : 'Delivery Failed', { delivery_id: deliveryId, zip_id: zipId })
  revalidatePath('/admin/zips')
  return { success: true }
}

export async function updateZipStatus(zipId: string, status: string) {
  const supabase = await createClient()
  const { error } = await supabase.from('generated_zips').update({ status, updated_at: new Date().toISOString() }).eq('id', zipId)
  if (error) return { error: error.message }
  
  if (status === 'Archived') await logActivity('ZIP Archived', { zip_id: zipId })
  revalidatePath('/admin/zips')
  return { success: true }
}

export async function deleteZipRecord(zipId: string) {
  const supabase = await createClient()
  const { error } = await supabase.from('generated_zips').delete().eq('id', zipId)
  if (error) return { error: error.message }
  
  await logActivity('ZIP Deleted', { zip_id: zipId })
  revalidatePath('/admin/zips')
  return { success: true }
}
