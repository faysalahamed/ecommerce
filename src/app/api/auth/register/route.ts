import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { hashPassword, createToken, setSessionCookie } from '@/lib/auth'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { phone, email, password, name, role, storeName } = body

    if (!phone || !password || !name) {
      return NextResponse.json(
        { error: 'Phone number, password and name are required' },
        { status: 400 }
      )
    }

    // Normalize phone: remove leading +, spaces, dashes
    const normalizedPhone = String(phone).replace(/[+\-\s]/g, '')

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
        storeName: finalRole === 'RETAILER' ? storeName || null : null,
      },
    })

    const token = await createToken({
      userId: user.id,
      email: user.phone, // use phone as the primary identifier in JWT
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
      },
    })
  } catch (e) {
    console.error('Register error:', e)
    return NextResponse.json({ error: 'Registration failed' }, { status: 500 })
  }
}
