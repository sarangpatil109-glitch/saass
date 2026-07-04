'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { logActivity } from './activity'

export async function createCheckoutSession(formData: FormData) {
  const supabase = await createClient()

  const customer_id = formData.get('customer_id') as string
  const product_id = formData.get('product_id') as string
  const product_version_id = formData.get('product_version_id') as string
  const business_name = formData.get('business_name') as string
  const amount = parseFloat(formData.get('amount') as string)
  const currency = formData.get('currency') as string || 'INR'

  if (amount <= 0) return { error: 'Amount must be positive' }

  // Check for duplicate pending orders for this exact build
  const { data: existing } = await supabase.from('orders')
    .select('id')
    .eq('customer_id', customer_id)
    .eq('product_version_id', product_version_id)
    .eq('status', 'Pending')
    .single()

  if (existing) {
    return { error: 'A pending order already exists for this configuration. Please complete or cancel it first.' }
  }

  // Generate a mock Cashfree Order ID
  const cashfree_order_id = `CF_SANDBOX_${Date.now()}_${Math.floor(Math.random() * 1000)}`

  const { data: order, error } = await supabase.from('orders').insert({
    customer_id,
    product_id,
    product_version_id,
    business_name,
    amount,
    currency,
    cashfree_order_id,
    status: 'Pending'
  }).select().single()

  if (error) return { error: error.message }

  await logActivity('Order Created', { order_id: order.id, business_name })
  revalidatePath('/admin/payments')
  
  return { success: true, order_id: order.id, cashfree_order_id }
}

export async function markRefund(orderId: string, amount: number, reason: string) {
  const supabase = await createClient()

  if (amount <= 0) return { error: 'Refund amount must be positive' }

  // Verify order is successful
  const { data: order } = await supabase.from('orders').select('status, amount').eq('id', orderId).single()
  
  if (!order || order.status !== 'Success') {
    return { error: 'Only successful orders can be refunded.' }
  }

  // Record Refund (Foundation)
  const { error: refundError } = await supabase.from('refund_history').insert({
    order_id: orderId,
    amount,
    reason,
    status: 'Refunded'
  })

  if (refundError) return { error: refundError.message }

  // Update order status to Refunded
  const { error: orderError } = await supabase.from('orders').update({
    status: 'Refunded',
    updated_at: new Date().toISOString()
  }).eq('id', orderId)

  if (orderError) return { error: orderError.message }

  await logActivity('Refund Recorded', { order_id: orderId, amount })
  revalidatePath('/admin/payments')
  
  return { success: true }
}

export async function simulateWebhook(cashfree_order_id: string, transaction_id: string) {
  // A helper function solely to trigger the webhook locally for simulation
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
  
  // Create a mock payload
  const payload = JSON.stringify({
    data: {
      order: { order_id: cashfree_order_id },
      payment: { cf_payment_id: transaction_id, payment_status: 'SUCCESS' }
    },
    event_time: new Date().toISOString(),
    type: 'PAYMENT_SUCCESS_WEBHOOK'
  })

  // To simulate the signature mathematically without crypto on client, we just pass a secret override for testing
  const res = await fetch(`${baseUrl}/api/payment/webhook`, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'x-webhook-signature': 'SIMULATED_VALID_SIGNATURE',
      'x-webhook-timestamp': Date.now().toString()
    },
    body: payload
  })

  return await res.json()
}
