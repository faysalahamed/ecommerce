import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { getSession } from '@/lib/auth'

// GET /api/debug-cookies
// Diagnostic endpoint — shows what cookies the server received and whether
// the session is valid. Useful for debugging "Please login first" issues.
// Safe to call without auth — only shows cookie names + first 20 chars of values.
export async function GET() {
  const cookieStore = await cookies()
  const allCookies = cookieStore.getAll()

  const session = await getSession()

  return NextResponse.json({
    // What cookies the server received from the browser
    cookiesReceived: allCookies.map((c) => ({
      name: c.name,
      valuePreview: c.value ? c.value.substring(0, 20) + '...' : '(empty)',
      // Note: cookie flags (Secure, HttpOnly, SameSite) are set by the server
      // when sending the cookie — they aren't visible to the server on incoming
      // requests. The browser stores them and decides whether to send the cookie
      // based on these flags.
    })),

    // Whether the JWT session is valid
    sessionValid: !!session,
    sessionUserId: session?.userId || null,
    sessionRole: session?.role || null,
    sessionName: session?.name || null,

    // Server-side env var values (for diagnostic purposes)
    env: {
      NODE_ENV: process.env.NODE_ENV || '(unset)',
      OTP_ENABLED: process.env.OTP_ENABLED || '(unset, defaults to true)',
      SESSION_COOKIE_SECURE: process.env.SESSION_COOKIE_SECURE || '(unset, defaults to NODE_ENV=production)',
      SMS_PROVIDER: process.env.SMS_PROVIDER || '(unset, defaults to demo)',
    },
  })
}
