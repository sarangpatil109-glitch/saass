'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

async function checkAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  // if (!user) throw new Error('Unauthorized') // Bypassed for development
  
  // const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  // if (profile?.role !== 'admin') throw new Error('Forbidden')
  
  return { supabase, user }
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

// Generate VND-000001
async function generateVendorCode(supabase: any) {
  const { count } = await supabase.from('vendors').select('*', { count: 'exact', head: true })
  const nextNum = (count || 0) + 1
  return `VND-${nextNum.toString().padStart(6, '0')}`
}

// Generate GYMOS-AB12CD
async function generateCouponCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let result = ''
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return `GYMOS-${result}`
}

export async function createVendor(formData: FormData) {
  try {
    const { supabase, user } = await checkAdmin()
    
    let vendor_code = formData.get('vendor_code') as string
    if (!vendor_code) vendor_code = await generateVendorCode(supabase)
    
    let coupon_code = formData.get('coupon_code') as string
    if (!coupon_code) coupon_code = await generateCouponCode()

    const logoFile = formData.get('logo') as File | null;
    const logo_url = await uploadFile(supabase, logoFile, `logos/${vendor_code}`);

    const vendor = {
      vendor_code,
      coupon_code,
      business_name: formData.get('business_name'),
      owner_name: formData.get('owner_name'),
      email: formData.get('email'),
      phone: formData.get('phone'),
      gst_number: formData.get('gst_number'),
      address: formData.get('address'),
      city: formData.get('city'),
      state: formData.get('state'),
      country: formData.get('country') || 'India',
      pin_code: formData.get('pin_code'),
      bank_name: formData.get('bank_name'),
      account_number: formData.get('account_number'),
      ifsc_code: formData.get('ifsc_code'),
      upi_id: formData.get('upi_id'),
      notes: formData.get('notes'),
      status: formData.get('status') || 'Active',
      logo_url,
      commission_type: formData.get('commission_type') || 'percentage',
      commission_value: Number(formData.get('commission_value')) || 0,
      coupon_discount_type: formData.get('coupon_discount_type') || 'percentage',
      coupon_discount_value: Number(formData.get('coupon_discount_value')) || 0,
      coupon_max_uses: Number(formData.get('coupon_max_uses')) || 0,
      coupon_expiry_date: formData.get('coupon_expiry_date') ? new Date(formData.get('coupon_expiry_date') as string).toISOString() : null,
      coupon_status: 'Active'
    }

    const { data, error } = await supabase.from('vendors').insert(vendor).select().single()
    if (error) throw error

    if (user?.id) {
      await supabase.from('vendor_activity_logs').insert({
        vendor_id: data.id,
        action: 'Created',
        details: 'Vendor profile was created by Admin',
        performed_by: user.id
      })
    }

    revalidatePath('/dashboard/vendors')
    return { data, error: null }
  } catch (error: any) {
    return { data: null, error: error.message }
  }
}

export async function updateVendor(id: string, formData: FormData) {
  try {
    const { supabase, user } = await checkAdmin()

    const logoFile = formData.get('logo') as File | null;

    const vendor: any = {
      business_name: formData.get('business_name'),
      owner_name: formData.get('owner_name'),
      email: formData.get('email'),
      phone: formData.get('phone'),
      gst_number: formData.get('gst_number'),
      address: formData.get('address'),
      city: formData.get('city'),
      state: formData.get('state'),
      country: formData.get('country') || 'India',
      pin_code: formData.get('pin_code'),
      bank_name: formData.get('bank_name'),
      account_number: formData.get('account_number'),
      ifsc_code: formData.get('ifsc_code'),
      upi_id: formData.get('upi_id'),
      notes: formData.get('notes'),
      status: formData.get('status'),
      commission_type: formData.get('commission_type'),
      commission_value: Number(formData.get('commission_value')) || 0,
      coupon_discount_type: formData.get('coupon_discount_type'),
      coupon_discount_value: Number(formData.get('coupon_discount_value')) || 0,
      coupon_max_uses: Number(formData.get('coupon_max_uses')) || 0,
      coupon_expiry_date: formData.get('coupon_expiry_date') ? new Date(formData.get('coupon_expiry_date') as string).toISOString() : null,
      coupon_status: formData.get('coupon_status'),
      updated_at: new Date().toISOString()
    }

    const vendor_code = formData.get('vendor_code')
    if (vendor_code) vendor.vendor_code = vendor_code

    const coupon_code = formData.get('coupon_code')
    if (coupon_code) vendor.coupon_code = coupon_code

    if (logoFile && logoFile.size > 0) {
      vendor.logo_url = await uploadFile(supabase, logoFile, `logos/${id}`);
    }

    const { data, error } = await supabase.from('vendors').update(vendor).eq('id', id).select().single()
    if (error) throw error

    if (user?.id) {
      await supabase.from('vendor_activity_logs').insert({
        vendor_id: id,
        action: 'Updated',
        details: 'Vendor profile details were updated by Admin',
        performed_by: user.id
      })
    }

    revalidatePath('/dashboard/vendors')
    revalidatePath(`/dashboard/vendors/${id}`)
    return { data, error: null }
  } catch (error: any) {
    return { data: null, error: error.message }
  }
}

