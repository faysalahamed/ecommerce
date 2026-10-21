'use client'

import { useEffect, useState } from 'react'
import { useStore } from '@/lib/store'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Switch } from '@/components/ui/switch'
import {
  Package,
  Plus,
  Edit,
  Trash2,
  TrendingUp,
  Users,
  ShoppingCart,
  DollarSign,
  Store,
  Star,
  Zap,
  Settings,
  Truck,
  Sliders,
  MoveUp,
  MoveDown,
  Image as ImageIcon,
  Check,
  CheckCircle2,
  ChevronRight,
  Eye,
  RotateCcw,
  Sparkles,
  Upload,
  ArrowRight,
  ShieldCheck,
  Shield,
  Layers,
} from 'lucide-react'
import { toast } from 'sonner'
import { formatBDT } from '@/lib/format'
import { useStore as useZustandStore } from '@/lib/store'
import { DarazProductForm } from '@/components/ecommerce/daraz-product-form'
import { HERO_SLIDES, type HeroSlide } from '@/lib/brand'

export type AdminMenuKey =
  | 'overview'
  | 'products'
  | 'orders'
  | 'users'
  | 'sliders'
  | 'promo-banner'
  | 'delivery-setup'

const GRADIENT_PRESETS = [
  { label: 'Sky & Cyan', value: 'from-sky-500 to-cyan-500' },
  { label: 'Indigo & Purple', value: 'from-indigo-500 to-purple-500' },
  { label: 'Pink & Rose', value: 'from-pink-500 to-rose-500' },
  { label: 'Emerald & Teal', value: 'from-emerald-500 to-teal-500' },
  { label: 'Violet & Fuchsia', value: 'from-violet-500 to-fuchsia-500' },
  { label: 'Amber & Orange', value: 'from-amber-500 to-orange-500' },
  { label: 'Dark Slate', value: 'from-slate-800 to-gray-900' },
]

