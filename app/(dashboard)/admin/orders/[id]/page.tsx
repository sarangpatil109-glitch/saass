import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { Card } from '@/components/Card'
import { ArrowLeft, CheckCircle2, Clock, XCircle, FileText, Key, Archive, Calendar, Banknote } from 'lucide-react'
import Link from 'next/link'
import { OrderGeneratorModal } from '@/components/generator/OrderGeneratorModal'

export default async function OrderDetailsPage({ params }: { params: { id: string } }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') redirect('/unauthorized')

  const { data: order } = await supabase.from('orders').select(`
    *,
    customers (*),
    leads (*),
    products (*),
    vendors (*),
    sales_executives (*),
    licenses (*),
    generated_zips (*),
    zip_generations (*)
  `).eq('id', params.id).single()

  if (!order) redirect('/admin/orders')

  const { data: templates } = await supabase.from('product_templates').select('*')

  const customer = Array.isArray(order.customers) ? order.customers[0] : order.customers
  const lead = Array.isArray(order.leads) ? order.leads[0] : order.leads
  const product = Array.isArray(order.products) ? order.products[0] : order.products
  const vendor = Array.isArray(order.vendors) ? order.vendors[0] : order.vendors
  const exec = Array.isArray(order.sales_executives) ? order.sales_executives[0] : order.sales_executives
  const license = Array.isArray(order.licenses) ? order.licenses[0] : order.licenses
  
  // We check both zip_generations and generated_zips
  const zip = (Array.isArray(order.zip_generations) && order.zip_generations.length > 0) 
    ? order.zip_generations[0] 
    : (Array.isArray(order.generated_zips) ? order.generated_zips[0] : order.generated_zips)

  return (
    <div className="space-y-6 pb-12">
      <div>
        <Link href="/admin/orders" className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 mb-4">
          <ArrowLeft className="h-4 w-4 mr-1" /> Back to Orders
        </Link>
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">Order {order.order_number}</h1>
          <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
            order.order_status === 'Paid' ? 'bg-green-100 text-green-800' :
            order.order_status === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
            'bg-gray-100 text-gray-800'
          }`}>
            {order.order_status}
          </span>
        </div>
        
        {/* Actions */}
        <div className="mt-4 flex gap-3">
          <OrderGeneratorModal 
            order={order} 
            customers={Array.isArray(order.customers) ? order.customers : [order.customers]} 
            products={Array.isArray(order.products) ? order.products : [order.products]} 
            templates={templates || []} 
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Customer & Lead Info */}
        <Card className="p-6 bg-white dark:bg-gray-900 shadow-sm border border-gray-100 dark:border-gray-800">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Customer Details</h3>
          <div className="space-y-3 text-sm">
            <div>
              <p className="text-gray-500">Business Name</p>
              <p className="font-medium text-gray-900 dark:text-white">{customer?.business_name || 'N/A'}</p>
            </div>
            <div>
              <p className="text-gray-500">Contact</p>
              <p className="font-medium text-gray-900 dark:text-white">{customer?.customer_name || 'N/A'}</p>
            </div>
            <div>
              <p className="text-gray-500">Email</p>
              <p className="font-medium text-gray-900 dark:text-white">{customer?.email || 'N/A'}</p>
            </div>
            <div>
              <p className="text-gray-500">Phone</p>
              <p className="font-medium text-gray-900 dark:text-white">{customer?.phone || 'N/A'}</p>
            </div>
            {lead && (
              <div className="pt-3 border-t border-gray-100 dark:border-gray-800 mt-3">
                <p className="text-gray-500">Converted from Lead</p>
                <Link href={`/dashboard/leads/${lead.id}`} className="font-medium text-blue-600 hover:underline">{lead.lead_number}</Link>
              </div>
            )}
          </div>
        </Card>

        {/* Product & Payment Info */}
        <Card className="p-6 bg-white dark:bg-gray-900 shadow-sm border border-gray-100 dark:border-gray-800">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Payment Info</h3>
          <div className="space-y-3 text-sm">
            <div>
              <p className="text-gray-500">Product</p>
              <p className="font-medium text-gray-900 dark:text-white">{product?.name || 'N/A'}</p>
            </div>
            <div>
              <p className="text-gray-500">Total Amount</p>
              <p className="font-bold text-green-600 text-lg">₹{Number(order.final_amount).toLocaleString()}</p>
            </div>
            <div>
              <p className="text-gray-500">Payment Status</p>
              <span className={`inline-flex items-center mt-1 px-2 py-0.5 rounded text-xs font-medium ${
                order.payment_status === 'Success' ? 'bg-green-100 text-green-800' :
                order.payment_status === 'Failed' ? 'bg-red-100 text-red-800' :
                'bg-yellow-100 text-yellow-800'
              }`}>
                {order.payment_status}
              </span>
            </div>
            <div>
              <p className="text-gray-500">Payment Method</p>
              <p className="font-medium text-gray-900 dark:text-white">{order.payment_method || 'N/A'}</p>
            </div>
            <div>
              <p className="text-gray-500">Purchase Date</p>
              <p className="font-medium text-gray-900 dark:text-white">{new Date(order.purchase_date).toLocaleString()}</p>
            </div>
          </div>
        </Card>

        {/* Attributions & Deliverables */}
        <div className="space-y-6">
          <Card className="p-6 bg-white dark:bg-gray-900 shadow-sm border border-gray-100 dark:border-gray-800">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Attribution</h3>
            <div className="space-y-3 text-sm">
              <div>
                <p className="text-gray-500">Vendor</p>
                <p className="font-medium text-gray-900 dark:text-white">{vendor?.company_name || 'Direct Sale'}</p>
              </div>
              <div>
                <p className="text-gray-500">Sales Executive</p>
                <p className="font-medium text-gray-900 dark:text-white">{exec?.full_name || 'Direct Sale'}</p>
              </div>
            </div>
          </Card>
          
          <Card className="p-6 bg-white dark:bg-gray-900 shadow-sm border border-gray-100 dark:border-gray-800">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Deliverables</h3>
            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="flex items-center text-gray-600 dark:text-gray-300"><Key className="w-4 h-4 mr-2" /> License</span>
                <span className={`px-2 py-0.5 rounded text-xs font-medium ${license ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
                  {license ? license.status : 'Pending'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center text-gray-600 dark:text-gray-300"><Archive className="w-4 h-4 mr-2" /> ZIP Build</span>
                <span className={`px-2 py-0.5 rounded text-xs font-medium ${zip ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
                  {zip ? zip.status : 'Pending'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center text-gray-600 dark:text-gray-300"><FileText className="w-4 h-4 mr-2" /> Invoice</span>
                <span className={`px-2 py-0.5 rounded text-xs font-medium ${order.invoice_id ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-600'}`}>
                  {order.invoice_id ? 'Generated' : 'Pending'}
                </span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
