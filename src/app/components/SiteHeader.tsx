'use client'

import { Fragment } from 'react'
import { SignedIn, SignedOut, UserButton } from '@clerk/nextjs'

// Unified site header — the single nav for every public page.
// Visuals extracted from the homepage nav (Steve-approved S20 redesign):
// 56px sticky bar, blur backdrop, FP mark + wordmark, standard link set,
// Log in / Sign up actions. Pages deeper than one level pass `crumbs`,
// which replaces the center link set with a breadcrumb trail.
//
// Plain <a> links for now — the site-wide next/link conversion is its own
// deploy (AdSense soft-nav test first); when that lands, this is the one
// place nav links change.

export type Crumb = { label: string; href?: string }

const NAV_LINKS = [
  { label: 'Search', href: '/search' },
  { label: "Today's Pick", href: '/today' },
  { label: 'Guides', href: '/guides' },
  // 'News' removed 2026-06-25 (Steve: "we don't have news"). The public /news
  // route is deleted; the auth-gated admin authoring tool is kept for revival.
  { label: 'Methodology', href: '/methodology' },
  { label: 'Wantlist', href: '/app/wantlist' },
]

const CSS = `
  .fp-sitenav {
    position: sticky;
    top: 0;
    z-index: 100;
    height: 56px;
    padding: 0 24px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    border-bottom: 1px solid rgba(255,255,255,0.08);
    background: rgba(9,9,15,0.9);
    backdrop-filter: blur(12px);
    font-family: var(--font-ui, var(--font-body, system-ui));
  }
  .fp-sitenav-brand {
    display: inline-flex;
    flex-direction: column;
    align-items: flex-start;
    justify-content: center;
    gap: 3px;
    flex-shrink: 0;
  }
  .fp-sitenav-parent {
    font-size: 0.625rem !important;
    font-weight: 700 !important;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    line-height: 1;
    color: var(--text) !important;
    opacity: 0.6;
    text-decoration: none;
    transition: opacity 0.15s ease;
  }
  .fp-sitenav-parent:hover { opacity: 1; }
  .fp-sitenav-home {
    display: inline-flex;
    align-items: center;
    gap: 10px;
    color: var(--text);
    text-decoration: none;
    font-weight: 800;
  }
  .fp-sitenav-mark {
    width: 32px;
    height: 32px;
    border-radius: 8px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    background: #e53238;
    color: #fff;
    font-family: var(--font-display);
    font-size: 1.1rem;
    line-height: 1;
  }
  .fp-sitenav-links,
  .fp-sitenav-actions {
    display: flex;
    align-items: center;
    gap: 18px;
  }
  .fp-sitenav-actions { flex-shrink: 0; }
  .fp-sitenav a {
    color: var(--text);
    text-decoration: none;
    font-size: 0.875rem;
    font-weight: 650;
  }
  .fp-sitenav-join {
    padding: 8px 14px;
    border-radius: 8px;
    background: #eeeef5;
    color: #09090f !important;
  }
  .fp-sitenav-crumbs {
    flex: 1;
    min-width: 0;
    display: flex;
    align-items: center;
    gap: 8px;
    overflow: hidden;
    white-space: nowrap;
  }
  .fp-sitenav-crumbs a {
    font-size: 0.8rem;
    font-weight: 500;
    color: var(--muted, #c9d0e0);
    flex-shrink: 0;
  }
  .fp-sitenav-sep {
    opacity: 0.4;
    flex-shrink: 0;
    color: var(--muted, #c9d0e0);
  }
  .fp-sitenav-cur {
    font-size: 0.8rem;
    color: var(--text);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  @media (max-width: 920px) {
    .fp-sitenav-links { display: none; }
  }
  @media (max-width: 560px) {
    .fp-sitenav { padding: 0 14px; }
    .fp-sitenav-word,
    .fp-sitenav-actions a:first-child { display: none; }
    .fp-sitenav-join { padding: 8px 10px; }
  }
`

export default function SiteHeader({ crumbs }: { crumbs?: Crumb[] }) {
  const hasCrumbs = Boolean(crumbs && crumbs.length > 0)

  return (
    <nav className="fp-sitenav" aria-label="Main">
      <style>{CSS}</style>

      <div className="fp-sitenav-brand">
        <a className="fp-sitenav-parent" href="https://grailpulse.com" aria-label="GrailPulse — the price-guide hub">
          GrailPulse ↗
        </a>
        <a className="fp-sitenav-home" href="/" aria-label="FigurePinner home">
          <span className="fp-sitenav-mark">FP</span>
          {!hasCrumbs && <span className="fp-sitenav-word">FigurePinner</span>}
        </a>
      </div>

      {hasCrumbs ? (
        <div className="fp-sitenav-crumbs">
          {crumbs!.map((c, i) => (
            <Fragment key={i}>
              <span className="fp-sitenav-sep">›</span>
              {c.href
                ? <a href={c.href}>{c.label}</a>
                : <span className="fp-sitenav-cur">{c.label}</span>}
            </Fragment>
          ))}
        </div>
      ) : (
        <div className="fp-sitenav-links">
          {NAV_LINKS.map(l => <a key={l.href} href={l.href}>{l.label}</a>)}
        </div>
      )}

      <div className="fp-sitenav-actions">
        {/* S70 (2026-07-07): was hardcoded, always showed Log in/Sign up
            regardless of session — root layout had no ClerkProvider so this
            couldn't reflect real auth state. Client-side check now, reads
            Clerk's session after hydration — no middleware coverage needed,
            public pages stay static/ISR'd (see root layout.tsx). */}
        <SignedOut>
          <a href="/sign-in">Log in</a>
          <a className="fp-sitenav-join" href="/sign-up">Sign up free</a>
        </SignedOut>
        <SignedIn>
          <a href="/app">My Collection</a>
          <UserButton afterSignOutUrl="/" />
        </SignedIn>
      </div>
    </nav>
  )
}
