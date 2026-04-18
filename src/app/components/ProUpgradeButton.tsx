'use client'

import { useState } from 'react'
import { useUser } from '@clerk/nextjs'

export default function ProUpgradeButton({ size = 'lg' }: { size?: 'lg' | 'sm' }) {
  const [loading, setLoading] = useState(false)
  const { isSignedIn } = useUser()

  async function handleUpgrade() {
    // If not signed in, go to sign-up first then redirect back to pro
    if (!isSignedIn) {
      window.location.href = '/sign-up?redirect_url=/pro'
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/stripe/checkout', { method: 'POST' })
      const data = await res.json() as { url?: string; error?: string }
      if (data.url) {
        window.location.href = data.url
      } else {
        // Stripe not configured yet — fall back to sign-up
        window.location.href = '/sign-up'
      }
    } catch {
      window.location.href = '/sign-up'
    } finally {
      setLoading(false)
    }
  }

  const pad = size === 'lg' ? '0.875rem 2.5rem' : '0.5rem 1.25rem'
  const fs = size === 'lg' ? '1.1rem' : '0.875rem'

  return (
    <button
      onClick={handleUpgrade}
      disabled={loading}
      style={{
        display: 'inline-block',
        background: loading ? 'var(--s2)' : 'var(--blue)',
        color: loading ? 'var(--muted)' : '#fff',
        padding: pad,
        borderRadius: '8px',
        fontSize: fs,
        fontWeight: '700',
        textDecoration: 'none',
        letterSpacing: '0.02em',
        border: 'none',
        cursor: loading ? 'not-allowed' : 'pointer',
        fontFamily: 'var(--font-body)',
        transition: 'background 0.15s',
      }}
    >
      {loading ? 'Redirecting…' : 'Start Free Trial — $6.99/mo'}
    </button>
  )
}
