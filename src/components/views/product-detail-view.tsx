'use client'

import { useEffect, useState, useMemo } from 'react'
import { useStore } from '@/lib/store'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import { ProductCard, type ProductFE } from '@/components/ecommerce/product-card'
import {
  ChevronLeft,
  ChevronRight,
  Star,
  Heart,
  Share2,
  ShoppingCart,
  Minus,
  Plus,
  Truck,
  Shield,
  ShieldCheck,
  RotateCcw,
  MapPin,
  MessageSquare,
  Store,
  CheckCircle2,
  ThumbsUp,
  Tag,
  Zap,
  Info,
  ZoomIn,
  X,
} from 'lucide-react'
import { formatBDT, discountPercent } from '@/lib/format'
import { toast } from 'sonner'

export function ProductDetailView() {
  const view = useStore((s) => s.view)
  const productId = view.name === 'product' ? view.productId : ''
  const navigate = useStore((s) => s.navigate)
  const goBack = useStore((s) => s.goBack)
  const user = useStore((s) => s.user)
  const setUser = useStore((s) => s.setUser)
  const openAuth = useStore((s) => s.openAuth)
  const refreshCart = useStore((s) => s.refreshCart)

  const [product, setProduct] = useState<ProductFE | null>(null)
  const [related, setRelated] = useState<ProductFE[]>([])
  const [reviews, setReviews] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [qty, setQty] = useState(1)
  const [activeImage, setActiveImage] = useState(0)
  const [zoomOpen, setZoomOpen] = useState(false)
  const [zoomPos, setZoomPos] = useState({ x: 50, y: 50 }) // percentage position for zoom pan
  const [isWishlisted, setIsWishlisted] = useState(false)
  const [wishlistLoading, setWishlistLoading] = useState(false)

  // Review interaction state
  const [filterStar, setFilterStar] = useState<number | 'all'>('all')
  const [sortBy, setSortBy] = useState<'recent' | 'rating-desc' | 'rating-asc'>('recent')
  const [helpfulVotes, setHelpfulVotes] = useState<Record<string, number>>({})
  const [userVoted, setUserVoted] = useState<Record<string, boolean>>({})

  // Write Review dialog state
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false)
  const [reviewRating, setReviewRating] = useState(5)
  const [reviewHoverRating, setReviewHoverRating] = useState(0)
  const [reviewComment, setReviewComment] = useState('')
  const [submittingReview, setSubmittingReview] = useState(false)
  const [promoBanner, setPromoBanner] = useState<{ title: string; tag?: string } | null>(null)
  const [deliveryConfig, setDeliveryConfig] = useState<{
    defaultAddress?: string
    standardFee?: number
    estimatedDays?: string
    codAvailable?: boolean
    returnPolicyDefault?: string
    changeOfMindApplicable?: boolean
    authenticProductText?: string
  } | null>(null)

  // Delivery destination and modals
  const [deliveryLocation, setDeliveryLocation] = useState<string>('')
  const [locationModalOpen, setLocationModalOpen] = useState(false)
  const [editAddressInput, setEditAddressInput] = useState('')
  const [deliveryInfoModalOpen, setDeliveryInfoModalOpen] = useState(false)
  const [returnInfoModalOpen, setReturnInfoModalOpen] = useState(false)

  const handleZoomMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * 100
    const y = ((e.clientY - rect.top) / rect.height) * 100
    setZoomPos({ x, y })
  }

  useEffect(() => {
    fetch('/api/config')
      .then((r) => r.json())
      .then((d) => {
        if (d?.promoBanner) setPromoBanner(d.promoBanner)
        else setPromoBanner(null)
        if (d?.deliveryConfig) setDeliveryConfig(d.deliveryConfig)
      })
      .catch(() => {})
  }, [])

  useEffect(() => {
    const saved = typeof window !== 'undefined' ? localStorage.getItem('user_delivery_location') : null
    const initial = user?.address || saved || deliveryConfig?.defaultAddress || 'Dhaka, Dhaka North, Banani Road No. 12 - 19'
    setDeliveryLocation(initial)
  }, [user, deliveryConfig])

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
    return () => {
      cancelled = true
    }
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
      if (res.status === 401 || d.error?.toLowerCase().includes('login')) {
        setUser(null)
        toast.error(d.error || 'Your session has expired. Please login again.')
        openAuth('login')
      } else {
        toast.error(d.error || 'Failed')
      }
    }
  }

  const buyNow = async () => {
    if (!user) return openAuth('login')
    await addToCart()
    navigate({ name: 'cart' })
  }

  const toggleWishlist = async () => {
    if (!user) return openAuth('login')
    setWishlistLoading(true)
    try {
      const res = await fetch('/api/wishlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId }),
      })
      if (res.ok) {
        const data = await res.json()
        if (data.removed) {
          setIsWishlisted(false)
          toast.success('Removed from wishlist')
        } else {
          setIsWishlisted(true)
          toast.success('Added to wishlist')
        }
      }
    } finally {
      setWishlistLoading(false)
    }
  }

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: product?.name,
        url: window.location.href,
      }).catch(() => {})
    } else {
      navigator.clipboard.writeText(window.location.href)
      toast.success('Product link copied to clipboard!')
    }
  }

  const handleHelpfulVote = (reviewId: string) => {
    if (!user) return openAuth('login')
    if (userVoted[reviewId]) {
      setHelpfulVotes((prev) => ({ ...prev, [reviewId]: Math.max(0, (prev[reviewId] || 1) - 1) }))
      setUserVoted((prev) => ({ ...prev, [reviewId]: false }))
    } else {
      setHelpfulVotes((prev) => ({ ...prev, [reviewId]: (prev[reviewId] || 0) + 1 }))
      setUserVoted((prev) => ({ ...prev, [reviewId]: true }))
      toast.success('Thanks for your feedback!')
    }
  }

  const handleSubmitReview = async () => {
    if (!user) {
      openAuth('login')
      return
    }
    if (!reviewComment.trim()) {
      toast.error('Please enter your review comment')
      return
    }

    setSubmittingReview(true)
    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId,
          rating: reviewRating,
          comment: reviewComment.trim(),
        }),
      })

      const data = await res.json()
      if (res.ok && data.review) {
        toast.success('Thank you! Your review has been submitted.')
        setReviews((prev) => [data.review, ...prev])
        if (product) {
          setProduct({
            ...product,
            rating: data.rating ?? product.rating,
            reviewCount: data.reviewCount ?? product.reviewCount + 1,
          })
        }
        setReviewComment('')
        setReviewRating(5)
        setReviewDialogOpen(false)
      } else {
        toast.error(data.error || 'Failed to submit review')
      }
    } catch (e) {
      toast.error('Network error. Failed to submit review.')
    } finally {
      setSubmittingReview(false)
    }
  }

  const handleBrandClick = () => {
    if (product?.brand && product.brand.trim() && product.brand.trim().toLowerCase() !== 'no brand') {
      navigate({ name: 'brand', brand: product.brand.trim() })
    } else {
      toast.info('No brand assigned to this product')
    }
  }

  const handleSaveLocation = () => {
    if (!editAddressInput.trim()) {
      toast.error('Please enter a delivery destination')
      return
    }
    const loc = editAddressInput.trim()
    setDeliveryLocation(loc)
    if (typeof window !== 'undefined') {
      localStorage.setItem('user_delivery_location', loc)
    }
    setLocationModalOpen(false)
    toast.success('Delivery location updated')
  }

  // Calculate review distribution
  const ratingDistribution = useMemo(() => {
    const counts: Record<number, number> = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
    reviews.forEach((r) => {
      const rounded = Math.min(5, Math.max(1, Math.round(r.rating || 5)))
      counts[rounded] = (counts[rounded] || 0) + 1
    })
    const total = reviews.length
    return {
      counts,
      total,
      percentages: {
        5: total ? (counts[5] / total) * 100 : 0,
        4: total ? (counts[4] / total) * 100 : 0,
        3: total ? (counts[3] / total) * 100 : 0,
        2: total ? (counts[2] / total) * 100 : 0,
        1: total ? (counts[1] / total) * 100 : 0,
      },
    }
  }, [reviews])

  // Filter and sort reviews
  const displayedReviews = useMemo(() => {
    let list = [...reviews]
    if (filterStar !== 'all') {
      list = list.filter((r) => Math.round(r.rating) === filterStar)
    }
    if (sortBy === 'rating-desc') {
      list.sort((a, b) => b.rating - a.rating)
    } else if (sortBy === 'rating-asc') {
      list.sort((a, b) => a.rating - b.rating)
    } else {
      list.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())
    }
    return list
  }, [reviews, filterStar, sortBy])

  // Highlights memo (declared unconditionally before early returns)
  const productHighlights = useMemo(() => {
    if (!product?.highlights) {
      return [
        '100% Original and Brand New',
        'Premium quality build and elegant finish',
        'Strict quality inspection prior to dispatch',
        'Fast and reliable delivery across all districts',
      ]
    }
    try {
      const parsed = JSON.parse(product.highlights)
      if (Array.isArray(parsed) && parsed.length > 0) return parsed
    } catch {}
    return product.highlights.split('\n').filter(Boolean)
  }, [product])

  if (loading) {
    return (
      <div className="container mx-auto px-3 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <Skeleton className="lg:col-span-4 aspect-square rounded-xl" />
          <div className="lg:col-span-5 space-y-4">
            <Skeleton className="h-10 w-3/4" />
            <Skeleton className="h-6 w-1/4" />
            <Skeleton className="h-20" />
            <Skeleton className="h-12 w-1/2" />
          </div>
          <Skeleton className="lg:col-span-3 h-80 rounded-xl" />
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

  const discount = discountPercent(product.price, product.comparePrice) || 0
  const totalReviewCount = reviews.length || product.reviewCount || 0
  const effectiveRating = reviews.length
    ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length
    : (product.rating || 0)
  const hasReviews = totalReviewCount > 0 && effectiveRating > 0

  return (
    <div className="container mx-auto px-3 py-4 space-y-6">
      {/* Breadcrumb & Navigation */}
      <div className="flex items-center justify-between text-xs sm:text-sm text-gray-500">
        <button
          onClick={goBack}
          className="flex items-center gap-1 font-medium text-gray-700 hover:text-sky-600 transition"
        >
          <ChevronLeft className="h-4 w-4" /> Back to Products
        </button>
        {product.category && (
          <div className="hidden sm:flex items-center gap-2 text-gray-400">
            <span>Home</span>
            <span>/</span>
            <button
              onClick={() =>
                navigate({
                  name: 'category',
                  categoryId: product.category!.id,
                  categoryName: product.category!.name,
                })
              }
              className="hover:text-sky-600"
            >
              {product.category.name}
            </button>
            <span>/</span>
            <span className="text-gray-700 line-clamp-1 max-w-[200px]">{product.name}</span>
          </div>
        )}
      </div>

      {/* 3-Column Product Section (matching design images 1 & 2) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 bg-white rounded-xl p-4 md:p-6 shadow-sm border border-gray-100">
        {/* Column 1: Image Gallery & Voucher Banner (col-span-4) */}
        <div className="lg:col-span-4 space-y-3">
          <div
            className="aspect-square bg-gray-50 rounded-lg overflow-hidden border border-gray-100 relative group cursor-zoom-in"
            onClick={() => setZoomOpen(true)}
          >
            <img
              src={product.images[activeImage] || product.images[0]}
              alt={product.name}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
            {discount > 0 && (
              <span className="absolute top-2 left-2 bg-sky-600 text-white text-xs font-bold px-2 py-1 rounded">
                -{discount}%
              </span>
            )}
            {/* Zoom hint icon */}
            <div className="absolute bottom-2 right-2 bg-white/80 backdrop-blur-sm rounded-full p-1.5 shadow opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
              <ZoomIn className="h-4 w-4 text-gray-700" />
            </div>
          </div>

          {/* Fullscreen image zoom lightbox */}
          {zoomOpen && (
            <div
              className="fixed inset-0 z-[200] bg-black/90 flex items-center justify-center"
              onClick={() => setZoomOpen(false)}
            >
              {/* Close button */}
              <button
                className="absolute top-4 right-4 z-10 bg-white/10 hover:bg-white/20 text-white rounded-full p-2 transition"
                onClick={(e) => { e.stopPropagation(); setZoomOpen(false) }}
              >
                <X className="h-6 w-6" />
              </button>

              {/* Thumbnail strip */}
              {product.images.length > 1 && (
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-10">
                  {product.images.map((img, i) => (
                    <button
                      key={i}
                      onClick={(e) => { e.stopPropagation(); setActiveImage(i) }}
                      className={`w-12 h-12 rounded border-2 overflow-hidden transition ${activeImage === i ? 'border-sky-400' : 'border-white/30 opacity-60 hover:opacity-100'}`}
                    >
                      <img src={img} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}

              {/* Main zoomed image with pan on mouse move */}
              <div
                className="w-full h-full flex items-center justify-center overflow-hidden cursor-crosshair"
                onMouseMove={handleZoomMouseMove}
                onClick={(e) => e.stopPropagation()}
              >
                <img
                  src={product.images[activeImage] || product.images[0]}
                  alt={product.name}
                  className="max-h-[85vh] max-w-[85vw] object-contain select-none transition-transform duration-75"
                  style={{
                    transformOrigin: `${zoomPos.x}% ${zoomPos.y}%`,
                    transform: 'scale(1)',
                  }}
                  draggable={false}
                />
              </div>

              {/* Navigation arrows */}
              {product.images.length > 1 && (
                <>
                  <button
                    className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white/20 text-white rounded-full p-2 transition"
                    onClick={(e) => { e.stopPropagation(); setActiveImage(i => i > 0 ? i - 1 : product.images.length - 1) }}
                  >
                    <ChevronLeft className="h-6 w-6" />
                  </button>
                  <button
                    className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white/20 text-white rounded-full p-2 transition"
                    onClick={(e) => { e.stopPropagation(); setActiveImage(i => i < product.images.length - 1 ? i + 1 : 0) }}
                  >
                    <ChevronRight className="h-6 w-6" />
                  </button>
                </>
              )}
            </div>
          )}

          {/* Collect Voucher Banner (from design image 1) */}
          <div className="bg-[#007455] text-white p-2.5 rounded-lg flex items-center justify-between text-xs font-semibold shadow-xs">
            <div className="flex items-center gap-2">
              <span className="bg-amber-400 text-black px-1.5 py-0.5 rounded text-[10px] font-extrabold uppercase">
                Voucher
              </span>
              <span>COLLECT VOUCHER & Enjoy Free Delivery</span>
            </div>
            <Truck className="h-4 w-4 shrink-0 text-amber-300" />
          </div>

          {/* Thumbnails Carousel */}
          {product.images.length > 1 && (
            <div className="relative flex items-center">
              <button
                onClick={() => setActiveImage((i) => (i > 0 ? i - 1 : product.images.length - 1))}
                className="absolute left-0 z-10 bg-white/90 shadow rounded-full p-1 border hover:bg-white"
              >
                <ChevronLeft className="h-3.5 w-3.5 text-gray-700" />
              </button>
              <div className="flex gap-2 overflow-x-auto px-6 py-1 w-full scrollbar-none">
                {product.images.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveImage(i)}
                    className={`relative w-14 h-14 rounded-md border-2 overflow-hidden shrink-0 transition ${
                      activeImage === i ? 'border-sky-500 shadow-sm' : 'border-gray-200 opacity-70 hover:opacity-100'
                    }`}
                  >
                    <img src={img} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
              <button
                onClick={() => setActiveImage((i) => (i < product.images.length - 1 ? i + 1 : 0))}
                className="absolute right-0 z-10 bg-white/90 shadow rounded-full p-1 border hover:bg-white"
              >
                <ChevronRight className="h-3.5 w-3.5 text-gray-700" />
              </button>
            </div>
          )}
        </div>

        {/* Column 2: Center Product Information & Buy CTA (col-span-5) */}
        <div className="lg:col-span-5 space-y-4">
          <div>
            <div className="flex items-start justify-between gap-2">
              <h1 className="text-lg sm:text-xl font-bold text-gray-900 leading-snug">{product.name}</h1>
              <div className="flex items-center gap-2 text-gray-400">
                <button
                  onClick={handleShare}
                  title="Share product"
                  className="p-1.5 hover:text-sky-600 hover:bg-sky-50 rounded-full transition"
                >
                  <Share2 className="h-4 w-4" />
                </button>
                <button
                  onClick={toggleWishlist}
                  disabled={wishlistLoading}
                  title="Save to wishlist"
                  className={`p-1.5 rounded-full transition ${
                    isWishlisted ? 'text-red-500 bg-red-50' : 'hover:text-red-500 hover:bg-red-50'
                  }`}
                >
                  <Heart className={`h-4 w-4 ${isWishlisted ? 'fill-current' : ''}`} />
                </button>
              </div>
            </div>

            {/* Ratings & Brand */}
            <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-600 mt-2 flex-wrap">
              <div className="flex items-center gap-1">
                <div className="flex text-amber-400">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={`h-3.5 w-3.5 ${
                        hasReviews && i < Math.round(effectiveRating) ? 'fill-amber-400 text-amber-400' : 'text-gray-200'
                      }`}
                    />
                  ))}
                </div>
                <span className="font-semibold text-gray-800 ml-1">
                  {hasReviews ? effectiveRating.toFixed(1) : 'No ratings yet'}
                </span>
                <a href="#reviews-section" className="text-sky-600 hover:underline">
                  ({totalReviewCount} Ratings)
                </a>
              </div>
            </div>

            <div className="text-xs text-gray-500 mt-1 flex items-center flex-wrap gap-1">
              <span>Brand:</span>{' '}
              <button
                type="button"
                onClick={handleBrandClick}
                className="text-sky-600 font-medium hover:underline cursor-pointer"
              >
                {product.brand || 'No Brand'}
              </button>
              <span className="mx-1 text-gray-300">|</span>
              <button
                type="button"
                onClick={handleBrandClick}
                className="text-gray-500 hover:text-sky-600 cursor-pointer"
              >
                More from {product.brand || 'No Brand'}
              </button>
            </div>
          </div>

          {/* Promotional Event Banner (Only shown if exists in SiteConfig table) */}
          {promoBanner && (
            <div className="bg-gradient-to-r from-sky-500 to-cyan-500 text-white px-3 py-2 rounded-lg flex items-center justify-between text-xs font-bold shadow-xs">
              <div className="flex items-center gap-1.5">
                <Zap className="h-4 w-4 fill-white text-white" />
                <span>{promoBanner.title}</span>
              </div>
              {promoBanner.tag && (
                <span className="text-[11px] bg-black/20 px-2 py-0.5 rounded font-normal">{promoBanner.tag}</span>
              )}
            </div>
          )}

          {/* Price Block */}
          <div className="bg-gray-50/80 p-3.5 rounded-lg border border-gray-100">
            <div className="flex items-baseline gap-3 flex-wrap">
              <span className="text-2xl sm:text-3xl font-extrabold text-sky-600">
                {formatBDT(product.price)}
              </span>
              {product.comparePrice && product.comparePrice > product.price && (
                <>
                  <span className="text-sm text-gray-400 line-through">
                    {formatBDT(product.comparePrice)}
                  </span>
                  <span className="bg-sky-50 text-sky-700 px-1.5 py-0.5 rounded text-xs font-bold border border-sky-100">
                    -{discount}%
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Quantity Selector */}
          <div className="flex items-center gap-4 pt-1">
            <span className="text-xs font-medium text-gray-600">Quantity</span>
            <div className="flex items-center border border-gray-300 rounded bg-white">
              <button
                onClick={() => setQty((q) => Math.max(1, q - 1))}
                className="px-2.5 py-1 text-gray-600 hover:bg-gray-100 transition disabled:opacity-30"
                disabled={qty <= 1}
              >
                <Minus className="h-3 w-3" />
              </button>
              <span className="px-3 py-1 text-xs font-semibold min-w-[36px] text-center">{qty}</span>
              <button
                onClick={() => setQty((q) => Math.min(product.stock || 99, q + 1))}
                className="px-2.5 py-1 text-gray-600 hover:bg-gray-100 transition disabled:opacity-30"
                disabled={qty >= (product.stock || 99)}
              >
                <Plus className="h-3 w-3" />
              </button>
            </div>
            <span className={`text-xs ${product.stock > 0 ? 'text-green-600' : 'text-red-500 font-semibold'}`}>
              {product.stock > 0 ? `${product.stock} available in stock` : 'Out of stock'}
            </span>
          </div>

          {/* Dual Action Buttons */}
          <div className="flex gap-2.5 pt-2">
            <Button
              onClick={buyNow}
              disabled={product.stock <= 0}
              className="flex-1 bg-cyan-600 hover:bg-cyan-700 text-white font-bold h-11 text-sm shadow-xs"
            >
              Buy Now
            </Button>
            <Button
              onClick={addToCart}
              disabled={product.stock <= 0}
              className="flex-1 bg-sky-600 hover:bg-sky-700 text-white font-bold h-11 text-sm shadow-xs"
            >
              <ShoppingCart className="h-4 w-4 mr-1.5" /> Add to Cart
            </Button>
          </div>
        </div>

        {/* Column 3: Delivery Options, Warranty & Seller Card (col-span-3, from design images 1 & 2) */}
        <div className="lg:col-span-3 space-y-4 lg:border-l lg:pl-6 border-gray-100">
          {/* Delivery Options */}
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs text-gray-500 font-semibold uppercase tracking-wider">
              <span>Delivery Options</span>
              <button
                type="button"
                onClick={() => setDeliveryInfoModalOpen(true)}
                className="text-gray-400 hover:text-sky-600 cursor-pointer p-0.5"
                title="Delivery details"
              >
                ⓘ
              </button>
            </div>

            <div className="bg-gray-50/80 p-2.5 rounded-lg border border-gray-100 text-xs space-y-2">
              <div className="flex items-start justify-between gap-1">
                <div className="flex items-start gap-1.5 text-gray-700 min-w-0">
                  <MapPin className="h-3.5 w-3.5 text-sky-600 shrink-0 mt-0.5" />
                  <span className="line-clamp-2">
                    {deliveryLocation || deliveryConfig?.defaultAddress || 'Dhaka, Dhaka North, Banani Road No. 12 - 19'}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setEditAddressInput(deliveryLocation || deliveryConfig?.defaultAddress || 'Dhaka, Dhaka North, Banani Road No. 12 - 19')
                    setLocationModalOpen(true)
                  }}
                  className="text-sky-600 font-bold hover:underline shrink-0 text-[11px] ml-2"
                >
                  CHANGE
                </button>
              </div>

              <div className="border-t border-gray-200/60 pt-2 flex items-start justify-between">
                <div className="flex items-start gap-1.5 text-gray-700">
                  <Truck className="h-3.5 w-3.5 text-gray-500 shrink-0 mt-0.5" />
                  <div>
                    <div className="font-semibold text-gray-800">Standard Delivery</div>
                    <div className="text-[11px] text-gray-500">
                      {deliveryConfig?.estimatedDays || 'Guaranteed within 2-3 days'}
                    </div>
                  </div>
                </div>
                <span className="font-bold text-gray-900">
                  ৳ {deliveryConfig?.standardFee !== undefined ? deliveryConfig.standardFee : 90}
                </span>
              </div>

              <div className="border-t border-gray-200/60 pt-2 flex items-center gap-1.5 text-gray-700">
                <Shield className={`h-3.5 w-3.5 ${deliveryConfig?.codAvailable === false ? 'text-gray-400' : 'text-green-600'} shrink-0`} />
                <span className="text-[11px] font-medium">
                  {deliveryConfig?.codAvailable === false ? 'Cash on Delivery Unavailable' : 'Cash on Delivery Available'}
                </span>
              </div>
            </div>
          </div>

          {/* Return & Warranty */}
          <div className="space-y-2 pt-2 border-t border-gray-100">
            <div className="flex items-center justify-between text-xs text-gray-500 font-semibold uppercase tracking-wider">
              <span>Return &amp; Warranty</span>
              <button
                type="button"
                onClick={() => setReturnInfoModalOpen(true)}
                className="text-gray-400 hover:text-sky-600 cursor-pointer p-0.5"
                title="Return &amp; Warranty details"
              >
                ⓘ
              </button>
            </div>

            <div className="text-xs space-y-2 text-gray-600">
              <div className="flex items-center gap-2">
                <RotateCcw className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                <span>{product.returnPolicy || deliveryConfig?.returnPolicyDefault || '14 days easy return'}</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                <span>
                  {product.returnPolicy?.toLowerCase().includes('no return') || deliveryConfig?.changeOfMindApplicable === false
                    ? 'Change of mind is not applicable'
                    : 'Change of Mind applicable'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Shield className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                <span>
                  {product.warrantyType && product.warrantyType !== 'No Warranty'
                    ? `${product.warrantyPeriod ? `${product.warrantyPeriod} ` : ''}${product.warrantyType}`
                    : (product.warrantyType === 'No Warranty' ? 'Warranty not available' : (product.brand ? `${product.brand} Brand Warranty` : 'Standard Warranty Available'))}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-3.5 w-3.5 text-sky-600 shrink-0" />
                <span>{deliveryConfig?.authenticProductText || '100% Authentic Product'}</span>
              </div>
            </div>
          </div>

          {/* Seller Card (from design image 2) */}
          <div className="bg-gray-50/90 rounded-lg p-3 border border-gray-100 space-y-2.5">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[11px] text-gray-400 block">Sold by</span>
                <span className="font-bold text-xs text-gray-800 line-clamp-1">
                  {product.retailer?.storeName || product.retailer?.name || 'Daraz Retail Hub'}
                </span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => toast.info('Opening seller live chat...')}
                className="h-7 text-xs border-sky-500 text-sky-600 hover:bg-sky-50"
              >
                <MessageSquare className="h-3 w-3 mr-1" /> Chat
              </Button>
            </div>

            {/* Seller Performance Metrics */}
            <div className="grid grid-cols-3 gap-1 pt-2 border-t border-gray-200/60 text-center">
              <div>
                <div className="text-[10px] text-gray-400 leading-tight">Positive Seller</div>
                <div className="text-xs font-bold text-gray-800 mt-0.5">88%</div>
              </div>
              <div>
                <div className="text-[10px] text-gray-400 leading-tight">Ship on Time</div>
                <div className="text-xs font-bold text-gray-800 mt-0.5">100%</div>
              </div>
              <div>
                <div className="text-[10px] text-gray-400 leading-tight">Chat Response</div>
                <div className="text-xs font-bold text-gray-800 mt-0.5">95%</div>
              </div>
            </div>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => toast.info('Redirecting to seller store...')}
              className="w-full text-xs text-sky-600 font-bold hover:bg-sky-50 h-7"
            >
              GO TO STORE
            </Button>
          </div>
        </div>
      </div>

      {/* Product Details Section (matching design image 3 & image 6) */}
      <div className="bg-white rounded-xl p-4 md:p-6 shadow-sm border border-gray-100 space-y-5">
        <h2 className="text-base sm:text-lg font-bold text-gray-900 border-b pb-3">
          Product details of {product.name}
        </h2>

        {/* Highlights Bullet List (from design image 3 & image 6) */}
        <div className="space-y-2">
          <h3 className="text-xs font-bold text-gray-800 uppercase tracking-wider">Key Highlights</h3>
          <ul className="space-y-1.5 text-xs sm:text-sm text-gray-700">
            {productHighlights.map((hl: string, idx: number) => (
              <li key={idx} className="flex items-start gap-2">
                <span className="text-sky-600 font-bold mt-0.5">•</span>
                <span>{hl}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Specifications Table */}
        <div className="border-t pt-4">
          <h3 className="text-xs font-bold text-gray-800 uppercase tracking-wider mb-3">Specifications</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2 text-xs sm:text-sm">
            <div className="flex justify-between py-1 border-b border-gray-100">
              <span className="text-gray-500">Brand</span>
              <span className="font-semibold text-gray-800">{product.brand || 'No Brand'}</span>
            </div>
            {product.model && (
              <div className="flex justify-between py-1 border-b border-gray-100">
                <span className="text-gray-500">Model</span>
                <span className="font-semibold text-gray-800">{product.model}</span>
              </div>
            )}
            {product.sku && (
              <div className="flex justify-between py-1 border-b border-gray-100">
                <span className="text-gray-500">SKU</span>
                <span className="font-semibold text-gray-800">{product.sku}</span>
              </div>
            )}
            <div className="flex justify-between py-1 border-b border-gray-100">
              <span className="text-gray-500">Category</span>
              <span className="font-semibold text-gray-800">{product.category?.name || 'General'}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-gray-100">
              <span className="text-gray-500">Warranty</span>
              <span className="font-semibold text-gray-800">
                {product.warrantyType || 'Local Seller Warranty'} {product.warrantyPeriod ? `(${product.warrantyPeriod})` : ''}
              </span>
            </div>
            {product.packageDimensions && (
              <div className="flex justify-between py-1 border-b border-gray-100">
                <span className="text-gray-500">Dimensions</span>
                <span className="font-semibold text-gray-800">{product.packageDimensions}</span>
              </div>
            )}
            {product.packageWeight && (
              <div className="flex justify-between py-1 border-b border-gray-100">
                <span className="text-gray-500">Package Weight</span>
                <span className="font-semibold text-gray-800">{product.packageWeight} kg</span>
              </div>
            )}
            <div className="flex justify-between py-1 border-b border-gray-100">
              <span className="text-gray-500">Stock Availability</span>
              <span className="font-semibold text-green-600">{product.stock} items available</span>
            </div>
          </div>
        </div>

        {/* What's in the box */}
        <div className="border-t pt-4">
          <h3 className="text-xs font-bold text-gray-800 uppercase tracking-wider mb-2">What's in the box</h3>
          <p className="text-xs sm:text-sm text-gray-700 bg-gray-50 p-2.5 rounded-lg border border-gray-100">
            {product.whatsInTheBox || `1 x ${product.name}, User Manual & Warranty Information`}
          </p>
        </div>

        {/* Detailed Description */}
        <div className="border-t pt-4 text-xs sm:text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
          <h3 className="text-xs font-bold text-gray-800 uppercase tracking-wider mb-2">Main Description</h3>
          <div className="text-gray-700 leading-relaxed whitespace-pre-wrap">
            {product.description}
          </div>
        </div>
      </div>

      {/* Ratings & Reviews Section (matching design image 4) */}
      <div id="reviews-section" className="bg-white rounded-xl p-4 md:p-6 shadow-sm border border-gray-100 space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-2 border-b pb-4">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-gray-900">
              Ratings & Reviews of {product.name}
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">Verified customer reviews and ratings</p>
          </div>
          <Button
            onClick={() => {
              if (!user) {
                openAuth('login')
              } else {
                setReviewDialogOpen(true)
              }
            }}
            className="bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold h-9 shadow-xs"
          >
            ★ Write a Review
          </Button>
        </div>

        {/* Rating Overview & Score Breakdown (from design image 4) */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center bg-gray-50/60 p-4 rounded-xl border border-gray-100">
          {/* Big Score Block (col-span-4) */}
          <div className="md:col-span-4 text-center md:text-left md:border-r border-gray-200/80 md:pr-6">
            <div className="flex items-baseline justify-center md:justify-start gap-1">
              <span className="text-4xl sm:text-5xl font-extrabold text-gray-900">
                {hasReviews ? effectiveRating.toFixed(1) : '0.0'}
              </span>
              <span className="text-gray-400 text-xl font-bold">/5</span>
            </div>
            <div className="flex justify-center md:justify-start text-amber-400 my-1.5">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  className={`h-5 w-5 ${
                    hasReviews && i < Math.round(effectiveRating) ? 'fill-amber-400 text-amber-400' : 'text-gray-200'
                  }`}
                />
              ))}
            </div>
            <div className="text-xs text-gray-500 font-medium">
              {hasReviews
                ? `${ratingDistribution.total} Ratings & Customer Feedback`
                : 'No reviews yet for this product'}
            </div>
          </div>

          {/* 5-Level Star Distribution Breakdown (col-span-8, from design image 4) */}
          <div className="md:col-span-8 space-y-1.5">
            {([5, 4, 3, 2, 1] as const).map((star) => {
              const count = ratingDistribution.counts[star] || 0
              const pct = ratingDistribution.percentages[star] || 0
              return (
                <div key={star} className="flex items-center gap-3 text-xs">
                  {/* Star row icon visual */}
                  <div className="flex text-amber-400 w-24 shrink-0">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={`h-3 w-3 ${i < star ? 'fill-amber-400 text-amber-400' : 'text-gray-200'}`}
                      />
                    ))}
                  </div>

                  {/* Progress bar */}
                  <div className="flex-1 bg-gray-200 h-2.5 rounded-full overflow-hidden">
                    <div
                      className="bg-amber-400 h-full rounded-full transition-all duration-500"
                      style={{ width: `${pct}%` }}
                    />
                  </div>

                  {/* Count */}
                  <span className="w-8 text-right font-medium text-gray-600 shrink-0">{count}</span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Filter and Sort Toolbar (from design image 4) */}
        <div className="flex items-center justify-between flex-wrap gap-3 border-y py-3 text-xs">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="font-semibold text-gray-700 mr-1">Filter:</span>
            <button
              onClick={() => setFilterStar('all')}
              className={`px-2.5 py-1 rounded-full font-medium transition ${
                filterStar === 'all'
                  ? 'bg-sky-600 text-white shadow-xs'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              All star ({reviews.length})
            </button>
            {([5, 4, 3, 2, 1] as const).map((star) => (
              <button
                key={star}
                onClick={() => setFilterStar(star)}
                className={`px-2.5 py-1 rounded-full font-medium transition flex items-center gap-1 ${
                  filterStar === star
                    ? 'bg-sky-600 text-white shadow-xs'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <span>{star}</span>
                <Star className="h-3 w-3 fill-current text-amber-400 inline" />
                <span>({ratingDistribution.counts[star] || 0})</span>
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <span className="text-gray-500">Sort:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-gray-50 border border-gray-200 rounded px-2 py-1 text-xs text-gray-700 focus:outline-sky-500"
            >
              <option value="recent">Most Recent</option>
              <option value="rating-desc">Highest Rating</option>
              <option value="rating-asc">Lowest Rating</option>
            </select>
          </div>
        </div>

        {/* Reviews List */}
        <div className="space-y-4">
          {displayedReviews.length === 0 ? (
            <div className="text-center py-8 text-gray-500 space-y-2">
              <p className="text-sm">No reviews found matching this filter.</p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  if (!user) openAuth('login')
                  else setReviewDialogOpen(true)
                }}
                className="text-xs"
              >
                Be the first to review this product
              </Button>
            </div>
          ) : (
            displayedReviews.map((r) => {
              const reviewId = r.id || `${r.userId}-${r.createdAt}`
              const votes = helpfulVotes[reviewId] || 0
              const isVoted = userVoted[reviewId]
              const dateStr = r.createdAt ? new Date(r.createdAt).toLocaleDateString() : 'Recent'

              return (
                <div key={reviewId} className="border-b border-gray-100 pb-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="h-7 w-7 rounded-full bg-sky-100 text-sky-700 flex items-center justify-center font-bold text-xs uppercase">
                        {(r.user?.name || 'A').charAt(0)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-xs text-gray-900">
                            {r.user?.name || 'Verified Customer'}
                          </span>
                          <span className="inline-flex items-center gap-0.5 text-[10px] text-green-700 bg-green-50 px-1.5 py-0.2 rounded font-medium">
                            <CheckCircle2 className="h-2.5 w-2.5" /> Verified Purchase
                          </span>
                        </div>
                        <div className="text-[10px] text-gray-400">{dateStr}</div>
                      </div>
                    </div>

                    <div className="flex text-amber-400">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          className={`h-3 w-3 ${
                            i < (r.rating || 5) ? 'fill-amber-400 text-amber-400' : 'text-gray-200'
                          }`}
                        />
                      ))}
                    </div>
                  </div>

                  <p className="text-xs sm:text-sm text-gray-700 leading-relaxed pl-9">
                    {r.comment}
                  </p>

                  {/* Helpful Thumbs-up button */}
                  <div className="flex items-center justify-end pl-9 pt-1">
                    <button
                      onClick={() => handleHelpfulVote(reviewId)}
                      className={`flex items-center gap-1 text-[11px] px-2 py-0.5 rounded transition ${
                        isVoted ? 'text-sky-600 bg-sky-50 font-semibold' : 'text-gray-400 hover:text-gray-600'
                      }`}
                    >
                      <ThumbsUp className={`h-3 w-3 ${isVoted ? 'fill-current' : ''}`} />
                      <span>Helpful ({votes})</span>
                    </button>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>

      {/* Related Products */}
      {related.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-base sm:text-lg font-bold text-gray-900">Related Products</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {related.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </div>
      )}

      {/* Write a Review Dialog */}
      <Dialog open={reviewDialogOpen} onOpenChange={setReviewDialogOpen}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle className="text-base sm:text-lg font-bold text-gray-900">
              Write a Review
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div>
              <p className="text-xs text-gray-500 mb-2 font-medium">Rate this product</p>
              <div className="flex items-center gap-1.5">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setReviewRating(star)}
                    onMouseEnter={() => setReviewHoverRating(star)}
                    onMouseLeave={() => setReviewHoverRating(0)}
                    className="p-1 focus:outline-none transition-transform hover:scale-110"
                  >
                    <Star
                      className={`h-7 w-7 ${
                        star <= (reviewHoverRating || reviewRating)
                          ? 'fill-amber-400 text-amber-400'
                          : 'text-gray-300'
                      }`}
                    />
                  </button>
                ))}
                <span className="ml-2 text-xs font-semibold text-gray-700">
                  {reviewRating === 5
                    ? 'Excellent'
                    : reviewRating === 4
                    ? 'Good'
                    : reviewRating === 3
                    ? 'Average'
                    : reviewRating === 2
                    ? 'Poor'
                    : 'Terrible'}
                </span>
              </div>
            </div>

            <div>
              <label className="text-xs text-gray-700 font-medium block mb-1">
                Your Review
              </label>
              <Textarea
                rows={4}
                value={reviewComment}
                onChange={(e) => setReviewComment(e.target.value)}
                placeholder="What did you like or dislike about this product? How was the quality, fit, and delivery?"
                className="text-xs sm:text-sm"
              />
            </div>
          </div>

          <DialogFooter className="flex justify-end gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setReviewDialogOpen(false)}
              disabled={submittingReview}
              className="text-xs"
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleSubmitReview}
              disabled={submittingReview}
              className="bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold"
            >
              {submittingReview ? 'Submitting...' : 'Submit Review'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Change Delivery Location Modal */}
      <Dialog open={locationModalOpen} onOpenChange={setLocationModalOpen}>
        <DialogContent className="sm:max-w-[460px]">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-gray-900 flex items-center gap-2">
              <MapPin className="h-4 w-4 text-sky-600" /> Change Delivery Destination
            </DialogTitle>
            <DialogDescription className="text-xs text-gray-500">
              Select or type your delivery address to see updated delivery fees and turnaround times.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2">
            <div>
              <Label className="text-xs font-semibold text-gray-700 block mb-1">
                Delivery Address / Hub
              </Label>
              <Input
                value={editAddressInput}
                onChange={(e) => setEditAddressInput(e.target.value)}
                placeholder="e.g. Dhaka, Banani Road No. 12"
                className="text-xs h-9"
              />
            </div>

            <div>
              <span className="text-[11px] font-semibold text-gray-500 block mb-1.5 uppercase tracking-wider">
                Quick Select Popular Locations
              </span>
              <div className="flex flex-wrap gap-1.5">
                {[
                  'Dhaka, Banani Road No. 12 - 19',
                  'Dhaka, Gulshan 2',
                  'Dhaka, Dhanmondi 27',
                  'Dhaka, Uttara Sector 3',
                  'Dhaka, Mirpur 10',
                  'Chittagong, GEC Circle',
                  'Sylhet, Zindabazar',
                  'Rajshahi, Shaheb Bazar',
                  'Khulna, Shib Bari',
                ].map((loc) => (
                  <button
                    key={loc}
                    type="button"
                    onClick={() => setEditAddressInput(loc)}
                    className="text-[11px] px-2.5 py-1 bg-gray-100 hover:bg-sky-50 hover:text-sky-700 rounded-full text-gray-700 transition border border-gray-200"
                  >
                    {loc}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter className="flex justify-end gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setLocationModalOpen(false)}
              className="text-xs"
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleSaveLocation}
              className="bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold"
            >
              Update Location
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delivery Information Modal */}
      <Dialog open={deliveryInfoModalOpen} onOpenChange={setDeliveryInfoModalOpen}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-gray-900 flex items-center gap-2">
              <Truck className="h-4 w-4 text-sky-600" /> Delivery Options &amp; Coverage
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-3.5 py-2 text-xs text-gray-600">
            <div className="bg-sky-50/70 p-3 rounded-lg border border-sky-100 space-y-1">
              <div className="font-semibold text-sky-900 flex items-center gap-1.5">
                <Truck className="h-3.5 w-3.5 text-sky-600" /> Standard Delivery
              </div>
              <p className="text-gray-600">
                Guaranteed delivery duration: {deliveryConfig?.estimatedDays || '2-3 business days'}. Standard delivery charge is ৳ {deliveryConfig?.standardFee !== undefined ? deliveryConfig.standardFee : 90}.
              </p>
            </div>

            <div className="bg-gray-50 p-3 rounded-lg border border-gray-100 space-y-1">
              <div className="font-semibold text-gray-900 flex items-center gap-1.5">
                <Shield className="h-3.5 w-3.5 text-green-600" /> Cash on Delivery (COD)
              </div>
              <p className="text-gray-600">
                {deliveryConfig?.codAvailable === false
                  ? 'Cash on delivery is currently suspended for this area or item.'
                  : 'Cash on delivery is fully supported. Pay upon physical delivery of your order at your doorstep.'}
              </p>
            </div>

            <div className="bg-gray-50 p-3 rounded-lg border border-gray-100 space-y-1">
              <div className="font-semibold text-gray-900 flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5 text-sky-600" /> Destination &amp; Tracking
              </div>
              <p className="text-gray-600">
                Real-time courier tracking updates will be provided via SMS and accessible inside your customer dashboard once dispatched.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              size="sm"
              onClick={() => setDeliveryInfoModalOpen(false)}
              className="bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold"
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Return & Warranty Information Modal */}
      <Dialog open={returnInfoModalOpen} onOpenChange={setReturnInfoModalOpen}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-gray-900 flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-sky-600" /> Return &amp; Warranty Policy
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-3.5 py-2 text-xs text-gray-600">
            <div className="bg-gray-50 p-3 rounded-lg border border-gray-100 space-y-1">
              <div className="font-semibold text-gray-900 flex items-center gap-1.5">
                <RotateCcw className="h-3.5 w-3.5 text-sky-600" /> Return Policy
              </div>
              <p className="text-gray-600">
                {product?.returnPolicy || deliveryConfig?.returnPolicyDefault || '14 days easy return'}. Products can be returned within the specified period if defective, damaged, or significantly not as described.
              </p>
            </div>

            <div className="bg-gray-50 p-3 rounded-lg border border-gray-100 space-y-1">
              <div className="font-semibold text-gray-900 flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-green-600" /> Change of Mind
              </div>
              <p className="text-gray-600">
                {product?.returnPolicy?.toLowerCase().includes('no return') || deliveryConfig?.changeOfMindApplicable === false
                  ? 'Change of mind is not applicable for this item.'
                  : 'Change of mind is applicable provided the package and product remain completely unopened, undamaged, and with all original seals intact.'}
              </p>
            </div>

            <div className="bg-gray-50 p-3 rounded-lg border border-gray-100 space-y-1">
              <div className="font-semibold text-gray-900 flex items-center gap-1.5">
                <Shield className="h-3.5 w-3.5 text-sky-600" /> Warranty Coverage
              </div>
              <p className="text-gray-600">
                {product?.warrantyType && product.warrantyType !== 'No Warranty'
                  ? `${product.warrantyPeriod ? `${product.warrantyPeriod} ` : ''}${product.warrantyType} covers manufacturing defects. Contact the verified seller or authorized service centers.`
                  : 'No manufacturer warranty is included with this item unless specified on package.'}
              </p>
            </div>

            <div className="bg-sky-50/70 p-3 rounded-lg border border-sky-100 space-y-1">
              <div className="font-semibold text-sky-900 flex items-center gap-1.5">
                <ShieldCheck className="h-3.5 w-3.5 text-sky-600" /> Authenticity Guarantee
              </div>
              <p className="text-gray-600">
                {deliveryConfig?.authenticProductText || '100% Authentic Product'}. All products sold on our platform are verified by platform quality audits.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              size="sm"
              onClick={() => setReturnInfoModalOpen(false)}
              className="bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold"
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
