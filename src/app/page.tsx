'use client'

import { useEffect, useState } from 'react'
import { useStore } from '@/lib/store'
import { Header, type CategoryFE } from '@/components/ecommerce/header'
import { Footer } from '@/components/ecommerce/footer'
import { AuthModal } from '@/components/ecommerce/auth-modal'
import { HomeView } from '@/components/views/home-view'
import { ProductDetailView } from '@/components/views/product-detail-view'
import { ProductListView } from '@/components/views/product-list-view'
import { CartView } from '@/components/views/cart-view'
import { CheckoutView } from '@/components/views/checkout-view'
import { OrderSuccessView } from '@/components/views/order-success-view'
import { WishlistView } from '@/components/views/wishlist-view'
import { DashboardView } from '@/components/views/dashboard-view'
import { Button } from '@/components/ui/button'
import { Database, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

export default function Home() {
  const view = useStore((s) => s.view)
  const user = useStore((s) => s.user)
  const setUser = useStore((s) => s.setUser)
  const refreshCart = useStore((s) => s.refreshCart)

  const [categories, setCategories] = useState<CategoryFE[]>([])
  const [loading, setLoading] = useState(true)
  const [seeding, setSeeding] = useState(false)
  const [emptyState, setEmptyState] = useState(false)

  // Initial load: check session, fetch categories
  useEffect(() => {
    async function init() {
      try {
        const [meRes, catRes] = await Promise.all([
          fetch('/api/auth/me'),
          fetch('/api/categories'),
        ])
        const me = await meRes.json()
        if (me.user) {
          setUser(me.user)
          await refreshCart()
        }
        const catData = await catRes.json()
        setCategories(catData.categories || [])

        // Detect empty database — no categories means not seeded
        if (!catData.categories || catData.categories.length === 0) {
          setEmptyState(true)
        }
      } finally {
        setLoading(false)
      }
    }
    init()
  }, [setUser, refreshCart])

  const handleSeed = async () => {
    setSeeding(true)
    try {
      const res = await fetch('/api/seed', { method: 'POST' })
      const data = await res.json()
      if (res.ok && data.success) {
        toast.success(`Seeded: ${data.counts.products} products, ${data.counts.categories} categories, ${data.counts.users} users`)
        // Refresh categories
        const catRes = await fetch('/api/categories')
        const catData = await catRes.json()
        setCategories(catData.categories || [])
        setEmptyState(false)
      } else {
        toast.error('Seed failed')
      }
    } catch (e) {
      console.error(e)
      toast.error('Seed failed')
    } finally {
      setSeeding(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
        <Loader2 className="h-8 w-8 text-orange-600 animate-spin mb-3" />
        <p className="text-gray-600 text-sm">Loading Daraz...</p>
      </div>
    )
  }

  // Empty state — ask user to seed the database
  if (emptyState) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header categories={categories} />
        <main className="flex-1 container mx-auto px-3 py-16 flex items-center justify-center">
          <div className="max-w-md text-center">
            <div className="bg-orange-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Database className="h-10 w-10 text-orange-600" />
            </div>
            <h1 className="text-2xl font-bold mb-3">Welcome to Daraz Clone</h1>
            <p className="text-gray-600 mb-6">
              The marketplace is empty. Click the button below to seed demo data — categories, products, and demo user accounts (admin, retailer, customer).
            </p>
            <Button
              onClick={handleSeed}
              disabled={seeding}
              className="bg-orange-600 hover:bg-orange-700 text-white"
              size="lg"
            >
              {seeding ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Seeding demo data...
                </>
              ) : (
                <>
                  <Database className="h-4 w-4 mr-2" />
                  Seed Demo Data
                </>
              )}
            </Button>
            <p className="text-xs text-gray-400 mt-4">
              Demo accounts: admin@daraz.local / admin123 • retailer@daraz.local / retailer123 • customer@daraz.local / customer123
            </p>
          </div>
        </main>
        <Footer categories={categories} />
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header categories={categories} />
      <main className="flex-1">
        {view.name === 'home' && <HomeView categories={categories} />}
        {view.name === 'product' && <ProductDetailView />}
        {view.name === 'category' && <ProductListView />}
        {view.name === 'search' && <ProductListView />}
        {view.name === 'cart' && <CartView />}
        {view.name === 'checkout' && <CheckoutView />}
        {view.name === 'order-success' && <OrderSuccessView />}
        {view.name === 'wishlist' && <WishlistView />}
        {view.name === 'dashboard' && <DashboardView categories={categories} />}
      </main>
      <Footer categories={categories} />
      <AuthModal />
    </div>
  )
}
