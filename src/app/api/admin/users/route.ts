import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth'

export async function GET() {
  try {
    const session = await getSession()
    if (!session || session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Admin only' }, { status: 403 })
    }
    const users = await db.user.findMany({
      select: { id: true, email: true, name: true, role: true, phone: true, storeName: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json({ users })
  } catch (e) {
    console.error('Admin users GET error:', e)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session || session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Admin only' }, { status: 403 })
    }
    const body = await req.json()
    const { userId, role } = body
    if (!userId || !['ADMIN', 'RETAILER', 'CUSTOMER'].includes(role)) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
    }
    const user = await db.user.update({
      where: { id: userId },
      data: { role },
      select: { id: true, email: true, name: true, role: true },
    })
    return NextResponse.json({ user })
  } catch (e) {
    console.error('Admin users PUT error:', e)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}
