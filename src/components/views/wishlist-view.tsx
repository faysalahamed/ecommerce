'use client'

import { useEffect, useState } from 'react'
import { useStore } from '@/lib/store'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { ProductCard, type ProductFE } from '@/components/ecommerce/product-card'
import { Heart } from 'lucide-react'

export function WishlistView() {
  const navigate = useStore((s) => s.navigate)
  const [items, setItems] = useState<ProductFE[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/wishlist')
      .then((r) => r.json())
      .then((d) => setItems((d.items || []).map((i: any) => i.product)))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="container mx-auto px-3 py-6 space-y-4">
      <h1 className="text-2xl font-bold flex items-center gap-2">
        <Heart className="h-6 w-6 text-red-500" /> My Wishlist
      </h1>

      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-72" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <Heart className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <p className="text-lg">No items in your wishlist yet.</p>
          <Button variant="link" onClick={() => navigate({ name: 'home' })}>Browse products →</Button>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
          {items.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}
    </div>
  )
}
