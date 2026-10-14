import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { verifyOtp, normalizePhone } from '@/lib/otp'
import { hashPassword } from '@/lib/auth'

// POST /api/auth/reset-password
// Body: { phoneOrEmail, code, newPassword }
// Verifies the OTP, then updates the user's password.
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { phoneOrEmail, code, newPassword } = body

    if (!phoneOrEmail || !code || !newPassword) {
      return NextResponse.json(
        { error: 'phone/email, OTP code, and new password are required' },
        { status: 400 }
      )
    }
    if (String(newPassword).length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 })
    }

    const trimmed = String(phoneOrEmail).trim()
    let user

    if (/.+@.+\..+/.test(trimmed)) {
      user = await db.user.findUnique({ where: { email: trimmed.toLowerCase() } })
    } else {
      user = await db.user.findUnique({ where: { phone: normalizePhone(trimmed) } })
    }

    if (!user) {
      return NextResponse.json({ error: 'Account not found' }, { status: 404 })
    }

    // Verify the OTP for RESET_PASSWORD purpose against the user's actual phone
    const result = await verifyOtp(user.phone, String(code), 'RESET_PASSWORD')
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }

    // Update password
    const hashed = await hashPassword(String(newPassword))
    await db.user.update({
      where: { id: user.id },
      data: { password: hashed },
    })

    // Invalidate any other outstanding OTPs for this user (security hygiene)
    await db.otpCode.updateMany({
      where: { phone: user.phone, consumed: false },
      data: { consumed: true },
    })

    return NextResponse.json({ ok: true, message: 'Password reset successfully' })
  } catch (e) {
    console.error('Reset password error:', e)
    return NextResponse.json({ error: 'Failed to reset password' }, { status: 500 })
  }
}
