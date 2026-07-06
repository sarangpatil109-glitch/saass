import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, supabaseKey)

async function setup() {
  const { data, error } = await supabase.storage.createBucket('payment-proofs', { public: true })
  if (error) {
    console.log('Bucket creation error (might already exist):', error.message)
  } else {
    console.log('Bucket created:', data)
  }
}

setup()
