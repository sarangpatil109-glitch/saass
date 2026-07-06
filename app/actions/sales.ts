'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

async function checkAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')
  
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') throw new Error('Forbidden')
  
  return { supabase, user }
}

async function checkSalesExec() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')
  
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'sales_executive') throw new Error('Forbidden')
  
  return { supabase, user }
}

// Generate SE-000001
async function generateEmployeeCode(supabase: any) {
  const { count } = await supabase.from('sales_executives').select('*', { count: 'exact', head: true })
  const nextNum = (count || 0) + 1
  return `SE-${nextNum.toString().padStart(6, '0')}`
}



export async function createSalesExecutive(formData: FormData) {
  try {
    const { supabase, user } = await checkAdmin()
    
    const vendorId = formData.get('vendor_id') as string
    let vendor = null
    if (vendorId) {
      const { data } = await supabase.from('vendors').select('id, vendor_code').eq('id', vendorId).single()
      vendor = data
    }
    
    const employee_code = (formData.get('employee_code') as string) || await generateEmployeeCode(supabase)
    
    const first_name = formData.get('first_name') as string
    const last_name = formData.get('last_name') as string

    const exec = {
      employee_code,
      vendor_id: vendor?.id || null,
      vendor_code: vendor?.vendor_code || null,
      first_name,
      last_name,
      full_name: [first_name, last_name].filter(Boolean).join(' ').trim(),
      email: formData.get('email'),
      phone: formData.get('phone'),
      password_hash: formData.get('password'),
      designation: formData.get('designation') || 'Sales Executive',
      joining_date: formData.get('joining_date') || new Date().toISOString().split('T')[0],
      monthly_target: Number(formData.get('monthly_target')) || 0,
      target_amount: Number(formData.get('monthly_target')) || 0,
      commission_percentage: Number(formData.get('commission_percentage')) || 10,
      whatsapp_number: formData.get('whatsapp_number'),
      address: formData.get('address'),
      city: formData.get('city'),
      state: formData.get('state'),
      country: formData.get('country') || 'India',
      profile_photo: formData.get('profile_photo'),
      notes: formData.get('notes'),
      status: formData.get('status') || 'Active',
      vendor_name: (formData.get('vendor_name') as string) || null,
    }


    const { data, error } = await supabase.from('sales_executives').insert(exec).select().single()
    if (error) {
      if (error.code === '23505') {
        if (error.message.includes('email')) throw new Error('Email must be unique')
        if (error.message.includes('employee_code')) throw new Error('Employee code must be unique')
      }
      throw error
    }

    await supabase.from('sales_activity_logs').insert({
      sales_exec_id: data.id,
      action: 'Created',
      details: vendor ? `Sales Executive was created and mapped to Vendor ${vendor.vendor_code}` : `Sales Executive was created without a vendor`,
      performed_by: user.id
    })

    revalidatePath('/dashboard/sales-executives')
    return { data, error: null }
  } catch (error: any) {
    console.error('Action Error in createSalesExecutive:', error)
    return { data: null, error: `Database Error: ${error.message}` }
  }
}

export async function assignVendorToSalesExec(salesExecId: string, vendorId: string | null) {
  try {
    const { supabase, user } = await checkAdmin()
    
    let vendorCode = null;
    if (vendorId) {
      const { data: vendor } = await supabase.from('vendors').select('vendor_code').eq('id', vendorId).single()
      vendorCode = vendor?.vendor_code || null;
    }

    const { error } = await supabase.from('sales_executives').update({ 
      vendor_id: vendorId,
      vendor_code: vendorCode
    }).eq('id', salesExecId)
    
    if (error) throw error

    await supabase.from('sales_activity_logs').insert({
      sales_exec_id: salesExecId,
      action: 'Vendor Assigned',
      details: vendorId ? `Assigned to Vendor ${vendorCode}` : 'Unassigned from Vendor',
      performed_by: user.id
    })

    revalidatePath('/dashboard/sales-executives')
    revalidatePath(`/dashboard/sales-executives/${salesExecId}`)
    return { error: null }
  } catch (error: any) {
    console.error('Action Error in assignVendorToSalesExec:', error)
    return { error: `Database Error: ${error.message}` }
  }
}

