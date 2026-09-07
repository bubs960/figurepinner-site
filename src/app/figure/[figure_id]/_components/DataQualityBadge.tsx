// DataQualityBadge.tsx — quiet one-line honesty strip on figure pages.
// Server component. Static styling; no client state.
//
// Reads the data-quality state derived from soldCount and renders a small
// state dot + plain-English reliability text in the shelf footnote style,
// with a gold hairline-underlined methodology link. Hidden affordance for
// the "60% coverage" problem: instead of opaque gating, every figure
// self-labels its data quality so users can decide for themselves whether
// to trust the median.

import type { CSSProperties } from 'react'
import type { DataQualityState } from '../_lib/figureFormatters'

interface Props {
  state: DataQualityState
  compCount: number
  /** When true, render a compact pill (e.g. for hero rows). When false,
   *  render the wider explainer card. Defaults to compact. */
  compact?: boolean
  /** WO-3 (webaudit Codex-triage, 2026-07-16; wording Steve's pick 2026-07-17):
   *  `compCount` here is always the POOLED total. When real sealed AND loose
   *  data both exist, per-condition chips elsewhere on the page (MarketPanel/
   *  HeroBand) show a much lower per-condition count ("THIN DATA · 8 SOLD"),
   *  which reads as contradicting this badge's "50 comps" a few inches away --
   *  same figure, two scopes. Naming the scope directly removes the apparent
   *  contradiction without changing the number itself. */
  mixedConditions?: boolean
}

const COPY: Record<DataQualityState, {
  label: string
  caveat: string
  dot: string
}> = {
  reliable: {
    label: 'Reliable Pricing',
    caveat: 'Median is meaningful — bid with confidence.',
    dot: '#00C870',
  },
  limited: {
    label: 'Limited Data',
    caveat: 'Few recent comps — treat the median as an estimate.',
    dot: '#FFB800',
  },
  sparse: {
    label: 'Sparse Data',
    caveat: 'Only 1–2 comps. Directional only — verify before bidding.',
    dot: '#FF5F00',
  },
  none: {
    label: 'No Sold Data Yet',
    caveat: 'No recent comps in our system. Search eBay sold listings directly.',
    dot: 'var(--shelf-cream-mut, rgba(242,232,213,.38))',
  },
}

// Footnote-style shared pieces (shelf design language: hairlines, airy
// uppercase micro-labels, gold reserved for the action link).
const dotStyle = (color: string): CSSProperties => ({
  width: 5,
  height: 5,
  borderRadius: '50%',
  background: color,
  flexShrink: 0,
})

const labelStyle: CSSProperties = {
  fontSize: '10px',
  fontWeight: 500,
  letterSpacing: '0.18em',
  textTransform: 'uppercase',
  color: 'var(--shelf-cream-dim, rgba(242,232,213,.60))',
}

const compsStyle: CSSProperties = {
  fontSize: '10px',
  fontWeight: 500,
  letterSpacing: '0.16em',
  textTransform: 'uppercase',
  color: 'var(--shelf-cream-mut, rgba(242,232,213,.38))',
  whiteSpace: 'nowrap',
}

const linkStyle: CSSProperties = {
  fontSize: '11.5px',
  fontWeight: 400,
  color: 'var(--shelf-gold-hi, #f5c462)',
  textDecoration: 'none',
  borderBottom: '1px solid var(--shelf-line-gold, rgba(224,168,62,.20))',
  paddingBottom: 1,
  whiteSpace: 'nowrap',
}

const hoverCss = `
  .fp-dq-link { transition: border-color .2s; }
  .fp-dq-link:hover { border-bottom-color: var(--shelf-gold-hi, #f5c462); }
  @media (prefers-reduced-motion: reduce) {
    .fp-dq-link { transition: none; }
  }
`

export default function DataQualityBadge({ state, compCount, compact = true, mixedConditions = false }: Props) {
  const c = COPY[state]
  const compLabel = (compCount === 1 ? '1 comp' : `${compCount} comps`) + (mixedConditions ? ' across conditions' : '')

  if (compact) {
    return (
      <div
        role="status"
        aria-label={`Data quality: ${c.label}, ${compLabel}`}
        title={c.caveat}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.6rem',
          fontFamily: 'var(--fp-font-body)',
          whiteSpace: 'nowrap',
        }}
      >
        <style>{hoverCss}</style>
        <span aria-hidden style={dotStyle(c.dot)} />
        <span style={labelStyle}>{c.label}</span>
        <span style={compsStyle}>· {compLabel}</span>
        <a href="/methodology" className="fp-dq-link" style={linkStyle}>
          How pricing works &rarr;
        </a>
      </div>
    )
  }

  // Expanded variant — used on EmptyState or when we want the explanation visible.
  return (
    <div
      role="status"
      aria-label={`Data quality: ${c.label}`}
      style={{ fontFamily: 'var(--fp-font-body)' }}
    >
      <style>{hoverCss}</style>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.6rem',
        flexWrap: 'wrap',
      }}>
        <span aria-hidden style={dotStyle(c.dot)} />
        <span style={labelStyle}>{c.label}</span>
        <span style={compsStyle}>· {compLabel}</span>
      </div>
      <div style={{
        marginTop: 6,
        fontSize: '0.8125rem',
        fontWeight: 300,
        lineHeight: 1.6,
        color: 'var(--shelf-cream-dim, rgba(242,232,213,.60))',
      }}>
        {c.caveat}{' '}
        <a href="/methodology" className="fp-dq-link" style={linkStyle}>
          How pricing works &rarr;
        </a>
      </div>
    </div>
  )
}
