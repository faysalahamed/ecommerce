import { db } from '@/lib/db'

const OTP_TTL_MS = 5 * 60 * 1000 // 5 minutes
const OTP_RESEND_COOLDOWN_MS = 60 * 1000 // 60 seconds

export function generateOtp(): string {
  // 6-digit code
  return Math.floor(100000 + Math.random() * 900000).toString()
}

export function normalizePhone(input: string): string {
  return input.replace(/[+\-\s]/g, '')
}

export interface OtpResult {
  ok: boolean
  error?: string
  code?: string // returned only in dev mode (no real SMS gateway)
  cooldownSeconds?: number
}

/**
 * Generate and persist an OTP for the given phone + purpose.
 * Returns the OTP code in dev mode (since there's no real SMS gateway).
 */
export async function sendOtp(phone: string, purpose: string): Promise<OtpResult> {
  const normalized = normalizePhone(phone)
  if (!normalized) return { ok: false, error: 'Phone number required' }

  // Check for an existing unconsumed OTP within the cooldown window
  const recent = await db.otpCode.findFirst({
    where: {
      phone: normalized,
      purpose,
      consumed: false,
      createdAt: { gte: new Date(Date.now() - OTP_RESEND_COOLDOWN_MS) },
    },
    orderBy: { createdAt: 'desc' },
  })
  if (recent) {
    const elapsed = Date.now() - recent.createdAt.getTime()
    const remaining = Math.ceil((OTP_RESEND_COOLDOWN_MS - elapsed) / 1000)
    return {
      ok: false,
      error: `Please wait ${remaining}s before requesting another OTP`,
      cooldownSeconds: remaining,
    }
  }

  const code = generateOtp()
  const otp = await db.otpCode.create({
    data: {
      phone: normalized,
      code,
      purpose,
      expiresAt: new Date(Date.now() + OTP_TTL_MS),
    },
  })
  void otp

  // In production, you would integrate with an SMS provider (e.g., Twilio, Vonage, bulk SMS BD).
  // For this demo we return the code in the response so it can be shown to the user via toast.
  return { ok: true, code }
}

export interface VerifyOtpResult {
  ok: boolean
  error?: string
}

/**
 * Verify an OTP. On success, marks it as consumed.
 */
export async function verifyOtp(phone: string, code: string, purpose: string): Promise<VerifyOtpResult> {
  const normalized = normalizePhone(phone)
  if (!normalized || !code) return { ok: false, error: 'Phone and code required' }

  const record = await db.otpCode.findFirst({
    where: { phone: normalized, purpose, consumed: false },
    orderBy: { createdAt: 'desc' },
  })

  if (!record) return { ok: false, error: 'No OTP was sent. Please request a new code.' }
  if (record.expiresAt < new Date()) return { ok: false, error: 'OTP expired. Please request a new code.' }
  if (record.code !== code.trim()) return { ok: false, error: 'Invalid OTP code' }

  await db.otpCode.update({ where: { id: record.id }, data: { consumed: true } })
  return { ok: true }
}
