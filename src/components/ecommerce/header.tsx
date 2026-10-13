'use client'

import { useEffect, useState } from 'react'
import { useStore } from '@/lib/store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Badge } from '@/components/ui/badge'
import {
  ShoppingCart,
  User,
  Search,
  Menu,
  Heart,
  LayoutDashboard,
  LogOut,
  Package,
  Store,
  ChevronDown,
} from 'lucide-react'
import { toast } from 'sonner'

const CATEGORY_ICONS: Record<string, string> = {
  laptop: '💻',
  shirt: '👕',
  sofa: '🛋️',
  smartphone: '📱',
  heart: '❤️',
  dumbbell: '🏋️',
  'shopping-cart': '🛒',
  book: '📚',
}

export interface CategoryFE {
  id: string
  name: string
  slug: string
  icon: string | null
  children: CategoryFE[]
}

export function Header({ categories }: { categories: CategoryFE[] }) {
  const {
    navigate,
    user,
    setUser,
    openAuth,
    cartCount,
  } = useStore()

  const [localQuery, setLocalQuery] = useState('')
  const [localCategories, setLocalCategories] = useState(categories)

  // Refresh categories on mount in case they were seeded
  useEffect(() => {
    if (!categories || categories.length === 0) {
      fetch('/api/categories')
        .then((r) => r.json())
        .then((d) => setLocalCategories(d.categories || []))
        .catch(() => {})
    }
  }, [categories])

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    setUser(null)
    toast.success('Logged out successfully')
    navigate({ name: 'home' })
  }

  const onSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (localQuery.trim()) {
      navigate({ name: 'search', query: localQuery.trim() })
    }
  }

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-white shadow-sm">
      {/* Top promo bar */}
      <div className="bg-sky-600 text-white text-xs sm:text-sm">
        <div className="container mx-auto px-3 py-1.5 flex items-center justify-between">
          <span className="hidden sm:inline">Save more with Daraz-style App — Download now! 📱</span>
          <span className="sm:hidden">Save more with our App! 📱</span>
          <div className="flex gap-4">
            <span className="hidden sm:inline">📞 +880 9678 123 456</span>
            <span>Save • Help • Support</span>
          </div>
        </div>
      </div>

      {/* Main header */}
      <div className="container mx-auto px-3 py-3">
        <div className="flex items-center gap-3 sm:gap-6">
          {/* Logo */}
          <button
            onClick={() => navigate({ name: 'home' })}
            className="flex items-center gap-2 shrink-0"
            aria-label="Go to home"
          >
            <div className="bg-sky-600 text-white px-3 py-1.5 rounded-md text-xl font-bold">
              Daraz
            </div>
          </button>

          {/* Search */}
          <form onSubmit={onSearchSubmit} className="flex-1 max-w-2xl">
            <div className="relative">
              <Input
                type="text"
                value={localQuery}
                onChange={(e) => setLocalQuery(e.target.value)}
                placeholder="Search products, brands and categories..."
                className="pr-12 h-10 border-sky-500 focus-visible:ring-sky-500"
              />
              <button
                type="submit"
                className="absolute right-0 top-0 h-10 px-4 rounded-r-md bg-sky-600 hover:bg-sky-700 text-white flex items-center"
                aria-label="Search"
              >
                <Search className="h-4 w-4" />
              </button>
            </div>
          </form>

          {/* Cart */}
          <div className="flex items-center gap-1 shrink-0">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate({ name: 'cart' })}
              className="relative text-gray-700 hover:text-sky-600"
            >
              <ShoppingCart className="h-5 w-5" />
              <span className="ml-1 hidden sm:inline text-sm">Cart</span>
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-sky-600 text-white text-[10px] font-bold rounded-full h-5 min-w-5 px-1 flex items-center justify-center">
                  {cartCount > 99 ? '99+' : cartCount}
                </span>
              )}
            </Button>
          </div>

          {/* Account */}
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="text-gray-700 hover:text-sky-600 gap-1">
                  <User className="h-5 w-5" />
                  <span className="hidden sm:inline max-w-24 truncate">
                    {user.name.split(' ')[0]}
                  </span>
                  <ChevronDown className="h-3 w-3 hidden sm:inline" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="flex flex-col">
                  <span className="font-semibold">{user.name}</span>
                  <span className="text-xs text-gray-500 font-normal">{user.phone}</span>
                  {user.email && (
                    <span className="text-xs text-gray-400 font-normal">{user.email}</span>
                  )}
                  <Badge variant="outline" className="mt-1 w-fit capitalize">
                    {user.role.toLowerCase()}
                  </Badge>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate({ name: 'dashboard' })}>
                  <LayoutDashboard className="mr-2 h-4 w-4" /> Dashboard
                </DropdownMenuItem>
                {user.role === 'CUSTOMER' && (
                  <>
                    <DropdownMenuItem onClick={() => navigate({ name: 'wishlist' })}>
                      <Heart className="mr-2 h-4 w-4" /> Wishlist
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate({ name: 'cart' })}>
                      <ShoppingCart className="mr-2 h-4 w-4" /> My Cart
                    </DropdownMenuItem>
                  </>
                )}
                {user.role === 'RETAILER' && (
                  <DropdownMenuItem onClick={() => navigate({ name: 'dashboard' })}>
                    <Store className="mr-2 h-4 w-4" /> Manage Store
                  </DropdownMenuItem>
                )}
                {user.role === 'CUSTOMER' && (
                  <DropdownMenuItem onClick={() => navigate({ name: 'dashboard' })}>
                    <Package className="mr-2 h-4 w-4" /> My Orders
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="text-red-600 focus:text-red-600">
                  <LogOut className="mr-2 h-4 w-4" /> Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button
              size="sm"
              onClick={() => openAuth('login')}
              className="bg-sky-600 hover:bg-sky-700 text-white gap-1"
            >
              <User className="h-4 w-4" />
              <span className="hidden sm:inline">Login</span>
            </Button>
          )}
        </div>
      </div>

      {/* Category nav bar — desktop */}
      <div className="border-t bg-gray-50 hidden md:block">
        <div className="container mx-auto px-3 py-2 flex items-center gap-1 overflow-x-auto">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="sm" className="text-sky-600 hover:text-sky-700 font-semibold gap-1">
                <Menu className="h-4 w-4" /> All Categories
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72">
              <SheetHeader>
                <SheetTitle className="text-sky-600">Categories</SheetTitle>
              </SheetHeader>
              <div className="mt-4 flex flex-col gap-1 max-h-[80vh] overflow-y-auto">
                {localCategories.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => {
                      navigate({ name: 'category', categoryId: c.id, categoryName: c.name })
                    }}
                    className="flex items-center gap-2 px-3 py-2 hover:bg-sky-50 rounded text-sm text-left"
                  >
                    <span className="text-lg">{c.icon ? CATEGORY_ICONS[c.icon] || '🛍️' : '🛍️'}</span>
                    {c.name}
                  </button>
                ))}
              </div>
            </SheetContent>
          </Sheet>

          {localCategories.slice(0, 8).map((c) => (
            <button
              key={c.id}
              onClick={() => navigate({ name: 'category', categoryId: c.id, categoryName: c.name })}
              className="px-3 py-1 text-sm text-gray-700 hover:text-sky-600 whitespace-nowrap"
            >
              {c.name}
            </button>
          ))}
          <div className="ml-auto flex gap-2 text-xs text-sky-600 font-semibold">
            <span className="hidden lg:inline">🔥 Flash Sale</span>
            <span className="hidden lg:inline">Bundle Deals</span>
            <span className="hidden lg:inline">Free Shipping</span>
          </div>
        </div>
      </div>

      {/* Mobile categories row */}
      <div className="md:hidden border-t bg-gray-50">
        <div className="container mx-auto px-3 py-2 flex gap-1 overflow-x-auto">
          {localCategories.slice(0, 6).map((c) => (
            <button
              key={c.id}
              onClick={() => navigate({ name: 'category', categoryId: c.id, categoryName: c.name })}
              className="px-2 py-1 text-xs text-gray-700 hover:text-sky-600 whitespace-nowrap"
            >
              {c.name}
            </button>
          ))}
        </div>
      </div>
    </header>
  )
}
