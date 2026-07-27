import { NextResponse } from 'next/server'
import { auth, clerkClient } from '@clerk/nextjs/server'
import { checkRateLimit } from '@/lib/rateLimit'

/**
 * Same tight limit as the checkout route, its own bucket so abuse of one
 * cannot lock a paying customer out of the other. See that route's comment for
 * why this is session-abuse protection rather than card-testing prevention.
 */
const STRIPE_ROUTE_RATE_LIMIT_PER_MINUTE = 5

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://figurepinner.com'

/**
 * POST /api/stripe/portal
 * Creates a Stripe Customer Portal session for managing subscriptions.
 * Redirects user to Stripe's hosted billing page where they can cancel,
 * update payment methods, view invoices, etc.
 *
 * Requires STRIPE_SECRET_KEY env var and stripeCustomerId stored in
 * Clerk publicMetadata (written by webhook on checkout.session.completed).
 */
// `req` added 2026-07-27 purely so the rate limiter can read cf-connecting-ip;
// the handler took no argument before. Next passes the Request either way.
export async function POST(req: Request) {
  // Pre-launch guard: portal makes no sense without active subscriptions.
  if (!STRIPE_SECRET_KEY) {
    return NextResponse.json(
      {
        error: 'stripe_not_configured',
        message: 'Pro tier launches soon. No active subscriptions to manage yet.',
      },
      { status: 503 },
    )
  }

  // Ahead of auth() for the same reason as the checkout route: auth() and the
  // clerkClient lookup below are network calls. Fails open by design.
  const rl = await checkRateLimit(req, 'stripe-portal', STRIPE_ROUTE_RATE_LIMIT_PER_MINUTE)
  if (rl.limited) {
    // no-store: an IP-keyed 429 must never be cached and replayed to another
    // visitor. Same reasoning as the checkout route.
    return NextResponse.json(
      { error: 'rate_limited' },
      { status: 429, headers: { 'Cache-Control': 'no-store', 'Retry-After': String(rl.retryAfter) } },
    )
  }

  const { userId } = await auth()
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Fetch stripeCustomerId from Clerk metadata
  const client = await clerkClient()
  const user = await client.users.getUser(userId)
  const stripeCustomerId = user.publicMetadata?.stripeCustomerId as string | undefined

  if (!stripeCustomerId) {
    return NextResponse.json(
      { error: 'No Stripe customer found — have you subscribed?' },
      { status: 404 }
    )
  }

  // Create a Stripe Customer Portal session
  const res = await fetch('https://api.stripe.com/v1/billing_portal/sessions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${STRIPE_SECRET_KEY}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      customer: stripeCustomerId,
      return_url: `${APP_URL}/app/settings`,
    }),
  })

  if (!res.ok) {
    const err = await res.text()
    console.error('Stripe portal error:', err)
    return NextResponse.json({ error: 'Failed to create portal session' }, { status: 500 })
  }

  const session = await res.json() as { url: string }
  return NextResponse.json({ url: session.url })
}
