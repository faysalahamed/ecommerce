'use client'

import { useEffect, useState } from 'react'
import { useStore, type CartItemFE } from '@/lib/store'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Skeleton } from '@/components/ui/skeleton'
import { ChevronLeft, Loader2, CreditCard, Smartphone, Banknote } from 'lucide-react'
import { formatBDT } from '@/lib/format'
import { toast } from 'sonner'

type PaymentMethod = 'COD' | 'BKASH' | 'NAGAD' | 'CARD'

export function CheckoutView() {
  const navigate = useStore((s) => s.navigate)
  const goBack = useStore((s) => s.goBack)
  const refreshCart = useStore((s) => s.refreshCart)
  const cartItems = useStore((s) => s.cartItems)
  const user = useStore((s) => s.user)

  const [items, setItems] = useState<CartItemFE[]>(cartItems)
  const [loading, setLoading] = useState(true)
  const [placing, setPlacing] = useState(false)
  const [paying, setPaying] = useState(false)

  const [recipientName, setRecipientName] = useState(user?.name || '')
  const [phone, setPhone] = useState(user?.phone || '')
  const [address, setAddress] = useState(user?.address || '')
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('COD')

  // Card fields (simulated)
  const [cardNumber, setCardNumber] = useState('')
  const [cardName, setCardName] = useState('')
  const [cardExpiry, setCardExpiry] = useState('')
  const [cardCvc, setCardCvc] = useState('')

  // Mobile wallet (simulated)
  const [walletNumber, setWalletNumber] = useState('')

  useEffect(() => {
    refreshCart().then(() => setLoading(false))
  }, [refreshCart])

  useEffect(() => {
    setItems(cartItems)
    if (user) {
      setRecipientName(user.name)
      setPhone(user.phone || '')
      setAddress(user.address || '')
    }
  }, [cartItems, user])

  const subtotal = items.reduce((s, i) => s + i.product.price * i.quantity, 0)
  const shipping = subtotal >= 1000 || subtotal === 0 ? 0 : 60
  const total = subtotal + shipping

  const placeOrder = async () => {
    if (!recipientName || !phone || !address) {
      toast.error('Please fill all shipping details')
      return
    }
    if (items.length === 0) {
      toast.error('Cart is empty')
      return
    }

    // Validate payment fields
    if (paymentMethod === 'CARD') {
      if (!cardNumber || !cardName || !cardExpiry || !cardCvc) {
        toast.error('Please fill all card details')
        return
      }
    } else if (paymentMethod === 'BKASH' || paymentMethod === 'NAGAD') {
      if (!walletNumber) {
        toast.error(`Please enter your ${paymentMethod.toLowerCase()} wallet number`)
        return
      }
    }

    setPlacing(true)

    try {
      // Simulate payment processing for non-COD methods
      if (paymentMethod !== 'COD') {
        setPaying(true)
        const payRes = await fetch('/api/payment', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            method: paymentMethod,
            amount: total,
            customerPhone: walletNumber || phone,
            reference: 'checkout',
          }),
        })
        const payData = await payRes.json()
        setPaying(false)

        if (!payRes.ok || !payData.success) {
          toast.error(payData.message || 'Payment failed')
          setPlacing(false)
          return
        }
      }

      // Create order
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: items.map((i) => ({ productId: i.productId, quantity: i.quantity })),
          recipientName,
          phone,
          address,
          paymentMethod,
        }),
      })

      if (!res.ok) {
        const d = await res.json()
        toast.error(d.error || 'Failed to place order')
        setPlacing(false)
        return
      }

      const data = await res.json()
      toast.success('Order placed successfully!')
      await refreshCart()
      navigate({ name: 'order-success', orderId: data.order.id })
    } catch (e) {
      console.error(e)
      toast.error('Failed to place order')
    } finally {
      setPlacing(false)
      setPaying(false)
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto px-3 py-6">
        <Skeleton className="h-12 w-1/3 mb-4" />
        <Skeleton className="h-96" />
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div className="container mx-auto px-3 py-12 text-center">
        <h2 className="text-xl font-bold mb-2">Your cart is empty</h2>
        <Button onClick={() => navigate({ name: 'home' })} className="bg-sky-600 text-white">
          Continue Shopping
        </Button>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-3 py-6 space-y-4">
      <button onClick={goBack} className="flex items-center gap-1 text-sm text-gray-600 hover:text-sky-600">
        <ChevronLeft className="h-4 w-4" /> Back to Cart
      </button>
      <h1 className="text-2xl font-bold">Checkout</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-2 space-y-4">
          {/* Shipping info */}
          <Card className="p-4">
            <h2 className="font-bold mb-3">Shipping Details</h2>
            <div className="space-y-3">
              <div>
                <Label htmlFor="rname">Recipient Name *</Label>
                <Input id="rname" value={recipientName} onChange={(e) => setRecipientName(e.target.value)} placeholder="Full name" />
              </div>
              <div>
                <Label htmlFor="phone">Phone *</Label>
                <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+8801XXXXXXXXX" />
              </div>
              <div>
                <Label htmlFor="addr">Address *</Label>
                <Input id="addr" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Full delivery address" />
              </div>
            </div>
          </Card>

          {/* Payment */}
          <Card className="p-4">
            <h2 className="font-bold mb-3">Payment Method</h2>
            <RadioGroup value={paymentMethod} onValueChange={(v) => setPaymentMethod(v as PaymentMethod)} className="space-y-2">
              <label className="flex items-center gap-3 p-3 border rounded cursor-pointer hover:bg-sky-50 has-[:checked]:border-sky-500 has-[:checked]:bg-sky-50">
                <RadioGroupItem value="COD" id="cod" />
                <Banknote className="h-5 w-5 text-gray-700" />
                <div>
                  <div className="font-medium text-sm">Cash on Delivery</div>
                  <div className="text-xs text-gray-500">Pay when you receive your order</div>
                </div>
              </label>

              <label className="flex items-center gap-3 p-3 border rounded cursor-pointer hover:bg-pink-50 has-[:checked]:border-pink-500 has-[:checked]:bg-pink-50">
                <RadioGroupItem value="BKASH" id="bkash" />
                <Smartphone className="h-5 w-5 text-pink-600" />
                <div>
                  <div className="font-medium text-sm">bKash</div>
                  <div className="text-xs text-gray-500">Mobile wallet payment</div>
                </div>
              </label>

              <label className="flex items-center gap-3 p-3 border rounded cursor-pointer hover:bg-sky-50 has-[:checked]:border-sky-500 has-[:checked]:bg-sky-50">
                <RadioGroupItem value="NAGAD" id="nagad" />
                <Smartphone className="h-5 w-5 text-sky-600" />
                <div>
                  <div className="font-medium text-sm">Nagad</div>
                  <div className="text-xs text-gray-500">Mobile wallet payment</div>
                </div>
              </label>

              <label className="flex items-center gap-3 p-3 border rounded cursor-pointer hover:bg-blue-50 has-[:checked]:border-blue-500 has-[:checked]:bg-blue-50">
                <RadioGroupItem value="CARD" id="card" />
                <CreditCard className="h-5 w-5 text-blue-600" />
                <div>
                  <div className="font-medium text-sm">Credit / Debit Card</div>
                  <div className="text-xs text-gray-500">Visa, Mastercard, Amex</div>
                </div>
              </label>
            </RadioGroup>

            {/* Payment form fields */}
            {paymentMethod === 'BKASH' || paymentMethod === 'NAGAD' ? (
              <div className="mt-3 p-3 bg-gray-50 rounded">
                <Label htmlFor="wnum">{paymentMethod === 'BKASH' ? 'bKash' : 'Nagad'} Account Number</Label>
                <Input
                  id="wnum"
                  value={walletNumber}
                  onChange={(e) => setWalletNumber(e.target.value)}
                  placeholder="01XXXXXXXXX"
                />
                <p className="text-xs text-gray-500 mt-1">
                  You will receive a confirmation SMS on this number. This is a simulated gateway — no real money will be charged.
                </p>
              </div>
            ) : null}

            {paymentMethod === 'CARD' ? (
              <div className="mt-3 p-3 bg-gray-50 rounded space-y-2">
                <div>
                  <Label htmlFor="cnum">Card Number</Label>
                  <Input id="cnum" value={cardNumber} onChange={(e) => setCardNumber(e.target.value)} placeholder="4111 1111 1111 1111" />
                </div>
                <div>
                  <Label htmlFor="cname">Cardholder Name</Label>
                  <Input id="cname" value={cardName} onChange={(e) => setCardName(e.target.value)} placeholder="Name on card" />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label htmlFor="cexp">Expiry (MM/YY)</Label>
                    <Input id="cexp" value={cardExpiry} onChange={(e) => setCardExpiry(e.target.value)} placeholder="12/27" />
                  </div>
                  <div>
                    <Label htmlFor="ccvc">CVC</Label>
                    <Input id="ccvc" value={cardCvc} onChange={(e) => setCardCvc(e.target.value)} placeholder="123" maxLength={4} />
                  </div>
                </div>
                <p className="text-xs text-gray-500">
                  This is a simulated payment gateway for demo. Use any test card number.
                </p>
              </div>
            ) : null}
          </Card>
        </div>

        {/* Summary */}
        <div>
          <Card className="p-4 sticky top-32">
            <h2 className="font-bold mb-3">Order Summary</h2>
            <div className="space-y-2 max-h-60 overflow-y-auto text-sm mb-3">
              {items.map((i) => (
                <div key={i.id} className="flex gap-2 items-start">
                  <img src={i.product.images[0]} alt="" className="w-10 h-10 object-cover rounded shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs line-clamp-2">{i.product.name}</p>
                    <p className="text-xs text-gray-500">{formatBDT(i.product.price)} × {i.quantity}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="space-y-2 text-sm border-t pt-2">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>{formatBDT(subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span>Shipping</span>
                <span className={shipping === 0 ? 'text-green-600' : ''}>{shipping === 0 ? 'FREE' : formatBDT(shipping)}</span>
              </div>
              <div className="border-t pt-2 flex justify-between font-bold">
                <span>Total</span>
                <span className="text-sky-600">{formatBDT(total)}</span>
              </div>
            </div>
            <Button
              onClick={placeOrder}
              disabled={placing}
              className="w-full mt-4 bg-sky-600 hover:bg-sky-700 text-white"
            >
              {placing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  {paying ? 'Processing payment...' : 'Placing order...'}
                </>
              ) : (
                `Place Order • ${formatBDT(total)}`
              )}
            </Button>
          </Card>
        </div>
      </div>
    </div>
  )
}
