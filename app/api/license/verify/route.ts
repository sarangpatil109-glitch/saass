import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: Request) {
  // Use service role key to bypass RLS for API verification since the caller is an unauthenticated software instance
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  const supabase = createClient(supabaseUrl, supabaseKey)

  try {
    const { license_key, device_id } = await request.json()

    if (!license_key || !device_id) {
      return NextResponse.json({ error: 'License key and Device ID are required.' }, { status: 400 })
    }

    // 1. Fetch License
    const { data: license, error: licenseError } = await supabase
      .from('licenses')
      .select('id, status')
      .eq('license_key', license_key)
      .single()

    if (licenseError || !license) {
      return NextResponse.json({ error: 'Invalid license key.' }, { status: 404 })
    }

    // 2. Validate Status
    if (['Suspended', 'Revoked', 'Expired'].includes(license.status)) {
      return NextResponse.json({ error: `License is ${license.status.toLowerCase()}.` }, { status: 403 })
    }

    // 3. Check if device is registered and active
    const { data: device, error: deviceError } = await supabase
      .from('license_devices')
      .select('id, is_active')
      .eq('license_id', license.id)
      .eq('device_id', device_id)
      .single()

    if (deviceError || !device) {
      return NextResponse.json({ error: 'Device is not registered for this license.' }, { status: 403 })
    }

    if (!device.is_active) {
      return NextResponse.json({ error: 'Device is deactivated.' }, { status: 403 })
    }

    // 4. Update last active timestamp
    await supabase.from('license_devices').update({ last_active: new Date().toISOString() }).eq('id', device.id)
    
    // Log verification check optionally (commented out to save DB rows on heavy check intervals, uncomment for high security tracking)
    // await supabase.from('license_history').insert({ license_id: license.id, action: 'Verification', device_id, ip_address: request.headers.get('x-forwarded-for') || 'Unknown' })

    return NextResponse.json({ success: true, status: license.status })
    
  } catch (error: any) {
    return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 })
  }
}
