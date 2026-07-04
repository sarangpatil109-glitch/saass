import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { LeadForm } from '@/components/crm/LeadForm'

export default async function NewLeadPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (process.env.DEVELOPMENT_MODE !== 'true' && !user) redirect('/login')

  const { data: vendors } = await supabase.from('vendors').select('id, company_name').is('deleted_at', null)
  const { data: execs } = await supabase.from('sales_executives').select('id, full_name').is('deleted_at', null)
  const { data: products } = await supabase.from('products').select('id, name')

  return (
    <div className="space-y-6 pb-12">
      <div>
        <Link href="/dashboard/leads" className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-gray-700 mb-4">
          <ArrowLeft className="h-4 w-4 mr-1" /> Back to Pipeline
        </Link>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">Create New Lead</h1>
      </div>

      <LeadForm vendors={vendors || []} salesExecs={execs || []} products={products || []} />
    </div>
  )
}
