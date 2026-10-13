import { NextRequest, NextResponse } from 'next/server'
import { sendOtp } from '@/lib/otp'

// POST /api/auth/send-otp
// Body: { phone, purpose: "REGISTER" | "RESET_PASSWORD" | "LOGIN" }
// Returns: { ok, code? (dev only), cooldownSeconds? }
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { phone, purpose } = body

    if (!phone) {
      return NextResponse.json({ error: 'Phone number required' }, { status: 400 })
    }
    if (!['REGISTER', 'RESET_PASSWORD', 'LOGIN'].includes(purpose)) {
      return NextResponse.json({ error: 'Invalid purpose' }, { status: 400 })
    }

    const result = await sendOtp(phone, purpose)
    if (!result.ok) {
      return NextResponse.json(
        { error: result.error, cooldownSeconds: result.cooldownSeconds },
        { status: 429 }
      )
    }

    // For demo: include code in response since we don't have real SMS gateway.
    // In production, remove `code` from the response and dispatch via SMS provider.
    return NextResponse.json({
      ok: true,
      code: result.code,
      message: 'OTP sent. (Demo mode: code shown in response & toast)',
    })
  } catch (e) {
    console.error('Send OTP error:', e)
    return NextResponse.json({ error: 'Failed to send OTP' }, { status: 500 })
  }
}
