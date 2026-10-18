import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { verifyPassword, createToken, setSessionCookie } from '@/lib/auth'

// Normalize phone numbers (remove +, spaces, dashes)
function normalizePhone(input: string): string {
  return input.replace(/[+\-\s]/g, '')
}

// Detect if input looks like a phone number (digits only after normalization, or starts with +)
function isPhoneLike(input: string): boolean {
  const trimmed = input.trim()
  if (/^\+?\d[\d\s\-]*$/.test(trimmed)) return true
  return false
}

// Detect if input looks like an email
function isEmailLike(input: string): boolean {
  return /.+@.+\..+/.test(input.trim())
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { phoneOrEmail, phone, email, password } = body

    // Support both legacy `email` field and new `phoneOrEmail` field
    const identifier = phoneOrEmail || email || phone || ''
    if (!identifier || !password) {
      return NextResponse.json({ error: 'Phone/Email and password required' }, { status: 400 })
    }

    const trimmed = identifier.trim()
    let user

    if (isEmailLike(trimmed)) {
      // Lookup by email (case-insensitive lowercase)
      user = await db.user.findUnique({ where: { email: trimmed.toLowerCase() } })
    } else if (isPhoneLike(trimmed)) {
      // Lookup by phone (normalized)
      user = await db.user.findUnique({ where: { phone: normalizePhone(trimmed) } })
    } else {
      // Fallback: try both
      user =
        (await db.user.findUnique({ where: { phone: normalizePhone(trimmed) } })) ||
        (await db.user.findUnique({ where: { email: trimmed.toLowerCase() } }))
    }

    if (!user) {
      return NextResponse.json({ error: 'Account not found' }, { status: 401 })
    }

    const ok = await verifyPassword(password, user.password)
    if (!ok) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
    }

    const token = await createToken({
      userId: user.id,
      email: user.phone, // phone as primary identifier in JWT
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
        storeName: user.storeName,
        address: user.address,
        avatar: user.avatar,
      },
    })
  } catch (e) {
    console.error('Login error:', e)
    return NextResponse.json({ error: 'Login failed' }, { status: 500 })
  }
}