export async function updateSalesExecutive(id: string, formData: FormData) {
  try {
    const { supabase, user } = await checkAdmin()

    let vendorMapping: any = { vendor_id: null, vendor_code: null }
    const vendorId = formData.get('vendor_id') as string
    if (vendorId) {
       try {
         const { data: vendor } = await supabase.from('vendors').select('id, vendor_code').eq('id', vendorId).single()
         if (vendor) {
           vendorMapping = {
              vendor_id: vendor.id,
              vendor_code: vendor.vendor_code,
           }
         }
       } catch (e) {
         console.error('Error fetching vendor during assignment:', e)
       }
    }
    
    const first_name = formData.get('first_name') as string
    const last_name = formData.get('last_name') as string

    const exec: any = {
      ...vendorMapping,
      first_name,
      last_name,
      full_name: [first_name, last_name].filter(Boolean).join(' ').trim(),
      email: formData.get('email'),
      phone: formData.get('phone'),
      designation: formData.get('designation') || 'Sales Executive',
      joining_date: formData.get('joining_date') || new Date().toISOString().split('T')[0],
      monthly_target: Number(formData.get('monthly_target')) || 0,
      target_amount: Number(formData.get('monthly_target')) || 0,
      commission_percentage: Number(formData.get('commission_percentage')) || 10,
      whatsapp_number: formData.get('whatsapp_number'),
      address: formData.get('address'),
      city: formData.get('city'),
      state: formData.get('state'),
      country: formData.get('country') || 'India',
      profile_photo: formData.get('profile_photo'),
      notes: formData.get('notes'),
      status: formData.get('status'),
      vendor_name: (formData.get('vendor_name') as string) || null,
      updated_at: new Date().toISOString()
    }
    
    if (formData.get('employee_code')) {
      exec.employee_code = formData.get('employee_code')
    }

    const { data, error } = await supabase.from('sales_executives').update(exec).eq('id', id).select().single()
    if (error) {
      if (error.code === '23505') {
        if (error.message.includes('email')) throw new Error('Email must be unique')
        if (error.message.includes('employee_code')) throw new Error('Employee code must be unique')
      }
      console.error('Supabase update error:', error)
      throw error
    }

    await supabase.from('sales_activity_logs').insert({
      sales_exec_id: id,
      action: 'Updated',
      details: 'Sales Executive profile was updated',
      performed_by: user.id
    })

    revalidatePath('/dashboard/sales-executives')
    revalidatePath(`/dashboard/sales-executives/${id}`)
    return { data, error: null }
  } catch (error: any) {
    console.error('Action Error in updateSalesExecutive:', error)
    return { data: null, error: `Database Error: ${error.message}` }
  }
}

export async function updateSalesStatus(id: string, status: string) {
  try {
    const { supabase, user } = await checkAdmin()
    const { error } = await supabase.from('sales_executives').update({ status }).eq('id', id)
    if (error) throw error

    await supabase.from('sales_activity_logs').insert({
      sales_exec_id: id,
      action: status === 'Archived' ? 'Archived' : status === 'Active' ? 'Enabled' : status === 'Inactive' ? 'Disabled' : 'Updated',
      details: `Status changed to ${status}`,
      performed_by: user.id
    })

    revalidatePath('/dashboard/sales-executives')
    revalidatePath(`/dashboard/sales-executives/${id}`)
    return { error: null }
  } catch (error: any) {
    console.error('Action Error:', error);
    return { error: `Database Error: ${error.message || JSON.stringify(error)}` }
  }
}

export async function softDeleteSalesExecutive(id: string) {
  try {
    const { supabase, user } = await checkAdmin()
    const { error } = await supabase.from('sales_executives').update({ deleted_at: new Date().toISOString(), status: 'Archived' }).eq('id', id)
    if (error) throw error

    await supabase.from('sales_activity_logs').insert({
      sales_exec_id: id,
      action: 'Deleted',
      details: 'Sales Executive was soft deleted and archived',
      performed_by: user.id
    })

    revalidatePath('/dashboard/sales-executives')
    return { error: null }
  } catch (error: any) {
    console.error('Action Error:', error);
    return { error: `Database Error: ${error.message || JSON.stringify(error)}` }
  }
}

