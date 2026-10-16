import bcrypt from 'bcryptjs'
import { SignJWT, jwtVerify, type JWTPayload } from 'jose'
import { cookies } from 'next/headers'
import { BRAND } from '@/lib/brand'

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || BRAND.jwtSecretFallback
)

const COOKIE_NAME = BRAND.cookieName

// Cookie `secure` flag.
// - When true: cookie is only sent over HTTPS (production best practice)
// - When false: cookie is sent over HTTP too (for HTTP-only dev / VPS without SSL)
//
// Default behaviour:
//   - In production (NODE_ENV=production): secure=true
//   - In dev: secure=false
//
// Override with `SESSION_COOKIE_SECURE=true|false` in .env. Use `false` if
// you deployed on HTTP (e.g., VPS without SSL, local testing on a real device).
function shouldUseSecureCookie(): boolean {
  const explicit = process.env.SESSION_COOKIE_SECURE?.toLowerCase()
  if (explicit === 'true') return true
  if (explicit === 'false') return false
  // Default: secure only in production
  return process.env.NODE_ENV === 'production'
}

export interface SessionPayload extends JWTPayload {
  userId: string
  email: string
  role: string
  name: string
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10)
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash)
}

export async function createToken(payload: SessionPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(JWT_SECRET)
}

export async function verifyToken(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET)
    return payload as SessionPayload
  } catch {
    return null
  }
}

export async function setSessionCookie(token: string) {
  const cookieStore = await cookies()
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: shouldUseSecureCookie(),
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: '/',
  })
}

export async function clearSessionCookie() {
  const cookieStore = await cookies()
  cookieStore.delete(COOKIE_NAME)
}

export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get(COOKIE_NAME)?.value
  if (!token) return null
  return verifyToken(token)
}

export async function getSessionUser() {
  const session = await getSession()
  return session
}

export function getCookieName() {
  return COOKIE_NAME
}
