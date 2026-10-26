import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { verifyPassword, createToken, setSessionCookie } from '@/lib/auth'
import { LoginSchema, toUserDTO } from '@/lib/dto'
import { successResponse, errorResponse, validationErrorResponse } from '@/lib/api-response'
import { checkRateLimit, getClientIp } from '@/lib/rate-limit'

// Normalize phone numbers (remove +, spaces, dashes)
function normalizePhone(input: string): string {
  return input.replace(/[+\-\s]/g, '')
}

function isPhoneLike(input: string): boolean {
  const trimmed = input.trim()
  return /^\+?\d[\d\s\-]*$/.test(trimmed)
}

function isEmailLike(input: string): boolean {
  return /.+@.+\..+/.test(input.trim())
}

export async function POST(req: NextRequest) {
  try {
    // 1. Rate Limiting — 5 attempts per 60 seconds per IP
    const clientIp = getClientIp(req)
    const rateLimit = checkRateLimit(`login:${clientIp}`, 5, 60)
    if (!rateLimit.success) {
      return errorResponse(
        `Too many login attempts. Please try again in ${rateLimit.resetSeconds} seconds.`,
        429
      )
    }

    // 2. Input Validation via Zod DTO Schema
    const body = await req.json().catch(() => ({}))
    const validation = LoginSchema.safeParse(body)
    if (!validation.success) {
      return validationErrorResponse(validation.error)
    }

    const { phoneOrEmail, phone, email, password } = validation.data
    const identifier = (phoneOrEmail || email || phone || '').trim()

    // 3. User lookup
    let user
    if (isEmailLike(identifier)) {
      user = await db.user.findUnique({ where: { email: identifier.toLowerCase() } })
    } else if (isPhoneLike(identifier)) {
      user = await db.user.findUnique({ where: { phone: normalizePhone(identifier) } })
    } else {
      user =
        (await db.user.findUnique({ where: { phone: normalizePhone(identifier) } })) ||
        (await db.user.findUnique({ where: { email: identifier.toLowerCase() } }))
    }

    if (!user) {
      return errorResponse('Account not found', 401)
    }

    // 4. Password verification
    const ok = await verifyPassword(password, user.password)
    if (!ok) {
      return errorResponse('Invalid credentials', 401)
    }

    // 5. Issue session JWT
    const token = await createToken({
      userId: user.id,
      email: user.phone,
      role: user.role,
      name: user.name,
    })
    await setSessionCookie(token)

    // 6. Return response using clean UserDTO (safe projection)
    return successResponse({
      user: toUserDTO(user),
    })
  } catch (e) {
    console.error('Login error:', e)
    return errorResponse('Login failed', 500)
  }
}
