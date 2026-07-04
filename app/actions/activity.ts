'use server'

import { createClient } from '@/utils/supabase/server'

export async function logActivity(action: string, details: any = {}) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (user) {
    await supabase.from('activity_logs').insert({
      profile_id: user.id,
      action,
      details
    })
  }
}
