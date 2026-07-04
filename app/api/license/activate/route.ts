import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: Request) {
  // Use service role key to bypass RLS for API verification since the caller is an unauthenticated software instance
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  const supabase = createClient(supabaseUrl, supabaseKey)

  try {
    const { license_key, device_id, device_name, os, browser } = await request.json()

    if (!license_key || !device_id) {
      return NextResponse.json({ error: 'License key and Device ID are required.' }, { status: 400 })
    }

    // 1. Fetch License
    const { data: license, error: licenseError } = await supabase
      .from('licenses')
      .select('id, status, max_activations')
      .eq('license_key', license_key)
      .single()

    if (licenseError || !license) {
      return NextResponse.json({ error: 'Invalid license key.' }, { status: 404 })
    }

    // 2. Validate Status
    if (['Suspended', 'Revoked', 'Expired'].includes(license.status)) {
      return NextResponse.json({ error: `License is ${license.status.toLowerCase()}.` }, { status: 403 })
    }

    // 3. Check if device is already registered
    const { data: existingDevice } = await supabase
      .from('license_devices')
      .select('id, is_active')
      .eq('license_id', license.id)
      .eq('device_id', device_id)
      .single()

    if (existingDevice) {
      if (!existingDevice.is_active) {
        return NextResponse.json({ error: 'This device has been deactivated by the administrator.' }, { status: 403 })
      }
      
      // Update last active
      await supabase.from('license_devices').update({ last_active: new Date().toISOString() }).eq('id', existingDevice.id)
      await supabase.from('license_history').insert({ license_id: license.id, action: 'Reactivation', device_id, ip_address: request.headers.get('x-forwarded-for') || 'Unknown' })
      
      // If the license was Pending, mark it Active since a device just reactivated (edge case, but safe)
      if (license.status === 'Pending') {
        await supabase.from('licenses').update({ status: 'Active' }).eq('id', license.id)
      }
      
      return NextResponse.json({ success: true, message: 'Device reactivated successfully.' })
    }

    // 4. Device is not registered, check activation limits
    const { count } = await supabase
      .from('license_devices')
      .select('*', { count: 'exact', head: true })
      .eq('license_id', license.id)
      .eq('is_active', true)

    if (count !== null && count >= license.max_activations) {
      return NextResponse.json({ error: 'Maximum activation limit reached for this license.' }, { status: 403 })
    }

    // 5. Register Device
    await supabase.from('license_devices').insert({
      license_id: license.id,
      device_id,
      device_name: device_name || 'Unknown Device',
      os: os || 'Unknown',
      browser: browser || 'Unknown'
    })

    // 6. Update License Status to Active if it was Pending
    if (license.status === 'Pending') {
      await supabase.from('licenses').update({ status: 'Active' }).eq('id', license.id)
    }

    // 7. Log History
    await supabase.from('license_history').insert({ 
      license_id: license.id, 
      action: 'Activation', 
      device_id, 
      ip_address: request.headers.get('x-forwarded-for') || 'Unknown' 
    })

    return NextResponse.json({ success: true, message: 'Software activated successfully.' })
    
  } catch (error: any) {
    return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 })
  }
}
