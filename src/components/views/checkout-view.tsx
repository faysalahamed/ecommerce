'use client'

import { useEffect, useState, useMemo } from 'react'
import { useStore, type CartItemFE } from '@/lib/store'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Skeleton } from '@/components/ui/skeleton'
import {
  ChevronLeft,
  Loader2,
  CreditCard,
  Smartphone,
  Banknote,
  Home,
  Store,
  MapPin,
  Clock,
  Phone,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react'
import { formatBDT } from '@/lib/format'
import { toast } from 'sonner'
import {
  type DeliveryChannelType,
  type DeliveryLocation,
  type DeliveryHub,
  calculateDeliveryFee,
  DEFAULT_DELIVERY_LOCATIONS,
  DEFAULT_DELIVERY_HUBS,
} from '@/lib/delivery'

type PaymentMethod = 'COD' | 'BKASH' | 'NAGAD' | 'CARD'

export function CheckoutView() {
  const navigate = useStore((s) => s.navigate)
  const goBack = useStore((s) => s.goBack)
  const refreshCart = useStore((s) => s.refreshCart)
  const cartItems = useStore((s) => s.cartItems)
  const user = useStore((s) => s.user)
  const siteConfig = useStore((s) => s.siteConfig)
  const fetchSiteConfig = useStore((s) => s.fetchSiteConfig)

  const [items, setItems] = useState<CartItemFE[]>(cartItems)
  const [loading, setLoading] = useState(true)
  const [placing, setPlacing] = useState(false)
  const [paying, setPaying] = useState(false)

  const [recipientName, setRecipientName] = useState(user?.name || '')
  const [phone, setPhone] = useState(user?.phone || '')
  const [address, setAddress] = useState(user?.address || '')
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('COD')

  // Delivery Channel & Location State
  const deliveryLocations: DeliveryLocation[] = useMemo(() => {
    return siteConfig?.deliveryLocations && siteConfig.deliveryLocations.length > 0
      ? siteConfig.deliveryLocations.filter((l) => l.active)
      : DEFAULT_DELIVERY_LOCATIONS
  }, [siteConfig])

  const deliveryHubs: DeliveryHub[] = useMemo(() => {
    return siteConfig?.deliveryHubs && siteConfig.deliveryHubs.length > 0
      ? siteConfig.deliveryHubs.filter((h) => h.active)
      : DEFAULT_DELIVERY_HUBS
  }, [siteConfig])

  const [selectedLocationId, setSelectedLocationId] = useState<string>('loc_dhaka_city')
  const [deliveryChannel, setDeliveryChannel] = useState<DeliveryChannelType>('HOME_DELIVERY')
  const [selectedHubId, setSelectedHubId] = useState<string>('hub_banani')

  // Card fields (simulated)
  const [cardNumber, setCardNumber] = useState('')
  const [cardName, setCardName] = useState('')
  const [cardExpiry, setCardExpiry] = useState('')
  const [cardCvc, setCardCvc] = useState('')

  // Mobile wallet (simulated)
  const [walletNumber, setWalletNumber] = useState('')

  useEffect(() => {
    fetchSiteConfig()
    refreshCart().then(() => setLoading(false))
  }, [fetchSiteConfig, refreshCart])

  useEffect(() => {
    setItems(cartItems)
    if (user) {
      setRecipientName(user.name)
      setPhone(user.phone || '')
      setAddress(user.address || '')
    }
  }, [cartItems, user])

  // Get active location and hub objects
  const currentLocation = useMemo(() => {
    return deliveryLocations.find((l) => l.id === selectedLocationId) || deliveryLocations[0]
  }, [deliveryLocations, selectedLocationId])

  // Filter hubs available for selected location/division
  const availableHubs = useMemo(() => {
    if (!currentLocation) return deliveryHubs
    const matched = deliveryHubs.filter(
      (h) =>
        h.locationName.toLowerCase().includes(currentLocation.name.toLowerCase()) ||
        currentLocation.name.toLowerCase().includes(h.locationName.toLowerCase()) ||
        h.division.toLowerCase() === currentLocation.division.toLowerCase()
    )
    return matched.length > 0 ? matched : deliveryHubs
  }, [deliveryHubs, currentLocation])

  const currentHub = useMemo(() => {
    return availableHubs.find((h) => h.id === selectedHubId) || availableHubs[0]
  }, [availableHubs, selectedHubId])

  // Subtotal & Dynamic delivery fee
  const subtotal = items.reduce((s, i) => s + i.product.price * i.quantity, 0)

  const deliveryCalculation = useMemo(() => {
    return calculateDeliveryFee({
      location: currentLocation,
      channel: deliveryChannel,
      subtotal,
      config: siteConfig?.deliveryConfig,
    })
  }, [currentLocation, deliveryChannel, subtotal, siteConfig])

  const shipping = deliveryCalculation.fee
  const total = subtotal + shipping

  const placeOrder = async () => {
    if (!recipientName || !phone) {
      toast.error('Please enter recipient name and phone number')
      return
    }

    if (deliveryChannel === 'HOME_DELIVERY' && !address.trim()) {
      toast.error('Please enter your home delivery address')
      return
    }

    if (deliveryChannel === 'DELIVERY_HUB' && !currentHub) {
      toast.error('Please select a delivery hub for pickup')
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

      // Effective delivery address based on channel
      const finalAddress =
        deliveryChannel === 'DELIVERY_HUB'
          ? `Self-Pickup Hub: ${currentHub?.name} (${currentHub?.address})`
          : address.trim()

      // Create order with delivery channel and location metadata
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: items.map((i) => ({ productId: i.productId, quantity: i.quantity })),
          recipientName,
          phone,
          address: finalAddress,
          paymentMethod,
          deliveryChannel,
          deliveryLocation: currentLocation?.name || 'Dhaka City',
          deliveryHubName: deliveryChannel === 'DELIVERY_HUB' ? currentHub?.name : undefined,
          shipping,
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
    <div className="container mx-auto px-3 py-6 space-y-4 max-w-[1200px]">
      <button onClick={goBack} className="flex items-center gap-1 text-sm text-gray-600 hover:text-sky-600 transition">
        <ChevronLeft className="h-4 w-4" /> Back to Cart
      </button>
      <h1 className="text-2xl font-bold text-gray-900">Checkout</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="md:col-span-2 space-y-4">
          {/* Section 1: Delivery Channel & Location Module */}
          <Card className="p-4 border border-sky-100 shadow-xs">
            <div className="flex items-center justify-between mb-3 border-b pb-2">
              <div className="flex items-center gap-2">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-sky-600 text-white text-xs font-bold">
                  1
                </span>
                <h2 className="font-bold text-gray-900 text-base">Delivery Channel & Location</h2>
              </div>
              <span className="text-xs bg-sky-50 text-sky-700 font-semibold px-2 py-0.5 rounded border border-sky-200">
                Dynamic Location Rates
              </span>
            </div>

            <div className="space-y-4">
              {/* Delivery Location Selector */}
              <div>
                <Label htmlFor="delivery-location" className="text-xs font-semibold text-gray-700">
                  Select Delivery Area / City *
                </Label>
                <div className="relative mt-1">
                  <select
                    id="delivery-location"
                    value={selectedLocationId}
                    onChange={(e) => setSelectedLocationId(e.target.value)}
                    className="w-full text-xs h-10 px-3 bg-white border border-gray-300 rounded-md shadow-2xs focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
                  >
                    {deliveryLocations.map((loc) => (
                      <option key={loc.id} value={loc.id}>
                        {loc.name} — Home: ৳{loc.homeDeliveryCharge} | Hub: ৳{loc.hubDeliveryCharge}
                      </option>
                    ))}
                  </select>
                </div>
                <p className="text-[11px] text-gray-500 mt-1">
                  Delivery charges are automatically determined by your selected location.
                </p>
              </div>

              {/* Delivery Channel Selector (Home Delivery vs Delivery Hub) */}
              <div>
                <Label className="text-xs font-semibold text-gray-700 mb-2 block">
                  Choose Delivery Channel *
                </Label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Option 1: In-House Home Delivery */}
                  <div
                    onClick={() => setDeliveryChannel('HOME_DELIVERY')}
                    className={`cursor-pointer rounded-lg p-3.5 border-2 transition-all relative ${
                      deliveryChannel === 'HOME_DELIVERY'
                        ? 'border-sky-600 bg-sky-50/60 shadow-xs ring-1 ring-sky-600'
                        : 'border-gray-200 hover:border-gray-300 bg-white'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <div className={`p-2 rounded-md ${deliveryChannel === 'HOME_DELIVERY' ? 'bg-sky-600 text-white' : 'bg-gray-100 text-gray-600'}`}>
                          <Home className="h-4 w-4" />
                        </div>
                        <div>
                          <div className="font-bold text-sm text-gray-900">Home Delivery</div>
                          <div className="text-[11px] text-sky-700 font-medium">
                            {currentLocation.inHouseDeliveryAvailable ? 'In-House Express Fleet' : 'Courier Partner'}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-sm font-extrabold text-sky-600">
                          ৳ {currentLocation.homeDeliveryCharge}
                        </span>
                        <div className="text-[10px] text-gray-500">Doorstep</div>
                      </div>
                    </div>
                    <div className="mt-2.5 pt-2 border-t border-gray-200/70 text-[11px] text-gray-600 flex items-center justify-between">
                      <span>Estimated Arrival:</span>
                      <span className="font-semibold text-gray-800">{currentLocation.estimatedDaysHome}</span>
                    </div>
                  </div>

                  {/* Option 2: Delivery Hub / Collection Point */}
                  <div
                    onClick={() => setDeliveryChannel('DELIVERY_HUB')}
                    className={`cursor-pointer rounded-lg p-3.5 border-2 transition-all relative ${
                      deliveryChannel === 'DELIVERY_HUB'
                        ? 'border-sky-600 bg-sky-50/60 shadow-xs ring-1 ring-sky-600'
                        : 'border-gray-200 hover:border-gray-300 bg-white'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <div className={`p-2 rounded-md ${deliveryChannel === 'DELIVERY_HUB' ? 'bg-sky-600 text-white' : 'bg-gray-100 text-gray-600'}`}>
                          <Store className="h-4 w-4" />
                        </div>
                        <div>
                          <div className="font-bold text-sm text-gray-900">Delivery Hub Pickup</div>
                          <div className="text-[11px] text-emerald-700 font-medium">
                            Save ৳{Math.max(0, currentLocation.homeDeliveryCharge - currentLocation.hubDeliveryCharge)}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-sm font-extrabold text-emerald-600">
                          ৳ {currentLocation.hubDeliveryCharge}
                        </span>
                        <div className="text-[10px] text-gray-500">Self Pickup</div>
                      </div>
                    </div>
                    <div className="mt-2.5 pt-2 border-t border-gray-200/70 text-[11px] text-gray-600 flex items-center justify-between">
                      <span>Estimated Arrival:</span>
                      <span className="font-semibold text-gray-800">{currentLocation.estimatedDaysHub}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Conditional Channel Details */}
              {deliveryChannel === 'DELIVERY_HUB' ? (
                <div className="p-3 bg-emerald-50/60 rounded-lg border border-emerald-200 text-xs space-y-2.5 animate-fadeIn">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-emerald-900 flex items-center gap-1.5">
                      <Store className="h-4 w-4 text-emerald-700" />
                      Select Pickup Delivery Hub
                    </span>
                    <span className="text-[11px] text-emerald-700 font-medium">
                      {availableHubs.length} Hub{availableHubs.length > 1 ? 's' : ''} available in your area
                    </span>
                  </div>

                  <select
                    value={selectedHubId}
                    onChange={(e) => setSelectedHubId(e.target.value)}
                    className="w-full text-xs h-9 px-3 bg-white border border-emerald-300 rounded-md font-medium text-gray-800 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  >
                    {availableHubs.map((hub) => (
                      <option key={hub.id} value={hub.id}>
                        {hub.name} ({hub.code}) — {hub.address}
                      </option>
                    ))}
                  </select>

                  {currentHub && (
                    <div className="bg-white p-2.5 rounded border border-emerald-200/80 space-y-1 text-gray-700">
                      <div className="flex items-start gap-1.5">
                        <MapPin className="h-3.5 w-3.5 text-emerald-600 shrink-0 mt-0.5" />
                        <span className="font-medium text-gray-800">{currentHub.address}</span>
                      </div>
                      <div className="flex items-center gap-4 text-[11px] text-gray-600 pt-0.5">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3 text-emerald-600" /> {currentHub.operatingHours}
                        </span>
                        <span className="flex items-center gap-1">
                          <Phone className="h-3 w-3 text-emerald-600" /> {currentHub.phone}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              ) : null}
            </div>
          </Card>

          {/* Section 2: Recipient Information */}
          <Card className="p-4 border border-gray-100 shadow-xs">
            <div className="flex items-center gap-2 mb-3 border-b pb-2">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-sky-600 text-white text-xs font-bold">
                2
              </span>
              <h2 className="font-bold text-gray-900 text-base">Recipient Details</h2>
            </div>
            <div className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="rname" className="text-xs">Recipient Name *</Label>
                  <Input
                    id="rname"
                    value={recipientName}
                    onChange={(e) => setRecipientName(e.target.value)}
                    placeholder="Full recipient name"
                    className="text-xs h-9 mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="phone" className="text-xs">Phone Number *</Label>
                  <Input
                    id="phone"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+8801XXXXXXXXX"
                    className="text-xs h-9 mt-1"
                  />
                </div>
              </div>

              {deliveryChannel === 'HOME_DELIVERY' && (
                <div>
                  <Label htmlFor="addr" className="text-xs">Home / Street Delivery Address *</Label>
                  <Input
                    id="addr"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="House, Road, Area, Landmark"
                    className="text-xs h-9 mt-1"
                  />
                </div>
              )}
            </div>
          </Card>

          {/* Section 3: Payment */}
          <Card className="p-4 border border-gray-100 shadow-xs">
            <div className="flex items-center gap-2 mb-3 border-b pb-2">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-sky-600 text-white text-xs font-bold">
                3
              </span>
              <h2 className="font-bold text-gray-900 text-base">Payment Method</h2>
            </div>
            <RadioGroup value={paymentMethod} onValueChange={(v) => setPaymentMethod(v as PaymentMethod)} className="space-y-2">
              <label className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-sky-50 has-[:checked]:border-sky-500 has-[:checked]:bg-sky-50 transition">
                <RadioGroupItem value="COD" id="cod" />
                <Banknote className="h-5 w-5 text-gray-700" />
                <div>
                  <div className="font-medium text-sm">Cash on Delivery (COD)</div>
                  <div className="text-xs text-gray-500">Pay cash upon package handover</div>
                </div>
              </label>

              <label className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-pink-50 has-[:checked]:border-pink-500 has-[:checked]:bg-pink-50 transition">
                <RadioGroupItem value="BKASH" id="bkash" />
                <Smartphone className="h-5 w-5 text-pink-600" />
                <div>
                  <div className="font-medium text-sm">bKash</div>
                  <div className="text-xs text-gray-500">Mobile wallet payment (Instant)</div>
                </div>
              </label>

              <label className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-sky-50 has-[:checked]:border-sky-500 has-[:checked]:bg-sky-50 transition">
                <RadioGroupItem value="NAGAD" id="nagad" />
                <Smartphone className="h-5 w-5 text-sky-600" />
                <div>
                  <div className="font-medium text-sm">Nagad</div>
                  <div className="text-xs text-gray-500">Mobile wallet payment (Instant)</div>
                </div>
              </label>

              <label className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-blue-50 has-[:checked]:border-blue-500 has-[:checked]:bg-blue-50 transition">
                <RadioGroupItem value="CARD" id="card" />
                <CreditCard className="h-5 w-5 text-blue-600" />
                <div>
                  <div className="font-medium text-sm">Credit / Debit Card</div>
                  <div className="text-xs text-gray-500">Visa, Mastercard, Amex, UnionPay</div>
                </div>
              </label>
            </RadioGroup>

            {/* Payment form fields */}
            {paymentMethod === 'BKASH' || paymentMethod === 'NAGAD' ? (
              <div className="mt-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                <Label htmlFor="wnum" className="text-xs">{paymentMethod === 'BKASH' ? 'bKash' : 'Nagad'} Account Number</Label>
                <Input
                  id="wnum"
                  value={walletNumber}
                  onChange={(e) => setWalletNumber(e.target.value)}
                  placeholder="01XXXXXXXXX"
                  className="text-xs h-9 mt-1"
                />
                <p className="text-[11px] text-gray-500 mt-1">
                  You will receive a confirmation SMS on this number. This is a simulated gateway for testing.
                </p>
              </div>
            ) : null}

            {paymentMethod === 'CARD' ? (
              <div className="mt-3 p-3 bg-gray-50 rounded-lg border border-gray-200 space-y-2">
                <div>
                  <Label htmlFor="cnum" className="text-xs">Card Number</Label>
                  <Input id="cnum" value={cardNumber} onChange={(e) => setCardNumber(e.target.value)} placeholder="4111 1111 1111 1111" className="text-xs h-9 mt-1" />
                </div>
                <div>
                  <Label htmlFor="cname" className="text-xs">Cardholder Name</Label>
                  <Input id="cname" value={cardName} onChange={(e) => setCardName(e.target.value)} placeholder="Name on card" className="text-xs h-9 mt-1" />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label htmlFor="cexp" className="text-xs">Expiry (MM/YY)</Label>
                    <Input id="cexp" value={cardExpiry} onChange={(e) => setCardExpiry(e.target.value)} placeholder="12/27" className="text-xs h-9 mt-1" />
                  </div>
                  <div>
                    <Label htmlFor="ccvc" className="text-xs">CVC</Label>
                    <Input id="ccvc" value={cardCvc} onChange={(e) => setCardCvc(e.target.value)} placeholder="123" maxLength={4} className="text-xs h-9 mt-1" />
                  </div>
                </div>
                <p className="text-[11px] text-gray-500">
                  This is a simulated payment gateway. Test cards work instantly.
                </p>
              </div>
            ) : null}
          </Card>
        </div>

        {/* Order Summary & Pricing Breakdown */}
        <div>
          <Card className="p-4 sticky top-28 border border-gray-100 shadow-sm">
            <h2 className="font-bold text-base text-gray-900 mb-3 border-b pb-2">Order Summary</h2>
            <div className="space-y-2.5 max-h-56 overflow-y-auto text-sm mb-3 pr-1 scrollbar-thin">
              {items.map((i) => (
                <div key={i.id} className="flex gap-2.5 items-start">
                  <img src={i.product.images[0]} alt="" className="w-10 h-10 object-cover rounded-md border shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-gray-800 line-clamp-2 leading-snug">{i.product.name}</p>
                    <p className="text-[11px] text-gray-500 mt-0.5">{formatBDT(i.product.price)} × {i.quantity}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="space-y-2 text-xs border-t pt-2.5 text-gray-700">
              <div className="flex justify-between">
                <span>Items Subtotal</span>
                <span className="font-semibold text-gray-900">{formatBDT(subtotal)}</span>
              </div>

              {/* Delivery Channel Breakdown */}
              <div className="p-2 bg-gray-50 rounded border border-gray-100 space-y-1">
                <div className="flex justify-between items-center text-[11px]">
                  <span className="font-semibold text-gray-800 flex items-center gap-1">
                    {deliveryChannel === 'HOME_DELIVERY' ? <Home className="h-3 w-3 text-sky-600" /> : <Store className="h-3 w-3 text-emerald-600" />}
                    {deliveryCalculation.channelLabel}
                  </span>
                  <span className={shipping === 0 ? 'text-green-600 font-bold' : 'font-bold text-gray-900'}>
                    {shipping === 0 ? 'FREE' : formatBDT(shipping)}
                  </span>
                </div>
                <div className="flex justify-between text-[10px] text-gray-500">
                  <span>Location: {currentLocation.name}</span>
                  <span>Est: {deliveryCalculation.estimatedDays}</span>
                </div>
              </div>

              <div className="border-t pt-2.5 flex justify-between items-baseline font-bold text-sm">
                <span className="text-gray-900">Total Payable</span>
                <span className="text-sky-600 text-base">{formatBDT(total)}</span>
              </div>
            </div>

            <Button
              onClick={placeOrder}
              disabled={placing}
              className="w-full mt-4 bg-sky-600 hover:bg-sky-700 text-white font-bold h-11 text-xs shadow-xs"
            >
              {placing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  {paying ? 'Processing payment...' : 'Confirming order...'}
                </>
              ) : (
                `Place Order • ${formatBDT(total)}`
              )}
            </Button>

            <div className="mt-3 flex items-center justify-center gap-1.5 text-[11px] text-gray-500">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
              <span>Safe &amp; Encrypted Checkout</span>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}

