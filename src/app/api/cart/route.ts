import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth'

export async function GET() {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ items: [] })
    const items = await db.cartItem.findMany({
      where: { userId: session.userId },
      include: { product: true },
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json({
      items: items.map((i) => ({ ...i, product: { ...i.product, images: JSON.parse(i.product.images) } })),
    })
  } catch (e) {
    console.error('Cart GET error:', e)
    return NextResponse.json({ items: [] })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Please login first' }, { status: 401 })

    const body = await req.json()
    const { productId, quantity = 1 } = body
    if (!productId) return NextResponse.json({ error: 'productId required' }, { status: 400 })

    const product = await db.product.findUnique({ where: { id: productId } })
    if (!product) return NextResponse.json({ error: 'Product not found' }, { status: 404 })

    const existing = await db.cartItem.findFirst({
      where: { userId: session.userId, productId },
    })

    if (existing) {
      const updated = await db.cartItem.update({
        where: { id: existing.id },
        data: { quantity: existing.quantity + quantity },
      })
      return NextResponse.json({ item: updated })
    }

    const item = await db.cartItem.create({
      data: { userId: session.userId, productId, quantity },
    })
    return NextResponse.json({ item })
  } catch (e) {
    console.error('Cart POST error:', e)
    return NextResponse.json({ error: 'Failed to add to cart' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const { itemId, quantity } = body
    if (!itemId) return NextResponse.json({ error: 'itemId required' }, { status: 400 })

    if (quantity <= 0) {
      await db.cartItem.delete({ where: { id: itemId } })
      return NextResponse.json({ ok: true, removed: true })
    }

    const updated = await db.cartItem.update({
      where: { id: itemId },
      data: { quantity: parseInt(quantity) },
    })
    return NextResponse.json({ item: updated })
  } catch (e) {
    console.error('Cart PUT error:', e)
    return NextResponse.json({ error: 'Failed to update' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(req.url)
    const itemId = searchParams.get('itemId')
    if (itemId) {
      await db.cartItem.delete({ where: { id: itemId } })
    } else {
      await db.cartItem.deleteMany({ where: { userId: session.userId } })
    }
    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error('Cart DELETE error:', e)
    return NextResponse.json({ error: 'Failed to delete' }, { status: 500 })
  }
}
