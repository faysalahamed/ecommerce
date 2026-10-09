'use client'

import { useEffect, useState } from 'react'
import { useStore } from '@/lib/store'
import { ProductCard, type ProductFE } from '@/components/ecommerce/product-card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Flame, Zap, TrendingUp, Clock } from 'lucide-react'

const CATEGORY_ICONS: Record<string, string> = {
  laptop: '💻',
  shirt: '👕',
  sofa: '🛋️',
  smartphone: '📱',
  heart: '❤️',
  dumbbell: '🏋️',
  'shopping-cart': '🛒',
  book: '📚',
}

export function HomeView({ categories }: { categories: { id: string; name: string; icon: string | null }[] }) {
  const navigate = useStore((s) => s.navigate)
  const [flashSale, setFlashSale] = useState<ProductFE[]>([])
  const [featured, setFeatured] = useState<ProductFE[]>([])
  const [latest, setLatest] = useState<ProductFE[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true
    async function load() {
      setLoading(true)
      try {
        const [flashRes, featRes, latestRes] = await Promise.all([
          fetch('/api/products?flash=true&limit=10').then((r) => r.json()),
          fetch('/api/products?featured=true&limit=12').then((r) => r.json()),
          fetch('/api/products?sort=latest&limit=20').then((r) => r.json()),
        ])
        if (!mounted) return
        setFlashSale(flashRes.products || [])
        setFeatured(featRes.products || [])
        setLatest(latestRes.products || [])
      } finally {
        if (mounted) setLoading(false)
      }
    }
    load()
    return () => {
      mounted = false
    }
  }, [])

  // Flash sale countdown
  const [hours, setHours] = useState(12)
  const [mins, setMins] = useState(45)
  const [secs, setSecs] = useState(0)

  useEffect(() => {
    const t = setInterval(() => {
      setSecs((s) => {
        if (s > 0) return s - 1
        setMins((m) => {
          if (m > 0) return m - 1
          setHours((h) => (h > 0 ? h - 1 : 23))
          return 59
        })
        return 59
      })
    }, 1000)
    return () => clearInterval(t)
  }, [])

  return (
    <div className="container mx-auto px-3 py-6 space-y-8">
      {/* Hero banner */}
      <section className="grid grid-cols-1 lg:grid-cols-4 gap-3">
        <div className="lg:col-span-3 bg-gradient-to-r from-sky-500 to-cyan-500 text-white rounded-xl p-6 sm:p-10 min-h-[200px] flex flex-col justify-center">
          <span className="text-xs font-semibold uppercase tracking-wider opacity-90">Mega Bonanza</span>
          <h1 className="text-3xl sm:text-5xl font-bold mt-2 mb-3">Up to 70% OFF</h1>
          <p className="text-sm sm:text-base opacity-90 mb-4">
            Discover amazing deals across all categories — Electronics, Fashion, Home & more!
          </p>
          <div className="flex gap-2">
            <Button
              onClick={() => navigate({ name: 'search', query: 'sale' })}
              className="bg-white text-sky-600 hover:bg-gray-100"
            >
              Shop Now
            </Button>
          </div>
        </div>
        <div className="hidden lg:grid grid-rows-2 gap-3">
          <div className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white rounded-xl p-5 flex flex-col justify-center">
            <span className="text-xs opacity-90">New User</span>
            <h3 className="text-xl font-bold">৳200 Coupon</h3>
            <p className="text-xs opacity-90 mt-1">First order only</p>
          </div>
          <div className="bg-gradient-to-br from-green-500 to-emerald-600 text-white rounded-xl p-5 flex flex-col justify-center">
            <span className="text-xs opacity-90">Free Shipping</span>
            <h3 className="text-xl font-bold">Orders ৳1000+</h3>
            <p className="text-xs opacity-90 mt-1">Nationwide delivery</p>
          </div>
        </div>
      </section>

      {/* Categories grid */}
      <section>
        <h2 className="text-lg font-bold text-gray-800 mb-3">Shop by Category</h2>
        <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-3">
          {categories.map((c) => (
            <button
              key={c.id}
              onClick={() => navigate({ name: 'category', categoryId: c.id, categoryName: c.name })}
              className="flex flex-col items-center gap-1 p-3 bg-white border rounded-lg hover:border-sky-400 hover:shadow-md transition-all"
            >
              <span className="text-3xl">{c.icon ? CATEGORY_ICONS[c.icon] || '🛍️' : '🛍️'}</span>
              <span className="text-xs text-gray-700 text-center line-clamp-2">{c.name}</span>
            </button>
          ))}
        </div>
      </section>

      {/* Flash sale section */}
      {flashSale.length > 0 && (
        <section>
          <div className="bg-white rounded-xl p-4">
            <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <Zap className="h-6 w-6 text-red-500 fill-red-500" />
                <h2 className="text-xl font-bold text-gray-900">Flash Sale</h2>
                <div className="flex items-center gap-1 ml-2 bg-gray-900 text-white px-2 py-1 rounded text-sm font-mono">
                  <Clock className="h-3 w-3" />
                  <span>{String(hours).padStart(2, '0')}</span>:
                  <span>{String(mins).padStart(2, '0')}</span>:
                  <span>{String(secs).padStart(2, '0')}</span>
                </div>
              </div>
              <Button
                variant="link"
                className="text-sky-600"
                onClick={() => navigate({ name: 'search', query: 'flash' })}
              >
                Shop all →
              </Button>
            </div>
            {loading ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-72" />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                {flashSale.slice(0, 10).map((p) => (
                  <ProductCard key={p.id} product={p} />
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      {/* Featured products */}
      {featured.length > 0 && (
        <section>
          <div className="bg-white rounded-xl p-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-sky-500" />
                <h2 className="text-xl font-bold text-gray-900">Featured Products</h2>
              </div>
            </div>
            {loading ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                {Array.from({ length: 10 }).map((_, i) => (
                  <Skeleton key={i} className="h-72" />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                {featured.slice(0, 10).map((p) => (
                  <ProductCard key={p.id} product={p} />
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      {/* Latest products */}
      <section>
        <div className="bg-white rounded-xl p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Flame className="h-5 w-5 text-sky-500" />
              <h2 className="text-xl font-bold text-gray-900">Just For You</h2>
            </div>
          </div>
          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
              {Array.from({ length: 15 }).map((_, i) => (
                <Skeleton key={i} className="h-72" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
              {latest.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
