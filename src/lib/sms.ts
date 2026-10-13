/**
 * SMS Provider Abstraction
 * -------------------------
 * Supports multiple SMS gateways with a unified interface.
 * Configure via env vars in .env:
 *
 *   SMS_PROVIDER=demo       (default; no real SMS; OTP returned in API response & toast)
 *   SMS_PROVIDER=twilio     (international)
 *   SMS_PROVIDER=vonage     (international)
 *   SMS_PROVIDER=sslcompuz  (Bangladesh bulk SMS)
 *   SMS_PROVIDER=reve       (Bangladesh)
 *   SMS_PROVIDER=metech     (Bangladesh)
 *
 * To add a new provider:
 *   1. Add a case in sendSms() below.
 *   2. Add the corresponding env vars to .env and .env.example.
 */

export interface SendSmsResult {
  ok: boolean
  error?: string
  providerMessageId?: string
}

/**
 * Send an SMS message via the configured provider.
 *
 * @param to  Phone number. Accepts local (01XXXXXXXXX) or international (+8801XXXXXXXXX) format.
 *            Most providers normalize internally.
 * @param text  SMS body. Keep under 160 chars for a single-segment SMS.
 */
export async function sendSms(to: string, text: string): Promise<SendSmsResult> {
  const provider = (process.env.SMS_PROVIDER || 'demo').toLowerCase()

  switch (provider) {
    case 'demo':
      // Demo mode: log the SMS instead of actually sending it.
      // The OTP is also returned in the API response so the frontend can show it via toast.
      console.log(`[SMS:demo] To: ${to} | Body: ${text}`)
      return { ok: true, providerMessageId: 'demo-' + Date.now() }

    case 'twilio':
      return sendViaTwilio(to, text)

    case 'vonage':
      return sendViaVonage(to, text)

    case 'sslcompuz':
      return sendViaSslCompuz(to, text)

    case 'reve':
      return sendViaReve(to, text)

    case 'metech':
      return sendViaMetech(to, text)

    default:
      console.error(`Unknown SMS_PROVIDER: ${provider}. Falling back to demo mode.`)
      console.log(`[SMS:fallback] To: ${to} | Body: ${text}`)
      return { ok: true, providerMessageId: 'fallback-' + Date.now() }
  }
}

// ---------------------------------------------------------------------------
// Twilio (international, easy to set up, good for testing globally)
// Docs: https://www.twilio.com/docs/sms
// Env vars: TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_FROM
// ---------------------------------------------------------------------------
async function sendViaTwilio(to: string, text: string): Promise<SendSmsResult> {
  const sid = process.env.TWILIO_ACCOUNT_SID
  const token = process.env.TWILIO_AUTH_TOKEN
  const from = process.env.TWILIO_PHONE_FROM
  if (!sid || !token || !from) {
    return { ok: false, error: 'Twilio env vars not configured (TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_FROM)' }
  }

  // Normalize phone to E.164 (add +880 for Bangladesh local numbers without +)
  const toE164 = normalizeToE164(to)

  const url = `https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`
  const body = new URLSearchParams({ From: from, To: toE164, Body: text })
  const auth = Buffer.from(`${sid}:${token}`).toString('base64')

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: body.toString(),
    })
    const data = await res.json()
    if (!res.ok) {
      console.error('Twilio error:', data)
      return { ok: false, error: data.message || 'Twilio send failed' }
    }
    return { ok: true, providerMessageId: data.sid }
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Network error'
    return { ok: false, error: msg }
  }
}

// ---------------------------------------------------------------------------
// Vonage (formerly Nexmo) — international
// Docs: https://developer.vonage.com/messaging/sms/code-snippets/send-sms
// Env vars: VONAGE_API_KEY, VONAGE_API_SECRET, VONAGE_FROM
// ---------------------------------------------------------------------------
async function sendViaVonage(to: string, text: string): Promise<SendSmsResult> {
  const apiKey = process.env.VONAGE_API_KEY
  const apiSecret = process.env.VONAGE_API_SECRET
  const from = process.env.VONAGE_FROM || 'Daraz'
  if (!apiKey || !apiSecret) {
    return { ok: false, error: 'Vonage env vars not configured (VONAGE_API_KEY, VONAGE_API_SECRET)' }
  }

  const toE164 = normalizeToE164(to)
  const url = 'https://rest.nexmo.com/sms/json'
  const body = new URLSearchParams({
    api_key: apiKey,
    api_secret: apiSecret,
    from,
    to: toE164,
    text,
  })

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: body.toString(),
    })
    const data = await res.json()
    if (!res.ok || data.messages?.[0]?.status !== '0') {
      console.error('Vonage error:', data)
      return { ok: false, error: data.messages?.[0]?.['error-text'] || 'Vonage send failed' }
    }
    return { ok: true, providerMessageId: data.messages?.[0]?.['message-id'] }
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Network error'
    return { ok: false, error: msg }
  }
}

