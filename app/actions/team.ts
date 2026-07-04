'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

export async function approveSalesExecutive(salesExecId: string) {
  const supabase = await createClient()
  
  // 1. Update sales_executives table
  const { error: salesError } = await supabase
    .from('sales_executives')
    .update({ status: 'Active' })
    .eq('id', salesExecId)

  if (salesError) return { error: salesError.message }

  // 2. Update profiles table
  const { error: profileError } = await supabase
    .from('profiles')
    .update({ status: 'active' })
    .eq('id', salesExecId)

  if (profileError) return { error: profileError.message }

  revalidatePath('/vendor/team')
  return { success: true }
}

export async function rejectSalesExecutive(salesExecId: string) {
  const supabase = await createClient()

  const { error: salesError } = await supabase
    .from('sales_executives')
    .update({ status: 'Inactive' })
    .eq('id', salesExecId)

  if (salesError) return { error: salesError.message }

  const { error: profileError } = await supabase
    .from('profiles')
    .update({ status: 'inactive' })
    .eq('id', salesExecId)

  if (profileError) return { error: profileError.message }

  revalidatePath('/vendor/team')
  return { success: true }
}

export async function suspendSalesExecutive(salesExecId: string) {
  const supabase = await createClient()

  const { error: salesError } = await supabase
    .from('sales_executives')
    .update({ status: 'Suspended' })
    .eq('id', salesExecId)

  if (salesError) return { error: salesError.message }

  const { error: profileError } = await supabase
    .from('profiles')
    .update({ status: 'suspended' })
    .eq('id', salesExecId)

  if (profileError) return { error: profileError.message }

  revalidatePath('/vendor/team')
  return { success: true }
}
