import { NextRequest } from 'next/server'
import { Prisma } from '@prisma/client'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth'
import { CreateOrderSchema, UpdateOrderSchema, toOrderDTO } from '@/lib/dto'
import {
  successResponse,
  errorResponse,
  validationErrorResponse,
} from '@/lib/api-response'

// GET — list orders for current user (or all if admin)
export async function GET() {
  try {
    const session = await getSession()
    if (!session) return successResponse({ orders: [] })

    const where: Prisma.OrderWhereInput = {}
    if (session.role === 'CUSTOMER') {
      where.userId = session.userId
    } else if (session.role === 'RETAILER') {
      // Orders containing products owned by this retailer
      where.items = { some: { product: { retailerId: session.userId } } }
    }
    // ADMIN sees all orders

    const orders = await db.order.findMany({
      where,
      include: {
        items: true,
        user: { select: { name: true, email: true, phone: true, address: true } },
      },
      orderBy: { createdAt: 'desc' },
    })

    return successResponse({ orders: orders.map(toOrderDTO) })
  } catch (e) {
    console.error('Orders GET error:', e)
    return successResponse({ orders: [] })
  }
}

// POST — create order with DTO validation
export async function POST(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session) return errorResponse('Please login first', 401)

    const body = await req.json().catch(() => ({}))
    const validation = CreateOrderSchema.safeParse(body)
    if (!validation.success) {
      return validationErrorResponse(validation.error)
    }

    const { items, recipientName, phone, address, paymentMethod } = validation.data

    // Validate products and compute totals
    const productIds = items.map((i) => i.productId)
    const products = await db.product.findMany({ where: { id: { in: productIds } } })

    if (products.length !== productIds.length) {
      return errorResponse('Some products in your order no longer exist', 400)
    }

    const orderItems = items.map((i) => {
      const p = products.find((pr) => pr.id === i.productId)!
      let firstImage = ''
      try {
        const parsed = JSON.parse(p.images)
        firstImage = Array.isArray(parsed) ? parsed[0] || '' : ''
      } catch {
        firstImage = p.images || ''
      }

      return {
        productId: p.id,
        name: p.name,
        price: p.price,
        image: firstImage,
        quantity: i.quantity,
      }
    })

    const subtotal = orderItems.reduce((s, i) => s + i.price * i.quantity, 0)
    const shipping = subtotal >= 1000 ? 0 : 60
    const total = subtotal + shipping

    const orderNumber = 'DZ' + Date.now().toString().slice(-8)

    // COD orders start as PENDING; online-paid orders start as CONFIRMED
    const order = await db.order.create({
      data: {
        userId: session.userId,
        orderNumber,
        subtotal,
        shipping,
        total,
        status: paymentMethod === 'COD' ? 'PENDING' : 'CONFIRMED',
        paymentStatus: paymentMethod === 'COD' ? 'UNPAID' : 'PAID',
        paymentMethod,
        paymentRef: paymentMethod !== 'COD' ? 'PAY-' + orderNumber : null,
        address,
        phone,
        recipientName,
        items: { create: orderItems },
      },
      include: {
        items: true,
        user: { select: { name: true, email: true, phone: true, address: true } },
      },
    })

    // Decrement stock & increment soldCount; remove items from cart
    await Promise.all(
      items.map(async (i) => {
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

    return successResponse(
      { order: toOrderDTO(order) },
      201
    )
  } catch (e) {
    console.error('Orders POST error:', e)
    return errorResponse('Failed to place order', 500)
  }
}

// PUT — update order status (admin only)
export async function PUT(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session || session.role !== 'ADMIN') {
      return errorResponse('Admin access required', 403)
    }

    const body = await req.json().catch(() => ({}))
    const validation = UpdateOrderSchema.safeParse(body)
    if (!validation.success) {
      return validationErrorResponse(validation.error)
    }

    const { orderId, status, paymentStatus } = validation.data

    const data: Prisma.OrderUpdateInput = {}
    if (status) data.status = status
    if (paymentStatus) data.paymentStatus = paymentStatus

    const updated = await db.order.update({
      where: { id: orderId },
      data,
      include: {
        items: true,
        user: { select: { name: true, email: true, phone: true, address: true } },
      },
    })

    return successResponse({ order: toOrderDTO(updated) })
  } catch (e) {
    console.error('Orders PUT error:', e)
    return errorResponse('Failed to update order', 500)
  }
}
