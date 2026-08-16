'use client'

// ConversionBreak — Phase 4 of the guides conversion redesign
// (design-explorations/guides-conversion-v1/README.md: "Mid-page conversion breaks.
// A slim search moment after every 2-3 sections (hub) / after each rule section
// (article)... Fixes: reader can currently finish either page without ever being
// asked to convert."). One component, both templates, per the phased build order.

import { trackFunnel } from '@/app/_lib/funnelClient'

export default function ConversionBreak({ headline }: { headline: string }) {
  return (
    <form
      action="/search"
      method="get"
      role="search"
      aria-label={headline}
      onSubmit={() => trackFunnel('search_submit', { target: 'break' })}
      style={{
        margin: '1.5rem 0',
        background: 'linear-gradient(160deg,#16131f,#0b0a12 65%)',
        borderLeft: '3px solid #f5c462',
        borderRadius: '12px',
        padding: '0.875rem 1rem',
      }}
    >
      <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', color: '#f2e8d5', marginBottom: '0.5rem', letterSpacing: '0.01em' }}>
        {headline}
      </div>
      <div style={{ display: 'flex', gap: '0.5rem' }}>
        <input
          type="search"
          name="q"
          placeholder="Which figure?"
          aria-label="Which figure?"
          style={{
            flex: 1,
            background: '#09090F',
            border: '1px solid rgba(242,232,213,.15)',
            borderRadius: '9px',
            padding: '0.6rem 0.75rem',
            fontSize: '0.8rem',
            color: '#f2e8d5',
          }}
        />
        <button
          type="submit"
          style={{
            background: 'linear-gradient(180deg,#f5c462,#dd9f2e)',
            color: '#1a1408',
            border: 'none',
            borderRadius: '9px',
            padding: '0.6rem 1rem',
            fontSize: '0.8rem',
            fontWeight: 700,
            cursor: 'pointer',
          }}
        >
          GO
        </button>
      </div>
    </form>
  )
}
