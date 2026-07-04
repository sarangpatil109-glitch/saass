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
  if (profile?.role !== 'sales') throw new Error('Forbidden')
  
  return { supabase, user }
}

// Generate SE-000001
async function generateEmployeeCode(supabase: any) {
  const { count } = await supabase.from('sales_executives').select('*', { count: 'exact', head: true })
  const nextNum = (count || 0) + 1
  return `SE-${nextNum.toString().padStart(6, '0')}`
}

async function resolveVendor(supabase: any, formData: FormData) {
  const vendorId = formData.get('vendor_id') as string
  const inviteCode = formData.get('invite_code') as string
  const couponCode = formData.get('coupon_code') as string

  let vendor = null

  if (vendorId) {
    const { data } = await supabase.from('vendors').select('id, vendor_code, coupon_code').eq('id', vendorId).single()
    vendor = data
  } else if (couponCode) {
    const { data } = await supabase.from('vendors').select('id, vendor_code, coupon_code').eq('coupon_code', couponCode).single()
    vendor = data
  }

  if (!vendor) {
    throw new Error('A valid Vendor is required. Please select a vendor or provide a valid coupon code.')
  }

  return vendor
}

export async function createSalesExecutive(formData: FormData) {
  try {
    const { supabase, user } = await checkAdmin()
    
    const vendor = await resolveVendor(supabase, formData)
    const employee_code = (formData.get('employee_code') as string) || await generateEmployeeCode(supabase)
    
    const first_name = formData.get('first_name') as string
    const last_name = formData.get('last_name') as string

    const exec = {
      employee_code,
      vendor_id: vendor.id,
      vendor_code: vendor.vendor_code,
      vendor_coupon_code: vendor.coupon_code,
      first_name,
      last_name,
      full_name: `${first_name} ${last_name}`.trim(),
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
      details: `Sales Executive was created and mapped to Vendor ${vendor.vendor_code}`,
      performed_by: user.id
    })

    revalidatePath('/dashboard/sales-executives')
    return { data, error: null }
  } catch (error: any) {
    return { data: null, error: error.message }
  }
}

export async function updateSalesExecutive(id: string, formData: FormData) {
  try {
    const { supabase, user } = await checkAdmin()

    let vendorMapping = {}
    if (formData.get('vendor_id') || formData.get('coupon_code')) {
       try {
         const vendor = await resolveVendor(supabase, formData)
         vendorMapping = {
            vendor_id: vendor.id,
            vendor_code: vendor.vendor_code,
            vendor_coupon_code: vendor.coupon_code,
         }
       } catch (e) {
       }
    }
    
    const first_name = formData.get('first_name') as string
    const last_name = formData.get('last_name') as string

    const exec: any = {
      ...vendorMapping,
      first_name,
      last_name,
      full_name: `${first_name} ${last_name}`.trim(),
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
    return { data: null, error: error.message }
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
    return { error: error.message }
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
    return { error: error.message }
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
    return { error: error.message }
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
    return { error: error.message }
  }
}

async function uploadFile(supabase: any, file: File | null, pathPrefix: string): Promise<string | null> {
  if (!file || file.size === 0) return null;
  const ext = file.name.split('.').pop();
  const fileName = `${pathPrefix}-${Date.now()}.${ext}`;
  const { data, error } = await supabase.storage.from('vendor_files').upload(fileName, file);
  if (error) {
    console.error('Upload error:', error);
    return null;
  }
  const { data: publicData } = supabase.storage.from('vendor_files').getPublicUrl(data.path);
  return publicData.publicUrl;
}

export async function updateSalesProfile(formData: FormData) {
  try {
    const { supabase, user } = await checkSalesExec()
    
    const update: any = {
      phone: formData.get('phone'),
      whatsapp_number: formData.get('whatsapp_number'),
      address: formData.get('address'),
      updated_at: new Date().toISOString()
    }

    const { data: rec } = await supabase.from('sales_executives').select('id, employee_code').eq('user_id', user.id).single()
    if (!rec) throw new Error('Profile not found')

    const photoFile = formData.get('profile_photo') as File | null;
    if (photoFile && photoFile.size > 0) {
      const url = await uploadFile(supabase, photoFile, `sales_photos/${rec.employee_code}`);
      if (url) update.profile_photo = url;
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
    return { error: error.message }
  }
}
