import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import jwt from 'jsonwebtoken'
import crypto from 'crypto'

const JWT_SECRET = process.env.JWT_SECRET || 'saass_offline_signing_key_fallback_do_not_use_in_prod'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { license_key, device_id, device_name, os_name, app_version, machine_fingerprint } = body

    if (!license_key || !device_id) {
      return NextResponse.json({ error: 'License key and Device ID are required.' }, { status: 400 })
    }

    const supabase = await createClient()

    // 1. Verify License exists and is valid
    const { data: license } = await supabase.from('licenses').select(`
      *,
      license_policies (offline_grace_period_days)
    `).eq('license_key', license_key).single()

    if (!license) {
      return NextResponse.json({ error: 'Invalid license key.' }, { status: 404 })
    }

    if (license.status !== 'Active') {
      return NextResponse.json({ error: `License is ${license.status}. Activation denied.` }, { status: 403 })
    }

    if (license.expiry_date && new Date(license.expiry_date) < new Date()) {
      await supabase.from('licenses').update({ status: 'Expired' }).eq('id', license.id)
      return NextResponse.json({ error: 'License has expired.' }, { status: 403 })
    }

    // 2. Check if device is already registered
    let { data: device } = await supabase.from('license_devices').select('*').eq('license_id', license.id).eq('device_id', device_id).single()

    if (!device) {
      // 3. Verify Activation Limit
      if (license.current_activations >= license.activation_limit) {
        return NextResponse.json({ error: 'Maximum activation limit reached for this license.' }, { status: 403 })
      }

      // 4. Register Device
      const { data: newDevice, error: devErr } = await supabase.from('license_devices').insert({
        license_id: license.id,
        device_id,
        device_name,
        os_name,
        app_version,
        machine_fingerprint: machine_fingerprint || device_id
      }).select().single()

      if (devErr) throw devErr
      device = newDevice

      // Increment activations
      await supabase.from('licenses').update({ current_activations: license.current_activations + 1 }).eq('id', license.id)
    } else {
      if (device.status !== 'Active') {
         return NextResponse.json({ error: 'Device has been deactivated or blocked by admin.' }, { status: 403 })
      }
      // Update last seen
      await supabase.from('license_devices').update({ last_seen: new Date().toISOString() }).eq('id', device.id)
    }

    // 5. Generate Offline Token
    const policy = Array.isArray(license.license_policies) ? license.license_policies[0] : license.license_policies;
    
    const offlineTokenPayload = {
      lic: license_key,
      dev: device_id,
      exp: Math.floor(Date.now() / 1000) + ((policy?.offline_grace_period_days || 7) * 24 * 60 * 60)
    }

    const token = jwt.sign(offlineTokenPayload, JWT_SECRET)

    // 6. Record Activation Event
    await supabase.from('license_activations').insert({
      license_id: license.id,
      device_id: device.id,
      ip_address: req.headers.get('x-forwarded-for') || 'Unknown',
      activation_token: crypto.createHash('sha256').update(token).digest('hex') // Store hash for tracking
    })

    await supabase.from('license_activity_logs').insert({
      action: 'Device Activated',
      remarks: `Device ${device_id} activated successfully.`,
      license_id: license.id,
      device_id: device.id
    })

    return NextResponse.json({ 
      success: true, 
      offline_token: token,
      message: 'Activation successful.'
    })

  } catch (error: any) {
    console.error('Activation Error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
