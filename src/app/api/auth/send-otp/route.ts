import { NextRequest } from 'next/server'
import { sendOtp } from '@/lib/otp'
import { SendOtpSchema } from '@/lib/dto'
import { successResponse, errorResponse, validationErrorResponse } from '@/lib/api-response'
import { checkRateLimit, getClientIp } from '@/lib/rate-limit'

// POST /api/auth/send-otp
// Body: { phone, purpose: "REGISTER" | "RESET_PASSWORD" | "LOGIN" }
export async function POST(req: NextRequest) {
  try {
    // 1. IP Rate Limiting — 3 OTP sends per 60 seconds per IP
    const clientIp = getClientIp(req)
    const rateLimit = checkRateLimit(`otp:${clientIp}`, 3, 60)
    if (!rateLimit.success) {
      return errorResponse(
        `Too many OTP requests from this network. Please wait ${rateLimit.resetSeconds}s.`,
        429
      )
    }

    // 2. Input Validation via Zod DTO Schema
    const body = await req.json().catch(() => ({}))
    const validation = SendOtpSchema.safeParse(body)
    if (!validation.success) {
      return validationErrorResponse(validation.error)
    }

    const { phone, purpose } = validation.data

    // 3. Dispatch OTP
    const result = await sendOtp(phone, purpose)
    if (!result.ok) {
      return errorResponse(
        result.error || 'Failed to dispatch OTP',
        429
      )
    }

    const isDemo = (process.env.SMS_PROVIDER || 'demo').toLowerCase() === 'demo'
    const message = isDemo
      ? 'OTP sent. (Demo mode: code shown in response & toast)'
      : 'OTP sent to your phone. Valid for 5 minutes.'

    return successResponse({
      ok: true,
      ...(result.code ? { code: result.code } : {}),
      message,
    })
  } catch (e) {
    console.error('Send OTP error:', e)
    return errorResponse('Failed to send OTP', 500)
  }
}
