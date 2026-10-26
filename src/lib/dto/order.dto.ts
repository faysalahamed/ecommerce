import { z } from 'zod'

// ==========================================
// Order Input Validation Schemas (Request DTOs)
// ==========================================

export const CreateOrderItemSchema = z.object({
  productId: z.string().min(1, 'Product ID is required'),
  quantity: z.coerce.number().int().positive('Quantity must be at least 1'),
})

export const CreateOrderSchema = z.object({
  items: z.array(CreateOrderItemSchema).min(1, 'Order must contain at least one item'),
  recipientName: z.string().min(2, 'Recipient name is required'),
  phone: z.string().min(8, 'Valid phone number is required'),
  address: z.string().min(5, 'Delivery address is required'),
  paymentMethod: z.enum(['COD', 'BKASH', 'NAGAD', 'CARD']).default('COD'),
})

export type CreateOrderInput = z.infer<typeof CreateOrderSchema>

export const UpdateOrderSchema = z.object({
  orderId: z.string().min(1, 'Order ID is required'),
  status: z.enum(['PENDING', 'CONFIRMED', 'SHIPPED', 'DELIVERED', 'CANCELLED']).optional(),
  paymentStatus: z.enum(['UNPAID', 'PAID', 'FAILED', 'REFUNDED']).optional(),
})

export type UpdateOrderInput = z.infer<typeof UpdateOrderSchema>

// ==========================================
// Order Output Projections (Response DTOs)
// ==========================================

export interface OrderItemDTO {
  id: string
  productId: string
  name: string
  price: number
  quantity: number
  image: string
}

export interface OrderUserSummaryDTO {
  name: string
  email?: string | null
  phone?: string | null
  address?: string | null
}

export interface OrderDTO {
  id: string
  orderNumber: string
  subtotal: number
  shipping: number
  total: number
  status: 'PENDING' | 'CONFIRMED' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED'
  paymentStatus: 'UNPAID' | 'PAID' | 'FAILED' | 'REFUNDED'
  paymentMethod: string
  paymentRef?: string | null
  recipientName: string
  phone: string
  address: string
  createdAt: string
  items?: OrderItemDTO[]
  user?: OrderUserSummaryDTO
}

export function toOrderDTO(raw: any): OrderDTO {
  return {
    id: raw.id,
    orderNumber: raw.orderNumber,
    subtotal: Number(raw.subtotal),
    shipping: Number(raw.shipping),
    total: Number(raw.total),
    status: raw.status,
    paymentStatus: raw.paymentStatus,
    paymentMethod: raw.paymentMethod,
    paymentRef: raw.paymentRef || null,
    recipientName: raw.recipientName,
    phone: raw.phone,
    address: raw.address,
    createdAt: new Date(raw.createdAt).toISOString(),
    items: raw.items?.map((it: any) => ({
      id: it.id,
      productId: it.productId,
      name: it.name,
      price: Number(it.price),
      quantity: Number(it.quantity),
      image: it.image || '',
    })),
    user: raw.user
      ? {
          name: raw.user.name,
          email: raw.user.email || null,
          phone: raw.user.phone || null,
          address: raw.user.address || null,
        }
      : undefined,
  }
}
