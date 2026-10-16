import { NextResponse } from 'next/server'
import { isOtpEnabled } from '@/lib/config'

// GET /api/config
// Returns public configuration flags the frontend needs to render correctly.
// Safe to call without auth — only non-secret flags are exposed.
export async function GET() {
  return NextResponse.json({
    otpEnabled: isOtpEnabled(),
    // brand name etc. could go here too if needed
  })
}
