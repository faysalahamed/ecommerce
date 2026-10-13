import { NextRequest, NextResponse } from 'next/server'
import { verifyOtp } from '@/lib/otp'

// POST /api/auth/verify-otp
// Body: { phone, code, purpose }
// Returns: { ok: true } or { error }
// Does NOT create the account — registration still goes through /api/auth/register,
// but the register route will check for a recently-consumed OTP for that phone.
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { phone, code, purpose } = body

    if (!phone || !code || !purpose) {
      return NextResponse.json({ error: 'phone, code, purpose required' }, { status: 400 })
    }
    if (!['REGISTER', 'RESET_PASSWORD', 'LOGIN'].includes(purpose)) {
      return NextResponse.json({ error: 'Invalid purpose' }, { status: 400 })
    }

    const result = await verifyOtp(phone, code, purpose)
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }

    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error('Verify OTP error:', e)
    return NextResponse.json({ error: 'Failed to verify OTP' }, { status: 500 })
  }
}
