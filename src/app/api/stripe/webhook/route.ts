import { NextRequest, NextResponse } from 'next/server'
import { clerkClient } from '@clerk/nextjs/server'
import { invalidateProCache } from '@/lib/proStatus'
import { verifyStripeSignature } from '@/lib/stripeSignature'

const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET ?? ''
const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY ?? ''

/**
 * Resolve the Clerk userId for an `invoice.payment_failed` event.
 *
 * The Invoice object does NOT carry our `metadata.userId` (we only stamp it on
 * the Checkout Session and the Subscription at checkout — see checkout/route.ts).
 * So we read the invoice's `subscription` id and fetch that Subscription from
 * Stripe, which DOES carry `metadata.userId`. This is the same source of truth
 * `customer.subscription.deleted` already relies on.
 *
 * Returns null (caller no-ops) if the secret/subscription/metadata is missing,
 * rather than guessing — a missed downgrade self-heals on the next failed
 * invoice or on subscription.deleted; a wrong downgrade would strip a paying
 * user's Pro.
 */
async function resolveUserIdFromInvoice(invoice: Record<string, unknown>): Promise<string | null> {
  // Older Stripe API versions: top-level `invoice.subscription`.
  // Newer (2024+): `invoice.parent.subscription_details.subscription`.
  const parent = invoice.parent as { subscription_details?: { subscription?: string } } | undefined
  const subscriptionId =
    (invoice.subscription as string | null | undefined) ??
    parent?.subscription_details?.subscription ??
    null
  if (!subscriptionId || !STRIPE_SECRET_KEY) return null
  try {
    const res = await fetch(`https://api.stripe.com/v1/subscriptions/${subscriptionId}`, {
      headers: { Authorization: `Bearer ${STRIPE_SECRET_KEY}` },
      signal: AbortSignal.timeout(10000),
    })
    if (!res.ok) {
      console.error('payment_failed: failed to fetch subscription', subscriptionId, res.status)
      return null
    }
    const sub = (await res.json()) as { metadata?: Record<string, string> }
    return sub.metadata?.userId ?? null
  } catch (e) {
    console.error('payment_failed: subscription lookup error', String(e))
    return null
  }
}

/** Set Clerk isPro and flush the KV cache so the change is live immediately. */
async function setProStatus(userId: string, isPro: boolean, extra?: Record<string, unknown>): Promise<void> {
  const client = await clerkClient()
  await client.users.updateUserMetadata(userId, {
    publicMetadata: { isPro, ...(extra ?? {}) },
  })
  // Without this, isUserPro() can serve a stale cached value for up to 5 min —
  // a just-paid user hits the free wall, or a failed-payment user keeps Pro.
  await invalidateProCache(userId)
}

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

export async function POST(req: NextRequest) {
  // Pre-launch guard: the webhook only matters when Stripe is sending events.
  if (!STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json(
      { error: 'webhook_not_configured' },
      { status: 503 },
    )
  }

  const body = await req.text()
  const sig = req.headers.get('stripe-signature') ?? ''

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
        await setProStatus(userId, true, customerId ? { stripeCustomerId: customerId } : undefined)
      }
      break
    }

    case 'customer.subscription.deleted': {
      // The Subscription object carries our stamped metadata.userId directly.
      const userId = (obj.metadata as Record<string, string>)?.userId
      if (userId) {
        await setProStatus(userId, false)
      }
      break
    }

    case 'invoice.payment_failed': {
      // The Invoice object does NOT carry metadata.userId — resolve it via the
      // subscription (see helper). Reading obj.metadata.userId here was always
      // undefined, so this downgrade silently no-op'd and failed-payment users
      // kept Pro forever (Genta audit 2026-06-06 P1).
      const userId = await resolveUserIdFromInvoice(obj)
      if (userId) {
        await setProStatus(userId, false)
      }
      break
    }
  }

  return NextResponse.json({ received: true })
}
