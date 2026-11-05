import { create } from 'zustand'
import {
  DEFAULT_DELIVERY_CONFIG,
  DEFAULT_DELIVERY_LOCATIONS,
  DEFAULT_DELIVERY_HUBS,
  type DeliveryConfig,
  type DeliveryLocation,
  type DeliveryHub,
} from '@/lib/delivery'
import {
  DEFAULT_TOPBAR_CONFIG,
  type TopbarConfig,
} from '@/lib/topbar'

export type View =
  | { name: 'home' }
  | { name: 'login' }
  | { name: 'register' }
  | { name: 'product-form'; productId?: string }
  | { name: 'product'; productId: string }
  | { name: 'category'; categoryId: string; categoryName?: string }
  | { name: 'brand'; brand: string }
  | { name: 'search'; query: string }
  | { name: 'flash-sale' }
  | { name: 'featured' }
  | { name: 'cart' }
  | { name: 'checkout' }
  | { name: 'order-success'; orderId: string }
  | { name: 'wishlist' }
  | { name: 'dashboard' }

export type AuthModalMode = 'login' | 'register' | null

export interface CartItemFE {
  id: string
  productId: string
  quantity: number
  product: {
    id: string
    name: string
    price: number
    comparePrice?: number | null
    images: string[]
    stock: number
  }
}

export interface UserFE {
  id: string
  email?: string | null
  phone: string
  name: string
  role: 'ADMIN' | 'RETAILER' | 'CUSTOMER'
  phoneVerified?: boolean
  address?: string | null
  storeName?: string | null
  avatar?: string | null
}

interface StoreState {
  view: View
  history: View[]
  navigate: (v: View) => void
  goBack: () => void

  user: UserFE | null
  setUser: (u: UserFE | null) => void

  authModal: AuthModalMode
  openAuth: (mode: 'login' | 'register') => void
  closeAuth: () => void

  cartCount: number
  cartItems: CartItemFE[]
  setCart: (items: CartItemFE[]) => void
  refreshCart: () => Promise<void>

  searchQuery: string
  setSearchQuery: (q: string) => void

  // Cached site config (shared across all views)
  siteConfig: {
    promoBanner: { title: string; tag?: string } | null
    deliveryConfig: DeliveryConfig
    deliveryLocations: DeliveryLocation[]
    deliveryHubs: DeliveryHub[]
    heroSlides: any
    flashSaleConfig: any
    topbarConfig: TopbarConfig
    otpEnabled: boolean
  } | null
  siteConfigLoading: boolean
  fetchSiteConfig: (forceRefresh?: boolean) => Promise<void>

  // Product detail cache (avoids re-fetching already viewed products)
  productCache: Map<string, { product: any; related: any[]; timestamp: number }>
  getCachedProduct: (id: string) => { product: any; related: any[] } | null
  setCachedProduct: (id: string, product: any, related: any[]) => void
  prefetchProduct: (id: string) => void
  seedProductPreview: (product: any) => void
}

export const useStore = create<StoreState>((set, get) => ({
  view: { name: 'home' },
  history: [{ name: 'home' }],

  navigate: (v) => {
    const hist = get().history
    set({ view: v, history: [...hist, v] })
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  },

  goBack: () => {
    const hist = get().history
    if (hist.length > 1) {
      const newHist = hist.slice(0, -1)
      set({ view: newHist[newHist.length - 1], history: newHist })
    } else {
      set({ view: { name: 'home' }, history: [{ name: 'home' }] })
    }
  },

  user: null,
  setUser: (u) => set({ user: u }),

  authModal: null,
  openAuth: (mode) => set({ authModal: mode }),
  closeAuth: () => set({ authModal: null }),

  cartCount: 0,
  cartItems: [],
  setCart: (items) =>
    set({
      cartItems: items,
      cartCount: items.reduce((s, i) => s + i.quantity, 0),
    }),

  refreshCart: async () => {
    try {
      const res = await fetch('/api/cart')
      if (res.status === 401) {
        // Session expired or stale — clear user state and empty cart.
        // Don't toast here (would be noisy on every page load); the user
        // will see the login prompt the next time they try an authed action.
        set({ user: null, cartItems: [], cartCount: 0 })
        return
      }
      const data = await res.json()
      const items = data.items || []
      set({
        cartItems: items,
        cartCount: items.reduce((s: number, i: CartItemFE) => s + i.quantity, 0),
      })
    } catch {
      // not logged in or network error
      set({ cartItems: [], cartCount: 0 })
    }
  },

  searchQuery: '',
  setSearchQuery: (q) => {
    set({ searchQuery: q })
    if (q.trim()) {
      get().navigate({ name: 'search', query: q.trim() })
    }
  },

  // Site config — fetched once, cached globally
  siteConfig: null,
  siteConfigLoading: false,
  fetchSiteConfig: async (forceRefresh = false) => {
    // Don't re-fetch if already loaded or loading, unless forceRefresh is true
    if (!forceRefresh && (get().siteConfig || get().siteConfigLoading)) return
    set({ siteConfigLoading: true })
    try {
      const res = await fetch('/api/config')
      const data = await res.json()
      set({
        siteConfig: {
          promoBanner: data.promoBanner || null,
          deliveryConfig: data.deliveryConfig || DEFAULT_DELIVERY_CONFIG,
          deliveryLocations: data.deliveryLocations || DEFAULT_DELIVERY_LOCATIONS,
          deliveryHubs: data.deliveryHubs || DEFAULT_DELIVERY_HUBS,
          heroSlides: data.heroSlides || null,
          flashSaleConfig: data.flashSaleConfig || null,
          topbarConfig: data.topbarConfig || DEFAULT_TOPBAR_CONFIG,
          otpEnabled: data.otpEnabled ?? true,
        },
        siteConfigLoading: false,
      })
    } catch {
      set({ siteConfigLoading: false })
    }
  },

  // Product detail cache — 5 minute TTL, max 30 products
  productCache: new Map(),
  getCachedProduct: (id: string) => {
    const cache = get().productCache
    const entry = cache.get(id)
    if (!entry) return null
    // Expire after 5 minutes
    if (Date.now() - entry.timestamp > 5 * 60 * 1000) {
      cache.delete(id)
      return null
    }
    return { product: entry.product, related: entry.related }
  },
  setCachedProduct: (id: string, product: any, related: any[]) => {
    const cache = new Map(get().productCache)
    // Evict oldest if cache exceeds 30 entries
    if (cache.size >= 30) {
      const oldestKey = cache.keys().next().value
      if (oldestKey) cache.delete(oldestKey)
    }
    cache.set(id, { product, related, timestamp: Date.now() })
    set({ productCache: cache })
  },

  // Prefetch product on hover so navigation has 0ms perceived latency
  prefetchProduct: (id: string) => {
    if (!id) return
    const cache = get().productCache
    const entry = cache.get(id)
    if (entry && Date.now() - entry.timestamp <= 5 * 60 * 1000) return

    fetch(`/api/products/${id}`)
      .then((r) => r.json())
      .then((data) => {
        if (data?.product) {
          get().setCachedProduct(id, data.product, data.related || [])
        }
      })
      .catch(() => {})
  },

  // Seed product preview with available data from ProductCard so ProductDetailView
  // renders instantly upon click instead of showing blank skeletons
  seedProductPreview: (product: any) => {
    if (!product?.id) return
    const cache = get().productCache
    const existing = cache.get(product.id)
    if (!existing) {
      get().setCachedProduct(product.id, product, [])
    }
  },
}))
