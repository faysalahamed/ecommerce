'use client'

import { useEffect, useState } from 'react'
import { useStore } from '@/lib/store'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { ProductCard, type ProductFE } from '@/components/ecommerce/product-card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

export function ProductListView({ initialQuery }: { initialQuery?: string }) {
  const view = useStore((s) => s.view)
  const navigate = useStore((s) => s.navigate)
  const [products, setProducts] = useState<ProductFE[]>([])
  const [loading, setLoading] = useState(true)
  const [sort, setSort] = useState('latest')

  const categoryId = view.name === 'category' ? view.categoryId : undefined
  const categoryName = view.name === 'category' ? view.categoryName : undefined
  const query = view.name === 'search' ? view.query : initialQuery

  const title = categoryName || (query ? `Search: "${query}"` : 'All Products')

  useEffect(() => {
    let cancelled = false
    void (async () => {
      setLoading(true)
      const params = new URLSearchParams({ sort })
      if (categoryId) params.set('categoryId', categoryId)
      if (query) params.set('search', query)
      try {
        const data = await fetch('/api/products?' + params.toString()).then((r) => r.json())
        if (cancelled) return
        setProducts(data.products || [])
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => { cancelled = true }
  }, [categoryId, query, sort])

  return (
    <div className="container mx-auto px-3 py-6 space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <button
            onClick={() => navigate({ name: 'home' })}
            className="text-sm text-gray-500 hover:text-orange-600"
          >
            Home /
          </button>
          <h1 className="text-xl font-bold text-gray-900 inline-block ml-2">{title}</h1>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500">{products.length} results</span>
          <Select value={sort} onValueChange={setSort}>
            <SelectTrigger className="w-40">
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

      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
          {Array.from({ length: 10 }).map((_, i) => (
            <Skeleton key={i} className="h-72" />
          ))}
        </div>
      ) : products.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <p className="text-lg">No products found.</p>
          <Button variant="link" onClick={() => navigate({ name: 'home' })}>Back to home</Button>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
          {products.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}
    </div>
  )
}
