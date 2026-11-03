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
  Loader2,
  Search,
  FolderTree,
  Tag,
  Flame,
  Clock,
  Calendar,
  MapPin,
  Phone,
  Headphones,
  Copy,
  Building2,
  Navigation,
  Home,
} from 'lucide-react'
import { toast } from 'sonner'
import { formatBDT } from '@/lib/format'
import { useStore as useZustandStore } from '@/lib/store'
import { DarazProductForm } from '@/components/ecommerce/daraz-product-form'
import { HERO_SLIDES, type HeroSlide } from '@/lib/brand'
import {
  DEFAULT_DELIVERY_CONFIG,
  DEFAULT_DELIVERY_LOCATIONS,
  DEFAULT_DELIVERY_HUBS,
  type DeliveryLocation,
  type DeliveryHub,
  type DeliveryConfig,
  type DeliveryChannelType,
  calculateDeliveryFee,
} from '@/lib/delivery'
import {
  DEFAULT_TOPBAR_CONFIG,
  type TopbarConfig,
} from '@/lib/topbar'

export type AdminMenuKey =
  | 'overview'
  | 'products'
  | 'categories'
  | 'orders'
  | 'users'
  | 'sliders'
  | 'promo-banner'
  | 'delivery-setup'
  | 'flash-sale'
  | 'topbar-config'

export const CATEGORY_ICON_PRESETS = [
  { key: 'laptop', label: 'Electronics', emoji: '💻' },
  { key: 'smartphone', label: 'Smartphones', emoji: '📱' },
  { key: 'shirt', label: 'Fashion & Clothes', emoji: '👕' },
  { key: 'sofa', label: 'Home & Living', emoji: '🛋️' },
  { key: 'heart', label: 'Beauty & Health', emoji: '❤️' },
  { key: 'dumbbell', label: 'Sports & Fitness', emoji: '🏋️' },
  { key: 'shopping-cart', label: 'Groceries', emoji: '🛒' },
  { key: 'book', label: 'Books & Stationery', emoji: '📚' },
  { key: 'watch', label: 'Watches', emoji: '⌚' },
  { key: 'gamepad', label: 'Gaming', emoji: '🎮' },
  { key: 'baby', label: 'Baby & Kids', emoji: '🍼' },
  { key: 'utensils', label: 'Kitchen & Dining', emoji: '🍳' },
  { key: 'car', label: 'Motors & Auto', emoji: '🚗' },
  { key: 'sparkles', label: 'Jewelry & Luxury', emoji: '💎' },
  { key: 'tag', label: 'Deals / Other', emoji: '🏷️' },
]

