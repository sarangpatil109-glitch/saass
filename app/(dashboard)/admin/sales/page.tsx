import { createClient } from '@/utils/supabase/server'
import { SalesExecClient } from './SalesExecClient'

export default async function SalesExecPage() {
  const supabase = await createClient()
  
  // Fetch initial data
  const { data: execs } = await supabase
    .from('sales_executives')
    .select('*, vendor:vendors(company_name, vendor_code)')
    .order('created_at', { ascending: false })

  const { data: vendors } = await supabase
    .from('vendors')
    .select('id, company_name, vendor_code')
    .eq('status', 'active')

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Sales Executives</h1>
        <p className="text-sm text-gray-500 mt-1">Manage sales executives and link them to vendors.</p>
      </div>

      <SalesExecClient initialExecs={execs || []} activeVendors={vendors || []} />
    </div>
  )
}
