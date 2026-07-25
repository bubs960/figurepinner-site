'use client'

import { Fragment, useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { SignedIn, SignedOut, UserButton } from '@clerk/nextjs'
import HeroSearch from './HeroSearch'

// Unified site header — the single nav for every public page.
// Visuals extracted from the homepage nav (Steve-approved S20 redesign):
// 56px sticky bar, blur backdrop, FP mark + wordmark, standard link set,
// Log in / Sign up actions. Pages deeper than one level pass `crumbs`,
// which replaces the center link set with a breadcrumb trail.
//
// Plain <a> links for now — the site-wide next/link conversion is its own
// deploy (AdSense soft-nav test first); when that lands, this is the one
// place nav links change.
//
// SEARCH ICON (2026-07-25, Steve-relayed finding): `NAV_LINKS` includes a
// "Search" link, but it only renders in the no-crumbs branch below — every
// crumbed page (every figure, line, genre, character, and guide page; i.e.
// every page on the site except the homepage) lost search entirely, not
// hidden behind anything, just structurally absent. The homepage's own
// HeroSearch takeover was never reachable from anywhere else. Fix: an
// always-visible icon button (works whether or not crumbs are shown) that
// opens the same HeroSearch component in a dedicated, explicitly-dismissible
// overlay — deliberately NOT reusing HeroSearch's own device-capability-
// gated takeover (see HeroSearch.tsx's isDesktopPointer() fix, same date):
// this is a user-triggered click on a real target, not an ambient focus
// trigger, so it needs no device detection, and it ships with a generously
// sized, clearly-labeled close button from day one rather than relying on
// tap-outside alone — the exact class of gap the original bug report found.

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

  /* ── Header search icon + overlay (2026-07-25) ── */
  .fp-sitenav-search-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 36px;
    height: 36px;
    flex-shrink: 0;
    background: none;
    border: none;
    border-radius: 8px;
    color: var(--text);
    cursor: pointer;
    transition: background 0.15s ease;
  }
  .fp-sitenav-search-btn:hover,
  .fp-sitenav-search-btn:focus-visible {
    background: rgba(255,255,255,0.08);
    outline: none;
  }
  .fp-header-search-backdrop {
    position: fixed;
    inset: 0;
    z-index: 300;
    background: rgba(5, 5, 8, 0.72);
    display: flex;
    align-items: flex-start;
    justify-content: center;
    padding: 88px 20px 20px;
    overflow-y: auto;
  }
  .fp-header-search-panel {
    position: relative;
    width: 100%;
    max-width: 640px;
    background: var(--s0, #12121a);
    border: 1px solid var(--border, rgba(255,255,255,0.12));
    border-radius: 14px;
    padding: 20px;
    box-shadow: 0 24px 64px rgba(0,0,0,0.5);
  }
  /* Generously sized and explicitly labeled on purpose — see the file-header
     comment on why this is not a repeat of the tap-outside-only pattern. */
  .fp-header-search-close {
    position: absolute;
    top: -14px;
    right: -14px;
    width: 40px;
    height: 40px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    background: var(--s1, #1c1c28);
    border: 1px solid var(--border, rgba(255,255,255,0.16));
    border-radius: 50%;
    color: var(--text);
    cursor: pointer;
    box-shadow: 0 6px 18px rgba(0,0,0,0.4);
  }
  .fp-header-search-close:hover,
  .fp-header-search-close:focus-visible {
    background: var(--s2, #24243333);
    outline: none;
  }
`

export default function SiteHeader({ crumbs }: { crumbs?: Crumb[] }) {
  const hasCrumbs = Boolean(crumbs && crumbs.length > 0)
  const [searchOpen, setSearchOpen] = useState(false)

  // Escape closes it — same convention as the homepage takeover's own
  // outside-click dismiss, plus a real keyboard path.
  useEffect(() => {
    if (!searchOpen) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setSearchOpen(false) }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [searchOpen])

  // Scroll lock while open, released unconditionally on close/unmount —
  // never left dangling regardless of how the overlay closes (Escape,
  // backdrop click, the close button, or navigating away).
  useEffect(() => {
    if (!searchOpen) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = prev }
  }, [searchOpen])

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
        <button
          type="button"
          className="fp-sitenav-search-btn"
          aria-label="Search figures"
          aria-haspopup="dialog"
          aria-expanded={searchOpen}
          onClick={() => setSearchOpen(true)}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="7" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
        </button>

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

      {searchOpen && typeof document !== 'undefined' && createPortal(
        <div
          className="fp-header-search-backdrop"
          role="dialog"
          aria-modal="true"
          aria-label="Search figures"
          onMouseDown={(e) => { if (e.target === e.currentTarget) setSearchOpen(false) }}
        >
          <div className="fp-header-search-panel">
            <button
              type="button"
              className="fp-header-search-close"
              aria-label="Close search"
              onClick={() => setSearchOpen(false)}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round">
                <line x1="6" y1="6" x2="18" y2="18" />
                <line x1="18" y1="6" x2="6" y2="18" />
              </svg>
            </button>
            <HeroSearch showButton buttonLabel="Search" disableTakeover />
          </div>
        </div>,
        document.body,
      )}
    </nav>
  )
}
