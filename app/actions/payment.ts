'use server'

import { createClient } from '@/utils/supabase/server'
import { generateOrderNumber, generateInvoiceNumber, logTimeline, logPayment } from '@/utils/order'
import crypto from 'crypto'

const CASHFREE_SANDBOX_URL = 'https://sandbox.cashfree.com/pg/orders'
const CASHFREE_PROD_URL = 'https://api.cashfree.com/pg/orders'

function getCashfreeUrl() {
  const env = process.env.CASHFREE_ENV || 'sandbox'
  return env === 'production' ? CASHFREE_PROD_URL : CASHFREE_SANDBOX_URL
}

function getHeaders() {
  const appId = process.env.CASHFREE_APP_ID || ''
  const appSecret = process.env.CASHFREE_APP_SECRET || ''
  return {
    'Content-Type': 'application/json',
    'x-client-id': appId,
    'x-client-secret': appSecret,
    'x-api-version': '2023-08-01',
  }
}

// ─────────────────────────────────────────────
// CREATE ORDER
// ─────────────────────────────────────────────
export async function createOrder(formData: FormData) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Unauthorized')

    const customerId = formData.get('customer_id') as string
    const productId  = formData.get('product_id')  as string
    const productVersion = (formData.get('product_version') as string) || ''
    const amount   = Number(formData.get('amount'))
    const discount = Number(formData.get('discount') ?? 0)
    const tax      = Number(formData.get('tax')      ?? 0)
    const currency = (formData.get('currency') as string) || 'INR'
    const email    = formData.get('email')  as string
    const phone    = formData.get('phone')  as string
    const businessName = formData.get('business_name') as string

    if (!customerId || !productId || isNaN(amount) || amount <= 0) {
      throw new Error('Invalid order payload')
    }

    const orderNumber  = generateOrderNumber()
    const finalAmount  = +(amount - discount + tax).toFixed(2)

    const { data: order, error: orderErr } = await supabase.from('orders').insert({
      order_number: orderNumber,
      customer_id: customerId,
      business_name: businessName,
      product_id: productId,
      product_version: productVersion,
      amount,
      discount,
      tax,
      final_amount: finalAmount,
      currency,
      payment_method: 'Cashfree',
      payment_status: 'Pending',
      order_status: 'Pending',
    }).select().single()

    if (orderErr) throw orderErr

    // Cashfree payload – fixed: single order_meta key
    const cashfreePayload = {
      order_id: order.id,
      order_amount: finalAmount,
      order_currency: currency,
      customer_details: {
        customer_id: customerId,
        customer_email: email,
        customer_phone: phone,
        customer_name: businessName,
      },
      order_meta: {
        notify_url: `${process.env.NEXT_PUBLIC_BASE_URL}/api/payments/webhook`,
        return_url: `${process.env.NEXT_PUBLIC_BASE_URL}/dashboard/admin/orders/${order.id}`,
      },
    }

    const response = await fetch(getCashfreeUrl(), {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(cashfreePayload),
    })

    const cfData = await response.json()

    if (!response.ok) {
      await supabase.from('orders').delete().eq('id', order.id)
      throw new Error(cfData.message || 'Cashfree order creation failed')
    }

    const cashfreeOrderId = cfData.order_id
    const checkoutLink    = cfData.payment_session_id
      ? `https://${process.env.CASHFREE_ENV === 'production' ? 'www' : 'sandbox'}.cashfree.com/checkout?session_id=${cfData.payment_session_id}`
      : (cfData.payment_link || '#')

    await supabase.from('orders').update({
      cashfree_order_id: cashfreeOrderId,
      order_status: 'Awaiting Payment',
    }).eq('id', order.id)

    await logTimeline(order.id, 'Order Created', `Cashfree Order ID: ${cashfreeOrderId}`)
    await logPayment('Order recorded and Cashfree order created', 'info', order.id)

    return { checkoutUrl: checkoutLink, orderId: order.id, error: null }
  } catch (err: any) {
    return { checkoutUrl: null, orderId: null, error: err.message }
  }
}

// ─────────────────────────────────────────────
// FETCH ORDERS (server-side – for server components)
// ─────────────────────────────────────────────
export async function fetchOrders() {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('orders')
      .select(`*, customers (business_name, email), products (name)`)
      .order('created_at', { ascending: false })
    if (error) throw error
    return { data: data || [], error: null }
  } catch (e: any) {
    return { data: [], error: e.message }
  }
}

// ─────────────────────────────────────────────
// VERIFY PAYMENT (server-side confirmation)
// ─────────────────────────────────────────────
export async function verifyPayment(cashfreeOrderId: string) {
  try {
    const supabase = await createClient()
    const response = await fetch(`${getCashfreeUrl()}/${cashfreeOrderId}`, {
      method: 'GET',
      headers: getHeaders(),
    })
    const data = await response.json()
    if (!response.ok) throw new Error(data.message || 'Cashfree verification failed')

    const paymentStatus: string = data.order_status || 'PENDING'
    const { data: order } = await supabase
      .from('orders')
      .select('id, payment_status, order_status')
      .eq('cashfree_order_id', cashfreeOrderId)
      .single()
    if (!order) throw new Error('Order not found')

    const newPaymentStatus = paymentStatus === 'PAID' ? 'Success'
      : paymentStatus === 'EXPIRED' ? 'Cancelled'
      : paymentStatus === 'FAILED'  ? 'Failed'
      : 'Pending'
    const newOrderStatus = newPaymentStatus === 'Success' ? 'Paid'
      : newPaymentStatus === 'Failed'    ? 'Failed'
      : newPaymentStatus === 'Cancelled' ? 'Cancelled'
      : order.order_status

    await supabase.from('orders').update({
      payment_status: newPaymentStatus,
      order_status: newOrderStatus,
    }).eq('id', order.id)

    await logTimeline(order.id, 'Payment Verified', `CF Status: ${paymentStatus}`)
    await logPayment('Payment verification completed', 'info', order.id)
    return { success: true }
  } catch (e: any) {
    await logPayment(`Verification error: ${e.message}`, 'error')
    return { success: false, error: e.message }
  }
}

