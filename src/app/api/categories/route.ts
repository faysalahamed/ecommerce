import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  const categories = await db.category.findMany({
    include: { children: true },
    orderBy: { name: 'asc' },
  })
  // Return top-level categories with their children
  const roots = categories.filter((c) => !c.parentId)
  return NextResponse.json({ categories: roots })
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { name, parentId, icon } = body
  if (!name) return NextResponse.json({ error: 'Name required' }, { status: 400 })

  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + Date.now().toString(36).slice(-4)
  const category = await db.category.create({
    data: { name, slug, parentId: parentId || null, icon: icon || null },
  })
  return NextResponse.json({ category })
}
