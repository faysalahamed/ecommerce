import { z } from 'zod'

// ==========================================
// Product Input Validation Schemas (Request DTOs)
// ==========================================

export const ProductQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  categoryId: z.string().optional(),
  brand: z.string().optional(),
  search: z.string().optional(),
  retailerId: z.string().optional(),
  flash: z
    .string()
    .optional()
    .transform((val) => val === 'true'),
  featured: z
    .string()
    .optional()
    .transform((val) => val === 'true'),
  sort: z
    .enum(['latest', 'price-asc', 'price-desc', 'popular', 'rating'])
    .default('latest'),
  status: z.enum(['ACTIVE', 'INACTIVE', 'ALL']).default('ACTIVE'),
})

export type ProductQueryInput = z.infer<typeof ProductQuerySchema>

export const CreateProductSchema = z.object({
  name: z.string().min(2, 'Product name must be at least 2 characters').max(255),
  description: z.string().min(5, 'Description must be at least 5 characters'),
  price: z.coerce.number().positive('Price must be greater than zero'),
  comparePrice: z.coerce.number().positive('Compare price must be positive').optional().nullable(),
  stock: z.coerce.number().int().min(0, 'Stock cannot be negative').default(0),
  categoryId: z.string().min(1, 'Category is required'),
  images: z.array(z.string().url('Invalid image URL')).or(z.array(z.string())).default([]),
  brand: z.string().max(100).optional().nullable(),
  model: z.string().max(100).optional().nullable(),
  sku: z.string().max(100).optional().nullable(),
  highlights: z.string().optional().nullable(),
  whatsInTheBox: z.string().optional().nullable(),
  warrantyType: z.string().max(100).optional().nullable(),
  warrantyPeriod: z.string().max(100).optional().nullable(),
  packageWeight: z.coerce.number().positive().optional().nullable(),
  packageDimensions: z.string().max(100).optional().nullable(),
  videoUrl: z.string().optional().nullable(),
  returnPolicy: z.string().optional().nullable(),
  isFlashSale: z.boolean().default(false),
  isFeatured: z.boolean().default(false),
  status: z.enum(['ACTIVE', 'INACTIVE']).default('ACTIVE'),
})

export type CreateProductInput = z.infer<typeof CreateProductSchema>

export const UpdateProductSchema = CreateProductSchema.partial()

export type UpdateProductInput = z.infer<typeof UpdateProductSchema>

// ==========================================
// Product Output Projections (Response DTOs)
// ==========================================

export interface CategorySummaryDTO {
  id: string
  name: string
  slug?: string
  icon?: string | null
}

export interface RetailerSummaryDTO {
  id?: string
  name: string
  storeName?: string | null
}

export interface ReviewSummaryDTO {
  id: string
  rating: number
  comment?: string | null
  createdAt: string
  user: {
    name: string
  }
}

/**
 * Clean Product DTO.
 * Guarantees images is an array of strings (parsed from DB JSON string)
 * and safely projects category and retailer summaries without exposing
 * internal database details.
 */
export interface ProductDTO {
  id: string
  name: string
  slug: string
  description: string
  price: number
  comparePrice: number | null
  images: string[]
  stock: number
  soldCount: number
  rating: number
  reviewCount: number
  status: string
  isFlashSale: boolean
  isFeatured: boolean
  brand: string | null
  model?: string | null
  sku?: string | null
  highlights?: string | null
  whatsInTheBox?: string | null
  warrantyType?: string | null
  warrantyPeriod?: string | null
  packageWeight?: number | null
  packageDimensions?: string | null
  videoUrl?: string | null
  returnPolicy?: string | null
  categoryId: string
  category?: CategorySummaryDTO
  retailer?: RetailerSummaryDTO
  createdAt?: string
}

export function toProductDTO(raw: any): ProductDTO {
  let parsedImages: string[] = []
  if (Array.isArray(raw.images)) {
    parsedImages = raw.images
  } else if (typeof raw.images === 'string') {
    try {
      parsedImages = JSON.parse(raw.images)
    } catch {
      parsedImages = [raw.images]
    }
  }

  return {
    id: raw.id,
    name: raw.name,
    slug: raw.slug,
    description: raw.description,
    price: Number(raw.price),
    comparePrice: raw.comparePrice !== null && raw.comparePrice !== undefined ? Number(raw.comparePrice) : null,
    images: parsedImages,
    stock: Number(raw.stock || 0),
    soldCount: Number(raw.soldCount || 0),
    rating: Number(raw.rating || 0),
    reviewCount: Number(raw.reviewCount || 0),
    status: raw.status || 'ACTIVE',
    isFlashSale: Boolean(raw.isFlashSale),
    isFeatured: Boolean(raw.isFeatured),
    brand: raw.brand || null,
    model: raw.model || null,
    sku: raw.sku || null,
    highlights: raw.highlights || null,
    whatsInTheBox: raw.whatsInTheBox || null,
    warrantyType: raw.warrantyType || null,
    warrantyPeriod: raw.warrantyPeriod || null,
    packageWeight: raw.packageWeight ? Number(raw.packageWeight) : null,
    packageDimensions: raw.packageDimensions || null,
    videoUrl: raw.videoUrl || null,
    returnPolicy: raw.returnPolicy || null,
    categoryId: raw.categoryId,
    category: raw.category
      ? {
          id: raw.category.id,
          name: raw.category.name,
          slug: raw.category.slug,
          icon: raw.category.icon || null,
        }
      : undefined,
    retailer: raw.retailer
      ? {
          id: raw.retailer.id,
          name: raw.retailer.name,
          storeName: raw.retailer.storeName || null,
        }
      : undefined,
    createdAt: raw.createdAt ? new Date(raw.createdAt).toISOString() : undefined,
  }
}
