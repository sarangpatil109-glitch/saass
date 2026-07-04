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

async function getOrCreateWallet(supabase: any, userType: string, userId: string) {
  const { data: wallet } = await supabase.from('commission_wallets').select('*').eq('user_type', userType).eq('user_id', userId).single()
  if (wallet) return wallet

  const { data: newWallet } = await supabase.from('commission_wallets').insert({
    user_type: userType,
    user_id: userId
  }).select().single()
  
  return newWallet
}

async function logActivity(supabase: any, action: string, details: string, commissionId: string | null, userId: string | null) {
  await supabase.from('commission_activity_logs').insert({
    action,
    details,
    commission_id: commissionId,
    performed_by: userId
  })
}

// ---------------------------------
// SETTINGS
// ---------------------------------
export async function updateCommissionSettings(formData: FormData) {
  try {
    const { supabase, user } = await checkAdmin()
    
    const settings = {
      sales_commission_percentage: formData.get('sales_commission_percentage'),
      vendor_commission_percentage: formData.get('vendor_commission_percentage'),
      effective_from: formData.get('effective_from')
    }

    const { error } = await supabase.from('commission_settings').insert(settings)
    if (error) throw error

    await logActivity(supabase, 'Settings Changed', `Sales Exec: ${settings.sales_commission_percentage}%, Vendor: ${settings.vendor_commission_percentage}%`, null, user.id)

    revalidatePath('/dashboard/admin/commission/settings')
    return { error: null }
  } catch (error: any) {
    return { error: error.message }
  }
}

// ---------------------------------
// ENGINE CORE
// ---------------------------------

// Call this AFTER Cashfree payment verification -> Order Creation
export async function createCommissionFromOrder(orderData: { order_id: string, payment_id: string, customer_id: string, product_id: string, product_price: number, sales_executive_id: string, vendor_id: string }) {
  const supabase = await createClient()
  
  // Get active settings
  const { data: settings } = await supabase.from('commission_settings').select('*').lte('effective_from', new Date().toISOString()).order('effective_from', { ascending: false }).limit(1).single()
  
  if (!settings) throw new Error('Commission settings not found')

  const salesPercent = parseFloat(settings.sales_commission_percentage)
  const vendorPercent = parseFloat(settings.vendor_commission_percentage)
  
  const salesCommAmount = (orderData.product_price * salesPercent) / 100
  // RULE: Vendor gets % OF Sales Executive Commission, NOT Product Price
  const vendorCommAmount = (salesCommAmount * vendorPercent) / 100

  const comm = {
    order_id: orderData.order_id,
    payment_id: orderData.payment_id,
    customer_id: orderData.customer_id,
    product_id: orderData.product_id,
    product_price: orderData.product_price,
    sales_executive_id: orderData.sales_executive_id,
    vendor_id: orderData.vendor_id,
    sales_percentage: salesPercent,
    sales_commission: salesCommAmount,
    vendor_percentage: vendorPercent,
    vendor_commission: vendorCommAmount,
    status: 'Pending'
  }

  const { data, error } = await supabase.from('commissions').insert(comm).select().single()
  if (error) throw error

  // Log
  await logActivity(supabase, 'Commission Created', `Commission generated for Order ${orderData.order_id}`, data.id, null)

  // Add to Pending Balances
  const execWallet = await getOrCreateWallet(supabase, 'Sales Executive', orderData.sales_executive_id)
  await supabase.from('commission_wallets').update({ pending_balance: execWallet.pending_balance + salesCommAmount }).eq('id', execWallet.id)

  const vendorWallet = await getOrCreateWallet(supabase, 'Vendor', orderData.vendor_id)
  await supabase.from('commission_wallets').update({ pending_balance: vendorWallet.pending_balance + vendorCommAmount }).eq('id', vendorWallet.id)

  return data
}

