'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { sendActivationEmail } from '@/lib/email/resend'

async function checkAdminAuth() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')
  
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') throw new Error('Unauthorized - Admin access required')
  
  return { supabase, user }
}


export async function sendTestEmail(email: string) {
  try {
    await checkAdminAuth()
    
    // Send a test email ignoring the toggle state but logging exactly what happens
    const result = await sendActivationEmail(
      email,
      'Test Customer',
      'Test GymOS Suite'
    )
    
    if (!result.success) {
      throw new Error(result.error || 'Failed to send test email')
    }

    return { success: true }
  } catch (error: any) {
    console.error('Failed to send test email:', error)
    return { success: false, error: error.message }
  }
}
