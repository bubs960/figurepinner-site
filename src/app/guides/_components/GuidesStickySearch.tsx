'use client'

// GuidesStickySearch — Phase 1 of the guides conversion redesign
// (design-explorations/guides-conversion-v1/README.md, webaudit-reviewed
// PASS 2026-08-15: WEBAUDIT-TO-WEB-GUIDES-CONVERSION-HANDOFF-REVIEWED-2026-08-15.md).
// One shared component, both the fandom-hub and plain-article guide templates —
// the persistent conversion path those pages currently lack entirely.
//
// Mobile only (91% of guides traffic per the handoff; desktop's equivalent is
// the header search chip, not part of this phase). Real navigable form
// (`action="/search" method="get"`), not a decorative lookalike box, per
// webaudit's build condition #1.
//
// Hides via IntersectionObserver whenever the bottom ad slot (#guides-ad-slot,
// stamped on both templates' ad wrapper) or the site footer is on screen, so it
// never overlaps or competes with the single ad unit — same hide-pattern
// MobileActionBar already uses on figure pages, applied here to guides.

import { useEffect, useState } from 'react'
import { trackFunnel } from '@/app/_lib/funnelClient'

export default function GuidesStickySearch() {
  const [mounted, setMounted] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [hidden, setHidden] = useState(false)
  const [reducedMotion, setReducedMotion] = useState(false)

  useEffect(() => {
    setMounted(true)
    setIsMobile(window.matchMedia('(max-width: 767px)').matches)
  }, [])

  useEffect(() => {
    const targets = [document.getElementById('guides-ad-slot'), document.querySelector('footer')]
      .filter((el): el is HTMLElement => el != null)
    if (!targets.length) return
    const visible = new Set<Element>()
    const obs = new IntersectionObserver(
      entries => {
        for (const entry of entries) {
          if (entry.isIntersecting) visible.add(entry.target)
          else visible.delete(entry.target)
        }
        setHidden(visible.size > 0)
      },
      { threshold: 0.01 },
    )
    for (const t of targets) obs.observe(t)
    return () => obs.disconnect()
  }, [])

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    setReducedMotion(mq.matches)
    const onChange = () => setReducedMotion(mq.matches)
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])

  // Body clearance so the last section (the ad) never sits under the fixed bar
  // — mobile only, same ~clearance idiom as MobileActionBar.
  useEffect(() => {
    if (!mounted || !isMobile) return
    const prev = document.body.style.paddingBottom
    document.body.style.paddingBottom = '76px'
    return () => {
      document.body.style.paddingBottom = prev
    }
  }, [mounted, isMobile])

  if (!mounted || !isMobile) return null

  return (
    <form
      action="/search"
      method="get"
      role="search"
      aria-label="Check a figure's value — free"
      data-hidden={hidden ? '1' : undefined}
      onSubmit={() => trackFunnel('search_submit', { target: 'sticky' })}
      style={{
        position: 'fixed',
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 200,
        margin: '0 auto',
        maxWidth: '480px',
        padding: '10px 12px calc(10px + env(safe-area-inset-bottom))',
        background: 'rgba(9,9,15,.92)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        borderTop: '1px solid rgba(242,232,213,.1)',
        transform: hidden ? 'translateY(110%)' : 'translateY(0)',
        transition: reducedMotion ? 'none' : 'transform 0.2s ease',
      }}
    >
      <label
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          background: 'linear-gradient(180deg,#f5c462,#dd9f2e)',
          borderRadius: '12px',
          padding: '13px 16px',
        }}
      >
        <span aria-hidden="true" style={{ fontSize: '16px', color: '#1a1408' }}>
          ⌕
        </span>
        <input
          type="search"
          name="q"
          placeholder="Check your figure's value — free"
          aria-label="Check your figure's value — free"
          style={{
            flex: 1,
            border: 'none',
            background: 'transparent',
            outline: 'none',
            fontSize: '14px',
            fontWeight: 700,
            color: '#1a1408',
          }}
        />
      </label>
    </form>
  )
}
