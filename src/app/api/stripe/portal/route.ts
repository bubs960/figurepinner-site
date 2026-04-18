import { NextResponse } from 'next/server'
import { auth, clerkClient } from '@clerk/nextjs/server'

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
export async function POST() {
  const { userId } = await auth()
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!STRIPE_SECRET_KEY) {
    return NextResponse.json(
      { error: 'Stripe not configured' },
      { status: 503 }
    )
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
