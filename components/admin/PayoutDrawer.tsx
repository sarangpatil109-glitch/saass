'use client'

import { useState } from 'react'
import { Card } from '@/components/Card'
import { Button } from '@/components/Button'
import { Input } from '@/components/Input'
import { X, CheckCircle2, Loader2, Download, ExternalLink } from 'lucide-react'
import { processPayout } from '@/app/actions/payouts'

import { useRouter } from 'next/navigation'

export function PayoutDrawer({ payee, onClose }: { payee: any, onClose: () => void }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [paymentAmount, setPaymentAmount] = useState(payee.totalPending.toString())

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setLoading(true)
    const formData = new FormData(e.currentTarget)
    formData.append('payee_type', payee.type)
    formData.append('payee_id', payee.id)
    
    const res = await processPayout(formData)
    
    if (res.error) {
      setError(res.error)
      setLoading(false)
    } else {
      setSuccess('Payment processed successfully!')
      router.refresh() // Force client refresh
      setTimeout(() => {
        onClose()
      }, 1500)
    }
  }

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm z-40" onClick={onClose} />
      
      {/* Drawer */}
      <div className="fixed inset-y-0 right-0 w-full max-w-xl bg-white dark:bg-gray-950 shadow-2xl z-50 flex flex-col border-l border-gray-200 dark:border-gray-800 animate-in slide-in-from-right duration-300">
        <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/50">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Process Payment</h2>
            <p className="text-sm text-gray-500 mt-1">Paying {payee.name}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors text-gray-500">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {error && (
            <div className="p-4 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg text-sm font-medium">
              {error}
            </div>
          )}
          {success && (
            <div className="p-4 bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-lg text-sm font-medium flex items-center">
              <CheckCircle2 className="w-5 h-5 mr-2" /> {success}
            </div>
          )}

          {/* Payee Details */}
          <Card className="p-5 border border-gray-100 dark:border-gray-800 shadow-sm bg-white dark:bg-gray-900">
            <h3 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider mb-4 border-b border-gray-100 dark:border-gray-800 pb-2">Payee Information</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-500">ID / Code</p>
                <p className="font-medium text-gray-900 dark:text-white font-mono mt-0.5">{payee.code}</p>
              </div>
              <div>
                <p className="text-gray-500">Phone</p>
                <p className="font-medium text-gray-900 dark:text-white mt-0.5">{payee.phone || 'N/A'}</p>
              </div>
              {payee.type === 'sales_executive' && (
                <div className="col-span-2">
                  <p className="text-gray-500">Associated Vendor</p>
                  <p className="font-medium text-gray-900 dark:text-white mt-0.5">{payee.vendor}</p>
                </div>
              )}
            </div>
          </Card>

          {/* Payment Details (From Profile) */}
          <Card className="p-5 border border-gray-100 dark:border-gray-800 shadow-sm bg-blue-50/50 dark:bg-blue-900/10">
            <h3 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider mb-4 border-b border-gray-100 dark:border-gray-800 pb-2">Bank / UPI Details</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-500">Account Holder</p>
                <p className="font-medium text-gray-900 dark:text-white mt-0.5">{payee.paymentDetails.account_holder_name || 'Not provided'}</p>
              </div>
              <div>
                <p className="text-gray-500">Bank Name</p>
                <p className="font-medium text-gray-900 dark:text-white mt-0.5">{payee.paymentDetails.bank_name || 'Not provided'}</p>
              </div>
              <div>
                <p className="text-gray-500">Account Number</p>
                <p className="font-medium text-gray-900 dark:text-white mt-0.5 font-mono">
                  {payee.paymentDetails.account_number 
                    ? `••••${payee.paymentDetails.account_number.slice(-4)}`
                    : 'Not provided'}
                </p>
              </div>
              <div>
                <p className="text-gray-500">IFSC Code</p>
                <p className="font-medium text-gray-900 dark:text-white mt-0.5 font-mono">{payee.paymentDetails.ifsc_code || 'Not provided'}</p>
              </div>
              <div className="col-span-2">
                <p className="text-gray-500">UPI ID</p>
                <p className="font-medium text-gray-900 dark:text-white mt-0.5 font-mono">{payee.paymentDetails.upi_id || 'Not provided'}</p>
              </div>
              {payee.paymentDetails.upi_qr_url && (
                <div className="col-span-2 mt-2">
                  <p className="text-gray-500 mb-2">QR Code</p>
                  <div className="flex items-start gap-4">
                    <img src={payee.paymentDetails.upi_qr_url} alt="UPI QR" className="w-24 h-24 object-cover border border-gray-200 rounded-lg shadow-sm" />
                    <div className="flex flex-col gap-2">
                      <a href={payee.paymentDetails.upi_qr_url} target="_blank" rel="noreferrer" className="inline-flex items-center text-xs font-medium text-blue-600 hover:text-blue-700">
                        <ExternalLink className="w-3 h-3 mr-1" /> Open Full QR
                      </a>
                      <a href={payee.paymentDetails.upi_qr_url} download className="inline-flex items-center text-xs font-medium text-gray-600 hover:text-gray-900">
                        <Download className="w-3 h-3 mr-1" /> Download
                      </a>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </Card>

          <form id="payout-form" onSubmit={handleSubmit} className="space-y-6">
            <Card className="p-5 border border-gray-100 dark:border-gray-800 shadow-sm bg-white dark:bg-gray-900">
              <h3 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider mb-4 border-b border-gray-100 dark:border-gray-800 pb-2">Commission Ledger</h3>
              
              <div className="space-y-3 text-sm">
                <div className="flex justify-between items-center text-gray-600 dark:text-gray-400">
                  <span>Yesterday's Commission</span>
                  <span>₹{payee.yesterdayCommission.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between items-center text-gray-600 dark:text-gray-400">
                  <span>Total Earned (Lifetime)</span>
                  <span>₹{payee.totalEarned.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between items-center text-gray-600 dark:text-gray-400">
                  <span>Already Paid</span>
                  <span>₹{payee.totalPaid.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between items-center font-bold text-gray-900 dark:text-white pt-2 border-t border-gray-100 dark:border-gray-800">
                  <span>Remaining Pending</span>
                  <span className="text-orange-600 dark:text-orange-400">₹{payee.totalPending.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                </div>
              </div>

              <div className="mt-6">
                <label className="block text-sm font-bold text-gray-900 dark:text-white mb-2">Today's Payment Amount (₹)</label>
                <Input 
                  name="amount"
                  type="number" 
                  step="0.01" 
                  max={payee.totalPending} 
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  className="text-lg font-bold"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">You can do a partial payment. Remaining will automatically be carried forward.</p>
              </div>
            </Card>

            <Card className="p-5 border border-gray-100 dark:border-gray-800 shadow-sm bg-white dark:bg-gray-900">
              <h3 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider mb-4 border-b border-gray-100 dark:border-gray-800 pb-2">Payment Details</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Payment Mode *</label>
                  <select name="payment_mode" required className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-gray-900 dark:text-white">
                    <option value="UPI">UPI (GPay / PhonePe / BHIM)</option>
                    <option value="Bank Transfer">Bank Transfer (IMPS / NEFT / RTGS)</option>
                    <option value="Cash">Cash</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Transaction Reference Number *</label>
                  <Input name="payment_reference" placeholder="e.g. UTR / UPI Ref No." required />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Admin Remarks (Optional)</label>
                  <textarea name="admin_notes" rows={2} className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-gray-900 dark:text-white" placeholder="Any internal notes..."></textarea>
                </div>
              </div>
            </Card>
          </form>
        </div>

        <div className="p-6 border-t border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/50 flex gap-3 justify-end">
          <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button type="submit" form="payout-form" disabled={loading} className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm border-0 min-w-[120px]">
            {loading ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Mark as Paid'}
          </Button>
        </div>
      </div>
    </>
  )
}
