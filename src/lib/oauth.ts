import { db } from '@/lib/db'
import { hashPassword, createToken, setSessionCookie } from '@/lib/auth'
import crypto from 'crypto'

export interface OAuthUserProfile {
  provider: 'google' | 'facebook'
  providerId: string
  name: string
  email?: string | null
  avatar?: string | null
}

export function getBaseAppUrl(req?: Request): string {
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL.replace(/\/$/, '')
  }
  if (req) {
    const host = req.headers.get('x-forwarded-host') || req.headers.get('host')
    const proto = req.headers.get('x-forwarded-proto') || 'http'
    if (host) {
      return `${proto}://${host}`
    }
  }
  return 'http://localhost:3000'
}

export function generateOAuthState(): string {
  return crypto.randomBytes(24).toString('hex')
}

/**
 * Finds an existing user by email or creates a new one for OAuth providers.
 * Handles the unique phone constraint in Prisma by generating a standardized placeholder phone.
 */
export async function findOrCreateOAuthUser(profile: OAuthUserProfile) {
  const normalizedEmail = profile.email?.toLowerCase().trim() || null

  let user: any = null

  // 1. Look up by email if provided
  if (normalizedEmail) {
    user = await db.user.findUnique({
      where: { email: normalizedEmail },
    })
  }

  // 2. If user already exists, update avatar if empty and return
  if (user) {
    if (profile.avatar && !user.avatar) {
      user = await db.user.update({
        where: { id: user.id },
        data: { avatar: profile.avatar },
      })
    }
    return user
  }

  // 3. User does not exist, create a new customer account
  // Generate a unique phone number adhering to Bangladeshi mobile phone pattern:
  // e.g., +88019 + 8 digits derived deterministically from providerId or random
  const hashNum = Math.abs(
    profile.providerId
      .split('')
      .reduce((acc, char) => (acc * 31 + char.charCodeAt(0)) % 100000000, 7)
  )
  const phoneSuffix = String(hashNum).padStart(8, '0').slice(0, 8)
  let candidatePhone = `+88019${phoneSuffix}`

  // Ensure uniqueness
  const phoneConflict = await db.user.findUnique({ where: { phone: candidatePhone } })
  if (phoneConflict) {
    candidatePhone = `+88019${Math.floor(10000000 + Math.random() * 90000000)}`
  }

  // Random secure password for OAuth user
  const randomPassword = crypto.randomBytes(32).toString('hex')
  const hashedPassword = await hashPassword(randomPassword)

  user = await db.user.create({
    data: {
      name: profile.name || 'Valued Customer',
      email: normalizedEmail,
      phone: candidatePhone,
      password: hashedPassword,
      avatar: profile.avatar || null,
      role: 'CUSTOMER',
      phoneVerified: true,
    },
  })

  return user
}

/**
 * Complete OAuth login: issues JWT and sets session cookie
 */
export async function completeOAuthLogin(user: { id: string; phone: string; role: string; name: string }) {
  const token = await createToken({
    userId: user.id,
    email: user.phone,
    role: user.role,
    name: user.name,
  })
  await setSessionCookie(token)
  return token
}
