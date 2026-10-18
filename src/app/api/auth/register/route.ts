import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { hashPassword, createToken, setSessionCookie } from '@/lib/auth'
import { normalizePhone } from '@/lib/otp'
import { isOtpEnabled } from '@/lib/config'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { phone, email, password, name, role, storeName, otpVerified } = body

    if (!phone || !password || !name) {
      return NextResponse.json(
        { error: 'Phone number, password and name are required' },
        { status: 400 }
      )
    }

    const normalizedPhone = normalizePhone(phone)

    // OTP verification requirement — toggle with OTP_ENABLED env var.
    // When OTP is disabled, accounts are created directly with phoneVerified=true.
    const otpRequired = isOtpEnabled()
    let phoneVerified = false

    if (otpRequired) {
      // Require OTP verification — caller must pass otpVerified=true AND
      // we double-check by looking for a recently-consumed OTP for this phone + REGISTER
      if (!otpVerified) {
        return NextResponse.json(
          { error: 'Phone number must be verified with OTP before registration' },
          { status: 400 }
        )
      }

      const recentOtp = await db.otpCode.findFirst({
        where: {
          phone: normalizedPhone,
          purpose: 'REGISTER',
          consumed: true,
          expiresAt: { gte: new Date(Date.now() - 30 * 60 * 1000) }, // consumed within last 30 min
        },
        orderBy: { createdAt: 'desc' },
      })
      if (!recentOtp) {
        return NextResponse.json(
          { error: 'Phone verification not found. Please request and verify an OTP first.' },
          { status: 400 }
        )
      }
      phoneVerified = true
    } else {
      // OTP disabled — auto-mark as verified
      phoneVerified = true
    }

    // Check phone uniqueness
    const existingByPhone = await db.user.findUnique({ where: { phone: normalizedPhone } })
    if (existingByPhone) {
      return NextResponse.json({ error: 'Phone number already registered' }, { status: 409 })
    }

    // Check email uniqueness if provided
    let normalizedEmail: string | null = null
    if (email && String(email).trim()) {
      normalizedEmail = String(email).trim().toLowerCase()
      const existingByEmail = await db.user.findUnique({ where: { email: normalizedEmail } })
      if (existingByEmail) {
        return NextResponse.json({ error: 'Email already registered' }, { status: 409 })
      }
    }

    const finalRole = ['ADMIN', 'RETAILER', 'CUSTOMER'].includes(role) ? role : 'CUSTOMER'

    const hashed = await hashPassword(password)
    const user = await db.user.create({
      data: {
        phone: normalizedPhone,
        email: normalizedEmail,
        password: hashed,
        name,
        role: finalRole,
        phoneVerified,
        storeName: finalRole === 'RETAILER' ? storeName || null : null,
      },
    })

    const token = await createToken({
      userId: user.id,
      email: user.phone,
      role: user.role,
      name: user.name,
    })
    await setSessionCookie(token)

    return NextResponse.json({
      user: {
        id: user.id,
        phone: user.phone,
        email: user.email,
        name: user.name,
        role: user.role,
        phoneVerified: user.phoneVerified,
        storeName: user.storeName,
      },
    })
  } catch (e) {
    console.error('Register error:', e)
    return NextResponse.json({ error: 'Registration failed' }, { status: 500 })
  }
}
