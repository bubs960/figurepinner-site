// HubTrackStrip — Phase 9 of the guides conversion redesign (README §"Both
// templates": "TRACK strip. The retention hook, currently absent from all
// guide surfaces. Green accent (distinct from gold = search), placed after
// the reader has seen prices move."). Server component — funnel wiring lives
// in TrackedLink, no client boundary needed here.
//
// Article template already got its track hook folded into ArticleEndCta
// (Phase 2). This is the hub template's dedicated strip, per the mockup
// (design-explorations/guides-conversion-v1/hub-mobile.dc.html).
//
// "START TRACKING" routes to /sign-up — same destination HeroCtaRail/
// MobileActionBar/ArticleEndCta already use. No figureId in context on a
// fandom hub, so this can't deep-link to a specific figure's track action
// the way the figure-page CTAs do.

import TrackedLink from '@/app/components/TrackedLink'

export default function HubTrackStrip() {
  return (
    <div
      style={{
        margin: '1.5rem 0 0',
        background: 'linear-gradient(160deg,#16131f,#0b0a12 65%)',
        border: '1px solid rgba(78,201,140,.3)',
        borderRadius: '14px',
        padding: '1rem',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
        <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#4ec98c' }} />
        <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.25rem', letterSpacing: '0.02em', color: '#f2e8d5' }}>
          TRACK A FIGURE — FREE
        </div>
      </div>
      <div style={{ fontSize: '0.75rem', color: 'rgba(242,232,213,.55)', lineHeight: 1.5, marginBottom: '0.75rem' }}>
        Pin any figure and we&apos;ll tell you when its sold comps move. No account fee, no spam.
      </div>
      <TrackedLink
        href="/sign-up"
        funnelEvent="figure_track_cta_click"
        funnelDetail={{ target: 'hub_track_strip' }}
        style={{
          display: 'inline-block',
          border: '1px solid #4ec98c',
          color: '#4ec98c',
          textDecoration: 'none',
          borderRadius: '10px',
          padding: '0.6rem 1.1rem',
          fontSize: '0.8rem',
          fontWeight: 700,
        }}
      >
        START TRACKING
      </TrackedLink>
    </div>
  )
}
