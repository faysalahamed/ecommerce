import { NextResponse } from 'next/server'
import { z } from 'zod'

export interface FieldError {
  field: string
  message: string
}

export interface ApiEnvelope<T = unknown> {
  success: boolean
  data?: T
  error?: string
  errors?: FieldError[]
  meta?: Record<string, unknown>
}

/**
 * Standard successful API response.
 * Merges data at top-level for backwards compatibility with existing frontend calls,
 * while also including `success: true` and standardized structure.
 */
export function successResponse<T extends Record<string, unknown>>(
  data: T,
  status = 200,
  meta?: Record<string, unknown>
) {
  const payload = {
    success: true,
    ...data,
    ...(meta ? { meta } : {}),
  }
  return NextResponse.json(payload, { status })
}

/**
 * Standard error response.
 */
export function errorResponse(message: string, status = 400, errors?: FieldError[]) {
  return NextResponse.json(
    {
      success: false,
      error: message,
      ...(errors && errors.length > 0 ? { errors } : {}),
    },
    { status }
  )
}

/**
 * Zod validation error response (analogous to Spring Boot's MethodArgumentNotValidException handler).
 */
export function validationErrorResponse(zodError: z.ZodError) {
  const errors: FieldError[] = zodError.issues.map((issue) => ({
    field: issue.path.join('.'),
    message: issue.message,
  }))

  const primaryMessage = errors[0]?.message || 'Input validation failed'

  return NextResponse.json(
    {
      success: false,
      error: primaryMessage,
      errors,
    },
    { status: 422 }
  )
}
