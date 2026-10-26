'use client'

import { useEffect, useState } from 'react'
import { useStore } from '@/lib/store'
import { ProductCard, type ProductFE } from '@/components/ecommerce/product-card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Flame, Zap, TrendingUp, Clock, ChevronRight, Gift, Truck, Sparkles } from 'lucide-react'
import { HeroSlider } from '@/components/ecommerce/hero-slider'
import { getInterestCategoryIds, getInterestBrands } from '@/lib/browsing-history'

const CATEGORY_ICONS: Record<string, string> = {
  laptop: '💻',
  shirt: '👕',
  sofa: '🛋️',
  smartphone: '📱',
  heart: '❤️',
  dumbbell: '🏋️',
  'shopping-cart': '🛒',
  book: '📚',
  watch: '⌚',
  gamepad: '🎮',
  baby: '🍼',
  utensils: '🍳',
  car: '🚗',
  sparkles: '💎',
  tag: '🏷️',
}

export interface FlashSaleConfig {
  enabled: boolean
  title: string
  startTime: string
  endTime: string
  discountNote?: string
}

export function HomeView({
  categories,
}: {
  categories: { id: string; name: string; icon: string | null }[]
}) {
  const navigate = useStore((s) => s.navigate)
  const [flashSale, setFlashSale] = useState<ProductFE[]>([])
  const [featured, setFeatured] = useState<ProductFE[]>([])
  const [latest, setLatest] = useState<ProductFE[]>([])
  const [isPersonalized, setIsPersonalized] = useState(false)
  const [loading, setLoading] = useState(true)
  const [visibleCount, setVisibleCount] = useState(18) // Multiples of 6 for clean 6-column rows

  // Parameterized Flash Sale configuration state
  const [flashConfig, setFlashConfig] = useState<FlashSaleConfig | null>(null)
  const [flashStatus, setFlashStatus] = useState<'ACTIVE' | 'UPCOMING' | 'EXPIRED' | 'DISABLED'>('ACTIVE')
  const [timerValues, setTimerValues] = useState<{ hours: number; mins: number; secs: number }>({
    hours: 0,
    mins: 0,
    secs: 0,
  })

  useEffect(() => {
    let mounted = true
    async function load() {
      setLoading(true)
      try {
        const clientCategoryIds = getInterestCategoryIds().slice(0, 5).join(',')
        const clientBrands = getInterestBrands().slice(0, 5).join(',')

        const recoUrl = `/api/recommendations?limit=36${
          clientCategoryIds ? `&categories=${encodeURIComponent(clientCategoryIds)}` : ''
        }${clientBrands ? `&brands=${encodeURIComponent(clientBrands)}` : ''}`

        const [flashRes, featRes, recoRes, cfgRes] = await Promise.all([
          fetch('/api/products?flash=true&limit=12').then((r) => r.json()).catch(() => ({ products: [] })),
          fetch('/api/products?featured=true&limit=12').then((r) => r.json()).catch(() => ({ products: [] })),
          fetch(recoUrl).then((r) => r.json()).catch(() => ({ products: [] })),
          fetch('/api/config').then((r) => r.json()).catch(() => ({})),
        ])
        if (!mounted) return
        setFlashSale(flashRes.products || [])
        setFeatured(featRes.products || [])
        setLatest(recoRes.products || [])
        setIsPersonalized(Boolean(recoRes.personalized))
        if (cfgRes?.flashSaleConfig) {
          setFlashConfig(cfgRes.flashSaleConfig)
        }
      } finally {
        if (mounted) setLoading(false)
      }
    }
    load()
    return () => {
      mounted = false
    }
  }, [])

  // Real-time countdown calculation based on parameterized startTime and endTime
  useEffect(() => {
    if (!flashConfig) return

    const updateTimer = () => {
      if (!flashConfig.enabled) {
        setFlashStatus('DISABLED')
        return
      }

      const now = Date.now()
      const start = new Date(flashConfig.startTime).getTime()
      const end = new Date(flashConfig.endTime).getTime()

      if (now < start) {
        setFlashStatus('UPCOMING')
        const diff = Math.max(0, start - now)
        setTimerValues({
          hours: Math.floor(diff / (1000 * 60 * 60)),
          mins: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
          secs: Math.floor((diff % (1000 * 60)) / 1000),
        })
      } else if (now >= end) {
        setFlashStatus('EXPIRED')
        setTimerValues({ hours: 0, mins: 0, secs: 0 })
      } else {
        setFlashStatus('ACTIVE')
        const diff = Math.max(0, end - now)
        setTimerValues({
          hours: Math.floor(diff / (1000 * 60 * 60)),
          mins: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
          secs: Math.floor((diff % (1000 * 60)) / 1000),
        })
      }
    }

    updateTimer()
    const interval = setInterval(updateTimer, 1000)
    return () => clearInterval(interval)
  }, [flashConfig])

  return (
    <div className="max-w-[1200px] mx-auto px-3 sm:px-4 py-4 sm:py-6 space-y-6 sm:space-y-8">
      {/* 1. Hero Carousel + Side Value Banners */}
      <section className="grid grid-cols-1 lg:grid-cols-4 gap-3 sm:gap-4 items-stretch">
        <div className="lg:col-span-3">
          <HeroSlider />
        </div>
        <div className="hidden lg:grid grid-rows-2 gap-3 h-full">
          <div className="bg-gradient-to-br from-sky-600 to-cyan-600 text-white rounded-xl p-5 flex flex-col justify-between shadow-xs hover:shadow-md transition">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider bg-white/20 backdrop-blur px-2 py-0.5 rounded-full">
                New User Bonus
              </span>
              <Gift className="h-5 w-5 text-sky-200" />
            </div>
            <div>
              <h3 className="text-2xl font-black leading-tight">৳200 OFF</h3>
              <p className="text-xs text-sky-100 mt-1">On your first marketplace purchase</p>
            </div>
            <button
              onClick={() => navigate({ name: 'search', query: 'featured' })}
              className="text-xs font-bold text-sky-900 bg-white hover:bg-sky-50 px-3 py-1.5 rounded-md self-start transition shadow-2xs"
            >
              Claim Voucher &rarr;
            </button>
          </div>

          <div className="bg-gradient-to-br from-sky-800 to-sky-950 text-white rounded-xl p-5 flex flex-col justify-between shadow-xs hover:shadow-md transition">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider bg-white/20 backdrop-blur px-2 py-0.5 rounded-full">
                Nationwide
              </span>
              <Truck className="h-5 w-5 text-sky-300" />
            </div>
            <div>
              <h3 className="text-xl font-black leading-tight">Free Delivery</h3>
              <p className="text-xs text-sky-200 mt-1">On orders over ৳1,000</p>
            </div>
            <button
              onClick={() => navigate({ name: 'search', query: 'deals' })}
              className="text-xs font-bold text-sky-900 bg-sky-200 hover:bg-white px-3 py-1.5 rounded-md self-start transition shadow-2xs"
            >
              Shop Deals &rarr;
            </button>
          </div>
        </div>
      </section>

      {/* 2. Categories Grid (Daraz Style: Clean square cards) */}
      <section className="bg-white rounded-xl p-4 sm:p-5 shadow-xs border border-gray-100">
        <div className="flex items-center justify-between mb-3.5">
          <h2 className="text-base sm:text-lg font-bold text-gray-900">Categories</h2>
          <span className="text-xs text-gray-400 hidden sm:inline">Explore top shopping categories</span>
        </div>
        <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-8 gap-2 sm:gap-3">
          {categories.slice(0, 16).map((c) => (
            <button
              key={c.id}
              onClick={() => navigate({ name: 'category', categoryId: c.id, categoryName: c.name })}
              className="group flex flex-col items-center justify-center p-2.5 sm:p-3 bg-gray-50/60 hover:bg-white border border-gray-100 hover:border-sky-300 hover:shadow-xs rounded-lg transition-all text-center aspect-square"
            >
              <span className="text-2xl sm:text-3xl mb-1.5 group-hover:scale-110 transition-transform">
                {c.icon ? CATEGORY_ICONS[c.icon] || c.icon || '🛍️' : '🛍️'}
              </span>
              <span className="text-[11px] sm:text-xs text-gray-700 font-medium line-clamp-1 group-hover:text-sky-600 transition-colors">
                {c.name}
              </span>
            </button>
          ))}
        </div>
      </section>

      {/* 3. Flash Sale Section (Daraz Signature: 6-in-grid, Parameterized Timer & Link) */}
      {flashSale.length > 0 && flashConfig?.enabled && (flashStatus === 'ACTIVE' || flashStatus === 'UPCOMING') && (
        <section className="bg-white rounded-xl p-4 sm:p-5 shadow-xs border border-gray-100">
          <div className="flex items-center justify-between mb-4 flex-wrap gap-2 pb-3 border-b border-gray-100">
            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex items-center gap-1.5">
                <Zap className="h-5 w-5 text-sky-600 fill-sky-600" />
                <h2 className="text-base sm:text-lg font-bold text-gray-900">
                  {flashConfig.title || 'Flash Sale'}
                </h2>
              </div>
              <span className="text-xs font-semibold text-sky-600 bg-sky-50 px-2 py-0.5 rounded-full">
                {flashStatus === 'ACTIVE' ? (flashConfig.discountNote || 'On Sale Now') : 'Starts Soon'}
              </span>
              <div className="flex items-center gap-1.5 text-xs text-gray-500 font-medium ml-1 sm:ml-4">
                <span className="hidden sm:inline">
                  {flashStatus === 'ACTIVE' ? 'Ending in' : 'Starts in'}
                </span>
                <div className="flex items-center gap-1 font-mono text-[11px] text-white">
                  <span className="bg-gray-900 px-1.5 py-0.5 rounded font-bold">
                    {String(timerValues.hours).padStart(2, '0')}
                  </span>
                  <span className="text-gray-900 font-bold">:</span>
                  <span className="bg-gray-900 px-1.5 py-0.5 rounded font-bold">
                    {String(timerValues.mins).padStart(2, '0')}
                  </span>
                  <span className="text-gray-900 font-bold">:</span>
                  <span className="bg-gray-900 px-1.5 py-0.5 rounded font-bold">
                    {String(timerValues.secs).padStart(2, '0')}
                  </span>
                </div>
              </div>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate({ name: 'search', query: 'flash' })}
              className="text-xs font-bold text-sky-600 border-sky-600 hover:bg-sky-50 h-8 px-3"
            >
              SHOP MORE <ChevronRight className="h-3 w-3 ml-0.5" />
            </Button>
          </div>

          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5 sm:gap-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-64 rounded-lg" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5 sm:gap-3">
              {flashSale.slice(0, 12).map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          )}
        </section>
      )}

      {/* 4. Featured Products (Daraz Style: 6-in-grid) */}
      {featured.length > 0 && (
        <section className="bg-white rounded-xl p-4 sm:p-5 shadow-xs border border-gray-100">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-sky-600" />
              <h2 className="text-base sm:text-lg font-bold text-gray-900">Featured Products</h2>
            </div>
            <button
              onClick={() => navigate({ name: 'search', query: 'featured' })}
              className="text-xs font-bold text-sky-600 hover:text-sky-700 hover:underline flex items-center gap-0.5"
            >
              See All <ChevronRight className="h-3 w-3" />
            </button>
          </div>

          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5 sm:gap-3">
              {Array.from({ length: 12 }).map((_, i) => (
                <Skeleton key={i} className="h-64 rounded-lg" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5 sm:gap-3">
              {featured.slice(0, 12).map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          )}
        </section>
      )}

      {/* 5. "Just For You" Catalog Grid (Daraz Signature: 6-in-grid, Centered Load More) */}
      <section className="space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <Flame className="h-5 w-5 text-sky-600" />
            <h2 className="text-base sm:text-lg font-bold text-gray-900">Just For You</h2>
            {isPersonalized && (
              <span className="text-[10px] font-semibold text-sky-700 bg-sky-50 px-2 py-0.5 rounded-full border border-sky-200 flex items-center gap-1">
                <Sparkles className="h-3 w-3 text-sky-600" /> Personalized for you
              </span>
            )}
          </div>
          <span className="text-xs text-gray-400 hidden sm:inline">Personalized recommendations for you</span>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5 sm:gap-3">
            {Array.from({ length: 18 }).map((_, i) => (
              <Skeleton key={i} className="h-64 rounded-lg" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5 sm:gap-3">
            {latest.slice(0, visibleCount).map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}

        {/* Load More Button (Centered, Daraz style) */}
        {!loading && visibleCount < latest.length && (
          <div className="flex justify-center pt-3 pb-2">
            <Button
              variant="outline"
              onClick={() => setVisibleCount((prev) => prev + 12)}
              className="border-2 border-sky-600 text-sky-600 hover:bg-sky-600 hover:text-white font-bold text-xs uppercase tracking-wider px-10 h-10 rounded-md transition-all shadow-xs"
            >
              Load More
            </Button>
          </div>
        )}
      </section>
    </div>
  )
}
