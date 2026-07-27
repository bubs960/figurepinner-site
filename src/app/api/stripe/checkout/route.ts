import { NextRequest, NextResponse } from 'next/server'
import { auth, clerkClient } from '@clerk/nextjs/server'
import { checkRateLimit } from '@/lib/rateLimit'

/**
 * Deliberately tight: a real user clicks "upgrade" once, maybe retries twice.
 * Anything past 5 in a rolling minute from one IP is scripted.
 *
 * ⚠️ Scope, stated accurately because the shorthand for this work is misleading:
 * this is NOT card-testing prevention. No card data reaches this route — it
 * creates a Stripe *Checkout Session* and hands back a URL; the card is entered
 * on Stripe's own hosted page, where Stripe Radar and Stripe's own limits are
 * the actual card-testing control. What this guard buys is protection against
 * session-creation abuse: burning our Stripe API quota, filling the dashboard
 * with abandoned sessions, and hammering the Clerk lookup below. Worth having,
 * cheap to add, and not a substitute for Radar.
 */
const STRIPE_ROUTE_RATE_LIMIT_PER_MINUTE = 5

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY
const STRIPE_PRO_MONTHLY_PRICE_ID = process.env.STRIPE_PRO_MONTHLY_PRICE_ID ?? process.env.STRIPE_PRO_PRICE_ID ?? ''
const STRIPE_PRO_ANNUAL_PRICE_ID = process.env.STRIPE_PRO_ANNUAL_PRICE_ID ?? ''
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://figurepinner.com'

/**
 * POST /api/stripe/checkout
 * Creates a Stripe Checkout Session for the Pro plan.
 * Returns { url } — redirect the user to it.
 *
 * Body: { billing: 'annual' | 'monthly' }  (defaults to 'annual')
 *
 * Required env vars (set in Cloudflare dashboard):
 *   STRIPE_SECRET_KEY             — from Stripe Dashboard > API Keys
 *   STRIPE_PRO_MONTHLY_PRICE_ID   — $3.99/mo Stripe Price ID
 *   STRIPE_PRO_ANNUAL_PRICE_ID    — $29.99/yr Stripe Price ID
 *   NEXT_PUBLIC_APP_URL           — https://figurepinner.com
 *
 * Legacy: STRIPE_PRO_PRICE_ID fallback still supported for monthly.
 */
export async function POST(req: NextRequest) {
  // Pre-launch guard: if Stripe isn't wired yet (secret empty), don't crash —
  // return a clean 503 the client can render as "Pro coming soon".
  if (!STRIPE_SECRET_KEY) {
    return NextResponse.json(
      {
        error: 'stripe_not_configured',
        message: 'Pro tier launches soon. Join the waitlist at figurepinner.com to be notified.',
        waitlist_url: '/',
      },
      { status: 503 },
    )
  }

  // Ahead of auth() on purpose: auth() and the clerkClient lookup below are
  // both network calls, so the limiter is worth more in front of them than
  // behind them. The 503 guard stays first because it costs nothing.
  //
  // Note the limiter FAILS OPEN when the Cache API is unavailable or the IP
  // header is missing (see rateLimit.ts) — correct for a revenue path: a
  // broken limiter must never be what stops someone paying us.
  const rl = await checkRateLimit(req, 'stripe-checkout', STRIPE_ROUTE_RATE_LIMIT_PER_MINUTE)
  if (rl.limited) {
    // no-store is load-bearing, not boilerplate: the limiter keys on IP, so a
    // cacheable 429 could be replayed to a different visitor who is not rate
    // limited. Two other routes were caught attaching `public, max-age=300` to
    // their 429s (board, 2026-07-26) — do not repeat it here of all places.
    return NextResponse.json(
      { error: 'rate_limited' },
      { status: 429, headers: { 'Cache-Control': 'no-store', 'Retry-After': String(rl.retryAfter) } },
    )
  }

  const { userId } = await auth()
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // NOTE: a second `if (!STRIPE_SECRET_KEY)` block sat here and was DEAD —
  // unreachable behind the identical guard at the top of the handler. Removed
  // 2026-07-27 along with its twin in the portal route.

  let billing: 'annual' | 'monthly' = 'annual'
  try {
    const body = await req.json() as { billing?: string }
    if (body.billing === 'monthly') billing = 'monthly'
  } catch { /* default to annual */ }

  // Select price ID based on billing interval
  const priceId = billing === 'annual' ? STRIPE_PRO_ANNUAL_PRICE_ID : STRIPE_PRO_MONTHLY_PRICE_ID
  if (!priceId) {
    return NextResponse.json(
      { error: `No Stripe price configured for ${billing} billing. Add STRIPE_PRO_${billing.toUpperCase()}_PRICE_ID.` },
      { status: 503 }
    )
  }

  // Pre-fill customer email for better Stripe conversion
  let customerEmail: string | undefined
  try {
    const client = await clerkClient()
    const user = await client.users.getUser(userId)
    const primary = user.emailAddresses.find(e => e.id === user.primaryEmailAddressId)
    customerEmail = primary?.emailAddress
  } catch { /* non-blocking */ }

  const params: Record<string, string> = {
    'payment_method_types[]': 'card',
    mode: 'subscription',
    'line_items[0][price]': priceId,
    'line_items[0][quantity]': '1',
    success_url: `${APP_URL}/app?upgraded=1`,
    cancel_url: `${APP_URL}/pro`,
    'subscription_data[metadata][userId]': userId,
    'subscription_data[metadata][billing]': billing,
    'metadata[userId]': userId,
    'metadata[billing]': billing,
  }
  if (customerEmail) params['customer_email'] = customerEmail

  const res = await fetch('https://api.stripe.com/v1/checkout/sessions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${STRIPE_SECRET_KEY}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams(params),
  })

  if (!res.ok) {
    const err = await res.text()
    console.error('Stripe checkout error:', err)
    return NextResponse.json({ error: 'Failed to create checkout session' }, { status: 500 })
  }

  const session = await res.json() as { url: string }
  return NextResponse.json({ url: session.url })
}