// ---------------------------------
// APPROVAL WORKFLOW
// ---------------------------------
export async function updateCommissionStatus(commissionId: string, status: string, reason?: string) {
  try {
    const { supabase, user } = await checkAdmin()
    
    const { data: comm } = await supabase.from('commissions').select('*').eq('id', commissionId).single()
    if (!comm) throw new Error('Commission not found')
    if (comm.status === status) return { error: null }
    if (comm.status === 'Paid' || comm.status === 'Reversed') throw new Error('Cannot modify a terminal status directly this way.')

    // Update Status
    const { error } = await supabase.from('commissions').update({ status }).eq('id', commissionId)
    if (error) throw error

    // Fetch Wallets
    const execWallet = await getOrCreateWallet(supabase, 'Sales Executive', comm.sales_executive_id)
    const vendorWallet = await getOrCreateWallet(supabase, 'Vendor', comm.vendor_id)

    // Reverse Pending balance if we are moving OUT of Pending
    if (comm.status === 'Pending') {
      await supabase.from('commission_wallets').update({ pending_balance: execWallet.pending_balance - comm.sales_commission }).eq('id', execWallet.id)
      await supabase.from('commission_wallets').update({ pending_balance: vendorWallet.pending_balance - comm.vendor_commission }).eq('id', vendorWallet.id)
    }

    if (status === 'Approved') {
       // Move to Available Balance & Write Ledger
       const newExecBalance = execWallet.available_balance + comm.sales_commission
       await supabase.from('commission_wallets').update({ 
         available_balance: newExecBalance,
         lifetime_earnings: execWallet.lifetime_earnings + comm.sales_commission
       }).eq('id', execWallet.id)

       const newVendorBalance = vendorWallet.available_balance + comm.vendor_commission
       await supabase.from('commission_wallets').update({ 
         available_balance: newVendorBalance,
         lifetime_earnings: vendorWallet.lifetime_earnings + comm.vendor_commission
       }).eq('id', vendorWallet.id)

       // Insert Ledger (Immutable)
       await supabase.from('commission_ledger').insert([
         { wallet_id: execWallet.id, commission_id: comm.id, transaction_type: 'Credit', amount: comm.sales_commission, balance_after: newExecBalance, remarks: `Commission Approved for Order ${comm.order_id}`, status: 'Completed' },
         { wallet_id: vendorWallet.id, commission_id: comm.id, transaction_type: 'Credit', amount: comm.vendor_commission, balance_after: newVendorBalance, remarks: `Commission Approved for Order ${comm.order_id}`, status: 'Completed' }
       ])
    }

    await logActivity(supabase, status, reason ? `Status changed to ${status}: ${reason}` : `Status changed to ${status}`, comm.id, user.id)

    revalidatePath('/dashboard/admin/commission')
    return { error: null }
  } catch (error: any) {
    return { error: error.message }
  }
}

// ---------------------------------
// PAYOUTS
// ---------------------------------
export async function createPayout(formData: FormData) {
  try {
    const { supabase, user } = await checkAdmin()
    
    const walletId = formData.get('wallet_id') as string
    const amount = parseFloat(formData.get('amount') as string)
    const method = formData.get('method') as string
    const reference_number = formData.get('reference_number') as string
    const upi = formData.get('upi') as string
    const bank_name = formData.get('bank_name') as string
    const account_number = formData.get('account_number') as string

    if (amount <= 0) throw new Error('Payout amount must be greater than zero')

    const { data: wallet } = await supabase.from('commission_wallets').select('*').eq('id', walletId).single()
    if (wallet.available_balance < amount) throw new Error('Insufficient available balance')

    // Create Payout Record
    const { data: payout, error } = await supabase.from('commission_payouts').insert({
      wallet_id: walletId, amount, method, reference_number, upi, bank_name, account_number, status: 'Paid', paid_at: new Date().toISOString()
    }).select().single()
    if (error) throw error

    // Update Wallet Balances
    const newBalance = wallet.available_balance - amount
    await supabase.from('commission_wallets').update({
      available_balance: newBalance,
      paid_balance: wallet.paid_balance + amount
    }).eq('id', walletId)

    // Insert Ledger (Debit)
    await supabase.from('commission_ledger').insert({ 
      wallet_id: walletId, transaction_type: 'Debit', amount: -amount, balance_after: newBalance, remarks: `Payout ${payout.id} via ${method}`, status: 'Completed' 
    })

    await logActivity(supabase, 'Paid', `Payout of ${amount} processed via ${method}`, null, user.id)

    revalidatePath('/dashboard/admin/commission/payouts')
    return { error: null }
  } catch (error: any) {
    return { error: error.message }
  }
}

// ---------------------------------
// ADJUSTMENTS
// ---------------------------------
export async function addAdjustment(formData: FormData) {
  try {
    const { supabase, user } = await checkAdmin()
    
    const walletId = formData.get('wallet_id') as string
    const amount = parseFloat(formData.get('amount') as string)
    const remarks = formData.get('remarks') as string

    if (amount === 0) throw new Error('Adjustment amount cannot be zero')

    const { data: wallet } = await supabase.from('commission_wallets').select('*').eq('id', walletId).single()
    
    // Update Wallet Balances
    const newBalance = wallet.available_balance + amount
    await supabase.from('commission_wallets').update({
      available_balance: newBalance
    }).eq('id', walletId)

    // Insert Ledger (Adjustment)
    await supabase.from('commission_ledger').insert({ 
      wallet_id: walletId, transaction_type: 'Adjustment', amount: amount, balance_after: newBalance, remarks: `Manual Adjustment: ${remarks}`, status: 'Completed' 
    })

    await logActivity(supabase, 'Adjustment Added', `Manual adjustment of ${amount}. Reason: ${remarks}`, null, user.id)

    revalidatePath('/dashboard/admin/commission')
    return { error: null }
  } catch (error: any) {
    return { error: error.message }
  }
}
