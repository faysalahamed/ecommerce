import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { sendOtp, normalizePhone } from '@/lib/otp'

// POST /api/auth/forgot-password
// Body: { phoneOrEmail }
// Looks up user by phone OR email, then sends OTP to the user's phone.
// Returns: { ok, code? (dev), phone: last4 } — masked for security.
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { phoneOrEmail } = body
    if (!phoneOrEmail) {
      return NextResponse.json({ error: 'Phone or email required' }, { status: 400 })
    }

    const trimmed = String(phoneOrEmail).trim()
    let user

    if (/.+@.+\..+/.test(trimmed)) {
      // email lookup
      user = await db.user.findUnique({ where: { email: trimmed.toLowerCase() } })
    } else {
      // phone lookup
      user = await db.user.findUnique({ where: { phone: normalizePhone(trimmed) } })
    }

    // For security, do NOT reveal whether the account exists. Always return ok.
    // But only actually send OTP if user exists.
    if (!user) {
      return NextResponse.json({
        ok: true,
        message: 'If the account exists, an OTP has been sent.',
      })
    }

    const result = await sendOtp(user.phone, 'RESET_PASSWORD')
    if (!result.ok) {
      return NextResponse.json(
        { error: result.error, cooldownSeconds: result.cooldownSeconds },
        { status: 429 }
      )
    }

    // Mask the phone for the response (e.g. ****1234)
    const last4 = user.phone.slice(-4)
    const isDemo = (process.env.SMS_PROVIDER || 'demo').toLowerCase() === 'demo'
    return NextResponse.json({
      ok: true,
      ...(result.code && isDemo ? { code: result.code } : {}), // only in demo mode
      phone: `****${last4}`,
      message: isDemo
        ? `OTP sent to your phone ending in ${last4}. (Demo mode: code shown in response)`
        : `OTP sent to your phone ending in ${last4}. Valid for 5 minutes.`,
    })
  } catch (e) {
    console.error('Forgot password error:', e)
    return NextResponse.json({ error: 'Failed to send OTP' }, { status: 500 })
  }
}
