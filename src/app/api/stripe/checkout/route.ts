import { NextResponse } from 'next/server'
import { auth, clerkClient } from '@clerk/nextjs/server'

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY
const STRIPE_PRO_PRICE_ID = process.env.STRIPE_PRO_PRICE_ID ?? ''
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://figurepinner.com'

/**
 * POST /api/stripe/checkout
 * Creates a Stripe Checkout Session for the Pro plan.
 * Returns { url } — redirect the user to it.
 *
 * Required env vars (set in Cloudflare dashboard):
 *   STRIPE_SECRET_KEY     — from Stripe Dashboard > API Keys
 *   STRIPE_PRO_PRICE_ID   — from Stripe Dashboard > Products > Pro > Price ID
 *   NEXT_PUBLIC_APP_URL   — https://figurepinner.com
 */
export async function POST() {
  const { userId } = await auth()
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!STRIPE_SECRET_KEY) {
    return NextResponse.json(
      { error: 'Stripe not configured — add STRIPE_SECRET_KEY to environment' },
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
    'line_items[0][price]': STRIPE_PRO_PRICE_ID,
    'line_items[0][quantity]': '1',
    success_url: `${APP_URL}/app?upgraded=1`,
    cancel_url: `${APP_URL}/pro`,
    'subscription_data[metadata][userId]': userId,
    'metadata[userId]': userId,
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
