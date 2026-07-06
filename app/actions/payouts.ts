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

export async function processPayout(formData: FormData) {
  try {
    const { supabase, user } = await checkAdmin()

    const payeeType = formData.get('payee_type') as string // 'sales_executive' or 'vendor'
    const payeeId = formData.get('payee_id') as string // the UUID
    const amountStr = formData.get('amount') as string
    const amount = parseFloat(amountStr)
    const paymentMode = formData.get('payment_mode') as string
    const paymentReference = formData.get('payment_reference') as string
    const adminNotes = formData.get('admin_notes') as string

    if (!payeeType || !payeeId || isNaN(amount) || amount <= 0) {
      throw new Error('Invalid payout details')
    }

    // 1. Insert into commission_payments (Lump sum payment log)
    const paymentRecord = {
      sales_exec_id: payeeType === 'sales_executive' ? payeeId : null,
      vendor_id: payeeType === 'vendor' ? payeeId : null,
      payee_type: payeeType,
      amount: amount,
      payment_mode: paymentMode,
      payment_reference: paymentReference,
      admin_notes: adminNotes,
      status: 'Paid',
      created_by: user.id
    }

    const { data: payment, error: paymentError } = await supabase.from('commission_payments').insert(paymentRecord).select().single()
    if (paymentError) throw paymentError

    // 2. Fetch pending commissions for this payee (FIFO allocation)
    // We order by created_at ascending to pay off the oldest first.
    let pendingCommissions;
    
    if (payeeType === 'sales_executive') {
      const { data } = await supabase.from('commissions')
        .select('*')
        .eq('sales_exec_id', payeeId)
        .in('status', ['Pending', 'Partial'])
        .order('created_at', { ascending: true })
      pendingCommissions = data;
    } else {
      const { data } = await supabase.from('commissions')
        .select('*')
        .eq('vendor_id', payeeId)
        .in('status', ['Pending', 'Partial'])
        .order('created_at', { ascending: true })
      pendingCommissions = data;
    }

    if (!pendingCommissions) pendingCommissions = [];

    let remainingToAllocate = amount;

    // 3. FIFO Allocation
    for (const comm of pendingCommissions) {
      if (remainingToAllocate <= 0) break;

      const totalOwed = payeeType === 'sales_executive' ? Number(comm.amount) : Number(comm.vendor_amount)
      const alreadyPaid = payeeType === 'sales_executive' ? Number(comm.exec_amount_paid || 0) : Number(comm.vendor_amount_paid || 0)
      const stillOwed = totalOwed - alreadyPaid

      if (stillOwed > 0) {
        const amountToPayThisComm = Math.min(stillOwed, remainingToAllocate)
        remainingToAllocate -= amountToPayThisComm
        
        const newPaid = alreadyPaid + amountToPayThisComm
        
        // Determine if this commission is now fully paid for THIS payee
        // Note: A single commission row represents both Exec and Vendor. 
        // We only update the status if BOTH are paid? 
        // Actually, since we only have ONE status column in this schema, if we set it to Paid, it might break the other party's pending status!
        // To be safe and since we don't have separate status columns, we rely purely on (amount - exec_amount_paid) for math.
        // We will only set status = 'Paid' if BOTH are fully paid.
        
        const execOwed = Number(comm.amount) - (payeeType === 'sales_executive' ? newPaid : Number(comm.exec_amount_paid || 0));
        const vendOwed = Number(comm.vendor_amount) - (payeeType === 'vendor' ? newPaid : Number(comm.vendor_amount_paid || 0));
        
        let newStatus = 'Partial';
        if (execOwed <= 0 && vendOwed <= 0) {
          newStatus = 'Paid';
        }

        const updateData: any = { status: newStatus }
        if (payeeType === 'sales_executive') {
          updateData.exec_amount_paid = newPaid;
        } else {
          updateData.vendor_amount_paid = newPaid;
        }

        await supabase.from('commissions').update(updateData).eq('id', comm.id)
      }
    }

    revalidatePath('/admin/commission-payouts')
    revalidatePath('/admin/commission-payouts/history')
    revalidatePath('/sales/dashboard')
    revalidatePath('/vendor/dashboard')
    revalidatePath('/sales/commission')
    revalidatePath('/vendor/commission')
    revalidatePath('/', 'layout')

    return { error: null }
  } catch (error: any) {
    console.error('Payout error:', error)
    return { error: error.message || 'Failed to process payout' }
  }
}
