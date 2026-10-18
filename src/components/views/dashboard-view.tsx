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
} from 'lucide-react'
import { toast } from 'sonner'
import { formatBDT } from '@/lib/format'
import { useStore as useZustandStore } from '@/lib/store'
import { DarazProductForm } from '@/components/ecommerce/daraz-product-form'

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

  // Site Configuration (Admin only)
  const [bannerTitle, setBannerTitle] = useState('')
  const [bannerTag, setBannerTag] = useState('')
  const [bannerEnabled, setBannerEnabled] = useState(false)
  const [bannerLoading, setBannerLoading] = useState(false)

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
    } catch {}
  }

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

  const handleDeleteBanner = async () => {
    setBannerLoading(true)
    try {
      const res = await fetch('/api/config?key=promo_banner', { method: 'DELETE' })
      if (res.ok) {
        setBannerEnabled(false)
        setBannerTitle('')
        setBannerTag('')
        toast.success('Promotional banner deleted from SiteConfig table')
      }
    } catch {
      toast.error('Failed to delete configuration')
    } finally {
      setBannerLoading(false)
    }
  }

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
      let userCount = 0
      if (user?.role === 'ADMIN') {
        const uRes = await fetch('/api/admin/users')
        const uData = await uRes.json()
        setUsers(uData.users || [])
        userCount = uData.users?.length || 0
      }

      // Compute stats
      const revenue = (oData.orders || []).reduce((s: number, o: any) => s + o.total, 0)
      setStats({
        totalProducts: pData.products?.length || 0,
        totalOrders: oData.orders?.length || 0,
        totalRevenue: revenue,
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
  }, [user])

  if (!user) {
    return (
      <div className="container mx-auto px-3 py-12 text-center">
        <p className="text-gray-500 mb-3">Please login to view your dashboard.</p>
        <Button onClick={() => openAuth('login')} className="bg-sky-600 text-white">Login</Button>
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
            className="bg-sky-600 hover:bg-sky-700 text-white"
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
              <Package className="h-8 w-8 text-sky-500 opacity-50" />
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
              <Store className="h-8 w-8 text-sky-500 opacity-50" />
            </div>
          </Card>
        ) : null}
      </div>

      {/* Tabs */}
      <Tabs defaultValue={user.role === 'CUSTOMER' ? 'orders' : 'products'}>
        <TabsList className={`grid w-full mb-4 ${user.role === 'ADMIN' ? 'grid-cols-4' : user.role === 'RETAILER' ? 'grid-cols-2' : 'grid-cols-1'}`}>
          {user.role !== 'CUSTOMER' && <TabsTrigger value="products">My Products</TabsTrigger>}
          <TabsTrigger value="orders">{user.role === 'CUSTOMER' ? 'My Orders' : user.role === 'ADMIN' ? 'All Orders' : 'Sales'}</TabsTrigger>
          {user.role === 'ADMIN' && <TabsTrigger value="users">Users</TabsTrigger>}
          {user.role === 'ADMIN' && <TabsTrigger value="config">Site Config</TabsTrigger>}
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
                          'bg-sky-100'
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
                      <span className="text-sky-600">{formatBDT(o.total)}</span>
                    </div>
                    {user.role === 'ADMIN' && (
                      <div className="border-t pt-2 mt-2 flex flex-wrap gap-2 items-center">
                        <span className="text-xs text-gray-500">Customer:</span>
                        <span className="text-xs font-semibold">{o.user?.name}</span>
                        <span className="text-xs text-gray-500">({o.user?.phone}{o.user?.email ? `, ${o.user.email}` : ''})</span>
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
                      <TableHead>Phone</TableHead>
                      <TableHead>Verified</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Change Role</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((u) => (
                      <TableRow key={u.id}>
                        <TableCell className="font-medium">{u.name}</TableCell>
                        <TableCell className="text-xs">{u.phone || '—'}</TableCell>
                        <TableCell>
                          {u.phoneVerified ? (
                            <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Verified</Badge>
                          ) : (
                            <Badge variant="secondary">Unverified</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-sm">{u.email || '—'}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="capitalize">{u.role.toLowerCase()}</Badge>
                        </TableCell>
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

        {/* Site Config tab (admin only) */}
        {user.role === 'ADMIN' && (
          <TabsContent value="config">
            <Card className="p-6 space-y-6">
              <div>
                <h2 className="font-bold text-lg text-gray-900 flex items-center gap-2">
                  <Settings className="h-5 w-5 text-sky-600" /> Site Configuration & Banners
                </h2>
                <p className="text-xs text-gray-500 mt-1">
                  Manage database-backed site configurations stored in the SiteConfig table. If a promotional event banner configuration exists and is enabled, it will appear across product detail pages.
                </p>
              </div>

              {/* Promotional Event Banner Card */}
              <div className="border border-gray-200 rounded-xl p-5 bg-gray-50/50 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <h3 className="text-sm font-bold text-gray-800 flex items-center gap-1.5">
                      <Zap className="h-4 w-4 text-sky-600" />
                      Product Detail Promotional Event Banner
                    </h3>
                    <p className="text-xs text-gray-500">
                      Displays a gradient announcement strip directly above product price blocks.
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Label htmlFor="banner-switch" className="text-xs font-semibold text-gray-700">
                      {bannerEnabled ? 'Active' : 'Disabled'}
                    </Label>
                    <Switch
                      id="banner-switch"
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
                {bannerEnabled && bannerTitle.trim() && (
                  <div className="space-y-1 pt-2">
                    <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                      Live Preview:
                    </span>
                    <div className="bg-gradient-to-r from-sky-500 to-cyan-500 text-white px-3 py-2 rounded-lg flex items-center justify-between text-xs font-bold shadow-xs">
                      <div className="flex items-center gap-1.5">
                        <Zap className="h-4 w-4 fill-white text-white" />
                        <span>{bannerTitle}</span>
                      </div>
                      {bannerTag && (
                        <span className="text-[11px] bg-black/20 px-2 py-0.5 rounded font-normal">
                          {bannerTag}
                        </span>
                      )}
                    </div>
                  </div>
                )}

                <div className="flex gap-2 pt-2 justify-end">
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
                    {bannerLoading ? 'Saving...' : 'Save Configuration'}
                  </Button>
                </div>
              </div>
            </Card>
          </TabsContent>
        )}
      </Tabs>

      {/* Product form dialog */}
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
