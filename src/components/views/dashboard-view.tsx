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
  DialogTrigger,
} from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
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
} from 'lucide-react'
import { toast } from 'sonner'
import { formatBDT } from '@/lib/format'
import { useStore as useZustandStore } from '@/lib/store'

export function DashboardView({ categories }: { categories: { id: string; name: string }[] }) {
  const user = useZustandStore((s) => s.user)
  const navigate = useStore((s) => s.navigate)
  const openAuth = useStore((s) => s.openAuth)
  const refreshCart = useStore((s) => s.refreshCart)

  // Stats
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalOrders: 0,
    totalRevenue: 0,
    totalUsers: 0,
  })

  // Products (admin: all, retailer: own only)
  const [products, setProducts] = useState<any[]>([])
  const [orders, setOrders] = useState<any[]>([])
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  // Product form
  const [editingProduct, setEditingProduct] = useState<any | null>(null)
  const [formOpen, setFormOpen] = useState(false)

  const fetchAll = async () => {
    setLoading(true)
    try {
      // Products
      let productsUrl = '/api/products?limit=100'
      if (user?.role === 'RETAILER') {
        productsUrl += `&retailerId=${user.id}`
      } else if (user?.role === 'ADMIN') {
        // For admin: fetch all products regardless of retailer (need a flag)
        // Currently /api/products returns only status=ACTIVE; admin needs all
        productsUrl = '/api/products?limit=100' // admin will see only active + can use product form for inactive
      }
      const pRes = await fetch(productsUrl)
      const pData = await pRes.json()
      setProducts(pData.products || [])

      // Orders
      const oRes = await fetch('/api/orders')
      const oData = await oRes.json()
      setOrders(oData.orders || [])

      // Users (admin only)
      if (user?.role === 'ADMIN') {
        const uRes = await fetch('/api/admin/users')
        const uData = await uRes.json()
        setUsers(uData.users || [])
      }

      // Compute stats
      const revenue = (oData.orders || []).reduce((s: number, o: any) => s + o.total, 0)
      setStats({
        totalProducts: pData.products?.length || 0,
        totalOrders: oData.orders?.length || 0,
        totalRevenue: revenue,
        totalUsers: uData.users?.length || 0,
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
  }, [user])

  if (!user) {
    return (
      <div className="container mx-auto px-3 py-12 text-center">
        <p className="text-gray-500 mb-3">Please login to view your dashboard.</p>
        <Button onClick={() => openAuth('login')} className="bg-orange-600 text-white">Login</Button>
      </div>
    )
  }

  // Role-based render
  return (
    <div className="container mx-auto px-3 py-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">{user.role === 'ADMIN' ? 'Admin' : user.role === 'RETAILER' ? 'Seller' : 'My'} Dashboard</h1>
          <p className="text-sm text-gray-500">Welcome, {user.name}</p>
        </div>
        {user.role !== 'CUSTOMER' && (
          <Button
            onClick={() => { setEditingProduct(null); setFormOpen(true) }}
            className="bg-orange-600 hover:bg-orange-700 text-white"
          >
            <Plus className="h-4 w-4 mr-1" /> Add Product
          </Button>
        )}
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {user.role !== 'CUSTOMER' && (
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500">Total Products</p>
                <p className="text-2xl font-bold">{stats.totalProducts}</p>
              </div>
              <Package className="h-8 w-8 text-orange-500 opacity-50" />
            </div>
          </Card>
        )}

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500">Total Orders</p>
              <p className="text-2xl font-bold">{stats.totalOrders}</p>
            </div>
            <ShoppingCart className="h-8 w-8 text-blue-500 opacity-50" />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500">{user.role === 'CUSTOMER' ? 'Total Spent' : 'Revenue'}</p>
              <p className="text-2xl font-bold">{formatBDT(stats.totalRevenue)}</p>
            </div>
            <DollarSign className="h-8 w-8 text-green-500 opacity-50" />
          </div>
        </Card>

        {user.role === 'ADMIN' ? (
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500">Total Users</p>
                <p className="text-2xl font-bold">{stats.totalUsers}</p>
              </div>
              <Users className="h-8 w-8 text-purple-500 opacity-50" />
            </div>
          </Card>
        ) : user.role === 'RETAILER' ? (
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500">Store</p>
                <p className="text-lg font-bold truncate">{user.storeName || user.name}</p>
              </div>
              <Store className="h-8 w-8 text-orange-500 opacity-50" />
            </div>
          </Card>
        ) : null}
      </div>

      {/* Tabs */}
      <Tabs defaultValue={user.role === 'CUSTOMER' ? 'orders' : 'products'}>
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-3 mb-4">
          {user.role !== 'CUSTOMER' && <TabsTrigger value="products">My Products</TabsTrigger>}
          <TabsTrigger value="orders">{user.role === 'CUSTOMER' ? 'My Orders' : user.role === 'ADMIN' ? 'All Orders' : 'Sales'}</TabsTrigger>
          {user.role === 'ADMIN' && <TabsTrigger value="users">Users</TabsTrigger>}
        </TabsList>

        {/* Products tab */}
        {user.role !== 'CUSTOMER' && (
          <TabsContent value="products">
            <Card className="p-4">
              <div className="flex justify-between items-center mb-4">
                <h2 className="font-bold">Products ({products.length})</h2>
              </div>
              {loading ? (
                <p className="text-gray-500 text-sm">Loading...</p>
              ) : products.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <p>No products yet. Click "Add Product" to create your first one.</p>
                </div>
              ) : (
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
                            <div className="flex gap-2 items-center">
                              <img src={p.images[0]} alt="" className="w-10 h-10 object-cover rounded" />
                              <span className="line-clamp-2 max-w-xs">{p.name}</span>
                            </div>
                          </TableCell>
                          <TableCell>{formatBDT(p.price)}</TableCell>
                          <TableCell>{p.stock}</TableCell>
                          <TableCell>{p.soldCount}</TableCell>
                          <TableCell>
                            <Badge variant={p.status === 'ACTIVE' ? 'default' : 'secondary'}>
                              {p.status}
                            </Badge>
                            {p.isFlashSale && <Badge className="ml-1 bg-red-500">Flash</Badge>}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex gap-1 justify-end">
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => { setEditingProduct(p); setFormOpen(true) }}
                                aria-label="edit"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={async () => {
                                  if (!confirm('Delete this product?')) return
                                  const r = await fetch(`/api/products/${p.id}`, { method: 'DELETE' })
                                  if (r.ok) {
                                    toast.success('Deleted')
                                    fetchAll()
                                  }
                                }}
                                className="text-red-500"
                                aria-label="delete"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </Card>
          </TabsContent>
        )}

        {/* Orders tab */}
        <TabsContent value="orders">
          <Card className="p-4">
            <h2 className="font-bold mb-4">
              {user.role === 'CUSTOMER' ? 'My Orders' : user.role === 'ADMIN' ? 'All Orders' : 'My Sales'} ({orders.length})
            </h2>
            {loading ? (
              <p className="text-gray-500 text-sm">Loading...</p>
            ) : orders.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p>No orders yet.</p>
                {user.role === 'CUSTOMER' && (
                  <Button variant="link" onClick={() => navigate({ name: 'home' })}>Start shopping →</Button>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                {orders.map((o) => (
                  <Card key={o.id} className="p-3">
                    <div className="flex flex-wrap justify-between items-start gap-2 mb-2">
                      <div>
                        <p className="font-mono text-sm font-semibold">{o.orderNumber}</p>
                        <p className="text-xs text-gray-500">
                          {new Date(o.createdAt).toLocaleString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                      <div className="flex gap-2 flex-wrap">
                        <Badge variant="outline" className={
                          o.status === 'DELIVERED' ? 'bg-green-100' :
                          o.status === 'SHIPPED' ? 'bg-blue-100' :
                          o.status === 'CANCELLED' ? 'bg-red-100' :
                          'bg-orange-100'
                        }>
                          {o.status}
                        </Badge>
                        <Badge variant="outline" className={o.paymentStatus === 'PAID' ? 'bg-green-100' : 'bg-yellow-100'}>
                          {o.paymentStatus}
                        </Badge>
                        <Badge variant="outline">{o.paymentMethod}</Badge>
                      </div>
                    </div>
                    <div className="space-y-1 text-sm border-t pt-2">
                      {o.items.map((it: any) => (
                        <div key={it.id} className="flex justify-between">
                          <span className="flex gap-2 items-center">
                            <img src={it.image} alt="" className="w-8 h-8 object-cover rounded" />
                            <span className="line-clamp-1 max-w-xs">{it.name} × {it.quantity}</span>
                          </span>
                          <span>{formatBDT(it.price * it.quantity)}</span>
                        </div>
                      ))}
                    </div>
                    <div className="border-t pt-2 mt-2 flex justify-between font-bold text-sm">
                      <span>Total</span>
                      <span className="text-orange-600">{formatBDT(o.total)}</span>
                    </div>
                    {user.role === 'ADMIN' && (
                      <div className="border-t pt-2 mt-2 flex flex-wrap gap-2 items-center">
                        <span className="text-xs text-gray-500">Customer:</span>
                        <span className="text-xs font-semibold">{o.user?.name} ({o.user?.email})</span>
                        <span className="text-xs text-gray-500">→ {o.recipientName}, {o.phone}, {o.address}</span>
                      </div>
                    )}
                    {user.role === 'ADMIN' && (
                      <div className="mt-3 flex gap-2 flex-wrap">
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
        </TabsContent>

        {/* Users tab (admin only) */}
        {user.role === 'ADMIN' && (
          <TabsContent value="users">
            <Card className="p-4">
              <h2 className="font-bold mb-4">All Users ({users.length})</h2>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Change Role</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((u) => (
                      <TableRow key={u.id}>
                        <TableCell className="font-medium">{u.name}</TableCell>
                        <TableCell className="text-sm">{u.email}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="capitalize">{u.role.toLowerCase()}</Badge>
                        </TableCell>
                        <TableCell className="text-xs">{u.phone || '—'}</TableCell>
                        <TableCell className="text-xs">{new Date(u.createdAt).toLocaleDateString()}</TableCell>
                        <TableCell>
                          <Select
                            defaultValue={u.role}
                            onValueChange={async (v) => {
                              await fetch('/api/admin/users', {
                                method: 'PUT',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ userId: u.id, role: v }),
                              })
                              toast.success('Role updated')
                              fetchAll()
                            }}
                          >
                            <SelectTrigger className="w-32 h-8 text-xs">
                              <SelectValue placeholder="Role" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="ADMIN">Admin</SelectItem>
                              <SelectItem value="RETAILER">Retailer</SelectItem>
                              <SelectItem value="CUSTOMER">Customer</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </Card>
          </TabsContent>
        )}
      </Tabs>

      {/* Product form dialog */}
      <ProductFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        product={editingProduct}
        categories={categories}
        onSuccess={fetchAll}
      />
    </div>
  )
}

// Product form dialog
function ProductFormDialog({
  open,
  onOpenChange,
  product,
  categories,
  onSuccess,
}: {
  open: boolean
  onOpenChange: (b: boolean) => void
  product: any | null
  categories: { id: string; name: string }[]
  onSuccess: () => void
}) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [price, setPrice] = useState('')
  const [comparePrice, setComparePrice] = useState('')
  const [stock, setStock] = useState('')
  const [brand, setBrand] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [images, setImages] = useState<string[]>([])
  const [imageUrl, setImageUrl] = useState('')
  const [isFlashSale, setIsFlashSale] = useState(false)
  const [isFeatured, setIsFeatured] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (product) {
      setName(product.name)
      setDescription(product.description)
      setPrice(String(product.price))
      setComparePrice(product.comparePrice ? String(product.comparePrice) : '')
      setStock(String(product.stock))
      setBrand(product.brand || '')
      setCategoryId(product.categoryId)
      setImages(product.images || [])
      setIsFlashSale(!!product.isFlashSale)
      setIsFeatured(!!product.isFeatured)
    } else {
      // defaults
      setName('')
      setDescription('')
      setPrice('')
      setComparePrice('')
      setStock('')
      setBrand('')
      setCategoryId(categories[0]?.id || '')
      setImages([])
      setImageUrl('')
      setIsFlashSale(false)
      setIsFeatured(false)
    }
  }, [product, categories, open])

  const addImage = () => {
    if (imageUrl && !images.includes(imageUrl)) {
      setImages([...images, imageUrl])
      setImageUrl('')
    }
  }

  const removeImage = (idx: number) => {
    setImages(images.filter((_, i) => i !== idx))
  }

  const submit = async () => {
    if (!name || !description || !price || !categoryId) {
      toast.error('Please fill all required fields')
      return
    }
    if (images.length === 0) {
      // auto-generate placeholder
      const placeholder = `https://picsum.photos/seed/${name.replace(/\s/g, '')}/600/600`
      setImages([placeholder])
    }
    setSaving(true)
    try {
      const url = product ? `/api/products/${product.id}` : '/api/products'
      const method = product ? 'PUT' : 'POST'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          description,
          price,
          comparePrice: comparePrice || null,
          stock: stock || 0,
          brand: brand || null,
          categoryId,
          images,
          isFlashSale,
          isFeatured,
        }),
      })
      if (!res.ok) {
        const d = await res.json()
        toast.error(d.error || 'Failed')
        return
      }
      toast.success(product ? 'Product updated' : 'Product created')
      onOpenChange(false)
      onSuccess()
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{product ? 'Edit Product' : 'Add New Product'}</DialogTitle>
        </DialogHeader>

        <div className="space-y-3 mt-2">
          <div>
            <Label htmlFor="pname">Product Name *</Label>
            <Input id="pname" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Wireless Headphones" />
          </div>
          <div>
            <Label htmlFor="pdesc">Description *</Label>
            <Textarea id="pdesc" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Detailed product description" rows={4} />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label htmlFor="pprice">Price (৳) *</Label>
              <Input id="pprice" type="number" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="999" />
            </div>
            <div>
              <Label htmlFor="pcprice">Compare at Price (৳)</Label>
              <Input id="pcprice" type="number" value={comparePrice} onChange={(e) => setComparePrice(e.target.value)} placeholder="1299" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label htmlFor="pstock">Stock</Label>
              <Input id="pstock" type="number" value={stock} onChange={(e) => setStock(e.target.value)} placeholder="50" />
            </div>
            <div>
              <Label htmlFor="pbrand">Brand</Label>
              <Input id="pbrand" value={brand} onChange={(e) => setBrand(e.target.value)} placeholder="Brand name" />
            </div>
          </div>
          <div>
            <Label htmlFor="pcat">Category *</Label>
            <Select value={categoryId} onValueChange={setCategoryId}>
              <SelectTrigger id="pcat">
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Images */}
          <div>
            <Label>Product Images</Label>
            <div className="flex gap-2 mt-1">
              <Input
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="Paste image URL or generate random"
              />
              <Button type="button" size="sm" onClick={addImage} variant="outline">Add</Button>
              <Button
                type="button"
                size="sm"
                onClick={() => {
                  const seed = Math.random().toString(36).slice(2, 8)
                  setImages([...images, `https://picsum.photos/seed/${seed}/600/600`])
                }}
                variant="secondary"
              >
                Random
              </Button>
            </div>
            <div className="grid grid-cols-4 gap-2 mt-2">
              {images.map((img, i) => (
                <div key={i} className="relative aspect-square group">
                  <img src={img} alt="" className="w-full h-full object-cover rounded border" />
                  <button
                    onClick={() => removeImage(i)}
                    className="absolute top-0.5 right-0.5 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100"
                    aria-label="remove"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
            {images.length === 0 && (
              <p className="text-xs text-gray-500 mt-1">Add at least one image, or click "Random" to auto-generate.</p>
            )}
          </div>

          {/* Flags */}
          <div className="flex gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={isFlashSale}
                onChange={(e) => setIsFlashSale(e.target.checked)}
                className="rounded"
              />
              <span className="text-sm">Flash Sale</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={isFeatured}
                onChange={(e) => setIsFeatured(e.target.checked)}
                className="rounded"
              />
              <span className="text-sm">Featured</span>
            </label>
          </div>

          <div className="flex gap-2 pt-2">
            <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1">Cancel</Button>
            <Button onClick={submit} disabled={saving} className="flex-1 bg-orange-600 hover:bg-orange-700 text-white">
              {saving ? 'Saving...' : product ? 'Update Product' : 'Add Product'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
