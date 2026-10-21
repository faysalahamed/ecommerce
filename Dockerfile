# ধাপ ১: ডিপেন্ডেন্সি ইনস্টল করার জন্য বেস ইমেজ
FROM node:18-alpine AS deps
WORKDIR /app

# package.json এবং package-lock.json কপি করা
COPY package.json package-lock.json* ./

# npm ci ব্যবহার করতে package-lock.json প্রয়োজন। যদি কোনো কারণে ফাইলটি না থাকে, তবে npm i চলবে।
RUN if [ -f package-lock.json ]; then npm ci; else npm install; fi

# ধাপ ২: প্রজেক্ট বিল্ড করার জন্য
FROM node:18-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Next.js টেলিমেন্ট্রি বন্ধ রাখা
ENV NEXT_TELEMETRY_DISABLED=1

RUN npm run build

# ধাপ ৩: প্রোডাকশনের জন্য রানটাইম ইমেজ
FROM node:18-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# প্রয়োজনীয় ফাইল ও ফোল্ডার কপি করা
COPY --from=builder /app/public ./public

# .next ফোল্ডার তৈরি ও পারমিশন সেটআপ
RUN mkdir .next
RUN chown nextjs:nodejs .next

# Standalone আউটপুট কপি করা
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

# সার্ভার রান করার কমান্ড
CMD ["node", "server.js"]