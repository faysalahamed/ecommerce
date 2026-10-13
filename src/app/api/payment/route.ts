import { NextRequest, NextResponse } from 'next/server'

// Simulated payment gateway — supports bKash, Nagad, Card
// In a real system this would redirect to the provider's hosted checkout.
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { method, amount, reference, customerPhone } = body

    if (!method || !amount) {
      return NextResponse.json({ error: 'method and amount required' }, { status: 400 })
    }

    // Simulate processing delay
    await new Promise((r) => setTimeout(r, 800))

    // Simulate success rate ~ 95%
    const success = Math.random() < 0.95

    if (!success) {
      return NextResponse.json({
        success: false,
        message: 'Payment was declined by the provider. Please try again.',
        ref: null,
      }, { status: 400 })
    }

    const methodName =
      method === 'BKASH' ? 'bKash' :
      method === 'NAGAD' ? 'Nagad' :
      method === 'CARD' ? 'Card' :
      'COD'

    const ref = methodName.toUpperCase() + '-' + Date.now().toString(36).toUpperCase() + '-' + (reference || 'X')

    return NextResponse.json({
      success: true,
      method: methodName,
      amount: parseFloat(amount),
      reference: ref,
      customerPhone: customerPhone || null,
      paidAt: new Date().toISOString(),
      message: `${methodName} payment processed successfully.`,
    })
  } catch (e) {
    console.error('Payment error:', e)
    return NextResponse.json({ error: 'Payment processing failed' }, { status: 500 })
  }
}
