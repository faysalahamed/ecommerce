import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const productId = searchParams.get('productId')
    if (!productId) {
      return NextResponse.json({ error: 'productId required' }, { status: 400 })
    }

    const reviews = await db.review.findMany({
      where: { productId },
      include: {
        user: { select: { id: true, name: true, avatar: true } },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ reviews })
  } catch (e) {
    console.error('Reviews GET error:', e)
    return NextResponse.json({ error: 'Failed to fetch reviews' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Please login first to submit a review' }, { status: 401 })
    }

    const body = await req.json()
    const { productId, rating, comment } = body

    if (!productId || rating === undefined || !comment?.trim()) {
      return NextResponse.json({ error: 'Product, rating, and comment are required' }, { status: 400 })
    }

    const parsedRating = Math.min(5, Math.max(1, parseInt(rating, 10)))
    if (isNaN(parsedRating)) {
      return NextResponse.json({ error: 'Rating must be a number between 1 and 5' }, { status: 400 })
    }

    // Verify product exists
    const product = await db.product.findUnique({ where: { id: productId } })
    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    // Create review
    const review = await db.review.create({
      data: {
        productId,
        userId: session.userId,
        rating: parsedRating,
        comment: comment.trim(),
      },
      include: {
        user: { select: { id: true, name: true, avatar: true } },
      },
    })

    // Recalculate average rating and count
    const allReviews = await db.review.findMany({
      where: { productId },
      select: { rating: true },
    })

    const totalReviews = allReviews.length
    const avgRating = totalReviews > 0
      ? allReviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews
      : 0

    const updatedProduct = await db.product.update({
      where: { id: productId },
      data: {
        rating: Math.round(avgRating * 10) / 10,
        reviewCount: totalReviews,
      },
    })

    return NextResponse.json({
      success: true,
      review,
      rating: updatedProduct.rating,
      reviewCount: updatedProduct.reviewCount,
    })
  } catch (e) {
    console.error('Create review error:', e)
    return NextResponse.json({ error: 'Failed to submit review' }, { status: 500 })
  }
}
