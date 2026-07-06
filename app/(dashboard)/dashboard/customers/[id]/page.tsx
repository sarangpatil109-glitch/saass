import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { Card } from '@/components/Card'
import { ArrowLeft, User, Phone, Mail, MapPin, Building, Key, Archive, ShoppingCart } from 'lucide-react'
import Link from 'next/link'

export default async function (props: { params: Promise<any> }) {
  const params = await props.params;
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: customer } = await supabase.from('customers').select(`
    *,
    orders (
      id,
      order_number,
      final_amount,
      order_status,
      created_at,
      products (name)
    ),
    product_instances (
      id,
      business_name,
      products (name),
      zip_generations (
        id,
        status,
        zip_url,
        created_at,
        completed_at,
        generator_version,
        zip_downloads (id)
      )
    )
  `).eq('id', params.id).single()

  if (!customer) redirect('/dashboard/customers')

  const orders = customer.orders || []
  const instances = customer.product_instances || []

  return (
    <div className="space-y-6 pb-12">
      <div>
        <Link href="/dashboard/customers" className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 mb-4">
          <ArrowLeft className="h-4 w-4 mr-1" /> Back to Customers
        </Link>
        <div className="flex items-center justify-between">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4"><div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">{customer.business_name || customer.customer_name}</h1>
            <p className="text-sm text-gray-500 font-mono mt-1">{customer.customer_code}</p>
          </div>
        
      </div>
          <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
            customer.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
          }`}>
            {customer.status}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Contact Info */}
        <Card className="p-6 bg-white dark:bg-gray-900 shadow-sm border border-gray-100 dark:border-gray-800">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Contact Info</h3>
          <div className="space-y-4 text-sm">
            <div className="flex items-start">
              <User className="w-5 h-5 text-gray-400 mr-3 mt-0.5" />
              <div>
                <p className="font-medium text-gray-900 dark:text-white">{customer.customer_name}</p>
                <p className="text-gray-500">Primary Contact</p>
              </div>
            </div>
            <div className="flex items-start">
              <Mail className="w-5 h-5 text-gray-400 mr-3 mt-0.5" />
              <div>
                <p className="font-medium text-gray-900 dark:text-white">{customer.email || 'N/A'}</p>
                <p className="text-gray-500">Email Address</p>
              </div>
            </div>
            <div className="flex items-start">
              <Phone className="w-5 h-5 text-gray-400 mr-3 mt-0.5" />
              <div>
                <p className="font-medium text-gray-900 dark:text-white">{customer.phone || 'N/A'}</p>
                <p className="text-gray-500">Phone / WhatsApp: {customer.whatsapp || 'N/A'}</p>
              </div>
            </div>
          </div>
        </Card>

        {/* Business Info */}
        <Card className="p-6 bg-white dark:bg-gray-900 shadow-sm border border-gray-100 dark:border-gray-800">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Business Details</h3>
          <div className="space-y-4 text-sm">
            <div className="flex items-start">
              <Building className="w-5 h-5 text-gray-400 mr-3 mt-0.5" />
              <div>
                <p className="font-medium text-gray-900 dark:text-white">{customer.business_type || 'N/A'}</p>
                <p className="text-gray-500">Business Type</p>
              </div>
            </div>
            <div className="flex items-start">
              <MapPin className="w-5 h-5 text-gray-400 mr-3 mt-0.5" />
              <div>
                <p className="font-medium text-gray-900 dark:text-white">{customer.address || 'N/A'}</p>
                <p className="text-gray-500">{customer.city}, {customer.state} {customer.country}</p>
              </div>
            </div>
            <div>
              <p className="text-gray-500 text-xs">GST Number</p>
              <p className="font-medium text-gray-900 dark:text-white">{customer.gst_number || 'N/A'}</p>
            </div>
          </div>
        </Card>

        {/* Notes */}
        <Card className="p-6 bg-white dark:bg-gray-900 shadow-sm border border-gray-100 dark:border-gray-800">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Notes</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 whitespace-pre-wrap">
            {customer.notes || 'No notes added.'}
          </p>
        </Card>
      </div>

      {/* Orders Table */}
      <Card className="overflow-hidden bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-sm mt-6">
        <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center">
            <ShoppingCart className="w-5 h-5 mr-2" /> Order History
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-gray-500 dark:text-gray-400 uppercase bg-gray-50 dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800">
              <tr>
                <th className="px-6 py-4">Order No.</th>
                <th className="px-6 py-4">Product</th>
                <th className="px-6 py-4">Amount</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {orders.length > 0 ? orders.map((order: any) => {
                const product = Array.isArray(order.products) ? order.products[0] : order.products
                return (
                  <tr key={order.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                    <td className="px-6 py-4">
                      <Link href={`/admin/orders/${order.id}`} className="font-mono text-xs text-blue-600 hover:underline">
                        {order.order_number}
                      </Link>
                    </td>
                    <td className="px-6 py-4 text-gray-700 dark:text-gray-300">{product?.name || '—'}</td>
                    <td className="px-6 py-4 font-semibold text-gray-900 dark:text-white">
                      ₹{Number(order.final_amount).toFixed(2)}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                        order.order_status === 'Paid' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {order.order_status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-xs text-gray-500">
                      {new Date(order.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                )
              }) : (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                    No orders placed yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Generated ZIPs Table */}
      <Card className="overflow-hidden bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-sm mt-6">
        <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center">
            <Archive className="w-5 h-5 mr-2" /> Generated ZIP Builds
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-gray-500 dark:text-gray-400 uppercase bg-gray-50 dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800">
              <tr>
                <th className="px-6 py-4">App Business Name</th>
                <th className="px-6 py-4">Product / Version</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Downloads</th>
                <th className="px-6 py-4">Generation Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {instances.length > 0 ? instances.map((instance: any) => {
                const zips = instance.zip_generations || [];
                if (zips.length === 0) return null;
                
                return zips.map((zip: any) => {
                  const product = Array.isArray(instance.products) ? instance.products[0] : instance.products;
                  const downloads = zip.zip_downloads?.length || 0;
                  
                  return (
                    <tr key={zip.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                      <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">
                        {instance.business_name}
                      </td>
                      <td className="px-6 py-4 text-gray-700 dark:text-gray-300">
                        {product?.name || '—'}
                        <div className="text-[10px] text-gray-400 mt-1">v{zip.generator_version}</div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                          zip.status === 'Completed' ? 'bg-green-100 text-green-800' :
                          zip.status === 'Generating' ? 'bg-blue-100 text-blue-800' :
                          zip.status === 'Failed' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                          {zip.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-semibold text-gray-900 dark:text-white">
                        {downloads}
                      </td>
                      <td className="px-6 py-4 text-xs text-gray-500">
                        {zip.completed_at ? new Date(zip.completed_at).toLocaleString() : '—'}
                      </td>
                    </tr>
                  )
                });
              }) : (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                    No ZIP builds generated yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}