export function DashboardView({ categories }: { categories: { id: string; name: string }[] }) {
  const user = useZustandStore((s) => s.user)
  const navigate = useStore((s) => s.navigate)
  const openAuth = useStore((s) => s.openAuth)

  // Active left sidebar menu
  const [activeMenu, setActiveMenu] = useState<AdminMenuKey>('overview')

  // Stats
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalOrders: 0,
    totalRevenue: 0,
    totalUsers: 0,
  })

  // Core entities
  const [products, setProducts] = useState<any[]>([])
  const [orders, setOrders] = useState<any[]>([])
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  // Product pagination & filtering state (scalable for 100k+ products)
  const [productPage, setProductPage] = useState(1)
  const [productSearch, setProductSearch] = useState('')
  const [productStatusFilter, setProductStatusFilter] = useState('ALL')
  const [productTotal, setProductTotal] = useState(0)
  const [productTotalPages, setProductTotalPages] = useState(1)
  const [productsLoading, setProductsLoading] = useState(false)

  // Product form
  const [editingProduct, setEditingProduct] = useState<any | null>(null)
  const [formOpen, setFormOpen] = useState(false)

  // Promotional Banner state (SiteConfig: 'promo_banner')
  const [bannerTitle, setBannerTitle] = useState('')
  const [bannerTag, setBannerTag] = useState('')
  const [bannerEnabled, setBannerEnabled] = useState(false)
  const [bannerLoading, setBannerLoading] = useState(false)

  // Delivery & Shipping config state (SiteConfig: 'delivery_config')
  const [deliveryAddress, setDeliveryAddress] = useState('Dhaka, Dhaka North, Banani Road No. 12 - 19')
  const [deliveryFee, setDeliveryFee] = useState('90')
  const [deliveryEstimatedDays, setDeliveryEstimatedDays] = useState('Guaranteed within 2-3 days')
  const [deliveryCod, setDeliveryCod] = useState(true)
  const [defaultReturnPolicy, setDefaultReturnPolicy] = useState('14 days easy return')
  const [changeOfMindApplicable, setChangeOfMindApplicable] = useState(true)
  const [authenticText, setAuthenticText] = useState('100% Authentic Product')
  const [deliveryConfigLoading, setDeliveryConfigLoading] = useState(false)

  // Hero Slider setup state (SiteConfig: 'hero_slides')
  const [sliderList, setSliderList] = useState<HeroSlide[]>(HERO_SLIDES)
  const [sliderLoading, setSliderLoading] = useState(false)
  const [slideModalOpen, setSlideModalOpen] = useState(false)
  const [editingSlideIndex, setEditingSlideIndex] = useState<number | null>(null)

  // Slide modal input states
  const [modalTitle, setModalTitle] = useState('')
  const [modalSubtitle, setModalSubtitle] = useState('')
  const [modalTag, setModalTag] = useState('')
  const [modalCtaLabel, setModalCtaLabel] = useState('Shop Now')
  const [modalCtaSearchQuery, setModalCtaSearchQuery] = useState('')
  const [modalGradient, setModalGradient] = useState('from-sky-500 to-cyan-500')
  const [modalImage, setModalImage] = useState('')
  const [modalActive, setModalActive] = useState(true)
  const [uploadingImage, setUploadingImage] = useState(false)

  // Fetch SiteConfig (Admin)
  const fetchConfig = async () => {
    try {
      const res = await fetch('/api/config')
      const d = await res.json()
      if (d?.promoBanner) {
        setBannerTitle(d.promoBanner.title || '')
        setBannerTag(d.promoBanner.tag || '')
        setBannerEnabled(true)
      } else {
        setBannerTitle('SHOP NOW! 10.10 SHOPPING FEST')
        setBannerTag('LIMITED TIME OFFER')
        setBannerEnabled(false)
      }

      if (d?.deliveryConfig) {
        if (d.deliveryConfig.defaultAddress !== undefined) setDeliveryAddress(d.deliveryConfig.defaultAddress)
        if (d.deliveryConfig.standardFee !== undefined) setDeliveryFee(String(d.deliveryConfig.standardFee))
        if (d.deliveryConfig.estimatedDays !== undefined) setDeliveryEstimatedDays(d.deliveryConfig.estimatedDays)
        if (d.deliveryConfig.codAvailable !== undefined) setDeliveryCod(d.deliveryConfig.codAvailable)
        if (d.deliveryConfig.returnPolicyDefault !== undefined) setDefaultReturnPolicy(d.deliveryConfig.returnPolicyDefault)
        if (d.deliveryConfig.changeOfMindApplicable !== undefined) setChangeOfMindApplicable(d.deliveryConfig.changeOfMindApplicable)
        if (d.deliveryConfig.authenticProductText !== undefined) setAuthenticText(d.deliveryConfig.authenticProductText)
      }

      if (d?.heroSlides && Array.isArray(d.heroSlides) && d.heroSlides.length > 0) {
        setSliderList(d.heroSlides)
      } else {
        setSliderList(HERO_SLIDES)
      }
    } catch {}
  }

  // Save Delivery Config
  const handleSaveDeliveryConfig = async () => {
    setDeliveryConfigLoading(true)
    try {
      const res = await fetch('/api/config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          key: 'delivery_config',
          value: {
            defaultAddress: deliveryAddress.trim(),
            standardFee: parseFloat(deliveryFee) || 0,
            estimatedDays: deliveryEstimatedDays.trim(),
            codAvailable: deliveryCod,
            returnPolicyDefault: defaultReturnPolicy.trim(),
            changeOfMindApplicable,
            authenticProductText: authenticText.trim(),
          },
        }),
      })
      if (res.ok) {
        toast.success('Delivery and shipping settings saved!')
      } else {
        toast.error('Failed to save delivery configuration')
      }
    } catch {
      toast.error('Network error saving delivery configuration')
    } finally {
      setDeliveryConfigLoading(false)
    }
  }

  // Save Promotional Banner
  const handleSaveBanner = async () => {
    setBannerLoading(true)
    try {
      const res = await fetch('/api/config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          key: 'promo_banner',
          value: {
            title: bannerTitle.trim(),
            tag: bannerTag.trim(),
            enabled: bannerEnabled,
          },
        }),
      })
      if (res.ok) {
        toast.success(
          bannerEnabled
            ? 'Promotional banner is now active across products!'
            : 'Banner settings saved in SiteConfig (currently disabled)'
        )
      } else {
        toast.error('Failed to save configuration')
      }
    } catch {
      toast.error('Network error saving configuration')
    } finally {
      setBannerLoading(false)
    }
  }

  // Delete Promotional Banner
  const handleDeleteBanner = async () => {
    setBannerLoading(true)
    try {
      const res = await fetch('/api/config?key=promo_banner', { method: 'DELETE' })
      if (res.ok) {
        setBannerEnabled(false)
        setBannerTitle('')
        setBannerTag('')
        toast.success('Promotional banner deleted from SiteConfig')
      } else {
        toast.error('Failed to delete configuration')
      }
    } catch {
      toast.error('Network error deleting configuration')
    } finally {
      setBannerLoading(false)
    }
  }

  // Save Slider List to DB
  const saveSliderListToDb = async (updated: HeroSlide[]) => {
    setSliderLoading(true)
    try {
      const res = await fetch('/api/config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          key: 'hero_slides',
          value: updated,
        }),
      })
      if (res.ok) {
        setSliderList(updated)
        toast.success('Hero slider configuration saved!')
      } else {
        toast.error('Failed to update slides in database')
      }
    } catch {
      toast.error('Network error saving slides')
    } finally {
      setSliderLoading(false)
    }
  }

  // Open modal for add or edit slide
  const handleOpenSlideModal = (idx?: number) => {
    if (idx !== undefined && idx >= 0 && idx < sliderList.length) {
      const s = sliderList[idx]
      setEditingSlideIndex(idx)
      setModalTitle(s.title || '')
      setModalSubtitle(s.subtitle || '')
      setModalTag(s.tag || '')
      setModalCtaLabel(s.ctaLabel || 'Shop Now')
      setModalCtaSearchQuery(s.ctaSearchQuery || '')
      setModalGradient(s.gradient || 'from-sky-500 to-cyan-500')
      setModalImage(s.image || '')
      setModalActive(s.active !== false)
    } else {
      setEditingSlideIndex(null)
      setModalTitle('')
      setModalSubtitle('')
      setModalTag('🎁 Special Promotion')
      setModalCtaLabel('Shop Now')
      setModalCtaSearchQuery('')
      setModalGradient('from-sky-500 to-cyan-500')
      setModalImage('')
      setModalActive(true)
    }
    setSlideModalOpen(true)
  }

  // Upload background image for slide
  const handleUploadSlideImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingImage(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      const res = await fetch('/api/upload', { method: 'POST', body: formData })
      const data = await res.json()
      if (data.url) {
        setModalImage(data.url)
        toast.success('Slide background image uploaded!')
      } else {
        toast.error(data.error || 'Failed to upload image')
      }
    } catch {
      toast.error('Error uploading slide image')
    } finally {
      setUploadingImage(false)
    }
  }

  // Save individual slide from modal
  const handleSaveModalSlide = async () => {
    if (!modalTitle.trim()) {
      toast.error('Slide title is required')
      return
    }

    const newSlide: HeroSlide = {
      id: editingSlideIndex !== null ? sliderList[editingSlideIndex].id : `slide-${Date.now()}`,
      title: modalTitle.trim(),
      subtitle: modalSubtitle.trim(),
      tag: modalTag.trim() || undefined,
      ctaLabel: modalCtaLabel.trim() || 'Shop Now',
      ctaSearchQuery: modalCtaSearchQuery.trim() || undefined,
      gradient: modalGradient,
      image: modalImage.trim() || undefined,
      active: modalActive,
    }

    let updated: HeroSlide[] = []
    if (editingSlideIndex !== null) {
      updated = sliderList.map((s, i) => (i === editingSlideIndex ? newSlide : s))
    } else {
      updated = [...sliderList, newSlide]
    }

    setSlideModalOpen(false)
    await saveSliderListToDb(updated)
  }

  // Delete slide
  const handleDeleteSlide = async (idx: number) => {
    if (sliderList.length <= 1) {
      toast.error('At least one slide must remain in the hero slider')
      return
    }
    if (!confirm('Are you sure you want to delete this slide?')) return
    const updated = sliderList.filter((_, i) => i !== idx)
    await saveSliderListToDb(updated)
  }

  // Toggle slide active
  const handleToggleSlideActive = async (idx: number) => {
    const updated = sliderList.map((s, i) =>
      i === idx ? { ...s, active: s.active === false ? true : false } : s
    )
    await saveSliderListToDb(updated)
  }

  // Move slide up / down
  const handleMoveSlide = async (idx: number, dir: 'up' | 'down') => {
    const targetIdx = dir === 'up' ? idx - 1 : idx + 1
    if (targetIdx < 0 || targetIdx >= sliderList.length) return
    const updated = [...sliderList]
    const temp = updated[idx]
    updated[idx] = updated[targetIdx]
    updated[targetIdx] = temp
    await saveSliderListToDb(updated)
  }

  // Reset sliders to default
  const handleResetSliders = async () => {
    if (!confirm('Reset all slides to original site defaults?')) return
    await saveSliderListToDb(HERO_SLIDES)
  }

  // Fetch products with server-side pagination & live search
  const fetchProductsPage = async (page = 1, search = productSearch, status = productStatusFilter) => {
    setProductsLoading(true)
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: '15',
      })
      if (search.trim()) params.set('search', search.trim())
      if (status && status !== 'ALL') params.set('status', status)
      if (user?.role === 'RETAILER') params.set('retailerId', user.id)

      const pRes = await fetch('/api/products?' + params.toString())
      const pData = await pRes.json()
      setProducts(pData.products || [])
      setProductTotal(pData.total || 0)
      setProductPage(pData.page || page)
      setProductTotalPages(pData.totalPages || 1)
      return pData.total || 0
    } finally {
      setProductsLoading(false)
    }
  }

  // Fetch core entities
  const fetchAll = async () => {
    setLoading(true)
    try {
      // Products (scalable paginated query)
      const prodTotal = await fetchProductsPage(productPage, productSearch, productStatusFilter)

      // Orders
      const oRes = await fetch('/api/orders')
      const oData = await oRes.json()
      const ordList = oData.orders || []
      setOrders(ordList)

      // Users (admin only)
      let userCount = 0
      if (user?.role === 'ADMIN') {
        const uRes = await fetch('/api/admin/users')
        if (uRes.ok) {
          const uData = await uRes.json()
          setUsers(uData.users || [])
          userCount = uData.users?.length || 0
        }
      }

      // Compute stats
      const totalRev = ordList
        .filter((o: any) => o.status !== 'CANCELLED')
        .reduce((sum: number, o: any) => sum + o.total, 0)

      setStats({
        totalProducts: prodTotal,
        totalOrders: ordList.length,
        totalRevenue: totalRev,
        totalUsers: userCount,
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!user) {
      openAuth('login')
      return
    }
    fetchAll()
    if (user.role === 'ADMIN') {
      fetchConfig()
    }
    if (user.role === 'CUSTOMER') {
      setActiveMenu('orders')
    } else if (user.role === 'RETAILER') {
      setActiveMenu('products')
    } else {
      setActiveMenu('overview')
    }
  }, [user])

  if (!user) {
    return (
      <div className="container mx-auto px-3 py-12 text-center">
        <p className="text-gray-500 mb-3">Please login to view your dashboard.</p>
        <Button onClick={() => openAuth('login')} className="bg-sky-600 text-white">
          Login
        </Button>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-3 py-6 space-y-6">
      {/* Top Banner / Role Greeting */}
      <div className="flex items-center justify-between flex-wrap gap-3 pb-2 border-b border-gray-200">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight">
              {user.role === 'ADMIN'
                ? 'Admin Control Center'
                : user.role === 'RETAILER'
                ? 'Seller Hub'
                : 'My Account'}
            </h1>
            <Badge className="bg-sky-100 text-sky-800 text-[11px] font-bold">
              {user.role}
            </Badge>
          </div>
          <p className="text-xs text-gray-500 mt-0.5">
            Logged in as <span className="font-semibold text-gray-700">{user.name}</span> ({user.phone || user.email})
          </p>
        </div>

        {user.role !== 'CUSTOMER' && (
          <Button
            onClick={() => {
              setEditingProduct(null)
              setFormOpen(true)
            }}
            className="bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs h-9 shadow-xs"
          >
            <Plus className="h-4 w-4 mr-1.5" /> Add New Product
          </Button>
        )}
      </div>

      {/* Main Split Layout: Left Menu + Content Pages */}
      <div className="flex flex-col md:flex-row gap-6 items-start">
        {/* Left Side Menu (Sidebar) */}
        <aside className="w-full md:w-64 shrink-0 bg-white rounded-xl border border-gray-200 p-3 shadow-xs space-y-4">
          {/* User profile / store chip */}
          <div className="p-3 bg-gradient-to-r from-sky-50 to-cyan-50 rounded-lg border border-sky-100 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-sky-600 text-white flex items-center justify-center font-bold text-sm shadow-xs shrink-0">
              {user.name.slice(0, 2).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <div className="font-bold text-xs text-gray-900 truncate">{user.name}</div>
              <div className="text-[11px] text-sky-700 font-medium">
                {user.storeName || (user.role === 'ADMIN' ? 'Site Administrator' : 'Verified Customer')}
              </div>
            </div>
          </div>

          {/* Navigation Links Group 1: Core Operations */}
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider px-3 block mb-1">
              Operations
            </span>

            <button
              type="button"
              onClick={() => setActiveMenu('overview')}
              className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold rounded-lg transition text-left ${
                activeMenu === 'overview'
                  ? 'bg-sky-600 text-white shadow-xs'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <TrendingUp className="h-4 w-4 shrink-0" />
              <span>Overview &amp; Stats</span>
            </button>

            {user.role !== 'CUSTOMER' && (
              <button
                type="button"
                onClick={() => setActiveMenu('products')}
                className={`w-full flex items-center justify-between px-3 py-2 text-xs font-semibold rounded-lg transition text-left ${
                  activeMenu === 'products'
                    ? 'bg-sky-600 text-white shadow-xs'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Package className="h-4 w-4 shrink-0" />
                  <span>Products</span>
                </div>
                <span
                  className={`text-[11px] px-2 py-0.5 rounded-full font-bold ${
                    activeMenu === 'products' ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  {products.length}
                </span>
              </button>
            )}

            <button
              type="button"
              onClick={() => setActiveMenu('orders')}
              className={`w-full flex items-center justify-between px-3 py-2 text-xs font-semibold rounded-lg transition text-left ${
                activeMenu === 'orders'
                  ? 'bg-sky-600 text-white shadow-xs'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <ShoppingCart className="h-4 w-4 shrink-0" />
                <span>{user.role === 'CUSTOMER' ? 'My Orders' : 'Orders &amp; Sales'}</span>
              </div>
              <span
                className={`text-[11px] px-2 py-0.5 rounded-full font-bold ${
                  activeMenu === 'orders' ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-600'
                }`}
              >
                {orders.length}
              </span>
            </button>

            {user.role === 'ADMIN' && (
              <button
                type="button"
                onClick={() => setActiveMenu('users')}
                className={`w-full flex items-center justify-between px-3 py-2 text-xs font-semibold rounded-lg transition text-left ${
                  activeMenu === 'users'
                    ? 'bg-sky-600 text-white shadow-xs'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Users className="h-4 w-4 shrink-0" />
                  <span>User Accounts</span>
                </div>
                <span
                  className={`text-[11px] px-2 py-0.5 rounded-full font-bold ${
                    activeMenu === 'users' ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  {users.length}
                </span>
              </button>
            )}
          </div>

          {/* Navigation Links Group 2: Website Setup & Configuration (Admin only) */}
          {user.role === 'ADMIN' && (
            <div className="space-y-1 pt-3 border-t border-gray-100">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider px-3 block mb-1">
                Website Setup
              </span>

              <button
                type="button"
                onClick={() => setActiveMenu('sliders')}
                className={`w-full flex items-center justify-between px-3 py-2 text-xs font-semibold rounded-lg transition text-left ${
                  activeMenu === 'sliders'
                    ? 'bg-sky-600 text-white shadow-xs'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Sliders className="h-4 w-4 shrink-0" />
                  <span>Home Sliders</span>
                </div>
                <span
                  className={`text-[11px] px-2 py-0.5 rounded-full font-bold ${
                    activeMenu === 'sliders' ? 'bg-white/20 text-white' : 'bg-sky-50 text-sky-700'
                  }`}
                >
                  {sliderList.length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setActiveMenu('promo-banner')}
                className={`w-full flex items-center justify-between px-3 py-2 text-xs font-semibold rounded-lg transition text-left ${
                  activeMenu === 'promo-banner'
                    ? 'bg-sky-600 text-white shadow-xs'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Zap className="h-4 w-4 shrink-0" />
                  <span>Promotional Banner</span>
                </div>
                {bannerEnabled && (
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" title="Active" />
                )}
              </button>

              <button
                type="button"
                onClick={() => setActiveMenu('delivery-setup')}
                className={`w-full flex items-center justify-between px-3 py-2 text-xs font-semibold rounded-lg transition text-left ${
                  activeMenu === 'delivery-setup'
                    ? 'bg-sky-600 text-white shadow-xs'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Truck className="h-4 w-4 shrink-0" />
                  <span>Delivery &amp; Shipping</span>
                </div>
              </button>
            </div>
          )}
        </aside>

        {/* Content Pages Area */}
        <main className="flex-1 min-w-0 w-full">
          {/* ========================================================= */}
          {/* PAGE 1: OVERVIEW & STATS                                 */}
          {/* ========================================================= */}
          {activeMenu === 'overview' && (
            <div className="space-y-6">
              {/* Quick Stat Cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                {user.role !== 'CUSTOMER' && (
                  <Card className="p-4 bg-white border border-gray-200 shadow-xs">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-gray-500 font-medium">Total Products</p>
                        <p className="text-2xl font-black text-gray-900 mt-1">{stats.totalProducts}</p>
                      </div>
                      <div className="p-2.5 bg-sky-50 rounded-lg text-sky-600">
                        <Package className="h-6 w-6" />
                      </div>
                    </div>
                  </Card>
                )}

                <Card className="p-4 bg-white border border-gray-200 shadow-xs">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-gray-500 font-medium">Total Orders</p>
                      <p className="text-2xl font-black text-gray-900 mt-1">{stats.totalOrders}</p>
                    </div>
                    <div className="p-2.5 bg-blue-50 rounded-lg text-blue-600">
                      <ShoppingCart className="h-6 w-6" />
                    </div>
                  </div>
                </Card>

                <Card className="p-4 bg-white border border-gray-200 shadow-xs">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-gray-500 font-medium">
                        {user.role === 'CUSTOMER' ? 'Total Spent' : 'Total Revenue'}
                      </p>
                      <p className="text-2xl font-black text-gray-900 mt-1">{formatBDT(stats.totalRevenue)}</p>
                    </div>
                    <div className="p-2.5 bg-emerald-50 rounded-lg text-emerald-600">
                      <DollarSign className="h-6 w-6" />
                    </div>
                  </div>
                </Card>

                {user.role === 'ADMIN' ? (
                  <Card className="p-4 bg-white border border-gray-200 shadow-xs">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-gray-500 font-medium">Registered Users</p>
                        <p className="text-2xl font-black text-gray-900 mt-1">{stats.totalUsers}</p>
                      </div>
                      <div className="p-2.5 bg-purple-50 rounded-lg text-purple-600">
                        <Users className="h-6 w-6" />
                      </div>
                    </div>
                  </Card>
                ) : user.role === 'RETAILER' ? (
                  <Card className="p-4 bg-white border border-gray-200 shadow-xs">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-gray-500 font-medium">Store Name</p>
                        <p className="text-base font-bold text-gray-900 mt-1 truncate">
                          {user.storeName || user.name}
                        </p>
                      </div>
                      <div className="p-2.5 bg-sky-50 rounded-lg text-sky-600">
                        <Store className="h-6 w-6" />
                      </div>
                    </div>
                  </Card>
                ) : null}
              </div>

              {/* Quick Navigation Cards (Admin only) */}
              {user.role === 'ADMIN' && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <button
                    type="button"
                    onClick={() => setActiveMenu('sliders')}
                    className="p-4 bg-white rounded-xl border border-gray-200 hover:border-sky-500 hover:shadow-sm transition text-left flex items-start gap-3 group"
                  >
                    <div className="p-2 bg-sky-50 text-sky-600 rounded-lg group-hover:bg-sky-600 group-hover:text-white transition">
                      <Sliders className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="font-bold text-xs text-gray-900 group-hover:text-sky-600">
                        Setup Hero Sliders
                      </div>
                      <p className="text-[11px] text-gray-500 mt-0.5">
                        Configure {sliderList.length} autoplay slides, images &amp; CTA buttons.
                      </p>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveMenu('promo-banner')}
                    className="p-4 bg-white rounded-xl border border-gray-200 hover:border-sky-500 hover:shadow-sm transition text-left flex items-start gap-3 group"
                  >
                    <div className="p-2 bg-amber-50 text-amber-600 rounded-lg group-hover:bg-amber-600 group-hover:text-white transition">
                      <Zap className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="font-bold text-xs text-gray-900 group-hover:text-amber-600">
                        Setup Promo Banner
                      </div>
                      <p className="text-[11px] text-gray-500 mt-0.5">
                        {bannerEnabled ? 'Currently active ribbon' : 'Currently disabled banner'}.
                      </p>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveMenu('delivery-setup')}
                    className="p-4 bg-white rounded-xl border border-gray-200 hover:border-sky-500 hover:shadow-sm transition text-left flex items-start gap-3 group"
                  >
                    <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg group-hover:bg-emerald-600 group-hover:text-white transition">
                      <Truck className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="font-bold text-xs text-gray-900 group-hover:text-emerald-600">
                        Setup Delivery &amp; Shipping
                      </div>
                      <p className="text-[11px] text-gray-500 mt-0.5">
                        Standard fee ৳ {deliveryFee}, COD &amp; warranty rules.
                      </p>
                    </div>
                  </button>
                </div>
              )}

              {/* Recent Orders Overview */}
              <Card className="p-4 bg-white border border-gray-200 shadow-xs">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="font-bold text-sm text-gray-900">Recent Orders Snapshot</h2>
                    <p className="text-xs text-gray-500">Latest transactions placed in the system</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setActiveMenu('orders')}
                    className="text-xs text-sky-600 hover:text-sky-700 font-semibold"
                  >
                    View All Orders <ArrowRight className="h-3.5 w-3.5 ml-1" />
                  </Button>
                </div>

                {orders.length === 0 ? (
                  <p className="text-xs text-gray-400 py-6 text-center">No orders recorded yet.</p>
                ) : (
                  <div className="space-y-2">
                    {orders.slice(0, 5).map((o) => (
                      <div
                        key={o.id}
                        className="p-3 bg-gray-50 rounded-lg flex items-center justify-between text-xs gap-3 flex-wrap"
                      >
                        <div>
                          <span className="font-mono font-bold text-gray-800">{o.orderNumber}</span>
                          <span className="text-gray-400 ml-2">
                            {new Date(o.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-[10px]">
                            {o.status}
                          </Badge>
                          <Badge
                            variant="outline"
                            className={`text-[10px] ${o.paymentStatus === 'PAID' ? 'bg-green-100' : 'bg-yellow-100'}`}
                          >
                            {o.paymentStatus}
                          </Badge>
                          <span className="font-bold text-sky-600 ml-2">{formatBDT(o.total)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            </div>
          )}

          {/* ========================================================= */}
          {/* PAGE 2: PRODUCTS MANAGEMENT                               */}
          {/* ========================================================= */}
          {activeMenu === 'products' && (
            <Card className="p-5 bg-white border border-gray-200 shadow-xs space-y-4">
              <div className="flex justify-between items-center flex-wrap gap-2 pb-3 border-b border-gray-100">
                <div>
                  <h2 className="font-bold text-base text-gray-900">Product Inventory ({productTotal})</h2>
                  <p className="text-xs text-gray-500">
                    Manage catalog listings, pricing, stock levels, and specifications
                  </p>
                </div>
                <Button
                  onClick={() => {
                    setEditingProduct(null)
                    setFormOpen(true)
                  }}
                  className="bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs h-8"
                >
                  <Plus className="h-3.5 w-3.5 mr-1" /> Add Product
                </Button>
              </div>

              {/* Search & Filter Toolbar */}
              <div className="flex flex-wrap gap-2 items-center justify-between bg-gray-50 p-2.5 rounded-lg border border-gray-200">
                <div className="flex gap-2 items-center flex-1 min-w-[220px]">
                  <Input
                    placeholder="Search by product name or brand..."
                    value={productSearch}
                    onChange={(e) => {
                      const val = e.target.value
                      setProductSearch(val)
                      fetchProductsPage(1, val, productStatusFilter)
                    }}
                    className="h-8 text-xs bg-white"
                  />
                  <Select
                    value={productStatusFilter}
                    onValueChange={(val) => {
                      setProductStatusFilter(val)
                      fetchProductsPage(1, productSearch, val)
                    }}
                  >
                    <SelectTrigger className="w-32 h-8 text-xs bg-white">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALL">All Status</SelectItem>
                      <SelectItem value="ACTIVE">Active</SelectItem>
                      <SelectItem value="INACTIVE">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="text-xs text-gray-500">
                  Total: <span className="font-bold text-gray-800">{productTotal}</span> items
                </div>
              </div>

              {productsLoading ? (
                <p className="text-gray-500 text-xs py-8 text-center">Loading products...</p>
              ) : products.length === 0 ? (
                <div className="text-center py-12 text-gray-500 space-y-2">
                  <Package className="h-10 w-10 text-gray-300 mx-auto" />
                  <p className="text-sm font-semibold">No products found</p>
                  <p className="text-xs text-gray-400">Try adjusting your search or click "Add Product" to create one.</p>
                </div>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Product</TableHead>
                          <TableHead>Price</TableHead>
                          <TableHead>Stock</TableHead>
                          <TableHead>Sold</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {products.map((p) => (
                          <TableRow key={p.id}>
                            <TableCell className="font-medium">
                              <div className="flex gap-2.5 items-center">
                                <img
                                  src={p.images[0] || '/placeholder.png'}
                                  alt=""
                                  className="w-10 h-10 object-cover rounded-md border border-gray-200"
                                />
                                <div className="min-w-0">
                                  <span className="line-clamp-1 max-w-xs text-xs font-bold text-gray-900">
                                    {p.name}
                                  </span>
                                  <span className="text-[10px] text-gray-400 block">
                                    Brand: {p.brand || 'No Brand'}
                                  </span>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="text-xs font-semibold">{formatBDT(p.price)}</TableCell>
                            <TableCell className="text-xs">{p.stock}</TableCell>
                            <TableCell className="text-xs">{p.soldCount}</TableCell>
                            <TableCell>
                              <Badge
                                variant={p.status === 'ACTIVE' ? 'default' : 'secondary'}
                                className="text-[10px]"
                              >
                                {p.status}
                              </Badge>
                              {p.isFlashSale && (
                                <Badge className="ml-1 bg-red-500 text-[10px]">Flash</Badge>
                              )}
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex gap-1 justify-end">
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  onClick={() => {
                                    setEditingProduct(p)
                                    setFormOpen(true)
                                  }}
                                  aria-label="edit"
                                  className="h-7 w-7 text-gray-600 hover:text-sky-600"
                                >
                                  <Edit className="h-3.5 w-3.5" />
                                </Button>
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  onClick={async () => {
                                    if (!confirm('Are you sure you want to delete this product?')) return
                                    const r = await fetch(`/api/products/${p.id}`, { method: 'DELETE' })
                                    if (r.ok) {
                                      toast.success('Product deleted')
                                      fetchProductsPage(productPage)
                                    }
                                  }}
                                  className="h-7 w-7 text-red-500 hover:text-red-700"
                                  aria-label="delete"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>

                  {/* Pagination Footer */}
                  {productTotalPages > 1 && (
                    <div className="flex items-center justify-between pt-3 border-t border-gray-100 flex-wrap gap-2">
                      <div className="text-xs text-gray-500">
                        Showing {(productPage - 1) * 15 + 1} to {Math.min(productPage * 15, productTotal)} of {productTotal} products
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => fetchProductsPage(productPage - 1)}
                          disabled={productPage <= 1 || productsLoading}
                          className="h-7 text-xs px-2.5"
                        >
                          Previous
                        </Button>
                        <span className="text-xs text-gray-600 px-2 font-medium">
                          Page {productPage} of {productTotalPages}
                        </span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => fetchProductsPage(productPage + 1)}
                          disabled={productPage >= productTotalPages || productsLoading}
                          className="h-7 text-xs px-2.5"
                        >
                          Next
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </Card>
          )}

          {/* ========================================================= */}
          {/* PAGE 3: ORDERS MANAGEMENT                                 */}
          {/* ========================================================= */}
          {activeMenu === 'orders' && (
            <Card className="p-5 bg-white border border-gray-200 shadow-xs space-y-4">
              <div className="flex justify-between items-center flex-wrap gap-2 pb-3 border-b border-gray-100">
                <div>
                  <h2 className="font-bold text-base text-gray-900">
                    {user.role === 'CUSTOMER' ? 'My Orders' : 'Customer Orders & Sales'} ({orders.length})
                  </h2>
                  <p className="text-xs text-gray-500">Track order processing, payments, and delivery fulfillment</p>
                </div>
              </div>

              {loading ? (
                <p className="text-gray-500 text-xs py-8 text-center">Loading orders...</p>
              ) : orders.length === 0 ? (
                <div className="text-center py-12 text-gray-500 space-y-2">
                  <ShoppingCart className="h-10 w-10 text-gray-300 mx-auto" />
                  <p className="text-sm font-semibold">No orders recorded yet</p>
                  {user.role === 'CUSTOMER' && (
                    <Button variant="link" onClick={() => navigate({ name: 'home' })}>
                      Start Shopping &rarr;
                    </Button>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  {orders.map((o) => (
                    <Card key={o.id} className="p-4 border border-gray-200 shadow-xs space-y-3">
                      <div className="flex flex-wrap justify-between items-start gap-2">
                        <div>
                          <p className="font-mono text-sm font-bold text-gray-900">{o.orderNumber}</p>
                          <p className="text-[11px] text-gray-400">
                            {new Date(o.createdAt).toLocaleString('en-GB', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </p>
                        </div>
                        <div className="flex gap-1.5 flex-wrap">
                          <Badge
                            variant="outline"
                            className={
                              o.status === 'DELIVERED'
                                ? 'bg-green-100 text-green-800'
                                : o.status === 'SHIPPED'
                                ? 'bg-blue-100 text-blue-800'
                                : o.status === 'CANCELLED'
                                ? 'bg-red-100 text-red-800'
                                : 'bg-sky-100 text-sky-800'
                            }
                          >
                            {o.status}
                          </Badge>
                          <Badge
                            variant="outline"
                            className={o.paymentStatus === 'PAID' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}
                          >
                            {o.paymentStatus}
                          </Badge>
                          <Badge variant="outline">{o.paymentMethod}</Badge>
                        </div>
                      </div>

                      {/* Items */}
                      <div className="space-y-1.5 text-xs border-t border-gray-100 pt-2.5">
                        {o.items?.map((it: any) => (
                          <div key={it.id} className="flex justify-between items-center">
                            <span className="flex gap-2 items-center min-w-0">
                              <img src={it.image} alt="" className="w-8 h-8 object-cover rounded border" />
                              <span className="line-clamp-1 max-w-xs font-medium text-gray-800">
                                {it.name} &times; {it.quantity}
                              </span>
                            </span>
                            <span className="font-semibold text-gray-800">{formatBDT(it.price * it.quantity)}</span>
                          </div>
                        ))}
                      </div>

                      <div className="border-t border-gray-100 pt-2 flex justify-between font-bold text-xs sm:text-sm">
                        <span>Total Payable</span>
                        <span className="text-sky-600 font-extrabold">{formatBDT(o.total)}</span>
                      </div>

                      {user.role === 'ADMIN' && (
                        <div className="border-t border-gray-100 pt-2 text-[11px] text-gray-500 space-y-0.5">
                          <div>
                            <span className="font-semibold text-gray-700">Customer:</span> {o.user?.name} ({o.user?.phone || 'No phone'}
                            {o.user?.email ? `, ${o.user.email}` : ''})
                          </div>
                          <div>
                            <span className="font-semibold text-gray-700">Shipping To:</span> {o.recipientName}, {o.phone}, {o.address}
                          </div>
                        </div>
                      )}

                      {user.role === 'ADMIN' && (
                        <div className="mt-2 pt-2 border-t border-gray-100 flex gap-2 flex-wrap items-center">
                          <span className="text-xs font-semibold text-gray-600">Update Status:</span>
                          <Select
                            defaultValue={o.status}
                            onValueChange={async (v) => {
                              await fetch('/api/orders', {
                                method: 'PUT',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ orderId: o.id, status: v }),
                              })
                              toast.success('Order status updated')
                              fetchAll()
                            }}
                          >
                            <SelectTrigger className="w-32 h-8 text-xs">
                              <SelectValue placeholder="Status" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="PENDING">Pending</SelectItem>
                              <SelectItem value="CONFIRMED">Confirmed</SelectItem>
                              <SelectItem value="SHIPPED">Shipped</SelectItem>
                              <SelectItem value="DELIVERED">Delivered</SelectItem>
                              <SelectItem value="CANCELLED">Cancelled</SelectItem>
                            </SelectContent>
                          </Select>

                          <Select
                            defaultValue={o.paymentStatus}
                            onValueChange={async (v) => {
                              await fetch('/api/orders', {
                                method: 'PUT',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ orderId: o.id, paymentStatus: v }),
                              })
                              toast.success('Payment status updated')
                              fetchAll()
                            }}
                          >
                            <SelectTrigger className="w-32 h-8 text-xs">
                              <SelectValue placeholder="Payment" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="UNPAID">Unpaid</SelectItem>
                              <SelectItem value="PAID">Paid</SelectItem>
                              <SelectItem value="FAILED">Failed</SelectItem>
                              <SelectItem value="REFUNDED">Refunded</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      )}
                    </Card>
                  ))}
                </div>
              )}
            </Card>
          )}

          {/* ========================================================= */}
          {/* PAGE 4: USERS MANAGEMENT (ADMIN)                          */}
          {/* ========================================================= */}
          {activeMenu === 'users' && user.role === 'ADMIN' && (
            <Card className="p-5 bg-white border border-gray-200 shadow-xs space-y-4">
              <div className="pb-3 border-b border-gray-100">
                <h2 className="font-bold text-base text-gray-900">User Management ({users.length})</h2>
                <p className="text-xs text-gray-500">Manage registered customers, sellers, and administrators</p>
              </div>

              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>Verified</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Registered</TableHead>
                      <TableHead>Change Role</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((u) => (
                      <TableRow key={u.id}>
                        <TableCell className="font-semibold text-xs text-gray-900">{u.name}</TableCell>
                        <TableCell className="text-xs font-mono">{u.phone || '—'}</TableCell>
                        <TableCell>
                          {u.phoneVerified ? (
                            <Badge className="bg-green-100 text-green-800 text-[10px]">Verified</Badge>
                          ) : (
                            <Badge variant="secondary" className="text-[10px]">Unverified</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-xs">{u.email || '—'}</TableCell>
                        <TableCell>
                          <Badge
                            className={`text-[10px] ${
                              u.role === 'ADMIN'
                                ? 'bg-purple-100 text-purple-800'
                                : u.role === 'RETAILER'
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}
                          >
                            {u.role}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs text-gray-400">
                          {new Date(u.createdAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <Select
                            defaultValue={u.role}
                            onValueChange={async (v) => {
                              await fetch('/api/admin/users', {
                                method: 'PUT',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ userId: u.id, role: v }),
                              })
                              toast.success(`Role updated for ${u.name}`)
                              fetchAll()
                            }}
                          >
                            <SelectTrigger className="w-28 h-7 text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="CUSTOMER">Customer</SelectItem>
                              <SelectItem value="RETAILER">Retailer</SelectItem>
                              <SelectItem value="ADMIN">Admin</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </Card>
          )}

          {/* ========================================================= */}
          {/* PAGE 5: DEDICATED SLIDER SETUP PAGE (ADMIN)               */}
          {/* ========================================================= */}
          {activeMenu === 'sliders' && user.role === 'ADMIN' && (
            <Card className="p-5 bg-white border border-gray-200 shadow-xs space-y-6">
              <div className="flex items-center justify-between flex-wrap gap-2 pb-3 border-b border-gray-100">
                <div>
                  <h2 className="font-bold text-base text-gray-900 flex items-center gap-2">
                    <Sliders className="h-5 w-5 text-sky-600" /> Homepage Hero Slider Setup
                  </h2>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Customize the dynamic slides on your homepage hero carousel. Changes take effect immediately.
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleResetSliders}
                    disabled={sliderLoading}
                    className="text-xs h-8 text-gray-600 hover:text-sky-600"
                  >
                    <RotateCcw className="h-3.5 w-3.5 mr-1" /> Reset Defaults
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => handleOpenSlideModal()}
                    disabled={sliderLoading}
                    className="bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs h-8"
                  >
                    <Plus className="h-3.5 w-3.5 mr-1" /> Add New Slide
                  </Button>
                </div>
              </div>

              {/* Slider List */}
              <div className="space-y-3">
                {sliderList.map((slide, idx) => (
                  <div
                    key={slide.id || idx}
                    className={`rounded-xl border p-4 transition-all ${
                      slide.active === false
                        ? 'bg-gray-50/70 border-gray-200 opacity-60'
                        : 'bg-white border-gray-200 hover:border-sky-300 shadow-2xs'
                    }`}
                  >
                    <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
                      {/* Live Mini Preview */}
                      <div
                        className={`w-full lg:w-72 h-28 rounded-lg bg-gradient-to-r ${
                          slide.gradient || 'from-sky-500 to-cyan-500'
                        } text-white p-3 flex flex-col justify-between relative overflow-hidden shrink-0 shadow-xs`}
                        style={slide.image ? { backgroundImage: `url(${slide.image})`, backgroundSize: 'cover' } : {}}
                      >
                        <div className="flex items-center justify-between relative z-10">
                          <span className="text-[9px] font-bold bg-white/20 backdrop-blur px-2 py-0.5 rounded-full uppercase">
                            {slide.tag || `Slide #${idx + 1}`}
                          </span>
                          <span className="text-[10px] bg-black/20 px-1.5 py-0.5 rounded font-mono">
                            {idx + 1}/{sliderList.length}
                          </span>
                        </div>
                        <div className="relative z-10">
                          <div className="font-extrabold text-sm line-clamp-1">{slide.title}</div>
                          <div className="text-[10px] opacity-90 line-clamp-1">{slide.subtitle}</div>
                        </div>
                        <div className="relative z-10 self-start">
                          <span className="text-[10px] font-bold bg-white text-gray-900 px-2 py-0.5 rounded shadow-xs">
                            {slide.ctaLabel || 'Shop Now'}
                          </span>
                        </div>
                      </div>

                      {/* Details & Controls */}
                      <div className="flex-1 min-w-0 space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-gray-500">#{idx + 1}</span>
                          <span className="font-bold text-sm text-gray-900 truncate">{slide.title}</span>
                          {slide.active === false ? (
                            <Badge variant="secondary" className="text-[10px]">Hidden / Disabled</Badge>
                          ) : (
                            <Badge className="bg-emerald-100 text-emerald-800 text-[10px]">Active</Badge>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 line-clamp-2">{slide.subtitle}</p>
                        <div className="flex items-center gap-3 text-[11px] text-gray-400 pt-1">
                          <span>Button: <strong>{slide.ctaLabel}</strong></span>
                          {slide.ctaSearchQuery && (
                            <span>Query: <code className="bg-gray-100 px-1 rounded">{slide.ctaSearchQuery}</code></span>
                          )}
                          {slide.image && (
                            <span className="text-sky-600 flex items-center gap-0.5">
                              <ImageIcon className="h-3 w-3" /> Custom Image
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center gap-1.5 shrink-0 self-end lg:self-center">
                        <Button
                          size="icon"
                          variant="outline"
                          onClick={() => handleMoveSlide(idx, 'up')}
                          disabled={idx === 0 || sliderLoading}
                          title="Move slide up"
                          className="h-8 w-8 text-gray-600"
                        >
                          <MoveUp className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          size="icon"
                          variant="outline"
                          onClick={() => handleMoveSlide(idx, 'down')}
                          disabled={idx === sliderList.length - 1 || sliderLoading}
                          title="Move slide down"
                          className="h-8 w-8 text-gray-600"
                        >
                          <MoveDown className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          size="icon"
                          variant="outline"
                          onClick={() => handleToggleSlideActive(idx)}
                          disabled={sliderLoading}
                          title={slide.active === false ? 'Activate slide' : 'Deactivate slide'}
                          className={`h-8 w-8 ${slide.active === false ? 'text-gray-400' : 'text-emerald-600'}`}
                        >
                          <Check className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          size="icon"
                          variant="outline"
                          onClick={() => handleOpenSlideModal(idx)}
                          disabled={sliderLoading}
                          title="Edit slide"
                          className="h-8 w-8 text-sky-600 hover:bg-sky-50"
                        >
                          <Edit className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          size="icon"
                          variant="outline"
                          onClick={() => handleDeleteSlide(idx)}
                          disabled={sliderLoading}
                          title="Delete slide"
                          className="h-8 w-8 text-red-500 hover:bg-red-50"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* ========================================================= */}
          {/* PAGE 6: PROMOTIONAL BANNER SETUP (ADMIN)                  */}
          {/* ========================================================= */}
          {activeMenu === 'promo-banner' && user.role === 'ADMIN' && (
            <Card className="p-5 bg-white border border-gray-200 shadow-xs space-y-5">
              <div className="flex items-center justify-between flex-wrap gap-2 pb-3 border-b border-gray-100">
                <div>
                  <h2 className="font-bold text-base text-gray-900 flex items-center gap-2">
                    <Zap className="h-5 w-5 text-sky-600" /> Product Detail Promotional Event Banner
                  </h2>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Displays a prominent announcement ribbon above product price blocks to boost flash sales.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Label htmlFor="banner-page-switch" className="text-xs font-semibold text-gray-700">
                    {bannerEnabled ? 'Active' : 'Disabled'}
                  </Label>
                  <Switch
                    id="banner-page-switch"
                    checked={bannerEnabled}
                    onCheckedChange={setBannerEnabled}
                    className="data-[state=checked]:bg-sky-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label className="text-xs font-semibold text-gray-700">Banner Title</Label>
                  <Input
                    value={bannerTitle}
                    onChange={(e) => setBannerTitle(e.target.value)}
                    placeholder="e.g. SHOP NOW! 10.10 SHOPPING FEST"
                    className="text-xs h-9 bg-white"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-semibold text-gray-700">Tag / Badge Text</Label>
                  <Input
                    value={bannerTag}
                    onChange={(e) => setBannerTag(e.target.value)}
                    placeholder="e.g. LIMITED TIME OFFER"
                    className="text-xs h-9 bg-white"
                  />
                </div>
              </div>

              {/* Live Preview */}
              <div className="space-y-1.5 pt-2">
                <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block">
                  Live Preview:
                </span>
                {bannerEnabled && bannerTitle.trim() ? (
                  <div className="bg-gradient-to-r from-sky-500 to-cyan-500 text-white px-4 py-2.5 rounded-lg flex items-center justify-between text-xs font-bold shadow-xs">
                    <div className="flex items-center gap-2">
                      <Zap className="h-4 w-4 fill-white text-white" />
                      <span>{bannerTitle}</span>
                    </div>
                    {bannerTag && (
                      <span className="text-[11px] bg-black/20 px-2 py-0.5 rounded font-normal">
                        {bannerTag}
                      </span>
                    )}
                  </div>
                ) : (
                  <div className="p-4 bg-gray-50 border border-dashed border-gray-200 rounded-lg text-center text-xs text-gray-400">
                    Banner is currently disabled. Toggle switch to preview.
                  </div>
                )}
              </div>

              <div className="flex gap-2 pt-2 justify-end border-t border-gray-100">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleDeleteBanner}
                  disabled={bannerLoading}
                  className="text-xs h-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  Delete Configuration
                </Button>
                <Button
                  type="button"
                  size="sm"
                  onClick={handleSaveBanner}
                  disabled={bannerLoading}
                  className="text-xs h-8 bg-sky-600 hover:bg-sky-700 text-white font-semibold"
                >
                  {bannerLoading ? 'Saving...' : 'Save Banner Settings'}
                </Button>
              </div>
            </Card>
          )}

          {/* ========================================================= */}
          {/* PAGE 7: DELIVERY & SHIPPING SETUP (ADMIN)                 */}
          {/* ========================================================= */}
          {activeMenu === 'delivery-setup' && user.role === 'ADMIN' && (
            <Card className="p-5 bg-white border border-gray-200 shadow-xs space-y-5">
              <div className="pb-3 border-b border-gray-100">
                <h2 className="font-bold text-base text-gray-900 flex items-center gap-2">
                  <Truck className="h-5 w-5 text-sky-600" /> Delivery, Shipping &amp; Warranty Configuration
                </h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  Configure default delivery hub locations, flat shipping charges, turnaround estimates, and warranty policies across product detail views.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1 sm:col-span-2">
                  <Label className="text-xs font-semibold text-gray-700">Default Delivery Location / Hub</Label>
                  <Input
                    value={deliveryAddress}
                    onChange={(e) => setDeliveryAddress(e.target.value)}
                    placeholder="e.g. Dhaka, Dhaka North, Banani Road No. 12 - 19"
                    className="text-xs h-9 bg-white"
                  />
                  <p className="text-[11px] text-gray-400">
                    Displayed on product pages before customer specifies custom delivery address.
                  </p>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-semibold text-gray-700">Standard Delivery Fee (৳)</Label>
                  <Input
                    type="number"
                    value={deliveryFee}
                    onChange={(e) => setDeliveryFee(e.target.value)}
                    placeholder="90"
                    className="text-xs h-9 bg-white"
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-semibold text-gray-700">Guaranteed Delivery Duration</Label>
                  <Input
                    value={deliveryEstimatedDays}
                    onChange={(e) => setDeliveryEstimatedDays(e.target.value)}
                    placeholder="e.g. Guaranteed within 2-3 days"
                    className="text-xs h-9 bg-white"
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-semibold text-gray-700">Default Return Policy</Label>
                  <Input
                    value={defaultReturnPolicy}
                    onChange={(e) => setDefaultReturnPolicy(e.target.value)}
                    placeholder="e.g. 14 days easy return"
                    className="text-xs h-9 bg-white"
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-semibold text-gray-700">Authenticity Badge Text</Label>
                  <Input
                    value={authenticText}
                    onChange={(e) => setAuthenticText(e.target.value)}
                    placeholder="e.g. 100% Authentic Product"
                    className="text-xs h-9 bg-white"
                  />
                </div>

                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="space-y-0.5">
                    <Label className="text-xs font-semibold text-gray-700">Cash on Delivery (COD)</Label>
                    <p className="text-[11px] text-gray-400">Allow customers to pay cash upon package receipt</p>
                  </div>
                  <Switch
                    checked={deliveryCod}
                    onCheckedChange={setDeliveryCod}
                    className="data-[state=checked]:bg-sky-600"
                  />
                </div>

                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="space-y-0.5">
                    <Label className="text-xs font-semibold text-gray-700">Change of Mind Applicable</Label>
                    <p className="text-[11px] text-gray-400">Permit returns for change of mind on unopened goods</p>
                  </div>
                  <Switch
                    checked={changeOfMindApplicable}
                    onCheckedChange={setChangeOfMindApplicable}
                    className="data-[state=checked]:bg-sky-600"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-2 justify-end border-t border-gray-100">
                <Button
                  type="button"
                  size="sm"
                  onClick={handleSaveDeliveryConfig}
                  disabled={deliveryConfigLoading}
                  className="text-xs h-8 bg-sky-600 hover:bg-sky-700 text-white font-semibold"
                >
                  {deliveryConfigLoading ? 'Saving...' : 'Save Delivery & Shipping Settings'}
                </Button>
              </div>
            </Card>
          )}
        </main>
      </div>

      {/* Add / Edit Hero Slide Modal */}
      <Dialog open={slideModalOpen} onOpenChange={setSlideModalOpen}>
        <DialogContent className="sm:max-w-[560px]">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-gray-900 flex items-center gap-2">
              <Sliders className="h-4 w-4 text-sky-600" />
              {editingSlideIndex !== null ? 'Edit Hero Slide' : 'Add New Hero Slide'}
            </DialogTitle>
            <DialogDescription className="text-xs text-gray-500">
              Configure banner typography, call-to-action button, background gradient or custom image.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3.5 py-2">
            {/* Live dialog preview */}
            <div
              className={`rounded-xl p-4 bg-gradient-to-r ${modalGradient} text-white relative overflow-hidden min-h-[140px] flex flex-col justify-between shadow-xs`}
              style={modalImage ? { backgroundImage: `url(${modalImage})`, backgroundSize: 'cover' } : {}}
            >
              <div className="flex items-center justify-between relative z-10">
                <span className="text-[10px] font-bold bg-white/20 backdrop-blur px-2 py-0.5 rounded-full uppercase">
                  {modalTag || 'Special Offer'}
                </span>
                <span className="text-[10px] bg-black/20 px-2 py-0.5 rounded">Preview</span>
              </div>
              <div className="relative z-10 my-1">
                <h3 className="text-xl sm:text-2xl font-black leading-tight line-clamp-1">
                  {modalTitle || 'Slide Headline Here'}
                </h3>
                <p className="text-xs opacity-90 line-clamp-1 mt-0.5">
                  {modalSubtitle || 'Subtext description explaining your offer.'}
                </p>
              </div>
              <div className="relative z-10 self-start">
                <span className="text-xs font-bold bg-white text-gray-900 px-3 py-1 rounded shadow-xs inline-block">
                  {modalCtaLabel || 'Shop Now'}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="sm:col-span-2 space-y-1">
                <Label className="text-xs font-semibold text-gray-700">Slide Headline / Title *</Label>
                <Input
                  value={modalTitle}
                  onChange={(e) => setModalTitle(e.target.value)}
                  placeholder="e.g. Up to 70% OFF Mega Bonanza"
                  className="text-xs h-8"
                />
              </div>

              <div className="sm:col-span-2 space-y-1">
                <Label className="text-xs font-semibold text-gray-700">Subtitle / Description</Label>
                <Input
                  value={modalSubtitle}
                  onChange={(e) => setModalSubtitle(e.target.value)}
                  placeholder="e.g. Discover amazing deals across Electronics, Fashion & Home"
                  className="text-xs h-8"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold text-gray-700">Badge / Tag</Label>
                <Input
                  value={modalTag}
                  onChange={(e) => setModalTag(e.target.value)}
                  placeholder="e.g. 🎁 Mega Bonanza"
                  className="text-xs h-8"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold text-gray-700">Button Label</Label>
                <Input
                  value={modalCtaLabel}
                  onChange={(e) => setModalCtaLabel(e.target.value)}
                  placeholder="e.g. Shop Now"
                  className="text-xs h-8"
                />
              </div>

              <div className="sm:col-span-2 space-y-1">
                <Label className="text-xs font-semibold text-gray-700">Button Search Query</Label>
                <Input
                  value={modalCtaSearchQuery}
                  onChange={(e) => setModalCtaSearchQuery(e.target.value)}
                  placeholder="e.g. smartphone, fashion, sale (or leave blank to go home)"
                  className="text-xs h-8"
                />
              </div>

              {/* Gradient selector */}
              <div className="sm:col-span-2 space-y-1.5">
                <Label className="text-xs font-semibold text-gray-700">Background Gradient Theme</Label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                  {GRADIENT_PRESETS.map((preset) => (
                    <button
                      key={preset.value}
                      type="button"
                      onClick={() => setModalGradient(preset.value)}
                      className={`text-[11px] p-2 rounded-lg border text-left flex items-center gap-1.5 transition ${
                        modalGradient === preset.value
                          ? 'border-sky-600 bg-sky-50 font-bold text-sky-800'
                          : 'border-gray-200 hover:border-gray-300 text-gray-700'
                      }`}
                    >
                      <span className={`w-3.5 h-3.5 rounded-full bg-gradient-to-r ${preset.value} shrink-0`} />
                      <span className="truncate">{preset.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom Image Upload */}
              <div className="sm:col-span-2 space-y-1.5 pt-1">
                <Label className="text-xs font-semibold text-gray-700">Optional Background Image</Label>
                <div className="flex gap-2">
                  <Input
                    value={modalImage}
                    onChange={(e) => setModalImage(e.target.value)}
                    placeholder="Paste image URL (https://...) or upload below"
                    className="text-xs h-8 flex-1"
                  />
                  {modalImage && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setModalImage('')}
                      className="text-xs h-8 text-red-500"
                    >
                      Clear
                    </Button>
                  )}
                </div>
                <div className="flex items-center gap-2 pt-1">
                  <Label
                    htmlFor="slide-img-upload"
                    className="cursor-pointer inline-flex items-center gap-1.5 text-xs text-sky-600 hover:text-sky-700 font-semibold bg-sky-50 hover:bg-sky-100 border border-sky-200 px-3 py-1.5 rounded-md transition"
                  >
                    <Upload className="h-3.5 w-3.5" />
                    {uploadingImage ? 'Uploading...' : 'Upload Image File'}
                  </Label>
                  <input
                    id="slide-img-upload"
                    type="file"
                    accept="image/*"
                    onChange={handleUploadSlideImage}
                    className="hidden"
                    disabled={uploadingImage}
                  />
                  <span className="text-[11px] text-gray-400">JPG, PNG, WebP up to 6MB</span>
                </div>
              </div>

              <div className="sm:col-span-2 flex items-center justify-between p-2.5 bg-gray-50 rounded-lg border border-gray-200">
                <div className="space-y-0.5">
                  <Label className="text-xs font-semibold text-gray-700">Slide Active</Label>
                  <p className="text-[11px] text-gray-400">Show this slide in homepage hero carousel</p>
                </div>
                <Switch
                  checked={modalActive}
                  onCheckedChange={setModalActive}
                  className="data-[state=checked]:bg-sky-600"
                />
              </div>
            </div>
          </div>

          <DialogFooter className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setSlideModalOpen(false)}
              className="text-xs"
            >
              Cancel
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleSaveModalSlide}
              className="bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold"
            >
              Save Slide
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Daraz Seller Center Product Input Form */}
      <DarazProductForm
        open={formOpen}
        onOpenChange={setFormOpen}
        product={editingProduct}
        categories={categories}
        onSuccess={fetchAll}
      />
    </div>
  )
}