export async function hardDeleteSalesExecutive(id: string) {
  try {
    const { supabase } = await checkAdmin()
    const { error } = await supabase.from('sales_executives').delete().eq('id', id)
    if (error) throw error

    revalidatePath('/dashboard/sales-executives')
    return { error: null }
  } catch (error: any) {
    console.error('Action Error:', error);
    return { error: `Database Error: ${error.message || JSON.stringify(error)}` }
  }
}

// Targets
export async function assignTarget(formData: FormData) {
  try {
    const { supabase, user } = await checkAdmin()
    
    const target = {
      sales_exec_id: formData.get('sales_exec_id'),
      period: formData.get('period'),
      start_date: formData.get('start_date'),
      end_date: formData.get('end_date'),
      target_amount: formData.get('target_amount')
    }

    const { error } = await supabase.from('sales_targets').insert(target)
    if (error) throw error

    await supabase.from('sales_activity_logs').insert({
      sales_exec_id: target.sales_exec_id,
      action: 'Target Updated',
      details: `Assigned new ${target.period} target of ${target.target_amount}`,
      performed_by: user.id
    })

    revalidatePath(`/dashboard/sales-executives/${target.sales_exec_id}`)
    return { error: null }
  } catch (error: any) {
    console.error('Action Error:', error);
    return { error: `Database Error: ${error.message || JSON.stringify(error)}` }
  }
}

async function uploadFile(supabase: any, file: File | null, pathPrefix: string): Promise<string | null> {
  if (!file || file.size === 0) return null;
  const ext = (file.name || '').split('.').pop();
  const fileName = `${pathPrefix}-${Date.now()}.${ext}`;
  const bucket = pathPrefix.startsWith('qr_codes/') ? 'qr-codes' : 'vendor_files';
  const { data, error } = await supabase.storage.from(bucket).upload(fileName, file);
  if (error) {
    console.error('Upload error:', error);
    return null;
  }
  const { data: publicData } = supabase.storage.from(bucket).getPublicUrl(data.path);
  return publicData.publicUrl;
}

export async function updateSalesProfile(formData: FormData) {
  try {
    const { supabase, user } = await checkSalesExec()
    
    const update: any = {
      phone: formData.get('phone'),
      whatsapp_number: formData.get('whatsapp_number'),
      address: formData.get('address'),
      account_holder_name: formData.get('account_holder_name'),
      bank_name: formData.get('bank_name'),
      account_number: formData.get('account_number'),
      ifsc_code: formData.get('ifsc_code'),
      upi_id: formData.get('upi_id'),
      vendor_name: (formData.get('vendor_name') as string) || null,
      updated_at: new Date().toISOString()
    }

    const { data: rec } = await supabase.from('sales_executives').select('id, employee_code').eq('id', user.id).single()
    if (!rec) throw new Error('Profile not found')

    const photoFile = formData.get('profile_photo') as File | null;
    if (photoFile && photoFile.size > 0) {
      const url = await uploadFile(supabase, photoFile, `sales_photos/${rec.employee_code}`);
      if (url) update.profile_photo = url;
    }

    const qrFile = formData.get('upi_qr') as File | null;
    if (qrFile && qrFile.size > 0) {
      const url = await uploadFile(supabase, qrFile, `qr_codes/${rec.employee_code}`);
      if (url) update.upi_qr_url = url;
    }

    const { error } = await supabase.from('sales_executives').update(update).eq('id', rec.id)
    if (error) throw error

    await supabase.from('sales_activity_logs').insert({
      sales_exec_id: rec.id,
      action: 'Profile Updated',
      details: 'Sales Executive updated their own profile',
      performed_by: user.id
    })

    revalidatePath('/sales/profile')
    revalidatePath('/sales/settings')
    return { error: null }
  } catch (error: any) {
    console.error('Action Error:', error);
    return { error: `Database Error: ${error.message || JSON.stringify(error)}` }
  }
}
