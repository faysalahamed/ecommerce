import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'

// POST /api/upload — upload image files (RETAILER or ADMIN)
export async function POST(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (!['RETAILER', 'ADMIN'].includes(session.role)) {
      return NextResponse.json({ error: 'Only retailers and admins can upload images' }, { status: 403 })
    }

    const formData = await req.formData()
    const files = formData.getAll('files') as File[]

    if (!files || files.length === 0) {
      return NextResponse.json({ error: 'No files provided' }, { status: 400 })
    }

    const uploadDir = path.join(process.cwd(), 'public', 'uploads')
    await mkdir(uploadDir, { recursive: true })

    const urls: string[] = []

    for (const file of files) {
      // Validate file type
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
      if (!validTypes.includes(file.type)) {
        return NextResponse.json(
          { error: `Invalid file type: ${file.type}. Supported: JPG, PNG, WebP, GIF` },
          { status: 400 }
        )
      }

      // Validate file size (max 6MB)
      if (file.size > 6 * 1024 * 1024) {
        return NextResponse.json(
          { error: `File too large: ${file.name}. Max size is 6MB` },
          { status: 400 }
        )
      }

      // Generate unique filename
      const ext = file.name.split('.').pop() || 'jpg'
      const uniqueName = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${ext}`
      const filePath = path.join(uploadDir, uniqueName)

      // Write file
      const bytes = await file.arrayBuffer()
      const buffer = Buffer.from(bytes)
      await writeFile(filePath, buffer)

      urls.push(`/uploads/${uniqueName}`)
    }

    return NextResponse.json({ urls })
  } catch (e) {
    console.error('Upload error:', e)
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 })
  }
}
