'use client'

import { useEffect, useState } from 'react'
import { useStore, type CartItemFE } from '@/lib/store'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Trash2, Minus, Plus, ShoppingBag, ChevronLeft } from 'lucide-react'
import { formatBDT } from '@/lib/format'
import { toast } from 'sonner'

export function CartView() {
  const navigate = useStore((s) => s.navigate)
  const goBack = useStore((s) => s.goBack)
  const refreshCart = useStore((s) => s.refreshCart)
  const cartItems = useStore((s) => s.cartItems)
  const [items, setItems] = useState<CartItemFE[]>(cartItems)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    refreshCart().then(() => setLoading(false))
  }, [refreshCart])

  useEffect(() => {
    setItems(cartItems)
  }, [cartItems])

  const updateQty = async (itemId: string, qty: number) => {
    if (qty < 0) return
    setItems((prev) => prev.map((i) => (i.id === itemId ? { ...i, quantity: qty } : i)))
    try {
      const res = await fetch('/api/cart', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemId, quantity: qty }),
      })
      if (res.ok) {
        await refreshCart()
        if (qty === 0) toast.success('Item removed')
      }
    } catch {
      toast.error('Failed to update')
    }
  }

  const removeItem = async (itemId: string) => {
    setItems((prev) => prev.filter((i) => i.id !== itemId))
    try {
      await fetch(`/api/cart?itemId=${itemId}`, { method: 'DELETE' })
      await refreshCart()
      toast.success('Item removed')
    } catch {
      toast.error('Failed to remove')
    }
  }

  const subtotal = items.reduce((s, i) => s + i.product.price * i.quantity, 0)
  const shipping = subtotal >= 1000 || subtotal === 0 ? 0 : 60
  const total = subtotal + shipping

  if (loading) {
    return (
      <div className="container mx-auto px-3 py-6">
        <Skeleton className="h-12 w-1/3 mb-4" />
        <Skeleton className="h-64" />
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div className="container mx-auto px-3 py-12 text-center">
        <ShoppingBag className="h-16 w-16 text-gray-300 mx-auto mb-4" />
        <h2 className="text-xl font-bold mb-2">Your cart is empty</h2>
        <p className="text-gray-500 mb-6">Browse our products and start shopping!</p>
        <Button onClick={() => navigate({ name: 'home' })} className="bg-sky-600 hover:bg-sky-700 text-white">
          Continue Shopping
        </Button>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-3 py-6 space-y-4">
      <button onClick={goBack} className="flex items-center gap-1 text-sm text-gray-600 hover:text-sky-600">
        <ChevronLeft className="h-4 w-4" /> Continue Shopping
      </button>
      <h1 className="text-2xl font-bold">Shopping Cart ({items.length} items)</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Items */}
        <div className="md:col-span-2 space-y-3">
          {items.map((item) => (
            <Card key={item.id} className="p-3 flex gap-3">
              <img
                src={item.product.images[0] || ''}
                alt={item.product.name}
                className="w-20 h-20 sm:w-24 sm:h-24 object-cover rounded shrink-0 cursor-pointer"
                onClick={() => navigate({ name: 'product', productId: item.productId })}
              />
              <div className="flex-1 min-w-0">
                <h3
                  className="text-sm font-medium line-clamp-2 cursor-pointer hover:text-sky-600"
                  onClick={() => navigate({ name: 'product', productId: item.productId })}
                >
                  {item.product.name}
                </h3>
                <p className="text-sky-600 font-bold text-base mt-1">{formatBDT(item.product.price)}</p>
                <div className="flex items-center justify-between mt-2">
                  <div className="flex items-center border rounded">
                    <button
                      onClick={() => updateQty(item.id, item.quantity - 1)}
                      className="px-2 py-0.5 hover:bg-gray-100"
                      aria-label="decrease"
                    >
                      <Minus className="h-3 w-3" />
                    </button>
                    <span className="px-3 text-sm min-w-10 text-center">{item.quantity}</span>
                    <button
                      onClick={() => updateQty(item.id, item.quantity + 1)}
                      className="px-2 py-0.5 hover:bg-gray-100"
                      aria-label="increase"
                    >
                      <Plus className="h-3 w-3" />
                    </button>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeItem(item.id)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Summary */}
        <div>
          <Card className="p-4 sticky top-32">
            <h2 className="font-bold mb-3">Order Summary</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Subtotal</span>
                <span>{formatBDT(subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Shipping</span>
                <span className={shipping === 0 ? 'text-green-600' : ''}>
                  {shipping === 0 ? 'FREE' : formatBDT(shipping)}
                </span>
              </div>
              {subtotal > 0 && subtotal < 1000 && (
                <p className="text-xs text-sky-600 bg-sky-50 p-2 rounded">
                  Add {formatBDT(1000 - subtotal)} more for free shipping!
                </p>
              )}
              <div className="border-t pt-2 flex justify-between font-bold text-base">
                <span>Total</span>
                <span className="text-sky-600">{formatBDT(total)}</span>
              </div>
            </div>
            <Button
              onClick={() => navigate({ name: 'checkout' })}
              className="w-full mt-4 bg-sky-600 hover:bg-sky-700 text-white"
            >
              Proceed to Checkout
            </Button>
          </Card>
        </div>
      </div>
    </div>
  )
}