export async function updateVendorStatus(id: string, status: string) {
  try {
    const { supabase, user } = await checkAdmin()
    const { error } = await supabase.from('vendors').update({ status }).eq('id', id)
    if (error) throw error

    if (user?.id) {
      await supabase.from('vendor_activity_logs').insert({
        vendor_id: id,
        action: status === 'Archived' ? 'Archived' : status === 'Active' ? 'Enabled' : status === 'Inactive' ? 'Disabled' : 'Updated',
        details: `Vendor status changed to ${status}`,
        performed_by: user.id
      })
    }

    revalidatePath('/dashboard/vendors')
    revalidatePath(`/dashboard/vendors/${id}`)
    return { error: null }
  } catch (error: any) {
    return { error: error.message }
  }
}

export async function archiveVendor(id: string) {
  return updateVendorStatus(id, 'Archived')
}

export async function restoreVendor(id: string) {
  return updateVendorStatus(id, 'Active')
}

export async function softDeleteVendor(id: string) {
  return updateVendorStatus(id, 'Suspended')
}

export async function hardDeleteVendor(id: string) {
  try {
    const { supabase } = await checkAdmin()
    const { error } = await supabase.from('vendors').delete().eq('id', id)
    if (error) throw error

    revalidatePath('/dashboard/vendors')
    return { error: null }
  } catch (error: any) {
    return { error: error.message }
  }
}

export async function assignProductToVendor(vendorId: string, productId: string) {
  try {
    const { supabase, user } = await checkAdmin()
    const { error } = await supabase.from('vendor_products').insert({
      vendor_id: vendorId,
      product_id: productId
    })
    if (error) throw error

    if (user?.id) {
      await supabase.from('vendor_activity_logs').insert({
        vendor_id: vendorId,
        action: 'Product Assigned',
        details: 'A new product was assigned to the vendor',
        performed_by: user.id
      })
    }
    revalidatePath(`/dashboard/vendors/${vendorId}`)
    return { error: null }
  } catch (error: any) {
    return { error: error.message }
  }
}

export async function removeProductFromVendor(vendorId: string, productId: string) {
  try {
    const { supabase, user } = await checkAdmin()
    const { error } = await supabase.from('vendor_products').delete().match({ vendor_id: vendorId, product_id: productId })
    if (error) throw error

    if (user?.id) {
      await supabase.from('vendor_activity_logs').insert({
        vendor_id: vendorId,
        action: 'Product Removed',
        details: 'A product was unassigned from the vendor',
        performed_by: user.id
      })
    }
    revalidatePath(`/dashboard/vendors/${vendorId}`)
    return { error: null }
  } catch (error: any) {
    return { error: error.message }
  }
}


export async function regenerateCoupon(id: string) {
  try {
    const { supabase, user } = await checkAdmin()
    const newCoupon = await generateCouponCode()
    const { error } = await supabase.from('vendors').update({ coupon_code: newCoupon }).eq('id', id)
    if (error) throw error
    await supabase.from('vendor_coupon_codes').insert({ vendor_id: id, code: newCoupon, is_active: true })
    await supabase.from('vendor_coupon_codes').update({ is_active: false, deactivated_at: new Date().toISOString() }).eq('vendor_id', id).neq('code', newCoupon)
    if (user?.id) {
      await supabase.from('vendor_activity_logs').insert({ vendor_id: id, action: 'Coupon Regenerated', details: `Coupon code regenerated to ${newCoupon}`, performed_by: user.id })
    }
    revalidatePath('/dashboard/vendors')
    revalidatePath(`/dashboard/vendors/${id}`)
    return { error: null }
  } catch (error: any) {
    return { error: error.message }
  }
}

export async function updateVendorProfile(formData: FormData) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Unauthorized')

    const vendor: any = { 
      phone: formData.get('phone'), 
      address: formData.get('address'), 
      city: formData.get('city'), 
      state: formData.get('state'), 
      pin_code: formData.get('pin_code'), 
      bank_name: formData.get('bank_name'),
      account_number: formData.get('account_number'),
      ifsc_code: formData.get('ifsc_code'),
      upi_id: formData.get('upi_id'),
      updated_at: new Date().toISOString() 
    }

    const { data: currentVendor } = await supabase.from('vendors').select('id, vendor_code').eq('user_id', user.id).single()
    if (!currentVendor) throw new Error('Vendor not found')

    const logoFile = formData.get('logo') as File | null;
    if (logoFile && logoFile.size > 0) {
      vendor.logo_url = await uploadFile(supabase, logoFile, `logos/${currentVendor.vendor_code}`);
    }

    const { error } = await supabase.from('vendors').update(vendor).eq('user_id', user.id)
    if (error) throw error
    revalidatePath('/dashboard/vendor/profile')
    revalidatePath('/vendor/profile')
    revalidatePath('/vendor/settings')
    return { error: null }
  } catch (error: any) {
    return { error: error.message }
  }
}
