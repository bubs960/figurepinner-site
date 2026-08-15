'use client'

// HubAnswerCard — Phase 3 of the guides conversion redesign
// (design-explorations/guides-conversion-v1/README.md §"Fandom hub": "Answer-first
// hero... compressed so the ANSWER CARD ('What's your Elite worth? Free · real sold
// comps · 10 seconds') lands in viewport 1. The value prop is finally stated as a
// direct ask."). Replaces the plain inline search form the hero used to render.
//
// `headline` is optional (VoicePack.answerHeadline) — falls back to a fandom-neutral
// default so this ships across every hub today without requiring 10 themes' worth of
// new copy first; a future session can tune per-fandom headlines by just adding the
// field, no component change needed (same opt-in shape as Article.shortVersion in
// Phase 2). CTA copy is fixed, non-fandom-specific micro-copy (matches the mockup
// verbatim) rather than reusing VoicePack.ctaLabel, which already appears as the
// page-bottom CTA — distinct copy at each conversion moment reads better than the
// same line twice on one page.

import { trackFunnel } from '@/app/_lib/funnelClient'

export default function HubAnswerCard({
  headline,
  searchPlaceholder,
}: {
  headline?: string
  searchPlaceholder: string
}) {
  return (
    <form
      action="/search"
      method="get"
      role="search"
      aria-label={searchPlaceholder}
      onSubmit={() => trackFunnel('search_submit', { target: 'hero' })}
      style={{
        position: 'relative',
        background: 'linear-gradient(160deg,#16131f,#0b0a12 65%)',
        border: '1px solid rgba(245,196,98,.35)',
        borderRadius: '14px',
        padding: '16px',
        boxShadow: '0 8px 32px rgba(0,0,0,.4)',
        maxWidth: '420px',
      }}
    >
      <div style={{ fontFamily: 'var(--font-display)', fontSize: '22px', color: '#f5c462', letterSpacing: '.02em', marginBottom: '2px' }}>
        {headline ?? "WHAT'S YOUR FIGURE WORTH?"}
      </div>
      <div style={{ fontSize: '11.5px', color: 'rgba(242,232,213,.55)', marginBottom: '12px' }}>
        Free · real eBay sold comps · answer in 10 seconds
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <input
          type="search"
          name="q"
          placeholder={searchPlaceholder}
          aria-label={searchPlaceholder}
          style={{
            background: '#09090F',
            border: '1px solid rgba(242,232,213,.15)',
            borderRadius: '10px',
            padding: '12px 14px',
            fontSize: '14px',
            color: '#f2e8d5',
          }}
        />
        <button
          type="submit"
          style={{
            background: 'linear-gradient(180deg,#f5c462,#dd9f2e)',
            color: '#1a1408',
            border: 'none',
            borderRadius: '10px',
            padding: '13px',
            fontSize: '14px',
            fontWeight: 700,
            letterSpacing: '.03em',
            cursor: 'pointer',
          }}
        >
          CHECK THE COMP — FREE
        </button>
      </div>
    </form>
  )
}
