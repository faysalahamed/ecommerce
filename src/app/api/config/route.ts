import { NextRequest, NextResponse } from 'next/server'
import { isOtpEnabled } from '@/lib/config'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth'
import { HERO_SLIDES } from '@/lib/brand'

// GET /api/config
// Returns public site configuration flags, banners, delivery settings, hero slider slides, and parameterized flash sale config
export async function GET() {
  let promoBanner: { title: string; tag?: string } | null = null
  let deliveryConfig: any = null
  let heroSlides: any = null
  let flashSaleConfig: {
    enabled: boolean
    title: string
    startTime: string
    endTime: string
    discountNote?: string
  } | null = null

  try {
    const rows: any = await db.$queryRawUnsafe(
      `SELECT key, value FROM "SiteConfig" WHERE key IN ('promo_banner', 'delivery_config', 'hero_slides', 'flash_sale_config')`
    )
    if (rows && rows.length > 0) {
      for (const row of rows) {
        if (row.key === 'promo_banner' && row.value) {
          try {
            const parsed = JSON.parse(row.value)
            if (parsed && parsed.enabled) {
              promoBanner = {
                title: parsed.title,
                tag: parsed.tag || 'LIMITED TIME OFFER',
              }
            }
          } catch {
            promoBanner = { title: row.value, tag: 'LIMITED TIME OFFER' }
          }
        }
        if (row.key === 'delivery_config' && row.value) {
          try {
            deliveryConfig = JSON.parse(row.value)
          } catch {
            // fallback
          }
        }
        if (row.key === 'hero_slides' && row.value) {
          try {
            const parsed = JSON.parse(row.value)
            if (Array.isArray(parsed) && parsed.length > 0) {
              heroSlides = parsed
            }
          } catch {
            // fallback
          }
        }
        if (row.key === 'flash_sale_config' && row.value) {
          try {
            const parsed = JSON.parse(row.value)
            if (parsed && typeof parsed === 'object') {
              flashSaleConfig = {
                enabled: parsed.enabled !== undefined ? Boolean(parsed.enabled) : true,
                title: parsed.title || 'Flash Sale',
                startTime: parsed.startTime || new Date(Date.now() - 3600 * 1000).toISOString(),
                endTime: parsed.endTime || new Date(Date.now() + 86400 * 1000 * 2).toISOString(),
                discountNote: parsed.discountNote || 'On Sale Now',
              }
            }
          } catch {
            // fallback
          }
        }
      }
    }
  } catch {
    // If SiteConfig table is empty or error
  }

  // Default fallback if not yet customized
  const defaultFlashSaleConfig = {
    enabled: true,
    title: 'Flash Sale',
    startTime: new Date(Date.now() - 3600 * 1000).toISOString(),
    endTime: new Date(Date.now() + 86400 * 1000 * 2).toISOString(),
    discountNote: 'On Sale Now',
  }

  return NextResponse.json({
    otpEnabled: isOtpEnabled(),
    promoBanner,
    deliveryConfig,
    heroSlides: heroSlides || HERO_SLIDES,
    flashSaleConfig: flashSaleConfig || defaultFlashSaleConfig,
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
