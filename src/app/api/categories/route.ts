import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import {
  CreateCategorySchema,
  UpdateCategorySchema,
  toCategoryDTO,
} from '@/lib/dto'
import {
  successResponse,
  errorResponse,
  validationErrorResponse,
} from '@/lib/api-response'

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

    const categoryDTOs = categories.map(toCategoryDTO)

    if (flat) {
      return successResponse({ categories: categoryDTOs })
    }

    // Return top-level categories with their children, plus full flat list under 'all'
    const roots = categoryDTOs.filter((c) => !c.parentId)
    return successResponse({ categories: roots, all: categoryDTOs })
  } catch (error) {
    console.error('Categories GET error:', error)
    return errorResponse('Failed to fetch categories', 500)
  }
}

// POST — create new category with DTO validation
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}))
    const validation = CreateCategorySchema.safeParse(body)
    if (!validation.success) {
      return validationErrorResponse(validation.error)
    }

    const { name, parentId, icon } = validation.data
    const trimmedName = name.trim()
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
        icon: icon && icon.trim() ? icon.trim() : null,
      },
      include: {
        parent: { select: { id: true, name: true } },
        _count: { select: { products: true, children: true } },
      },
    })

    return successResponse({ category: toCategoryDTO(category) }, 201)
  } catch (error) {
    console.error('Categories POST error:', error)
    return errorResponse('Failed to create category', 500)
  }
}

// PUT — update category with DTO validation
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}))
    const validation = UpdateCategorySchema.safeParse(body)
    if (!validation.success) {
      return validationErrorResponse(validation.error)
    }

    const { id, name, parentId, icon } = validation.data

    const data: Record<string, any> = {
      name: name.trim(),
    }
    if (parentId !== undefined) {
      data.parentId = parentId && parentId !== 'none' && parentId !== id ? parentId : null
    }
    if (icon !== undefined) {
      data.icon = icon && icon.trim() ? icon.trim() : null
    }

    const category = await db.category.update({
      where: { id },
      data,
      include: {
        parent: { select: { id: true, name: true } },
        _count: { select: { products: true, children: true } },
      },
    })

    return successResponse({ category: toCategoryDTO(category) })
  } catch (error) {
    console.error('Categories PUT error:', error)
    return errorResponse('Failed to update category', 500)
  }
}

// DELETE — delete category
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')
    if (!id) {
      return errorResponse('Category ID is required', 400)
    }

    // Check if category has products
    const productCount = await db.product.count({ where: { categoryId: id } })
    if (productCount > 0) {
      return errorResponse(
        `Cannot delete: category has ${productCount} assigned product(s). Please reassign or delete the products first.`,
        400
      )
    }

    // Check if category has child categories
    const childCount = await db.category.count({ where: { parentId: id } })
    if (childCount > 0) {
      return errorResponse(
        `Cannot delete: category has ${childCount} sub-category(ies). Please delete or move them first.`,
        400
      )
    }

    await db.category.delete({ where: { id } })
    return successResponse({ ok: true, message: 'Category deleted successfully' })
  } catch (error) {
    console.error('Categories DELETE error:', error)
    return errorResponse('Failed to delete category', 500)
  }
}
