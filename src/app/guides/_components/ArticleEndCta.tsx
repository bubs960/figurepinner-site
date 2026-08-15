// ArticleEndCta — Phase 2 of the guides conversion redesign (README §"Plain article":
// "End CTA upgraded from text link to a button-grade block + track hook"). Server
// component — funnel wiring lives in TrackedLink, no client boundary needed here.
//
// "track it free" routes to /sign-up (the same destination HeroCtaRail/
// MobileActionBar already use on figure pages) — a real destination, not a dead end,
// per webaudit's build condition #3. No figureId in context on a guide article, so
// this can't deep-link to a specific figure's track action the way those do.

import TrackedLink from '@/app/components/TrackedLink'

export default function ArticleEndCta() {
  return (
    <div
      style={{
        marginTop: '1rem',
        background: 'linear-gradient(160deg,#16131f,#0b0a12 65%)',
        border: '1px solid rgba(245,196,98,.35)',
        borderRadius: '14px',
        padding: '1.5rem',
        textAlign: 'center',
      }}
    >
      <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', letterSpacing: '0.02em', color: '#f2e8d5', marginBottom: '0.25rem' }}>
        PRICE LIKE A PRO — IN 10 SECONDS
      </div>
      <div style={{ fontSize: '0.85rem', color: 'rgba(242,232,213,.55)', marginBottom: '1rem' }}>
        Real sold comps, median, range, and sale count on every figure page. Free.
      </div>
      <TrackedLink
        href="/search"
        funnelEvent="search_submit"
        funnelDetail={{ target: 'end' }}
        style={{
          display: 'inline-block',
          background: 'linear-gradient(180deg,#f5c462,#dd9f2e)',
          color: '#1a1408',
          textDecoration: 'none',
          borderRadius: '10px',
          padding: '0.8rem 1.5rem',
          fontSize: '0.9rem',
          fontWeight: 700,
        }}
      >
        LOOK UP YOUR FIGURE →
      </TrackedLink>
      <div style={{ marginTop: '0.6rem', fontSize: '0.8rem', color: '#4ec98c' }}>
        or{' '}
        <TrackedLink
          href="/sign-up"
          funnelEvent="figure_track_cta_click"
          funnelDetail={{ target: 'guide_end_cta' }}
          style={{ color: '#4ec98c', textDecoration: 'underline' }}
        >
          track it free
        </TrackedLink>{' '}
        and we&apos;ll ping you when comps move
      </div>
    </div>
  )
}
