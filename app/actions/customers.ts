'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

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

export async function createCustomer(formData: FormData) {
  try {
    const { supabase, user } = await checkAuth()
    
    const customerCode = 'CUST-' + Math.random().toString(36).substring(2, 10).toUpperCase()
    
    const customer = {
      customer_code: customerCode,
      customer_name: formData.get('customer_name') as string,
      business_name: formData.get('business_name') as string,
      business_type: formData.get('business_type') as string,
      email: formData.get('email') as string,
      phone: formData.get('phone') as string,
      whatsapp: formData.get('whatsapp') as string,
      address: formData.get('address') as string,
      city: formData.get('city') as string,
      state: formData.get('state') as string,
      country: formData.get('country') as string,
      gst_number: formData.get('gst_number') as string,
      notes: formData.get('notes') as string,
      status: 'Active'
    }

    const { data, error } = await supabase.from('customers').insert(customer).select().single()
    if (error) throw error

    await logActivity(supabase, 'Customer Created', `Customer ${customer.customer_name} created.`, user.id)

    revalidatePath('/dashboard/customers')
    return { data, error: null }
  } catch (error: any) {
    return { data: null, error: error.message }
  }
}

export async function updateCustomer(customerId: string, formData: FormData) {
  try {
    const { supabase, user } = await checkAuth()
    
    const customer = {
      customer_name: formData.get('customer_name') as string,
      business_name: formData.get('business_name') as string,
      business_type: formData.get('business_type') as string,
      email: formData.get('email') as string,
      phone: formData.get('phone') as string,
      whatsapp: formData.get('whatsapp') as string,
      address: formData.get('address') as string,
      city: formData.get('city') as string,
      state: formData.get('state') as string,
      country: formData.get('country') as string,
      gst_number: formData.get('gst_number') as string,
      status: formData.get('status') as string,
      notes: formData.get('notes') as string
    }

    const { error } = await supabase.from('customers').update(customer).eq('id', customerId)
    if (error) throw error

    await logActivity(supabase, 'Customer Updated', `Customer ${customer.customer_name} details updated.`, user.id)

    revalidatePath(`/dashboard/customers/${customerId}`)
    revalidatePath('/dashboard/customers')
    return { error: null }
  } catch (error: any) {
    return { error: error.message }
  }
}
