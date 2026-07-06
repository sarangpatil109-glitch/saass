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

async function logTimeline(supabase: any, lead_id: string, action: string, details: string, user_id: string) {
  await supabase.from('lead_timeline').insert({ lead_id, action, details, performed_by: user_id })
  await supabase.from('crm_activity_logs').insert({ action, details, entity_type: 'Lead', entity_id: lead_id, performed_by: user_id })
}

// Generate LD-000001
async function generateLeadNumber(supabase: any) {
  const { count } = await supabase.from('leads').select('*', { count: 'exact', head: true })
  const nextNum = (count || 0) + 1
  return `LD-${nextNum.toString().padStart(6, '0')}`
}

export async function createLead(formData: FormData) {
  try {
    const { supabase, user } = await checkAuth()
    
    const phone = formData.get('phone') as string
    const email = formData.get('email') as string
    const businessName = formData.get('business_name') as string
    
    // Duplicate Check
    let query = supabase.from('leads').select('id')
    if (phone && email) {
      query = query.or(`phone.eq.${phone},email.eq.${email},business_name.ilike.${businessName}`)
    } else if (phone) {
      query = query.or(`phone.eq.${phone},business_name.ilike.${businessName}`)
    } else {
      query = query.or(`business_name.ilike.${businessName}`)
    }

    const { data: existing } = await query
    
    if (existing && existing.length > 0) {
      throw new Error('Duplicate Lead detected. A lead with this Phone, Email, or Business Name already exists.')
    }

    const lead_number = await generateLeadNumber(supabase)

    const lead = {
      lead_number,
      customer_name: formData.get('customer_name'),
      business_name: businessName,
      business_type: formData.get('business_type'),
      phone,
      whatsapp_number: formData.get('whatsapp_number'),
      email,
      address: formData.get('address'),
      city: formData.get('city'),
      state: formData.get('state'),
      country: formData.get('country') || 'India',
      product_id: formData.get('product_id') || null,
      lead_source: formData.get('lead_source') || 'Manual',
      assigned_vendor_id: formData.get('assigned_vendor_id') || null,
      assigned_sales_executive_id: formData.get('assigned_sales_executive_id') || null,
      priority: formData.get('priority') || 'Medium',
      pipeline_stage: 'New Lead',
      lead_status: 'Open',
      expected_close_date: formData.get('expected_close_date') || null,
      expected_value: formData.get('expected_value') || 0,
      notes: formData.get('notes')
    }

    const { data, error } = await supabase.from('leads').insert(lead).select().single()
    if (error) throw error

    await logTimeline(supabase, data.id, 'Lead Created', `Lead created in stage New Lead`, user.id)

    revalidatePath('/dashboard/leads')
    return { data, error: null }
  } catch (error: any) {
    console.error('Action Error:', error);
    return { data: null, error: `Database Error: ${error.message || JSON.stringify(error)}` }
  }
}

export async function updateLead(id: string, formData: FormData) {
  try {
    const { supabase, user } = await checkAuth()
    
    const lead = {
      customer_name: formData.get('customer_name'),
      business_name: formData.get('business_name'),
      business_type: formData.get('business_type'),
      phone: formData.get('phone'),
      whatsapp_number: formData.get('whatsapp_number'),
      email: formData.get('email'),
      address: formData.get('address'),
      city: formData.get('city'),
      state: formData.get('state'),
      country: formData.get('country') || 'India',
      product_id: formData.get('product_id') || null,
      lead_source: formData.get('lead_source') || 'Manual',
      assigned_vendor_id: formData.get('assigned_vendor_id') || null,
      assigned_sales_executive_id: formData.get('assigned_sales_executive_id') || null,
      priority: formData.get('priority') || 'Medium',
      expected_close_date: formData.get('expected_close_date') || null,
      expected_value: formData.get('expected_value') || 0,
      notes: formData.get('notes'),
      updated_at: new Date().toISOString()
    }

    const { data, error } = await supabase.from('leads').update(lead).eq('id', id).select().single()
    if (error) throw error

    await logTimeline(supabase, id, 'Lead Updated', `Lead information was updated`, user.id)

    revalidatePath('/dashboard/leads')
    revalidatePath(`/dashboard/leads/${id}`)
    return { data, error: null }
  } catch (error: any) {
    console.error('Action Error:', error);
    return { data: null, error: `Database Error: ${error.message || JSON.stringify(error)}` }
  }
}

