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
  model?: string | null
  sku?: string | null
  highlights?: string | null
  whatsInTheBox?: string | null
  warrantyType?: string | null
  warrantyPeriod?: string | null
  packageWeight?: number | null
  packageDimensions?: string | null
  videoUrl?: string | null
  returnPolicy?: string | null
  isFlashSale?: boolean
  isFeatured?: boolean
  category?: { id: string; name: string }
  retailer?: { name: string; storeName?: string | null }
}

export function ProductCard({ product, compact = false }: { product: ProductFE; compact?: boolean }) {
  const navigate = useStore((s) => s.navigate)
  const user = useStore((s) => s.user)
  const setUser = useStore((s) => s.setUser)
  const openAuth = useStore((s) => s.openAuth)
  const refreshCart = useStore((s) => s.refreshCart)
  const [wishlistLoading, setWishlistLoading] = useState(false)
  const [adding, setAdding] = useState(false)

  const discount = discountPercent(product.price, product.comparePrice)

  // Helper: handle a 401 response by clearing stale user state + opening login modal.
  // This recovers from cases where the Zustand store has a stale `user` object
  // (e.g., after a cookie rename, server restart, or cookie expiry).
  const handleAuthFailure = (message: string) => {
    setUser(null) // clear stale user state so the header re-renders
    toast.error(message)
    openAuth('login')
  }

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
        // If the API says "Please login first", the user state is stale — clear it + open login modal
        if (res.status === 401 || data.error?.toLowerCase().includes('login')) {
          handleAuthFailure(data.error || 'Your session has expired. Please login again.')
        } else {
          toast.error(data.error || 'Failed to add to cart')
        }
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
      className="group cursor-pointer overflow-hidden bg-white hover:shadow-md transition-all duration-200 hover:-translate-y-0.5 border border-gray-100 hover:border-sky-300 relative rounded-lg flex flex-col justify-between"
    >
      {/* Top Image Box */}
      <div className="relative w-full aspect-square bg-gray-50 overflow-hidden shrink-0">
        <img
          src={product.images[0] || 'https://picsum.photos/seed/placeholder/400/400'}
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          loading="lazy"
        />

        {/* Discount badge */}
        {discount !== null && discount > 0 && (
          <span className="absolute top-1.5 left-1.5 z-10 bg-sky-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-sm shadow-2xs">
            -{discount}%
          </span>
        )}

        {/* Flash sale badge */}
        {product.isFlashSale && (
          <span className="absolute top-1.5 right-1.5 z-10 bg-red-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-sm uppercase tracking-wider shadow-2xs">
            FLASH
          </span>
        )}

        {/* Wishlist button */}
        <button
          onClick={toggleWishlist}
          disabled={wishlistLoading}
          aria-label="Toggle wishlist"
          className="absolute bottom-2 right-2 z-10 bg-white/90 hover:bg-white shadow-xs rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <Heart className="h-3.5 w-3.5 text-red-500" />
        </button>
      </div>

      {/* Content */}
      <div className="p-2 sm:p-2.5 flex flex-col justify-between flex-1 space-y-1.5">
        <div>
          <h3 className="text-xs sm:text-[13px] text-gray-800 line-clamp-2 leading-snug h-8 sm:h-9 group-hover:text-sky-600 transition-colors">
            {product.name}
          </h3>
          <div className="flex items-baseline gap-1.5 mt-1 flex-wrap">
            <span className="text-sky-600 font-black text-sm sm:text-base">
              {formatBDT(product.price)}
            </span>
            {product.comparePrice && product.comparePrice > product.price && (
              <span className="text-[10px] sm:text-[11px] text-gray-400 line-through">
                {formatBDT(product.comparePrice)}
              </span>
            )}
          </div>
        </div>

        <div className="pt-0.5 space-y-1.5">
          {/* Rating & Sold count */}
          <div className="flex items-center gap-1 text-[10px] sm:text-[11px] text-gray-500">
            <Star className={`h-3 w-3 ${product.rating > 0 ? 'fill-amber-400 text-amber-400' : 'text-gray-300'}`} />
            <span className="font-semibold text-gray-700">
              {product.rating > 0 ? product.rating.toFixed(1) : '5.0'}
            </span>
            <span>•</span>
            <span>{product.soldCount} sold</span>
          </div>

          {/* Add to cart */}
          <Button
            onClick={addToCart}
            disabled={adding || product.stock <= 0}
            size="sm"
            variant="outline"
            className="w-full h-7 sm:h-7.5 text-[11px] font-semibold border-sky-600 text-sky-600 hover:bg-sky-50 hover:text-sky-700 disabled:opacity-50 transition shadow-2xs"
          >
            {product.stock <= 0 ? (
              'Out of stock'
            ) : (
              <>
                <ShoppingCart className="h-3 w-3 mr-1" /> Add to Cart
              </>
            )}
          </Button>
        </div>
      </div>
    </Card>
  )
}
