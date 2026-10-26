import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth'
import { UpdateUserRoleSchema, toUserDTO } from '@/lib/dto'
import { successResponse, errorResponse, validationErrorResponse } from '@/lib/api-response'

export async function GET() {
  try {
    const session = await getSession()
    if (!session || session.role !== 'ADMIN') {
      return errorResponse('Admin access required', 403)
    }
    const users = await db.user.findMany({
      select: {
        id: true,
        email: true,
        phone: true,
        name: true,
        role: true,
        phoneVerified: true,
        storeName: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    })
    return successResponse({
      users: users.map(toUserDTO),
    })
  } catch (e) {
    console.error('Admin users GET error:', e)
    return errorResponse('Failed to fetch users', 500)
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session || session.role !== 'ADMIN') {
      return errorResponse('Admin access required', 403)
    }

    const body = await req.json().catch(() => ({}))
    const validation = UpdateUserRoleSchema.safeParse(body)
    if (!validation.success) {
      return validationErrorResponse(validation.error)
    }

    const { userId, role } = validation.data
    const updated = await db.user.update({
      where: { id: userId },
      data: { role },
      select: {
        id: true,
        email: true,
        phone: true,
        name: true,
        role: true,
        phoneVerified: true,
        storeName: true,
        createdAt: true,
      },
    })

    return successResponse({
      user: toUserDTO(updated),
    })
  } catch (e) {
    console.error('Admin users PUT error:', e)
    return errorResponse('Failed to update user role', 500)
  }
}
