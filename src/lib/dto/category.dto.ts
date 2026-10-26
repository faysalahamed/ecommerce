import { z } from 'zod'

// ==========================================
// Category Input Validation Schemas (Request DTOs)
// ==========================================

export const CreateCategorySchema = z.object({
  name: z.string().min(2, 'Category name must be at least 2 characters').max(100),
  parentId: z.string().optional().nullable(),
  icon: z.string().max(100).optional().nullable(),
})

export type CreateCategoryInput = z.infer<typeof CreateCategorySchema>

export const UpdateCategorySchema = z.object({
  id: z.string().min(1, 'Category ID is required'),
  name: z.string().min(2, 'Category name must be at least 2 characters').max(100),
  parentId: z.string().optional().nullable(),
  icon: z.string().max(100).optional().nullable(),
})

export type UpdateCategoryInput = z.infer<typeof UpdateCategorySchema>

// ==========================================
// Category Output Projections (Response DTOs)
// ==========================================

export interface CategoryDTO {
  id: string
  name: string
  slug: string
  icon?: string | null
  parentId?: string | null
  parent?: {
    id: string
    name: string
  } | null
  children?: CategoryDTO[]
  _count?: {
    products?: number
    children?: number
  }
}

export function toCategoryDTO(raw: any): CategoryDTO {
  return {
    id: raw.id,
    name: raw.name,
    slug: raw.slug,
    icon: raw.icon || null,
    parentId: raw.parentId || null,
    parent: raw.parent
      ? {
          id: raw.parent.id,
          name: raw.parent.name,
        }
      : null,
    children: raw.children?.map(toCategoryDTO),
    _count: raw._count
      ? {
          products: Number(raw._count.products || 0),
          children: Number(raw._count.children || 0),
        }
      : undefined,
  }
}
