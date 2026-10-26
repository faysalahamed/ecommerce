import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { hashPassword, createToken, setSessionCookie } from '@/lib/auth'
import { normalizePhone } from '@/lib/otp'
import { isOtpEnabled } from '@/lib/config'
import { RegisterSchema, toUserDTO } from '@/lib/dto'
import { successResponse, errorResponse, validationErrorResponse } from '@/lib/api-response'
import { checkRateLimit, getClientIp } from '@/lib/rate-limit'

export async function POST(req: NextRequest) {
  try {
    // 1. Rate Limiting — 5 registrations per 5 minutes per IP
    const clientIp = getClientIp(req)
    const rateLimit = checkRateLimit(`register:${clientIp}`, 5, 300)
    if (!rateLimit.success) {
      return errorResponse(
        `Too many registration attempts. Please try again in ${rateLimit.resetSeconds} seconds.`,
        429
      )
    }

    // 2. Input Validation via Zod DTO Schema
    const body = await req.json().catch(() => ({}))
    const validation = RegisterSchema.safeParse(body)
    if (!validation.success) {
      return validationErrorResponse(validation.error)
    }

    const { phone, email, password, name, role, storeName, otpVerified } = validation.data
    const normalizedPhone = normalizePhone(phone)

    // 3. OTP verification requirement (check env toggle)
    const otpRequired = isOtpEnabled()
    let phoneVerified = false

    if (otpRequired) {
      if (!otpVerified) {
        return errorResponse('Phone number must be verified with OTP before registration', 400)
      }

      const recentOtp = await db.otpCode.findFirst({
        where: {
          phone: normalizedPhone,
          purpose: 'REGISTER',
          consumed: true,
          expiresAt: { gte: new Date(Date.now() - 30 * 60 * 1000) },
        },
        orderBy: { createdAt: 'desc' },
      })
      if (!recentOtp) {
        return errorResponse(
          'Phone verification not found. Please request and verify an OTP first.',
          400
        )
      }
      phoneVerified = true
    } else {
      phoneVerified = true
    }

    // 4. Check uniqueness
    const existingByPhone = await db.user.findUnique({ where: { phone: normalizedPhone } })
    if (existingByPhone) {
      return errorResponse('Phone number already registered', 409)
    }

    let normalizedEmail: string | null = null
    if (email && email.trim()) {
      normalizedEmail = email.trim().toLowerCase()
      const existingByEmail = await db.user.findUnique({ where: { email: normalizedEmail } })
      if (existingByEmail) {
        return errorResponse('Email already registered', 409)
      }
    }

    // 5. Create user
    const hashed = await hashPassword(password)
    const user = await db.user.create({
      data: {
        phone: normalizedPhone,
        email: normalizedEmail,
        password: hashed,
        name,
        role,
        phoneVerified,
        storeName: role === 'RETAILER' ? storeName || null : null,
      },
    })

    // 6. Issue session cookie
    const token = await createToken({
      userId: user.id,
      email: user.phone,
      role: user.role,
      name: user.name,
    })
    await setSessionCookie(token)

    return successResponse({
      user: toUserDTO(user),
    })
  } catch (e) {
    console.error('Register error:', e)
    return errorResponse('Registration failed', 500)
  }
}
