'use client'

import { useEffect, useRef, useState } from 'react'
import Script from 'next/script'
import { hasClientClerkSession } from '@/app/_lib/clientAuth'
import { trackFunnel } from '@/app/_lib/funnelClient'

/**
 * AdSlot — Adsterra iframe banner unit (AD STANDARD v2, 2026-07-19).
 *
 * Usage:
 *   <AdSlot slot="adsterra-banner" /> // 300×250, live, no approval needed
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
 *
 * Frame reserves config.height immediately (assumes fill — matches the common
 * case with zero layout shift, since 'pending' and 'filled' render identically)
 * and collapses the WHOLE unit (frame + label) if no iframe appears within
 * FILL_TIMEOUT_MS (AD STANDARD v2 Phase 2's "reserve + collapse-when-unfilled"
 * requirement, merged with figurepinner's existing Pro-gate/funnel tracking,
 * which are both untouched below).
 */

const FILL_TIMEOUT_MS = 4000

type SlotConfig = {
  width: number
  height: number
  label: string
}

const SLOT_CONFIG: Record<string, SlotConfig> = {
  'adsterra-banner': { width: 300, height: 250, label: 'Adsterra Banner (300×250)' },
}

type Props = {
  slot: keyof typeof SLOT_CONFIG
  className?: string
}

export default function AdSlot({ slot, className }: Props) {
  const [proState, setProState] = useState<'loading' | 'pro' | 'free'>('loading')
  const [adState, setAdState] = useState<'pending' | 'filled' | 'unfilled'>('pending')
  const frameRef = useRef<HTMLDivElement>(null)
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

  // Reserve + collapse-when-unfilled (AD STANDARD v2 Phase 2): watch for the
  // iframe Adsterra injects into the frame. If it never shows up within
  // FILL_TIMEOUT_MS, stop reserving space instead of leaving a permanent gap.
  useEffect(() => {
    if (proState !== 'free') return
    const frame = frameRef.current
    if (!frame) return

    const checkForAd = () => {
      if (frame.querySelector('iframe')) setAdState('filled')
    }
    checkForAd()

    const observer = new MutationObserver(checkForAd)
    observer.observe(frame, { childList: true, subtree: true })
    const timeout = setTimeout(() => {
      setAdState(current => (current === 'pending' ? 'unfilled' : current))
    }, FILL_TIMEOUT_MS)

    return () => {
      observer.disconnect()
      clearTimeout(timeout)
    }
  }, [proState])

  if (!config) return null

  // Pro = ad-free. Hide for confirmed Pro users, AND while auth is still loading
  // (fail toward ad-free so a Pro user never sees a flash of an ad). Signed-out
  // and free users fall through to the normal ad/placeholder render.
  if (proState === 'loading' || proState === 'pro') return null

  // Genuinely unfilled after the grace period — collapse the whole unit
  // (label included), not just the frame, so nothing is left floating over
  // empty space.
  if (adState === 'unfilled') return null

  // Adsterra Banner (300×250) — live, no approval needed.
  return (
    <div className={className} style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '0.5rem 0' }}>
      <span style={{
        fontSize: '9px', letterSpacing: '0.1em', textTransform: 'uppercase',
        color: 'var(--dim)', fontFamily: 'var(--font-ui)', marginBottom: '4px',
      }}>Advertisement</span>
      <div
        ref={frameRef}
        style={{
          width: `min(${config.width}px, 100%)`,
          height: config.height,
          overflow: 'hidden',
          display: 'flex',
          justifyContent: 'center',
        }}
      >
        <Script
          id="adsterra-banner-config"
          strategy="lazyOnload"
          dangerouslySetInnerHTML={{
            __html: `atOptions = { 'key': '5758f0cf21092928ed5d04198e165847', 'format': 'iframe', 'height': ${config.height}, 'width': ${config.width}, 'params': {} };`,
          }}
        />
        <Script
          id="adsterra-banner-invoke"
          strategy="lazyOnload"
          src="https://www.highperformanceformat.com/5758f0cf21092928ed5d04198e165847/invoke.js"
        />
      </div>
    </div>
  )
}
