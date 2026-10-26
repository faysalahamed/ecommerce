import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth'
import { toProductDTO, type ProductDTO } from '@/lib/dto'
import { successResponse, errorResponse } from '@/lib/api-response'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const limit = Math.min(48, Math.max(6, parseInt(searchParams.get('limit') || '24')))

    // Client-passed browsing history categories and brands (for guest / hybrid personalization)
    const clientCategories = (searchParams.get('categories') || '')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)

    const clientBrands = (searchParams.get('brands') || '')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)

    const excludeIds = (searchParams.get('exclude') || '')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)

    const session = await getSession()
    const interestCategoryIds = new Set<string>(clientCategories)
    const interestBrands = new Set<string>(clientBrands)
    const personalizationReasons: string[] = []

    // 1. If user is logged in, extract categories and brands from past orders & wishlist
    if (session?.userId) {
      const [userOrders, userWishlist] = await Promise.all([
        db.order.findMany({
          where: { userId: session.userId, status: { not: 'CANCELLED' } },
          take: 10,
          orderBy: { createdAt: 'desc' },
          include: {
            items: {
              select: { productId: true },
            },
          },
        }),
        db.wishlist.findMany({
          where: { userId: session.userId },
          take: 15,
          include: {
            product: {
              select: { categoryId: true, brand: true },
            },
          },
        }),
      ])

      // Extract purchased product IDs
      const purchasedProductIds = userOrders
        .flatMap((o) => o.items.map((it) => it.productId))
        .filter(Boolean)

      if (purchasedProductIds.length > 0) {
        const purchasedProducts = await db.product.findMany({
          where: { id: { in: purchasedProductIds } },
          select: { categoryId: true, brand: true },
        })

        purchasedProducts.forEach((p) => {
          if (p.categoryId) interestCategoryIds.add(p.categoryId)
          if (p.brand && p.brand.trim() && p.brand.toLowerCase() !== 'no brand') {
            interestBrands.add(p.brand.trim())
          }
        })
        personalizationReasons.push('purchase_history')
      }

      // Extract wishlist categories & brands
      userWishlist.forEach((w) => {
        if (w.product?.categoryId) interestCategoryIds.add(w.product.categoryId)
        if (w.product?.brand && w.product.brand.trim() && w.product.brand.toLowerCase() !== 'no brand') {
          interestBrands.add(w.product.brand.trim())
        }
      })
      if (userWishlist.length > 0) {
        personalizationReasons.push('wishlist')
      }
    }

    if (clientCategories.length > 0) {
      personalizationReasons.push('browsing_history')
    }

    const recommendedMap = new Map<string, any>()
    const catArray = Array.from(interestCategoryIds)
    const brandArray = Array.from(interestBrands)

    // 2. Query products in interest categories (ordered by rating & popularity)
    if (catArray.length > 0) {
      const categoryProducts = await db.product.findMany({
        where: {
          status: 'ACTIVE',
          categoryId: { in: catArray },
          ...(excludeIds.length > 0 ? { id: { notIn: excludeIds } } : {}),
        },
        take: Math.ceil(limit * 0.7), // up to 70% from interest categories
        orderBy: [{ rating: 'desc' }, { soldCount: 'desc' }, { createdAt: 'desc' }],
        include: {
          category: { select: { id: true, name: true, slug: true, icon: true } },
          retailer: { select: { id: true, name: true, storeName: true } },
        },
      })

      categoryProducts.forEach((p) => recommendedMap.set(p.id, p))
    }

    // 3. Query products from interest brands
    if (brandArray.length > 0 && recommendedMap.size < limit) {
      const brandProducts = await db.product.findMany({
        where: {
          status: 'ACTIVE',
          brand: { in: brandArray, mode: 'insensitive' },
          id: { notIn: [...excludeIds, ...Array.from(recommendedMap.keys())] },
        },
        take: Math.ceil(limit * 0.3),
        orderBy: [{ soldCount: 'desc' }, { rating: 'desc' }],
        include: {
          category: { select: { id: true, name: true, slug: true, icon: true } },
          retailer: { select: { id: true, name: true, storeName: true } },
        },
      })

      brandProducts.forEach((p) => recommendedMap.set(p.id, p))
    }

    // 4. Backfill with top-selling & top-rated products if not enough personalized products exist
    const needed = limit - recommendedMap.size
    if (needed > 0) {
      const alreadyIds = [...excludeIds, ...Array.from(recommendedMap.keys())]
      const backfillProducts = await db.product.findMany({
        where: {
          status: 'ACTIVE',
          ...(alreadyIds.length > 0 ? { id: { notIn: alreadyIds } } : {}),
        },
        take: needed,
        orderBy: [{ soldCount: 'desc' }, { rating: 'desc' }, { createdAt: 'desc' }],
        include: {
          category: { select: { id: true, name: true, slug: true, icon: true } },
          retailer: { select: { id: true, name: true, storeName: true } },
        },
      })

      backfillProducts.forEach((p) => recommendedMap.set(p.id, p))
    }

    const finalProducts: ProductDTO[] = Array.from(recommendedMap.values()).map(toProductDTO)

    return successResponse({
      products: finalProducts,
      total: finalProducts.length,
      personalized: personalizationReasons.length > 0,
      reasons: personalizationReasons,
    })
  } catch (error) {
    console.error('Recommendations GET error:', error)
    return errorResponse('Failed to fetch recommendations', 500)
  }
}
