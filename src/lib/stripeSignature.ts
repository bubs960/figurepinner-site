import { timingSafeEqual } from './timingSafeEqual'

/**
 * Verifies a Stripe webhook signature with Web Crypto (no stripe npm package).
 * Stripe signs "{timestamp}.{body}" with HMAC-SHA256 using the endpoint's
 * signing secret. Header format: "t=1234567890,v1=abc...[,v1=def...]".
 *
 * The header can carry several v1= entries: one per active signing secret
 * while a rolled secret's old value is still valid. Stripe's rule is to accept
 * the event if ANY v1 matches. Pure (no Next/Clerk imports) so it's testable.
 */
export async function verifyStripeSignature(
  body: string,
  sig: string,
  secret: string,
  nowSeconds: number = Date.now() / 1000,
): Promise<boolean> {
  try {
    let timestamp: string | undefined
    const v1s: string[] = []
    for (const part of sig.split(',')) {
      const eq = part.indexOf('=')
      if (eq < 0) continue
      const k = part.slice(0, eq).trim()
      const v = part.slice(eq + 1).trim()
      if (k === 't') timestamp = v
      else if (k === 'v1') v1s.push(v)
    }
    if (!timestamp || v1s.length === 0) return false

    // Reject timestamps more than 5 minutes off (replay protection).
    const ts = parseInt(timestamp, 10)
    if (isNaN(ts) || Math.abs(nowSeconds - ts) > 300) return false

    const enc = new TextEncoder()
    const key = await crypto.subtle.importKey('raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
    const signatureBytes = await crypto.subtle.sign('HMAC', key, enc.encode(`${timestamp}.${body}`))
    const expected = Array.from(new Uint8Array(signatureBytes)).map(b => b.toString(16).padStart(2, '0')).join('')

    return v1s.some(v1 => timingSafeEqual(expected, v1))
  } catch {
    return false
  }
}
