'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

async function checkAuth() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')
  
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') throw new Error('Unauthorized')
  return { supabase, user }
}

export async function markCommissionPaid(commissionId: string) {
  try {
    const { supabase } = await checkAuth()
    
    const { error } = await supabase.from('commissions').update({
      status: 'Paid',
      updated_at: new Date().toISOString()
    }).eq('id', commissionId)
    
    if (error) throw error

    revalidatePath('/dashboard/admin/commissions')
    revalidatePath('/sales/dashboard')
    revalidatePath('/vendor/dashboard')
    
    return { error: null }
  } catch (error: any) {
    console.error('Action Error:', error)
    return { error: `Database Error: ${error.message || JSON.stringify(error)}` }
  }
}
