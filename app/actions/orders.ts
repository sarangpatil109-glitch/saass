'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { createCommissionFromOrder } from './commission'

async function checkAuth() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')
  
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  return { supabase, user, role: profile?.role }
}

async function logActivity(supabase: any, action: string, details: string, profileId: string | null) {
  await supabase.from('activity_logs').insert({
    profile_id: profileId,
    action,
    details: { message: details }
  })
}

export async function createOrderFromLead(leadId: string, paymentMethod: string, paymentId?: string) {
  try {
    const { supabase, user } = await checkAuth()
    
    // 1. Fetch Lead
    const { data: lead } = await supabase.from('leads').select('*').eq('id', leadId).single()
    if (!lead) throw new Error('Lead not found')
    
    // 2. Ensure Customer exists, or create one
    let customerId = null
    const { data: existingCustomer } = await supabase.from('customers').select('id').eq('email', lead.email).maybeSingle()
    if (existingCustomer) {
      customerId = existingCustomer.id
    } else {
      const customerCode = 'CUST-' + Math.random().toString(36).substring(2, 10).toUpperCase()
      const { data: newCustomer } = await supabase.from('customers').insert({
        customer_code: customerCode,
        customer_name: lead.customer_name,
        business_name: lead.business_name,
        business_type: lead.business_type,
        email: lead.email,
        phone: lead.phone,
        whatsapp: lead.whatsapp_number,
        city: lead.city,
        state: lead.state,
        country: lead.country,
        address: lead.address,
        status: 'Active'
      }).select().single()
      customerId = newCustomer.id
      await logActivity(supabase, 'Customer Created', `Customer ${lead.customer_name} created automatically from Won Lead.`, user.id)
    }

    // 3. Get Product Pricing
    const { data: product } = await supabase.from('products').select('id, name, description, category, status, version, created_at, updated_at').eq('id', lead.product_id).single()
    
    // 4. Create Order
    const orderNumber = 'ORD-' + Math.random().toString(36).substring(2, 10).toUpperCase()
    const amount = lead.expected_value || 0
    
    const { data: order, error: orderError } = await supabase.from('orders').insert({
      order_number: orderNumber,
      customer_id: customerId,
      lead_id: lead.id,
      product_id: lead.product_id,
      vendor_id: lead.assigned_vendor_id,
      sales_executive_id: lead.assigned_sales_executive_id,
      payment_id: paymentId,
      amount,
      final_amount: amount,
      payment_method: paymentMethod,
      order_status: 'Paid',
      payment_status: 'Success',
      purchase_date: new Date().toISOString()
    }).select().single()
    
    if (orderError) throw orderError

    await logActivity(supabase, 'Order Created', `Order ${orderNumber} created from Lead ${lead.lead_number}.`, user.id)
    await logActivity(supabase, 'Payment Verified', `Payment verified for Order ${orderNumber}.`, user.id)

    // 5. Generate Commission
    if (lead.assigned_vendor_id || lead.assigned_sales_executive_id) {
       await createCommissionFromOrder({
         order_id: order.id,
         payment_id: paymentId || order.id,
         customer_id: customerId,
         product_id: lead.product_id,
         product_price: amount,
         sales_executive_id: lead.assigned_sales_executive_id,
         vendor_id: lead.assigned_vendor_id
       })
    }

    revalidatePath('/dashboard/admin/orders')
    revalidatePath('/dashboard/customers')
    return { data: order, error: null }
  } catch (error: any) {
    console.error('Action Error:', error);
    return { data: null, error: `Database Error: ${error.message || JSON.stringify(error)}` }
  }
}

export async function updateOrderStatus(orderId: string, status: string) {
  try {
    const { supabase, user } = await checkAuth()
    
    const { error } = await supabase.from('orders').update({ order_status: status }).eq('id', orderId)
    if (error) throw error

    await logActivity(supabase, 'Order Updated', `Order ${orderId} status changed to ${status}.`, user.id)

    revalidatePath('/dashboard/admin/orders')
    revalidatePath(`/dashboard/admin/orders/${orderId}`)
    return { error: null }
  } catch (error: any) {
    console.error('Action Error:', error);
    return { error: `Database Error: ${error.message || JSON.stringify(error)}` }
  }
}
