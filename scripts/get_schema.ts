import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

async function getSchema() {
  const tables = ['vendors', 'sales_executives', 'leads', 'customers', 'orders', 'commission_payouts', 'commission_transactions', 'products', 'profiles']
  
  for (const table of tables) {
    console.log(`\n--- ${table} ---`)
    const { data, error } = await supabase.from(table).select('*').limit(1)
    if (error) {
      console.log(`Error: ${error.message}`)
    } else {
      if (data && data.length > 0) {
        console.log(Object.keys(data[0]).join(', '))
      } else {
        console.log(`Table exists but is empty. Trying to get columns via a dummy insert error...`)
        const { error: insertError } = await supabase.from(table).insert({ _dummy: 1 })
        console.log(insertError?.message)
      }
    }
  }
}

getSchema()
