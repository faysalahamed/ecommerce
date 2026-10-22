import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth'

// GET — list orders for current user (or all if admin)
export async function GET() {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ orders: [] })

    const where: any = {}
    if (session.role === 'CUSTOMER') {
      where.userId = session.userId
    } else if (session.role === 'RETAILER') {
      // Orders containing products owned by this retailer
      where.items = { some: { product: { retailerId: session.userId } } }
    }
    // ADMIN sees all

    const orders = await db.order.findMany({
      where,
      include: {
        items: true,
        user: { select: { name: true, email: true, phone: true, address: true } },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ orders })
  } catch (e) {
    console.error('Orders GET error:', e)
    return NextResponse.json({ orders: [] })
  }
}

// POST — create order
export async function POST(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Please login first' }, { status: 401 })

    const body = await req.json()
    const { items, recipientName, phone, address, paymentMethod = 'COD' } = body

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'Cart is empty' }, { status: 400 })
    }
    if (!recipientName || !phone || !address) {
      return NextResponse.json({ error: 'Shipping details required' }, { status: 400 })
    }

    // Validate products and compute totals
    const productIds = items.map((i: { productId: string }) => i.productId)
    const products = await db.product.findMany({ where: { id: { in: productIds } } })

    if (products.length !== productIds.length) {
      return NextResponse.json({ error: 'Some products no longer exist' }, { status: 400 })
    }

    const orderItems = items.map((i: { productId: string; quantity: number }) => {
      const p = products.find((pr) => pr.id === i.productId)!
      return {
        productId: p.id,
        name: p.name,
        price: p.price,
        image: JSON.parse(p.images)[0] || '',
        quantity: i.quantity,
      }
    })

    const subtotal = orderItems.reduce((s: number, i: { price: number; quantity: number }) => s + i.price * i.quantity, 0)
    const shipping = subtotal >= 1000 ? 0 : 60
    const total = subtotal + shipping

    const orderNumber = 'DZ' + Date.now().toString().slice(-8)

    const order = await db.order.create({
      data: {
        userId: session.userId,
        orderNumber,
        subtotal,
        shipping,
        total,
        // COD orders start as PENDING (payment on delivery); online-paid orders are CONFIRMED immediately
        status: paymentMethod === 'COD' ? 'PENDING' : 'CONFIRMED',
        paymentStatus: paymentMethod === 'COD' ? 'UNPAID' : 'PAID',
        paymentMethod,
        paymentRef: paymentMethod !== 'COD' ? 'PAY-' + orderNumber : null,
        address,
        phone,
        recipientName,
        items: { create: orderItems },
      },
      include: { items: true },
    })

    // Decrement stock & increment soldCount; remove from cart
    await Promise.all(
      items.map(async (i: { productId: string; quantity: number }) => {
        await db.product.update({
          where: { id: i.productId },
          data: {
            stock: { decrement: i.quantity },
            soldCount: { increment: i.quantity },
          },
        })
      })
    )

    await db.cartItem.deleteMany({ where: { userId: session.userId } })

    return NextResponse.json({ order })
  } catch (e) {
    console.error('Orders POST error:', e)
    return NextResponse.json({ error: 'Failed to place order' }, { status: 500 })
  }
}

// PUT — update order status (admin only)
export async function PUT(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session || session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Admin only' }, { status: 403 })
    }
    const body = await req.json()
    const { orderId, status, paymentStatus } = body
    if (!orderId) return NextResponse.json({ error: 'orderId required' }, { status: 400 })

    const data: Record<string, string> = {}
    if (status) data.status = status
    if (paymentStatus) data.paymentStatus = paymentStatus

    const updated = await db.order.update({ where: { id: orderId }, data })
    return NextResponse.json({ order: updated })
  } catch (e) {
    console.error('Orders PUT error:', e)
    return NextResponse.json({ error: 'Failed to update order' }, { status: 500 })
  }
}
