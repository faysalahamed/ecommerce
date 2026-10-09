'use client'

import { useEffect, useState } from 'react'
import { useStore } from '@/lib/store'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { ProductCard, type ProductFE } from '@/components/ecommerce/product-card'
import { ChevronLeft, Star, Heart, ShoppingCart, Minus, Plus, Truck, Shield, RotateCcw } from 'lucide-react'
import { formatBDT, discountPercent } from '@/lib/format'
import { toast } from 'sonner'

export function ProductDetailView() {
  const view = useStore((s) => s.view)
  const productId = view.name === 'product' ? view.productId : ''
  const navigate = useStore((s) => s.navigate)
  const goBack = useStore((s) => s.goBack)
  const user = useStore((s) => s.user)
  const openAuth = useStore((s) => s.openAuth)
  const refreshCart = useStore((s) => s.refreshCart)

  const [product, setProduct] = useState<ProductFE | null>(null)
  const [related, setRelated] = useState<ProductFE[]>([])
  const [reviews, setReviews] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [qty, setQty] = useState(1)
  const [activeImage, setActiveImage] = useState(0)

  useEffect(() => {
    if (!productId) return
    let cancelled = false
    void (async () => {
      setLoading(true)
      try {
        const data = await fetch(`/api/products/${productId}`).then((r) => r.json())
        if (cancelled) return
        setActiveImage(0)
        setQty(1)
        if (data.product) {
          setProduct(data.product)
          setRelated(data.related || [])
          setReviews(data.product.reviews || [])
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => { cancelled = true }
  }, [productId])

  const addToCart = async () => {
    if (!user) return openAuth('login')
    const res = await fetch('/api/cart', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ productId, quantity: qty }),
    })
    if (res.ok) {
      toast.success('Added to cart')
      await refreshCart()
    } else {
      const d = await res.json()
      toast.error(d.error || 'Failed')
    }
  }

  const buyNow = async () => {
    if (!user) return openAuth('login')
    await addToCart()
    navigate({ name: 'cart' })
  }

  if (loading) {
    return (
      <div className="container mx-auto px-3 py-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Skeleton className="aspect-square" />
          <div className="space-y-4">
            <Skeleton className="h-10 w-3/4" />
            <Skeleton className="h-6 w-1/4" />
            <Skeleton className="h-20" />
            <Skeleton className="h-12 w-1/2" />
          </div>
        </div>
      </div>
    )
  }

  if (!product) {
    return (
      <div className="container mx-auto px-3 py-10 text-center">
        <p className="text-gray-600 mb-4">Product not found.</p>
        <Button onClick={() => navigate({ name: 'home' })}>Back to home</Button>
      </div>
    )
  }

  const discount = discountPercent(product.price, product.comparePrice)

  return (
    <div className="container mx-auto px-3 py-6 space-y-6">
      <button
        onClick={goBack}
        className="flex items-center gap-1 text-sm text-gray-600 hover:text-orange-600"
      >
        <ChevronLeft className="h-4 w-4" /> Back
      </button>

      <div className="bg-white rounded-xl p-4 md:p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Images */}
        <div className="space-y-3">
          <div className="aspect-square bg-gray-50 rounded-lg overflow-hidden">
            <img
              src={product.images[activeImage] || product.images[0]}
              alt={product.name}
              className="w-full h-full object-cover"
            />
          </div>
          {product.images.length > 1 && (
            <div className="flex gap-2 overflow-x-auto">
              {product.images.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setActiveImage(i)}
                  className={`relative w-16 h-16 rounded border-2 overflow-hidden shrink-0 ${
                    activeImage === i ? 'border-orange-500' : 'border-gray-200'
                  }`}
                >
                  <img src={img} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Info */}
        <div className="space-y-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">{product.name}</h1>
            {product.brand && (
              <p className="text-sm text-gray-500 mt-1">Brand: <span className="font-medium">{product.brand}</span></p>
            )}
            <div className="flex items-center gap-3 mt-2">
              <div className="flex items-center gap-1 text-sm">
                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                <span className="font-semibold">{product.rating.toFixed(1)}</span>
                <span className="text-gray-500">({product.reviewCount} reviews)</span>
              </div>
              <span className="text-gray-300">|</span>
              <span className="text-sm text-gray-600">{product.soldCount} sold</span>
              {product.category && (
                <>
                  <span className="text-gray-300">|</span>
                  <button
                    onClick={() => navigate({ name: 'category', categoryId: product.category!.id, categoryName: product.category!.name })}
                    className="text-sm text-orange-600 hover:underline"
                  >
                    {product.category.name}
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Price */}
          <div className="bg-orange-50 p-3 rounded-lg">
            <div className="flex items-baseline gap-3 flex-wrap">
              <span className="text-3xl font-bold text-orange-600">{formatBDT(product.price)}</span>
              {product.comparePrice && product.comparePrice > product.price && (
                <>
                  <span className="text-lg text-gray-400 line-through">{formatBDT(product.comparePrice)}</span>
                  <span className="bg-orange-600 text-white px-2 py-0.5 rounded text-sm font-bold">
                    -{discount}%
                  </span>
                </>
              )}
            </div>
          </div>

          <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-wrap">{product.description}</p>

          {/* Quantity & actions */}
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-600">Quantity:</span>
            <div className="flex items-center border rounded">
              <button
                onClick={() => setQty((q) => Math.max(1, q - 1))}
                className="px-3 py-1 hover:bg-gray-100"
                disabled={qty <= 1}
              >
                <Minus className="h-3 w-3" />
              </button>
              <span className="px-4 py-1 text-sm font-semibold min-w-12 text-center">{qty}</span>
              <button
                onClick={() => setQty((q) => Math.min(product.stock || 99, q + 1))}
                className="px-3 py-1 hover:bg-gray-100"
                disabled={qty >= (product.stock || 99)}
              >
                <Plus className="h-3 w-3" />
              </button>
            </div>
            <span className={`text-sm ${product.stock > 0 ? 'text-green-600' : 'text-red-600'}`}>
              {product.stock > 0 ? `${product.stock} in stock` : 'Out of stock'}
            </span>
          </div>

          <div className="flex gap-2 flex-wrap">
            <Button
              onClick={addToCart}
              disabled={product.stock <= 0}
              className="flex-1 bg-orange-600 hover:bg-orange-700 text-white"
            >
              <ShoppingCart className="h-4 w-4 mr-2" /> Add to Cart
            </Button>
            <Button
              onClick={buyNow}
              disabled={product.stock <= 0}
              variant="outline"
              className="flex-1 border-orange-500 text-orange-600 hover:bg-orange-50"
            >
              Buy Now
            </Button>
          </div>

          {/* Trust badges */}
          <div className="grid grid-cols-3 gap-2 pt-4 border-t">
            <div className="flex flex-col items-center text-center text-xs text-gray-600">
              <Truck className="h-5 w-5 text-orange-500 mb-1" />
              Free Shipping
            </div>
            <div className="flex flex-col items-center text-center text-xs text-gray-600">
              <Shield className="h-5 w-5 text-orange-500 mb-1" />
              Secure Payment
            </div>
            <div className="flex flex-col items-center text-center text-xs text-gray-600">
              <RotateCcw className="h-5 w-5 text-orange-500 mb-1" />
              7-Day Returns
            </div>
          </div>

          {/* Retailer info */}
          {product.retailer && (
            <div className="text-sm text-gray-600 border-t pt-3">
              Sold by <span className="font-semibold text-gray-800">{product.retailer.storeName || product.retailer.name}</span>
            </div>
          )}
        </div>
      </div>

      {/* Reviews */}
      <div className="bg-white rounded-xl p-4 md:p-6">
        <h2 className="text-lg font-bold mb-4">Customer Reviews ({reviews.length})</h2>
        {reviews.length === 0 ? (
          <p className="text-gray-500 text-sm">No reviews yet. Be the first to review this product!</p>
        ) : (
          <div className="space-y-4">
            {reviews.map((r) => (
              <div key={r.id} className="border-b pb-3">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-sm">{r.user?.name || 'Anonymous'}</span>
                  <div className="flex">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={`h-3 w-3 ${i < r.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
                      />
                    ))}
                  </div>
                </div>
                <p className="text-sm text-gray-700 mt-1">{r.comment}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Related */}
      {related.length > 0 && (
        <div>
          <h2 className="text-lg font-bold mb-3">Related Products</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
            {related.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
