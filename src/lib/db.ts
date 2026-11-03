import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
  prismaWarmedUp: boolean | undefined
}

function createPrismaClient() {
  const connectionString = process.env.DATABASE_URL
  const adapter = new PrismaPg({ connectionString })
  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  })
}

export const db = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db

// Warm up the DB connection pool on startup so the first user query
// doesn't pay the ~200-500ms connection establishment overhead.
if (!globalForPrisma.prismaWarmedUp) {
  globalForPrisma.prismaWarmedUp = true
  db.$queryRawUnsafe('SELECT 1').catch(() => {})
}