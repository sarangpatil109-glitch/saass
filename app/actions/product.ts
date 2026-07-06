'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

async function checkAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return { supabase, user }
}

export async function createProduct(formData: FormData) {
  try {
    const { supabase, user } = await checkAdmin()
    
    const name = formData.get('name') as string

    const product = {
      name,
      description: formData.get('description'),
      category: formData.get('category') as string,
      is_active: formData.get('is_active') === 'on'
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
    console.error('Action Error:', error);
    return { data: null, error: `Database Error: ${error.message || JSON.stringify(error)}` }
  }
}

export async function updateProduct(id: string, formData: FormData) {
  try {
    const { supabase, user } = await checkAdmin()

    const updates: any = {
      name: formData.get('name'),
      description: formData.get('description'),
      category: formData.get('category') as string,
      is_active: formData.get('is_active') === 'on',
      updated_at: new Date().toISOString()
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
    console.error('Action Error:', error);
    return { data: null, error: `Database Error: ${error.message || JSON.stringify(error)}` }
  }
}

export async function duplicateProduct(id: string) {
  try {
    const { supabase, user } = await checkAdmin()

    const { data: original, error: fetchError } = await supabase.from('products').select('id, name, description, category, status, version, created_at, updated_at').eq('id', id).single()
    if (fetchError) throw fetchError

    const copy = {
      name: `${original.name} (Copy)`,
      description: original.description,
      category: original.category,
      is_active: false
    }

    const { data, error } = await supabase.from('products').insert(copy).select().single()
    if (error) throw error

    if (user?.id) {
      await supabase.from('product_activity_logs').insert({
        product_id: data.id,
        action: 'Duplicated',
        details: `Duplicated from ${original.name}`,
        performed_by: user.id
      })
    }

    revalidatePath('/dashboard/products')
    return { data, error: null }
  } catch (error: any) {
    console.error('Action Error:', error);
    return { data: null, error: `Database Error: ${error.message || JSON.stringify(error)}` }
  }
}

export async function archiveProduct(id: string) {
  try {
    const { supabase, user } = await checkAdmin()

    const { data, error } = await supabase.from('products').update({ is_active: false }).eq('id', id).select().single()
    if (error) throw error

    if (user?.id) {
      await supabase.from('product_activity_logs').insert({
        product_id: id,
        action: 'Deactivated',
        details: 'Product was deactivated',
        performed_by: user.id
      })
    }

    revalidatePath('/dashboard/products')
    revalidatePath(`/dashboard/products/${id}`)
    return { data, error: null }
  } catch (error: any) {
    console.error('Action Error:', error);
    return { data: null, error: `Database Error: ${error.message || JSON.stringify(error)}` }
  }
}

export async function restoreProduct(id: string) {
  try {
    const { supabase, user } = await checkAdmin()

    const { data, error } = await supabase.from('products').update({ is_active: true }).eq('id', id).select().single()
    if (error) throw error

    if (user?.id) {
      await supabase.from('product_activity_logs').insert({
        product_id: id,
        action: 'Activated',
        details: 'Product was activated',
        performed_by: user.id
      })
    }

    revalidatePath('/dashboard/products')
    revalidatePath(`/dashboard/products/${id}`)
    return { data, error: null }
  } catch (error: any) {
    console.error('Action Error:', error);
    return { data: null, error: `Database Error: ${error.message || JSON.stringify(error)}` }
  }
}

export async function hardDeleteProduct(id: string) {
  try {
    const { supabase } = await checkAdmin()

    const { error } = await supabase.from('products').delete().eq('id', id)
    if (error) throw error

    revalidatePath('/dashboard/products')
    return { error: null }
  } catch (error: any) {
    console.error('Action Error:', error);
    return { error: `Database Error: ${error.message || JSON.stringify(error)}` }
  }
}
