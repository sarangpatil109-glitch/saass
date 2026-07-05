'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import crypto from 'crypto'

export async function registerSalesExecutive(state: any, formData: FormData) {
  const supabase = await createClient()

  const firstName = formData.get('first_name') as string
  const lastName = formData.get('last_name') as string
  const email = formData.get('email') as string
  const phone = formData.get('phone') as string
  const password = formData.get('password') as string
  const confirmPassword = formData.get('confirm_password') as string
  const couponCode = formData.get('coupon_code') as string

  if (!firstName || !lastName || !email || !phone || !password || !couponCode) {
    return { error: 'All fields are required.' }
  }

  if (password !== confirmPassword) {
    return { error: 'Passwords do not match.' }
  }

  // Verify Coupon Code
  const { data: vendor, error: vendorError } = await supabase
    .from('vendors')
    .select('id, status')
    .eq('coupon_code', couponCode)
    .single()

  if (vendorError || !vendor) {
    return { error: 'Invalid coupon code.' }
  }

  if (vendor.status !== 'Active') {
    return { error: 'This vendor account is not active.' }
  }

  // Create User in Supabase Auth
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        first_name: firstName,
        last_name: lastName,
      }
    }
  })

  if (authError) {
    return { error: authError.message }
  }

  if (!authData.user) {
    return { error: 'Failed to create user account.' }
  }

  const userId = authData.user.id

  // Create Profile with pending status
  const { error: profileError } = await supabase.from('profiles').upsert({
    id: userId,
    full_name: `${firstName} ${lastName}`,
    role: 'sales_executive',
    status: 'pending_approval'
  })

  if (profileError) {
    return { error: 'Failed to create user profile.' }
  }

  // Generate a unique employee code
  const employeeCode = `EMP${crypto.randomBytes(4).toString('hex').toUpperCase()}`

  // Create Sales Executive Record
  const { error: salesExecError } = await supabase.from('sales_executives').insert({
    id: userId,
    employee_code: employeeCode,
    vendor_id: vendor.id,
    first_name: firstName,
    last_name: lastName,
    full_name: `${firstName} ${lastName}`,
    email: email,
    phone: phone,
    designation: 'Sales Executive',
    commission_percentage: 10, // default
    status: 'Pending Approval'
  })

  if (salesExecError) {
    return { error: 'Failed to create sales executive record.' }
  }

  return { success: true }
}
