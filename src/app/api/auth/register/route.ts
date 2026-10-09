import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { hashPassword, createToken, setSessionCookie } from '@/lib/auth'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { email, password, name, role, phone, storeName } = body

    if (!email || !password || !name) {
      return NextResponse.json({ error: 'Email, password and name are required' }, { status: 400 })
    }

    const existing = await db.user.findUnique({ where: { email } })
    if (existing) {
      return NextResponse.json({ error: 'Email already registered' }, { status: 409 })
    }

    const finalRole = ['ADMIN', 'RETAILER', 'CUSTOMER'].includes(role) ? role : 'CUSTOMER'

    const hashed = await hashPassword(password)
    const user = await db.user.create({
      data: {
        email,
        password: hashed,
        name,
        role: finalRole,
        phone: phone || null,
        storeName: finalRole === 'RETAILER' ? storeName || null : null,
      },
    })

    const token = await createToken({
      userId: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
    })
    await setSessionCookie(token)

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        phone: user.phone,
        storeName: user.storeName,
      },
    })
  } catch (e) {
    console.error('Register error:', e)
    return NextResponse.json({ error: 'Registration failed' }, { status: 500 })
  }
}
