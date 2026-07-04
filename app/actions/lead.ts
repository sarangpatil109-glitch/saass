'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { logActivity } from './activity'

export async function createLead(formData: FormData) {
  const supabase = await createClient()
  
  const business_name = formData.get('business_name') as string
  const owner_name = formData.get('owner_name') as string
  const mobile = formData.get('mobile') as string
  const email = formData.get('email') as string
  const address = formData.get('address') as string
  const city = formData.get('city') as string
  const state = formData.get('state') as string
  const country = formData.get('country') as string
  const source = formData.get('source') as string
  const priority = formData.get('priority') as string
  const sales_executive_id = formData.get('sales_executive_id') as string

  // The database trigger will automatically populate vendor_id based on sales_executive_id
  const { data: lead, error: leadError } = await supabase.from('leads').insert({
    business_name,
    owner_name,
    mobile,
    email,
    address,
    city,
    state,
    country,
    source,
    priority,
    sales_executive_id
  }).select().single()

  if (leadError) {
    return { error: 'Failed to create lead: ' + leadError.message }
  }

  // Log Timeline
  await supabase.from('lead_timeline').insert({
    lead_id: lead.id,
    action: 'Lead Created',
    description: `Lead created from source: ${source}`
  })

  await logActivity('Lead Created', { lead_id: lead.id, business_name })
  
  // Hard revalidate paths
  revalidatePath('/admin/leads')
  revalidatePath('/vendor/leads')
  revalidatePath('/sales/leads')
  
  return { success: true }
}

export async function updateLeadStage(leadId: string, newStage: string) {
  const supabase = await createClient()
  
  const { data: lead, error } = await supabase.from('leads').update({
    stage: newStage,
    updated_at: new Date().toISOString()
  }).eq('id', leadId).select().single()

  if (error) return { error: error.message }

  // Log Timeline
  await supabase.from('lead_timeline').insert({
    lead_id: leadId,
    action: 'Stage Changed',
    description: `Lead moved to ${newStage}`
  })

  await logActivity('Stage Changed', { lead_id: leadId, new_stage: newStage })

  // If Won, trigger Customer Conversion
  if (newStage === 'Won') {
    // Check if already a customer to avoid duplicates
    const { data: existingCustomer } = await supabase.from('customers').select('id').eq('source_lead_id', leadId).single()
    
    if (!existingCustomer) {
      // 1. Create Profile for Customer to allow them to login if needed
      const profileId = crypto.randomUUID()
      await supabase.from('profiles').insert({
        id: profileId,
        email: lead.email,
        full_name: lead.owner_name,
        role: 'customer',
        status: 'active'
      })

      // 2. Insert into Customers
      const { data: customerData, error: custError } = await supabase.from('customers').insert({
        profile_id: profileId,
        source_lead_id: leadId,
        sales_executive_id: lead.sales_executive_id,
        vendor_id: lead.vendor_id,
        business_name: lead.business_name,
        mobile: lead.mobile,
        email: lead.email,
        address: lead.address,
        city: lead.city,
        state: lead.state,
        country: lead.country
      }).select().single()

      if (!custError && customerData) {
        await supabase.from('lead_timeline').insert({
          lead_id: leadId,
          action: 'Customer Created',
          description: `Automatically converted to customer upon Won stage.`
        })
        await logActivity('Customer Created', { customer_id: customerData.id, lead_id: leadId })
      }
    }
  }

  revalidatePath('/admin/leads')
  revalidatePath('/vendor/leads')
  revalidatePath('/sales/leads')
  
  return { success: true }
}

export async function addFollowup(formData: FormData) {
  const supabase = await createClient()
  const lead_id = formData.get('lead_id') as string
  const followup_date = formData.get('followup_date') as string
  const followup_time = formData.get('followup_time') as string
  const type = formData.get('type') as string
  const notes = formData.get('notes') as string

  const { error } = await supabase.from('lead_followups').insert({
    lead_id,
    followup_date,
    followup_time,
    type,
    notes,
    status: 'Pending'
  })

  if (error) return { error: error.message }

  await supabase.from('lead_timeline').insert({
    lead_id,
    action: 'Follow-up Added',
    description: `Scheduled a ${type} follow-up for ${followup_date}`
  })

  await logActivity('Follow-up Added', { lead_id })
  revalidatePath(`/admin/leads`)
  return { success: true }
}

export async function updateFollowupStatus(followupId: string, leadId: string, status: string) {
  const supabase = await createClient()
  const { error } = await supabase.from('lead_followups').update({ status }).eq('id', followupId)
  if (error) return { error: error.message }

  await supabase.from('lead_timeline').insert({
    lead_id: leadId,
    action: 'Follow-up Completed',
    description: `Follow-up marked as ${status}`
  })

  await logActivity('Follow-up Completed', { lead_id: leadId, followup_id: followupId })
  revalidatePath(`/admin/leads`)
  return { success: true }
}
