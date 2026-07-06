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
  const ext = (file.name || '').split('.').pop();
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


import { createClient as createSupabaseClient } from '@supabase/supabase-js'

export async function createVendor(formData: FormData) {
  try {
    const { supabase, user } = await checkAdmin()
    
    let vendor_code = formData.get('vendor_code') as string
    if (!vendor_code) vendor_code = await generateVendorCode(supabase)
    
    const logoFile = formData.get('logo') as File | null;
    const logo_url = await uploadFile(supabase, logoFile, `logos/${vendor_code}`);

    let user_id = null;
    const login_email = formData.get('login_email') as string;
    const password = formData.get('password') as string;

    if (login_email && password) {
      const supabaseAdmin = createSupabaseClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      );

      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email: login_email,
        password: password,
        email_confirm: true,
        user_metadata: { role: 'vendor' },
      });

      if (authError) throw new Error(authError.message);
      user_id = authData.user.id;

      await supabaseAdmin.from('profiles').upsert({
        id: user_id,
        email: login_email,
        role: 'vendor'
      });
    }

    const vendor: any = {
      vendor_code,
      business_name: formData.get('business_name'),
      owner_name: formData.get('owner_name'),
      email: formData.get('email'),
      phone: formData.get('phone'),
      address: formData.get('address'),
      city: formData.get('city'),
      state: formData.get('state'),
      country: formData.get('country') || 'India',
      notes: formData.get('notes'),
      status: formData.get('status') || 'Active',
      logo_url,

    }

    const { data, error } = await supabase.from('vendors').insert(vendor).select().single()
    if (error) throw error

    // Map the auth user to this vendor in vendor_users
    if (user_id) {
      await supabase.from('vendor_users').insert({
        vendor_id: data.id,
        user_id: user_id,
        role: 'vendor_admin'
      });
    }

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
    console.error('Action Error:', error);
    return { data: null, error: `Database Error: ${error.message || JSON.stringify(error)}` }
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
      address: formData.get('address'),
      city: formData.get('city'),
      state: formData.get('state'),
      country: formData.get('country') || 'India',
      notes: formData.get('notes'),
      status: formData.get('status'),

      updated_at: new Date().toISOString()
    }

    const vendor_code = formData.get('vendor_code')
    if (vendor_code) vendor.vendor_code = vendor_code

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
    console.error('Action Error:', error);
    return { data: null, error: `Database Error: ${error.message || JSON.stringify(error)}` }
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
    console.error('Action Error:', error);
    return { error: `Database Error: ${error.message || JSON.stringify(error)}` }
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
    console.error('Action Error:', error);
    return { error: `Database Error: ${error.message || JSON.stringify(error)}` }
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
    console.error('Action Error:', error);
    return { error: `Database Error: ${error.message || JSON.stringify(error)}` }
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
    console.error('Action Error:', error);
    return { error: `Database Error: ${error.message || JSON.stringify(error)}` }
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
      account_holder_name: formData.get('account_holder_name'),
      bank_name: formData.get('bank_name'),
      account_number: formData.get('account_number'),
      ifsc_code: formData.get('ifsc_code'),
      upi_id: formData.get('upi_id'),
      updated_at: new Date().toISOString() 
    }

    const { data: vendorUser } = await supabase.from('vendor_users').select('vendor_id, vendors(id, vendor_code)').eq('user_id', user.id).single()
    const currentVendor = vendorUser?.vendors as any;
    if (!currentVendor) throw new Error('Vendor not found')

    const logoFile = formData.get('logo') as File | null;
    if (logoFile && logoFile.size > 0) {
      vendor.logo_url = await uploadFile(supabase, logoFile, `logos/${currentVendor.vendor_code}`);
    }

    const qrFile = formData.get('upi_qr') as File | null;
    if (qrFile && qrFile.size > 0) {
      const url = await uploadFile(supabase, qrFile, `qr_codes/${currentVendor.vendor_code}`);
      if (url) vendor.upi_qr_url = url;
    }

    const { error } = await supabase.from('vendors').update(vendor).eq('id', currentVendor.id)
    if (error) throw error
    revalidatePath('/dashboard/vendor/profile')
    revalidatePath('/vendor/profile')
    revalidatePath('/vendor/settings')
    return { error: null }
  } catch (error: any) {
    console.error('Action Error:', error);
    return { error: `Database Error: ${error.message || JSON.stringify(error)}` }
  }
}
