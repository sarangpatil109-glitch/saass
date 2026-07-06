import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { ArrowLeft, Clock, Store, MapPin, Building, CreditCard, ShoppingBag, DollarSign, Settings } from 'lucide-react'
import Link from 'next/link'
import { Card } from '@/components/Card'
import { VendorActions } from '@/components/vendors/VendorActions'

export default async function (props: { params: Promise<any> }) {
  const params = await props.params;
  const supabase = await createClient()

  // Protect route
  const { data: { user } } = await supabase.auth.getUser()
  if (process.env.DEVELOPMENT_MODE !== 'true' && !user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', (user?.id || '')).single()
  if (process.env.DEVELOPMENT_MODE !== 'true' && profile?.role !== 'admin') redirect('/unauthorized')

  const { data: vendor } = await supabase.from('vendors').select('*').eq('id', params.id).single()
  if (!vendor) redirect('/dashboard/vendors')

  const { data: logs } = await supabase.from('vendor_activity_logs').select(`
    *,
    profiles (full_name)
  `).eq('vendor_id', params.id).order('created_at', { ascending: false })



  // Fetch Assigned Products
  const { data: vendorProducts } = await supabase.from('vendor_products').select(`
    assigned_at,
    products (id, name, price, status)
  `).eq('vendor_id', params.id)

  // Fetch Sales / Commissions
  const { data: commissions } = await supabase.from('commissions').select('*').eq('vendor_id', params.id)
  
  const totalOrders = commissions?.length || 0
  const totalRevenue = commissions?.reduce((acc: number, curr: any) => acc + Number(curr.product_price), 0) || 0
  const totalCommission = commissions?.reduce((acc: number, curr: any) => acc + Number(curr.vendor_commission_amount), 0) || 0

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div>
        <Link href="/dashboard/vendors" className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 mb-4">
          <ArrowLeft className="h-4 w-4 mr-1" /> Back to Vendors
        </Link>
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-500 shadow-sm border border-gray-200 dark:border-gray-700">
              {vendor.logo_url ? <img src={vendor.logo_url} alt="" className="w-full h-full object-cover rounded-xl" /> : <Store className="h-8 w-8" />}
            </div>
            <div>
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4"><div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">{vendor.business_name}</h1>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  vendor.status === 'Active' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' :
                  vendor.status === 'Suspended' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' :
                  'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300'
                }`}>
                  {vendor.status}
                </span>
              </div>
        
      </div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Vendor ID: <span className="font-mono text-gray-900 dark:text-gray-300">{vendor.vendor_code}</span></p>
            </div>
          </div>
          
          <VendorActions vendor={vendor} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="p-6 bg-white dark:bg-gray-900 shadow-sm border border-gray-100 dark:border-gray-800">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center"><Building className="w-5 h-5 mr-2" /> Basic Details</h3>
            <div className="grid grid-cols-2 gap-y-4 gap-x-6 text-sm">
              <div>
                <p className="text-gray-500 dark:text-gray-400 mb-1">Owner Name</p>
                <p className="font-medium text-gray-900 dark:text-white">{vendor.owner_name}</p>
              </div>
              <div>
                <p className="text-gray-500 dark:text-gray-400 mb-1">GST Number</p>
                <p className="font-medium text-gray-900 dark:text-white">{vendor.gst_number || '-'}</p>
              </div>
              <div>
                <p className="text-gray-500 dark:text-gray-400 mb-1">Email Address</p>
                <p className="font-medium text-gray-900 dark:text-white">{vendor.email}</p>
              </div>
              <div>
                <p className="text-gray-500 dark:text-gray-400 mb-1">Phone Number</p>
                <p className="font-medium text-gray-900 dark:text-white">{vendor.phone}</p>
              </div>
            </div>
          </Card>

          <Card className="p-6 bg-white dark:bg-gray-900 shadow-sm border border-gray-100 dark:border-gray-800">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center"><MapPin className="w-5 h-5 mr-2" /> Location Details</h3>
            <div className="grid grid-cols-2 gap-y-4 gap-x-6 text-sm">
              <div className="col-span-2">
                <p className="text-gray-500 dark:text-gray-400 mb-1">Address</p>
                <p className="font-medium text-gray-900 dark:text-white">{vendor.address || '-'}</p>
              </div>
              <div>
                <p className="text-gray-500 dark:text-gray-400 mb-1">City</p>
                <p className="font-medium text-gray-900 dark:text-white">{vendor.city || '-'}</p>
              </div>
              <div>
                <p className="text-gray-500 dark:text-gray-400 mb-1">State</p>
                <p className="font-medium text-gray-900 dark:text-white">{vendor.state || '-'}</p>
              </div>
              <div>
                <p className="text-gray-500 dark:text-gray-400 mb-1">PIN Code</p>
                <p className="font-medium text-gray-900 dark:text-white">{vendor.pin_code || '-'}</p>
              </div>
              <div>
                <p className="text-gray-500 dark:text-gray-400 mb-1">Country</p>
                <p className="font-medium text-gray-900 dark:text-white">{vendor.country || '-'}</p>
              </div>
            </div>
          </Card>

          <Card className="p-6 bg-white dark:bg-gray-900 shadow-sm border border-gray-100 dark:border-gray-800">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center"><CreditCard className="w-5 h-5 mr-2" /> Bank Details</h3>
            <div className="grid grid-cols-2 gap-y-4 gap-x-6 text-sm">
              <div>
                <p className="text-gray-500 dark:text-gray-400 mb-1">Bank Name</p>
                <p className="font-medium text-gray-900 dark:text-white">{vendor.bank_name || '-'}</p>
              </div>
              <div>
                <p className="text-gray-500 dark:text-gray-400 mb-1">Account Number</p>
                <p className="font-medium text-gray-900 dark:text-white">{vendor.account_number || '-'}</p>
              </div>
              <div>
                <p className="text-gray-500 dark:text-gray-400 mb-1">IFSC Code</p>
                <p className="font-medium text-gray-900 dark:text-white">{vendor.ifsc_code || '-'}</p>
              </div>
              <div>
                <p className="text-gray-500 dark:text-gray-400 mb-1">UPI ID</p>
                <p className="font-medium text-gray-900 dark:text-white">{vendor.upi_id || '-'}</p>
              </div>
            </div>
          </Card>

          <Card className="p-6 bg-white dark:bg-gray-900 shadow-sm border border-gray-100 dark:border-gray-800">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center"><ShoppingBag className="w-5 h-5 mr-2" /> Assigned Products</h3>
            <div className="space-y-4">
              {vendorProducts && vendorProducts.length > 0 ? vendorProducts.map((vp: any) => {
                const product = Array.isArray(vp.products) ? vp.products[0] : vp.products;
                if (!product) return null;
                return (
                  <div key={product.id} className="flex justify-between items-center pb-4 border-b border-gray-50 dark:border-gray-800 last:border-0 last:pb-0">
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">{product.name}</p>
                      <p className="text-gray-500 dark:text-gray-400 text-xs mt-0.5">Assigned: {new Date(vp.assigned_at).toLocaleDateString()}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">₹{product.price}</p>
                      <span className="text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded">{product.status}</span>
                    </div>
                  </div>
                )
              }) : (
                <p className="text-sm text-gray-500 py-2">No products assigned to this vendor.</p>
              )}
            </div>
          </Card>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          
          <Card className="p-6 bg-white dark:bg-gray-900 shadow-sm border border-gray-100 dark:border-gray-800">
            <h3 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider mb-4 flex items-center"><DollarSign className="w-4 h-4 mr-2" /> Sales Statistics</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 text-center">
                <span className="block font-medium text-sm text-gray-500 dark:text-gray-400 mb-1">Orders</span>
                <span className="block text-xl font-bold text-gray-900 dark:text-white">{totalOrders}</span>
              </div>
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 text-center">
                <span className="block font-medium text-sm text-gray-500 dark:text-gray-400 mb-1">Revenue</span>
                <span className="block text-xl font-bold text-gray-900 dark:text-white">₹{totalRevenue}</span>
              </div>
              <div className="col-span-2 bg-blue-50 dark:bg-blue-900/30 rounded-lg p-3 text-center border border-blue-100 dark:border-blue-800">
                <span className="block font-medium text-sm text-blue-600 dark:text-blue-400 mb-1">Total Commission Earned</span>
                <span className="block text-xl font-bold text-blue-700 dark:text-blue-300">₹{totalCommission}</span>
              </div>
            </div>
          </Card>

          <Card className="p-6 bg-white dark:bg-gray-900 shadow-sm border border-gray-100 dark:border-gray-800">
            <h3 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider mb-4 flex items-center"><Settings className="w-4 h-4 mr-2" /> Commission Settings</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-500">Type</span>
                <span className="font-medium capitalize">{vendor.commission_type || 'Percentage'}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-500">Value</span>
                <span className="font-medium">{vendor.commission_type === 'fixed' ? '₹' : ''}{vendor.commission_value || '0'}{vendor.commission_type === 'percentage' ? '%' : ''}</span>
              </div>
            </div>
          </Card>



          <Card className="p-6 bg-white dark:bg-gray-900 shadow-sm border border-gray-100 dark:border-gray-800">
            <h3 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider mb-4 flex items-center"><Clock className="w-4 h-4 mr-2" /> Activity Log</h3>
            <div className="space-y-4">
              {logs && logs.length > 0 ? logs.map((log: any) => {
                const profile = Array.isArray(log.profiles) ? log.profiles[0] : log.profiles;
                return (
                  <div key={log.id} className="text-sm pb-4 border-b border-gray-50 dark:border-gray-800 last:border-0 last:pb-0">
                    <p className="font-medium text-gray-900 dark:text-white">{log.action}</p>
                    <p className="text-gray-500 dark:text-gray-400 text-xs mt-0.5">{log.details}</p>
                    <div className="flex justify-between text-xs text-gray-400 mt-2">
                      <span>{(profile as any)?.full_name || 'System'}</span>
                      <span>{new Date(log.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                )
              }) : (
                <p className="text-sm text-gray-500 text-center py-4">No activity recorded.</p>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
