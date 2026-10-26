'use client'

import { useEffect, useState } from 'react'
import { useStore } from '@/lib/store'
import { Button } from '@/components/ui/button'
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
  ChevronUp,
  ChevronRight,
  Loader2,
  FolderTree,
} from 'lucide-react'
import { toast } from 'sonner'
import { BRAND } from '@/lib/brand'

const CATEGORY_ICONS: Record<string, string> = {
  laptop: '💻',
  shirt: '👕',
  sofa: '🛋️',
  smartphone: '📱',
  heart: '❤️',
  dumbbell: '🏋️',
  'shopping-cart': '🛒',
  book: '📚',
  watch: '⌚',
  gamepad: '🎮',
  baby: '🍼',
  utensils: '🍳',
  car: '🚗',
  sparkles: '💎',
  tag: '🏷️',
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
  const [localCategories, setLocalCategories] = useState(categories || [])
  const [sheetOpen, setSheetOpen] = useState(false)
  const [loadingCategories, setLoadingCategories] = useState(false)
  const [expandedCatIds, setExpandedCatIds] = useState<Set<string>>(new Set())

  // On-demand & background category loader
  const loadCategories = async () => {
    if (loadingCategories) return
    setLoadingCategories(true)
    try {
      const r = await fetch('/api/categories')
      const d = await r.json()
      setLocalCategories(d.categories || [])
    } catch (e) {
      console.error('Failed to load categories:', e)
    } finally {
      setLoadingCategories(false)
    }
  }

  // 1. Sync when parent page provides categories from background fetch
  useEffect(() => {
    if (categories && categories.length > 0) {
      setLocalCategories(categories)
    }
  }, [categories])

  // 2. On-demand: when user opens category menu, load immediately if not loaded
  useEffect(() => {
    if (sheetOpen && localCategories.length === 0) {
      loadCategories()
    }
  }, [sheetOpen, localCategories.length])

  // 3. Background idle fetch fallback if categories prop was initially empty
  useEffect(() => {
    if (!categories || categories.length === 0) {
      const t = setTimeout(() => {
        loadCategories()
      }, 250)
      return () => clearTimeout(t)
    }
  }, [])

  const toggleExpand = (catId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setExpandedCatIds((prev) => {
      const next = new Set(prev)
      if (next.has(catId)) {
        next.delete(catId)
      } else {
        next.add(catId)
      }
      return next
    })
  }

  const handleSelectCategory = (catId: string, catName: string) => {
    setSheetOpen(false)
    navigate({ name: 'category', categoryId: catId, categoryName: catName })
  }

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
    <header className="sticky top-0 z-40 w-full border-b bg-white shadow-xs">
      {/* Top utility bar (Daraz style: Save more, help, contact) */}
      <div className="bg-sky-700 text-white text-[11px] font-medium">
        <div className="max-w-[1200px] mx-auto px-3 sm:px-4 py-1.5 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span className="hidden sm:inline opacity-95">{BRAND.promoBarText}</span>
            <span className="sm:hidden opacity-95">🎉 Welcome to {BRAND.name}</span>
          </div>
          <div className="flex items-center gap-4 text-sky-100">
            <span className="hidden md:inline hover:text-white cursor-pointer transition">
              📞 {BRAND.contactPhone}
            </span>
            <span
              onClick={() => {
                if (user) {
                  navigate({ name: 'dashboard' })
                } else {
                  openAuth('login')
                }
              }}
              className="hover:text-white cursor-pointer transition"
            >
              Track My Order
            </span>
            <span className="hover:text-white cursor-pointer transition hidden sm:inline">
              Help &amp; Customer Care
            </span>
          </div>
        </div>
      </div>

      {/* Main Header with Centered Search Box */}
      <div className="bg-white">
        <div className="max-w-[1200px] mx-auto px-3 sm:px-4 py-3 sm:py-3.5">
          <div className="flex items-center justify-between gap-3 sm:gap-8">
            {/* 1. Left: Brand Logo */}
            <button
              onClick={() => navigate({ name: 'home' })}
              className="flex items-center gap-2 shrink-0 group select-none text-left"
              aria-label="Go to home"
            >
              <div className="bg-sky-600 text-white px-3.5 py-1.5 rounded-lg text-xl sm:text-2xl font-black tracking-tight shadow-xs group-hover:bg-sky-700 transition">
                {BRAND.name}
              </div>
            </button>

            {/* 2. Center: Prominent Centered Search Box (Daraz Style) */}
            <div className="flex-1 max-w-2xl mx-auto">
              <form onSubmit={onSearchSubmit} className="relative w-full">
                <input
                  type="text"
                  value={localQuery}
                  onChange={(e) => setLocalQuery(e.target.value)}
                  placeholder={`Search in ${BRAND.name}...`}
                  className="w-full h-10 sm:h-11 pl-4 pr-12 sm:pr-14 text-xs sm:text-sm bg-gray-50 hover:bg-white focus:bg-white border-2 border-sky-600 rounded-lg outline-none transition-all placeholder:text-gray-400 focus:ring-2 focus:ring-sky-100"
                />
                <button
                  type="submit"
                  className="absolute right-1 top-1 bottom-1 px-3 sm:px-4 rounded-md bg-sky-600 hover:bg-sky-700 text-white flex items-center justify-center transition shadow-xs"
                  aria-label="Search"
                >
                  <Search className="h-4 w-4" />
                </button>
              </form>
            </div>

            {/* 3. Right: Cart & Account actions */}
            <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
              {/* Wishlist shortcut for logged in customers */}
              {user?.role === 'CUSTOMER' && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate({ name: 'wishlist' })}
                  className="relative text-gray-700 hover:text-sky-600 hover:bg-sky-50 h-9 px-2 sm:px-3 hidden sm:flex items-center gap-1"
                >
                  <Heart className="h-5 w-5 text-gray-600" />
                  <span className="text-xs font-semibold">Wishlist</span>
                </Button>
              )}

              {/* Shopping Cart */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate({ name: 'cart' })}
                className="relative text-gray-700 hover:text-sky-600 hover:bg-sky-50 h-9 px-2.5 sm:px-3 flex items-center gap-1"
              >
                <div className="relative">
                  <ShoppingCart className="h-5 w-5 text-gray-700" />
                  {cartCount > 0 && (
                    <span className="absolute -top-2 -right-2.5 bg-sky-600 text-white text-[10px] font-bold rounded-full h-4.5 min-w-[18px] px-1 flex items-center justify-center shadow-xs">
                      {cartCount > 99 ? '99+' : cartCount}
                    </span>
                  )}
                </div>
                <span className="ml-1 hidden md:inline text-xs font-semibold">Cart</span>
              </Button>

              {/* Account Dropdown or Login Button */}
              {user ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-gray-700 hover:text-sky-600 hover:bg-sky-50 gap-1.5 h-9 px-2 sm:px-3 font-semibold text-xs"
                    >
                      <div className="w-6 h-6 rounded-full bg-sky-100 text-sky-700 flex items-center justify-center font-bold text-[11px]">
                        {user.name.charAt(0).toUpperCase()}
                      </div>
                      <span className="hidden sm:inline max-w-24 truncate">
                        {user.name.split(' ')[0]}
                      </span>
                      <ChevronDown className="h-3 w-3 text-gray-400 hidden sm:inline" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuLabel className="flex flex-col">
                      <span className="font-semibold">{user.name}</span>
                      <span className="text-xs text-gray-500 font-normal">{user.phone}</span>
                      {user.email && (
                        <span className="text-xs text-gray-400 font-normal">{user.email}</span>
                      )}
                      <Badge variant="outline" className="mt-1 w-fit capitalize text-[10px] bg-sky-50 text-sky-700 border-sky-200">
                        {user.role.toLowerCase()}
                      </Badge>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => navigate({ name: 'dashboard' })}>
                      <LayoutDashboard className="mr-2 h-4 w-4 text-sky-600" /> Dashboard
                    </DropdownMenuItem>
                    {user.role === 'CUSTOMER' && (
                      <>
                        <DropdownMenuItem onClick={() => navigate({ name: 'dashboard' })}>
                          <Package className="mr-2 h-4 w-4 text-sky-600" /> My Orders
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => navigate({ name: 'wishlist' })}>
                          <Heart className="mr-2 h-4 w-4 text-sky-600" /> Wishlist
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => navigate({ name: 'cart' })}>
                          <ShoppingCart className="mr-2 h-4 w-4 text-sky-600" /> My Cart
                        </DropdownMenuItem>
                      </>
                    )}
                    {user.role === 'RETAILER' && (
                      <DropdownMenuItem onClick={() => navigate({ name: 'dashboard' })}>
                        <Store className="mr-2 h-4 w-4 text-sky-600" /> Manage Store
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
                  className="bg-sky-600 hover:bg-sky-700 text-white gap-1.5 text-xs font-semibold h-9 px-3.5 shadow-xs"
                >
                  <User className="h-4 w-4" />
                  <span>Login</span>
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Category Navigation Sub-Bar (Desktop) */}
      <div className="border-t border-gray-100 bg-white hidden md:block">
        <div className="max-w-[1200px] mx-auto px-3 sm:px-4 py-2 flex items-center justify-between gap-2 overflow-x-auto">
          {/* Categories Sheet Trigger */}
          <div className="flex items-center gap-1">
            <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
              <SheetTrigger asChild>
                <button
                  type="button"
                  className="flex items-center gap-2 text-xs font-bold text-gray-800 hover:text-sky-600 px-3 py-1 rounded-md hover:bg-sky-50 transition whitespace-nowrap"
                >
                  <Menu className="h-4 w-4 text-sky-600" />
                  <span>All Categories</span>
                  <ChevronDown className="h-3 w-3 text-gray-400" />
                </button>
              </SheetTrigger>
              <SheetContent side="left" className="w-84 sm:w-96 p-0 flex flex-col">
                <SheetHeader className="p-4 border-b border-gray-100 bg-sky-50/60 flex flex-row items-center justify-between">
                  <div>
                    <SheetTitle className="text-sm font-bold text-sky-950 flex items-center gap-2">
                      <Menu className="h-4 w-4 text-sky-600" /> All Categories
                    </SheetTitle>
                    <p className="text-[11px] text-gray-500 font-normal mt-0.5">
                      Explore departments & subcategories
                    </p>
                  </div>
                  {localCategories.length > 0 && (
                    <span className="text-[11px] font-semibold text-sky-700 bg-sky-100/70 px-2 py-0.5 rounded-full">
                      {localCategories.length} Departments
                    </span>
                  )}
                </SheetHeader>

                <div className="p-2 flex-1 overflow-y-auto divide-y divide-gray-50">
                  {loadingCategories && localCategories.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 text-center text-gray-500">
                      <Loader2 className="h-6 w-6 animate-spin text-sky-600 mb-2" />
                      <p className="text-xs font-medium">Loading categories...</p>
                    </div>
                  ) : localCategories.length === 0 ? (
                    <div className="text-center py-12 text-xs text-gray-400">
                      No categories found
                    </div>
                  ) : (
                    localCategories.map((c) => {
                      const hasChildren = Boolean(c.children && c.children.length > 0)
                      const isExpanded = expandedCatIds.has(c.id)

                      return (
                        <div key={c.id} className="py-1">
                          {/* Parent category row */}
                          <div
                            className={`flex items-center justify-between px-2.5 py-2 rounded-lg transition group ${
                              isExpanded ? 'bg-sky-50/70' : 'hover:bg-gray-50'
                            }`}
                          >
                            <button
                              type="button"
                              onClick={() => handleSelectCategory(c.id, c.name)}
                              className="flex items-center gap-3 text-xs font-semibold text-gray-800 hover:text-sky-600 truncate text-left flex-1"
                            >
                              <span className="text-lg shrink-0">
                                {c.icon ? CATEGORY_ICONS[c.icon] || c.icon || '🛍️' : '🛍️'}
                              </span>
                              <span className="truncate">{c.name}</span>
                            </button>

                            {/* Expand/collapse button for subcategories */}
                            {hasChildren ? (
                              <button
                                type="button"
                                onClick={(e) => toggleExpand(c.id, e)}
                                className="p-1 rounded-md text-gray-400 hover:text-sky-600 hover:bg-sky-100 transition flex items-center gap-1 shrink-0 ml-1"
                                title={isExpanded ? 'Collapse subcategories' : 'View subcategories'}
                                aria-label={`Toggle ${c.name} subcategories`}
                              >
                                <span className="text-[10px] bg-sky-100/60 text-sky-700 font-bold px-1.5 py-0.5 rounded-full font-mono">
                                  {c.children.length}
                                </span>
                                {isExpanded ? (
                                  <ChevronUp className="h-3.5 w-3.5 text-sky-600" />
                                ) : (
                                  <ChevronDown className="h-3.5 w-3.5 text-gray-500" />
                                )}
                              </button>
                            ) : (
                              <ChevronRight className="h-3 w-3 text-gray-300 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                            )}
                          </div>

                          {/* Nested Child Categories */}
                          {hasChildren && isExpanded && (
                            <div className="ml-6 pl-3 border-l-2 border-sky-200 space-y-0.5 my-1 bg-sky-50/40 rounded-r-lg py-1.5 pr-2">
                              {/* Quick link: View All parent */}
                              <button
                                type="button"
                                onClick={() => handleSelectCategory(c.id, c.name)}
                                className="w-full text-left px-2 py-1.5 text-[11px] font-bold text-sky-700 hover:bg-sky-100/70 rounded flex items-center gap-1.5 transition"
                              >
                                <FolderTree className="h-3 w-3 text-sky-600" />
                                <span>All in {c.name}</span>
                              </button>

                              {/* Child categories */}
                              {c.children.map((child) => (
                                <button
                                  key={child.id}
                                  type="button"
                                  onClick={() => handleSelectCategory(child.id, child.name)}
                                  className="w-full text-left px-2 py-1.5 text-xs text-gray-700 hover:text-sky-700 hover:bg-white rounded transition flex items-center justify-between"
                                >
                                  <span className="truncate flex items-center gap-2">
                                    <span className="text-[10px] text-sky-400">└─</span>
                                    <span className="text-sm shrink-0">
                                      {child.icon ? CATEGORY_ICONS[child.icon] || child.icon || '📦' : '📦'}
                                    </span>
                                    <span className="truncate font-medium">{child.name}</span>
                                  </span>
                                  {child.children && child.children.length > 0 && (
                                    <span className="text-[10px] text-gray-400 font-mono">
                                      ({child.children.length})
                                    </span>
                                  )}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      )
                    })
                  )}
                </div>
              </SheetContent>
            </Sheet>

            {/* Quick Category Links */}
            <div className="flex items-center gap-0.5">
              {localCategories.slice(0, 7).map((c) => (
                <button
                  key={c.id}
                  onClick={() => navigate({ name: 'category', categoryId: c.id, categoryName: c.name })}
                  className="px-2.5 py-1 text-xs text-gray-600 hover:text-sky-600 hover:bg-sky-50 rounded transition whitespace-nowrap font-medium"
                >
                  {c.name}
                </button>
              ))}
            </div>
          </div>

          {/* Quick value badges */}
          <div className="flex items-center gap-3 text-[11px] font-bold text-sky-700 shrink-0">
            <span
              onClick={() => navigate({ name: 'search', query: 'flash' })}
              className="cursor-pointer hover:underline flex items-center gap-1"
            >
              🔥 Flash Sale
            </span>
            <span className="text-gray-300">|</span>
            <span className="hidden lg:inline text-gray-500 font-normal">
              🚚 Free Delivery Over ৳1,000
            </span>
          </div>
        </div>
      </div>

      {/* Mobile Categories Row */}
      <div className="md:hidden border-t border-gray-100 bg-gray-50/80">
        <div className="px-3 py-1.5 flex gap-1.5 overflow-x-auto scrollbar-none items-center">
          <button
            type="button"
            onClick={() => setSheetOpen(true)}
            className="px-2.5 py-1 text-[11px] font-bold text-sky-700 bg-sky-50 border border-sky-200 rounded-full whitespace-nowrap shadow-2xs shrink-0 flex items-center gap-1"
          >
            <Menu className="h-3 w-3" />
            <span>All</span>
          </button>
          {localCategories.slice(0, 8).map((c) => (
            <button
              key={c.id}
              onClick={() => navigate({ name: 'category', categoryId: c.id, categoryName: c.name })}
              className="px-2.5 py-1 text-[11px] font-medium text-gray-700 hover:text-sky-600 bg-white border border-gray-200 rounded-full whitespace-nowrap shadow-2xs shrink-0"
            >
              {c.name}
            </button>
          ))}
        </div>
      </div>
    </header>
  )
}
