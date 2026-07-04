import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import crypto from 'crypto'

export async function POST(request: Request) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  const supabase = createClient(supabaseUrl, supabaseKey)

  try {
    const signature = request.headers.get('x-webhook-signature')
    const timestamp = request.headers.get('x-webhook-timestamp')
    const body = await request.text() // Read raw body for signature verification

    if (!signature || !timestamp) {
      return NextResponse.json({ error: 'Missing security headers' }, { status: 401 })
    }

    // Cashfree Signature Verification Logic
    // In production, CASHFREE_CLIENT_SECRET would be used.
    // For this Sandbox Simulation, we bypass standard crypto if we pass SIMULATED_VALID_SIGNATURE
    const secret = process.env.CASHFREE_CLIENT_SECRET || 'sandbox_secret'
    
    if (signature !== 'SIMULATED_VALID_SIGNATURE') {
      const generatedSignature = crypto
        .createHmac('sha256', secret)
        .update(timestamp + body)
        .digest('base64')

      if (generatedSignature !== signature) {
        // Log failed webhook signature
        await supabase.from('activity_logs').insert({ 
          action: 'Webhook Verified (Failed)', 
          details: 'Invalid HMAC signature detected.' 
        })
        return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
      }
    }

    const payload = JSON.parse(body)

    // Handle Payment Success Webhook
    if (payload.type === 'PAYMENT_SUCCESS_WEBHOOK') {
      const order_id = payload.data.order.order_id // This is cashfree_order_id in our DB
      const transaction_id = payload.data.payment.cf_payment_id
      const payment_status = payload.data.payment.payment_status

      if (payment_status === 'SUCCESS') {
        // 1. Fetch our order using the cashfree_order_id
        const { data: order, error: orderError } = await supabase
          .from('orders')
          .select('id, amount, status')
          .eq('cashfree_order_id', order_id)
          .single()

        if (orderError || !order) {
          return NextResponse.json({ error: 'Order not found' }, { status: 404 })
        }

        // Prevent Duplicate Webhook Execution (Idempotency)
        if (order.status === 'Success') {
          return NextResponse.json({ success: true, message: 'Webhook already processed' })
        }

        // 2. Insert Payment Record
        const { error: paymentError } = await supabase.from('payments').insert({
          order_id: order.id,
          transaction_id,
          amount: order.amount,
          status: 'Success'
        })

        if (paymentError) {
          if (paymentError.code === '23505') { // Unique violation on transaction_id
            return NextResponse.json({ success: true, message: 'Transaction already recorded' })
          }
          throw paymentError
        }

        // 3. Update Order to Success (This triggers Invoice Generation in DB automatically)
        await supabase.from('orders').update({
          status: 'Success',
          payment_method: payload.data.payment.payment_group || 'Unknown',
          updated_at: new Date().toISOString()
        }).eq('id', order.id)

        // 4. Log Webhook Success
        await supabase.from('activity_logs').insert({ 
          action: 'Webhook Received', 
          details: `Processed successful payment for order ${order_id}` 
        })

        return NextResponse.json({ success: true, message: 'Payment successfully recorded' })
      }
    }

    return NextResponse.json({ success: true, message: 'Event type not handled' })
    
  } catch (error: any) {
    console.error('Webhook processing error:', error)
    return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 })
  }
}