// ─────────────────────────────────────────────
// GENERATE INVOICE
// ─────────────────────────────────────────────
export async function generateInvoice(orderId: string) {
  try {
    const supabase = await createClient()
    const { data: order } = await supabase
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .single()
    if (!order) throw new Error('Order not found')

    // Idempotency – prevent duplicate invoices
    const { data: existing } = await supabase
      .from('invoices')
      .select('id')
      .eq('order_id', orderId)
      .maybeSingle()
    if (existing) return { invoiceId: existing.id, error: null }

    const invoiceNumber = generateInvoiceNumber()
    const { data: invoice, error } = await supabase.from('invoices').insert({
      invoice_number: invoiceNumber,
      order_id: orderId,
      customer_id: order.customer_id,
      business_name: order.business_name,
      price: order.amount,
      discount: order.discount,
      tax: order.tax,
      grand_total: order.final_amount,
      payment_reference: order.cashfree_order_id,
      status: 'Paid',
    }).select().single()
    if (error) throw error

    const pdfUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/api/invoices/preview/${invoice.id}`
    await supabase.from('invoices').update({ pdf_url: pdfUrl }).eq('id', invoice.id)

    await logTimeline(orderId, 'Invoice Generated', `Invoice ${invoiceNumber}`)
    await logPayment('Invoice generated', 'info', orderId)
    return { invoiceId: invoice.id, error: null }
  } catch (e: any) {
    return { invoiceId: null, error: e.message }
  }
}

// ─────────────────────────────────────────────
// SIMULATE WEBHOOK (sandbox dev helper)
// ─────────────────────────────────────────────
export async function simulateWebhook(cashfreeOrderId: string, transactionId: string) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Unauthorized')

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()
    if (profile?.role !== 'admin') throw new Error('Forbidden')

    // Find internal order
    const { data: order } = await supabase
      .from('orders')
      .select('id, payment_status, customer_id, product_id, amount, leads(assigned_sales_executive_id, assigned_vendor_id)')
      .eq('cashfree_order_id', cashfreeOrderId)
      .single()
    if (!order) throw new Error('Order not found for Cashfree ID')

    if (order.payment_status === 'Success') {
      throw new Error('Payment already marked successful')
    }

    // Simulate payment success
    await supabase.from('orders').update({
      payment_status: 'Success',
      order_status: 'Paid',
    }).eq('id', order.id)

    await supabase.from('payments').upsert({
      order_id: order.id,
      cashfree_payment_id: transactionId,
      amount: 0,
      status: 'Success',
      method: 'Mock',
    })

    await logTimeline(order.id, 'Webhook Received', 'Mock sandbox payment SUCCESS')
    await logTimeline(order.id, 'Payment Verified', 'Simulated success verified')

    // Auto-generate invoice
    await generateInvoice(order.id)
    
    // Trigger Commission Engine
    try {
      const { createCommissionFromOrder } = await import('@/app/actions/commission')
      const lead = Array.isArray(order.leads) ? order.leads[0] : order.leads
      const execId = lead?.assigned_sales_executive_id
      const vendorId = lead?.assigned_vendor_id

      if (execId && vendorId) {
        // Find payment record ID
        const { data: payRec } = await supabase.from('payments').select('id').eq('order_id', order.id).single()
        await createCommissionFromOrder({
          order_id: order.id,
          payment_id: payRec?.id || crypto.randomUUID(), // fallback if payment id is missing somehow
          customer_id: order.customer_id,
          product_id: order.product_id,
          product_price: order.amount,
          sales_executive_id: execId,
          vendor_id: vendorId
        })
        await logTimeline(order.id, 'Commission Generated', 'Sales and Vendor commissions calculated (Simulated)')
      }
    } catch (commErr: any) {
      console.error("Commission engine error:", commErr)
    }

    return { error: null }
  } catch (e: any) {
    console.error('Action Error:', e);
    return { error: `Database Error: ${e.message || JSON.stringify(e)}` }
  }
}

// ─────────────────────────────────────────────
// MARK REFUND
// ─────────────────────────────────────────────
export async function markRefund(orderId: string, amount: number, reason: string) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Unauthorized')

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()
    if (profile?.role !== 'admin') throw new Error('Forbidden')

    const refundRef = `REF-${Date.now()}`
    await supabase.from('refund_history').insert({
      order_id: orderId,
      refund_reference: refundRef,
      reason,
      refund_date: new Date().toISOString(),
    })

    await supabase.from('orders').update({
      payment_status: 'Refunded',
      order_status: 'Refunded',
    }).eq('id', orderId)

    await supabase.from('invoices').update({ status: 'Refunded' }).eq('order_id', orderId)

    await logTimeline(orderId, 'Refund Recorded', `Ref: ${refundRef} — ${reason}`)
    return { error: null }
  } catch (e: any) {
    console.error('Action Error:', e);
    return { error: `Database Error: ${e.message || JSON.stringify(e)}` }
  }
}
