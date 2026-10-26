import { NextRequest } from 'next/server'
import { Prisma } from '@prisma/client'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth'
import {
  ProductQuerySchema,
  CreateProductSchema,
  toProductDTO,
} from '@/lib/dto'
import {
  successResponse,
  errorResponse,
  validationErrorResponse,
} from '@/lib/api-response'

function slugify(s: string) {
  return (
    s
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '') +
    '-' +
    Date.now().toString(36).slice(-4)
  )
}

// GET /api/products — list with typed filters and server-side pagination DTO
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)

    // Validate query parameters with Zod
    const queryObj = Object.fromEntries(searchParams.entries())
    const validation = ProductQuerySchema.safeParse(queryObj)
    if (!validation.success) {
      return validationErrorResponse(validation.error)
    }

    const {
      page,
      limit,
      categoryId,
      brand,
      search,
      retailerId,
      flash,
      featured,
      sort,
      status,
    } = validation.data

    const skip = (page - 1) * limit

    // Strongly-typed Prisma where input
    const where: Prisma.ProductWhereInput = {}

    if (status !== 'ALL') {
      where.status = status
    }
    if (categoryId) where.categoryId = categoryId
    if (retailerId) where.retailerId = retailerId
    if (flash) where.isFlashSale = true
    if (featured) where.isFeatured = true
    if (brand) {
      where.brand = { equals: brand, mode: 'insensitive' }
    }
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { brand: { contains: search, mode: 'insensitive' } },
      ]
    }

    // Strongly-typed Prisma orderBy
    const orderBy: Prisma.ProductOrderByWithRelationInput =
      sort === 'price-asc'
        ? { price: 'asc' }
        : sort === 'price-desc'
        ? { price: 'desc' }
        : sort === 'popular'
        ? { soldCount: 'desc' }
        : sort === 'rating'
        ? { rating: 'desc' }
        : { createdAt: 'desc' }

    const [total, products] = await Promise.all([
      db.product.count({ where }),
      db.product.findMany({
        where,
        orderBy,
        take: limit,
        skip,
        include: {
          category: { select: { id: true, name: true, slug: true, icon: true } },
          retailer: { select: { id: true, name: true, storeName: true } },
        },
      }),
    ])

    const totalPages = Math.ceil(total / limit)
    const productDTOs = products.map(toProductDTO)

    return successResponse({
      products: productDTOs,
      total,
      page,
      limit,
      totalPages,
      hasMore: page < totalPages,
      pagination: {
        total,
        page,
        limit,
        totalPages,
        hasMore: page < totalPages,
      },
    })
  } catch (e) {
    console.error('Products GET error:', e)
    return errorResponse('Failed to fetch products', 500)
  }
}

// POST /api/products — create product with Request DTO validation
export async function POST(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session) return errorResponse('Unauthorized', 401)
    if (!['RETAILER', 'ADMIN'].includes(session.role)) {
      return errorResponse('Only retailers and admins can create products', 403)
    }

    const body = await req.json().catch(() => ({}))
    const validation = CreateProductSchema.safeParse(body)
    if (!validation.success) {
      return validationErrorResponse(validation.error)
    }

    const input = validation.data

    const category = await db.category.findUnique({ where: { id: input.categoryId } })
    if (!category) return errorResponse('Category not found', 400)

    const createData: Prisma.ProductCreateInput = {
      name: input.name,
      slug: slugify(input.name),
      description: input.description,
      price: input.price,
      comparePrice: input.comparePrice,
      images: JSON.stringify(input.images || []),
      stock: input.stock,
      brand: input.brand,
      model: input.model,
      sku: input.sku,
      highlights: input.highlights,
      whatsInTheBox: input.whatsInTheBox,
      warrantyType: input.warrantyType,
      warrantyPeriod: input.warrantyPeriod,
      packageWeight: input.packageWeight,
      packageDimensions: input.packageDimensions,
      videoUrl: input.videoUrl,
      returnPolicy: input.returnPolicy,
      isFlashSale: input.isFlashSale,
      isFeatured: input.isFeatured,
      status: input.status,
      category: { connect: { id: input.categoryId } },
      retailer: { connect: { id: session.userId } },
    }

    let createdProduct: any
    try {
      createdProduct = await db.product.create({
        data: createData,
        include: {
          category: { select: { id: true, name: true, slug: true, icon: true } },
          retailer: { select: { id: true, name: true, storeName: true } },
        },
      })
    } catch (createErr: any) {
      // Graceful fallback if returnPolicy column schema mismatch occurs
      if (createErr.message?.includes('returnPolicy') || createErr.message?.includes('Unknown argument')) {
        delete (createData as any).returnPolicy
        createdProduct = await db.product.create({
          data: createData,
          include: {
            category: { select: { id: true, name: true, slug: true, icon: true } },
            retailer: { select: { id: true, name: true, storeName: true } },
          },
        })
        if (input.returnPolicy) {
          try {
            await db.$executeRawUnsafe(
              `UPDATE "Product" SET "returnPolicy" = $1 WHERE id = $2`,
              input.returnPolicy,
              createdProduct.id
            )
            createdProduct.returnPolicy = input.returnPolicy
          } catch {
            // ignore fallback error
          }
        }
      } else {
        throw createErr
      }
    }

    return successResponse(
      { product: toProductDTO(createdProduct) },
      201
    )
  } catch (e) {
    console.error('Create product error:', e)
    return errorResponse('Failed to create product', 500)
  }
}
