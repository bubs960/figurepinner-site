'use client'

import { useEffect, useState } from 'react'
import Script from 'next/script'
import { hasClientClerkSession } from '@/app/_lib/clientAuth'
import { trackFunnel } from '@/app/_lib/funnelClient'

/**
 * SocialBarAd — Adsterra Social Bar unit (2-week trial, Steve-approved
 * 2026-07-19, STEVE-QUEUE action B). Figure pages only — mounts inside the
 * shared FigureDetailContent component, so both route trees
 * (/figure/[figure_id] and /[genre]/[line]/[slug]) get it automatically.
 *
 * Self-contained overlay widget — Adsterra renders its own UI, so unlike
 * AdSlot there's no reserved frame or manual "Advertisement" label here.
 * Pro-gating mirrors AdSlot's pattern exactly: ad-free for Pro users, fails
 * toward ad-free while the check is pending so a Pro user never sees a flash.
 */
export default function SocialBarAd() {
  const [proState, setProState] = useState<'loading' | 'pro' | 'free'>('loading')

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

  useEffect(() => {
    if (proState !== 'free') return
    trackFunnel('ad_impression', { target: 'social-bar' })
  }, [proState])

  if (proState === 'loading' || proState === 'pro') return null

  return (
    <Script
      id="adsterra-social-bar"
      strategy="lazyOnload"
      src="https://pl30442187.effectivecpmnetwork.com/a6/fb/df/a6fbdf29bd4ccd3d97ba7dc8f12cc4e1.js"
    />
  )
}
