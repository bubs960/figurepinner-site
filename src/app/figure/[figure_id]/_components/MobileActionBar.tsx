'use client'

// MobileActionBar.tsx — sticky bottom action bar, mobile figure pages only.
//
// Two targets only (per design review): median price (left) + eBay CTA (right).
// No Track/Own/Want — those live in CollectionPanel.
//
// REVENUE-CRITICAL: the eBay href is the `ebaySearchUrl` PROP, built once by the
// parent via buildEbaySearchUrl() with the EPN campid guard (FigureDetailContent).
// This component MUST NOT construct an eBay URL itself — a raw href would bypass
// the campid fallback and silently zero affiliate commissions (bceb185 lesson).
//
// Feature-flagged: renders only when NEXT_PUBLIC_MOBILE_ACTION_BAR === '1', so it
// can be killed instantly without a code change. Suppresses itself when the
// CollectionPanel eBay CTA is on screen, to avoid two sponsored links at once.

import { useEffect, useState } from 'react'
import TrackedLink from '@/app/components/TrackedLink'

interface Props {
  figureId: string
  ebaySearchUrl: string
  figureName: string
  /** Median sold price, already formatted (e.g. "$30"), or null when no comps. */
  priceLabel: string | null
  /** FPPS-01 (2026-07-15): which condition/stat priceLabel represents --
   *  "Sealed" | "Loose" | "Median sold" (pooled) | "Average sold" (pooled,
   *  no median in the snapshot). Never blank when priceLabel is set -- this
   *  bar shows one number, but it must always say honestly what it is. */
  priceSubLabel?: string | null
}

export default function MobileActionBar({ figureId, ebaySearchUrl, figureName, priceLabel, priceSubLabel }: Props) {
  // Feature flag — off by default until verified on a real phone.
  const enabled = process.env.NEXT_PUBLIC_MOBILE_ACTION_BAR === '1'

  // Hydration guard (2026-08-05 root-cause fix, see project_web_status_log.md).
  // `enabled` reads a NEXT_PUBLIC_* var, which Next.js inlines at CLIENT BUILD
  // TIME from .env.local — a different mechanism than wrangler.toml's [vars],
  // which only sets the RUNTIME value SSR sees. Those two drifted out of sync
  // (wrangler.toml="1", .env.local unset) since 2026-07-01: the server always
  // rendered this bar, the client's first hydration pass always expected
  // nothing, and every figure page threw React error #418 in production.
  // .env.local is now fixed to match, but this `mounted` gate is the durable
  // fix — it makes the SAME class of future drift (anyone adding a wrangler.toml
  // var without updating .env.local, for this flag or a new one copy-pasted
  // from it) degrade to a harmless post-hydration pop-in instead of a repeat
  // of this bug. Same idiom as AdSlot's `proState` gate and CfBeacon's
  // `shouldRender` gate elsewhere in this app.
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  // Suppress while the in-page eBay CTA (CollectionPanel) is visible, so the user
  // never sees two sponsored eBay links on one screen.
  const [hideForInlineCta, setHideForInlineCta] = useState(false)

  // Slide transition is JS-driven (inline style), so it needs its own
  // reduced-motion check — a CSS media query can't reach an inline style.
  const [reducedMotion, setReducedMotion] = useState(false)

  useEffect(() => {
    if (!enabled) return
    const inlineCta = document.querySelector('[data-ebay-inline-cta]')
    if (!inlineCta) return
    const obs = new IntersectionObserver(
      ([entry]) => setHideForInlineCta(entry.isIntersecting),
      { threshold: 0.1 }
    )
    obs.observe(inlineCta)
    return () => obs.disconnect()
  }, [enabled])

  useEffect(() => {
    if (!enabled) return
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    setReducedMotion(mq.matches)
    const onChange = () => setReducedMotion(mq.matches)
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [enabled])

  if (!mounted || !enabled) return null

  return (
    <div
      className="fp-mobile-action-bar"
      role="region"
      aria-label="Quick actions"
      data-hidden={hideForInlineCta ? '1' : undefined}
      style={{
        position: 'fixed',
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 200,
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem',
        padding: '0.625rem 1rem',
        paddingBottom: 'calc(0.625rem + env(safe-area-inset-bottom))',
        background: 'var(--fp-surface-0)',
        borderTop: '1px solid var(--fp-border)',
        boxShadow: '0 -4px 16px rgba(0,0,0,0.25)',
        transform: hideForInlineCta ? 'translateY(110%)' : 'translateY(0)',
        transition: reducedMotion ? 'none' : 'transform 0.2s ease',
      }}
    >
      {/* Left: price */}
      <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.15, flexShrink: 0 }}>
        {priceLabel ? (
          <>
            <span style={{
              fontFamily: 'var(--font-display)', fontSize: '1.35rem',
              color: 'var(--fp-success)', letterSpacing: '0.02em',
            }}>
              {priceLabel}
            </span>
            <span style={{ fontSize: '0.62rem', color: 'var(--fp-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              {priceSubLabel ?? 'Median sold'}
            </span>
          </>
        ) : (
          <span style={{ fontSize: '0.78rem', color: 'var(--fp-muted)' }}>No sold data yet</span>
        )}
      </div>

      {/* Right: eBay CTA — href is the parent-built, campid-guarded URL */}
      <TrackedLink
        href={ebaySearchUrl}
        target="_blank"
        rel="sponsored nofollow noopener noreferrer"
        aria-label={`Search eBay sold listings for ${figureName}`}
        funnelEvent="ebay_exit"
        funnelDetail={{ figureId, target: 'mobile_bar' }}
        style={{
          marginLeft: 'auto',
          flex: 1,
          maxWidth: '60%',
          textAlign: 'center',
          padding: '0.75rem 1rem',
          borderRadius: 'var(--fp-radius-sm)',
          background: 'var(--fp-ebay)',
          color: '#fff',
          fontSize: '0.9rem',
          fontWeight: 700,
          textDecoration: 'none',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}
      >
        See it on eBay
      </TrackedLink>
    </div>
  )
}
