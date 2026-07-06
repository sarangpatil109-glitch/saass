'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import crypto from 'crypto'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { redirect } from 'next/navigation'

export async function registerSalesExecutive(state: any, formData: FormData): Promise<{ error?: string; success?: boolean }> {
  const supabase = await createClient()

  const firstName = formData.get('first_name') as string
  const lastName = formData.get('last_name') as string
  const email = formData.get('email') as string
  const phone = formData.get('phone') as string
  const vendorName = formData.get('vendor_name') as string
  const password = formData.get('password') as string
  const confirmPassword = formData.get('confirm_password') as string
  if (!firstName || !lastName || !email || !phone || !vendorName || !password) {
    return { error: 'All fields are required.' }
  }

  if (password !== confirmPassword) {
    return { error: 'Passwords do not match.' }
  }

  const supabaseAdmin = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Create User via Admin API to bypass rate limits and email verification
  const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      first_name: firstName,
      last_name: lastName,
    }
  })

  if (authError) {
    return { error: authError.message }
  }

  if (!authData.user) {
    return { error: 'Failed to create user account.' }
  }

  const userId = authData.user.id

  // Create Profile
  const { error: profileError } = await supabaseAdmin.from('profiles').upsert({
    id: userId,
    email: email,
    full_name: `${firstName} ${lastName}`,
    role: 'sales_executive'
  })

  if (profileError) {
    return { error: 'Failed to create user profile.' }
  }

  // Generate a unique employee code
  const { count } = await supabaseAdmin.from('sales_executives').select('*', { count: 'exact', head: true })
  const nextNum = (count || 0) + 1
  const employeeCode = `SE-${nextNum.toString().padStart(6, '0')}`

  // Create Sales Executive Record
  const { error: salesExecError } = await supabaseAdmin.from('sales_executives').insert({
    id: userId,
    employee_code: employeeCode,
    vendor_id: null,
    vendor_name: vendorName,
    first_name: firstName,
    last_name: lastName,
    full_name: [firstName, lastName].filter(Boolean).join(' ').trim(),
    email: email,
    phone: phone,
    designation: 'Sales Executive',
    commission_percentage: 10, // default
    status: 'pending'
  })

  if (salesExecError) {
    return { error: `Database Error: ${salesExecError.message || JSON.stringify(salesExecError)}` }
  }

  // Sign the user in to establish the session
  const { error: signInError } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (signInError) {
    return { error: 'Account created but failed to sign in automatically: ' + signInError.message }
  }

  redirect('/sales/dashboard')
}
