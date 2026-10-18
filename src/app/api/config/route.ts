import { NextRequest, NextResponse } from 'next/server'
import { isOtpEnabled } from '@/lib/config'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth'

// GET /api/config
// Returns public site configuration flags and banners
export async function GET() {
  let promoBanner: { title: string; tag?: string } | null = null

  try {
    const rows: any = await db.$queryRawUnsafe(
      `SELECT value FROM "SiteConfig" WHERE key = 'promo_banner' LIMIT 1`
    )
    if (rows && rows.length > 0 && rows[0]?.value) {
      try {
        const parsed = JSON.parse(rows[0].value)
        if (parsed && parsed.enabled) {
          promoBanner = {
            title: parsed.title,
            tag: parsed.tag || 'LIMITED TIME OFFER',
          }
        }
      } catch {
        promoBanner = { title: rows[0].value, tag: 'LIMITED TIME OFFER' }
      }
    }
  } catch {
    // If SiteConfig table is empty or error
  }

  return NextResponse.json({
    otpEnabled: isOtpEnabled(),
    promoBanner,
  })
}

// PUT /api/config — Admin only update site configuration
export async function PUT(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session || session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Only admins can update site config' }, { status: 403 })
    }

    const body = await req.json()
    const { key, value } = body

    if (!key) {
      return NextResponse.json({ error: 'Key is required' }, { status: 400 })
    }

    const stringVal = typeof value === 'string' ? value : JSON.stringify(value)

    await db.$executeRawUnsafe(
      `INSERT INTO "SiteConfig" (key, value, "createdAt", "updatedAt")
       VALUES ($1, $2, NOW(), NOW())
       ON CONFLICT (key) DO UPDATE SET value = $2, "updatedAt" = NOW()`,
      key,
      stringVal
    )

    return NextResponse.json({ ok: true, key, value })
  } catch (e) {
    console.error('Config update error:', e)
    return NextResponse.json({ error: 'Failed to update configuration' }, { status: 500 })
  }
}

// DELETE /api/config?key=promo_banner — Admin only remove configuration
export async function DELETE(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session || session.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Only admins can delete site config' }, { status: 403 })
    }

    const { searchParams } = new URL(req.url)
    const key = searchParams.get('key')
    if (!key) {
      return NextResponse.json({ error: 'Key is required' }, { status: 400 })
    }

    await db.$executeRawUnsafe(`DELETE FROM "SiteConfig" WHERE key = $1`, key)
    return NextResponse.json({ ok: true, removed: key })
  } catch (e) {
    console.error('Config delete error:', e)
    return NextResponse.json({ error: 'Failed to delete configuration' }, { status: 500 })
  }
}
