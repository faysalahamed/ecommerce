'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { useStore } from '@/lib/store'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { ProductCard, type ProductFE } from '@/components/ecommerce/product-card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Loader2, ArrowDown, CheckCircle2 } from 'lucide-react'

const PAGE_SIZE = 24 // Scalable batch size for 100k+ products

export function ProductListView({ initialQuery }: { initialQuery?: string }) {
  const view = useStore((s) => s.view)
  const navigate = useStore((s) => s.navigate)

  const [products, setProducts] = useState<ProductFE[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [hasMore, setHasMore] = useState(false)
  const [sort, setSort] = useState('latest')

  // Sentinel ref for infinite scroll intersection observer
  const sentinelRef = useRef<HTMLDivElement | null>(null)

  const categoryId = view.name === 'category' ? view.categoryId : undefined
  const categoryName = view.name === 'category' ? view.categoryName : undefined
  const brand = view.name === 'brand' ? view.brand : undefined
  const query = view.name === 'search' ? view.query : initialQuery

  const title = categoryName || (brand ? `Brand: ${brand}` : (query ? `Search: "${query}"` : 'All Products'))

  // Reset and load page 1 whenever filters or sort change
  useEffect(() => {
    let cancelled = false
    setPage(1)
    setProducts([])
    setLoading(true)

    void (async () => {
      const params = new URLSearchParams({
        page: '1',
        limit: String(PAGE_SIZE),
        sort,
      })
      if (categoryId) params.set('categoryId', categoryId)
      if (brand) params.set('brand', brand)
      if (query) params.set('search', query)

      try {
        const res = await fetch('/api/products?' + params.toString())
        const data = await res.json()
        if (cancelled) return

        const fetched = data.products || []
        setProducts(fetched)
        setTotal(data.total || fetched.length)
        setHasMore(data.hasMore !== undefined ? data.hasMore : fetched.length === PAGE_SIZE)
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [categoryId, brand, query, sort])

  // Load next page (lazy loading / infinite scrolling)
  const loadNextPage = useCallback(async () => {
    if (loading || loadingMore || !hasMore) return
    setLoadingMore(true)
    const nextPage = page + 1

    const params = new URLSearchParams({
      page: String(nextPage),
      limit: String(PAGE_SIZE),
      sort,
    })
    if (categoryId) params.set('categoryId', categoryId)
    if (brand) params.set('brand', brand)
    if (query) params.set('search', query)

    try {
      const res = await fetch('/api/products?' + params.toString())
      const data = await res.json()
      const newItems = data.products || []

      setProducts((prev) => {
        // Prevent duplicate IDs if any overlap occurs
        const existingIds = new Set(prev.map((p) => p.id))
        const filteredNew = newItems.filter((p: ProductFE) => !existingIds.has(p.id))
        return [...prev, ...filteredNew]
      })
      setPage(nextPage)
      setTotal(data.total || total)
      setHasMore(data.hasMore !== undefined ? data.hasMore : false)
    } finally {
      setLoadingMore(false)
    }
  }, [loading, loadingMore, hasMore, page, sort, categoryId, brand, query, total])

  // Automatic infinite scroll trigger via IntersectionObserver
  useEffect(() => {
    const sentinel = sentinelRef.current
    if (!sentinel) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading && !loadingMore) {
          loadNextPage()
        }
      },
      { rootMargin: '400px' } // Pre-fetch 400px before reaching bottom
    )

    observer.observe(sentinel)
    return () => observer.disconnect()
  }, [hasMore, loading, loadingMore, loadNextPage])

  const progressPercent = total > 0 ? Math.min(100, Math.round((products.length / total) * 100)) : 0

  return (
    <div className="container mx-auto px-3 py-6 space-y-4">
      {/* Top Header / Breadcrumb / Sorter */}
      <div className="flex items-center justify-between flex-wrap gap-3 pb-2 border-b border-gray-100">
        <div>
          <button
            onClick={() => navigate({ name: 'home' })}
            className="text-xs sm:text-sm text-gray-500 hover:text-sky-600"
          >
            Home /
          </button>
          <h1 className="text-lg sm:text-xl font-bold text-gray-900 inline-block ml-2">{title}</h1>
          <span className="text-xs text-gray-400 ml-2">
            ({total > 0 ? `${total} products` : '0 products'})
          </span>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-xs text-gray-500 hidden sm:block">
            Showing <span className="font-semibold text-gray-800">{products.length}</span> of{' '}
            <span className="font-semibold text-gray-800">{total}</span>
          </div>

          <Select value={sort} onValueChange={setSort}>
            <SelectTrigger className="w-36 sm:w-44 h-9 text-xs">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="latest">Latest</SelectItem>
              <SelectItem value="price-asc">Price: Low to High</SelectItem>
              <SelectItem value="price-desc">Price: High to Low</SelectItem>
              <SelectItem value="popular">Most Popular</SelectItem>
              <SelectItem value="rating">Top Rated</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Initial Page Loading Skeletons */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {Array.from({ length: 12 }).map((_, i) => (
            <Skeleton key={i} className="h-72 rounded-lg" />
          ))}
        </div>
      ) : products.length === 0 ? (
        <div className="text-center py-16 text-gray-500 space-y-3">
          <p className="text-lg font-semibold text-gray-800">No products found</p>
          <p className="text-xs text-gray-400 max-w-sm mx-auto">
            Try adjusting your search keywords, clear filters, or browse other categories.
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate({ name: 'home' })}
            className="text-xs border-sky-500 text-sky-600 hover:bg-sky-50"
          >
            Return to Homepage
          </Button>
        </div>
      ) : (
        <>
          {/* Products Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {products.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>

          {/* Skeletons when lazily loading more */}
          {loadingMore && (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 pt-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={`more-skeleton-${i}`} className="h-72 rounded-lg animate-pulse" />
              ))}
            </div>
          )}

          {/* Lazy Loading Sentinel Target (triggers intersection observer) */}
          <div ref={sentinelRef} className="h-6" />

          {/* Footer Pagination Progress & Manual Button */}
          <div className="py-6 flex flex-col items-center justify-center space-y-2 border-t border-gray-100">
            <div className="text-xs text-gray-500 flex items-center gap-1.5">
              <span>Showing {products.length} of {total} products</span>
              <span className="text-gray-300">&bull;</span>
              <span>{progressPercent}% viewed</span>
            </div>

            {/* Mini Progress Bar */}
            <div className="w-48 h-1.5 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-sky-600 transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>

            {hasMore ? (
              <Button
                variant="outline"
                size="sm"
                onClick={loadNextPage}
                disabled={loadingMore}
                className="mt-2 text-xs h-9 px-6 border-sky-500 text-sky-600 hover:bg-sky-50 font-semibold"
              >
                {loadingMore ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> Loading more products...
                  </>
                ) : (
                  <>
                    <ArrowDown className="h-3.5 w-3.5 mr-1.5" /> Load More Products
                  </>
                )}
              </Button>
            ) : (
              <div className="text-xs text-gray-400 flex items-center gap-1 pt-2">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                <span>You have viewed all {total} products</span>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
