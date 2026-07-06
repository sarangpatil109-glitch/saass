import { createClient } from '@/utils/supabase/server'
import { Card } from '@/components/Card'
import { PlusCircle, Search, Filter, Store, Mail, Phone, ChevronLeft, ChevronRight } from 'lucide-react'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { DateRangeFilter } from '@/components/shared/date-range-filter'
import { applyDateFilter } from '@/lib/date-filter'
import { Button } from '@/components/Button'

export default async function (props: { searchParams: Promise<any> }) {
  const searchParams = await props.searchParams;
  const supabase = await createClient()

  // Protect route
  const { data: { user } } = await supabase.auth.getUser()
  if (process.env.DEVELOPMENT_MODE !== 'true' && !user) redirect('/login')

  const query = searchParams?.q || ''
  const statusFilter = searchParams?.status || ''
  const cityFilter = searchParams?.city || ''
  const sort = searchParams?.sort || 'newest'
  const page = parseInt(searchParams?.page || '1')
  const pageSize = 10
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  // Get distinct cities for filter
  const { data: cityData } = await supabase.from('vendors').select('city').is('deleted_at', null)
  const distinctCities = Array.from(new Set(cityData?.map(c => c.city).filter(Boolean)))

  // Build paginated query
  let vendorsQuery = applyDateFilter(supabase.from('vendors').select('*', { count: 'exact' }), searchParams).is('deleted_at', null)

  if (query) {
    vendorsQuery = vendorsQuery.or(`business_name.ilike.%${query}%,vendor_code.ilike.%${query}%,email.ilike.%${query}%`)
  }
  if (statusFilter) {
    vendorsQuery = vendorsQuery.eq('status', statusFilter)
  }
  if (cityFilter) {
    vendorsQuery = vendorsQuery.eq('city', cityFilter)
  }

  // Sorting
  if (sort === 'oldest') vendorsQuery = vendorsQuery.order('created_at', { ascending: true })
  else if (sort === 'name_asc') vendorsQuery = vendorsQuery.order('business_name', { ascending: true })
  else if (sort === 'name_desc') vendorsQuery = vendorsQuery.order('business_name', { ascending: false })
  else vendorsQuery = vendorsQuery.order('created_at', { ascending: false })

  vendorsQuery = vendorsQuery.range(from, to)

  const { data: vendors, count: totalCount } = await vendorsQuery
  const totalPages = totalCount ? Math.ceil(totalCount / pageSize) : 1

  // Analytics query
  const { data: allVendors } = await supabase.from('vendors').select('status').is('deleted_at', null)
  const totalVendors = allVendors?.length || 0
  const activeVendors = allVendors?.filter((v: any) => v.status === 'Active').length || 0
  const inactiveVendors = allVendors?.filter((v: any) => v.status === 'Inactive').length || 0
  const suspendedVendors = allVendors?.filter((v: any) => v.status === 'Suspended').length || 0

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4"><div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">Vendors</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Manage vendor networks.</p>
        </div>
        <DateRangeFilter />
      </div>
        <div className="flex items-center gap-3">
          <Link href="/dashboard/vendors/new">
            <Button className="inline-flex items-center">
              <PlusCircle className="h-4 w-4 mr-2" /> New Vendor
            </Button>
          </Link>
        </div>
      </div>

      {/* Analytics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4 bg-white dark:bg-gray-900 shadow-sm border border-gray-100 dark:border-gray-800">
          <div className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Total Vendors</div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white">{totalVendors}</div>
        </Card>
        <Card className="p-4 bg-white dark:bg-gray-900 shadow-sm border border-gray-100 dark:border-gray-800">
          <div className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Active</div>
          <div className="text-2xl font-bold text-green-600 dark:text-green-400">{activeVendors}</div>
        </Card>
        <Card className="p-4 bg-white dark:bg-gray-900 shadow-sm border border-gray-100 dark:border-gray-800">
          <div className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Inactive</div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white">{inactiveVendors}</div>
        </Card>
        <Card className="p-4 bg-white dark:bg-gray-900 shadow-sm border border-gray-100 dark:border-gray-800">
          <div className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Suspended</div>
          <div className="text-2xl font-bold text-red-600 dark:text-red-400">{suspendedVendors}</div>
        </Card>
      </div>

      {/* Filters & Search */}
      <Card className="p-4 bg-white dark:bg-gray-900 shadow-sm border border-gray-100 dark:border-gray-800">
        <form className="flex flex-col md:flex-row gap-4 flex-wrap">
          <div className="flex-1 relative min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input 
              name="q"
              defaultValue={query}
              type="text" 
              placeholder="Search vendors by name, code, or email..." 
              className="w-full pl-10 pr-4 py-2 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-gray-900 dark:text-white"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            <select name="status" defaultValue={statusFilter} className="px-3 py-2 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-gray-900 dark:text-white">
              <option value="">All Statuses</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
              <option value="Suspended">Suspended</option>
            </select>
            <select name="city" defaultValue={cityFilter} className="px-3 py-2 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-gray-900 dark:text-white">
              <option value="">All Cities</option>
              {distinctCities.map((c: any) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            <select name="sort" defaultValue={sort} className="px-3 py-2 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-gray-900 dark:text-white">
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="name_asc">Name: A to Z</option>
              <option value="name_desc">Name: Z to A</option>
            </select>
            <Button type="submit" variant="outline" className="shrink-0"><Filter className="h-4 w-4 mr-2" /> Filter</Button>
          </div>
        </form>
      </Card>

      {/* Vendor List */}
      <Card className="overflow-hidden bg-white dark:bg-gray-900 shadow-sm border border-gray-100 dark:border-gray-800">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-gray-500 dark:text-gray-400 uppercase bg-gray-50 dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800">
              <tr>
                <th className="px-6 py-4">Vendor / Code</th>
                <th className="px-6 py-4">Contact</th>
                <th className="px-6 py-4">Location</th>

                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {vendors && vendors.length > 0 ? (
                vendors.map((vendor: any) => (
                  <tr key={vendor.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-500 overflow-hidden">
                          {vendor.logo_url ? <img src={vendor.logo_url} alt="" className="w-full h-full object-cover rounded-full" /> : <Store className="h-5 w-5" />}
                        </div>
                        <div>
                          <div className="font-medium text-gray-900 dark:text-white">{vendor.business_name}</div>
                          <div className="text-xs text-gray-500 dark:text-gray-400 font-mono mt-0.5">{vendor.vendor_code}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center text-gray-500 dark:text-gray-400 mb-1">
                        <Mail className="h-3.5 w-3.5 mr-2" /> <span className="truncate max-w-[150px]">{vendor.email}</span>
                      </div>
                      <div className="flex items-center text-gray-500 dark:text-gray-400">
                        <Phone className="h-3.5 w-3.5 mr-2" /> {vendor.phone}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-gray-900 dark:text-white font-medium">{vendor.city || 'N/A'}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{vendor.state}</div>
                    </td>

                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                        vendor.status === 'Active' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' :
                        vendor.status === 'Suspended' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' :
                        'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300'
                      }`}>
                        {vendor.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link href={`/dashboard/vendors/${vendor.id}`}>
                        <Button variant="outline" size="sm">Manage</Button>
                      </Link>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                    <div className="flex flex-col items-center justify-center">
                      <Store className="h-10 w-10 text-gray-300 dark:text-gray-600 mb-3" />
                      <p className="font-medium text-gray-900 dark:text-white">No vendors found</p>
                      <p className="text-sm mt-1">Adjust your filters or onboard a new vendor.</p>
                      <Link href="/dashboard/vendors/new" className="mt-4">
                        <Button variant="outline">Add Vendor</Button>
                      </Link>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between">
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Showing <span className="font-medium text-gray-900 dark:text-white">{from + 1}</span> to <span className="font-medium text-gray-900 dark:text-white">{Math.min(to + 1, totalCount || 0)}</span> of <span className="font-medium text-gray-900 dark:text-white">{totalCount}</span> vendors
            </div>
            <div className="flex gap-2">
              <Link href={`/dashboard/vendors?page=${Math.max(1, page - 1)}&q=${query}&status=${statusFilter}&city=${cityFilter}&sort=${sort}`}
                    className={`p-2 rounded border border-gray-200 dark:border-gray-700 flex items-center ${page === 1 ? 'opacity-50 pointer-events-none' : 'hover:bg-gray-50 dark:hover:bg-gray-800'}`}>
                <ChevronLeft className="h-4 w-4" />
              </Link>
              <Link href={`/dashboard/vendors?page=${Math.min(totalPages, page + 1)}&q=${query}&status=${statusFilter}&city=${cityFilter}&sort=${sort}`}
                    className={`p-2 rounded border border-gray-200 dark:border-gray-700 flex items-center ${page === totalPages ? 'opacity-50 pointer-events-none' : 'hover:bg-gray-50 dark:hover:bg-gray-800'}`}>
                <ChevronRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        )}
      </Card>
    </div>
  )
}
