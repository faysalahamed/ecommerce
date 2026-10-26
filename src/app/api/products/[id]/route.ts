import { NextRequest } from 'next/server'
import { Prisma } from '@prisma/client'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth'
import { UpdateProductSchema, toProductDTO } from '@/lib/dto'
import {
  successResponse,
  errorResponse,
  validationErrorResponse,
} from '@/lib/api-response'

export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await ctx.params
    const product = await db.product.findUnique({
      where: { id },
      include: {
        category: { select: { id: true, name: true, slug: true, icon: true } },
        retailer: { select: { id: true, name: true, storeName: true } },
        reviews: {
          include: { user: { select: { name: true } } },
          orderBy: { createdAt: 'desc' },
        },
      },
    })
    if (!product) return errorResponse('Product not found', 404)

    const related = await db.product.findMany({
      where: { categoryId: product.categoryId, id: { not: product.id }, status: 'ACTIVE' },
      take: 6,
      include: {
        category: { select: { id: true, name: true, slug: true, icon: true } },
        retailer: { select: { id: true, name: true, storeName: true } },
      },
    })

    return successResponse({
      product: {
        ...toProductDTO(product),
        reviews: product.reviews?.map((r) => ({
          id: r.id,
          rating: r.rating,
          comment: r.comment,
          createdAt: r.createdAt.toISOString(),
          user: { name: r.user?.name || 'Customer' },
        })),
      },
      related: related.map(toProductDTO),
    })
  } catch (e) {
    console.error('Product GET [id] error:', e)
    return errorResponse('Failed to fetch product', 500)
  }
}

export async function PUT(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await ctx.params
    const session = await getSession()
    if (!session) return errorResponse('Unauthorized', 401)

    const existing = await db.product.findUnique({ where: { id } })
    if (!existing) return errorResponse('Product not found', 404)

    if (session.role !== 'ADMIN' && existing.retailerId !== session.userId) {
      return errorResponse('Forbidden: You can only edit your own products', 403)
    }

    const body = await req.json().catch(() => ({}))
    const validation = UpdateProductSchema.safeParse(body)
    if (!validation.success) {
      return validationErrorResponse(validation.error)
    }

    const input = validation.data
    const updates: Prisma.ProductUpdateInput = {}

    if (input.name !== undefined) updates.name = input.name
    if (input.description !== undefined) updates.description = input.description
    if (input.price !== undefined) updates.price = input.price
    if (input.comparePrice !== undefined) updates.comparePrice = input.comparePrice
    if (input.stock !== undefined) updates.stock = input.stock
    if (input.brand !== undefined) updates.brand = input.brand
    if (input.model !== undefined) updates.model = input.model
    if (input.sku !== undefined) updates.sku = input.sku
    if (input.highlights !== undefined) updates.highlights = input.highlights
    if (input.whatsInTheBox !== undefined) updates.whatsInTheBox = input.whatsInTheBox
    if (input.warrantyType !== undefined) updates.warrantyType = input.warrantyType
    if (input.warrantyPeriod !== undefined) updates.warrantyPeriod = input.warrantyPeriod
    if (input.packageWeight !== undefined) updates.packageWeight = input.packageWeight
    if (input.packageDimensions !== undefined) updates.packageDimensions = input.packageDimensions
    if (input.videoUrl !== undefined) updates.videoUrl = input.videoUrl
    if (input.returnPolicy !== undefined) updates.returnPolicy = input.returnPolicy
    if (input.isFlashSale !== undefined) updates.isFlashSale = input.isFlashSale
    if (input.isFeatured !== undefined) updates.isFeatured = input.isFeatured
    if (input.status !== undefined) updates.status = input.status
    if (input.images !== undefined) updates.images = JSON.stringify(input.images)
    if (input.categoryId !== undefined) {
      updates.category = { connect: { id: input.categoryId } }
    }

    let updated: any
    try {
      updated = await db.product.update({
        where: { id },
        data: updates,
        include: {
          category: { select: { id: true, name: true, slug: true, icon: true } },
          retailer: { select: { id: true, name: true, storeName: true } },
        },
      })
    } catch (updateErr: any) {
      if (updateErr.message?.includes('returnPolicy') || updateErr.message?.includes('Unknown argument')) {
        const returnPolicyVal = updates.returnPolicy as string | null | undefined
        delete updates.returnPolicy
        updated = await db.product.update({
          where: { id },
          data: updates,
          include: {
            category: { select: { id: true, name: true, slug: true, icon: true } },
            retailer: { select: { id: true, name: true, storeName: true } },
          },
        })
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

    return successResponse({ product: toProductDTO(updated) })
  } catch (e) {
    console.error('Update product error:', e)
    return errorResponse('Failed to update product', 500)
  }
}

export async function DELETE(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await ctx.params
    const session = await getSession()
    if (!session) return errorResponse('Unauthorized', 401)

    const existing = await db.product.findUnique({ where: { id } })
    if (!existing) return errorResponse('Product not found', 404)

    if (session.role !== 'ADMIN' && existing.retailerId !== session.userId) {
      return errorResponse('Forbidden: You can only delete your own products', 403)
    }

    await db.product.delete({ where: { id } })
    return successResponse({ ok: true, message: 'Product deleted successfully' })
  } catch (e) {
    console.error('Delete product error:', e)
    return errorResponse('Failed to delete product', 500)
  }
}
