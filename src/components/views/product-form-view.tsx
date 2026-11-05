'use client'

import { useState, useEffect, useMemo, useRef } from 'react'
import { useStore } from '@/lib/store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  ArrowLeft,
  Check,
  Plus,
  Trash2,
  Image as ImageIcon,
  Sparkles,
  DollarSign,
  Layers,
  ShieldCheck,
  Truck,
  Tag,
  Eye,
  RefreshCw,
  Upload,
  Video,
  Boxes,
  FileText,
  Info,
  Loader2,
  CheckCircle2,
  Percent,
  X,
  ExternalLink,
} from 'lucide-react'
import { toast } from 'sonner'

/**
 * Senior UX/UI Component: Interactive "i" (info) button attached beside labels.
 * Keeps form clean and uncluttered by eliminating paragraphs of text below inputs.
 */
function FieldInfo({ text }: { text: string }) {
  if (!text) return null
  return (
    <TooltipProvider delayDuration={150}>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            className="inline-flex items-center justify-center text-slate-400 hover:text-[#0284C7] p-0.5 rounded-full hover:bg-sky-50 transition-colors cursor-help shrink-0 align-middle ml-1.5 focus:outline-hidden"
            aria-label="Field information"
          >
            <Info className="h-3.5 w-3.5" />
          </button>
        </TooltipTrigger>
        <TooltipContent
          side="top"
          className="max-w-xs bg-slate-900 text-white text-[11px] p-2.5 rounded-lg shadow-xl border border-slate-700 font-normal leading-relaxed z-50"
        >
          {text}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

export interface ProductFormViewProps {
  productId?: string
  initialProduct?: any
  categories?: { id: string; name: string }[]
  onCancel?: () => void
  onSuccess?: () => void
}

export function ProductFormView({
  productId,
  initialProduct,
  categories: initialCategories = [],
  onCancel,
  onSuccess,
}: ProductFormViewProps) {
  const navigate = useStore((s) => s.navigate)
  const user = useStore((s) => s.user)

  // Loading existing product state
  const [fetchingProduct, setFetchingProduct] = useState(false)
  const [product, setProduct] = useState<any>(initialProduct || null)

  // Categories state
  const [categories, setCategories] = useState<{ id: string; name: string }[]>(initialCategories)
  const [quickCatOpen, setQuickCatOpen] = useState(false)
  const [quickCatName, setQuickCatName] = useState('')
  const [quickCatLoading, setQuickCatLoading] = useState(false)

  // Section 1: Basic Information
  const [name, setName] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [brand, setBrand] = useState('No Brand')
  const [model, setModel] = useState('')
  const [status, setStatus] = useState<'ACTIVE' | 'INACTIVE'>('ACTIVE')

  // Section 2: Media & Gallery
  const [images, setImages] = useState<string[]>([])
  const [imageUrlInput, setImageUrlInput] = useState('')
  const [videoUrl, setVideoUrl] = useState('')
  const [uploadingImages, setUploadingImages] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Section 3: Pricing & Inventory
  const [price, setPrice] = useState('')
  const [comparePrice, setComparePrice] = useState('')
  const [stock, setStock] = useState('50')
  const [sku, setSku] = useState('')
  const [isFlashSale, setIsFlashSale] = useState(false)
  const [isFeatured, setIsFeatured] = useState(false)

  // Section 4: Specifications & Highlights
  const [highlights, setHighlights] = useState<string[]>([
    'High quality and durable materials',
    '100% Brand new and authentic',
    'Reliable nationwide warranty',
  ])
  const [highlightInput, setHighlightInput] = useState('')
  const [whatsInTheBox, setWhatsInTheBox] = useState('1 x Product, 1 x User Manual')
  const [material, setMaterial] = useState('')
  const [gender, setGender] = useState('Unisex')
  const [recommendedAge, setRecommendedAge] = useState('All Ages')

  // Section 5: Detailed Description
  const [description, setDescription] = useState('')
  const [previewDesc, setPreviewDesc] = useState(false)

  // Section 6: Shipping, Dimensions & Warranty
  const [packageWeight, setPackageWeight] = useState('0.25')
  const [dimLength, setDimLength] = useState('15')
  const [dimWidth, setDimWidth] = useState('10')
  const [dimHeight, setDimHeight] = useState('5')
  const [warrantyType, setWarrantyType] = useState('Local Seller Warranty')
  const [warrantyPeriod, setWarrantyPeriod] = useState('1 Year')
  const [warrantyPolicy, setWarrantyPolicy] = useState('Covers manufacturing defects only')
  const [returnPolicy, setReturnPolicy] = useState('14 days easy return')

  // Saving state
  const [saving, setSaving] = useState(false)

  // Fetch categories if not passed
  useEffect(() => {
    if (categories.length === 0) {
      fetch('/api/categories')
        .then((r) => r.json())
        .then((d) => {
          if (d.categories && d.categories.length > 0) {
            setCategories(d.categories)
            if (!categoryId) setCategoryId(d.categories[0].id)
          }
        })
        .catch(() => {})
    }
  }, [categories.length, categoryId])

  // Fetch product if productId is provided
  useEffect(() => {
    if (productId && !initialProduct) {
      setFetchingProduct(true)
      fetch(`/api/products/${productId}`)
        .then((r) => r.json())
        .then((data) => {
          if (data?.product) {
            setProduct(data.product)
          }
        })
        .catch(() => {
          toast.error('Failed to load product details')
        })
        .finally(() => {
          setFetchingProduct(false)
        })
    }
  }, [productId, initialProduct])

  // Populate form fields from product
  useEffect(() => {
    if (product) {
      setName(product.name || '')
      setCategoryId(product.categoryId || '')
      setImages(product.images || [])
      setPrice(String(product.price || ''))
      setComparePrice(product.comparePrice ? String(product.comparePrice) : '')
      setStock(String(product.stock ?? '50'))
      setBrand(product.brand || 'No Brand')
      setModel(product.model || '')
      setSku(product.sku || '')
      setStatus(product.status || 'ACTIVE')
      setDescription(product.description || '')
      setIsFlashSale(Boolean(product.isFlashSale))
      setIsFeatured(Boolean(product.isFeatured))
      setWhatsInTheBox(product.whatsInTheBox || `1 x ${product.name || 'Product'}`)
      setWarrantyType(product.warrantyType || 'Local Seller Warranty')
      setWarrantyPeriod(product.warrantyPeriod || '1 Year')
      setWarrantyPolicy(product.warrantyPolicy || 'Covers manufacturing defects only')
      setReturnPolicy(product.returnPolicy || '14 days easy return')
      setPackageWeight(product.packageWeight ? String(product.packageWeight) : '0.25')
      setVideoUrl(product.videoUrl || '')

      if (product.highlights) {
        try {
          const parsed = JSON.parse(product.highlights)
          if (Array.isArray(parsed)) setHighlights(parsed)
          else setHighlights(product.highlights.split('\n').filter(Boolean))
        } catch {
          setHighlights(product.highlights.split('\n').filter(Boolean))
        }
      }

      if (product.packageDimensions) {
        const parts = product.packageDimensions.split('x').map((s: string) => s.trim().replace('cm', ''))
        if (parts.length === 3) {
          setDimLength(parts[0])
          setDimWidth(parts[1])
          setDimHeight(parts[2])
        }
      }
    } else {
      // Defaults for new product
      if (!sku) {
        setSku(`SKU-${Math.floor(100000 + Math.random() * 900000)}`)
      }
    }
  }, [product])

  // Calculate discount percent
  const discountPercent = useMemo(() => {
    const p = parseFloat(price)
    const cp = parseFloat(comparePrice)
    if (!isNaN(p) && !isNaN(cp) && cp > p) {
      return Math.round(((cp - p) / cp) * 100)
    }
    return 0
  }, [price, comparePrice])

  // Image helpers
  const handleAddImageUrl = () => {
    const trimmed = imageUrlInput.trim()
    if (!trimmed) return
    if (images.includes(trimmed)) {
      toast.info('Image URL is already added to gallery')
      return
    }
    setImages([...images, trimmed])
    setImageUrlInput('')
  }

  const handleRemoveImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index))
  }

  const handleSetPrimaryImage = (index: number) => {
    if (index === 0) return
    const reordered = [...images]
    const [selected] = reordered.splice(index, 1)
    reordered.unshift(selected)
    setImages(reordered)
    toast.success('Set as primary cover image')
  }

  const handleAddRandomImages = () => {
    const seeds = [
      Math.random().toString(36).substring(2, 7),
      Math.random().toString(36).substring(2, 7),
      Math.random().toString(36).substring(2, 7),
    ]
    const demoPics = seeds.map(
      (s) => `https://images.unsplash.com/photo-${1523275335684 + Math.floor(Math.random() * 1000)}?w=600&auto=format&fit=crop&q=80`
    )
    setImages((prev) => [...prev, ...demoPics])
    toast.success('Added 3 demo product photos')
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return
    setUploadingImages(true)
    try {
      const readFileAsDataUrl = (file: File): Promise<string> =>
        new Promise((resolve, reject) => {
          const reader = new FileReader()
          reader.onload = () => resolve(reader.result as string)
          reader.onerror = reject
          reader.readAsDataURL(file)
        })

      const loadedUrls = await Promise.all(Array.from(files).map(readFileAsDataUrl))
      setImages((prev) => [...prev, ...loadedUrls])
      toast.success(`Added ${loadedUrls.length} image(s) to gallery`)
    } catch {
      toast.error('Failed to process image files')
    } finally {
      setUploadingImages(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  // Highlight list helpers
  const handleAddHighlight = () => {
    const trimmed = highlightInput.trim()
    if (trimmed && !highlights.includes(trimmed)) {
      setHighlights([...highlights, trimmed])
      setHighlightInput('')
    }
  }

  const handleRemoveHighlight = (index: number) => {
    setHighlights(highlights.filter((_, i) => i !== index))
  }

  // Quick category creation
  const handleCreateCategory = async () => {
    if (!quickCatName.trim()) {
      toast.error('Please enter a category name')
      return
    }
    setQuickCatLoading(true)
    try {
      const res = await fetch('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: quickCatName.trim(), icon: 'tag' }),
      })
      const data = await res.json()
      if (res.ok && data.category) {
        toast.success(`Category "${data.category.name}" created!`)
        setCategories((prev) => [...prev, { id: data.category.id, name: data.category.name }])
        setCategoryId(data.category.id)
        setQuickCatName('')
        setQuickCatOpen(false)
      } else {
        toast.error(data.error || 'Failed to create category')
      }
    } catch {
      toast.error('Network error creating category')
    } finally {
      setQuickCatLoading(false)
    }
  }

  // Save / Publish product
  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()

    // Validation
    if (!name.trim()) {
      toast.error('Product Title is required')
      return
    }
    if (!categoryId) {
      toast.error('Please select a Category')
      return
    }
    if (images.length === 0) {
      toast.error('Please add at least 1 Product Image')
      return
    }
    const parsedPrice = parseFloat(price)
    if (isNaN(parsedPrice) || parsedPrice <= 0) {
      toast.error('Please enter a valid Sales Price')
      return
    }
    if (!description.trim()) {
      toast.error('Detailed Product Description is required')
      return
    }

    setSaving(true)
    try {
      const packageDimensions = `${dimLength} x ${dimWidth} x ${dimHeight} cm`
      const payload = {
        name: name.trim(),
        categoryId,
        images,
        brand: brand.trim() || 'No Brand',
        model: model.trim() || null,
        sku: sku.trim() || null,
        price: parsedPrice,
        comparePrice: comparePrice ? parseFloat(comparePrice) : null,
        stock: parseInt(stock, 10) || 0,
        status,
        description: description.trim(),
        highlights: JSON.stringify(highlights),
        whatsInTheBox: whatsInTheBox.trim() || null,
        packageWeight: parseFloat(packageWeight) || 0.25,
        packageDimensions,
        warrantyType: warrantyType || null,
        warrantyPeriod: warrantyPeriod || null,
        warrantyPolicy: warrantyPolicy.trim() || null,
        returnPolicy: returnPolicy.trim() || null,
        videoUrl: videoUrl.trim() || null,
        isFlashSale,
        isFeatured,
      }

      const url = product?.id ? `/api/products/${product.id}` : '/api/products'
      const method = product?.id ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error || 'Failed to save product')
        return
      }

      toast.success(product?.id ? 'Product updated successfully!' : 'Product published to store!')

      if (onSuccess) {
        onSuccess()
      } else if (onCancel) {
        onCancel()
      } else {
        navigate({ name: 'dashboard' })
      }
    } catch {
      toast.error('An error occurred while saving the product')
    } finally {
      setSaving(false)
    }
  }

  const handleBack = () => {
    if (onCancel) {
      onCancel()
    } else {
      navigate({ name: 'dashboard' })
    }
  }

  if (fetchingProduct) {
    return (
      <div className="container mx-auto px-4 py-16 flex flex-col items-center justify-center space-y-3">
        <Loader2 className="h-8 w-8 text-[#0284C7] animate-spin" />
        <p className="text-xs text-slate-500 font-medium">Loading product data...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-16">
      {/* ========================================================================= */}
      {/* 1. TOP STICKY HEADER & BREADCRUMBS                                       */}
      {/* ========================================================================= */}
      <div className="sticky top-0 z-30 bg-white border-b border-[#E2E8F0] shadow-xs">
        <div className="max-w-[1300px] mx-auto px-4 sm:px-6 py-3.5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={handleBack}
              className="p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition shrink-0"
              title="Return to products"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            <div className="min-w-0">
              <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
                <button
                  type="button"
                  onClick={handleBack}
                  className="hover:text-[#0284C7] transition"
                >
                  Dashboard
                </button>
                <span>/</span>
                <button
                  type="button"
                  onClick={handleBack}
                  className="hover:text-[#0284C7] transition"
                >
                  Products
                </button>
                <span>/</span>
                <span className="text-slate-800 font-semibold truncate">
                  {product?.id ? 'Edit Product' : 'Add New Product'}
                </span>
              </div>
              <h1 className="text-base sm:text-lg font-extrabold text-[#1E293B] truncate mt-0.5">
                {product?.id ? `Edit: ${name || 'Product'}` : 'Create New Marketplace Listing'}
              </h1>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2.5 shrink-0">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleBack}
              className="text-xs h-9 px-3.5 text-slate-600 border-[#E2E8F0] hover:bg-slate-50"
            >
              Discard
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={() => handleSubmit()}
              disabled={saving}
              className="text-xs h-9 px-4.5 bg-[#0284C7] hover:bg-[#0369A1] text-white font-bold shadow-xs transition"
            >
              {saving ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                  Saving...
                </>
              ) : (
                <>
                  <Check className="h-3.5 w-3.5 mr-1.5" />
                  {product?.id ? 'Update Product' : 'Publish Product'}
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. MAIN TWO-COLUMN FORM LAYOUT                                           */}
      {/* ========================================================================= */}
      <div className="max-w-[1300px] mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* ======================================================================= */}
          {/* LEFT COLUMN (8 OF 12 COLS): CORE PRODUCT CONTENT                        */}
          {/* ======================================================================= */}
          <div className="lg:col-span-8 space-y-6">
            
            {/* CARD 1: BASIC INFORMATION */}
            <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-xs p-5 sm:p-6 space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-[#E2E8F0]">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-[#F0F9FF] text-[#0284C7] flex items-center justify-center">
                    <Boxes className="h-4 w-4" />
                  </div>
                  <div>
                    <h2 className="text-sm sm:text-base font-bold text-[#1E293B]">Basic Information</h2>
                  </div>
                </div>
                <span className="text-[11px] font-semibold text-[#0284C7] bg-[#F0F9FF] px-2.5 py-0.5 rounded-full">
                  Step 1
                </span>
              </div>

              {/* Product Title */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Label className="text-xs font-bold text-[#1E293B]">Product Title / Name *</Label>
                    <FieldInfo text="A descriptive, keyword-rich title helps buyers discover your item in marketplace search." />
                  </div>
                  <span className="text-[11px] text-slate-400 font-mono">{name.length}/255</span>
                </div>
                <Input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Wireless Bluetooth 5.3 Over-Ear Headphones with Active Noise Cancelling"
                  className="h-10 text-xs sm:text-sm bg-white border-[#E2E8F0] focus-visible:ring-[#0284C7] focus-visible:border-[#0284C7] rounded-xl"
                  required
                />
              </div>

              {/* Category & Brand row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Category Selection */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <Label className="text-xs font-bold text-[#1E293B]">Category *</Label>
                      <FieldInfo text="Accurate category classification ensures proper search indexing and correct delivery channel assignment." />
                    </div>
                    <button
                      type="button"
                      onClick={() => setQuickCatOpen(true)}
                      className="text-[11px] font-bold text-[#0284C7] hover:underline"
                    >
                      + New
                    </button>
                  </div>
                  <Select value={categoryId} onValueChange={setCategoryId}>
                    <SelectTrigger className="h-10 text-xs sm:text-sm bg-white border-[#E2E8F0] rounded-xl">
                      <SelectValue placeholder="Select Category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((c) => (
                        <SelectItem key={c.id} value={c.id} className="text-xs">
                          {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Brand */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <Label className="text-xs font-bold text-[#1E293B]">Brand Name</Label>
                      <FieldInfo text="Official brand name builds buyer trust. If unbranded, specify 'No Brand'." />
                    </div>
                    <button
                      type="button"
                      onClick={() => setBrand('No Brand')}
                      className="text-[11px] font-medium text-slate-500 hover:text-slate-800"
                    >
                      Set &quot;No Brand&quot;
                    </button>
                  </div>
                  <Input
                    type="text"
                    value={brand}
                    onChange={(e) => setBrand(e.target.value)}
                    placeholder="e.g. Sony, Samsung, No Brand"
                    className="h-10 text-xs sm:text-sm bg-white border-[#E2E8F0] rounded-xl"
                  />
                </div>
              </div>

              {/* Model / Series */}
              <div className="space-y-1.5">
                <div className="flex items-center">
                  <Label className="text-xs font-bold text-[#1E293B]">Model / Edition</Label>
                  <FieldInfo text="Specific model number, series name, or revision to distinguish from other variants." />
                </div>
                <Input
                  type="text"
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  placeholder="e.g. WH-1000XM5 / 2024 Edition"
                  className="h-10 text-xs sm:text-sm bg-white border-[#E2E8F0] rounded-xl"
                />
              </div>
            </div>

            {/* CARD 2: PRODUCT HIGHLIGHTS & DESCRIPTION */}
            <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-xs p-5 sm:p-6 space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-[#E2E8F0]">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-[#F0F9FF] text-[#0284C7] flex items-center justify-center">
                    <FileText className="h-4 w-4" />
                  </div>
                  <div>
                    <h2 className="text-sm sm:text-base font-bold text-[#1E293B]">Description &amp; Highlights</h2>
                  </div>
                </div>
                <span className="text-[11px] font-semibold text-[#0284C7] bg-[#F0F9FF] px-2.5 py-0.5 rounded-full">
                  Step 2
                </span>
              </div>

              {/* Key Highlights Bullet Points */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Label className="text-xs font-bold text-[#1E293B]">Key Highlights (Bullet Points)</Label>
                    <FieldInfo text="3 to 5 concise points highlighting main selling propositions, displayed prominently beside product images." />
                  </div>
                  <span className="text-[11px] text-slate-400 font-medium">{highlights.length} bullet(s)</span>
                </div>

                {/* Highlight entry bar */}
                <div className="flex gap-2">
                  <Input
                    type="text"
                    value={highlightInput}
                    onChange={(e) => setHighlightInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        handleAddHighlight()
                      }
                    }}
                    placeholder="Type a key feature and click Add..."
                    className="h-9 text-xs bg-white border-[#E2E8F0] rounded-xl"
                  />
                  <Button
                    type="button"
                    size="sm"
                    onClick={handleAddHighlight}
                    className="h-9 px-3.5 bg-[#0284C7] hover:bg-[#0369A1] text-white text-xs font-semibold rounded-xl shrink-0"
                  >
                    <Plus className="h-3.5 w-3.5 mr-1" /> Add
                  </Button>
                </div>

                {/* Highlights List */}
                <div className="space-y-1.5 pt-1">
                  {highlights.map((h, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between gap-2 p-2 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg text-xs text-[#1E293B]"
                    >
                      <div className="flex items-center gap-2 truncate">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#0284C7] shrink-0" />
                        <span className="truncate">{h}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveHighlight(i)}
                        className="text-slate-400 hover:text-red-600 transition p-1"
                        title="Remove highlight"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Detailed Description */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Label className="text-xs font-bold text-[#1E293B]">Detailed Description *</Label>
                    <FieldInfo text="Comprehensive information covering specifications, compatibility, instructions, and materials." />
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setPreviewDesc(false)}
                      className={`px-2.5 py-0.5 text-xs font-semibold rounded-md transition ${
                        !previewDesc ? 'bg-[#0284C7] text-white' : 'text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => setPreviewDesc(true)}
                      className={`px-2.5 py-0.5 text-xs font-semibold rounded-md transition ${
                        previewDesc ? 'bg-[#0284C7] text-white' : 'text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      Preview
                    </button>
                  </div>
                </div>

                {!previewDesc ? (
                  <Textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Enter complete product description, benefits, dimensions, and specifications..."
                    rows={8}
                    className="text-xs sm:text-sm bg-white border-[#E2E8F0] focus-visible:ring-[#0284C7] rounded-xl font-mono"
                    required
                  />
                ) : (
                  <div className="min-h-[190px] p-4 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-xs sm:text-sm text-[#1E293B] whitespace-pre-wrap leading-relaxed">
                    {description || <span className="text-slate-400 italic">No description entered yet.</span>}
                  </div>
                )}
              </div>

              {/* What's In The Box */}
              <div className="space-y-1.5">
                <div className="flex items-center">
                  <Label className="text-xs font-bold text-[#1E293B]">What&apos;s in the Box?</Label>
                  <FieldInfo text="Enumerate all included components and accessories so buyers know exactly what to expect." />
                </div>
                <Input
                  type="text"
                  value={whatsInTheBox}
                  onChange={(e) => setWhatsInTheBox(e.target.value)}
                  placeholder="e.g. 1 x Headphones, 1 x Charging Cable, 1 x Audio Jack, 1 x Warranty Card"
                  className="h-10 text-xs sm:text-sm bg-white border-[#E2E8F0] rounded-xl"
                />
              </div>
            </div>

            {/* CARD 3: SHIPPING, DIMENSIONS & WARRANTY */}
            <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-xs p-5 sm:p-6 space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-[#E2E8F0]">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-[#F0F9FF] text-[#0284C7] flex items-center justify-center">
                    <Truck className="h-4 w-4" />
                  </div>
                  <div>
                    <h2 className="text-sm sm:text-base font-bold text-[#1E293B]">Shipping &amp; Warranty</h2>
                  </div>
                </div>
                <span className="text-[11px] font-semibold text-[#0284C7] bg-[#F0F9FF] px-2.5 py-0.5 rounded-full">
                  Step 3
                </span>
              </div>

              {/* Weight & Dimensions Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                {/* Weight */}
                <div className="space-y-1.5">
                  <div className="flex items-center">
                    <Label className="text-xs font-bold text-[#1E293B]">Weight (kg)</Label>
                    <FieldInfo text="Package weight including protective wrapping, used to compute volumetric shipping charges." />
                  </div>
                  <Input
                    type="number"
                    step="0.01"
                    value={packageWeight}
                    onChange={(e) => setPackageWeight(e.target.value)}
                    placeholder="0.25"
                    className="h-10 text-xs sm:text-sm bg-white border-[#E2E8F0] rounded-xl"
                  />
                </div>

                {/* Length */}
                <div className="space-y-1.5">
                  <div className="flex items-center">
                    <Label className="text-xs font-bold text-[#1E293B]">Length (cm)</Label>
                    <FieldInfo text="Outer parcel box length." />
                  </div>
                  <Input
                    type="number"
                    value={dimLength}
                    onChange={(e) => setDimLength(e.target.value)}
                    placeholder="15"
                    className="h-10 text-xs sm:text-sm bg-white border-[#E2E8F0] rounded-xl"
                  />
                </div>

                {/* Width */}
                <div className="space-y-1.5">
                  <div className="flex items-center">
                    <Label className="text-xs font-bold text-[#1E293B]">Width (cm)</Label>
                    <FieldInfo text="Outer parcel box width." />
                  </div>
                  <Input
                    type="number"
                    value={dimWidth}
                    onChange={(e) => setDimWidth(e.target.value)}
                    placeholder="10"
                    className="h-10 text-xs sm:text-sm bg-white border-[#E2E8F0] rounded-xl"
                  />
                </div>

                {/* Height */}
                <div className="space-y-1.5">
                  <div className="flex items-center">
                    <Label className="text-xs font-bold text-[#1E293B]">Height (cm)</Label>
                    <FieldInfo text="Outer parcel box height." />
                  </div>
                  <Input
                    type="number"
                    value={dimHeight}
                    onChange={(e) => setDimHeight(e.target.value)}
                    placeholder="5"
                    className="h-10 text-xs sm:text-sm bg-white border-[#E2E8F0] rounded-xl"
                  />
                </div>
              </div>

              {/* Warranty & Return row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                {/* Warranty Type */}
                <div className="space-y-1.5">
                  <div className="flex items-center">
                    <Label className="text-xs font-bold text-[#1E293B]">Warranty Type</Label>
                    <FieldInfo text="Choose whether warranty is serviced directly by seller or official brand service centers." />
                  </div>
                  <Select value={warrantyType} onValueChange={setWarrantyType}>
                    <SelectTrigger className="h-10 text-xs sm:text-sm bg-white border-[#E2E8F0] rounded-xl">
                      <SelectValue placeholder="Select Warranty" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Local Seller Warranty" className="text-xs">Local Seller Warranty</SelectItem>
                      <SelectItem value="Brand Official Warranty" className="text-xs">Brand Official Warranty</SelectItem>
                      <SelectItem value="International Manufacturer Warranty" className="text-xs">International Manufacturer</SelectItem>
                      <SelectItem value="No Warranty" className="text-xs">No Warranty</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Warranty Period */}
                <div className="space-y-1.5">
                  <div className="flex items-center">
                    <Label className="text-xs font-bold text-[#1E293B]">Warranty Period</Label>
                    <FieldInfo text="Valid duration of warranty service." />
                  </div>
                  <Select value={warrantyPeriod} onValueChange={setWarrantyPeriod}>
                    <SelectTrigger className="h-10 text-xs sm:text-sm bg-white border-[#E2E8F0] rounded-xl">
                      <SelectValue placeholder="Select Period" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="7 Days" className="text-xs">7 Days</SelectItem>
                      <SelectItem value="1 Month" className="text-xs">1 Month</SelectItem>
                      <SelectItem value="6 Months" className="text-xs">6 Months</SelectItem>
                      <SelectItem value="1 Year" className="text-xs">1 Year</SelectItem>
                      <SelectItem value="2 Years" className="text-xs">2 Years</SelectItem>
                      <SelectItem value="Lifetime" className="text-xs">Lifetime</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Return Policy */}
              <div className="space-y-1.5">
                <div className="flex items-center">
                  <Label className="text-xs font-bold text-[#1E293B]">Return Policy</Label>
                  <FieldInfo text="Return guarantee terms for customer change of mind or transit damage." />
                </div>
                <Input
                  type="text"
                  value={returnPolicy}
                  onChange={(e) => setReturnPolicy(e.target.value)}
                  placeholder="e.g. 14 days easy return for undamaged goods"
                  className="h-10 text-xs sm:text-sm bg-white border-[#E2E8F0] rounded-xl"
                />
              </div>
            </div>
          </div>

          {/* ======================================================================= */}
          {/* RIGHT COLUMN (4 OF 12 COLS): PRICING, MEDIA, MERCHANDISING              */}
          {/* ======================================================================= */}
          <div className="lg:col-span-4 space-y-6">

            {/* CARD 4: PRICING & INVENTORY */}
            <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-xs p-5 sm:p-6 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[#E2E8F0]">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-[#F0F9FF] text-[#0284C7] flex items-center justify-center">
                    <DollarSign className="h-4 w-4" />
                  </div>
                  <h2 className="text-sm font-bold text-[#1E293B]">Price &amp; Stock</h2>
                </div>
                {discountPercent > 0 && (
                  <span className="text-[11px] font-black text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                    -{discountPercent}% OFF
                  </span>
                )}
              </div>

              {/* Regular Price */}
              <div className="space-y-1.5">
                <div className="flex items-center">
                  <Label className="text-xs font-bold text-[#1E293B]">Sales Price (৳) *</Label>
                  <FieldInfo text="The actual final selling price charged to buyers on the website." />
                </div>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">
                    ৳
                  </span>
                  <Input
                    type="number"
                    step="0.01"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    placeholder="1250"
                    className="pl-7 h-10 text-xs sm:text-sm bg-white border-[#E2E8F0] focus-visible:ring-[#0284C7] rounded-xl font-bold"
                    required
                  />
                </div>
              </div>

              {/* Compare Price */}
              <div className="space-y-1.5">
                <div className="flex items-center">
                  <Label className="text-xs font-bold text-[#1E293B]">Original / Strike Price (৳)</Label>
                  <FieldInfo text="Original retail price displayed with a strikethrough to showcase a bargain." />
                </div>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">
                    ৳
                  </span>
                  <Input
                    type="number"
                    step="0.01"
                    value={comparePrice}
                    onChange={(e) => setComparePrice(e.target.value)}
                    placeholder="1750"
                    className="pl-7 h-10 text-xs sm:text-sm bg-white border-[#E2E8F0] rounded-xl text-slate-600"
                  />
                </div>
              </div>

              {/* Stock Quantity */}
              <div className="space-y-1.5">
                <div className="flex items-center">
                  <Label className="text-xs font-bold text-[#1E293B]">Available Stock Units *</Label>
                  <FieldInfo text="Total inventory quantity available for purchase in your warehouse." />
                </div>
                <Input
                  type="number"
                  value={stock}
                  onChange={(e) => setStock(e.target.value)}
                  placeholder="50"
                  className="h-10 text-xs sm:text-sm bg-white border-[#E2E8F0] rounded-xl"
                  required
                />
              </div>

              {/* SKU */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Label className="text-xs font-bold text-[#1E293B]">SKU Code</Label>
                    <FieldInfo text="Stock Keeping Unit used for warehouse scanning, order fulfillment, and barcodes." />
                  </div>
                  <button
                    type="button"
                    onClick={() => setSku(`SKU-${Math.floor(100000 + Math.random() * 900000)}`)}
                    className="text-[11px] font-bold text-[#0284C7] hover:underline flex items-center gap-0.5"
                  >
                    <RefreshCw className="h-2.5 w-2.5" /> Auto
                  </button>
                </div>
                <Input
                  type="text"
                  value={sku}
                  onChange={(e) => setSku(e.target.value)}
                  placeholder="SKU-123456"
                  className="h-10 text-xs sm:text-sm font-mono bg-white border-[#E2E8F0] rounded-xl"
                />
              </div>

              {/* Listing Status */}
              <div className="pt-2 border-t border-[#E2E8F0] flex items-center justify-between">
                <div className="flex items-center">
                  <Label className="text-xs font-bold text-[#1E293B]">Publish to Store</Label>
                  <FieldInfo text="When inactive, this product is saved as a hidden draft invisible to customers." />
                </div>
                <Switch
                  checked={status === 'ACTIVE'}
                  onCheckedChange={(checked) => setStatus(checked ? 'ACTIVE' : 'INACTIVE')}
                />
              </div>
            </div>

            {/* CARD 5: MEDIA & GALLERY */}
            <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-xs p-5 sm:p-6 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[#E2E8F0]">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-[#F0F9FF] text-[#0284C7] flex items-center justify-center">
                    <ImageIcon className="h-4 w-4" />
                  </div>
                  <h2 className="text-sm font-bold text-[#1E293B]">Product Gallery</h2>
                </div>
                <span className="text-[11px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                  {images.length} Image(s)
                </span>
              </div>

              {/* Cover image preview if exists */}
              {images.length > 0 ? (
                <div className="space-y-3">
                  <div className="relative aspect-square w-full rounded-xl overflow-hidden border border-[#E2E8F0] bg-slate-100 group">
                    <img
                      src={images[0]}
                      alt="Primary cover"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-2 left-2 bg-[#0284C7] text-white text-[10px] font-black px-2 py-0.5 rounded-full shadow-xs">
                      COVER PHOTO
                    </div>
                  </div>

                  {/* Thumbnail gallery */}
                  <div className="grid grid-cols-4 gap-2">
                    {images.map((img, idx) => (
                      <div
                        key={idx}
                        className={`relative aspect-square rounded-lg overflow-hidden border-2 transition group ${
                          idx === 0 ? 'border-[#0284C7]' : 'border-[#E2E8F0] hover:border-sky-300'
                        }`}
                      >
                        <img src={img} alt={`Thumb ${idx}`} className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1">
                          {idx !== 0 && (
                            <button
                              type="button"
                              onClick={() => handleSetPrimaryImage(idx)}
                              className="p-1 rounded bg-white text-[#0284C7] hover:bg-sky-50 shadow-xs"
                              title="Set as Cover"
                            >
                              <Check className="h-3 w-3" />
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => handleRemoveImage(idx)}
                            className="p-1 rounded bg-white text-red-600 hover:bg-red-50 shadow-xs"
                            title="Delete Image"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="aspect-[4/3] rounded-xl border-2 border-dashed border-[#E2E8F0] bg-[#F8FAFC] flex flex-col items-center justify-center text-center p-4">
                  <ImageIcon className="h-8 w-8 text-slate-300 mb-1.5" />
                  <p className="text-xs font-semibold text-slate-700">No images added</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">Add photo URLs or upload from device</p>
                </div>
              )}

              {/* Add image URL bar */}
              <div className="space-y-1.5 pt-1">
                <div className="flex items-center">
                  <Label className="text-xs font-bold text-[#1E293B]">Add Image by URL</Label>
                  <FieldInfo text="Direct web image links from CDN, Imgur, or cloud storage." />
                </div>
                <div className="flex gap-2">
                  <Input
                    type="url"
                    value={imageUrlInput}
                    onChange={(e) => setImageUrlInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        handleAddImageUrl()
                      }
                    }}
                    placeholder="https://example.com/image.jpg"
                    className="h-9 text-xs bg-white border-[#E2E8F0] rounded-xl"
                  />
                  <Button
                    type="button"
                    size="sm"
                    onClick={handleAddImageUrl}
                    className="h-9 px-3 bg-[#0284C7] hover:bg-[#0369A1] text-white text-xs font-semibold rounded-xl shrink-0"
                  >
                    Add
                  </Button>
                </div>
              </div>

              {/* Upload & Demo helpers */}
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  multiple
                  accept="image/*"
                  className="hidden"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingImages}
                  className="flex-1 h-8 text-xs border-[#E2E8F0] text-slate-700 hover:bg-slate-50"
                >
                  <Upload className="h-3.5 w-3.5 mr-1" /> Upload Files
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleAddRandomImages}
                  className="h-8 text-xs text-[#0284C7] hover:bg-sky-50"
                >
                  <Sparkles className="h-3.5 w-3.5 mr-1" /> Demo Photos
                </Button>
              </div>

              {/* Video URL */}
              <div className="space-y-1.5 pt-2 border-t border-[#E2E8F0]">
                <div className="flex items-center">
                  <Label className="text-xs font-bold text-[#1E293B]">Product Video URL</Label>
                  <FieldInfo text="YouTube or streaming link to demonstrate the product in action." />
                </div>
                <Input
                  type="url"
                  value={videoUrl}
                  onChange={(e) => setVideoUrl(e.target.value)}
                  placeholder="https://youtube.com/watch?v=..."
                  className="h-9 text-xs bg-white border-[#E2E8F0] rounded-xl"
                />
              </div>
            </div>

            {/* CARD 6: MERCHANDISING & BADGES */}
            <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-xs p-5 sm:p-6 space-y-4">
              <div className="flex items-center gap-2 pb-3 border-b border-[#E2E8F0]">
                <div className="w-8 h-8 rounded-lg bg-[#F0F9FF] text-[#0284C7] flex items-center justify-center">
                  <Tag className="h-4 w-4" />
                </div>
                <h2 className="text-sm font-bold text-[#1E293B]">Promotions &amp; Badges</h2>
              </div>

              {/* Flash Sale Toggle */}
              <div className="flex items-center justify-between p-3 bg-amber-50/60 border border-amber-200 rounded-xl">
                <div>
                  <div className="flex items-center">
                    <Label className="text-xs font-bold text-amber-950">Flash Sale Deal</Label>
                    <FieldInfo text="Puts this product into the home page Flash Sale mega section with countdown timer." />
                  </div>
                  <span className="text-[11px] text-amber-800 font-medium">Eligible for homepage deal section</span>
                </div>
                <Switch checked={isFlashSale} onCheckedChange={setIsFlashSale} />
              </div>

              {/* Featured Products Toggle */}
              <div className="flex items-center justify-between p-3 bg-sky-50/60 border border-sky-200 rounded-xl">
                <div>
                  <div className="flex items-center">
                    <Label className="text-xs font-bold text-sky-950">Featured Collection</Label>
                    <FieldInfo text="Handpicked highlight showcased in the curated Featured Products block." />
                  </div>
                  <span className="text-[11px] text-sky-800 font-medium">Curated editor recommendation</span>
                </div>
                <Switch checked={isFeatured} onCheckedChange={setIsFeatured} />
              </div>
            </div>

            {/* Bottom Actions Sticky for Mobile / Tablet */}
            <div className="pt-2">
              <Button
                type="submit"
                disabled={saving}
                className="w-full h-11 bg-[#0284C7] hover:bg-[#0369A1] text-white font-bold rounded-xl text-xs sm:text-sm shadow-md transition"
              >
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> Saving Product...
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4 mr-1.5" />
                    {product?.id ? 'Save Changes' : 'Publish Product to Store'}
                  </>
                )}
              </Button>
            </div>
          </div>
        </form>
      </div>

      {/* QUICK CATEGORY CREATION MODAL */}
      <Dialog open={quickCatOpen} onOpenChange={setQuickCatOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-[#1E293B]">Add New Category</DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Create a new department category instantly without leaving the product form.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-[#1E293B]">Category Name *</Label>
              <Input
                type="text"
                value={quickCatName}
                onChange={(e) => setQuickCatName(e.target.value)}
                placeholder="e.g. Smart Watches, Kitchen Gadgets"
                className="h-10 text-xs sm:text-sm"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setQuickCatOpen(false)}
              className="text-xs"
            >
              Cancel
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleCreateCategory}
              disabled={quickCatLoading || !quickCatName.trim()}
              className="text-xs bg-[#0284C7] hover:bg-[#0369A1] text-white font-semibold"
            >
              {quickCatLoading ? 'Creating...' : 'Create Category'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

