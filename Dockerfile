# ধাপ ১: ডিপেন্ডেন্সি ইনস্টল করার জন্য বেস ইমেজ
FROM node:18-alpine AS deps
WORKDIR /app

# প্যাকেজ ম্যানেজার অনুযায়ী ফাইলগুলো কপি করা (এখানে npm ব্যবহার করা হয়েছে)
COPY package.json package-lock.json ./
RUN npm ci

# ধাপ ২: প্রজেক্ট বিল্ড করার জন্য
FROM node:18-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Next.js টেলিমেন্ট্রি বন্ধ রাখতে চাইলে (ঐচ্ছিক)
ENV NEXT_TELEMETRY_DISABLED 1

RUN npm run build

# ধাপ ৩: প্রোডাকশনের জন্য রানটাইম ইমেজ
FROM node:18-alpine AS runner
WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# প্রয়োজনীয় ফাইল ও ফোল্ডারগুলো কপি করা
COPY --from=builder /app/public ./public

# আউটপুট ডিরেক্টরি পারমিশন সেটআপ
RUN mkdir .next
RUN chown nextjs:nodejs .next

# Standalone মোড ব্যবহার করলে ফাইল অপ্টিমাইজড হয়
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

# সার্ভার রান করার কমান্ড
CMD ["node", "server.js"]