export async function updateLeadStage(leadId: string, newStage: string) {
  try {
    const { supabase, user } = await checkAuth()
    
    const { data: lead, error } = await supabase.from('leads').update({ pipeline_stage: newStage, updated_at: new Date().toISOString() }).eq('id', leadId).select().single()
    if (error) throw error

    await logTimeline(supabase, leadId, 'Stage Changed', `Moved to ${newStage}`, user.id)

    if (newStage === 'Won') {
      await supabase.from('leads').update({ won_at: new Date().toISOString(), lead_status: 'Won' }).eq('id', leadId)
      
      // Auto-create customer
      const { data: leadData } = await supabase.from('leads').select('*').eq('id', leadId).single()
      if (leadData) {
        const { data: existingCustomer } = await supabase.from('customers').select('id').eq('email', leadData.email).maybeSingle()
        if (!existingCustomer) {
          const customerCode = 'CUST-' + Math.random().toString(36).substring(2, 10).toUpperCase()
          await supabase.from('customers').insert({
            customer_code: customerCode,
            customer_name: leadData.customer_name,
            business_name: leadData.business_name,
            business_type: leadData.business_type,
            email: leadData.email,
            phone: leadData.phone,
            whatsapp: leadData.whatsapp_number,
            city: leadData.city,
            state: leadData.state,
            country: leadData.country,
            address: leadData.address,
            status: 'Active'
          })
          await logTimeline(supabase, leadId, 'Customer Auto-created', `Customer profile created for ${leadData.business_name}`, user.id)
        }
      }
    } else if (newStage === 'Lost') {
      await supabase.from('leads').update({ lost_at: new Date().toISOString(), lead_status: 'Lost' }).eq('id', leadId)
    }

    revalidatePath('/dashboard/leads')
    revalidatePath(`/dashboard/leads/${leadId}`)
    return { error: null }
  } catch (error: any) {
    console.error('Action Error:', error);
    return { error: `Database Error: ${error.message || JSON.stringify(error)}` }
  }
}

export async function createFollowup(formData: FormData) {
  try {
    const { supabase, user } = await checkAuth()
    
    const leadId = formData.get('lead_id') as string
    const followup = {
      lead_id: leadId,
      followup_date: new Date(formData.get('followup_date') as string).toISOString(),
      followup_type: formData.get('type'),
      remarks: formData.get('remarks'),
      status: 'Pending',
      created_by: user.id
    }

    const { error } = await supabase.from('lead_followups').insert(followup)
    if (error) throw error

    await supabase.from('leads').update({ next_followup_at: followup.followup_date }).eq('id', leadId)
    await logTimeline(supabase, leadId, 'Follow-up Scheduled', `Scheduled a ${followup.followup_type}`, user.id)

    revalidatePath(`/dashboard/leads/${leadId}`)
    return { error: null }
  } catch (error: any) {
    console.error('Action Error:', error);
    return { error: `Database Error: ${error.message || JSON.stringify(error)}` }
  }
}

export async function completeFollowup(id: string, leadId: string) {
  try {
    const { supabase, user } = await checkAuth()
    
    const { error } = await supabase.from('lead_followups').update({ status: 'Completed', updated_at: new Date().toISOString() }).eq('id', id)
    if (error) throw error

    await supabase.from('leads').update({ last_contacted_at: new Date().toISOString() }).eq('id', leadId)
    await logTimeline(supabase, leadId, 'Follow-up Completed', `A follow-up was marked as completed`, user.id)

    revalidatePath(`/dashboard/leads/${leadId}`)
    return { error: null }
  } catch (error: any) {
    console.error('Action Error:', error);
    return { error: `Database Error: ${error.message || JSON.stringify(error)}` }
  }
}

export async function addNote(formData: FormData) {
  try {
    const { supabase, user } = await checkAuth()
    const leadId = formData.get('lead_id') as string
    const note = formData.get('note') as string

    const { error } = await supabase.from('lead_notes').insert({
      lead_id: leadId,
      note,
      created_by: user.id
    })
    if (error) throw error

    await logTimeline(supabase, leadId, 'Note Added', 'A new note was added to the lead', user.id)

    revalidatePath(`/dashboard/leads/${leadId}`)
    return { error: null }
  } catch (error: any) {
    console.error('Action Error:', error);
    return { error: `Database Error: ${error.message || JSON.stringify(error)}` }
  }
}

export async function softDeleteLead(id: string) {
  try {
    const { supabase, user } = await checkAuth()
    const { error } = await supabase.from('leads').update({ deleted_at: new Date().toISOString(), lead_status: 'Deleted' }).eq('id', id)
    if (error) throw error

    await logTimeline(supabase, id, 'Deleted', 'Lead was soft deleted', user.id)

    revalidatePath('/dashboard/leads')
    return { error: null }
  } catch (error: any) {
    console.error('Action Error:', error);
    return { error: `Database Error: ${error.message || JSON.stringify(error)}` }
  }
}
