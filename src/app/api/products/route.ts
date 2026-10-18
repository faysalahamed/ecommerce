import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth'

function slugify(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') + '-' + Date.now().toString(36).slice(-4)
}

// GET /api/products — list with filters
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const categoryId = searchParams.get('categoryId') || undefined
  const search = searchParams.get('search') || undefined
  const retailerId = searchParams.get('retailerId') || undefined
  const flash = searchParams.get('flash') === 'true'
  const featured = searchParams.get('featured') === 'true'
  const sort = searchParams.get('sort') || 'latest'
  const limit = parseInt(searchParams.get('limit') || '50')

  const where: any = { status: 'ACTIVE' }
  if (categoryId) where.categoryId = categoryId
  if (retailerId) where.retailerId = retailerId
  if (flash) where.isFlashSale = true
  if (featured) where.isFeatured = true
  if (search) {
    where.OR = [
      { name: { contains: search } },
      { description: { contains: search } },
      { brand: { contains: search } },
    ]
  }

  const orderBy: any = { createdAt: 'desc' }
  if (sort === 'price-asc') orderBy.price = 'asc'
  if (sort === 'price-desc') orderBy.price = 'desc'
  if (sort === 'popular') orderBy.soldCount = 'desc'
  if (sort === 'rating') orderBy.rating = 'desc'

  const products = await db.product.findMany({
    where,
    orderBy,
    take: limit,
    include: { category: true, retailer: { select: { name: true, storeName: true } } },
  })

  const parsed = products.map((p) => ({
    ...p,
    images: JSON.parse(p.images) as string[],
  }))

  return NextResponse.json({ products: parsed })
}

// POST /api/products — create (RETAILER or ADMIN)
export async function POST(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (!['RETAILER', 'ADMIN'].includes(session.role)) {
      return NextResponse.json({ error: 'Only retailers and admins can create products' }, { status: 403 })
    }

    const body = await req.json()
    const {
      name,
      description,
      price,
      comparePrice,
      images,
      stock,
      categoryId,
      brand,
      model,
      sku,
      highlights,
      whatsInTheBox,
      warrantyType,
      warrantyPeriod,
      packageWeight,
      packageDimensions,
      videoUrl,
      returnPolicy,
      isFlashSale,
      isFeatured,
    } = body

    if (!name || !description || !price || !categoryId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const cat = await db.category.findUnique({ where: { id: categoryId } })
    if (!cat) return NextResponse.json({ error: 'Category not found' }, { status: 400 })

    const data: any = {
      name,
      slug: slugify(name),
      description,
      price: parseFloat(price),
      comparePrice: comparePrice ? parseFloat(comparePrice) : null,
      images: JSON.stringify(images || []),
      stock: parseInt(stock) || 0,
      brand: brand || null,
      model: model || null,
      sku: sku || null,
      highlights: highlights || null,
      whatsInTheBox: whatsInTheBox || null,
      warrantyType: warrantyType || null,
      warrantyPeriod: warrantyPeriod || null,
      packageWeight: packageWeight ? parseFloat(packageWeight) : null,
      packageDimensions: packageDimensions || null,
      videoUrl: videoUrl || null,
      isFlashSale: !!isFlashSale,
      isFeatured: !!isFeatured,
      categoryId,
      retailerId: session.userId,
    }
    if (returnPolicy !== undefined) {
      data.returnPolicy = returnPolicy || null
    }

    let product: any
    try {
      product = await db.product.create({ data })
    } catch (createErr: any) {
      if (createErr.message?.includes('returnPolicy') || createErr.message?.includes('Unknown argument')) {
        delete data.returnPolicy
        product = await db.product.create({ data })
        if (returnPolicy) {
          try {
            await db.$executeRawUnsafe(
              `UPDATE "Product" SET "returnPolicy" = $1 WHERE id = $2`,
              returnPolicy,
              product.id
            )
            product.returnPolicy = returnPolicy
          } catch {
            // ignore fallback error
          }
        }
      } else {
        throw createErr
      }
    }

    return NextResponse.json({ product })
  } catch (e) {
    console.error('Create product error:', e)
    return NextResponse.json({ error: 'Failed to create product' }, { status: 500 })
  }
}
