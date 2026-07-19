'use client'

import { useEffect, useState } from 'react'
import Script from 'next/script'
import { hasClientClerkSession } from '@/app/_lib/clientAuth'
import { trackFunnel } from '@/app/_lib/funnelClient'

/**
 * AdSlot — Adsterra iframe banner unit (AD STANDARD v2, 2026-07-19).
 *
 * Usage:
 *   <AdSlot slot="adsterra-banner" /> // 468×60, live, no approval needed
 *
 * AdSense is not used on this site (format ruling: Adsterra iframe banners
 * only). If AdSense is ever revisited, it re-enters through the placement
 * standard doc, not a silent branch here.
 *
 * Pro = ad-free. This is a client component, so the host page stays cacheable:
 * the Pro check runs in the browser after hydration through /api/v1/me instead
 * of requiring Clerk context in the public page tree. For Pro users we render a
 * zero-height nothing — no ad, no reserved gap. We fail toward ad-free while
 * the check is pending so a Pro user never sees an ad flash before it's removed.
 */

type SlotConfig = {
  width: number
  height: number
  label: string
}

const SLOT_CONFIG: Record<string, SlotConfig> = {
  'adsterra-banner': { width: 468, height: 60, label: 'Adsterra Banner (468×60)' },
}

type Props = {
  slot: keyof typeof SLOT_CONFIG
  className?: string
}

export default function AdSlot({ slot, className }: Props) {
  const [proState, setProState] = useState<'loading' | 'pro' | 'free'>('loading')
  const config = SLOT_CONFIG[slot]

  useEffect(() => {
    let cancelled = false
    if (!hasClientClerkSession()) {
      setProState('free')
      return () => { cancelled = true }
    }
    fetch('/api/v1/me', { credentials: 'same-origin' })
      .then(async res => {
        if (cancelled) return
        if (!res.ok) {
          setProState('free')
          return
        }
        const data = await res.json() as { isPro?: boolean }
        setProState(data.isPro ? 'pro' : 'free')
      })
      .catch(() => {
        if (!cancelled) setProState('free')
      })
    return () => { cancelled = true }
  }, [])

  // Ad-side instrumentation (Bid Check affiliate-vs-ad measurement, 2026-07-05):
  // ebay_exit already tracks affiliate exits; nothing fired for ad exposure
  // until now. This fires once per real render of a live (non-placeholder)
  // ad unit — the same page-view denominator ('landing') lets both be
  // compared per-visit. Click-through can't be tracked here: Adsterra's
  // creative runs inside a cross-origin iframe this page doesn't control.
  useEffect(() => {
    if (proState !== 'free') return
    if (slot !== 'adsterra-banner') return
    trackFunnel('ad_impression', { target: slot })
  }, [proState, slot])

  if (!config) return null

  // Pro = ad-free. Hide for confirmed Pro users, AND while auth is still loading
  // (fail toward ad-free so a Pro user never sees a flash of an ad). Signed-out
  // and free users fall through to the normal ad/placeholder render.
  if (proState === 'loading' || proState === 'pro') return null

  // Adsterra Banner (468×60) — live, no approval needed.
  return (
    <div className={className} style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '0.5rem 0' }}>
      <span style={{
        fontSize: '9px', letterSpacing: '0.1em', textTransform: 'uppercase',
        color: 'var(--dim)', fontFamily: 'var(--font-ui)', marginBottom: '4px',
      }}>Advertisement</span>
      <Script
        id="adsterra-banner-config"
        strategy="lazyOnload"
        dangerouslySetInnerHTML={{
          __html: `atOptions = { 'key': 'ab2e03dd6cc847d4106fbfd169b86808', 'format': 'iframe', 'height': 60, 'width': 468, 'params': {} };`,
        }}
      />
      <Script
        id="adsterra-banner-invoke"
        strategy="lazyOnload"
        src="https://www.highperformanceformat.com/ab2e03dd6cc847d4106fbfd169b86808/invoke.js"
      />
    </div>
  )
}
