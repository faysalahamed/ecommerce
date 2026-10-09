import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth'

export async function GET() {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ user: null })
    }
    const user = await db.user.findUnique({
      where: { id: session.userId },
      select: {
        id: true,
        email: true,
        phone: true,
        name: true,
        role: true,
        address: true,
        storeName: true,
        avatar: true,
      },
    })
    return NextResponse.json({ user })
  } catch (e) {
    console.error('Me error:', e)
    return NextResponse.json({ user: null })
  }
}
