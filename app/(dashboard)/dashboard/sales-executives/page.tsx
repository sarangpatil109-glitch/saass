import { createClient } from '@/utils/supabase/server'
import { Card } from '@/components/Card'
import { PlusCircle, Search, Filter, Briefcase, Mail, Phone, Store } from 'lucide-react'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { Button } from '@/components/Button'

export default async function SalesExecutivesPage({ searchParams }: { searchParams: any }) {
  const supabase = await createClient()

  // Protect route
  const { data: { user } } = await supabase.auth.getUser()
  if (process.env.DEVELOPMENT_MODE !== 'true' && !user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', (user?.id || '')).single()
  if (process.env.DEVELOPMENT_MODE !== 'true' && profile?.role !== 'admin') redirect('/unauthorized')

  const query = searchParams?.q || ''
  const statusFilter = searchParams?.status || ''
  const vendorFilter = searchParams?.vendor || ''

  // Build query
  let execQuery = supabase.from('sales_executives').select(`
    *,
    vendors (company_name)
  `).is('deleted_at', null).order('created_at', { ascending: false })

  if (query) {
    execQuery = execQuery.or(`full_name.ilike.%${query}%,employee_code.ilike.%${query}%,vendor_code.ilike.%${query}%,email.ilike.%${query}%`)
  }
  if (statusFilter) {
    execQuery = execQuery.eq('status', statusFilter)
  }
  if (vendorFilter) {
    execQuery = execQuery.ilike('vendor_code', `%${vendorFilter}%`)
  }

  const { data: execs } = await execQuery

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">Sales Executives</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Manage sales representatives, view targets, and track performance.</p>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/dashboard/sales-executives/new">
            <Button className="inline-flex items-center">
              <PlusCircle className="h-4 w-4 mr-2" /> New Executive
            </Button>
          </Link>
        </div>
      </div>

      {/* Filters & Search */}
      <Card className="p-4 bg-white dark:bg-gray-900 shadow-sm border border-gray-100 dark:border-gray-800">
        <form className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input 
              name="q"
              defaultValue={query}
              type="text" 
              placeholder="Search by name, employee ID, or email..." 
              className="w-full pl-10 pr-4 py-2 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-gray-900 dark:text-white"
            />
          </div>
          <div className="flex gap-2">
            <input 
              name="vendor"
              defaultValue={vendorFilter}
              type="text"
              placeholder="Vendor Code..."
              className="w-32 px-3 py-2 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-gray-900 dark:text-white"
            />
            <select name="status" defaultValue={statusFilter} className="px-3 py-2 text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-gray-900 dark:text-white">
              <option value="">All Statuses</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
              <option value="Suspended">Suspended</option>
              <option value="Archived">Archived</option>
            </select>
            <Button type="submit" variant="outline" className="shrink-0"><Filter className="h-4 w-4 mr-2" /> Filter</Button>
          </div>
        </form>
      </Card>

      {/* List */}
      <Card className="overflow-hidden bg-white dark:bg-gray-900 shadow-sm border border-gray-100 dark:border-gray-800">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-gray-500 dark:text-gray-400 uppercase bg-gray-50 dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800">
              <tr>
                <th className="px-6 py-4">Executive / ID</th>
                <th className="px-6 py-4">Contact</th>
                <th className="px-6 py-4">Vendor</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {execs && execs.length > 0 ? (
                execs.map((exec: any) => {
                  const vendorInfo = Array.isArray(exec.vendors) ? exec.vendors[0] : exec.vendors;
                  return (
                    <tr key={exec.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold">
                            {exec.full_name.charAt(0)}
                          </div>
                          <div>
                            <div className="font-medium text-gray-900 dark:text-white">{exec.full_name}</div>
                            <div className="text-xs text-gray-500 dark:text-gray-400 font-mono mt-0.5">{exec.employee_code}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center text-gray-500 dark:text-gray-400 mb-1">
                          <Mail className="h-3.5 w-3.5 mr-2" /> <span className="truncate max-w-[150px]">{exec.email}</span>
                        </div>
                        <div className="flex items-center text-gray-500 dark:text-gray-400">
                          <Phone className="h-3.5 w-3.5 mr-2" /> {exec.phone}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center text-gray-700 dark:text-gray-300">
                          <Store className="h-4 w-4 mr-2 text-gray-400" />
                          <span className="font-medium text-sm">{vendorInfo?.company_name || 'Unknown'}</span>
                        </div>
                        <div className="text-xs text-gray-500 font-mono mt-1 ml-6">{exec.vendor_code}</div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                          exec.status === 'Active' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' :
                          exec.status === 'Suspended' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' :
                          'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300'
                        }`}>
                          {exec.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Link href={`/dashboard/sales-executives/${exec.id}`}>
                          <Button variant="outline" size="sm">Manage</Button>
                        </Link>
                      </td>
                    </tr>
                  )
                })
              ) : (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                    <div className="flex flex-col items-center justify-center">
                      <Briefcase className="h-10 w-10 text-gray-300 dark:text-gray-600 mb-3" />
                      <p className="font-medium text-gray-900 dark:text-white">No sales executives found</p>
                      <p className="text-sm mt-1">Adjust your filters or onboard a new executive.</p>
                      <Link href="/dashboard/sales-executives/new" className="mt-4">
                        <Button variant="outline">Add Executive</Button>
                      </Link>
                    </div>
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
