import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { generateInvoice } from '@/app/actions/payment'
import { logTimeline } from '@/utils/order'
import crypto from 'crypto'

const CASHFREE_WEBHOOK_SECRET = process.env.CASHFREE_WEBHOOK_SECRET || ''

// Cashfree sends timestamp in x-cashfree-timestamp and signature in x-cashfree-signature
export async function POST(req: Request) {
  try {
    const timestamp  = req.headers.get('x-cashfree-timestamp') || ''
    const signature  = req.headers.get('x-cashfree-signature')  || ''
    const rawBody    = await req.text()

    // Verify signature: HMAC-SHA256 of timestamp + rawBody
    if (CASHFREE_WEBHOOK_SECRET) {
      const message  = `${timestamp}${rawBody}`
      const expected = crypto.createHmac('sha256', CASHFREE_WEBHOOK_SECRET).update(message).digest('base64')
      if (signature !== expected) {
        return NextResponse.json({ error: 'Invalid webhook signature' }, { status: 401 })
      }
    }

    const payload: any = JSON.parse(rawBody)
    const webhookId    = payload.data?.order?.cf_order_id?.toString()
                      || payload.data?.payment?.cf_payment_id?.toString()
                      || crypto.randomUUID()

    const supabase = await createClient()

    // Idempotency – skip if already processed
    const { data: existing } = await supabase
      .from('payment_webhooks')
      .select('id, processed')
      .eq('webhook_id', webhookId)
      .maybeSingle()

    if (existing?.processed) {
      return NextResponse.json({ status: 'duplicate' })
    }

    // Extract data from Cashfree 2023-08-01 schema
    const cfOrderId       = payload.data?.order?.order_id        || payload.orderId        || ''
    const cfPaymentStatus = payload.data?.payment?.payment_status || payload.paymentStatus || 'FAILED'
    const cfPaymentId     = payload.data?.payment?.cf_payment_id  || payload.paymentId     || ''
    const amount          = payload.data?.payment?.payment_amount || payload.amount         || 0

    // Normalize status to our enum
    const paymentStatus = cfPaymentStatus === 'SUCCESS' ? 'Success'
      : cfPaymentStatus === 'FAILED'     ? 'Failed'
      : cfPaymentStatus === 'USER_DROPPED' ? 'Cancelled'
      : 'Pending'

    const orderStatus = paymentStatus === 'Success'   ? 'Paid'
      : paymentStatus === 'Failed'    ? 'Failed'
      : paymentStatus === 'Cancelled' ? 'Cancelled'
      : 'Awaiting Payment'

    // Record webhook
    await supabase.from('payment_webhooks').upsert({
      webhook_id: webhookId,
      payload,
      verified: true,
      processed: true,
    })

    // Update orders (look up by cashfree_order_id)
    const { data: order } = await supabase
      .from('orders')
      .select('id, customer_id, product_id, amount, payment_status, leads(assigned_sales_executive_id, assigned_vendor_id)')
      .eq('cashfree_order_id', cfOrderId)
      .maybeSingle()

    if (order) {
      if (order.payment_status === 'Success') {
        return NextResponse.json({ status: 'already_processed' })
      }

      // ─────────────────────────────────────────────
      // SERVER VERIFICATION - Never trust frontend/webhook blindly
      // ─────────────────────────────────────────────
      const { verifyPayment } = await import('@/app/actions/payment')
      const verification = await verifyPayment(cfOrderId)
      
      if (!verification.success) {
         console.error("Payment verification failed", verification.error)
         // Webhook processed, but verification failed, maybe not paid yet.
      } else {
         // The verifyPayment action updates the payment_status to 'Success' if it was PAID.
         // Let's refetch order to see if it became Success.
         const { data: updatedOrder } = await supabase
          .from('orders')
          .select('payment_status')
          .eq('id', order.id)
          .single()

         if (updatedOrder?.payment_status === 'Success') {
            await generateInvoice(order.id)
            await logTimeline(order.id, 'Order Completed', 'Invoice auto-generated')
            
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
                await logTimeline(order.id, 'Commission Generated', 'Sales and Vendor commissions calculated')
              }
            } catch (commErr: any) {
              console.error("Commission engine error:", commErr)
            }
         }
      }
      
      // Upsert payment record directly based on webhook (verifyPayment doesn't do this yet)
      // Actually, we can just record what the webhook told us as a log.
      await supabase.from('payments').upsert({
        order_id: order.id,
        cashfree_payment_id: cfPaymentId.toString(),
        amount,
        status: paymentStatus,
        method: payload.data?.payment?.payment_group || 'Cashfree',
      })
    }

    return NextResponse.json({ status: 'processed' })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
