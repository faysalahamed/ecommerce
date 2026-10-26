import { NextRequest } from 'next/server'

interface RateLimitRecord {
  timestamps: number[]
}

// In-memory sliding-window store
const rateLimitStore = new Map<string, RateLimitRecord>()

// Periodically clean up entries older than 10 minutes to prevent memory leak
const CLEANUP_INTERVAL_MS = 5 * 60 * 1000
let lastCleanup = Date.now()

function cleanupExpired() {
  const now = Date.now()
  if (now - lastCleanup < CLEANUP_INTERVAL_MS) return
  lastCleanup = now

  const cutoff = now - 10 * 60 * 1000
  for (const [key, record] of rateLimitStore.entries()) {
    record.timestamps = record.timestamps.filter((t) => t > cutoff)
    if (record.timestamps.length === 0) {
      rateLimitStore.delete(key)
    }
  }
}

/**
 * Extracts best-guess client IP address from Next.js request headers.
 */
export function getClientIp(req: NextRequest): string {
  const forwarded = req.headers.get('x-forwarded-for')
  if (forwarded) {
    // x-forwarded-for can be a comma-separated list of IPs
    const firstIp = forwarded.split(',')[0].trim()
    if (firstIp) return firstIp
  }
  const realIp = req.headers.get('x-real-ip')
  if (realIp) return realIp.trim()
  return '127.0.0.1'
}

export interface RateLimitResult {
  success: boolean
  limit: number
  remaining: number
  resetSeconds: number
}

/**
 * Sliding-window rate limit checker.
 *
 * @param key unique bucket key (e.g. `login:192.168.1.1` or `otp:8801700000001`)
 * @param limit maximum allowed requests within window
 * @param windowSeconds time window in seconds
 */
export function checkRateLimit(
  key: string,
  limit: number,
  windowSeconds: number
): RateLimitResult {
  cleanupExpired()

  const now = Date.now()
  const windowMs = windowSeconds * 1000
  const windowStart = now - windowMs

  let record = rateLimitStore.get(key)
  if (!record) {
    record = { timestamps: [] }
    rateLimitStore.set(key, record)
  }

  // Filter timestamps within current sliding window
  record.timestamps = record.timestamps.filter((t) => t > windowStart)

  if (record.timestamps.length >= limit) {
    const oldestTimestamp = record.timestamps[0]
    const resetSeconds = Math.max(1, Math.ceil((oldestTimestamp + windowMs - now) / 1000))
    return {
      success: false,
      limit,
      remaining: 0,
      resetSeconds,
    }
  }

  // Record this hit
  record.timestamps.push(now)

  return {
    success: true,
    limit,
    remaining: limit - record.timestamps.length,
    resetSeconds: windowSeconds,
  }
}
