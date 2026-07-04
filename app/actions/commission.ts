'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { logActivity } from './activity'

export async function updateCommissionSettings(formData: FormData) {
  const supabase = await createClient()
  
  const se_percent = parseFloat(formData.get('sales_exec_percentage') as string)
  const v_percent = parseFloat(formData.get('vendor_percentage') as string)

  if (isNaN(se_percent) || isNaN(v_percent) || se_percent < 0 || se_percent > 100 || v_percent < 0 || v_percent > 100) {
    return { error: 'Invalid percentages. Must be between 0 and 100.' }
  }

  // Update the single settings row. Assuming we just update all rows since there's only one.
  const { error } = await supabase.from('commission_settings').update({
    sales_exec_percentage: se_percent,
    vendor_percentage: v_percent,
    updated_at: new Date().toISOString()
  }).neq('id', '00000000-0000-0000-0000-000000000000') // dummy filter to update all

  if (error) return { error: error.message }

  await logActivity('Commission Settings Changed', { se_percent, v_percent })
  revalidatePath('/admin/commission')
  
  return { success: true }
}

export async function updateCommissionStatus(id: string, newStatus: string) {
  const supabase = await createClient()
  
  // Prevent recalculation or changing if it's somehow locked, but here we just update status
  const { error } = await supabase.from('commissions').update({
    status: newStatus,
    updated_at: new Date().toISOString()
  }).eq('id', id)

  if (error) return { error: error.message }

  let actionName = 'Commission Updated'
  if (newStatus === 'Approved') actionName = 'Commission Approved'
  if (newStatus === 'Paid') actionName = 'Commission Paid'
  if (newStatus === 'Reversed') actionName = 'Commission Reversed'
  if (newStatus === 'Cancelled') actionName = 'Commission Cancelled'

  await logActivity(actionName, { commission_id: id, status: newStatus })
  
  revalidatePath('/admin/commission')
  revalidatePath('/vendor/commission')
  revalidatePath('/sales/commission')
  
  return { success: true }
}

// Helper to simulate a sale for testing the trigger (optional, usually would be done in CRM/Checkout flow)
export async function createMockSale(formData: FormData) {
  const supabase = await createClient()
  
  const customer_id = formData.get('customer_id') as string
  const product_id = formData.get('product_id') as string
  const price = parseFloat(formData.get('price') as string)
  const sales_executive_id = formData.get('sales_executive_id') as string
  const vendor_id = formData.get('vendor_id') as string

  const { data, error } = await supabase.from('sales').insert({
    customer_id,
    product_id,
    price,
    sales_executive_id,
    vendor_id,
    status: 'Completed'
  }).select().single()

  if (error) return { error: error.message }
  
  // The trigger handles commission automatically
  await logActivity('Sale Completed', { sale_id: data.id, price })
  
  return { success: true }
}
