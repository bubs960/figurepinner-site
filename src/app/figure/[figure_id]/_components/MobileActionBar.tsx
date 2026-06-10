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

interface Props {
  ebaySearchUrl: string
  figureName: string
  /** Median sold price, already formatted (e.g. "$30"), or null when no comps. */
  priceLabel: string | null
}

export default function MobileActionBar({ ebaySearchUrl, figureName, priceLabel }: Props) {
  // Feature flag — off by default until verified on a real phone.
  const enabled = process.env.NEXT_PUBLIC_MOBILE_ACTION_BAR === '1'

  // Suppress while the in-page eBay CTA (CollectionPanel) is visible, so the user
  // never sees two sponsored eBay links on one screen.
  const [hideForInlineCta, setHideForInlineCta] = useState(false)

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

  if (!enabled) return null

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
        transition: 'transform 0.2s ease',
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
              Median sold
            </span>
          </>
        ) : (
          <span style={{ fontSize: '0.78rem', color: 'var(--fp-muted)' }}>No sold data yet</span>
        )}
      </div>

      {/* Right: eBay CTA — href is the parent-built, campid-guarded URL */}
      <a
        href={ebaySearchUrl}
        target="_blank"
        rel="sponsored nofollow noopener noreferrer"
        aria-label={`Search eBay sold listings for ${figureName}`}
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
      </a>
    </div>
  )
}
