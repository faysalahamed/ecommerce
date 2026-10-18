import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth'

export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params
  const product = await db.product.findUnique({
    where: { id },
    include: {
      category: true,
      retailer: { select: { id: true, name: true, storeName: true } },
      reviews: { include: { user: { select: { name: true } } }, orderBy: { createdAt: 'desc' } },
    },
  })
  if (!product) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const related = await db.product.findMany({
    where: { categoryId: product.categoryId, id: { not: product.id }, status: 'ACTIVE' },
    take: 6,
  })

  return NextResponse.json({
    product: {
      ...product,
      images: JSON.parse(product.images) as string[],
    },
    related: related.map((p) => ({ ...p, images: JSON.parse(p.images) as string[] })),
  })
}

export async function PUT(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await ctx.params
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const existing = await db.product.findUnique({ where: { id } })
    if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    if (session.role !== 'ADMIN' && existing.retailerId !== session.userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await req.json()
    const updates: Record<string, unknown> = {}
    for (const k of [
      'name',
      'description',
      'brand',
      'model',
      'sku',
      'highlights',
      'whatsInTheBox',
      'warrantyType',
      'warrantyPeriod',
      'packageDimensions',
      'videoUrl',
      'returnPolicy',
      'categoryId',
      'status',
    ]) {
      if (body[k] !== undefined) updates[k] = body[k]
    }
    if (body.price !== undefined) updates.price = parseFloat(body.price)
    if (body.comparePrice !== undefined) updates.comparePrice = body.comparePrice ? parseFloat(body.comparePrice) : null
    if (body.stock !== undefined) updates.stock = parseInt(body.stock)
    if (body.packageWeight !== undefined) updates.packageWeight = body.packageWeight ? parseFloat(body.packageWeight) : null
    if (body.images !== undefined) updates.images = JSON.stringify(body.images)
    if (body.isFlashSale !== undefined) updates.isFlashSale = !!body.isFlashSale
    if (body.isFeatured !== undefined) updates.isFeatured = !!body.isFeatured

    let updated: any
    try {
      updated = await db.product.update({ where: { id }, data: updates })
    } catch (updateErr: any) {
      if (updateErr.message?.includes('returnPolicy') || updateErr.message?.includes('Unknown argument')) {
        const returnPolicyVal = updates.returnPolicy as string | null | undefined
        delete updates.returnPolicy
        updated = await db.product.update({ where: { id }, data: updates })
        if (returnPolicyVal !== undefined) {
          try {
            await db.$executeRawUnsafe(
              `UPDATE "Product" SET "returnPolicy" = $1 WHERE id = $2`,
              returnPolicyVal,
              id
            )
            updated.returnPolicy = returnPolicyVal
          } catch {
            // ignore fallback error
          }
        }
      } else {
        throw updateErr
      }
    }

    return NextResponse.json({ product: { ...updated, images: JSON.parse(updated.images) } })
  } catch (e) {
    console.error('Update product error:', e)
    return NextResponse.json({ error: 'Failed to update' }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await ctx.params
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const existing = await db.product.findUnique({ where: { id } })
    if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    if (session.role !== 'ADMIN' && existing.retailerId !== session.userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    await db.product.delete({ where: { id } })
    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error('Delete product error:', e)
    return NextResponse.json({ error: 'Failed to delete' }, { status: 500 })
  }
}
