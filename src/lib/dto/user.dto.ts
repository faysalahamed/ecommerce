import { z } from 'zod'

// ==========================================
// User Input Validation Schemas (Request DTOs)
// ==========================================

export const LoginSchema = z.object({
  phoneOrEmail: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().optional(),
  password: z.string().min(1, 'Password is required'),
}).refine(
  (data) => Boolean(data.phoneOrEmail || data.phone || data.email),
  { message: 'Phone number or email is required', path: ['phoneOrEmail'] }
)

export type LoginInput = z.infer<typeof LoginSchema>

export const RegisterSchema = z.object({
  phone: z
    .string()
    .min(10, 'Valid phone number is required (at least 10 digits)')
    .max(20, 'Phone number too long'),
  name: z
    .string()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name cannot exceed 100 characters'),
  password: z
    .string()
    .min(6, 'Password must be at least 6 characters')
    .max(100, 'Password cannot exceed 100 characters'),
  email: z
    .string()
    .email('Invalid email address')
    .optional()
    .or(z.literal(''))
    .nullable(),
  role: z
    .enum(['CUSTOMER', 'RETAILER', 'ADMIN'])
    .optional()
    .default('CUSTOMER'),
  storeName: z.string().max(100).optional().nullable(),
  otpVerified: z.boolean().optional(),
})

export type RegisterInput = z.infer<typeof RegisterSchema>

export const SendOtpSchema = z.object({
  phone: z
    .string()
    .min(10, 'Valid phone number required')
    .max(20, 'Phone number too long'),
  purpose: z.enum(['REGISTER', 'RESET_PASSWORD', 'LOGIN']),
})

export type SendOtpInput = z.infer<typeof SendOtpSchema>

export const UpdateUserRoleSchema = z.object({
  userId: z.string().min(1, 'User ID is required'),
  role: z.enum(['ADMIN', 'RETAILER', 'CUSTOMER']),
})

export type UpdateUserRoleInput = z.infer<typeof UpdateUserRoleSchema>

// ==========================================
// User Output Projections (Response DTOs)
// ==========================================

/**
 * Public User DTO.
 * Explicitly omits sensitive fields such as `password`.
 */
export interface UserDTO {
  id: string
  phone: string
  email: string | null
  name: string
  role: 'ADMIN' | 'RETAILER' | 'CUSTOMER'
  phoneVerified?: boolean
  address?: string | null
  storeName?: string | null
  avatar?: string | null
  createdAt?: string
}

export function toUserDTO(user: {
  id: string
  phone: string
  email?: string | null
  name: string
  role: string
  phoneVerified?: boolean | null
  address?: string | null
  storeName?: string | null
  avatar?: string | null
  createdAt?: Date | string
}): UserDTO {
  return {
    id: user.id,
    phone: user.phone,
    email: user.email || null,
    name: user.name,
    role: (['ADMIN', 'RETAILER', 'CUSTOMER'].includes(user.role)
      ? user.role
      : 'CUSTOMER') as 'ADMIN' | 'RETAILER' | 'CUSTOMER',
    phoneVerified: Boolean(user.phoneVerified),
    address: user.address || null,
    storeName: user.storeName || null,
    avatar: user.avatar || null,
    createdAt: user.createdAt
      ? typeof user.createdAt === 'string'
        ? user.createdAt
        : user.createdAt.toISOString()
      : undefined,
  }
}