export function getCategoryDisplayEmoji(icon: string | null | undefined): string {
  if (!icon) return '🛍️'
  const found = CATEGORY_ICON_PRESETS.find((p) => p.key === icon || p.emoji === icon)
  if (found) return found.emoji
  return icon
}

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
  const fetchSiteConfig = useStore((s) => s.fetchSiteConfig)

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

  // Bulk-confirm state (admin pending orders grid)
  const [selectedPendingIds, setSelectedPendingIds] = useState<Set<string>>(new Set())
  const [bulkConfirming, setBulkConfirming] = useState(false)

  // Category management state
  const [categoryList, setCategoryList] = useState<any[]>(categories || [])
  const [categorySearch, setCategorySearch] = useState('')
  const [categoryModalOpen, setCategoryModalOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<any | null>(null)
  const [catFormName, setCatFormName] = useState('')
  const [catFormParentId, setCatFormParentId] = useState('none')
  const [catFormIcon, setCatFormIcon] = useState('tag')
  const [catFormSaving, setCatFormSaving] = useState(false)
  const [catDeleteLoading, setCatDeleteLoading] = useState<string | null>(null)

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
  const [deliveryEstimatedDays, setDeliveryEstimatedDays] = useState('Guaranteed within 1-2 days')
  const [deliveryCod, setDeliveryCod] = useState(true)
  const [defaultReturnPolicy, setDefaultReturnPolicy] = useState('14 days easy return')
  const [changeOfMindApplicable, setChangeOfMindApplicable] = useState(true)
  const [authenticText, setAuthenticText] = useState('100% Authentic Product')
  const [defaultHubFee, setDefaultHubFee] = useState('40')
  const [freeThreshold, setFreeThreshold] = useState('1500')
  const [inHouseFleetName, setInHouseFleetName] = useState('ShopZilla In-House Express Fleet')
  const [customerCareHotline, setCustomerCareHotline] = useState('+880 9612-345678')
  const [deliveryConfigLoading, setDeliveryConfigLoading] = useState(false)

  // Delivery Channel & Location Module Application State
  const [deliverySubTab, setDeliverySubTab] = useState<'locations' | 'hubs' | 'customer-care' | 'settings'>('locations')
  const [deliveryLocationsList, setDeliveryLocationsList] = useState<DeliveryLocation[]>(DEFAULT_DELIVERY_LOCATIONS)
  const [deliveryHubsList, setDeliveryHubsList] = useState<DeliveryHub[]>(DEFAULT_DELIVERY_HUBS)
  const [locationSearch, setLocationSearch] = useState('')
  const [hubSearch, setHubSearch] = useState('')

  // Location Modal State
  const [locModalOpen, setLocModalOpen] = useState(false)
  const [editingLocId, setEditingLocId] = useState<string | null>(null)
  const [locName, setLocName] = useState('')
  const [locDivision, setLocDivision] = useState('Dhaka')
  const [locHomeCharge, setLocHomeCharge] = useState('90')
  const [locHubCharge, setLocHubCharge] = useState('40')
  const [locEstHome, setLocEstHome] = useState('1-2 Days (In-House Fleet)')
  const [locEstHub, setLocEstHub] = useState('1-2 Days')
  const [locInHouse, setLocInHouse] = useState(true)
  const [locHubAvailable, setLocHubAvailable] = useState(true)
  const [locCod, setLocCod] = useState(true)
  const [locActive, setLocActive] = useState(true)

  // Hub Modal State
  const [hubModalOpen, setHubModalOpen] = useState(false)
  const [editingHubId, setEditingHubId] = useState<string | null>(null)
  const [hubName, setHubName] = useState('')
  const [hubCode, setHubCode] = useState('')
  const [hubLocationName, setHubLocationName] = useState('Dhaka City (Inside Dhaka)')
  const [hubDivision, setHubDivision] = useState('Dhaka')
  const [hubAddress, setHubAddress] = useState('')
  const [hubPhone, setHubPhone] = useState('')
  const [hubManager, setHubManager] = useState('')
  const [hubHours, setHubHours] = useState('9:00 AM - 8:30 PM (Sat - Thu)')
  const [hubFee, setHubFee] = useState('40')
  const [hubActive, setHubActive] = useState(true)

  // Customer Care Tool State
  const [ccLocationId, setCcLocationId] = useState<string>('loc_dhaka_city')
  const [ccSubtotal, setCcSubtotal] = useState<string>('850')
  const [ccSearchOrderQuery, setCcSearchOrderQuery] = useState('')
  const [ccSelectedOrder, setCcSelectedOrder] = useState<any | null>(null)
  const [ccNewChannel, setCcNewChannel] = useState<'HOME_DELIVERY' | 'DELIVERY_HUB'>('HOME_DELIVERY')
  const [ccNewHubName, setCcNewHubName] = useState('')
  const [ccNewShipping, setCcNewShipping] = useState('90')
  const [ccSavingOrder, setCcSavingOrder] = useState(false)

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

  // Flash Sale Parameterized State
  const [flashSaleEnabled, setFlashSaleEnabled] = useState(true)
  const [flashSaleTitle, setFlashSaleTitle] = useState('Flash Sale')
  const [flashSaleDiscountNote, setFlashSaleDiscountNote] = useState('On Sale Now')
  const [flashSaleStartTime, setFlashSaleStartTime] = useState('')
  const [flashSaleEndTime, setFlashSaleEndTime] = useState('')
  const [flashSaleSaving, setFlashSaleSaving] = useState(false)

  // Top Bar & Header Navigation State (SiteConfig: 'topbar_config')
  const [topbarEnabled, setTopbarEnabled] = useState(DEFAULT_TOPBAR_CONFIG.enabled)
  const [topbarPromoText, setTopbarPromoText] = useState(DEFAULT_TOPBAR_CONFIG.promoText)
  const [topbarPromoTextMobile, setTopbarPromoTextMobile] = useState(DEFAULT_TOPBAR_CONFIG.promoTextMobile)
  const [topbarContactPhone, setTopbarContactPhone] = useState(DEFAULT_TOPBAR_CONFIG.contactPhone)
  const [topbarTrackOrderText, setTopbarTrackOrderText] = useState(DEFAULT_TOPBAR_CONFIG.trackOrderText)
  const [topbarHelpText, setTopbarHelpText] = useState(DEFAULT_TOPBAR_CONFIG.helpText)
  const [topbarSubBarFlashText, setTopbarSubBarFlashText] = useState(DEFAULT_TOPBAR_CONFIG.subBarFlashText)
  const [topbarSubBarFreeDeliveryText, setTopbarSubBarFreeDeliveryText] = useState(DEFAULT_TOPBAR_CONFIG.subBarFreeDeliveryText)
  const [topbarShowTrackOrder, setTopbarShowTrackOrder] = useState(DEFAULT_TOPBAR_CONFIG.showTrackOrder)
  const [topbarShowHelp, setTopbarShowHelp] = useState(DEFAULT_TOPBAR_CONFIG.showHelp)
  const [topbarShowContactPhone, setTopbarShowContactPhone] = useState(DEFAULT_TOPBAR_CONFIG.showContactPhone)
  const [topbarShowFlashSaleBadge, setTopbarShowFlashSaleBadge] = useState(DEFAULT_TOPBAR_CONFIG.showFlashSaleBadge)
  const [topbarShowFreeDeliveryBadge, setTopbarShowFreeDeliveryBadge] = useState(DEFAULT_TOPBAR_CONFIG.showFreeDeliveryBadge)
  const [topbarSaving, setTopbarSaving] = useState(false)

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
        if (d.deliveryConfig.defaultHomeDeliveryFee !== undefined) setDeliveryFee(String(d.deliveryConfig.defaultHomeDeliveryFee))
        if (d.deliveryConfig.defaultHubDeliveryFee !== undefined) setDefaultHubFee(String(d.deliveryConfig.defaultHubDeliveryFee))
        if (d.deliveryConfig.freeDeliveryThreshold !== undefined) setFreeThreshold(String(d.deliveryConfig.freeDeliveryThreshold))
        if (d.deliveryConfig.inHouseFleetName !== undefined) setInHouseFleetName(d.deliveryConfig.inHouseFleetName)
        if (d.deliveryConfig.customerCareHotline !== undefined) setCustomerCareHotline(d.deliveryConfig.customerCareHotline)
        if (d.deliveryConfig.estimatedDays !== undefined) setDeliveryEstimatedDays(d.deliveryConfig.estimatedDays)
        if (d.deliveryConfig.codAvailable !== undefined) setDeliveryCod(d.deliveryConfig.codAvailable)
        if (d.deliveryConfig.returnPolicyDefault !== undefined) setDefaultReturnPolicy(d.deliveryConfig.returnPolicyDefault)
        if (d.deliveryConfig.changeOfMindApplicable !== undefined) setChangeOfMindApplicable(d.deliveryConfig.changeOfMindApplicable)
        if (d.deliveryConfig.authenticProductText !== undefined) setAuthenticText(d.deliveryConfig.authenticProductText)
      }

      if (d?.deliveryLocations && Array.isArray(d.deliveryLocations) && d.deliveryLocations.length > 0) {
        setDeliveryLocationsList(d.deliveryLocations)
      } else {
        setDeliveryLocationsList(DEFAULT_DELIVERY_LOCATIONS)
      }

      if (d?.deliveryHubs && Array.isArray(d.deliveryHubs) && d.deliveryHubs.length > 0) {
        setDeliveryHubsList(d.deliveryHubs)
      } else {
        setDeliveryHubsList(DEFAULT_DELIVERY_HUBS)
      }

      if (d?.heroSlides && Array.isArray(d.heroSlides) && d.heroSlides.length > 0) {
        setSliderList(d.heroSlides)
      } else {
        setSliderList(HERO_SLIDES)
      }

      if (d?.flashSaleConfig) {
        setFlashSaleEnabled(Boolean(d.flashSaleConfig.enabled))
        setFlashSaleTitle(d.flashSaleConfig.title || 'Flash Sale')
        setFlashSaleDiscountNote(d.flashSaleConfig.discountNote || 'On Sale Now')
        if (d.flashSaleConfig.startTime) {
          const sDate = new Date(d.flashSaleConfig.startTime)
          if (!isNaN(sDate.getTime())) {
            const pad = (n: number) => String(n).padStart(2, '0')
            setFlashSaleStartTime(`${sDate.getFullYear()}-${pad(sDate.getMonth() + 1)}-${pad(sDate.getDate())}T${pad(sDate.getHours())}:${pad(sDate.getMinutes())}`)
          }
        }
        if (d.flashSaleConfig.endTime) {
          const eDate = new Date(d.flashSaleConfig.endTime)
          if (!isNaN(eDate.getTime())) {
            const pad = (n: number) => String(n).padStart(2, '0')
            setFlashSaleEndTime(`${eDate.getFullYear()}-${pad(eDate.getMonth() + 1)}-${pad(eDate.getDate())}T${pad(eDate.getHours())}:${pad(eDate.getMinutes())}`)
          }
        }
      } else {
        const now = new Date()
        const pad = (n: number) => String(n).padStart(2, '0')
        const sDate = new Date(now.getTime() - 3600 * 1000)
        const eDate = new Date(now.getTime() + 86400 * 1000 * 2)
        setFlashSaleStartTime(`${sDate.getFullYear()}-${pad(sDate.getMonth() + 1)}-${pad(sDate.getDate())}T${pad(sDate.getHours())}:${pad(sDate.getMinutes())}`)
        setFlashSaleEndTime(`${eDate.getFullYear()}-${pad(eDate.getMonth() + 1)}-${pad(eDate.getDate())}T${pad(eDate.getHours())}:${pad(eDate.getMinutes())}`)
      }

      if (d?.topbarConfig) {
        setTopbarEnabled(d.topbarConfig.enabled ?? true)
        if (d.topbarConfig.promoText !== undefined) setTopbarPromoText(d.topbarConfig.promoText)
        if (d.topbarConfig.promoTextMobile !== undefined) setTopbarPromoTextMobile(d.topbarConfig.promoTextMobile)
        if (d.topbarConfig.contactPhone !== undefined) setTopbarContactPhone(d.topbarConfig.contactPhone)
        if (d.topbarConfig.trackOrderText !== undefined) setTopbarTrackOrderText(d.topbarConfig.trackOrderText)
        if (d.topbarConfig.helpText !== undefined) setTopbarHelpText(d.topbarConfig.helpText)
        if (d.topbarConfig.subBarFlashText !== undefined) setTopbarSubBarFlashText(d.topbarConfig.subBarFlashText)
        if (d.topbarConfig.subBarFreeDeliveryText !== undefined) setTopbarSubBarFreeDeliveryText(d.topbarConfig.subBarFreeDeliveryText)
        if (d.topbarConfig.showTrackOrder !== undefined) setTopbarShowTrackOrder(d.topbarConfig.showTrackOrder)
        if (d.topbarConfig.showHelp !== undefined) setTopbarShowHelp(d.topbarConfig.showHelp)
        if (d.topbarConfig.showContactPhone !== undefined) setTopbarShowContactPhone(d.topbarConfig.showContactPhone)
        if (d.topbarConfig.showFlashSaleBadge !== undefined) setTopbarShowFlashSaleBadge(d.topbarConfig.showFlashSaleBadge)
        if (d.topbarConfig.showFreeDeliveryBadge !== undefined) setTopbarShowFreeDeliveryBadge(d.topbarConfig.showFreeDeliveryBadge)
      }
    } catch {}
  }

  // Save Flash Sale Configuration
  const handleSaveFlashConfig = async () => {
    setFlashSaleSaving(true)
    try {
      const payload = {
        enabled: flashSaleEnabled,
        title: flashSaleTitle.trim() || 'Flash Sale',
        discountNote: flashSaleDiscountNote.trim() || 'On Sale Now',
        startTime: flashSaleStartTime
          ? new Date(flashSaleStartTime).toISOString()
          : new Date().toISOString(),
        endTime: flashSaleEndTime
          ? new Date(flashSaleEndTime).toISOString()
          : new Date(Date.now() + 86400 * 1000 * 2).toISOString(),
      }
      const res = await fetch('/api/config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          key: 'flash_sale_config',
          value: payload,
        }),
      })
      if (res.ok) {
        toast.success('Flash Sale configuration saved successfully!')
      } else {
        toast.error('Failed to save Flash Sale configuration')
      }
    } catch {
      toast.error('Network error saving Flash Sale configuration')
    } finally {
      setFlashSaleSaving(false)
    }
  }

  // Quick preset helper for Flash Sale
  const handleApplyFlashPreset = (hours: number) => {
    const pad = (n: number) => String(n).padStart(2, '0')
    const start = new Date()
    const end = new Date(start.getTime() + hours * 3600 * 1000)
    setFlashSaleEnabled(true)
    setFlashSaleStartTime(`${start.getFullYear()}-${pad(start.getMonth() + 1)}-${pad(start.getDate())}T${pad(start.getHours())}:${pad(start.getMinutes())}`)
    setFlashSaleEndTime(`${end.getFullYear()}-${pad(end.getMonth() + 1)}-${pad(end.getDate())}T${pad(end.getHours())}:${pad(end.getMinutes())}`)
    toast.info(`Flash Sale window set for ${hours} hours from now`)
  }

  // Save Topbar Configuration (Admin)
  const handleSaveTopbarConfig = async () => {
    setTopbarSaving(true)
    try {
      const payload: TopbarConfig = {
        enabled: topbarEnabled,
        promoText: topbarPromoText.trim(),
        promoTextMobile: topbarPromoTextMobile.trim(),
        contactPhone: topbarContactPhone.trim(),
        trackOrderText: topbarTrackOrderText.trim(),
        helpText: topbarHelpText.trim(),
        subBarFlashText: topbarSubBarFlashText.trim(),
        subBarFreeDeliveryText: topbarSubBarFreeDeliveryText.trim(),
        showTrackOrder: topbarShowTrackOrder,
        showHelp: topbarShowHelp,
        showContactPhone: topbarShowContactPhone,
        showFlashSaleBadge: topbarShowFlashSaleBadge,
        showFreeDeliveryBadge: topbarShowFreeDeliveryBadge,
      }
      const res = await fetch('/api/config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          key: 'topbar_config',
          value: payload,
        }),
      })
      if (res.ok) {
        toast.success('Top bar configuration saved successfully!')
        await fetchSiteConfig(true)
      } else {
        toast.error('Failed to save top bar configuration')
      }
    } catch {
      toast.error('Network error saving top bar configuration')
    } finally {
      setTopbarSaving(false)
    }
  }

  const handleResetTopbarDefaults = () => {
    setTopbarEnabled(DEFAULT_TOPBAR_CONFIG.enabled)
    setTopbarPromoText(DEFAULT_TOPBAR_CONFIG.promoText)
    setTopbarPromoTextMobile(DEFAULT_TOPBAR_CONFIG.promoTextMobile)
    setTopbarContactPhone(DEFAULT_TOPBAR_CONFIG.contactPhone)
    setTopbarTrackOrderText(DEFAULT_TOPBAR_CONFIG.trackOrderText)
    setTopbarHelpText(DEFAULT_TOPBAR_CONFIG.helpText)
    setTopbarSubBarFlashText(DEFAULT_TOPBAR_CONFIG.subBarFlashText)
    setTopbarSubBarFreeDeliveryText(DEFAULT_TOPBAR_CONFIG.subBarFreeDeliveryText)
    setTopbarShowTrackOrder(DEFAULT_TOPBAR_CONFIG.showTrackOrder)
    setTopbarShowHelp(DEFAULT_TOPBAR_CONFIG.showHelp)
    setTopbarShowContactPhone(DEFAULT_TOPBAR_CONFIG.showContactPhone)
    setTopbarShowFlashSaleBadge(DEFAULT_TOPBAR_CONFIG.showFlashSaleBadge)
    setTopbarShowFreeDeliveryBadge(DEFAULT_TOPBAR_CONFIG.showFreeDeliveryBadge)
    toast.info('Top bar reset to default brand values (remember to click Save)')
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
            standardFee: parseFloat(deliveryFee) || 90,
            defaultHomeDeliveryFee: parseFloat(deliveryFee) || 90,
            defaultHubDeliveryFee: parseFloat(defaultHubFee) || 40,
            freeDeliveryThreshold: parseFloat(freeThreshold) || 0,
            inHouseFleetName: inHouseFleetName.trim(),
            customerCareHotline: customerCareHotline.trim(),
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
        useZustandStore.getState().fetchSiteConfig(true)
      } else {
        toast.error('Failed to save delivery configuration')
      }
    } catch {
      toast.error('Network error saving delivery configuration')
    } finally {
      setDeliveryConfigLoading(false)
    }
  }

  // Save Delivery Locations list
  const saveDeliveryLocations = async (locations: DeliveryLocation[]) => {
    try {
      const res = await fetch('/api/config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          key: 'delivery_locations',
          value: locations,
        }),
      })
      if (res.ok) {
        setDeliveryLocationsList(locations)
        useZustandStore.getState().fetchSiteConfig(true)
        return true
      }
      return false
    } catch {
      return false
    }
  }

  // Location Modal Handlers
  const handleOpenAddLocation = () => {
    setEditingLocId(null)
    setLocName('')
    setLocDivision('Dhaka')
    setLocHomeCharge('90')
    setLocHubCharge('40')
    setLocEstHome('1-2 Days (In-House Fleet)')
    setLocEstHub('1-2 Days')
    setLocInHouse(true)
    setLocHubAvailable(true)
    setLocCod(true)
    setLocActive(true)
    setLocModalOpen(true)
  }

  const handleOpenEditLocation = (loc: DeliveryLocation) => {
    setEditingLocId(loc.id)
    setLocName(loc.name)
    setLocDivision(loc.division)
    setLocHomeCharge(String(loc.homeDeliveryCharge))
    setLocHubCharge(String(loc.hubDeliveryCharge))
    setLocEstHome(loc.estimatedDaysHome)
    setLocEstHub(loc.estimatedDaysHub)
    setLocInHouse(loc.inHouseDeliveryAvailable)
    setLocHubAvailable(loc.hubPickupAvailable)
    setLocCod(loc.codAvailable)
    setLocActive(loc.active)
    setLocModalOpen(true)
  }

  const handleSaveLocationModal = async () => {
    if (!locName.trim()) {
      toast.error('Location name is required')
      return
    }

    const homeCharge = parseFloat(locHomeCharge) || 90
    const hubCharge = parseFloat(locHubCharge) || 40

    let updated: DeliveryLocation[]
    if (editingLocId) {
      updated = deliveryLocationsList.map((l) =>
        l.id === editingLocId
          ? {
              ...l,
              name: locName.trim(),
              division: locDivision,
              homeDeliveryCharge: homeCharge,
              hubDeliveryCharge: hubCharge,
              estimatedDaysHome: locEstHome.trim() || '1-2 Days',
              estimatedDaysHub: locEstHub.trim() || '1-2 Days',
              inHouseDeliveryAvailable: locInHouse,
              hubPickupAvailable: locHubAvailable,
              codAvailable: locCod,
              active: locActive,
            }
          : l
      )
    } else {
      const newLoc: DeliveryLocation = {
        id: 'loc_' + Date.now(),
        name: locName.trim(),
        division: locDivision,
        homeDeliveryCharge: homeCharge,
        hubDeliveryCharge: hubCharge,
        estimatedDaysHome: locEstHome.trim() || '1-2 Days',
        estimatedDaysHub: locEstHub.trim() || '1-2 Days',
        inHouseDeliveryAvailable: locInHouse,
        hubPickupAvailable: locHubAvailable,
        codAvailable: locCod,
        active: locActive,
      }
      updated = [...deliveryLocationsList, newLoc]
    }

    const success = await saveDeliveryLocations(updated)
    if (success) {
      toast.success(editingLocId ? 'Delivery location updated!' : 'New delivery location added!')
      setLocModalOpen(false)
    } else {
      toast.error('Failed to save delivery location')
    }
  }

  const handleDeleteLocation = async (id: string) => {
    if (deliveryLocationsList.length <= 1) {
      toast.error('At least one delivery location must remain active')
      return
    }
    const filtered = deliveryLocationsList.filter((l) => l.id !== id)
    const success = await saveDeliveryLocations(filtered)
    if (success) {
      toast.success('Delivery location removed')
    } else {
      toast.error('Failed to delete delivery location')
    }
  }

  const handleToggleLocationActive = async (id: string, active: boolean) => {
    const updated = deliveryLocationsList.map((l) => (l.id === id ? { ...l, active } : l))
    await saveDeliveryLocations(updated)
  }

  // Save Delivery Hubs list
  const saveDeliveryHubs = async (hubs: DeliveryHub[]) => {
    try {
      const res = await fetch('/api/config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          key: 'delivery_hubs',
          value: hubs,
        }),
      })
      if (res.ok) {
        setDeliveryHubsList(hubs)
        useZustandStore.getState().fetchSiteConfig(true)
        return true
      }
      return false
    } catch {
      return false
    }
  }

  // Hub Modal Handlers
  const handleOpenAddHub = () => {
    setEditingHubId(null)
    setHubName('')
    setHubCode('HUB-' + Math.floor(100 + Math.random() * 900))
    setHubLocationName(deliveryLocationsList[0]?.name || 'Dhaka City (Inside Dhaka)')
    setHubDivision(deliveryLocationsList[0]?.division || 'Dhaka')
    setHubAddress('')
    setHubPhone('+880 1711-000000')
    setHubManager('')
    setHubHours('9:00 AM - 8:30 PM (Sat - Thu)')
    setHubFee('40')
    setHubActive(true)
    setHubModalOpen(true)
  }

  const handleOpenEditHub = (hub: DeliveryHub) => {
    setEditingHubId(hub.id)
    setHubName(hub.name)
    setHubCode(hub.code)
    setHubLocationName(hub.locationName)
    setHubDivision(hub.division)
    setHubAddress(hub.address)
    setHubPhone(hub.phone)
    setHubManager(hub.managerName || '')
    setHubHours(hub.operatingHours)
    setHubFee(String(hub.fee))
    setHubActive(hub.active)
    setHubModalOpen(true)
  }

  const handleSaveHubModal = async () => {
    if (!hubName.trim() || !hubAddress.trim()) {
      toast.error('Hub name and full address are required')
      return
    }

    const feeNum = parseFloat(hubFee) || 40

    let updated: DeliveryHub[]
    if (editingHubId) {
      updated = deliveryHubsList.map((h) =>
        h.id === editingHubId
          ? {
              ...h,
              name: hubName.trim(),
              code: hubCode.trim() || h.code,
              locationName: hubLocationName,
              division: hubDivision,
              address: hubAddress.trim(),
              phone: hubPhone.trim(),
              managerName: hubManager.trim(),
              operatingHours: hubHours.trim(),
              fee: feeNum,
              active: hubActive,
            }
          : h
      )
    } else {
      const newHub: DeliveryHub = {
        id: 'hub_' + Date.now(),
        name: hubName.trim(),
        code: hubCode.trim() || 'HUB-' + Date.now().toString().slice(-4),
        locationName: hubLocationName,
        division: hubDivision,
        address: hubAddress.trim(),
        phone: hubPhone.trim(),
        managerName: hubManager.trim(),
        operatingHours: hubHours.trim(),
        fee: feeNum,
        active: hubActive,
      }
      updated = [...deliveryHubsList, newHub]
    }

    const success = await saveDeliveryHubs(updated)
    if (success) {
      toast.success(editingHubId ? 'Delivery Hub updated!' : 'New Delivery Hub added!')
      setHubModalOpen(false)
    } else {
      toast.error('Failed to save delivery hub')
    }
  }

  const handleDeleteHub = async (id: string) => {
    const filtered = deliveryHubsList.filter((h) => h.id !== id)
    const success = await saveDeliveryHubs(filtered)
    if (success) {
      toast.success('Delivery hub removed')
    } else {
      toast.error('Failed to delete delivery hub')
    }
  }

  const handleToggleHubActive = async (id: string, active: boolean) => {
    const updated = deliveryHubsList.map((h) => (h.id === id ? { ...h, active } : h))
    await saveDeliveryHubs(updated)
  }

  // Customer Care Tool Action: Update order channel
  const handleCustomerCareUpdateOrder = async () => {
    if (!ccSelectedOrder) {
      toast.error('Please select an order first')
      return
    }

    setCcSavingOrder(true)
    try {
      const res = await fetch('/api/orders', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: ccSelectedOrder.id,
          deliveryChannel: ccNewChannel,
          deliveryHubName: ccNewChannel === 'DELIVERY_HUB' ? ccNewHubName : undefined,
          shipping: parseFloat(ccNewShipping) || 0,
        }),
      })

      if (res.ok) {
        const d = await res.json()
        toast.success(`Order #${ccSelectedOrder.orderNumber} delivery channel updated!`)
        // Update local order list
        setOrders((prev) => prev.map((o) => (o.id === ccSelectedOrder.id ? d.order : o)))
        setCcSelectedOrder(d.order)
      } else {
        toast.error('Failed to update order delivery channel')
      }
    } catch {
      toast.error('Network error updating order')
    } finally {
      setCcSavingOrder(false)
    }
  }

  // Copy Customer Care Quote Helper
  const handleCopyCustomerCareQuote = (loc: DeliveryLocation) => {
    const hubs = deliveryHubsList.filter(
      (h) => h.active && (h.locationName === loc.name || h.division === loc.division)
    )
    const hubText = hubs.length > 0 ? `nearest hub (${hubs[0].name})` : 'our nearest delivery hub'
    const quote = `Hello! For ${loc.name}: In-House Home Delivery is ৳${loc.homeDeliveryCharge} (${loc.estimatedDaysHome}). Alternatively, self-pickup at ${hubText} is only ৳${loc.hubDeliveryCharge}. For assistance, call our Customer Care at ${customerCareHotline}.`

    navigator.clipboard.writeText(quote)
    toast.success('Customer quotation copied to clipboard!')
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

  const fetchCategories = async () => {
    try {
      const res = await fetch('/api/categories?flat=true')
      if (res.ok) {
        const data = await res.json()
        setCategoryList(data.categories || [])
      }
    } catch (e) {
      console.error('Failed to fetch categories:', e)
    }
  }

  const handleOpenAddCategory = () => {
    setEditingCategory(null)
    setCatFormName('')
    setCatFormParentId('none')
    setCatFormIcon('tag')
    setCategoryModalOpen(true)
  }

  const handleOpenEditCategory = (cat: any) => {
    setEditingCategory(cat)
    setCatFormName(cat.name)
    setCatFormParentId(cat.parentId || 'none')
    setCatFormIcon(cat.icon || 'tag')
    setCategoryModalOpen(true)
  }

  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!catFormName.trim()) {
      toast.error('Category name is required')
      return
    }
    setCatFormSaving(true)
    try {
      const payload: any = {
        name: catFormName.trim(),
        parentId: catFormParentId === 'none' ? null : catFormParentId,
        icon: catFormIcon.trim() || null,
      }
      if (editingCategory) {
        payload.id = editingCategory.id
      }
      const res = await fetch('/api/categories', {
        method: editingCategory ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (res.ok) {
        toast.success(editingCategory ? 'Category updated successfully' : 'Category created successfully')
        setCategoryModalOpen(false)
        await fetchCategories()
      } else {
        toast.error(data.error || 'Failed to save category')
      }
    } catch {
      toast.error('Failed to save category')
    } finally {
      setCatFormSaving(false)
    }
  }

  const handleDeleteCategory = async (cat: any) => {
    if (!confirm(`Are you sure you want to delete category "${cat.name}"?`)) {
      return
    }
    setCatDeleteLoading(cat.id)
    try {
      const res = await fetch(`/api/categories?id=${cat.id}`, { method: 'DELETE' })
      const data = await res.json()
      if (res.ok) {
        toast.success(`Category "${cat.name}" deleted`)
        await fetchCategories()
      } else {
        toast.error(data.error || 'Failed to delete category')
      }
    } catch {
      toast.error('Failed to delete category')
    } finally {
      setCatDeleteLoading(null)
    }
  }

  // Fetch core entities
  const fetchAll = async () => {
    setLoading(true)
    try {
      // Products (scalable paginated query)
      const prodTotal = await fetchProductsPage(productPage, productSearch, productStatusFilter)

      // Categories
      await fetchCategories()

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

            {user.role === 'ADMIN' && (
              <button
                type="button"
                onClick={() => setActiveMenu('categories')}
                className={`w-full flex items-center justify-between px-3 py-2 text-xs font-semibold rounded-lg transition text-left ${
                  activeMenu === 'categories'
                    ? 'bg-sky-600 text-white shadow-xs'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Layers className="h-4 w-4 shrink-0" />
                  <span>Categories</span>
                </div>
                <span
                  className={`text-[11px] px-2 py-0.5 rounded-full font-bold ${
                    activeMenu === 'categories' ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  {categoryList.length}
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
                  <span>Delivery Channels &amp; Hubs</span>
                </div>
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${activeMenu === 'delivery-setup' ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-600'}`}>
                  {deliveryLocationsList.length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setActiveMenu('flash-sale')}
                className={`w-full flex items-center justify-between px-3 py-2 text-xs font-semibold rounded-lg transition text-left ${
                  activeMenu === 'flash-sale'
                    ? 'bg-sky-600 text-white shadow-xs'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Flame className="h-4 w-4 shrink-0 text-amber-500" />
                  <span>Flash Sale Setup</span>
                </div>
                {flashSaleEnabled && (
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" title="Active" />
                )}
              </button>

              <button
                type="button"
                onClick={() => setActiveMenu('topbar-config')}
                className={`w-full flex items-center justify-between px-3 py-2 text-xs font-semibold rounded-lg transition text-left ${
                  activeMenu === 'topbar-config'
                    ? 'bg-sky-600 text-white shadow-xs'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Navigation className="h-4 w-4 shrink-0 text-sky-400" />
                  <span>Top Bar &amp; Header</span>
                </div>
                {topbarEnabled && (
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" title="Active" />
                )}
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
                        Delivery Channels &amp; Hubs
                      </div>
                      <p className="text-[11px] text-gray-500 mt-0.5">
                        Home fee ৳{deliveryFee}, Hubs fee ৳{defaultHubFee}, and Customer Care tools.
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
          {/* PAGE 2.5: CATEGORIES MANAGEMENT (ADMIN)                   */}
          {/* ========================================================= */}
          {activeMenu === 'categories' && user.role === 'ADMIN' && (() => {
            const filteredCategories = categoryList.filter((c) =>
              c.name.toLowerCase().includes(categorySearch.toLowerCase()) ||
              c.slug?.toLowerCase().includes(categorySearch.toLowerCase())
            )
            const topLevelCount = categoryList.filter((c) => !c.parentId).length
            const subCategoryCount = categoryList.filter((c) => !!c.parentId).length

            return (
              <Card className="p-5 bg-white border border-gray-200 shadow-xs space-y-5">
                {/* Header */}
                <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-gray-100">
                  <div>
                    <h2 className="font-bold text-base text-gray-900 flex items-center gap-2">
                      <Layers className="h-5 w-5 text-sky-600" /> Category Management
                    </h2>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Create, organize and manage store categories and sub-categories
                    </p>
                  </div>
                  <Button
                    type="button"
                    onClick={handleOpenAddCategory}
                    className="bg-sky-600 hover:bg-sky-700 text-white text-xs h-8.5 px-3 font-semibold shadow-xs"
                  >
                    <Plus className="h-3.5 w-3.5 mr-1.5" /> Add New Category
                  </Button>
                </div>

                {/* Quick stats pills */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="p-3 bg-sky-50 border border-sky-100 rounded-lg flex items-center justify-between">
                    <div>
                      <div className="text-[11px] font-semibold text-sky-700 uppercase tracking-wider">Total Categories</div>
                      <div className="text-2xl font-black text-sky-900 mt-0.5">{categoryList.length}</div>
                    </div>
                    <Layers className="h-7 w-7 text-sky-400" />
                  </div>
                  <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-lg flex items-center justify-between">
                    <div>
                      <div className="text-[11px] font-semibold text-emerald-700 uppercase tracking-wider">Top-Level Categories</div>
                      <div className="text-2xl font-black text-emerald-900 mt-0.5">{topLevelCount}</div>
                    </div>
                    <FolderTree className="h-7 w-7 text-emerald-400" />
                  </div>
                  <div className="p-3 bg-purple-50 border border-purple-100 rounded-lg flex items-center justify-between">
                    <div>
                      <div className="text-[11px] font-semibold text-purple-700 uppercase tracking-wider">Sub-Categories</div>
                      <div className="text-2xl font-black text-purple-900 mt-0.5">{subCategoryCount}</div>
                    </div>
                    <Tag className="h-7 w-7 text-purple-400" />
                  </div>
                </div>

                {/* Search & Filter Bar */}
                <div className="flex items-center gap-3">
                  <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-gray-400" />
                    <Input
                      placeholder="Search categories..."
                      value={categorySearch}
                      onChange={(e) => setCategorySearch(e.target.value)}
                      className="pl-8 text-xs h-8.5 bg-gray-50 border-gray-200"
                    />
                  </div>
                  {categorySearch && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setCategorySearch('')}
                      className="text-xs h-8 text-gray-500 hover:text-gray-800"
                    >
                      Clear
                    </Button>
                  )}
                </div>

                {/* Categories Table */}
                <div className="overflow-x-auto border border-gray-100 rounded-lg">
                  <Table>
                    <TableHeader className="bg-gray-50">
                      <TableRow>
                        <TableHead className="w-12 text-xs">Icon</TableHead>
                        <TableHead className="text-xs">Category Name</TableHead>
                        <TableHead className="text-xs">Slug</TableHead>
                        <TableHead className="text-xs">Hierarchy</TableHead>
                        <TableHead className="text-xs text-center">Products</TableHead>
                        <TableHead className="text-xs text-center">Sub-Categories</TableHead>
                        <TableHead className="text-xs text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredCategories.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center py-8 text-gray-400 text-xs">
                            {categorySearch ? 'No categories matched your search.' : 'No categories found. Click "Add New Category" above to create one.'}
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredCategories.map((c) => {
                          const parentCat = c.parent || categoryList.find((p) => p.id === c.parentId)
                          const prodCount = c._count?.products ?? 0
                          const childCount = c._count?.children ?? (c.children?.length || 0)
                          const isDeleting = catDeleteLoading === c.id

                          return (
                            <TableRow key={c.id} className="hover:bg-gray-50/70">
                              <TableCell className="py-2.5">
                                <span className="text-xl" title={c.icon || 'Category'}>
                                  {getCategoryDisplayEmoji(c.icon)}
                                </span>
                              </TableCell>
                              <TableCell className="py-2.5">
                                <div className="font-bold text-xs text-gray-900">{c.name}</div>
                              </TableCell>
                              <TableCell className="py-2.5 font-mono text-[11px] text-gray-500">
                                {c.slug}
                              </TableCell>
                              <TableCell className="py-2.5">
                                {parentCat ? (
                                  <Badge variant="outline" className="text-[10px] bg-purple-50 text-purple-700 border-purple-200">
                                    Sub of {parentCat.name}
                                  </Badge>
                                ) : (
                                  <Badge variant="outline" className="text-[10px] bg-sky-50 text-sky-700 border-sky-200">
                                    Top-Level
                                  </Badge>
                                )}
                              </TableCell>
                              <TableCell className="py-2.5 text-center">
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-gray-100 text-gray-700">
                                  {prodCount}
                                </span>
                              </TableCell>
                              <TableCell className="py-2.5 text-center">
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-gray-100 text-gray-700">
                                  {childCount}
                                </span>
                              </TableCell>
                              <TableCell className="py-2.5 text-right">
                                <div className="flex items-center justify-end gap-1">
                                  <Button
                                    type="button"
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => handleOpenEditCategory(c)}
                                    className="h-7 w-7 p-0 text-gray-600 hover:text-sky-600 hover:bg-sky-50"
                                    title="Edit Category"
                                  >
                                    <Edit className="h-3.5 w-3.5" />
                                  </Button>
                                  <Button
                                    type="button"
                                    size="sm"
                                    variant="ghost"
                                    disabled={isDeleting}
                                    onClick={() => handleDeleteCategory(c)}
                                    className="h-7 w-7 p-0 text-gray-400 hover:text-red-600 hover:bg-red-50"
                                    title="Delete Category"
                                  >
                                    {isDeleting ? (
                                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                    ) : (
                                      <Trash2 className="h-3.5 w-3.5" />
                                    )}
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          )
                        })
                      )}
                    </TableBody>
                  </Table>
                </div>
              </Card>
            )
          })()}

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

              {/* ── BULK CONFIRM PANEL (admin only) ── */}
              {user.role === 'ADMIN' && !loading && (() => {
                const pendingOrders = orders.filter((o) => o.status === 'PENDING')
                if (pendingOrders.length === 0) return null

                const allSelected = pendingOrders.every((o) => selectedPendingIds.has(o.id))
                const someSelected = selectedPendingIds.size > 0

                const toggleOne = (id: string) => {
                  setSelectedPendingIds((prev) => {
                    const next = new Set(prev)
                    if (next.has(id)) {
                      next.delete(id)
                    } else {
                      next.add(id)
                    }
                    return next
                  })
                }
                const toggleAll = () => {
                  if (allSelected) {
                    setSelectedPendingIds(new Set())
                  } else {
                    setSelectedPendingIds(new Set(pendingOrders.map((o) => o.id)))
                  }
                }
                const bulkConfirm = async () => {
                  if (selectedPendingIds.size === 0) return
                  setBulkConfirming(true)
                  try {
                    await Promise.all(
                      Array.from(selectedPendingIds).map((orderId) =>
                        fetch('/api/orders', {
                          method: 'PUT',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ orderId, status: 'CONFIRMED' }),
                        })
                      )
                    )
                    toast.success(`${selectedPendingIds.size} order(s) confirmed successfully`)
                    setSelectedPendingIds(new Set())
                    fetchAll()
                  } catch {
                    toast.error('Failed to confirm some orders')
                  } finally {
                    setBulkConfirming(false)
                  }
                }

                return (
                  <div className="rounded-xl border-2 border-amber-200 bg-amber-50 p-4 space-y-3">
                    {/* Header */}
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <span className="bg-amber-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                          {pendingOrders.length} Pending
                        </span>
                        <h3 className="font-bold text-sm text-amber-900">COD Orders Awaiting Confirmation</h3>
                      </div>
                      <div className="flex items-center gap-2">
                        <label className="flex items-center gap-1.5 text-xs text-amber-800 cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={allSelected}
                            onChange={toggleAll}
                            className="accent-sky-600 w-4 h-4 rounded"
                          />
                          Select All
                        </label>
                        <Button
                          size="sm"
                          disabled={!someSelected || bulkConfirming}
                          onClick={bulkConfirm}
                          className="bg-sky-600 hover:bg-sky-700 text-white h-8 text-xs px-3 disabled:opacity-50"
                        >
                          {bulkConfirming ? (
                            <><Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />Confirming...</>
                          ) : (
                            <><CheckCircle2 className="h-3.5 w-3.5 mr-1.5" />Confirm {someSelected ? `(${selectedPendingIds.size})` : 'Selected'}</>
                          )}
                        </Button>
                      </div>
                    </div>

                    {/* Pending orders grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                      {pendingOrders.map((o) => {
                        const checked = selectedPendingIds.has(o.id)
                        return (
                          <label
                            key={o.id}
                            className={`flex gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all ${
                              checked
                                ? 'border-sky-500 bg-white shadow-sm'
                                : 'border-amber-200 bg-white/70 hover:border-amber-400'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => toggleOne(o.id)}
                              className="accent-sky-600 mt-0.5 w-4 h-4 shrink-0"
                            />
                            <div className="min-w-0 flex-1 space-y-1">
                              <div className="flex items-center justify-between gap-1">
                                <span className="font-mono text-xs font-bold text-gray-900 truncate">{o.orderNumber}</span>
                                <span className="text-xs font-bold text-sky-700 shrink-0">{formatBDT(o.total)}</span>
                              </div>
                              <div className="text-[11px] text-gray-500 truncate">
                                {o.recipientName} · {o.phone}
                              </div>
                              <div className="text-[10px] text-gray-400 truncate">{o.address}</div>
                              <div className="text-[10px] text-gray-400">
                                {new Date(o.createdAt).toLocaleString('en-GB', {
                                  day: 'numeric', month: 'short', year: 'numeric',
                                  hour: '2-digit', minute: '2-digit',
                                })}
                              </div>
                              <div className="flex gap-1 flex-wrap pt-0.5">
                                {o.items?.slice(0, 2).map((it: any) => (
                                  <span key={it.id} className="text-[10px] bg-gray-100 rounded px-1.5 py-0.5 text-gray-600 truncate max-w-[120px]">
                                    {it.name} ×{it.quantity}
                                  </span>
                                ))}
                                {o.items?.length > 2 && (
                                  <span className="text-[10px] text-gray-400">+{o.items.length - 2} more</span>
                                )}
                              </div>
                            </div>
                          </label>
                        )
                      })}
                    </div>
                  </div>
                )
              })()}

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
                          {o.deliveryChannel === 'DELIVERY_HUB' || (typeof o.address === 'string' && o.address.includes('DELIVERY_HUB')) ? (
                            <Badge variant="outline" className="bg-emerald-50 text-emerald-800 border-emerald-300 font-semibold text-[10px]">
                              🏢 Hub Pickup
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="bg-sky-50 text-sky-800 border-sky-300 font-semibold text-[10px]">
                              🏠 Home Delivery
                            </Badge>
                          )}
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

                      {/* Order status stepper — shown to customers */}
                      {user.role === 'CUSTOMER' && (() => {
                        const steps = ['PENDING', 'CONFIRMED', 'SHIPPED', 'DELIVERED']
                        const stepLabels: Record<string, string> = {
                          PENDING: 'Pending',
                          CONFIRMED: 'Confirmed',
                          SHIPPED: 'Shipped',
                          DELIVERED: 'Delivered',
                        }
                        const stepIcons: Record<string, string> = {
                          PENDING: '🕐',
                          CONFIRMED: '✅',
                          SHIPPED: '🚚',
                          DELIVERED: '📦',
                        }
                        const currentIdx = o.status === 'CANCELLED' ? -1 : steps.indexOf(o.status)
                        return (
                          <div className="border-t border-gray-100 pt-3">
                            {o.status === 'CANCELLED' ? (
                              <div className="flex items-center gap-2 text-red-600 text-xs font-semibold py-1">
                                <span>❌</span>
                                <span>Order Cancelled</span>
                                {o.paymentStatus === 'PAID' && <span className="text-gray-500 font-normal ml-1">— Refund will be processed</span>}
                              </div>
                            ) : (
                              <div className="flex items-center gap-0">
                                {steps.map((step, idx) => {
                                  const done = idx < currentIdx
                                  const active = idx === currentIdx
                                  const pending = idx > currentIdx
                                  return (
                                    <div key={step} className="flex items-center flex-1 min-w-0">
                                      <div className="flex flex-col items-center min-w-0">
                                        <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all ${
                                          done ? 'bg-green-500 border-green-500 text-white' :
                                          active ? 'bg-sky-600 border-sky-600 text-white ring-2 ring-sky-200' :
                                          'bg-gray-100 border-gray-200 text-gray-400'
                                        }`}>
                                          {done ? '✓' : stepIcons[step]}
                                        </div>
                                        <span className={`text-[9px] mt-0.5 font-semibold whitespace-nowrap ${
                                          active ? 'text-sky-600' : done ? 'text-green-600' : 'text-gray-400'
                                        }`}>{stepLabels[step]}</span>
                                      </div>
                                      {idx < steps.length - 1 && (
                                        <div className={`flex-1 h-0.5 mb-3 mx-0.5 ${done || active ? 'bg-sky-400' : 'bg-gray-200'}`} />
                                      )}
                                    </div>
                                  )
                                })}
                              </div>
                            )}
                            {o.status === 'SHIPPED' && (
                              <p className="text-[10px] text-sky-600 mt-1 font-medium">🚚 Your order is on its way! Estimated delivery: 2-3 business days</p>
                            )}
                            {o.status === 'PENDING' && o.paymentMethod === 'COD' && (
                              <p className="text-[10px] text-amber-600 mt-1 font-medium">💵 Cash on Delivery — Pay when your order arrives</p>
                            )}
                          </div>
                        )
                      })()}

                      <div className="border-t border-gray-100 pt-2 flex justify-between font-bold text-xs sm:text-sm">
                        <span>Total Payable</span>
                        <span className="text-sky-600 font-extrabold">{formatBDT(o.total)}</span>
                      </div>

                      {/* Shipping info for customers */}
                      {user.role === 'CUSTOMER' && (
                        <div className="text-[11px] text-gray-500 space-y-0.5 border-t border-gray-100 pt-2">
                          <div><span className="font-semibold text-gray-700">Ship to:</span> {o.recipientName}, {o.phone}</div>
                          <div><span className="font-semibold text-gray-700">Address:</span> {o.address}</div>
                        </div>
                      )}

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
          {/* PAGE 7: DELIVERY CHANNELS, LOCATIONS & CUSTOMER CARE TOOL */}
          {/* ========================================================= */}
          {activeMenu === 'delivery-setup' && user.role === 'ADMIN' && (
            <div className="space-y-5">
              {/* Main Card */}
              <Card className="p-5 bg-white border border-gray-200 shadow-xs space-y-5">
                {/* Header */}
                <div className="pb-4 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div>
                    <h2 className="font-bold text-base text-gray-900 flex items-center gap-2">
                      <Truck className="h-5 w-5 text-sky-600" /> Delivery Channels, Locations &amp; Customer Care Tool
                    </h2>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Configure in-house delivery vs pickup hubs, location-based shipping charges (default ৳90 home delivery), and customer care dispatch tools.
                    </p>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <span className="bg-sky-50 text-sky-700 font-semibold px-2.5 py-1 rounded-md border border-sky-200">
                      Home Default: ৳{deliveryFee}
                    </span>
                    <span className="bg-emerald-50 text-emerald-700 font-semibold px-2.5 py-1 rounded-md border border-emerald-200">
                      Hub Default: ৳{defaultHubFee}
                    </span>
                  </div>
                </div>

                {/* Navigation Sub-Tabs */}
                <div className="flex flex-wrap gap-1.5 p-1 bg-gray-100 rounded-lg text-xs font-semibold">
                  <button
                    type="button"
                    onClick={() => setDeliverySubTab('locations')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition ${
                      deliverySubTab === 'locations'
                        ? 'bg-white text-sky-700 shadow-xs font-bold'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    <MapPin className="h-3.5 w-3.5" />
                    <span>Delivery Locations &amp; Rates ({deliveryLocationsList.length})</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setDeliverySubTab('hubs')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition ${
                      deliverySubTab === 'hubs'
                        ? 'bg-white text-sky-700 shadow-xs font-bold'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    <Store className="h-3.5 w-3.5" />
                    <span>Delivery Hubs ({deliveryHubsList.length})</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setDeliverySubTab('customer-care')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition ${
                      deliverySubTab === 'customer-care'
                        ? 'bg-white text-sky-700 shadow-xs font-bold'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    <Headphones className="h-3.5 w-3.5 text-purple-600" />
                    <span>Customer Care Tool</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setDeliverySubTab('settings')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition ${
                      deliverySubTab === 'settings'
                        ? 'bg-white text-sky-700 shadow-xs font-bold'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    <Settings className="h-3.5 w-3.5" />
                    <span>Fleet &amp; Global Policies</span>
                  </button>
                </div>

                {/* ------------------------------------------------------------------ */}
                {/* SUB-TAB 1: DELIVERY LOCATIONS & DYNAMIC CHARGES                   */}
                {/* ------------------------------------------------------------------ */}
                {deliverySubTab === 'locations' && (
                  <div className="space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="relative flex-1 max-w-sm">
                        <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-gray-400" />
                        <Input
                          value={locationSearch}
                          onChange={(e) => setLocationSearch(e.target.value)}
                          placeholder="Search location or division..."
                          className="text-xs h-8 pl-8"
                        />
                      </div>
                      <Button
                        type="button"
                        size="sm"
                        onClick={handleOpenAddLocation}
                        className="text-xs h-8 bg-sky-600 hover:bg-sky-700 text-white font-semibold"
                      >
                        <Plus className="h-3.5 w-3.5 mr-1" /> Add Delivery Location
                      </Button>
                    </div>

                    <div className="border border-gray-200 rounded-lg overflow-hidden">
                      <Table>
                        <TableHeader className="bg-gray-50/70 text-[11px]">
                          <TableRow>
                            <TableHead className="font-bold">Location &amp; Division</TableHead>
                            <TableHead className="font-bold">Home Delivery Fee</TableHead>
                            <TableHead className="font-bold">Hub Delivery Fee</TableHead>
                            <TableHead className="font-bold">In-House Fleet</TableHead>
                            <TableHead className="font-bold">Estimated Turnaround</TableHead>
                            <TableHead className="font-bold">Status</TableHead>
                            <TableHead className="text-right font-bold">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody className="text-xs">
                          {deliveryLocationsList
                            .filter(
                              (loc) =>
                                loc.name.toLowerCase().includes(locationSearch.toLowerCase()) ||
                                loc.division.toLowerCase().includes(locationSearch.toLowerCase())
                            )
                            .map((loc) => (
                              <TableRow key={loc.id} className="hover:bg-gray-50/60">
                                <TableCell>
                                  <div className="font-semibold text-gray-900">{loc.name}</div>
                                  <div className="text-[10px] text-gray-400">{loc.division} Division</div>
                                </TableCell>
                                <TableCell>
                                  <span className="font-bold text-sky-700 bg-sky-50 px-2 py-0.5 rounded border border-sky-200">
                                    ৳ {loc.homeDeliveryCharge}
                                  </span>
                                </TableCell>
                                <TableCell>
                                  <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                                    ৳ {loc.hubDeliveryCharge}
                                  </span>
                                </TableCell>
                                <TableCell>
                                  {loc.inHouseDeliveryAvailable ? (
                                    <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-sky-700 bg-sky-50 px-2 py-0.5 rounded border border-sky-200">
                                      <CheckCircle2 className="h-3 w-3 text-sky-600" /> In-House Express
                                    </span>
                                  ) : (
                                    <span className="text-[10px] text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                                      Partner Courier
                                    </span>
                                  )}
                                </TableCell>
                                <TableCell className="text-[11px] text-gray-600">
                                  <div>Home: {loc.estimatedDaysHome}</div>
                                  <div className="text-gray-400 text-[10px]">Hub: {loc.estimatedDaysHub}</div>
                                </TableCell>
                                <TableCell>
                                  <Switch
                                    checked={loc.active}
                                    onCheckedChange={(val) => handleToggleLocationActive(loc.id, val)}
                                    className="data-[state=checked]:bg-sky-600 scale-90"
                                  />
                                </TableCell>
                                <TableCell className="text-right">
                                  <div className="flex items-center justify-end gap-1.5">
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handleCopyCustomerCareQuote(loc)}
                                      title="Copy customer quote"
                                      className="h-7 w-7 p-0 text-gray-500 hover:text-sky-600"
                                    >
                                      <Copy className="h-3.5 w-3.5" />
                                    </Button>
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handleOpenEditLocation(loc)}
                                      className="h-7 w-7 p-0 text-gray-500 hover:text-sky-600"
                                    >
                                      <Edit className="h-3.5 w-3.5" />
                                    </Button>
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handleDeleteLocation(loc.id)}
                                      className="h-7 w-7 p-0 text-gray-500 hover:text-red-600"
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
                  </div>
                )}

                {/* ------------------------------------------------------------------ */}
                {/* SUB-TAB 2: DELIVERY HUBS (PICKUP CENTERS)                         */}
                {/* ------------------------------------------------------------------ */}
                {deliverySubTab === 'hubs' && (
                  <div className="space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="relative flex-1 max-w-sm">
                        <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-gray-400" />
                        <Input
                          value={hubSearch}
                          onChange={(e) => setHubSearch(e.target.value)}
                          placeholder="Search delivery hub by name, address or code..."
                          className="text-xs h-8 pl-8"
                        />
                      </div>
                      <Button
                        type="button"
                        size="sm"
                        onClick={handleOpenAddHub}
                        className="text-xs h-8 bg-sky-600 hover:bg-sky-700 text-white font-semibold"
                      >
                        <Plus className="h-3.5 w-3.5 mr-1" /> Add Delivery Hub
                      </Button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                      {deliveryHubsList
                        .filter(
                          (hub) =>
                            hub.name.toLowerCase().includes(hubSearch.toLowerCase()) ||
                            hub.address.toLowerCase().includes(hubSearch.toLowerCase()) ||
                            hub.code.toLowerCase().includes(hubSearch.toLowerCase())
                        )
                        .map((hub) => (
                          <div
                            key={hub.id}
                            className="p-3.5 bg-gray-50/70 border border-gray-200 rounded-lg space-y-2 relative"
                          >
                            <div className="flex items-start justify-between">
                              <div>
                                <div className="flex items-center gap-1.5">
                                  <Store className="h-4 w-4 text-emerald-600" />
                                  <h3 className="font-bold text-xs text-gray-900">{hub.name}</h3>
                                  <span className="text-[10px] bg-gray-200 text-gray-700 px-1.5 py-0.2 rounded font-mono">
                                    {hub.code}
                                  </span>
                                </div>
                                <div className="text-[11px] text-gray-500 mt-0.5">
                                  Location: {hub.locationName} ({hub.division} Division)
                                </div>
                              </div>
                              <div className="flex items-center gap-1.5">
                                <Switch
                                  checked={hub.active}
                                  onCheckedChange={(val) => handleToggleHubActive(hub.id, val)}
                                  className="data-[state=checked]:bg-emerald-600 scale-90"
                                />
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleOpenEditHub(hub)}
                                  className="h-7 w-7 p-0 text-gray-500 hover:text-sky-600"
                                >
                                  <Edit className="h-3.5 w-3.5" />
                                </Button>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDeleteHub(hub.id)}
                                  className="h-7 w-7 p-0 text-gray-500 hover:text-red-600"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                              </div>
                            </div>

                            <div className="text-xs text-gray-700 flex items-start gap-1.5 pt-1 border-t border-gray-200">
                              <MapPin className="h-3.5 w-3.5 text-gray-400 shrink-0 mt-0.5" />
                              <span className="line-clamp-2">{hub.address}</span>
                            </div>

                            <div className="grid grid-cols-2 gap-2 text-[11px] text-gray-600 pt-1">
                              <div className="flex items-center gap-1">
                                <Clock className="h-3 w-3 text-gray-400" />
                                <span className="line-clamp-1">{hub.operatingHours}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Phone className="h-3 w-3 text-gray-400" />
                                <span>{hub.phone}</span>
                              </div>
                            </div>

                            <div className="flex items-center justify-between pt-1 border-t border-gray-200/80 text-[11px]">
                              <span className="text-gray-500">
                                Manager: <strong className="text-gray-700">{hub.managerName || 'Assigned Agent'}</strong>
                              </span>
                              <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                                Pickup Fee: ৳{hub.fee}
                              </span>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                )}

                {/* ------------------------------------------------------------------ */}
                {/* SUB-TAB 3: CUSTOMER CARE DELIVERY TOOL                            */}
                {/* ------------------------------------------------------------------ */}
                {deliverySubTab === 'customer-care' && (() => {
                  const ccLoc = deliveryLocationsList.find((l) => l.id === ccLocationId) || deliveryLocationsList[0]
                  const ccHubs = deliveryHubsList.filter(
                    (h) => h.active && (h.locationName === ccLoc.name || h.division === ccLoc.division)
                  )
                  const subtotalNum = parseFloat(ccSubtotal) || 0
                  const freeThreshNum = parseFloat(freeThreshold) || 1500
                  const isFreePromo = freeThreshNum > 0 && subtotalNum >= freeThreshNum

                  return (
                    <div className="space-y-5">
                      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                        {/* Left: Customer Care Live Advisor (col-span-7) */}
                        <div className="lg:col-span-7 space-y-4 p-4 bg-purple-50/40 border border-purple-200 rounded-xl">
                          <div className="flex items-center justify-between border-b border-purple-200/70 pb-2.5">
                            <div className="flex items-center gap-2">
                              <div className="p-1.5 rounded-md bg-purple-600 text-white">
                                <Headphones className="h-4 w-4" />
                              </div>
                              <div>
                                <h3 className="font-bold text-sm text-gray-900">
                                  Customer Care Delivery Advisor
                                </h3>
                                <p className="text-[11px] text-gray-500">
                                  Instantly quote Home Delivery vs Delivery Hub fees and turnaround time to calling customers.
                                </p>
                              </div>
                            </div>
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              onClick={() => handleCopyCustomerCareQuote(ccLoc)}
                              className="text-xs h-7 border-purple-300 text-purple-700 hover:bg-purple-100"
                            >
                              <Copy className="h-3 w-3 mr-1" /> Copy Quote
                            </Button>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                              <Label className="text-xs font-semibold text-gray-700">Customer Location / City</Label>
                              <select
                                value={ccLocationId}
                                onChange={(e) => setCcLocationId(e.target.value)}
                                className="w-full text-xs h-9 mt-1 px-2.5 bg-white border border-gray-300 rounded-md font-medium"
                              >
                                {deliveryLocationsList.map((loc) => (
                                  <option key={loc.id} value={loc.id}>
                                    {loc.name}
                                  </option>
                                ))}
                              </select>
                            </div>
                            <div>
                              <Label className="text-xs font-semibold text-gray-700">Cart / Order Value (৳)</Label>
                              <Input
                                type="number"
                                value={ccSubtotal}
                                onChange={(e) => setCcSubtotal(e.target.value)}
                                placeholder="850"
                                className="text-xs h-9 mt-1 bg-white"
                              />
                            </div>
                          </div>

                          {/* Side-by-side Channel Comparison */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                            {/* Home Delivery Card */}
                            <div className="p-3 bg-white rounded-lg border border-sky-200 shadow-2xs space-y-2">
                              <div className="flex items-center justify-between">
                                <span className="font-bold text-xs text-sky-900 flex items-center gap-1.5">
                                  <Home className="h-3.5 w-3.5 text-sky-600" /> In-House Home Delivery
                                </span>
                                <span className="text-xs font-extrabold text-sky-600">
                                  {isFreePromo ? 'FREE' : `৳ ${ccLoc.homeDeliveryCharge}`}
                                </span>
                              </div>
                              <div className="text-[11px] text-gray-600 space-y-1">
                                <div>Estimated SLA: <strong>{ccLoc.estimatedDaysHome}</strong></div>
                                <div>Fleet: {ccLoc.inHouseDeliveryAvailable ? 'In-House Courier Fleet' : 'Third-Party Courier'}</div>
                                <div className="text-emerald-600 font-medium">✓ Doorstep Delivery &amp; COD</div>
                              </div>
                            </div>

                            {/* Hub Pickup Card */}
                            <div className="p-3 bg-white rounded-lg border border-emerald-200 shadow-2xs space-y-2">
                              <div className="flex items-center justify-between">
                                <span className="font-bold text-xs text-emerald-900 flex items-center gap-1.5">
                                  <Store className="h-3.5 w-3.5 text-emerald-600" /> Delivery Hub Pickup
                                </span>
                                <span className="text-xs font-extrabold text-emerald-600">
                                  {isFreePromo ? 'FREE' : `৳ ${ccLoc.hubDeliveryCharge}`}
                                </span>
                              </div>
                              <div className="text-[11px] text-gray-600 space-y-1">
                                <div>Estimated SLA: <strong>{ccLoc.estimatedDaysHub}</strong></div>
                                <div>Customer Savings: <strong className="text-emerald-700">৳{Math.max(0, ccLoc.homeDeliveryCharge - ccLoc.hubDeliveryCharge)}</strong></div>
                                <div className="text-gray-500">Available Hubs: {ccHubs.length} Center{ccHubs.length > 1 ? 's' : ''}</div>
                              </div>
                            </div>
                          </div>

                          {/* Hubs details for the customer */}
                          {ccHubs.length > 0 && (
                            <div className="bg-white p-3 rounded-lg border border-purple-200 space-y-2 text-xs">
                              <span className="font-bold text-gray-800 text-[11px] uppercase tracking-wider block">
                                Recommended Pickup Hubs in {ccLoc.name}:
                              </span>
                              <div className="space-y-1.5">
                                {ccHubs.map((h) => (
                                  <div key={h.id} className="p-2 bg-gray-50 rounded text-[11px] flex items-start justify-between">
                                    <div>
                                      <div className="font-bold text-gray-800">{h.name} ({h.code})</div>
                                      <div className="text-gray-500">{h.address}</div>
                                      <div className="text-gray-400">Hours: {h.operatingHours} • Phone: {h.phone}</div>
                                    </div>
                                    <span className="font-bold text-emerald-600">৳{h.fee}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Right: Order Delivery Channel Modifier (col-span-5) */}
                        <div className="lg:col-span-5 space-y-3.5 p-4 bg-gray-50 border border-gray-200 rounded-xl">
                          <div>
                            <h3 className="font-bold text-sm text-gray-900 flex items-center gap-1.5">
                              <Sliders className="h-4 w-4 text-sky-600" />
                              Order Delivery Channel Modifier
                            </h3>
                            <p className="text-[11px] text-gray-500 mt-0.5">
                              Search an order and switch customer between Home Delivery or Delivery Hub upon request.
                            </p>
                          </div>

                          <div className="flex gap-2">
                            <Input
                              value={ccSearchOrderQuery}
                              onChange={(e) => setCcSearchOrderQuery(e.target.value)}
                              placeholder="Enter Order # (e.g. DZ12345678) or phone..."
                              className="text-xs h-8 bg-white"
                            />
                            <Button
                              type="button"
                              size="sm"
                              onClick={() => {
                                const q = ccSearchOrderQuery.trim().toLowerCase()
                                if (!q) return
                                const found = orders.find(
                                  (o) =>
                                    o.orderNumber?.toLowerCase().includes(q) ||
                                    o.phone?.toLowerCase().includes(q)
                                )
                                if (found) {
                                  setCcSelectedOrder(found)
                                  setCcNewChannel(
                                    found.deliveryChannel === 'DELIVERY_HUB' ||
                                      (typeof found.address === 'string' && found.address.includes('DELIVERY_HUB'))
                                      ? 'DELIVERY_HUB'
                                      : 'HOME_DELIVERY'
                                  )
                                  setCcNewHubName(found.deliveryHubName || deliveryHubsList[0]?.name || '')
                                  setCcNewShipping(String(found.shipping || 90))
                                  toast.success(`Found Order #${found.orderNumber}`)
                                } else {
                                  toast.error('Order not found with that number or phone')
                                }
                              }}
                              className="text-xs h-8 bg-sky-600 text-white font-semibold shrink-0"
                            >
                              Search
                            </Button>
                          </div>

                          {ccSelectedOrder ? (
                            <div className="p-3 bg-white rounded-lg border border-gray-200 space-y-3 text-xs">
                              <div className="flex items-center justify-between border-b pb-2">
                                <div>
                                  <div className="font-bold text-gray-900">Order #{ccSelectedOrder.orderNumber}</div>
                                  <div className="text-[11px] text-gray-500">Customer: {ccSelectedOrder.recipientName} ({ccSelectedOrder.phone})</div>
                                </div>
                                <span className="bg-sky-50 text-sky-700 font-bold px-2 py-0.5 rounded text-[11px]">
                                  Current: {ccSelectedOrder.deliveryChannel || 'HOME_DELIVERY'}
                                </span>
                              </div>

                              <div className="space-y-2">
                                <div>
                                  <Label className="text-xs">Change Delivery Channel</Label>
                                  <div className="grid grid-cols-2 gap-2 mt-1">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setCcNewChannel('HOME_DELIVERY')
                                        setCcNewShipping('90')
                                      }}
                                      className={`p-2 rounded border text-xs font-semibold text-center transition ${
                                        ccNewChannel === 'HOME_DELIVERY'
                                          ? 'border-sky-600 bg-sky-50 text-sky-700'
                                          : 'border-gray-200 text-gray-600'
                                      }`}
                                    >
                                      Home Delivery (৳90)
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setCcNewChannel('DELIVERY_HUB')
                                        setCcNewShipping('40')
                                        if (!ccNewHubName) setCcNewHubName(deliveryHubsList[0]?.name || '')
                                      }}
                                      className={`p-2 rounded border text-xs font-semibold text-center transition ${
                                        ccNewChannel === 'DELIVERY_HUB'
                                          ? 'border-emerald-600 bg-emerald-50 text-emerald-700'
                                          : 'border-gray-200 text-gray-600'
                                      }`}
                                    >
                                      Delivery Hub (৳40)
                                    </button>
                                  </div>
                                </div>

                                {ccNewChannel === 'DELIVERY_HUB' && (
                                  <div>
                                    <Label className="text-xs">Assign Delivery Hub</Label>
                                    <select
                                      value={ccNewHubName}
                                      onChange={(e) => setCcNewHubName(e.target.value)}
                                      className="w-full text-xs h-8 px-2 bg-white border border-gray-300 rounded mt-1"
                                    >
                                      {deliveryHubsList.map((h) => (
                                        <option key={h.id} value={h.name}>
                                          {h.name} — {h.address}
                                        </option>
                                      ))}
                                    </select>
                                  </div>
                                )}

                                <div>
                                  <Label className="text-xs">Adjust Shipping Fee (৳)</Label>
                                  <Input
                                    type="number"
                                    value={ccNewShipping}
                                    onChange={(e) => setCcNewShipping(e.target.value)}
                                    className="text-xs h-8 mt-1"
                                  />
                                </div>
                              </div>

                              <Button
                                type="button"
                                size="sm"
                                onClick={handleCustomerCareUpdateOrder}
                                disabled={ccSavingOrder}
                                className="w-full text-xs h-8 bg-sky-600 hover:bg-sky-700 text-white font-semibold"
                              >
                                {ccSavingOrder ? 'Updating...' : 'Save Order Delivery Channel'}
                              </Button>
                            </div>
                          ) : (
                            <div className="p-4 bg-white rounded-lg border border-dashed border-gray-200 text-center text-xs text-gray-400">
                              Search an order by Order # or Phone to view and modify its delivery channel.
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })()}

                {/* ------------------------------------------------------------------ */}
                {/* SUB-TAB 4: FLEET & GLOBAL POLICIES                                */}
                {/* ------------------------------------------------------------------ */}
                {deliverySubTab === 'settings' && (
                  <div className="space-y-4">
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
                        <Label className="text-xs font-semibold text-gray-700">Default Home Delivery Fee (৳)</Label>
                        <Input
                          type="number"
                          value={deliveryFee}
                          onChange={(e) => setDeliveryFee(e.target.value)}
                          placeholder="90"
                          className="text-xs h-9 bg-white"
                        />
                        <p className="text-[10px] text-gray-400">Default rate when location is not customized</p>
                      </div>

                      <div className="space-y-1">
                        <Label className="text-xs font-semibold text-gray-700">Default Hub Delivery Fee (৳)</Label>
                        <Input
                          type="number"
                          value={defaultHubFee}
                          onChange={(e) => setDefaultHubFee(e.target.value)}
                          placeholder="40"
                          className="text-xs h-9 bg-white"
                        />
                        <p className="text-[10px] text-gray-400">Self pickup fee at authorized delivery hubs</p>
                      </div>

                      <div className="space-y-1">
                        <Label className="text-xs font-semibold text-gray-700">Free Delivery Threshold (৳)</Label>
                        <Input
                          type="number"
                          value={freeThreshold}
                          onChange={(e) => setFreeThreshold(e.target.value)}
                          placeholder="1500"
                          className="text-xs h-9 bg-white"
                        />
                        <p className="text-[10px] text-gray-400">Orders above this amount get free delivery (0 to disable)</p>
                      </div>

                      <div className="space-y-1">
                        <Label className="text-xs font-semibold text-gray-700">In-House Express Fleet Name</Label>
                        <Input
                          value={inHouseFleetName}
                          onChange={(e) => setInHouseFleetName(e.target.value)}
                          placeholder="e.g. ShopZilla In-House Express Fleet"
                          className="text-xs h-9 bg-white"
                        />
                      </div>

                      <div className="space-y-1">
                        <Label className="text-xs font-semibold text-gray-700">Customer Care Helpline</Label>
                        <Input
                          value={customerCareHotline}
                          onChange={(e) => setCustomerCareHotline(e.target.value)}
                          placeholder="+880 9612-345678"
                          className="text-xs h-9 bg-white"
                        />
                      </div>

                      <div className="space-y-1">
                        <Label className="text-xs font-semibold text-gray-700">Guaranteed Delivery Duration</Label>
                        <Input
                          value={deliveryEstimatedDays}
                          onChange={(e) => setDeliveryEstimatedDays(e.target.value)}
                          placeholder="e.g. Guaranteed within 1-2 days"
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
                        {deliveryConfigLoading ? 'Saving...' : 'Save Fleet & Global Policies'}
                      </Button>
                    </div>
                  </div>
                )}
              </Card>

              {/* Add / Edit Location Dialog */}
              <Dialog open={locModalOpen} onOpenChange={setLocModalOpen}>
                <DialogContent className="sm:max-w-[480px]">
                  <DialogHeader>
                    <DialogTitle className="text-base font-bold text-gray-900 flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-sky-600" />
                      {editingLocId ? 'Edit Delivery Location & Rates' : 'Add New Delivery Location'}
                    </DialogTitle>
                    <DialogDescription className="text-xs text-gray-500">
                      Configure city or area specific delivery charges, in-house fleet coverage, and turnaround.
                    </DialogDescription>
                  </DialogHeader>

                  <div className="space-y-3 py-2 text-xs">
                    <div>
                      <Label className="text-xs">Location Name (City / Area) *</Label>
                      <Input
                        value={locName}
                        onChange={(e) => setLocName(e.target.value)}
                        placeholder="e.g. Dhaka City, Gazipur, Cumilla City"
                        className="text-xs h-8 mt-1"
                      />
                    </div>

                    <div>
                      <Label className="text-xs">Division *</Label>
                      <select
                        value={locDivision}
                        onChange={(e) => setLocDivision(e.target.value)}
                        className="w-full text-xs h-8 px-2.5 bg-white border border-gray-300 rounded mt-1"
                      >
                        {['Dhaka', 'Chittagong', 'Sylhet', 'Rajshahi', 'Khulna', 'Barisal', 'Rangpur', 'Mymensingh', 'Nationwide'].map(
                          (div) => (
                            <option key={div} value={div}>
                              {div} Division
                            </option>
                          )
                        )}
                      </select>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label className="text-xs">Home Delivery Fee (৳) *</Label>
                        <Input
                          type="number"
                          value={locHomeCharge}
                          onChange={(e) => setLocHomeCharge(e.target.value)}
                          placeholder="90"
                          className="text-xs h-8 mt-1 font-bold text-sky-700"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Hub Delivery Fee (৳) *</Label>
                        <Input
                          type="number"
                          value={locHubCharge}
                          onChange={(e) => setLocHubCharge(e.target.value)}
                          placeholder="40"
                          className="text-xs h-8 mt-1 font-bold text-emerald-700"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label className="text-xs">Home Delivery SLA</Label>
                        <Input
                          value={locEstHome}
                          onChange={(e) => setLocEstHome(e.target.value)}
                          placeholder="1-2 Days (In-House Fleet)"
                          className="text-xs h-8 mt-1"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Hub Pickup SLA</Label>
                        <Input
                          value={locEstHub}
                          onChange={(e) => setLocEstHub(e.target.value)}
                          placeholder="1-2 Days"
                          className="text-xs h-8 mt-1"
                        />
                      </div>
                    </div>

                    <div className="space-y-2 pt-1 border-t border-gray-200">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-gray-700">In-House Delivery Fleet Available</span>
                        <Switch checked={locInHouse} onCheckedChange={setLocInHouse} className="data-[state=checked]:bg-sky-600 scale-90" />
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-gray-700">Delivery Hub Pickup Available</span>
                        <Switch checked={locHubAvailable} onCheckedChange={setLocHubAvailable} className="data-[state=checked]:bg-emerald-600 scale-90" />
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-gray-700">Cash on Delivery (COD)</span>
                        <Switch checked={locCod} onCheckedChange={setLocCod} className="data-[state=checked]:bg-sky-600 scale-90" />
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-gray-700">Location Active</span>
                        <Switch checked={locActive} onCheckedChange={setLocActive} className="data-[state=checked]:bg-sky-600 scale-90" />
                      </div>
                    </div>
                  </div>

                  <DialogFooter className="flex justify-end gap-2">
                    <Button variant="outline" size="sm" onClick={() => setLocModalOpen(false)} className="text-xs">
                      Cancel
                    </Button>
                    <Button size="sm" onClick={handleSaveLocationModal} className="bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold">
                      Save Location
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              {/* Add / Edit Hub Dialog */}
              <Dialog open={hubModalOpen} onOpenChange={setHubModalOpen}>
                <DialogContent className="sm:max-w-[480px]">
                  <DialogHeader>
                    <DialogTitle className="text-base font-bold text-gray-900 flex items-center gap-2">
                      <Store className="h-4 w-4 text-emerald-600" />
                      {editingHubId ? 'Edit Delivery Hub' : 'Add New Delivery Hub'}
                    </DialogTitle>
                    <DialogDescription className="text-xs text-gray-500">
                      Configure pickup center address, operating hours, and manager contact.
                    </DialogDescription>
                  </DialogHeader>

                  <div className="space-y-3 py-2 text-xs">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label className="text-xs">Hub Name *</Label>
                        <Input
                          value={hubName}
                          onChange={(e) => setHubName(e.target.value)}
                          placeholder="e.g. Banani Central Hub"
                          className="text-xs h-8 mt-1"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Hub Code *</Label>
                        <Input
                          value={hubCode}
                          onChange={(e) => setHubCode(e.target.value)}
                          placeholder="HUB-DHK-BANANI"
                          className="text-xs h-8 mt-1 font-mono uppercase"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label className="text-xs">Assigned Location</Label>
                        <select
                          value={hubLocationName}
                          onChange={(e) => setHubLocationName(e.target.value)}
                          className="w-full text-xs h-8 px-2.5 bg-white border border-gray-300 rounded mt-1"
                        >
                          {deliveryLocationsList.map((loc) => (
                            <option key={loc.id} value={loc.name}>
                              {loc.name}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <Label className="text-xs">Division</Label>
                        <select
                          value={hubDivision}
                          onChange={(e) => setHubDivision(e.target.value)}
                          className="w-full text-xs h-8 px-2.5 bg-white border border-gray-300 rounded mt-1"
                        >
                          {['Dhaka', 'Chittagong', 'Sylhet', 'Rajshahi', 'Khulna', 'Barisal', 'Rangpur', 'Mymensingh', 'Nationwide'].map(
                            (div) => (
                              <option key={div} value={div}>
                                {div}
                              </option>
                            )
                          )}
                        </select>
                      </div>
                    </div>

                    <div>
                      <Label className="text-xs">Full Address *</Label>
                      <Input
                        value={hubAddress}
                        onChange={(e) => setHubAddress(e.target.value)}
                        placeholder="House, Road, Block, Landmark"
                        className="text-xs h-8 mt-1"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label className="text-xs">Helpline / Phone *</Label>
                        <Input
                          value={hubPhone}
                          onChange={(e) => setHubPhone(e.target.value)}
                          placeholder="+880 1711-000000"
                          className="text-xs h-8 mt-1"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Manager Name</Label>
                        <Input
                          value={hubManager}
                          onChange={(e) => setHubManager(e.target.value)}
                          placeholder="e.g. Arif Hossain"
                          className="text-xs h-8 mt-1"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label className="text-xs">Operating Hours</Label>
                        <Input
                          value={hubHours}
                          onChange={(e) => setHubHours(e.target.value)}
                          placeholder="9:00 AM - 8:30 PM (Sat - Thu)"
                          className="text-xs h-8 mt-1"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Pickup Fee (৳)</Label>
                        <Input
                          type="number"
                          value={hubFee}
                          onChange={(e) => setHubFee(e.target.value)}
                          placeholder="40"
                          className="text-xs h-8 mt-1 font-bold text-emerald-700"
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-1 border-t border-gray-200">
                      <span className="text-xs font-medium text-gray-700">Hub Active &amp; Ready for Pickups</span>
                      <Switch checked={hubActive} onCheckedChange={setHubActive} className="data-[state=checked]:bg-emerald-600 scale-90" />
                    </div>
                  </div>

                  <DialogFooter className="flex justify-end gap-2">
                    <Button variant="outline" size="sm" onClick={() => setHubModalOpen(false)} className="text-xs">
                      Cancel
                    </Button>
                    <Button size="sm" onClick={handleSaveHubModal} className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold">
                      Save Hub
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          )}

          {/* ========================================================= */}
          {/* PAGE 8: FLASH SALE PARAMETERIZED SETUP (ADMIN)            */}
          {/* ========================================================= */}
          {activeMenu === 'flash-sale' && user.role === 'ADMIN' && (() => {
            const now = Date.now()
            const start = flashSaleStartTime ? new Date(flashSaleStartTime).getTime() : 0
            const end = flashSaleEndTime ? new Date(flashSaleEndTime).getTime() : 0

            let statusLabel = 'Disabled'
            let statusColor = 'bg-gray-100 text-gray-600 border-gray-200'
            let statusDesc = 'Flash Sale is currently turned off and hidden from storefront'

            if (flashSaleEnabled) {
              if (now < start) {
                statusLabel = 'Scheduled'
                statusColor = 'bg-amber-50 text-amber-700 border-amber-200'
                statusDesc = `Scheduled to start automatically on ${new Date(start).toLocaleString()}`
              } else if (now > end) {
                statusLabel = 'Expired'
                statusColor = 'bg-red-50 text-red-700 border-red-200'
                statusDesc = `Campaign expired on ${new Date(end).toLocaleString()}`
              } else {
                const diff = Math.max(0, end - now)
                const h = Math.floor(diff / (1000 * 60 * 60))
                const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
                statusLabel = 'Live Now'
                statusColor = 'bg-emerald-50 text-emerald-700 border-emerald-200'
                statusDesc = `Live on homepage! Ends in ${h}h ${m}m`
              }
            }

            const flashProductCount = products.filter((p: any) => p.isFlashSale).length

            return (
              <Card className="p-5 bg-white border border-gray-200 shadow-xs space-y-6">
                {/* Header */}
                <div className="pb-4 border-b border-gray-100 flex items-start justify-between flex-wrap gap-3">
                  <div>
                    <h2 className="font-bold text-base text-gray-900 flex items-center gap-2">
                      <Flame className="h-5 w-5 text-amber-500 fill-amber-500" /> Flash Sale Parameterized Control
                    </h2>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Configure custom start &amp; end dates, active status, promotion title, and live countdown timer on the homepage.
                    </p>
                  </div>
                  <div className={`px-3 py-1 rounded-full text-xs font-bold border flex items-center gap-1.5 ${statusColor}`}>
                    <span className="w-2 h-2 rounded-full bg-current animate-pulse" />
                    <span>{statusLabel}</span>
                  </div>
                </div>

                {/* Status Callout Banner */}
                <div className="p-3.5 bg-gradient-to-r from-sky-50 to-blue-50/50 rounded-xl border border-sky-100 flex items-center justify-between flex-wrap gap-2 text-xs">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-sky-600" />
                    <span className="font-semibold text-sky-950">Current Window Status:</span>
                    <span className="text-sky-800">{statusDesc}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-500">Products in Flash Sale:</span>
                    <Badge variant="outline" className="bg-white text-sky-700 font-bold border-sky-200">
                      {flashProductCount} Items
                    </Badge>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setActiveMenu('products')}
                      className="text-xs h-7 px-2 text-sky-600 hover:text-sky-700"
                    >
                      Manage Products &rarr;
                    </Button>
                  </div>
                </div>

                {/* Quick Presets */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-gray-700 flex items-center gap-1.5">
                    <Zap className="h-3.5 w-3.5 text-amber-500" /> Quick Duration Presets:
                  </Label>
                  <div className="flex items-center gap-2 flex-wrap">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleApplyFlashPreset(12)}
                      className="text-xs h-7.5 bg-white hover:bg-sky-50 hover:text-sky-600 border-gray-200"
                    >
                      ⚡ Next 12 Hours
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleApplyFlashPreset(24)}
                      className="text-xs h-7.5 bg-white hover:bg-sky-50 hover:text-sky-600 border-gray-200 font-semibold"
                    >
                      ⚡ Next 24 Hours
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleApplyFlashPreset(48)}
                      className="text-xs h-7.5 bg-white hover:bg-sky-50 hover:text-sky-600 border-gray-200"
                    >
                      ⚡ Next 48 Hours (2 Days)
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleApplyFlashPreset(168)}
                      className="text-xs h-7.5 bg-white hover:bg-sky-50 hover:text-sky-600 border-gray-200"
                    >
                      📅 7-Day Campaign
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setFlashSaleEnabled(false)
                        toast.info('Flash Sale disabled (toggle switch updated)')
                      }}
                      className="text-xs h-7.5 text-red-600 hover:text-red-700 hover:bg-red-50 border-gray-200"
                    >
                      ⏹️ Turn Off
                    </Button>
                  </div>
                </div>

                {/* Main Configuration Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Master Switch */}
                  <div className="sm:col-span-2 flex items-center justify-between p-3.5 bg-gray-50 rounded-xl border border-gray-200">
                    <div className="space-y-0.5">
                      <Label className="text-xs font-bold text-gray-800">Flash Sale Master Status</Label>
                      <p className="text-[11px] text-gray-500">
                        When enabled, the Flash Sale block &amp; countdown timer will appear on the homepage during the scheduled window.
                      </p>
                    </div>
                    <Switch
                      checked={flashSaleEnabled}
                      onCheckedChange={setFlashSaleEnabled}
                      className="data-[state=checked]:bg-sky-600"
                    />
                  </div>

                  {/* Title */}
                  <div className="space-y-1">
                    <Label className="text-xs font-semibold text-gray-700">Sale Title *</Label>
                    <Input
                      value={flashSaleTitle}
                      onChange={(e) => setFlashSaleTitle(e.target.value)}
                      placeholder="e.g. 10.10 Flash Sale, Midnight Bonanza"
                      className="text-xs h-9 bg-white"
                    />
                  </div>

                  {/* Badge Text */}
                  <div className="space-y-1">
                    <Label className="text-xs font-semibold text-gray-700">Promo Badge / Discount Tag</Label>
                    <Input
                      value={flashSaleDiscountNote}
                      onChange={(e) => setFlashSaleDiscountNote(e.target.value)}
                      placeholder="e.g. On Sale Now, Up to 70% OFF"
                      className="text-xs h-9 bg-white"
                    />
                  </div>

                  {/* Start Date & Time */}
                  <div className="space-y-1">
                    <Label className="text-xs font-semibold text-gray-700 flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5 text-sky-600" /> Start Date &amp; Time *
                    </Label>
                    <Input
                      type="datetime-local"
                      value={flashSaleStartTime}
                      onChange={(e) => setFlashSaleStartTime(e.target.value)}
                      className="text-xs h-9 bg-white font-mono"
                      required
                    />
                    <p className="text-[10px] text-gray-400">
                      When the sale automatically starts counting down on the homepage.
                    </p>
                  </div>

                  {/* End Date & Time */}
                  <div className="space-y-1">
                    <Label className="text-xs font-semibold text-gray-700 flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5 text-sky-600" /> End Date &amp; Time *
                    </Label>
                    <Input
                      type="datetime-local"
                      value={flashSaleEndTime}
                      onChange={(e) => setFlashSaleEndTime(e.target.value)}
                      className="text-xs h-9 bg-white font-mono"
                      required
                    />
                    <p className="text-[10px] text-gray-400">
                      When the countdown reaches 00:00:00 and sale expires.
                    </p>
                  </div>
                </div>

                {/* Live Customer Preview */}
                <div className="space-y-2 pt-2 border-t border-gray-100">
                  <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block">
                    Storefront Live Preview:
                  </span>
                  <div className="p-4 bg-gray-50/80 rounded-xl border border-gray-200">
                    <div className="flex items-center justify-between flex-wrap gap-2 pb-2">
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <div className="flex items-center gap-1.5">
                          <Zap className="h-4 w-4 text-sky-600 fill-sky-600 animate-pulse" />
                          <span className="text-sm font-bold text-gray-900">
                            {flashSaleTitle.trim() || 'Flash Sale'}
                          </span>
                        </div>
                        <span className="text-[11px] font-semibold text-sky-600 bg-sky-50 px-2 py-0.5 rounded-full border border-sky-200">
                          {flashSaleDiscountNote.trim() || 'On Sale Now'}
                        </span>
                        <div className="flex items-center gap-1 text-[11px] text-gray-500 font-medium ml-1">
                          <span>Ending in</span>
                          <div className="flex items-center gap-0.5 font-mono text-[10px] text-white">
                            <span className="bg-gray-900 px-1.5 py-0.5 rounded font-bold">23</span>
                            <span className="text-gray-900 font-bold">:</span>
                            <span className="bg-gray-900 px-1.5 py-0.5 rounded font-bold">59</span>
                            <span className="text-gray-900 font-bold">:</span>
                            <span className="bg-gray-900 px-1.5 py-0.5 rounded font-bold">48</span>
                          </div>
                        </div>
                      </div>
                      <span className="text-[11px] font-bold text-sky-600">
                        SHOP MORE &rarr;
                      </span>
                    </div>
                  </div>
                </div>

                {/* Save actions */}
                <div className="flex gap-2 pt-2 justify-end border-t border-gray-100">
                  <Button
                    type="button"
                    size="sm"
                    onClick={handleSaveFlashConfig}
                    disabled={flashSaleSaving}
                    className="text-xs h-8 bg-sky-600 hover:bg-sky-700 text-white font-semibold px-4"
                  >
                    {flashSaleSaving ? (
                      <>
                        <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                        Saving...
                      </>
                    ) : (
                      'Save Flash Sale Settings'
                    )}
                  </Button>
                </div>
              </Card>
            )
          })()}

          {/* ========================================================= */}
          {/* PAGE 9: TOP BAR & HEADER CONFIGURATION (Admin only)       */}
          {/* ========================================================= */}
          {activeMenu === 'topbar-config' && user.role === 'ADMIN' && (
            <Card className="p-5 border-gray-200 shadow-xs space-y-6">
              {/* Header */}
              <div className="flex items-center justify-between pb-3 border-b border-gray-100 flex-wrap gap-2">
                <div>
                  <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                    <Navigation className="h-5 w-5 text-sky-600" />
                    Top Bar &amp; Header Configuration
                  </h3>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Customize announcements, helpline numbers, tracking links, and category sub-bar promo badges.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-gray-700">Enable Top Bar</span>
                  <Switch
                    checked={topbarEnabled}
                    onCheckedChange={setTopbarEnabled}
                  />
                </div>
              </div>

              {/* Live Preview Box */}
              <div className="space-y-2">
                <Label className="text-xs font-semibold text-gray-600 flex items-center gap-1.5">
                  <Eye className="h-3.5 w-3.5 text-sky-600" /> Live Header Preview
                </Label>
                <div className="border border-gray-200 rounded-lg overflow-hidden shadow-2xs">
                  {/* Top Bar Preview */}
                  {topbarEnabled ? (
                    <div className="bg-sky-700 text-white text-[11px] font-medium px-4 py-2 flex items-center justify-between transition-colors">
                      <div className="flex items-center gap-3 truncate">
                        <span className="truncate">{topbarPromoText || 'No announcement set'}</span>
                      </div>
                      <div className="flex items-center gap-4 text-sky-100 shrink-0 text-[11px]">
                        {topbarShowContactPhone && topbarContactPhone && (
                          <span className="flex items-center gap-1">📞 {topbarContactPhone}</span>
                        )}
                        {topbarShowTrackOrder && (
                          <span className="underline decoration-sky-300 cursor-pointer">
                            {topbarTrackOrderText || 'Track My Order'}
                          </span>
                        )}
                        {topbarShowHelp && (
                          <span className="cursor-pointer">
                            {topbarHelpText || 'Help & Customer Care'}
                          </span>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="bg-gray-100 text-gray-400 text-xs py-2 text-center italic">
                      Top bar is currently hidden/disabled
                    </div>
                  )}

                  {/* Sub-bar Badges Preview */}
                  <div className="bg-white border-t border-gray-100 px-4 py-2 flex items-center justify-between text-[11px] text-gray-500">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-gray-800">Department Menus</span>
                      <span className="text-gray-300">•</span>
                      <span className="text-gray-400">Electronics, Fashion, Home...</span>
                    </div>
                    <div className="flex items-center gap-3 text-sky-700 font-bold shrink-0">
                      {topbarShowFlashSaleBadge && (
                        <span className="flex items-center gap-1 bg-amber-50 text-amber-700 px-1.5 py-0.5 rounded">
                          {topbarSubBarFlashText || '🔥 Flash Sale'}
                        </span>
                      )}
                      {topbarShowFlashSaleBadge && topbarShowFreeDeliveryBadge && (
                        <span className="text-gray-300">|</span>
                      )}
                      {topbarShowFreeDeliveryBadge && (
                        <span className="text-gray-500 font-normal">
                          {topbarSubBarFreeDeliveryText || '🚚 Free Delivery Over ৳1,000'}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Form Controls Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                {/* Column 1: Announcement & Promo Text */}
                <div className="space-y-4">
                  <h4 className="text-xs font-bold text-gray-800 uppercase tracking-wider pb-1 border-b border-gray-100">
                    📢 Announcement Texts
                  </h4>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">Desktop Announcement / Promo Text</Label>
                    <Input
                      value={topbarPromoText}
                      onChange={(e) => setTopbarPromoText(e.target.value)}
                      placeholder="e.g. Save more with our App — Download now! 📱"
                      className="text-xs h-9"
                    />
                    <p className="text-[11px] text-gray-400">Shown on the left side of the top bar on desktop screens.</p>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">Mobile Announcement Text</Label>
                    <Input
                      value={topbarPromoTextMobile}
                      onChange={(e) => setTopbarPromoTextMobile(e.target.value)}
                      placeholder="e.g. 🎉 Welcome to ShopZilla"
                      className="text-xs h-9"
                    />
                    <p className="text-[11px] text-gray-400">Compact text displayed on smartphone viewports.</p>
                  </div>

                  <div className="pt-2">
                    <h4 className="text-xs font-bold text-gray-800 uppercase tracking-wider pb-1 border-b border-gray-100">
                      🏷️ Category Sub-Bar Badges
                    </h4>
                  </div>

                  <div className="space-y-2 p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs font-semibold text-gray-800">Flash Sale Badge</Label>
                      <Switch
                        checked={topbarShowFlashSaleBadge}
                        onCheckedChange={setTopbarShowFlashSaleBadge}
                      />
                    </div>
                    <Input
                      value={topbarSubBarFlashText}
                      onChange={(e) => setTopbarSubBarFlashText(e.target.value)}
                      placeholder="🔥 Flash Sale"
                      className="text-xs h-8 bg-white"
                      disabled={!topbarShowFlashSaleBadge}
                    />
                  </div>

                  <div className="space-y-2 p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs font-semibold text-gray-800">Free Delivery Notice</Label>
                      <Switch
                        checked={topbarShowFreeDeliveryBadge}
                        onCheckedChange={setTopbarShowFreeDeliveryBadge}
                      />
                    </div>
                    <Input
                      value={topbarSubBarFreeDeliveryText}
                      onChange={(e) => setTopbarSubBarFreeDeliveryText(e.target.value)}
                      placeholder="🚚 Free Delivery Over ৳1,000"
                      className="text-xs h-8 bg-white"
                      disabled={!topbarShowFreeDeliveryBadge}
                    />
                  </div>
                </div>

                {/* Column 2: Right Utility Links & Contact */}
                <div className="space-y-4">
                  <h4 className="text-xs font-bold text-gray-800 uppercase tracking-wider pb-1 border-b border-gray-100">
                    🔗 Utility Links &amp; Customer Helpline
                  </h4>

                  {/* Contact Phone */}
                  <div className="space-y-2 p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs font-semibold text-gray-800">Helpline / Contact Phone</Label>
                      <Switch
                        checked={topbarShowContactPhone}
                        onCheckedChange={setTopbarShowContactPhone}
                      />
                    </div>
                    <Input
                      value={topbarContactPhone}
                      onChange={(e) => setTopbarContactPhone(e.target.value)}
                      placeholder="+880 9678 123 456"
                      className="text-xs h-8 bg-white"
                      disabled={!topbarShowContactPhone}
                    />
                    <p className="text-[11px] text-gray-400">Direct helpline shown to shoppers in the top bar.</p>
                  </div>

                  {/* Track My Order */}
                  <div className="space-y-2 p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs font-semibold text-gray-800">Order Tracking Link</Label>
                      <Switch
                        checked={topbarShowTrackOrder}
                        onCheckedChange={setTopbarShowTrackOrder}
                      />
                    </div>
                    <Input
                      value={topbarTrackOrderText}
                      onChange={(e) => setTopbarTrackOrderText(e.target.value)}
                      placeholder="Track My Order"
                      className="text-xs h-8 bg-white"
                      disabled={!topbarShowTrackOrder}
                    />
                    <p className="text-[11px] text-gray-400">Opens user dashboard or login prompt for tracking status.</p>
                  </div>

                  {/* Help & Customer Care */}
                  <div className="space-y-2 p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs font-semibold text-gray-800">Customer Care &amp; Help Link</Label>
                      <Switch
                        checked={topbarShowHelp}
                        onCheckedChange={setTopbarShowHelp}
                      />
                    </div>
                    <Input
                      value={topbarHelpText}
                      onChange={(e) => setTopbarHelpText(e.target.value)}
                      placeholder="Help & Customer Care"
                      className="text-xs h-8 bg-white"
                      disabled={!topbarShowHelp}
                    />
                    <p className="text-[11px] text-gray-400">Help center text in the top right menu.</p>
                  </div>
                </div>
              </div>

              {/* Actions Footer */}
              <div className="flex items-center justify-between pt-4 border-t border-gray-100 flex-wrap gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleResetTopbarDefaults}
                  className="text-xs h-8 text-gray-600 hover:text-gray-900 border-gray-200"
                >
                  <RotateCcw className="h-3.5 w-3.5 mr-1" /> Reset to Defaults
                </Button>

                <Button
                  type="button"
                  size="sm"
                  onClick={handleSaveTopbarConfig}
                  disabled={topbarSaving}
                  className="text-xs h-8 bg-sky-600 hover:bg-sky-700 text-white font-semibold px-5"
                >
                  {topbarSaving ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                      Saving...
                    </>
                  ) : (
                    'Save Top Bar Settings'
                  )}
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

      {/* Category Add/Edit Modal */}
      <Dialog open={categoryModalOpen} onOpenChange={setCategoryModalOpen}>
        <DialogContent className="max-w-md bg-white">
          <form onSubmit={handleSaveCategory}>
            <DialogHeader>
              <DialogTitle className="text-base font-bold flex items-center gap-2">
                <Layers className="h-4 w-4 text-sky-600" />
                {editingCategory ? 'Edit Category' : 'Add New Category'}
              </DialogTitle>
              <DialogDescription className="text-xs text-gray-500">
                {editingCategory
                  ? 'Update category name, icon or parent classification.'
                  : 'Add a new category to organize products on your store.'}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-3">
              {/* Category Name */}
              <div className="space-y-1">
                <Label htmlFor="catName" className="text-xs font-semibold text-gray-800">
                  Category Name *
                </Label>
                <Input
                  id="catName"
                  value={catFormName}
                  onChange={(e) => setCatFormName(e.target.value)}
                  placeholder="e.g. Smart Watches, Organic Food"
                  className="text-xs h-9 bg-white"
                  required
                  autoFocus
                />
              </div>

              {/* Parent Category */}
              <div className="space-y-1">
                <Label className="text-xs font-semibold text-gray-800">
                  Parent Category (Hierarchy)
                </Label>
                <Select value={catFormParentId} onValueChange={setCatFormParentId}>
                  <SelectTrigger className="text-xs h-9 bg-white">
                    <SelectValue placeholder="Top-Level Category (No parent)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">
                      📂 Top-Level Category (No parent)
                    </SelectItem>
                    {categoryList
                      .filter((c) => !editingCategory || c.id !== editingCategory.id)
                      .map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {getCategoryDisplayEmoji(c.icon)} {c.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
                <p className="text-[10px] text-gray-400">
                  Choose "Top-Level" for main categories shown on home page &amp; header.
                </p>
              </div>

              {/* Icon / Emoji Preset Picker */}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-gray-800">
                  Category Icon &amp; Badge
                </Label>
                <div className="grid grid-cols-5 gap-1.5 p-2 bg-gray-50 rounded-lg border border-gray-100 max-h-36 overflow-y-auto">
                  {CATEGORY_ICON_PRESETS.map((p) => {
                    const isSelected = catFormIcon === p.key || catFormIcon === p.emoji
                    return (
                      <button
                        key={p.key}
                        type="button"
                        onClick={() => setCatFormIcon(p.key)}
                        className={`flex flex-col items-center justify-center p-1.5 rounded-md border text-center transition ${
                          isSelected
                            ? 'border-sky-500 bg-sky-50 text-sky-700 shadow-xs'
                            : 'border-transparent bg-white hover:bg-gray-100 text-gray-700'
                        }`}
                        title={p.label}
                      >
                        <span className="text-lg leading-none">{p.emoji}</span>
                        <span className="text-[9px] mt-1 truncate max-w-full font-medium">
                          {p.key}
                        </span>
                      </button>
                    )
                  })}
                </div>

                <div className="pt-1">
                  <Input
                    placeholder="Or enter custom icon key or emoji (e.g. 🍕, 🎧, 👜)"
                    value={catFormIcon}
                    onChange={(e) => setCatFormIcon(e.target.value)}
                    className="text-xs h-8 bg-white"
                  />
                </div>
              </div>

              {/* Live Preview */}
              <div className="p-3 bg-gradient-to-r from-sky-50/50 to-cyan-50/50 rounded-lg border border-sky-100 space-y-1.5">
                <div className="text-[10px] font-bold uppercase tracking-wider text-sky-700">Preview</div>
                <div className="flex items-center gap-3">
                  <div className="flex flex-col items-center gap-1 p-2 bg-white border border-gray-200 rounded-lg shadow-2xs w-20">
                    <span className="text-2xl">{getCategoryDisplayEmoji(catFormIcon)}</span>
                    <span className="text-[10px] font-medium text-gray-700 text-center truncate max-w-full">
                      {catFormName.trim() || 'Category Name'}
                    </span>
                  </div>
                  <div className="text-xs text-gray-500 space-y-0.5">
                    <div>
                      <span className="font-semibold text-gray-700">Type: </span>
                      {catFormParentId === 'none' ? 'Main Category (Header / Home)' : 'Subcategory'}
                    </div>
                    <div>
                      <span className="font-semibold text-gray-700">Display: </span>
                      {getCategoryDisplayEmoji(catFormIcon)} {catFormName.trim() || 'Untitled'}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <DialogFooter className="gap-2 pt-2 border-t border-gray-100">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setCategoryModalOpen(false)}
                className="text-xs h-8"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={catFormSaving || !catFormName.trim()}
                className="bg-sky-600 hover:bg-sky-700 text-white text-xs h-8 px-4"
              >
                {catFormSaving ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                    Saving...
                  </>
                ) : editingCategory ? (
                  'Update Category'
                ) : (
                  'Create Category'
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Daraz Seller Center Product Input Form */}
      <DarazProductForm
        open={formOpen}
        onOpenChange={setFormOpen}
        product={editingProduct}
        categories={categoryList}
        onSuccess={fetchAll}
      />
    </div>
  )
}
