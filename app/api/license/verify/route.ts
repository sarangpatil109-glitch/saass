import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { license_key, device_id } = body

    if (!license_key || !device_id) {
      return NextResponse.json({ error: 'License key and Device ID are required.' }, { status: 400 })
    }

    const supabase = await createClient()

    // 1. Verify License exists and is valid
    const { data: license } = await supabase.from('licenses').select('id, status, expiry_date').eq('license_key', license_key).single()

    if (!license) {
      return NextResponse.json({ error: 'Invalid license key.', valid: false }, { status: 404 })
    }

    if (license.status !== 'Active') {
      return NextResponse.json({ error: `License is ${license.status}.`, valid: false }, { status: 403 })
    }

    if (license.expiry_date && new Date(license.expiry_date) < new Date()) {
      await supabase.from('licenses').update({ status: 'Expired' }).eq('id', license.id)
      return NextResponse.json({ error: 'License has expired.', valid: false }, { status: 403 })
    }

    // 2. Check if device is registered and active
    const { data: device } = await supabase.from('license_devices').select('id, status').eq('license_id', license.id).eq('device_id', device_id).single()

    if (!device) {
      return NextResponse.json({ error: 'Device not registered. Please activate first.', valid: false }, { status: 403 })
    }

    if (device.status !== 'Active') {
      return NextResponse.json({ error: 'Device has been deactivated or blocked.', valid: false }, { status: 403 })
    }

    // Update last seen
    await supabase.from('license_devices').update({ last_seen: new Date().toISOString() }).eq('id', device.id)

    return NextResponse.json({ 
      valid: true, 
      message: 'License is valid.'
    })

  } catch (error: any) {
    console.error('Verification Error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
