'use client'

import { useState } from 'react'
import { useUser } from '@clerk/nextjs'

interface Props {
  size?: 'lg' | 'sm'
  billing?: 'annual' | 'monthly'
}

// Feature flag — flip to 'true' in .env.production once Stripe secrets are
// set on the worker (STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, both price IDs)
// AND a real Stripe checkout session has been smoke-tested.
// While false, the button shows "Pro Launching Soon" and routes interested
// users to the homepage / waitlist form instead of triggering /api/stripe/checkout
// (which would 500 with no secrets).
const STRIPE_ENABLED = process.env.NEXT_PUBLIC_STRIPE_ENABLED === 'true'

export default function ProUpgradeButton({ size = 'lg', billing = 'annual' }: Props) {
  const [loading, setLoading] = useState(false)
  const { isSignedIn } = useUser()

  async function handleUpgrade() {
    // Pre-launch state: route to homepage waitlist instead of broken checkout
    if (!STRIPE_ENABLED) {
      window.location.href = '/?utm_source=pro_page&utm_content=upgrade_btn'
      return
    }

    if (!isSignedIn) {
      window.location.href = '/sign-up?redirect_url=/pro'
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ billing }),
      })
      const data = await res.json() as { url?: string; error?: string }
      if (data.url) {
        window.location.href = data.url
      } else {
        window.location.href = '/sign-up'
      }
    } catch {
      window.location.href = '/sign-up'
    } finally {
      setLoading(false)
    }
  }

  const liveLabel = billing === 'annual'
    ? 'Upgrade to Pro — $29.99/yr'
    : 'Upgrade to Pro — $3.99/mo'

  const label = STRIPE_ENABLED
    ? (loading ? 'Redirecting…' : liveLabel)
    : 'Join Pro Waitlist →'

  const pad = size === 'lg' ? '0.875rem 2.5rem' : '0.5rem 1.25rem'
  const fs = size === 'lg' ? '1.05rem' : '0.875rem'

  return (
    <button
      onClick={handleUpgrade}
      disabled={loading}
      title={STRIPE_ENABLED ? undefined : 'Pro launches soon — join the waitlist for early access'}
      style={{
        display: 'inline-block',
        background: loading ? 'var(--fp-surface-1, var(--s2))' : 'var(--fp-accent, var(--blue))',
        color: loading ? 'var(--fp-dim, var(--muted))' : '#fff',
        padding: pad,
        borderRadius: '8px',
        fontSize: fs,
        fontWeight: '700',
        textDecoration: 'none',
        letterSpacing: '0.02em',
        border: 'none',
        cursor: loading ? 'not-allowed' : 'pointer',
        fontFamily: 'var(--fp-font-body, var(--font-body))',
        transition: 'background 0.15s',
        width: size === 'lg' ? 'auto' : '100%',
      }}
    >
      {label}
    </button>
  )
}
