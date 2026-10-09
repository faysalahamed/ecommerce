import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { verifyPassword, createToken, setSessionCookie } from '@/lib/auth'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { email, password } = body

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password required' }, { status: 400 })
    }

    const user = await db.user.findUnique({ where: { email } })
    if (!user) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
    }

    const ok = await verifyPassword(password, user.password)
    if (!ok) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
    }

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
        address: user.address,
        avatar: user.avatar,
      },
    })
  } catch (e) {
    console.error('Login error:', e)
    return NextResponse.json({ error: 'Login failed' }, { status: 500 })
  }
}
