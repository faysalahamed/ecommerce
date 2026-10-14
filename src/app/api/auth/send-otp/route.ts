import { NextRequest, NextResponse } from 'next/server'
import { sendOtp } from '@/lib/otp'

// POST /api/auth/send-otp
// Body: { phone, purpose: "REGISTER" | "RESET_PASSWORD" | "LOGIN" }
// Returns:
//   - In demo mode (SMS_PROVIDER=demo): { ok, code, message } — code is returned so frontend shows it via toast
//   - In production mode (SMS_PROVIDER=twilio/vonage/sslcompuz/reve/metech): { ok, message } — SMS actually sent, no code in response
//   - On rate limit: { error, cooldownSeconds } with HTTP 429
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

    const isDemo = (process.env.SMS_PROVIDER || 'demo').toLowerCase() === 'demo'
    const message = isDemo
      ? 'OTP sent. (Demo mode: code shown in response & toast)'
      : `OTP sent to your phone. Valid for 5 minutes.`

    return NextResponse.json({
      ok: true,
      ...(result.code ? { code: result.code } : {}), // only present in demo mode
      message,
    })
  } catch (e) {
    console.error('Send OTP error:', e)
    return NextResponse.json({ error: 'Failed to send OTP' }, { status: 500 })
  }
}
