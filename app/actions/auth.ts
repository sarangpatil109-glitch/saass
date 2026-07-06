'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function login(state: any, formData: FormData) {
  const supabase = await createClient()

  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const expectedRole = formData.get('expected_role') as string

  if (!email || !password) {
    return { error: 'Email and password are required' }
  }

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    return { error: error.message }
  }

  // Fetch the user role to determine where to redirect
  const { data: { user } } = await supabase.auth.getUser()
  let targetUrl = '/dashboard'
  
  if (user) {
    const { data: profile } = await supabase.from('profiles').select('role, status').eq('id', user.id).single()
    if (profile?.status === 'suspended' || profile?.status === 'inactive') {
      await supabase.auth.signOut()
      return { error: 'Your account is inactive or suspended.' }
    }
    
    const role = profile?.role || 'customer'
    
    // Strict role check
    if (expectedRole && expectedRole !== role) {
      await supabase.auth.signOut()
      return { error: 'Invalid role for this login portal.' }
    }

    if (role === 'admin') targetUrl = '/dashboard'
    else if (role === 'vendor') targetUrl = '/vendor/dashboard'
    else if (role === 'sales_executive') targetUrl = '/sales/dashboard'
    else targetUrl = '/'
  }

  // Revalidate layout to ensure fresh data
  revalidatePath('/', 'layout')
  
  // Important: Do the redirect on the server so the browser receives the Set-Cookie headers properly.
  redirect(targetUrl)
}

export async function logout() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  revalidatePath('/', 'layout')
  redirect('/')
}

export async function resetPassword(formData: FormData) {
  const supabase = await createClient()
  const email = formData.get('email') as string

  if (!email) {
    return { error: 'Email is required' }
  }

  const origin = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin}/auth/callback?next=/reset-password`,
  })

  if (error) {
    return { error: error.message }
  }

  return { success: true }
}

export async function updatePassword(formData: FormData) {
  const supabase = await createClient()
  const password = formData.get('password') as string

  if (!password || password.length < 6) {
    return { error: 'Password must be at least 6 characters long' }
  }

  const { error } = await supabase.auth.updateUser({
    password,
  })

  if (error) {
    return { error: error.message }
  }

  return { success: true }
}
