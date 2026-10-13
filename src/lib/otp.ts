import { db } from '@/lib/db'
import { sendSms, normalizeToE164 } from '@/lib/sms'

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
  code?: string // returned only in dev/demo mode (no real SMS gateway)
  cooldownSeconds?: number
}

/**
 * Generate and persist an OTP for the given phone + purpose, then dispatch via SMS provider.
 *
 * - In "demo" mode: returns the code in the response so the frontend can display it via toast.
 * - In production mode (SMS_PROVIDER=twilio/vonage/sslcompuz/reve/metech): actually sends an SMS
 *   and does NOT return the code in the response.
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
  await db.otpCode.create({
    data: {
      phone: normalized,
      code,
      purpose,
      expiresAt: new Date(Date.now() + OTP_TTL_MS),
    },
  })

  // Send the SMS via the configured provider.
  // The SMS body should be short, friendly, and include the brand name.
  const brand = 'Daraz Clone'
  const purposeText = purpose === 'REGISTER' ? 'verification' : purpose === 'RESET_PASSWORD' ? 'password reset' : 'login'
  const smsBody = `${brand}: Your ${purposeText} code is ${code}. It expires in 5 minutes. Do not share this code with anyone.`

  const smsResult = await sendSms(normalizeToE164(normalized), smsBody)
  if (!smsResult.ok) {
    // SMS dispatch failed — but the OTP is in the DB, so user might still see it in demo mode.
    // In production with a real provider, surface the error to the user.
    console.error('SMS dispatch failed:', smsResult.error)
    return { ok: false, error: `SMS failed: ${smsResult.error}` }
  }

  // Demo mode returns the code so the UI can show it via toast.
  // Production mode: do NOT return the code in the response — it's a secret.
  const isDemo = (process.env.SMS_PROVIDER || 'demo').toLowerCase() === 'demo'
  if (isDemo) {
    return { ok: true, code }
  }

  return { ok: true }
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

