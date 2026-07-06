import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { Card } from '@/components/Card'
import { ArrowLeft, CheckCircle2, Clock, XCircle, FileText, Key, Archive, Calendar, Banknote } from 'lucide-react'
import Link from 'next/link'

export default async function (props: { params: Promise<any> }) {
  const params = await props.params;
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') redirect('/unauthorized')

  const { data: order } = await supabase.from('orders').select(`
    *,
    products (*),
    sales_executives (*),
    sales_requests (*)
  `).eq('id', params.id).single()

  if (!order) redirect('/admin/orders')

  const product = Array.isArray(order.products) ? order.products[0] : order.products
  const exec = Array.isArray(order.sales_executives) ? order.sales_executives[0] : order.sales_executives
  const request = Array.isArray(order.sales_requests) ? order.sales_requests[0] : order.sales_requests

  return (
    <div className="space-y-6 pb-12">
      <div>
        <Link href="/admin/orders" className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 mb-4">
          <ArrowLeft className="h-4 w-4 mr-1" /> Back to Orders
        </Link>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4"><div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">Order {order.order_number}</h1>
          <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
            order.status === 'Approved' ? 'bg-green-100 text-green-800' :
            order.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
            'bg-gray-100 text-gray-800'
          }`}>
            {order.status}
          </span>
        </div>
        
      </div>
        
        {/* Actions - Removed Generator due to simplified schema */}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Customer Info */}
        <Card className="p-6 bg-white dark:bg-gray-900 shadow-sm border border-gray-100 dark:border-gray-800">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Customer Details</h3>
          <div className="space-y-3 text-sm">
            <div>
              <p className="text-gray-500">Contact</p>
              <p className="font-medium text-gray-900 dark:text-white">{order.customer_name || 'N/A'}</p>
            </div>
            <div>
              <p className="text-gray-500">Email</p>
              <p className="font-medium text-gray-900 dark:text-white">{order.customer_email || 'N/A'}</p>
            </div>
            <div>
              <p className="text-gray-500">Phone</p>
              <p className="font-medium text-gray-900 dark:text-white">{order.customer_phone || 'N/A'}</p>
            </div>
          </div>
        </Card>

        {/* Product Info */}
        <Card className="p-6 bg-white dark:bg-gray-900 shadow-sm border border-gray-100 dark:border-gray-800">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Payment Info</h3>
          <div className="space-y-3 text-sm">
            <div>
              <p className="text-gray-500">Product</p>
              <p className="font-medium text-gray-900 dark:text-white">{order.product_name || 'N/A'}</p>
            </div>
            <div>
              <p className="text-gray-500">Total Amount</p>
              <p className="font-bold text-green-600 text-lg">₹{Number(order.product_price).toLocaleString()}</p>
            </div>
            <div>
              <p className="text-gray-500">Payment Proof</p>
              {order.payment_proof_url ? (
                <a href={order.payment_proof_url} target="_blank" rel="noopener noreferrer" className="font-medium text-blue-600 hover:underline">
                  View Proof
                </a>
              ) : (
                <p className="font-medium text-gray-500">N/A</p>
              )}
            </div>
            <div>
              <p className="text-gray-500">Purchase Date</p>
              <p className="font-medium text-gray-900 dark:text-white">{new Date(order.created_at).toLocaleString()}</p>
            </div>
          </div>
        </Card>

        {/* Attributions */}
        <div className="space-y-6">
          <Card className="p-6 bg-white dark:bg-gray-900 shadow-sm border border-gray-100 dark:border-gray-800">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Attribution</h3>
            <div className="space-y-3 text-sm">
              <div>
                <p className="text-gray-500">Sales Executive</p>
                <p className="font-medium text-gray-900 dark:text-white">{exec?.full_name || 'Direct Sale'}</p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
