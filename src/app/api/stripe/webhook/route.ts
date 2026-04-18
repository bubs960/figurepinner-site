import { NextRequest, NextResponse } from 'next/server'
import { clerkClient } from '@clerk/nextjs/server'

const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET ?? ''

/**
 * POST /api/stripe/webhook
 * Handles Stripe webhook events to sync subscription status to Clerk publicMetadata.
 *
 * Required env vars (set in Cloudflare dashboard):
 *   STRIPE_WEBHOOK_SECRET  — from Stripe Dashboard > Webhooks > Signing Secret
 *
 * Events handled:
 *   checkout.session.completed     → set isPro: true
 *   customer.subscription.deleted  → set isPro: false
 *   invoice.payment_failed         → set isPro: false (after grace period)
 *
 * Stripe webhook setup:
 *   1. Go to Stripe Dashboard > Webhooks > Add endpoint
 *   2. URL: https://figurepinner.com/api/stripe/webhook
 *   3. Events: checkout.session.completed, customer.subscription.deleted, invoice.payment_failed
 */

/**
 * Verifies Stripe webhook signature using Web Crypto API (no stripe npm package needed).
 * Stripe signs with HMAC-SHA256 over "{timestamp}.{body}" using the webhook secret.
 * Signature header format: "t=1234567890,v1=abc123..."
 */
async function verifyStripeSignature(body: string, sig: string, secret: string): Promise<boolean> {
  try {
    // Parse timestamp and v1 signatures from header
    const parts = Object.fromEntries(sig.split(',').map(p => p.split('='))) as Record<string, string>
    const timestamp = parts['t']
    const v1 = parts['v1']
    if (!timestamp || !v1) return false

    // Reject timestamps older than 5 minutes (replay attack prevention)
    const ts = parseInt(timestamp, 10)
    if (isNaN(ts) || Math.abs(Date.now() / 1000 - ts) > 300) return false

    // Compute expected signature: HMAC-SHA256("{timestamp}.{body}", secret)
    const payload = `${timestamp}.${body}`
    const enc = new TextEncoder()
    const key = await crypto.subtle.importKey(
      'raw',
      enc.encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign'],
    )
    const signatureBytes = await crypto.subtle.sign('HMAC', key, enc.encode(payload))
    const expected = Array.from(new Uint8Array(signatureBytes))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('')

    // Constant-time comparison to prevent timing attacks
    if (expected.length !== v1.length) return false
    let diff = 0
    for (let i = 0; i < expected.length; i++) diff |= expected.charCodeAt(i) ^ v1.charCodeAt(i)
    return diff === 0
  } catch {
    return false
  }
}

export async function POST(req: NextRequest) {
  const body = await req.text()
  const sig = req.headers.get('stripe-signature') ?? ''

  if (!STRIPE_WEBHOOK_SECRET) {
    console.error('STRIPE_WEBHOOK_SECRET not set')
    return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 503 })
  }

  if (!sig) {
    return NextResponse.json({ error: 'Missing stripe-signature header' }, { status: 400 })
  }

  // Cryptographically verify the webhook signature before trusting any event data
  const valid = await verifyStripeSignature(body, sig, STRIPE_WEBHOOK_SECRET)
  if (!valid) {
    console.error('Stripe webhook signature verification failed')
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  let event: { type: string; data: { object: Record<string, unknown> } }
  try {
    event = JSON.parse(body)
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const obj = event.data.object as Record<string, unknown>

  switch (event.type) {
    case 'checkout.session.completed': {
      const userId = (obj.metadata as Record<string, string>)?.userId
      const customerId = obj.customer as string | null
      if (userId) {
        const client = await clerkClient()
        await client.users.updateUserMetadata(userId, {
          publicMetadata: {
            isPro: true,
            ...(customerId ? { stripeCustomerId: customerId } : {}),
          },
        })
      }
      break
    }

    case 'customer.subscription.deleted':
    case 'invoice.payment_failed': {
      // For subscription deletion/failure, look up userId from subscription metadata
      const userId = (obj.metadata as Record<string, string>)?.userId
      if (userId) {
        const client = await clerkClient()
        await client.users.updateUserMetadata(userId, {
          publicMetadata: { isPro: false },
        })
      }
      break
    }
  }

  return NextResponse.json({ received: true })
}
