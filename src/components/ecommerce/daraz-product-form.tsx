'use client'

import { useState, useEffect, useMemo, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Plus,
  Trash2,
  Image as ImageIcon,
  Film,
  Sparkles,
  HelpCircle,
  Eye,
  Check,
  Info,
  Layers,
  ShieldCheck,
  Truck,
  DollarSign,
  AlignLeft,
  AlignCenter,
  AlignRight,
  List,
  ListOrdered,
  Bold,
  Italic,
  X,
} from 'lucide-react'
import { toast } from 'sonner'

export interface DarazProductFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  product: any | null
  categories: { id: string; name: string }[]
  onSuccess: () => void
}

export function DarazProductForm({
  open,
  onOpenChange,
  product,
  categories,
  onSuccess,
}: DarazProductFormProps) {
  // Navigation active section
  const [activeSection, setActiveSection] = useState<'basic' | 'spec' | 'price' | 'desc' | 'shipping'>('basic')

  // Section 1: Basic Information
  const [name, setName] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [images, setImages] = useState<string[]>([])
  const [imageUrlInput, setImageUrlInput] = useState('')
  const [whiteBgImage, setWhiteBgImage] = useState('')
  const [whiteBgInput, setWhiteBgInput] = useState('')
  const [videoType, setVideoType] = useState<'upload' | 'youtube' | 'media'>('youtube')
  const [videoUrl, setVideoUrl] = useState('')

  // Section 2: Product Specification
  const [brand, setBrand] = useState('')
  const [model, setModel] = useState('')
  const [material, setMaterial] = useState('')
  const [recommendedAge, setRecommendedAge] = useState('All Ages')
  const [gender, setGender] = useState('Unisex')
  const [features, setFeatures] = useState('')

  // Section 3: Price, Stock & Variants
  const [price, setPrice] = useState('')
  const [comparePrice, setComparePrice] = useState('')
  const [stock, setStock] = useState('')
  const [sku, setSku] = useState('')
  const [freeItems, setFreeItems] = useState('')
  const [isAvailable, setIsAvailable] = useState(true)
  const [isFlashSale, setIsFlashSale] = useState(false)
  const [isFeatured, setIsFeatured] = useState(false)
  const [variantName, setVariantName] = useState('Color Family')
  const [variantOptions, setVariantOptions] = useState<string[]>(['Standard'])
  const [newVariantInput, setNewVariantInput] = useState('')

  // Section 4: Product Description & Highlights
  const [description, setDescription] = useState('')
  const [previewDesc, setPreviewDesc] = useState(false)
  const [highlights, setHighlights] = useState<string[]>([
    'High quality and durable materials',
    '100% Brand new and authentic',
    'Perfect for daily use and gifts',
  ])
  const [highlightInput, setHighlightInput] = useState('')
  const [whatsInTheBox, setWhatsInTheBox] = useState('')

  // Section 5: Shipping & Warranty
  const [packageWeight, setPackageWeight] = useState('0.25')
  const [dimLength, setDimLength] = useState('15')
  const [dimWidth, setDimWidth] = useState('10')
  const [dimHeight, setDimHeight] = useState('5')
  const [dangerousGoods, setDangerousGoods] = useState<'none' | 'battery'>('none')
  const [warrantyType, setWarrantyType] = useState('Local Seller Warranty')
  const [warrantyPeriod, setWarrantyPeriod] = useState('1 Year')
  const [warrantyPolicy, setWarrantyPolicy] = useState('Covers manufacturing defects only')
  const [returnPolicy, setReturnPolicy] = useState('14 days easy return')

  const [saving, setSaving] = useState(false)
  const [showGuidelines, setShowGuidelines] = useState(false)
  const [uploadingImages, setUploadingImages] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Load existing product or defaults
  useEffect(() => {
    if (product) {
      setName(product.name || '')
      setCategoryId(product.categoryId || categories[0]?.id || '')
      setImages(product.images || [])
      setPrice(String(product.price || ''))
      setComparePrice(product.comparePrice ? String(product.comparePrice) : '')
      setStock(String(product.stock || '0'))
      setBrand(product.brand || '')
      setModel(product.model || '')
      setSku(product.sku || '')
      setDescription(product.description || '')
      setIsFlashSale(!!product.isFlashSale)
      setIsFeatured(!!product.isFeatured)
      setWhatsInTheBox(product.whatsInTheBox || `1 x ${product.name || 'Product'}`)
      setWarrantyType(product.warrantyType || 'Local Seller Warranty')
      setWarrantyPeriod(product.warrantyPeriod || '1 Year')
      setPackageWeight(product.packageWeight ? String(product.packageWeight) : '0.25')
      setVideoUrl(product.videoUrl || '')
      setReturnPolicy(product.returnPolicy || '14 days easy return')

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
        const parts = product.packageDimensions.split('x').map((s: string) => s.trim())
        if (parts.length === 3) {
          setDimLength(parts[0])
          setDimWidth(parts[1])
          setDimHeight(parts[2])
        }
      }
    } else {
      // Default clean state
      setName('')
      setCategoryId(categories[0]?.id || '')
      setImages([])
      setPrice('')
      setComparePrice('')
      setStock('50')
      setBrand('No Brand')
      setModel('Standard')
      setSku(`SKU-${Math.floor(100000 + Math.random() * 900000)}`)
      setDescription('')
      setWhatsInTheBox('1 x Product, 1 x User Manual')
      setHighlights([
        'High quality and durable materials',
        '100% Brand new and authentic',
        'Fast shipping and reliable support',
      ])
      setWarrantyType('Local Seller Warranty')
      setWarrantyPeriod('1 Year')
      setPackageWeight('0.25')
      setDimLength('15')
      setDimWidth('10')
      setDimHeight('5')
      setIsFlashSale(false)
      setIsFeatured(false)
      setReturnPolicy('14 days easy return')
    }
  }, [product, categories, open])

  // Image helpers
  const handleAddImageUrl = () => {
    if (imageUrlInput.trim() && !images.includes(imageUrlInput.trim())) {
      setImages([...images, imageUrlInput.trim()])
      setImageUrlInput('')
    }
  }

  const handleAddRandomImages = () => {
    const seed1 = Math.random().toString(36).substring(2, 7)
    const seed2 = Math.random().toString(36).substring(2, 7)
    const seed3 = Math.random().toString(36).substring(2, 7)
    setImages((prev) => [
      ...prev,
      `https://picsum.photos/seed/${seed1}/800/800`,
      `https://picsum.photos/seed/${seed2}/800/800`,
      `https://picsum.photos/seed/${seed3}/800/800`,
    ])
    toast.success('Generated 3 sample product images')
  }

  const handleRemoveImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index))
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    setUploadingImages(true)
    try {
      const formData = new FormData()
      for (let i = 0; i < files.length; i++) {
        formData.append('files', files[i])
      }

      // Try uploading to server
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })

      if (res.ok) {
        const data = await res.json()
        if (data.urls && data.urls.length > 0) {
          setImages((prev) => [...prev, ...data.urls])
          toast.success(`Added ${data.urls.length} image(s)`)
          return
        }
      }

      // Fallback: Read as Data URLs if API returns error (e.g. storage permissions)
      const readFileAsDataUrl = (file: File): Promise<string> =>
        new Promise((resolve, reject) => {
          const reader = new FileReader()
          reader.onload = () => resolve(reader.result as string)
          reader.onerror = reject
          reader.readAsDataURL(file)
        })

      const loadedUrls = await Promise.all(Array.from(files).map(readFileAsDataUrl))
      setImages((prev) => [...prev, ...loadedUrls])
      toast.success(`Added ${loadedUrls.length} image(s)`)
    } catch (err) {
      toast.error('Failed to upload image. Please check file format.')
    } finally {
      setUploadingImages(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  // Smooth scroll to section in modal
  const scrollToSection = (secId: string) => {
    setActiveSection(secId as any)
    const el = document.getElementById(`sec-${secId}`)
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  // Highlight helpers
  const handleAddHighlight = () => {
    if (highlightInput.trim()) {
      setHighlights([...highlights, highlightInput.trim()])
      setHighlightInput('')
    }
  }

  const handleRemoveHighlight = (idx: number) => {
    setHighlights(highlights.filter((_, i) => i !== idx))
  }

  // Variant helpers
  const handleAddVariant = () => {
    if (newVariantInput.trim() && !variantOptions.includes(newVariantInput.trim())) {
      setVariantOptions([...variantOptions, newVariantInput.trim()])
      setNewVariantInput('')
    }
  }

  // Format description text
  const applyFormat = (tag: string) => {
    if (tag === 'b') setDescription((prev) => prev + ' **bold text** ')
    else if (tag === 'i') setDescription((prev) => prev + ' *italic text* ')
    else if (tag === 'ul') setDescription((prev) => prev + '\n- Bullet point item\n')
    else if (tag === 'ol') setDescription((prev) => prev + '\n1. Step item\n')
    else if (tag === 'img') {
      const url = prompt('Enter Image URL:')
      if (url) setDescription((prev) => prev + `\n![Product Image](${url})\n`)
    }
  }

  // Form Submission
  const handleSubmit = async () => {
    if (!name.trim()) {
      toast.error('Product Name is required')
      scrollToSection('basic')
      return
    }
    if (!categoryId) {
      toast.error('Please select a Category')
      scrollToSection('basic')
      return
    }
    if (images.length === 0) {
      toast.error('Please add at least 1 Product Image')
      scrollToSection('basic')
      return
    }
    if (!price || isNaN(parseFloat(price)) || parseFloat(price) <= 0) {
      toast.error('Please enter a valid Price')
      scrollToSection('price')
      return
    }
    if (!description.trim()) {
      toast.error('Product Description is required')
      scrollToSection('desc')
      return
    }
    if (highlights.length === 0) {
      toast.error('Please provide at least 1 Product Highlight')
      scrollToSection('desc')
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
        price: parseFloat(price),
        comparePrice: comparePrice ? parseFloat(comparePrice) : null,
        stock: parseInt(stock, 10) || 0,
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

      const url = product ? `/api/products/${product.id}` : '/api/products'
      const method = product ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const data = await res.json()
        toast.error(data.error || 'Failed to save product')
        return
      }

      toast.success(product ? 'Product updated successfully' : 'Product published to store!')
      onOpenChange(false)
      onSuccess()
    } catch (e) {
      toast.error('An error occurred while saving the product')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl max-h-[92vh] flex flex-col p-0 overflow-hidden bg-gray-50 border-gray-200">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between shrink-0">
          <div>
            <h2 className="text-lg font-bold text-gray-900">
              {product ? 'Edit Product' : 'Add New Product'}
            </h2>
            <div className="text-xs text-gray-500 mt-0.5">
              Manage Products &gt; {product ? 'Edit Product' : 'Add New Product'}
            </div>
          </div>

          <button
            onClick={() => onOpenChange(false)}
            className="text-gray-400 hover:text-gray-600 p-1.5 rounded-full hover:bg-gray-100 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Section Navigation Tabs */}
        <div className="bg-white border-b border-gray-200 px-6 flex items-center gap-4 text-xs font-semibold overflow-x-auto shrink-0 scrollbar-none">
          {[
            { id: 'basic', label: '1. Basic Information' },
            { id: 'spec', label: '2. Specification' },
            { id: 'price', label: '3. Price, Stock & Variants' },
            { id: 'desc', label: '4. Description' },
            { id: 'shipping', label: '5. Shipping & Warranty' },
          ].map((sec) => (
            <button
              key={sec.id}
              onClick={() => scrollToSection(sec.id)}
              className={`py-3 border-b-2 whitespace-nowrap transition cursor-pointer ${
                activeSection === sec.id
                  ? 'border-sky-600 text-sky-600 font-bold'
                  : 'border-transparent text-gray-500 hover:text-gray-900'
              }`}
            >
              {sec.label}
            </button>
          ))}
        </div>

        {/* Scrollable Form Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* SECTION 1: Basic Information (matching Image 2 & 3) */}
          <div
            id="sec-basic"
            className="bg-white rounded-xl p-5 border border-gray-200/80 shadow-xs space-y-4"
          >
            <h3 className="text-sm font-bold text-gray-900 border-b pb-2 flex items-center justify-between">
              <span>Basic Information</span>
              <span className="text-xs font-normal text-red-500">* Required fields</span>
            </h3>

            {/* Product Name */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <Label htmlFor="pname" className="text-xs font-semibold text-gray-800">
                  * Product Name
                </Label>
                <span className="text-[11px] text-gray-400">{name.length}/255</span>
              </div>
              <p className="text-[11px] text-gray-500 leading-tight">
                Multiple language title will be showed when buyers change their APPs' default language setting. Setting it up can help improve product recall in Apps targeted at different languages.
              </p>
              <Input
                id="pname"
                value={name}
                maxLength={255}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex. Nikon Coolpix A300 Digital Camera"
                className="text-xs h-10 mt-1"
              />
            </div>

            {/* Category */}
            <div className="space-y-1">
              <Label className="text-xs font-semibold text-gray-800">* Category</Label>
              <Select value={categoryId} onValueChange={setCategoryId}>
                <SelectTrigger className="text-xs h-10 bg-white">
                  <SelectValue placeholder="Select Category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Product Images (Image 2) */}
            <div className="space-y-2 pt-2 border-t border-gray-100">
              {/* Hidden native file input */}
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                accept="image/png,image/jpeg,image/jpg,image/webp,image/gif"
                multiple
                className="hidden"
              />

              <div className="flex items-center justify-between">
                <Label className="text-xs font-semibold text-gray-800 flex items-center gap-1">
                  <span className="text-red-500">*</span> Product Images
                  <Info className="h-3.5 w-3.5 text-gray-400" />
                </Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAddRandomImages}
                  className="text-xs h-7 text-sky-600 border-sky-300 hover:bg-sky-50"
                >
                  <Sparkles className="h-3 w-3 mr-1 text-sky-600" /> Auto-generate Images
                </Button>
              </div>

              {/* Image Tiles Container */}
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3 pt-1">
                {images.map((img, i) => (
                  <div key={i} className="relative aspect-square rounded-lg border border-gray-200 overflow-hidden group">
                    <img src={img} alt="" className="w-full h-full object-cover" />
                    {i === 0 && (
                      <span className="absolute bottom-0 inset-x-0 bg-black/60 text-white text-[10px] text-center py-0.5 font-medium">
                        Cover
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() => handleRemoveImage(i)}
                      className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition shadow cursor-pointer"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                ))}

                {/* Add Image Tile */}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingImages}
                  className="aspect-square rounded-lg border-2 border-dashed border-gray-300 hover:border-sky-500 flex flex-col items-center justify-center text-gray-500 hover:text-sky-600 bg-gray-50/50 hover:bg-sky-50/30 transition cursor-pointer p-2 text-center group disabled:opacity-50"
                >
                  {uploadingImages ? (
                    <>
                      <div className="h-5 w-5 border-2 border-sky-600 border-t-transparent rounded-full animate-spin mb-1" />
                      <span className="text-[10px] font-medium leading-tight text-sky-600">Uploading...</span>
                    </>
                  ) : (
                    <>
                      <Plus className="h-6 w-6 mb-1 text-gray-400 group-hover:text-sky-600 transition" />
                      <span className="text-[10px] font-medium leading-tight group-hover:text-sky-600 transition">
                        Add Image
                      </span>
                    </>
                  )}
                </button>
              </div>

              {/* Paste Image URL Input */}
              <div className="flex gap-2 pt-1">
                <Input
                  value={imageUrlInput}
                  onChange={(e) => setImageUrlInput(e.target.value)}
                  placeholder="Paste direct Image URL (e.g. https://.../image.jpg)"
                  className="text-xs h-8"
                />
                <Button
                  type="button"
                  size="sm"
                  onClick={handleAddImageUrl}
                  variant="outline"
                  className="h-8 text-xs shrink-0"
                >
                  Add URL
                </Button>
              </div>
            </div>

            {/* Buyer Promotion Image / White Background Image (Image 2) */}
            <div className="pt-2 border-t border-gray-100 space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-semibold text-gray-800 flex items-center gap-1">
                  Buyer Promotion Image
                  <Info className="h-3.5 w-3.5 text-gray-400 cursor-pointer" onClick={() => setShowGuidelines(!showGuidelines)} />
                </Label>
                <button
                  type="button"
                  onClick={() => setShowGuidelines(!showGuidelines)}
                  className="text-[11px] text-sky-600 hover:underline"
                >
                  See Example
                </button>
              </div>

              {showGuidelines && (
                <div className="bg-sky-50 border border-sky-200 rounded-lg p-3 text-xs text-sky-900 space-y-1">
                  <p className="font-semibold">Image Guidelines:</p>
                  <ul className="list-disc list-inside space-y-0.5 text-[11px]">
                    <li>1. Size: Less than 6MB</li>
                    <li>2. Supported formats: JPG, JPEG or PNG</li>
                    <li>3. The aspect ratio (W x H) must be 1:1</li>
                    <li>4. Minimum resolution is 330 x 330 pixels (Recommended: 1000 x 1000)</li>
                    <li>5. The background should be plain white</li>
                  </ul>
                </div>
              )}

              <div className="flex gap-2">
                <Input
                  value={whiteBgImage}
                  onChange={(e) => setWhiteBgImage(e.target.value)}
                  placeholder="Optional white-background image URL for mobile promotion"
                  className="text-xs h-8"
                />
              </div>
            </div>

            {/* Video Section (Image 3) */}
            <div className="pt-2 border-t border-gray-100 space-y-2">
              <Label className="text-xs font-semibold text-gray-800 flex items-center gap-1">
                Product Video
                <Info className="h-3.5 w-3.5 text-gray-400" />
              </Label>
              <div className="flex items-center gap-4 text-xs">
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="radio"
                    name="videotype"
                    checked={videoType === 'youtube'}
                    onChange={() => setVideoType('youtube')}
                    className="accent-sky-600"
                  />
                  <span>YouTube Link</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="radio"
                    name="videotype"
                    checked={videoType === 'upload'}
                    onChange={() => setVideoType('upload')}
                    className="accent-sky-600"
                  />
                  <span>Upload Video (MP4)</span>
                </label>
              </div>
              <Input
                value={videoUrl}
                onChange={(e) => setVideoUrl(e.target.value)}
                placeholder="https://www.youtube.com/watch?v=... or direct MP4 link"
                className="text-xs h-8"
              />
              <p className="text-[10px] text-gray-400">
                Min size: 480x480 px. Max video length: 60s. Max file size: 100MB. Supported Format: mp4.
              </p>
            </div>
          </div>

          {/* SECTION 2: Product Specification */}
          <div
            id="sec-spec"
            className="bg-white rounded-xl p-5 border border-gray-200/80 shadow-xs space-y-4"
          >
            <div>
              <h3 className="text-sm font-bold text-gray-900">
                Product Specification
              </h3>
              <p className="text-[11px] text-gray-500 mt-0.5">
                Filling in attributes will increase product searchability, driving sales conversion.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label className="text-xs font-semibold text-gray-800">* Brand</Label>
                <Input
                  value={brand}
                  onChange={(e) => setBrand(e.target.value)}
                  placeholder="e.g. Apple, Samsung, Sony, No Brand"
                  className="text-xs h-9"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold text-gray-800">Model</Label>
                <Input
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  placeholder="e.g. A300, Pro 2026, Series 8"
                  className="text-xs h-9"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold text-gray-800">Main Material</Label>
                <Input
                  value={material}
                  onChange={(e) => setMaterial(e.target.value)}
                  placeholder="e.g. Cotton, Stainless Steel, Aluminum, Silicon"
                  className="text-xs h-9"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold text-gray-800">Recommended Gender</Label>
                <Select value={gender} onValueChange={setGender}>
                  <SelectTrigger className="text-xs h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Unisex">Unisex</SelectItem>
                    <SelectItem value="Men">Men</SelectItem>
                    <SelectItem value="Women">Women</SelectItem>
                    <SelectItem value="Boys">Boys</SelectItem>
                    <SelectItem value="Girls">Girls</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold text-gray-800">Recommended Age</Label>
                <Input
                  value={recommendedAge}
                  onChange={(e) => setRecommendedAge(e.target.value)}
                  placeholder="e.g. All Ages, 3-5 Years, 18+"
                  className="text-xs h-9"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold text-gray-800">Key Features / Trend</Label>
                <Input
                  value={features}
                  onChange={(e) => setFeatures(e.target.value)}
                  placeholder="e.g. Wireless, Fast Charging, Water Resistant"
                  className="text-xs h-9"
                />
              </div>
            </div>
          </div>

          {/* SECTION 3: Price, Stock & Variants (matching Image 4) */}
          <div
            id="sec-price"
            className="bg-white rounded-xl p-5 border border-gray-200/80 shadow-xs space-y-4"
          >
            <div>
              <h3 className="text-sm font-bold text-gray-900">Price, Stock &amp; Variants</h3>
              <p className="text-[11px] text-gray-500 mt-0.5">
                You can add variants to a product that has more than one option, such as size or color.
              </p>
            </div>

            {/* Variant Family Configuration */}
            <div className="bg-gray-50/70 p-3.5 rounded-lg border border-gray-100 space-y-2">
              <Label className="text-xs font-semibold text-gray-800">Variant Name: Color / Style / Size</Label>
              <div className="flex gap-2">
                <Input
                  value={newVariantInput}
                  onChange={(e) => setNewVariantInput(e.target.value)}
                  placeholder="Type variant option (e.g. Black, White, 128GB) and press Add"
                  className="text-xs h-8"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      handleAddVariant()
                    }
                  }}
                />
                <Button type="button" size="sm" onClick={handleAddVariant} className="text-xs h-8 shrink-0">
                  Add Option
                </Button>
              </div>

              {/* Variant Tag Pills */}
              <div className="flex gap-1.5 flex-wrap pt-1">
                {variantOptions.map((opt, i) => (
                  <span
                    key={i}
                    className="bg-white border border-gray-300 text-gray-800 px-2.5 py-0.5 rounded-full text-xs flex items-center gap-1 font-medium shadow-2xs"
                  >
                    <span>{opt}</span>
                    {variantOptions.length > 1 && (
                      <button
                        type="button"
                        onClick={() => setVariantOptions(variantOptions.filter((_, idx) => idx !== i))}
                        className="text-gray-400 hover:text-red-500"
                      >
                        ×
                      </button>
                    )}
                  </span>
                ))}
              </div>
            </div>

            {/* Price & Stock Table (Image 4) */}
            <div className="space-y-2">
              <Label className="text-xs font-semibold text-gray-800">* Price &amp; Stock Table</Label>
              <div className="border border-gray-200 rounded-lg overflow-x-auto bg-white">
                <table className="w-full text-xs text-left">
                  <thead className="bg-gray-50 text-gray-600 font-semibold border-b">
                    <tr>
                      <th className="p-3 whitespace-nowrap">* Price (৳)</th>
                      <th className="p-3 whitespace-nowrap">Special Price (৳)</th>
                      <th className="p-3 whitespace-nowrap">* Stock</th>
                      <th className="p-3 whitespace-nowrap">Seller SKU</th>
                      <th className="p-3 whitespace-nowrap">Free Items</th>
                      <th className="p-3 whitespace-nowrap text-center">Active</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b hover:bg-gray-50/50">
                      <td className="p-2 min-w-[130px]">
                        <div className="relative">
                          <span className="absolute left-2.5 top-2 text-gray-400">৳</span>
                          <Input
                            type="number"
                            value={price}
                            onChange={(e) => setPrice(e.target.value)}
                            placeholder="999"
                            className="pl-7 text-xs h-8"
                          />
                        </div>
                      </td>
                      <td className="p-2 min-w-[130px]">
                        <div className="relative">
                          <span className="absolute left-2.5 top-2 text-gray-400">৳</span>
                          <Input
                            type="number"
                            value={comparePrice}
                            onChange={(e) => setComparePrice(e.target.value)}
                            placeholder="Original price"
                            className="pl-7 text-xs h-8"
                          />
                        </div>
                      </td>
                      <td className="p-2 min-w-[90px]">
                        <Input
                          type="number"
                          value={stock}
                          onChange={(e) => setStock(e.target.value)}
                          placeholder="50"
                          className="text-xs h-8"
                        />
                      </td>
                      <td className="p-2 min-w-[140px]">
                        <Input
                          value={sku}
                          onChange={(e) => setSku(e.target.value)}
                          placeholder="SKU-12345"
                          className="text-xs h-8"
                        />
                      </td>
                      <td className="p-2 min-w-[140px]">
                        <Input
                          value={freeItems}
                          onChange={(e) => setFreeItems(e.target.value)}
                          placeholder="e.g. Free gift pouch"
                          className="text-xs h-8"
                        />
                      </td>
                      <td className="p-2 text-center min-w-[70px]">
                        <Switch
                          checked={isAvailable}
                          onCheckedChange={setIsAvailable}
                          className="data-[state=checked]:bg-sky-600"
                        />
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Campaign Promos (Flash Sale / Featured) */}
            <div className="flex gap-4 pt-1">
              <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-gray-700">
                <input
                  type="checkbox"
                  checked={isFlashSale}
                  onChange={(e) => setIsFlashSale(e.target.checked)}
                  className="rounded text-sky-600 accent-sky-600"
                />
                <span>Join Flash Sale Campaign</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-gray-700">
                <input
                  type="checkbox"
                  checked={isFeatured}
                  onChange={(e) => setIsFeatured(e.target.checked)}
                  className="rounded text-sky-600 accent-sky-600"
                />
                <span>Feature on Homepage</span>
              </label>
            </div>
          </div>

          {/* SECTION 4: Product Description & Highlights (matching Images 5 & 6) */}
          <div
            id="sec-desc"
            className="bg-white rounded-xl p-5 border border-gray-200/80 shadow-xs space-y-4"
          >
            <h3 className="text-sm font-bold text-gray-900 border-b pb-2">Product Description</h3>

            {/* Main Description with formatting toolbar (Image 5) */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-semibold text-gray-800">* Main Description</Label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setPreviewDesc(!previewDesc)}
                    className="text-xs text-sky-600 hover:underline flex items-center gap-1"
                  >
                    <Eye className="h-3 w-3" />
                    {previewDesc ? 'Edit Mode' : 'Preview'}
                  </button>
                </div>
              </div>

              {/* Formatting Toolbar */}
              <div className="border border-gray-200 rounded-lg overflow-hidden bg-white">
                <div className="bg-gray-50 border-b border-gray-200 p-1.5 flex items-center gap-1 flex-wrap text-gray-700">
                  <button
                    type="button"
                    onClick={() => applyFormat('b')}
                    title="Bold"
                    className="p-1 hover:bg-gray-200 rounded text-xs font-bold"
                  >
                    <Bold className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => applyFormat('i')}
                    title="Italic"
                    className="p-1 hover:bg-gray-200 rounded text-xs italic"
                  >
                    <Italic className="h-3.5 w-3.5" />
                  </button>
                  <span className="text-gray-300">|</span>
                  <button
                    type="button"
                    onClick={() => applyFormat('ul')}
                    title="Bullet List"
                    className="p-1 hover:bg-gray-200 rounded text-xs"
                  >
                    <List className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => applyFormat('ol')}
                    title="Numbered List"
                    className="p-1 hover:bg-gray-200 rounded text-xs"
                  >
                    <ListOrdered className="h-3.5 w-3.5" />
                  </button>
                  <span className="text-gray-300">|</span>
                  <button
                    type="button"
                    onClick={() => applyFormat('img')}
                    title="Insert Image"
                    className="p-1 hover:bg-gray-200 rounded text-xs flex items-center gap-1"
                  >
                    <ImageIcon className="h-3.5 w-3.5" />
                  </button>
                </div>

                {previewDesc ? (
                  <div className="p-3 text-xs leading-relaxed min-h-[140px] whitespace-pre-wrap text-gray-800 bg-gray-50/50">
                    {description || 'No description entered yet.'}
                  </div>
                ) : (
                  <Textarea
                    rows={6}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Provide a comprehensive product description including features, specifications, usage, and benefits..."
                    className="border-0 focus-visible:ring-0 text-xs rounded-none"
                  />
                )}
              </div>
            </div>

            {/* Highlights (Image 6) */}
            <div className="space-y-2 pt-2 border-t border-gray-100">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-semibold text-gray-800 flex items-center gap-1">
                  <span className="text-red-500">*</span> Highlights (Key Selling Points)
                </Label>
                <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded text-[10px] font-semibold">
                  English
                </span>
              </div>

              {/* Highlights Builder */}
              <div className="space-y-1.5">
                {highlights.map((h, i) => (
                  <div key={i} className="flex items-center gap-2 bg-gray-50 px-3 py-1.5 rounded-md border text-xs">
                    <span className="text-sky-600 font-bold">•</span>
                    <span className="flex-1 text-gray-800">{h}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveHighlight(i)}
                      className="text-gray-400 hover:text-red-500 cursor-pointer"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                ))}

                <div className="flex gap-2 pt-1">
                  <Input
                    value={highlightInput}
                    onChange={(e) => setHighlightInput(e.target.value)}
                    placeholder="Add bullet highlight (e.g. Battery life up to 30 hours) and click Add"
                    className="text-xs h-8"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        handleAddHighlight()
                      }
                    }}
                  />
                  <Button type="button" size="sm" onClick={handleAddHighlight} className="text-xs h-8 shrink-0 bg-sky-600 hover:bg-sky-700 text-white">
                    Add Highlight
                  </Button>
                </div>
              </div>
            </div>

            {/* What's in the box (Image 6) */}
            <div className="space-y-1 pt-2 border-t border-gray-100">
              <Label className="text-xs font-semibold text-gray-800">What's in the box</Label>
              <Input
                value={whatsInTheBox}
                onChange={(e) => setWhatsInTheBox(e.target.value)}
                placeholder="Ex. 1 x Key Chain, 1 x Gift Pouch"
                className="text-xs h-9"
              />
            </div>
          </div>

          {/* SECTION 5: Shipping & Warranty (matching Image 7) */}
          <div
            id="sec-shipping"
            className="bg-white rounded-xl p-5 border border-gray-200/80 shadow-xs space-y-4"
          >
            <h3 className="text-sm font-bold text-gray-900 border-b pb-2">Shipping &amp; Warranty</h3>

            {/* Package Weight & Dimensions (Image 7) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label className="text-xs font-semibold text-gray-800">* Package Weight (kg)</Label>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    step="0.01"
                    value={packageWeight}
                    onChange={(e) => setPackageWeight(e.target.value)}
                    placeholder="0.25"
                    className="text-xs h-9"
                  />
                  <span className="bg-gray-100 border text-gray-600 px-3 py-1.5 rounded-md text-xs font-semibold flex items-center">
                    kg
                  </span>
                </div>
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold text-gray-800">
                  * Package Length x Width x Height (cm)
                </Label>
                <div className="grid grid-cols-3 gap-2">
                  <Input
                    type="number"
                    value={dimLength}
                    onChange={(e) => setDimLength(e.target.value)}
                    placeholder="L (cm)"
                    className="text-xs h-9"
                  />
                  <Input
                    type="number"
                    value={dimWidth}
                    onChange={(e) => setDimWidth(e.target.value)}
                    placeholder="W (cm)"
                    className="text-xs h-9"
                  />
                  <Input
                    type="number"
                    value={dimHeight}
                    onChange={(e) => setDimHeight(e.target.value)}
                    placeholder="H (cm)"
                    className="text-xs h-9"
                  />
                </div>
              </div>
            </div>

            {/* Dangerous Goods (Image 7) */}
            <div className="space-y-1 pt-1">
              <Label className="text-xs font-semibold text-gray-800">Dangerous Goods</Label>
              <div className="flex items-center gap-4 text-xs">
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="radio"
                    name="dangerous"
                    checked={dangerousGoods === 'none'}
                    onChange={() => setDangerousGoods('none')}
                    className="accent-sky-600"
                  />
                  <span>None</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="radio"
                    name="dangerous"
                    checked={dangerousGoods === 'battery'}
                    onChange={() => setDangerousGoods('battery')}
                    className="accent-sky-600"
                  />
                  <span>Contains battery / flammables / liquid</span>
                </label>
              </div>
            </div>

            {/* Warranty Details (Image 7) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-gray-100">
              <div className="space-y-1">
                <Label className="text-xs font-semibold text-gray-800">Warranty Type</Label>
                <Select value={warrantyType} onValueChange={setWarrantyType}>
                  <SelectTrigger className="text-xs h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Local Seller Warranty">Local Seller Warranty</SelectItem>
                    <SelectItem value="Brand Warranty">Brand Warranty</SelectItem>
                    <SelectItem value="International Seller Warranty">International Seller Warranty</SelectItem>
                    <SelectItem value="No Warranty">No Warranty</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold text-gray-800">Warranty Period</Label>
                <Select value={warrantyPeriod} onValueChange={setWarrantyPeriod}>
                  <SelectTrigger className="text-xs h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1 Month">1 Month</SelectItem>
                    <SelectItem value="3 Months">3 Months</SelectItem>
                    <SelectItem value="6 Months">6 Months</SelectItem>
                    <SelectItem value="1 Year">1 Year</SelectItem>
                    <SelectItem value="2 Years">2 Years</SelectItem>
                    <SelectItem value="Lifetime">Lifetime Warranty</SelectItem>
                    <SelectItem value="No Warranty">No Warranty</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold text-gray-800">Warranty Policy</Label>
                <Input
                  value={warrantyPolicy}
                  onChange={(e) => setWarrantyPolicy(e.target.value)}
                  placeholder="Covers manufacturer defects"
                  className="text-xs h-9"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold text-gray-800">Return Policy</Label>
                <Input
                  value={returnPolicy}
                  onChange={(e) => setReturnPolicy(e.target.value)}
                  placeholder="14 days easy return"
                  className="text-xs h-9"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Sticky Bottom Actions Bar */}
        <div className="bg-white border-t border-gray-200 px-6 py-3.5 flex items-center justify-between shrink-0 shadow-lg">
          <div className="text-xs text-gray-500">
            {images.length > 0 ? (
              <span className="text-sky-600 font-medium">✓ {images.length} image(s) added</span>
            ) : (
              <span className="text-gray-400">Please provide at least 1 image</span>
            )}
          </div>

          <div className="flex items-center gap-3">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="text-xs h-9 px-5"
            >
              Cancel
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleSubmit}
              disabled={saving}
              className="bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold h-9 px-8 shadow-sm"
            >
              {saving ? 'Saving...' : product ? 'Update Product' : 'Save & Publish'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
