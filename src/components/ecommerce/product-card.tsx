'use client'

import { useStore } from '@/lib/store'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Heart, Star, ShoppingCart } from 'lucide-react'
import { formatBDT, discountPercent } from '@/lib/format'
import { toast } from 'sonner'
import { useState } from 'react'

export interface ProductFE {
  id: string
  name: string
  slug: string
  description: string
  price: number
  comparePrice?: number | null
  images: string[]
  stock: number
  soldCount: number
  rating: number
  reviewCount: number
  brand?: string | null
  isFlashSale?: boolean
  isFeatured?: boolean
  category?: { id: string; name: string }
  retailer?: { name: string; storeName?: string | null }
}

export function ProductCard({ product, compact = false }: { product: ProductFE; compact?: boolean }) {
  const navigate = useStore((s) => s.navigate)
  const user = useStore((s) => s.user)
  const openAuth = useStore((s) => s.openAuth)
  const refreshCart = useStore((s) => s.refreshCart)
  const [wishlistLoading, setWishlistLoading] = useState(false)
  const [adding, setAdding] = useState(false)

  const discount = discountPercent(product.price, product.comparePrice)

  const addToCart = async (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!user) {
      openAuth('login')
      return
    }
    if (product.stock <= 0) {
      toast.error('Out of stock')
      return
    }
    setAdding(true)
    try {
      const res = await fetch('/api/cart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId: product.id, quantity: 1 }),
      })
      if (!res.ok) {
        const data = await res.json()
        toast.error(data.error || 'Failed to add to cart')
      } else {
        toast.success('Added to cart')
        await refreshCart()
      }
    } finally {
      setAdding(false)
    }
  }

  const toggleWishlist = async (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!user) {
      openAuth('login')
      return
    }
    setWishlistLoading(true)
    try {
      const res = await fetch('/api/wishlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId: product.id }),
      })
      const data = await res.json()
      if (data.removed) {
        toast.success('Removed from wishlist')
      } else if (!data.error) {
        toast.success('Added to wishlist')
      }
    } finally {
      setWishlistLoading(false)
    }
  }

  return (
    <Card
      onClick={() => navigate({ name: 'product', productId: product.id })}
      className="group cursor-pointer overflow-hidden hover:shadow-lg transition-all duration-200 hover:-translate-y-0.5 border-gray-100 relative"
    >
      {/* Discount badge */}
      {discount && (
        <div className="absolute top-2 left-2 z-10 bg-sky-600 text-white text-xs font-bold px-2 py-0.5 rounded">
          -{discount}%
        </div>
      )}
      {/* Flash sale badge */}
      {product.isFlashSale && (
        <div className="absolute top-2 right-2 z-10 bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded uppercase">
          Flash
        </div>
      )}

      {/* Wishlist button */}
      <button
        onClick={toggleWishlist}
        disabled={wishlistLoading}
        aria-label="Toggle wishlist"
        className="absolute bottom-[180px] right-2 z-10 bg-white/80 hover:bg-white shadow-sm rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <Heart className="h-4 w-4 text-red-500" />
      </button>

      {/* Image */}
      <div className={`relative w-full bg-gray-50 overflow-hidden ${compact ? 'aspect-square' : 'aspect-square'}`}>
        <img
          src={product.images[0] || 'https://picsum.photos/seed/placeholder/400/400'}
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          loading="lazy"
        />
      </div>

      {/* Content */}
      <div className="p-3 space-y-1.5">
        <h3 className="text-sm text-gray-800 line-clamp-2 leading-snug min-h-[2.5rem]">
          {product.name}
        </h3>
        <div className="flex items-baseline gap-1.5 flex-wrap">
          <span className="text-sky-600 font-bold text-base">{formatBDT(product.price)}</span>
          {product.comparePrice && product.comparePrice > product.price && (
            <span className="text-xs text-gray-400 line-through">
              {formatBDT(product.comparePrice)}
            </span>
          )}
        </div>
        {/* Rating */}
        <div className="flex items-center gap-1 text-xs text-gray-500">
          <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
          <span>{product.rating.toFixed(1)}</span>
          <span>•</span>
          <span>{product.soldCount} sold</span>
        </div>
        {/* Add to cart */}
        <Button
          onClick={addToCart}
          disabled={adding || product.stock <= 0}
          size="sm"
          variant="outline"
          className="w-full mt-1.5 border-sky-500 text-sky-600 hover:bg-sky-50 hover:text-sky-700 disabled:opacity-50"
        >
          {product.stock <= 0 ? 'Out of stock' : (
            <>
              <ShoppingCart className="h-3 w-3 mr-1.5" /> Add to Cart
            </>
          )}
        </Button>
      </div>
    </Card>
  )
}
