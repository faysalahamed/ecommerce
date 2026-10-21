# ধাপ ১: ডিপেন্ডেন্সি ইনস্টল করার জন্য বেস ইমেজ
FROM node:22-alpine AS deps
WORKDIR /app

COPY package.json package-lock.json* ./
# Prisma schema কপি করা যেন postinstall / deps ধাপেই এটি ব্যবহার করা যায়
COPY prisma ./prisma/

RUN if [ -f package-lock.json ]; then npm ci; else npm install; fi

# ধাপ ২: প্রজেক্ট বিল্ড করার জন্য
FROM node:22-alpine AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Next.js টেলিমেন্ট্রি বন্ধ রাখা
ENV NEXT_TELEMETRY_DISABLED=1

# Prisma client জেনারেট করা
RUN npx prisma generate

# প্রজেক্ট বিল্ড করা
RUN npm run build

# ধাপ ৩: প্রোডাকশনের জন্য রানটাইম ইমেজ
FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public

RUN mkdir .next
RUN chown nextjs:nodejs .next

# Standalone আউটপুট কপি করা
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

CMD ["node", "server.js"]
