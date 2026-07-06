'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

async function checkAuth() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')
  
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  return { supabase, user, role: profile?.role }
}

export async function submitCustomerOrder(formData: FormData) {
  let uploadedFilePath: string | null = null
  const { supabase, user } = await checkAuth()

  try {
    console.log('Submitting request...')

    // Get the Sales Executive details to attach vendor_id
    const { data: exec } = await supabase.from('sales_executives').select('id, vendor_id').eq('id', user.id).single()
    if (!exec) throw new Error('Sales Executive profile not found')

    const orderNumber = 'ORD-' + Math.random().toString(36).substring(2, 10).toUpperCase()

    // Handle Payment Proof Upload
    const file = formData.get('payment_proof') as File | null
    if (!file) throw new Error('Payment proof is required')
    
    if (file.size > 10 * 1024 * 1024) {
      throw new Error('Payment proof must be less than 10MB')
    }
    
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
    if (!validTypes.includes(file.type)) {
      throw new Error('Payment proof must be JPG, PNG, WEBP, or PDF')
    }

    const fileExt = file.name.split('.').pop()
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${fileExt}`
    uploadedFilePath = `${orderNumber}/${fileName}`
    
    console.log('Uploading payment proof...')
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('payment-proofs')
      .upload(uploadedFilePath, file)
      
    if (uploadError) {
      uploadedFilePath = null
      throw new Error(`Upload failed: ${uploadError.message}`)
    }
    console.log('Upload success')

    const { data: publicUrlData } = supabase.storage.from('payment-proofs').getPublicUrl(uploadedFilePath)
    const paymentProofUrl = publicUrlData.publicUrl

    console.log('Inserting sales request...')
    const { data: insertedRequest, error } = await supabase.from('sales_requests').insert({
      customer_name: formData.get('customer_name') as string,
      customer_phone: formData.get('phone') as string,
      customer_email: formData.get('email') as string,
      product_id: formData.get('product_id') as string,
      product_price: parseFloat(formData.get('product_price') as string || '0'),
      sales_executive_id: exec.id,
      payment_proof_url: paymentProofUrl,
      status: 'Pending'
    }).select('id').single()

    if (error) {
      throw error // Real database error
    }
    console.log('Insert success')
    console.log('Returned row id', insertedRequest?.id)

    revalidatePath('/dashboard/sales/customers')
    revalidatePath('/admin/sales-requests')
    return { error: null }
  } catch (error: any) {
    console.error('Action Error:', error)
    
    // Rollback file upload if database insert failed
    if (uploadedFilePath) {
      console.log('Rolling back payment proof upload...')
      await supabase.storage.from('payment-proofs').remove([uploadedFilePath])
    }
    
    return { error: `Database Error: ${error.message || JSON.stringify(error)}` }
  }
}

export async function approveOrder(orderId: string) {
  try {
    const { supabase, user } = await checkAuth()
    
    console.log('STEP 1 reached')
    
    // Fetch request details
    const { data: request, error: reqError } = await supabase
      .from('sales_requests')
      .select('*, products(name, exec_commission_percent), sales_executives(vendor_id)')
      .eq('id', orderId)
      .single()

    if (reqError || !request) {
      console.error('STEP 1 failed: Sales Request not found', reqError)
      throw new Error(`Sales Request not found: ${reqError?.message}`)
    }

    if (request.status === 'Approved') {
      throw new Error('Sales Request is already approved')
    }

    if (!request.sales_executive_id) {
      console.error('STEP 1 failed: sales_executive_id is NULL')
      throw new Error('Cannot approve: sales_executive_id is missing in the sales request')
    }

    if (!request.sales_executives?.vendor_id) {
      console.error('STEP 1 failed: vendor_id is NULL')
      throw new Error('Cannot approve: vendor_id is missing for this sales executive')
    }

    console.log('STEP 2 creating order')

    // Find or create customer
    let customerId = null
    const { data: existingCustomer } = await supabase
      .from('customers')
      .select('id')
      .or(`phone.eq.${request.customer_phone},email.eq.${request.customer_email}`)
      .limit(1)
      .single()

    if (existingCustomer) {
      customerId = existingCustomer.id
    } else {
      const { data: newCustomer, error: custError } = await supabase
        .from('customers')
        .insert({
          customer_name: request.customer_name,
          phone: request.customer_phone,
          email: request.customer_email,
          sales_executive_id: request.sales_executive_id,
          vendor_id: request.sales_executives?.vendor_id,
          status: 'Active'
        })
        .select('id')
        .single()

      if (custError) {
        console.error('STEP 2 failed: Customer creation', custError)
        throw new Error(`Customer creation failed: ${custError.message}`)
      }
      customerId = newCustomer.id
    }

    const price = request.product_price || 0
    const execCommPct = request.products?.exec_commission_percent || 10
    const execComm = price * (execCommPct / 100)
    const vendorComm = execComm * 0.10
    const platformRev = price - execComm - vendorComm

    const newOrderNumber = 'ORD-' + new Date().toISOString().slice(0,10).replace(/-/g,'') + '-' + Math.floor(Math.random() * 1000000).toString().padStart(6, '0')

    const orderPayload = {
      order_id: newOrderNumber,
      customer_id: customerId,
      customer_name: request.customer_name,
      product_id: request.product_id,
      product_name: request.products?.name || 'Unknown',
      vendor_id: request.sales_executives?.vendor_id,
      sales_exec_id: request.sales_executive_id,
      price: price,
      payment_status: 'Paid',
      status: 'Approved'
    }

    const { data: insertedOrder, error: orderError } = await supabase
      .from('orders')
      .insert(orderPayload)
      .select('order_id')
      .single()

    if (orderError) {
      console.error('STEP 3 failed: Order insert', orderError)
      throw new Error(`Order insertion failed: ${JSON.stringify(orderError)}`)
    }

    console.log('STEP 3 order inserted')

    const commissionPayload = {
      order_id: insertedOrder.order_id,
      sales_exec_id: request.sales_executive_id,
      vendor_id: request.sales_executives?.vendor_id,
      customer_id: customerId,
      amount: execComm,
      vendor_amount: vendorComm,
      platform_amount: platformRev,
      status: 'Pending'
    }

    const { error: commError } = await supabase
      .from('commissions')
      .insert(commissionPayload)

    if (commError) {
      console.error('STEP 4 failed: Commission insert', commError)
      // Rollback order since we don't have proper transactions
      await supabase.from('orders').delete().eq('order_id', insertedOrder.order_id)
      throw new Error(`Commission insertion failed: ${JSON.stringify(commError)}`)
    }

    console.log('STEP 4 commission inserted')

    // Finally update the sales request status
    const { error: updateError } = await supabase
      .from('sales_requests')
      .update({ status: 'Approved' })
      .eq('id', orderId)

    if (updateError) {
      console.error('STEP 5 failed: Request update', updateError)
      throw new Error(`Status update failed: ${JSON.stringify(updateError)}`)
    }

    console.log('STEP 5 finished')

    // Revalidate ALL layout boundaries to ensure realtime UI updates without page refresh
    revalidatePath('/', 'layout')

    return { error: null, data: { order_id: insertedOrder.order_id } }
  } catch (error: any) {
    console.error('Action Error:', error)
    return { error: error.message || 'An error occurred' }
  }
}

export async function rejectOrder(orderId: string) {
  try {
    const { supabase } = await checkAuth()
    const { error } = await supabase.from('sales_requests').update({
      status: 'Rejected'
    }).eq('id', orderId)
    if (error) throw error
    revalidatePath('/dashboard/admin/sales-requests')
    return { error: null }
  } catch (error: any) {
    console.error('Action Error:', error)
    return { error: `Database Error: ${error.message || JSON.stringify(error)}` }
  }
}

export async function editOrder(orderId: string, formData: FormData) {
  try {
    const { supabase } = await checkAuth()
    
    const { data: request } = await supabase.from('sales_requests').select('*').eq('id', orderId).single()
    if (!request) throw new Error('Sales Request not found')

    const price = Number(formData.get('product_price')) || 0
    const newStatus = formData.get('status') as string

    const { error } = await supabase.from('sales_requests').update({
      customer_name: formData.get('customer_name') as string,
      customer_phone: formData.get('phone') as string,
      customer_email: formData.get('email') as string,
      product_price: price,
      status: newStatus === 'Approved' ? 'Pending' : newStatus // We set it to Approved via the RPC
    }).eq('id', orderId)

    if (error) throw error

    if (newStatus === 'Approved' && request.status !== 'Approved') {
      const approvalResult = await approveOrder(orderId)
      if (approvalResult.error) throw new Error(approvalResult.error)
    }

    revalidatePath('/', 'layout')
    return { error: null }
  } catch (error: any) {
    console.error('Action Error:', error)
    return { error: `Database Error: ${error.message || JSON.stringify(error)}` }
  }
}

