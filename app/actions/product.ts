'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

async function checkAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return { supabase, user }
}

async function uploadFile(supabase: any, file: File | null, pathPrefix: string): Promise<string | null> {
  if (!file || file.size === 0) return null;
  const ext = file.name.split('.').pop();
  const fileName = `${pathPrefix}-${Date.now()}.${ext}`;
  const { data, error } = await supabase.storage.from('product_files').upload(fileName, file);
  if (error) {
    console.error('Upload error:', error);
    return null;
  }
  const { data: publicData } = supabase.storage.from('product_files').getPublicUrl(data.path);
  return publicData.publicUrl;
}

export async function createProduct(formData: FormData) {
  try {
    const { supabase, user } = await checkAdmin()
    
    // Generate slug from name
    const name = formData.get('name') as string
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '') + '-' + Date.now().toString().slice(-4)

    const logoFile = formData.get('logo') as File | null;
    const zipFile = formData.get('zip_template') as File | null;

    const logo_url = await uploadFile(supabase, logoFile, `logos/${slug}`);
    const zip_template = await uploadFile(supabase, zipFile, `zips/${slug}`);

    const product = {
      name,
      slug,
      description: formData.get('description'),
      category: formData.get('category'),
      version: formData.get('version') || 'v1.0.0',
      price_monthly: Number(formData.get('price_monthly')) || 0,
      price_yearly: Number(formData.get('price_yearly')) || 0,
      status: formData.get('status') || 'Draft',
      logo_url: logo_url || null,
      zip_template: zip_template || null
    }

    const { data, error } = await supabase.from('products').insert(product).select().single()
    if (error) throw error

    if (user?.id) {
      await supabase.from('product_activity_logs').insert({
        product_id: data.id,
        action: 'Created',
        details: 'Product was created',
        performed_by: user.id
      })
    }

    revalidatePath('/dashboard/products')
    return { data, error: null }
  } catch (error: any) {
    return { data: null, error: error.message }
  }
}

export async function updateProduct(id: string, formData: FormData) {
  try {
    const { supabase, user } = await checkAdmin()

    const logoFile = formData.get('logo') as File | null;
    const zipFile = formData.get('zip_template') as File | null;

    const updates: any = {
      name: formData.get('name'),
      description: formData.get('description'),
      category: formData.get('category'),
      version: formData.get('version'),
      price_monthly: Number(formData.get('price_monthly')) || 0,
      price_yearly: Number(formData.get('price_yearly')) || 0,
      status: formData.get('status'),
      updated_at: new Date().toISOString()
    }

    if (logoFile && logoFile.size > 0) {
      updates.logo_url = await uploadFile(supabase, logoFile, `logos/${id}`);
    }
    if (zipFile && zipFile.size > 0) {
      updates.zip_template = await uploadFile(supabase, zipFile, `zips/${id}`);
    }

    const { data, error } = await supabase.from('products').update(updates).eq('id', id).select().single()
    if (error) throw error

    if (user?.id) {
      await supabase.from('product_activity_logs').insert({
        product_id: id,
        action: 'Updated',
        details: 'Product details were updated',
        performed_by: user.id
      })
    }

    revalidatePath('/dashboard/products')
    revalidatePath(`/dashboard/products/${id}`)
    return { data, error: null }
  } catch (error: any) {
    return { data: null, error: error.message }
  }
}

export async function archiveProduct(id: string) {
  try {
    const { supabase, user } = await checkAdmin()
    const { error } = await supabase.from('products').update({ status: 'Archived' }).eq('id', id)
    if (error) throw error

    if (user?.id) {
      await supabase.from('product_activity_logs').insert({
        product_id: id,
        action: 'Archived',
        details: 'Product was archived',
        performed_by: user.id
      })
    }

    revalidatePath('/dashboard/products')
    return { error: null }
  } catch (error: any) {
    return { error: error.message }
  }
}

export async function restoreProduct(id: string) {
  try {
    const { supabase, user } = await checkAdmin()
    const { error } = await supabase.from('products').update({ status: 'Draft', deleted_at: null }).eq('id', id)
    if (error) throw error

    if (user?.id) {
      await supabase.from('product_activity_logs').insert({
        product_id: id,
        action: 'Restored',
        details: 'Product was restored to Draft',
        performed_by: user.id
      })
    }

    revalidatePath('/dashboard/products')
    return { error: null }
  } catch (error: any) {
    return { error: error.message }
  }
}

export async function softDeleteProduct(id: string) {
  return archiveProduct(id);
}

export async function hardDeleteProduct(id: string) {
  try {
    const { supabase } = await checkAdmin()
    const { error } = await supabase.from('products').delete().eq('id', id)
    if (error) throw error

    revalidatePath('/dashboard/products')
    return { error: null }
  } catch (error: any) {
    return { error: error.message }
  }
}

export async function duplicateProduct(id: string) {
  try {
    const { supabase, user } = await checkAdmin()
    
    // Fetch existing
    const { data: existing, error: fetchErr } = await supabase.from('products').select('*').eq('id', id).single()
    if (fetchErr) throw fetchErr

    const newSlug = existing.slug + '-copy-' + Date.now().toString().slice(-4)
    
    // Create new
    const { id: _, created_at, updated_at, deleted_at, ...productData } = existing
    
    const { data, error } = await supabase.from('products').insert({
      ...productData,
      name: `${existing.name} (Copy)`,
      slug: newSlug,
      status: 'Draft'
    }).select().single()
    
    if (error) throw error

    if (user?.id) {
      await supabase.from('product_activity_logs').insert({
        product_id: data.id,
        action: 'Created',
        details: `Product duplicated from ${existing.name}`,
        performed_by: user.id
      })
    }

    revalidatePath('/dashboard/products')
    return { data, error: null }
  } catch (error: any) {
    return { data: null, error: error.message }
  }
}
