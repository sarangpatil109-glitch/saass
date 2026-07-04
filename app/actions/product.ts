'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { logActivity } from './activity'

export async function createProduct(formData: FormData) {
  const supabase = await createClient()
  
  const name = formData.get('name') as string
  const short_description = formData.get('short_description') as string
  const category_id = formData.get('category_id') as string
  const price = parseFloat(formData.get('price') as string)
  
  // Basic validation
  if (price < 0) return { error: 'Price must be positive.' }

  const { data, error } = await supabase.from('products').insert({
    name,
    short_description,
    category_id,
    price,
    status: 'Draft',
    visibility: 'Hidden'
  }).select().single()

  if (error) return { error: error.message }

  await logActivity('Product Created', { product_id: data.id, name })
  revalidatePath('/admin/products')
  
  return { success: true, id: data.id }
}

export async function updateProductDetails(id: string, formData: FormData) {
  const supabase = await createClient()
  const payload: any = { updated_at: new Date().toISOString() }

  if(formData.has('name')) payload.name = formData.get('name')
  if(formData.has('short_description')) payload.short_description = formData.get('short_description')
  if(formData.has('full_description')) payload.full_description = formData.get('full_description')
  if(formData.has('category_id')) payload.category_id = formData.get('category_id')
  if(formData.has('logo_url')) payload.logo_url = formData.get('logo_url')
  if(formData.has('banner_url')) payload.banner_url = formData.get('banner_url')
  
  const { error } = await supabase.from('products').update(payload).eq('id', id)
  if (error) return { error: error.message }

  await logActivity('Product Updated', { product_id: id })
  revalidatePath(`/admin/products/${id}`)
  return { success: true }
}

export async function updateProductStatus(id: string, newStatus: string) {
  const supabase = await createClient()
  const { error } = await supabase.from('products').update({ status: newStatus, updated_at: new Date().toISOString() }).eq('id', id)
  if (error) return { error: error.message }

  let action = 'Product Updated'
  if (newStatus === 'Published') action = 'Product Published'
  if (newStatus === 'Disabled') action = 'Product Disabled'
  if (newStatus === 'Archived') action = 'Product Archived'

  await logActivity(action, { product_id: id, status: newStatus })
  revalidatePath(`/admin/products/${id}`)
  revalidatePath(`/admin/products`)
  return { success: true }
}

export async function updateProductPricing(id: string, price: number, currency: string, is_one_time: boolean) {
  const supabase = await createClient()
  if (price < 0) return { error: 'Price must be positive.' }

  const { error } = await supabase.from('products').update({
    price,
    currency,
    is_one_time_payment: is_one_time,
    updated_at: new Date().toISOString()
  }).eq('id', id)

  if (error) return { error: error.message }

  await logActivity('Price Changed', { product_id: id, price })
  revalidatePath(`/admin/products/${id}`)
  return { success: true }
}

export async function updateProductDemo(id: string, demo_url: string, demo_status: string) {
  const supabase = await createClient()
  
  // basic URL validation
  if (demo_url && !demo_url.startsWith('http')) {
    return { error: 'Demo URL must start with http:// or https://' }
  }

  const { error } = await supabase.from('products').update({
    demo_url,
    demo_status,
    updated_at: new Date().toISOString()
  }).eq('id', id)

  if (error) return { error: error.message }

  await logActivity('Demo Updated', { product_id: id, demo_url })
  revalidatePath(`/admin/products/${id}`)
  return { success: true }
}

export async function createProductVersion(formData: FormData) {
  const supabase = await createClient()
  
  const product_id = formData.get('product_id') as string
  const major = parseInt(formData.get('major') as string)
  const minor = parseInt(formData.get('minor') as string)
  const patch = parseInt(formData.get('patch') as string)
  const release_notes = formData.get('release_notes') as string
  const is_stable = formData.get('is_stable') === 'on'
  
  const version_string = `${major}.${minor}.${patch}`

  const { data, error } = await supabase.from('product_versions').insert({
    product_id,
    version_string,
    major,
    minor,
    patch,
    release_notes,
    is_current_stable: is_stable
  }).select().single()

  if (error) return { error: error.message }

  await logActivity('Version Created', { product_id, version_string })
  revalidatePath(`/admin/products/${product_id}`)
  return { success: true }
}

export async function markVersionStable(versionId: string, productId: string) {
  const supabase = await createClient()
  
  const { data, error } = await supabase.from('product_versions').update({
    is_current_stable: true
  }).eq('id', versionId).select().single()

  if (error) return { error: error.message }

  await logActivity('Version Updated', { product_id: productId, version_string: data.version_string, note: 'Marked Stable' })
  revalidatePath(`/admin/products/${productId}`)
  return { success: true }
}
