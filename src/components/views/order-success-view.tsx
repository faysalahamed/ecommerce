'use client'

import { useEffect, useState } from 'react'
import { useStore } from '@/lib/store'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { CheckCircle2, Package } from 'lucide-react'

export function OrderSuccessView() {
  const view = useStore((s) => s.view)
  const orderId = view.name === 'order-success' ? view.orderId : ''
  const navigate = useStore((s) => s.navigate)
  const [order, setOrder] = useState<any>(null)

  useEffect(() => {
    if (!orderId) return
    fetch('/api/orders')
      .then((r) => r.json())
      .then((d) => {
        const found = (d.orders || []).find((o: any) => o.id === orderId)
        if (found) setOrder(found)
      })
  }, [orderId])

  return (
    <div className="container mx-auto px-3 py-12">
      <div className="max-w-xl mx-auto text-center">
        <CheckCircle2 className="h-20 w-20 text-green-500 mx-auto mb-4" />
        <h1 className="text-2xl font-bold mb-2">Order Placed Successfully!</h1>
        <p className="text-gray-600 mb-6">Thank you for your purchase. We'll send a confirmation to your phone shortly.</p>

        {order && (
          <Card className="p-4 text-left mb-6">
            <div className="flex justify-between mb-3">
              <span className="text-gray-600">Order Number</span>
              <span className="font-mono font-semibold">{order.orderNumber}</span>
            </div>
            <div className="flex justify-between mb-3">
              <span className="text-gray-600">Total Paid</span>
              <span className="font-bold text-sky-600">৳ {Math.round(order.total)}</span>
            </div>
            <div className="flex justify-between mb-3">
              <span className="text-gray-600">Payment Method</span>
              <span>{order.paymentMethod}</span>
            </div>
            <div className="flex justify-between mb-3">
              <span className="text-gray-600">Shipping To</span>
              <span>{order.recipientName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Status</span>
              <span className="text-sky-600 font-semibold">{order.status}</span>
            </div>
          </Card>
        )}

        <div className="flex gap-3 justify-center">
          <Button onClick={() => navigate({ name: 'dashboard' })} variant="outline">
            <Package className="h-4 w-4 mr-2" /> View My Orders
          </Button>
          <Button onClick={() => navigate({ name: 'home' })} className="bg-sky-600 hover:bg-sky-700 text-white">
            Continue Shopping
          </Button>
        </div>
      </div>
    </div>
  )
}