// ---------------------------------------------------------------------------
// SSL COMPUZ (Bangladesh bulk SMS)
// Docs: https://www.sslcompuz.com / https://api.smsq.global  (verify endpoint with your account)
// Env vars: SSL_COMPUZ_API_KEY, SSL_COMPUZ_SID, SSL_COMPUZ_FROM
// ---------------------------------------------------------------------------
async function sendViaSslCompuz(to: string, text: string): Promise<SendSmsResult> {
  const apiKey = process.env.SSL_COMPUZ_API_KEY
  const sid = process.env.SSL_COMPUZ_SID
  const from = process.env.SSL_COMPUZ_FROM || 'DarazBD'
  if (!apiKey || !sid) {
    return { ok: false, error: 'SSL COMPUZ env vars not configured (SSL_COMPUZ_API_KEY, SSL_COMPUZ_SID)' }
  }

  // SSL COMPUZ accepts local 11-digit format (01XXXXXXXXX) or international without +
  const toNum = to.replace(/^\+/, '').replace(/[\s-]/g, '')
  // If number starts with 880 and is 13 digits, keep as is. If local 01XXXXXXXXX, prefix with 88.
  const finalTo = toNum.startsWith('880') ? toNum : (toNum.startsWith('0') ? '88' + toNum : toNum)

  // The exact endpoint URL & payload shape depends on the API tier you purchase
  // (Bulk SMS Pro, Mask SMS, etc.). Below is the most common pattern.
  // Always confirm with your SSL COMPUZ account manager.
  const url = 'https://api.smsq.global/api/v3/send-sms'
  const body = {
    api_key: apiKey,
    sid,
    msisdn: finalTo,
    sms: text,
    csms_id: 'daraz-' + Date.now(),
  }

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    const data = await res.json()
    if (!res.ok || data.status !== 'SUCCESS') {
      console.error('SSL COMPUZ error:', data)
      return { ok: false, error: data.message || 'SSL COMPUZ send failed' }
    }
    return { ok: true, providerMessageId: data.csms_id }
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Network error'
    return { ok: false, error: msg }
  }
}

// ---------------------------------------------------------------------------
// REVE SMS (Bangladesh)
// Docs: https://reve.com/sms-api  (confirm endpoint & payload with your account)
// Env vars: REVE_API_KEY, REVE_SENDER_ID
// ---------------------------------------------------------------------------
async function sendViaReve(to: string, text: string): Promise<SendSmsResult> {
  const apiKey = process.env.REVE_API_KEY
  const senderId = process.env.REVE_SENDER_ID || 'Daraz'
  if (!apiKey) {
    return { ok: false, error: 'REVE env vars not configured (REVE_API_KEY)' }
  }
  const toE164 = normalizeToE164(to)

  const url = 'https://api.revesms.com/api/v1/send' // verify with provider
  const body = {
    api_key: apiKey,
    sender: senderId,
    mobile: toE164.replace(/^\+/, ''),
    message: text,
  }

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    const data = await res.json()
    if (!res.ok || !data.success) {
      console.error('REVE error:', data)
      return { ok: false, error: data.message || 'REVE send failed' }
    }
    return { ok: true, providerMessageId: data.id }
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Network error'
    return { ok: false, error: msg }
  }
}

// ---------------------------------------------------------------------------
// Metech SMS (Bangladesh)
// Docs: https://metech.com.bd/sms-api  (confirm endpoint & payload with your account)
// Env vars: METECH_API_KEY, METECH_SENDER_ID
// ---------------------------------------------------------------------------
async function sendViaMetech(to: string, text: string): Promise<SendSmsResult> {
  const apiKey = process.env.METECH_API_KEY
  const senderId = process.env.METECH_SENDER_ID || 'Daraz'
  if (!apiKey) {
    return { ok: false, error: 'Metech env vars not configured (METECH_API_KEY)' }
  }
  const toNum = to.replace(/^\+/, '').replace(/[\s-]/g, '')
  const finalTo = toNum.startsWith('880') ? toNum : (toNum.startsWith('0') ? '88' + toNum : toNum)

  const url = 'https://api.metech.com.bd/api/v1/send' // verify with provider
  const body = {
    api_key: apiKey,
    sender_id: senderId,
    mobile: finalTo,
    message: text,
  }

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    const data = await res.json()
    if (!res.ok || !data.success) {
      console.error('Metech error:', data)
      return { ok: false, error: data.message || 'Metech send failed' }
    }
    return { ok: true, providerMessageId: data.id }
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Network error'
    return { ok: false, error: msg }
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Normalize a phone number to E.164 format (e.g., +8801712345678) for international providers.
 * - "+8801712345678" → "+8801712345678"
 * - "8801712345678"  → "+8801712345678"
 * - "01712345678"    → "+8801712345678" (BD local → international)
 * - "1712345678"     → "+8801712345678" (missing leading 0)
 */
export function normalizeToE164(phone: string): string {
  let p = phone.replace(/[\s\-()]/g, '')
  if (p.startsWith('+')) return p
  if (p.startsWith('880')) return '+' + p
  if (p.startsWith('0')) return '+88' + p           // 01712345678 → +8801712345678
  if (p.startsWith('1') && p.length === 10) return '+880' + p  // 1712345678 → +8801712345678
  return '+' + p
}
