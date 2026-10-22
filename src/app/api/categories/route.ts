import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET — list categories (hierarchical roots by default, or all flat if ?flat=true)
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const flat = searchParams.get('flat') === 'true'

    const categories = await db.category.findMany({
      include: {
        children: {
          include: {
            _count: { select: { products: true } },
          },
        },
        parent: { select: { id: true, name: true } },
        _count: { select: { products: true, children: true } },
      },
      orderBy: { name: 'asc' },
    })

    if (flat) {
      return NextResponse.json({ categories })
    }

    // Return top-level categories with their children, plus full flat list under 'all'
    const roots = categories.filter((c) => !c.parentId)
    return NextResponse.json({ categories: roots, all: categories })
  } catch (error) {
    console.error('Categories GET error:', error)
    return NextResponse.json({ error: 'Failed to fetch categories' }, { status: 500 })
  }
}

// POST — create new category
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { name, parentId, icon } = body
    if (!name || !String(name).trim()) {
      return NextResponse.json({ error: 'Category name is required' }, { status: 400 })
    }

    const trimmedName = String(name).trim()
    const slug =
      trimmedName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '') +
      '-' +
      Date.now().toString(36).slice(-4)

    const category = await db.category.create({
      data: {
        name: trimmedName,
        slug,
        parentId: parentId && parentId !== 'none' ? parentId : null,
        icon: icon && String(icon).trim() ? String(icon).trim() : null,
      },
      include: {
        parent: { select: { id: true, name: true } },
        _count: { select: { products: true, children: true } },
      },
    })

    return NextResponse.json({ category })
  } catch (error) {
    console.error('Categories POST error:', error)
    return NextResponse.json({ error: 'Failed to create category' }, { status: 500 })
  }
}

// PUT — update category
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json()
    const { id, name, parentId, icon } = body
    if (!id) {
      return NextResponse.json({ error: 'Category ID is required' }, { status: 400 })
    }
    if (!name || !String(name).trim()) {
      return NextResponse.json({ error: 'Category name is required' }, { status: 400 })
    }

    const data: Record<string, any> = {
      name: String(name).trim(),
    }
    if (parentId !== undefined) {
      data.parentId = parentId && parentId !== 'none' && parentId !== id ? parentId : null
    }
    if (icon !== undefined) {
      data.icon = icon && String(icon).trim() ? String(icon).trim() : null
    }

    const category = await db.category.update({
      where: { id },
      data,
      include: {
        parent: { select: { id: true, name: true } },
        _count: { select: { products: true, children: true } },
      },
    })

    return NextResponse.json({ category })
  } catch (error) {
    console.error('Categories PUT error:', error)
    return NextResponse.json({ error: 'Failed to update category' }, { status: 500 })
  }
}

// DELETE — delete category
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')
    if (!id) {
      return NextResponse.json({ error: 'Category ID is required' }, { status: 400 })
    }

    // Check if category has products
    const productCount = await db.product.count({ where: { categoryId: id } })
    if (productCount > 0) {
      return NextResponse.json(
        {
          error: `Cannot delete: category has ${productCount} assigned product(s). Please reassign or delete the products first.`,
        },
        { status: 400 }
      )
    }

    // Check if category has child categories
    const childCount = await db.category.count({ where: { parentId: id } })
    if (childCount > 0) {
      return NextResponse.json(
        {
          error: `Cannot delete: category has ${childCount} sub-category(ies). Please delete or move them first.`,
        },
        { status: 400 }
      )
    }

    await db.category.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Categories DELETE error:', error)
    return NextResponse.json({ error: 'Failed to delete category' }, { status: 500 })
  }
}
