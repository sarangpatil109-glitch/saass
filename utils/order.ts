import { createClient } from '@/utils/supabase/server'
import crypto from 'crypto'

export function generateOrderNumber(): string {
  // Simple order number: ORD-YYYYMMDD-HHMMSS-<random>
  const now = new Date()
  const date = now.toISOString().slice(0,10).replace(/-/g,'')
  const time = now.toTimeString().slice(0,8).replace(/:/g,'')
  const random = Math.random().toString(36).substring(2,8).toUpperCase()
  return `ORD-${date}-${time}-${random}`
}

export function generateInvoiceNumber(): string {
  const now = new Date()
  const date = now.toISOString().slice(0,10).replace(/-/g,'')
  const random = Math.random().toString(36).substring(2,8).toUpperCase()
  return `INV-${date}-${random}`
}

export async function logTimeline(orderId: string, event: string, details?: string) {
  const supabase = await createClient()
  await supabase.from('payment_timeline').insert({
    order_id: orderId,
    event,
    details
  })
}

export async function logPayment(message: string, level: string = 'info', orderId?: string) {
  const supabase = await createClient()
  await supabase.from('payment_logs').insert({
    order_id: orderId,
    message,
    level
  })
}
