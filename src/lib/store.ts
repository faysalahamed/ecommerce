import { create } from 'zustand'

export type View =
  | { name: 'home' }
  | { name: 'product'; productId: string }
  | { name: 'category'; categoryId: string; categoryName?: string }
  | { name: 'search'; query: string }
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
  email: string
  name: string
  role: 'ADMIN' | 'RETAILER' | 'CUSTOMER'
  phone?: string | null
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
}))
