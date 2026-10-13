import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth'

export async function GET() {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ items: [] })
    const items = await db.wishlist.findMany({
      where: { userId: session.userId },
      include: { product: true },
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json({
      items: items.map((i) => ({ ...i, product: { ...i.product, images: JSON.parse(i.product.images) } })),
    })
  } catch (e) {
    console.error('Wishlist GET error:', e)
    return NextResponse.json({ items: [] })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Please login first' }, { status: 401 })
    const body = await req.json()
    const { productId } = body
    if (!productId) return NextResponse.json({ error: 'productId required' }, { status: 400 })

    const existing = await db.wishlist.findUnique({
      where: { userId_productId: { userId: session.userId, productId } },
    })
    if (existing) {
      await db.wishlist.delete({ where: { id: existing.id } })
      return NextResponse.json({ removed: true })
    }
    const item = await db.wishlist.create({
      data: { userId: session.userId, productId },
    })
    return NextResponse.json({ item })
  } catch (e) {
    console.error('Wishlist POST error:', e)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}
